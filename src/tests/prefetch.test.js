import { describe, it, expect } from 'vitest';
import {
  slugify,
  parseSlugFromUrl,
  collectTargetsFromIndex,
  balancedSelect,
  fetchPathWithFallbacks,
  runPrefetch,
  PrefetchError,
  EMPTY_STUB,
} from '../../scripts/prefetch-edhrec.js';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ---- helpers ----

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}
function statusResponse(status) {
  return { ok: false, status, json: async () => ({}), text: async () => '' };
}
function withFetch(handler, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => handler(url);
  return Promise.resolve(fn()).finally(() => { globalThis.fetch = original; });
}
async function withTmpDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'prefetch-test-'));
  try { await fn(dir); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
async function expectPrefetchError(fn) {
  let caught;
  try { await fn(); } catch (e) { caught = e; }
  if (!caught) throw new Error('Expected PrefetchError to be thrown but nothing was thrown');
  if (caught.name !== 'PrefetchError') {
    throw new Error(`Expected PrefetchError but got ${caught.name}: ${caught.message}`);
  }
}
function makeIndexData(cardviews = []) {
  return { container: { json_dict: { card_lists: [{ cardviews }] } } };
}

// ---- slugify ----

describe('slugify', () => {
  it('lowercases and replaces non-alphanumeric chars with hyphens', () => {
    expect(slugify('Equipment')).toBe('equipment');
    expect(slugify('+1/+1 Counters')).toBe('1-1-counters');
    expect(slugify('Hexproof from')).toBe('hexproof-from');
  });
});

// ---- parseSlugFromUrl ----

describe('parseSlugFromUrl', () => {
  it('extracts category and slug from /themes/, /tribes/, /typal/ URLs', () => {
    expect(parseSlugFromUrl('/themes/equipment')).toEqual({ category: 'themes', slug: 'equipment' });
    expect(parseSlugFromUrl('/tribes/myr')).toEqual({ category: 'tribes', slug: 'myr' });
    expect(parseSlugFromUrl('/typal/elf')).toEqual({ category: 'typal', slug: 'elf' });
  });

  it('returns null for empty or unrecognised URLs', () => {
    expect(parseSlugFromUrl('')).toBe(null);
    expect(parseSlugFromUrl('/some/other')).toBe(null);
    expect(parseSlugFromUrl('https://example.com/page')).toBe(null);
  });
});

// ---- collectTargetsFromIndex ----

describe('collectTargetsFromIndex', () => {
  it('parses slug/category from URL before falling back to display name', () => {
    const data = makeIndexData([{ name: 'Equipment Strategy', url: '/themes/equipment' }]);
    const targets = collectTargetsFromIndex(data, 'themes');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toEqual({ category: 'themes', slug: 'equipment' });
  });

  it('falls back to slugified display name when URL is absent', () => {
    const data = makeIndexData([{ name: 'Equipment Matters' }]);
    const targets = collectTargetsFromIndex(data, 'themes');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toEqual({ category: 'themes', slug: 'equipment-matters' });
  });

  it('uses only the display-name fallback when URL has no parseable slug', () => {
    const data = makeIndexData([{ name: 'Myr', url: '/not/parseable' }]);
    const targets = collectTargetsFromIndex(data, 'themes');
    expect(targets[0].slug).toBe('myr');
    expect(targets[0].category).toBe('themes');
  });

  it('handles multiple card_lists with mixed URL and name items', () => {
    const data = {
      container: {
        json_dict: {
          card_lists: [
            { cardviews: [{ url: '/themes/equipment' }] },
            { cardviews: [{ name: 'Aristocrats' }] },
          ],
        },
      },
    };
    const targets = collectTargetsFromIndex(data, 'themes');
    expect(targets).toHaveLength(2);
    expect(targets[0]).toEqual({ category: 'themes', slug: 'equipment' });
    expect(targets[1]).toEqual({ category: 'themes', slug: 'aristocrats' });
  });
});

// ---- balancedSelect ----

describe('balancedSelect', () => {
  it('interleaves items across categories so no single category fills the quota', () => {
    const items = [
      ...Array(5).fill(null).map((_, i) => ({ category: 'themes', slug: `theme${i}` })),
      ...Array(5).fill(null).map((_, i) => ({ category: 'tribes', slug: `tribe${i}` })),
      ...Array(5).fill(null).map((_, i) => ({ category: 'typal',  slug: `typal${i}` })),
    ];
    const result = balancedSelect(items, 6);
    expect(result).toHaveLength(6);
    const cats = result.map((r) => r.category);
    const themesCount = cats.filter((c) => c === 'themes').length;
    const tribesCount = cats.filter((c) => c === 'tribes').length;
    const typalCount  = cats.filter((c) => c === 'typal').length;
    expect(themesCount).toBe(2);
    expect(tribesCount).toBe(2);
    expect(typalCount).toBe(2);
  });

  it('does not let a dominant category fill the entire quota', () => {
    const items = [
      ...Array(10).fill(null).map((_, i) => ({ category: 'themes', slug: `t${i}` })),
      { category: 'tribes', slug: 'myr' },
    ];
    const result = balancedSelect(items, 4);
    const tribesCount = result.filter((r) => r.category === 'tribes').length;
    expect(tribesCount).toBe(1);
  });

  it('returns fewer items when all categories are exhausted before n', () => {
    const items = [
      { category: 'themes', slug: 'a' },
      { category: 'tribes', slug: 'b' },
    ];
    const result = balancedSelect(items, 100);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when n=0', () => {
    expect(balancedSelect([{ category: 'themes', slug: 'a' }], 0)).toHaveLength(0);
  });
});

// ---- fetchPathWithFallbacks ----

describe('fetchPathWithFallbacks', () => {
  it('uses stale local file first when allowStale=true and file exists', async () => {
    await withTmpDir(async (tmpDir) => {
      await mkdir(join(tmpDir, 'pages'), { recursive: true });
      const staleData = { container: { json_dict: { card_lists: [] } }, _stale: true };
      await writeFile(join(tmpDir, 'pages/themes.json'), JSON.stringify(staleData));

      const calls = [];
      await withFetch((url) => { calls.push(url); return statusResponse(404); }, async () => {
        const { data, source } = await fetchPathWithFallbacks(
          '/pages/themes.json',
          { allowStale: true, outDir: tmpDir },
        );
        expect(source).toBe('local-stale');
        expect(data._stale).toBe(true);
        expect(calls).toHaveLength(0);
      });
    });
  });

  it('skips stale source when allowStale=false, falls through to direct', async () => {
    await withTmpDir(async (tmpDir) => {
      await mkdir(join(tmpDir, 'pages'), { recursive: true });
      await writeFile(join(tmpDir, 'pages/themes.json'), JSON.stringify({ _stale: true }));

      await withFetch((url) => {
        if (url === 'https://json.edhrec.com/pages/themes.json') return jsonResponse({ _fresh: true });
        return statusResponse(404);
      }, async () => {
        const { source } = await fetchPathWithFallbacks(
          '/pages/themes.json',
          { allowStale: false, outDir: tmpDir },
        );
        expect(source).toBe('direct-edhrec-json');
      });
    });
  });

  it('falls back to direct EDHREC after GitHub mirror 404', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch((url) => {
        if (url === 'https://json.edhrec.com/pages/themes.json') return jsonResponse({ ok: true });
        return statusResponse(404);
      }, async () => {
        const { source } = await fetchPathWithFallbacks('/pages/themes.json', { outDir: tmpDir });
        expect(source).toBe('direct-edhrec-json');
      });
    });
  });

  it('throws when all sources fail', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch(() => statusResponse(403), async () => {
        let threw = false;
        try { await fetchPathWithFallbacks('/pages/themes.json', { outDir: tmpDir }); }
        catch (e) { threw = true; }
        expect(threw).toBe(true);
      });
    });
  });
});

