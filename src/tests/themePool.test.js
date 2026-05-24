import { describe, expect, it } from 'vitest';
import { mergeThemeSources, pickUniformTheme, categorizeTheme } from '../lib/themePool.js';
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

  it('refuses to pick from an empty pool', () => {
    let threw = false;
    try { pickUniformTheme([]); } catch (e) { threw = /empty/i.test(e.message); }
    expect(threw).toBe(true);
  });
});
