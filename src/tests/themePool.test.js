import { describe, expect, it } from 'vitest';
import { mergeThemeSources, pickUniformTheme, categorizeTheme, fetchScryfallOracleTagThemes } from '../lib/themePool.js';
import { buildColorThemes } from '../lib/colorThemes.js';
import { createRng } from '../lib/random.js';

describe('theme pool', () => {
  it('merges sources, removes bans, dedupes, and keeps small themes', () => {
    const { themes, bannedCount } = mergeThemeSources([
      { name: 'Mole', source: 'Scryfall creature-types', category: 'typal' },
      { name: 'Mole', source: 'Scryfall creature-types', category: 'typal' },
      { name: 'Commander', source: 'Scryfall ability-words', category: 'theme' },
      { name: 'Flying', source: 'Scryfall keyword-abilities', category: 'mechanic' },
      { name: 'Mite', source: 'Scryfall creature-types', category: 'typal' },
    ]);
    expect(themes.map((t) => t.name)).toContain('Mole');
    expect(themes.map((t) => t.name)).toContain('Flying');
    expect(themes.map((t) => t.name)).toContain('Mite');
    expect(themes.map((t) => t.name.toLowerCase())).not.toContain('commander');
    expect(themes.filter((t) => t.name === 'Mole')).toHaveLength(1);
    expect(themes.find((t) => t.name === 'Mole').sources).toContain('Scryfall creature-types');
    expect(bannedCount).toBeGreaterThanOrEqual(1);
  });

  it('picks uniformly from the final list with a supplied rng', () => {
    const themes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const rng = createRng(123);
    const counts = { A: 0, B: 0, C: 0 };
    for (let i = 0; i < 3000; i += 1) counts[pickUniformTheme(themes, rng).name] += 1;
    expect(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))).toBeLessThan(160);
  });

  it('categorizes themes by name and source hint', () => {
    expect(categorizeTheme('Myr')).toBe('typal');
    expect(categorizeTheme('Aristocrats')).toBe('theme');
    expect(categorizeTheme('Flying', 'keyword-abilities')).toBe('mechanic');
    expect(categorizeTheme('Werewolf', 'creature-types')).toBe('typal');
  });

  it('keeps Scryfall Oracle Tagger functional tags separate from art tags', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        source: 'test',
        tags: Array.from({ length: 1001 }, (_, i) => ({ tag: `gameplay-tag-${i}`, name: `Gameplay Tag ${i}` })),
      }),
    });
    let themes;
    try {
      themes = await fetchScryfallOracleTagThemes();
    } finally {
      globalThis.fetch = original;
    }
    expect(themes).toHaveLength(1001);
    expect(themes[0].category).toBe('tagger');
    expect(themes[0].source).toBe('Scryfall Oracle Tagger');
  });

  it('adds every color identity combination as pickable themes', () => {
    const themes = buildColorThemes();
    expect(themes).toHaveLength(32);
    expect(themes.map((t) => t.name)).toContain('Colorless');
    expect(themes.map((t) => t.name)).toContain('Mono-Blue');
    expect(themes.map((t) => t.name)).toContain('Red/White');
    expect(themes.map((t) => t.name)).toContain('Blue/Black/Red');
    expect(themes.map((t) => t.name)).toContain('Five-Color');
  });

  it('refuses to pick from an empty pool', () => {
    let threw = false;
    try { pickUniformTheme([]); } catch (e) { threw = /empty/i.test(e.message); }
    expect(threw).toBe(true);
  });
});