// ---- runPrefetch ----

describe('runPrefetch', () => {
  it('writes optional stubs (EMPTY_STUB) for optional index pages that fail', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch((url) => {
        if (url === 'https://json.edhrec.com/pages/themes.json') {
          return jsonResponse(makeIndexData([{ url: '/themes/equipment' }]));
        }
        if (url === 'https://json.edhrec.com/pages/tribes.json') {
          return jsonResponse(makeIndexData([{ url: '/tribes/myr' }]));
        }
        return statusResponse(404);
      }, async () => {
        const manifest = await runPrefetch({ topN: 0, outDir: tmpDir, _requestGapMs: 0 });

        expect(manifest.indexPagesFetched).toBe(2);
        expect(manifest.indexPagesStubbed).toBe(2);
        expect(existsSync(join(tmpDir, 'pages/typal.json'))).toBe(true);
        expect(existsSync(join(tmpDir, 'pages/keywords.json'))).toBe(true);

        const stub = JSON.parse(readFileSync(join(tmpDir, 'pages/typal.json'), 'utf8'));
        expect(stub).toEqual(EMPTY_STUB);
      });
    });
  });

  it('fails hard (PrefetchError) when required index pages cannot be fetched', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch(() => statusResponse(403), async () => {
        await expectPrefetchError(() => runPrefetch({ outDir: tmpDir, _requestGapMs: 0 }));
      });
    });
  });

  it('succeeds with stale files when allowStale=true (even when network returns 403)', async () => {
    await withTmpDir(async (tmpDir) => {
      await mkdir(join(tmpDir, 'pages'), { recursive: true });
      await writeFile(
        join(tmpDir, 'pages/themes.json'),
        JSON.stringify(makeIndexData([{ url: '/themes/equipment' }])),
      );
      await writeFile(
        join(tmpDir, 'pages/tribes.json'),
        JSON.stringify(makeIndexData([{ url: '/tribes/myr' }])),
      );

      await withFetch(() => statusResponse(403), async () => {
        const manifest = await runPrefetch({ allowStale: true, topN: 0, outDir: tmpDir, _requestGapMs: 0 });
        expect(manifest.indexPagesFetched).toBe(2);
      });
    });
  });

  it('deduplicates targets by category/slug across index pages', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch((url) => {
        if (url === 'https://json.edhrec.com/pages/themes.json') {
          return jsonResponse(makeIndexData([
            { url: '/themes/equipment' },
            { url: '/themes/equipment' }, // duplicate
          ]));
        }
        if (url === 'https://json.edhrec.com/pages/tribes.json') {
          return jsonResponse(makeIndexData([{ url: '/tribes/myr' }]));
        }
        return statusResponse(404);
      }, async () => {
        const manifest = await runPrefetch({ topN: 0, outDir: tmpDir, _requestGapMs: 0 });
        // equipment deduped to 1 + myr = 2 total
        expect(manifest.totalDiscoveredSlugs).toBe(2);
      });
    });
  });

  it('does not throw in soft mode even when required index pages fail', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch(() => statusResponse(403), async () => {
        const result = await runPrefetch({ soft: true, outDir: tmpDir, _requestGapMs: 0 });
        expect(result.errored).toBe(true);
      });
    });
  });

  it('writes manifest.json with all required fields after successful fetch', async () => {
    await withTmpDir(async (tmpDir) => {
      await withFetch((url) => {
        if (url === 'https://json.edhrec.com/pages/themes.json') {
          return jsonResponse(makeIndexData([{ url: '/themes/equipment' }]));
        }
        if (url === 'https://json.edhrec.com/pages/tribes.json') {
          return jsonResponse(makeIndexData([]));
        }
        return statusResponse(404);
      }, async () => {
        const manifest = await runPrefetch({ topN: 0, outDir: tmpDir, _requestGapMs: 0 });

        expect(typeof manifest.generatedAt).toBe('string');
        expect(typeof manifest.topN).toBe('number');
        expect(typeof manifest.indexPagesFetched).toBe('number');
        expect(typeof manifest.indexPagesStubbed).toBe('number');
        expect(typeof manifest.themePagesFetched).toBe('number');
        expect(Array.isArray(manifest.failedPages)).toBe(true);
        expect(typeof manifest.totalDiscoveredSlugs).toBe('number');
        expect(typeof manifest.sourceCounts).toBe('object');
        expect(Array.isArray(manifest.errorsPreview)).toBe(true);

        const written = JSON.parse(readFileSync(join(tmpDir, 'manifest.json'), 'utf8'));
        expect(typeof written.generatedAt).toBe('string');
      });
    });
  });
});
