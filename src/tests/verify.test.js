import { describe, it, expect } from 'vitest';
import { verifyMirror } from '../../scripts/verify-edhrec-mirror.js';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ---- helpers ----

async function withTmpDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'verify-test-'));
  try { await fn(dir); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

function makeNonEmptyIndex(n = 3) {
  const cardviews = Array.from({ length: n }, (_, i) => ({ name: `Card ${i}` }));
  return { container: { json_dict: { card_lists: [{ cardviews }] } } };
}

const EMPTY_INDEX = { container: { json_dict: { card_lists: [] } } };

async function setupDir(tmpDir) {
  await mkdir(join(tmpDir, 'public/data/edhrec/pages'), { recursive: true });
}

async function writeManifest(tmpDir, override = {}) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    themePagesFetched: 20,
    indexPagesFetched: 2,
    indexPagesStubbed: 2,
    topN: 100,
    totalDiscoveredSlugs: 50,
    sourceCounts: {},
    errorsPreview: [],
    ...override,
  };
  await writeFile(
    join(tmpDir, 'public/data/edhrec/manifest.json'),
    JSON.stringify(manifest),
  );
}

async function writeRequiredFiles(tmpDir) {
  await writeFile(
    join(tmpDir, 'public/data/edhrec/pages/themes.json'),
    JSON.stringify(makeNonEmptyIndex(3)),
  );
  await writeFile(
    join(tmpDir, 'public/data/edhrec/pages/tribes.json'),
    JSON.stringify(makeNonEmptyIndex(3)),
  );
}

async function writeOptionalStubs(tmpDir) {
  await writeFile(join(tmpDir, 'public/data/edhrec/pages/typal.json'), JSON.stringify(EMPTY_INDEX));
  await writeFile(join(tmpDir, 'public/data/edhrec/pages/keywords.json'), JSON.stringify(EMPTY_INDEX));
}

// ---- required file checks ----

describe('verifyMirror – required files', () => {
  it('fails when both required index files are missing', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const hasThemes = result.failures.some((f) => f.includes('themes.json'));
      const hasTribes = result.failures.some((f) => f.includes('tribes.json'));
      expect(hasThemes).toBe(true);
      expect(hasTribes).toBe(true);
    });
  });

  it('fails when one required file is missing and the other is present', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeFile(
        join(tmpDir, 'public/data/edhrec/pages/themes.json'),
        JSON.stringify(makeNonEmptyIndex(3)),
      );
      await writeManifest(tmpDir);
      await writeOptionalStubs(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const hasTribes = result.failures.some((f) => f.includes('tribes.json'));
      expect(hasTribes).toBe(true);
    });
  });

  it('fails when a required file is empty (zero card entries)', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeFile(
        join(tmpDir, 'public/data/edhrec/pages/themes.json'),
        JSON.stringify(EMPTY_INDEX),
      );
      await writeFile(
        join(tmpDir, 'public/data/edhrec/pages/tribes.json'),
        JSON.stringify(makeNonEmptyIndex(3)),
      );
      await writeManifest(tmpDir);
      await writeOptionalStubs(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const emptyError = result.failures.some((f) => f.includes('empty') && f.includes('themes.json'));
      expect(emptyError).toBe(true);
    });
  });

  it('fails when a required file contains invalid JSON', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeFile(join(tmpDir, 'public/data/edhrec/pages/themes.json'), 'NOT JSON');
      await writeFile(
        join(tmpDir, 'public/data/edhrec/pages/tribes.json'),
        JSON.stringify(makeNonEmptyIndex(3)),
      );
      await writeManifest(tmpDir);
      await writeOptionalStubs(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const jsonError = result.failures.some((f) => f.includes('invalid JSON') && f.includes('themes.json'));
      expect(jsonError).toBe(true);
    });
  });
});

// ---- optional file checks ----

describe('verifyMirror – optional files', () => {
  it('allows optional files that are empty stubs (EMPTY_STUB is valid)', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      await writeOptionalStubs(tmpDir);
      await writeManifest(tmpDir, { indexPagesStubbed: 2 });
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(true);
    });
  });

  it('fails when an optional file is missing entirely', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      // write only typal, leave keywords missing
      await writeFile(join(tmpDir, 'public/data/edhrec/pages/typal.json'), JSON.stringify(EMPTY_INDEX));
      await writeManifest(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const missingKeywords = result.failures.some((f) => f.includes('keywords.json'));
      expect(missingKeywords).toBe(true);
    });
  });
});

// ---- manifest checks ----

describe('verifyMirror – manifest', () => {
  it('fails when manifest is missing', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      await writeOptionalStubs(tmpDir);
      // no manifest
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(result.ok).toBe(false);
      const noManifest = result.failures.some((f) => f.includes('manifest missing'));
      expect(noManifest).toBe(true);
    });
  });

  it('fails when themePagesFetched is below the minimum', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      await writeOptionalStubs(tmpDir);
      await writeManifest(tmpDir, { themePagesFetched: 3 });
      const result = verifyMirror({ root: tmpDir, minThemePages: 10 });
      expect(result.ok).toBe(false);
      const countError = result.failures.some((f) => f.includes('themePagesFetched=3'));
      expect(countError).toBe(true);
    });
  });

  it('passes when themePagesFetched equals the minimum exactly', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      await writeOptionalStubs(tmpDir);
      await writeManifest(tmpDir, { themePagesFetched: 10 });
      const result = verifyMirror({ root: tmpDir, minThemePages: 10 });
      expect(result.ok).toBe(true);
    });
  });
});

// ---- full-pass test ----

describe('verifyMirror – happy path', () => {
  it('passes with valid required files, optional stubs, and a valid manifest', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      await writeRequiredFiles(tmpDir);
      await writeOptionalStubs(tmpDir);
      await writeManifest(tmpDir, { themePagesFetched: 25 });
      const result = verifyMirror({ root: tmpDir, minThemePages: 10 });
      expect(result.ok).toBe(true);
      expect(result.failures).toHaveLength(0);
    });
  });

  it('always returns an object with ok and failures fields (never throws)', async () => {
    await withTmpDir(async (tmpDir) => {
      await setupDir(tmpDir);
      const result = verifyMirror({ root: tmpDir, minThemePages: 1 });
      expect(typeof result).toBe('object');
      expect(typeof result.ok).toBe('boolean');
      expect(Array.isArray(result.failures)).toBe(true);
    });
  });
});
