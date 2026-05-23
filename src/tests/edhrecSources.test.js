import { describe, expect, it } from 'vitest';
import { SOURCES, tryAllSources, _resetSourcesCache } from '../lib/edhrecSources.js';
import { _resetEdhrecCache, getSynergyCardsForTag } from '../lib/edhrecClient.js';

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}
function statusResponse(status) {
  return { ok: false, status, json: async () => ({}), text: async () => '' };
}
function isProxyUrl(url) {
  return /corsproxy\.io|allorigins\.win|codetabs\.com/.test(url);
}
function withFetch(handler, fn) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(url); return handler(url); };
  return Promise.resolve(fn(calls)).finally(() => { globalThis.fetch = original; });
}
function resetCaches() {
  _resetSourcesCache();
  _resetEdhrecCache();
}
async function expectRejection(promise, predicate) {
  let caught;
  try { await promise; }
  catch (e) { caught = e; }
  if (!caught) throw new Error('Expected promise to reject, but it resolved');
  if (!predicate(caught)) throw new Error(`Rejection did not match predicate: ${caught.name}/${caught.message}`);
}

describe('EDHREC source orchestrator', () => {
  it('exposes all 6 source strategies in priority order', () => {
    resetCaches();
    // cors-proxy is before edhrec-next-data and edhrec-s3 because _next/data buildId
    // discovery is fragile and S3 endpoints are speculative; CORS proxies are more reliable.
    expect(SOURCES.map((s) => s.id)).toEqual([
      'bundled-static',
      'gh-mirror-raw',
      'direct-edhrec-json',
      'cors-proxy',
      'edhrec-next-data',
      'edhrec-s3',
    ]);
  });

  // ---- A. bundled-static success ----

  it('stops at bundled-static when it serves valid JSON', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('/data/edhrec/pages/themes.json')) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('bundled-static');
      expect(calls.some((u) => u.includes('json.edhrec.com'))).toBe(false);
      expect(calls.some((u) => u.includes('raw.githubusercontent.com'))).toBe(false);
    });
  });

  // ---- B. bundled-static missing + gh-mirror success ----

  it('falls back to gh-mirror-raw when bundled-static returns 404', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('raw.githubusercontent.com') && url.includes('/pages/themes.json')) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('gh-mirror-raw');
      expect(calls.some((u) => u.includes('/data/edhrec/pages/themes.json'))).toBe(true);
      expect(calls.some((u) => u.includes('raw.githubusercontent.com'))).toBe(true);
    });
  });

  // ---- C. both mirror sources missing → warning logged before direct/proxy sources ----

  it('warns when both mirror sources are missing before falling through to direct sources', async () => {
    resetCaches();
    const logs = [];
    const logger = { line: (msg) => logs.push(msg) };
    await withFetch((url) => {
      if (url === 'https://json.edhrec.com/pages/themes.json') {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async () => {
      const { sourceId } = await tryAllSources('/pages/themes.json', { logger });
      expect(sourceId).toBe('direct-edhrec-json');
      // Warning must appear before the direct-source success log
      const warnIdx = logs.findIndex((l) => /refresh-edhrec-mirror|prefetch-edhrec/.test(l));
      const successIdx = logs.findIndex((l) => l.includes('direct-edhrec-json') && l.includes('success'));
      expect(warnIdx).toBeGreaterThanOrEqual(0);
      expect(warnIdx).toBeLessThan(successIdx);
    });
  });

  it('cascades from bundled-static to direct json.edhrec.com on 404', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url === 'https://json.edhrec.com/pages/themes.json') {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('direct-edhrec-json');
      expect(calls.some((u) => u.includes('/data/edhrec/pages/themes.json'))).toBe(true);
      expect(calls.some((u) => u === 'https://json.edhrec.com/pages/themes.json')).toBe(true);
    });
  });

  it('cascades past 403 from direct to cors-proxy and succeeds', async () => {
    resetCaches();
    await withFetch((url) => {
      if (isProxyUrl(url)) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(403);
    }, async () => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('cors-proxy');
    });
  });

  // ---- D. all sources fail → AllSourcesFailedError with full attempts ----

  it('throws AllSourcesFailedError with attempts for every source when all fail', async () => {
    resetCaches();
    await withFetch(() => statusResponse(503), async () => {
      await expectRejection(
        tryAllSources('/pages/themes.json'),
        (e) =>
          e.name === 'AllSourcesFailedError' &&
          Array.isArray(e.attempts) &&
          e.attempts.length === SOURCES.length &&
          e.attempts.every((a) => typeof a.sourceId === 'string' && typeof a.status === 'number'),
      );
    });
  });

  it('throws AllSourcesFailedError with status=403 when every source returns 403', async () => {
    resetCaches();
    await withFetch(() => statusResponse(403), async () => {
      await expectRejection(
        tryAllSources('/pages/themes.json'),
        (e) => e.name === 'AllSourcesFailedError' && e.status === 403,
      );
    });
  });
});

describe('edhrecClient delegates to the source orchestrator', () => {
  it('translates all-source 403 failure into EdhrecError(403) for the cardSelection fallback branch', async () => {
    resetCaches();
    await withFetch(() => statusResponse(403), async () => {
      await expectRejection(
        getSynergyCardsForTag('Equipment'),
        (e) => e.name === 'EdhrecError' && e.status === 403,
      );
    });
  });

  it('returns synergy cards when the bundled-static source serves valid JSON', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('/data/edhrec/pages/themes/equipment.json')) {
        return jsonResponse({
          container: { json_dict: { card_lists: [
            { header: 'High Synergy Cards', cardviews: [{ name: 'Puresteel Paladin' }] },
          ] } },
        });
      }
      return statusResponse(404);
    }, async () => {
      const cards = await getSynergyCardsForTag('Equipment');
      expect(cards).toContain('Puresteel Paladin');
    });
  });

  it('returns synergy cards from gh-mirror-raw when bundled-static is missing', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('raw.githubusercontent.com') && url.includes('/pages/themes/equipment.json')) {
        return jsonResponse({
          container: { json_dict: { card_lists: [
            { header: 'High Synergy Cards', cardviews: [{ name: 'Sram, Senior Edificer' }] },
          ] } },
        });
      }
      return statusResponse(404);
    }, async () => {
      const cards = await getSynergyCardsForTag('Equipment');
      expect(cards).toContain('Sram, Senior Edificer');
    });
  });
});
