import { describe, expect, it } from 'vitest';
import { mergeThemeSources, pickUniformTheme, pickTheme, categorizeTheme, fetchScryfallOracleTagThemes } from '../lib/themePool.js';
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

  it('bans multiplayer-only Oracle Tagger theme names regardless of spelling (#40)', () => {
    const { themes } = mergeThemeSources([
      { name: 'Multiplayer', source: 'Scryfall Oracle Tagger', category: 'tagger' },
      { name: 'Gains Myriad', source: 'Scryfall Oracle Tagger', category: 'tagger' },
      { name: 'Monarch Matters', source: 'Scryfall Oracle Tagger', category: 'tagger' },
      { name: 'Planechase Mechanic', source: 'Scryfall Oracle Tagger', category: 'tagger' },
      { name: 'Synergy Vote', source: 'Scryfall Oracle Tagger', category: 'tagger' },
      { name: 'Cleric', source: 'Scryfall creature-types', category: 'typal' },
      { name: 'Devotee', source: 'Scryfall Oracle Tagger', category: 'tagger' }, // contains "vote" substring but not the word
    ]);
    const names = themes.map((t) => t.name);
    expect(names).not.toContain('Multiplayer');
    expect(names).not.toContain('Gains Myriad');
    expect(names).not.toContain('Monarch Matters');
    expect(names).not.toContain('Planechase Mechanic');
    expect(names).not.toContain('Synergy Vote');
    expect(names).toContain('Cleric');
    expect(names).toContain('Devotee');
  });

  it('gives color-only themes a flat ~10% as one bucket (#39)', () => {
    const themes = [
      ...buildColorThemes(),
      ...Array.from({ length: 200 }, (_, i) => ({ name: `Theme ${i}`, category: 'typal' })),
    ];
    const rng = createRng(7);
    let color = 0;
    const N = 20000;
    for (let i = 0; i < N; i += 1) if (pickTheme(themes, rng).category === 'color') color += 1;
    const share = color / N;
    expect(share).toBeGreaterThan(0.08);
    expect(share).toBeLessThan(0.12);
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
