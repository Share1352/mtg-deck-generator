import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildThemeQuery } from '../lib/themeQueries.js';

const tagsPath = fileURLToPath(new URL('../../public/data/scryfall-oracle-tags.json', import.meta.url));
const bundled = JSON.parse(readFileSync(tagsPath, 'utf8'));

describe('bundled Scryfall Oracle Tagger index', () => {
  it('parses, has a healthy count, and every entry is a well-formed slug + name', () => {
    expect(Array.isArray(bundled.tags)).toBe(true);
    expect(bundled.count).toBe(bundled.tags.length);
    expect(bundled.tags.length).toBeGreaterThanOrEqual(1000);
    for (const entry of bundled.tags) {
      expect(entry.tag).toMatch(/^[a-z0-9][a-z0-9-]*$/i);
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });
});

describe('buildThemeQuery tagger fallback', () => {
  it('pairs the otag clause with a non-otag fallback so a dead tag cannot empty the search', () => {
    const q = buildThemeQuery({ name: 'Aristocrats', category: 'tagger', tag: 'aristocrats' });
    expect(q).toContain('otag:"aristocrats"');
    // an oracle-text fallback must also be present
    expect(q).toContain('oracle:');
    expect(q).toMatch(/\bOR\b/);
  });
});
