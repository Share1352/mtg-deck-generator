import { describe, expect, it } from 'vitest';
import { buildThemePool, pickUniformTheme } from '../lib/themePool.js';
import { createRng } from '../lib/random.js';
describe('theme pool', () => {
  it('merges sources, removes bans, dedupes, and keeps small themes', async () => {
    const { themes } = await buildThemePool({ edhrecTags: [{ name: 'Mole', category: 'typal' }, { name: 'Mole' }, { name: 'Commander' }], scryfallCatalogs: ['Flying', 'Mite'] });
    expect(themes.map((t) => t.name)).toContain('Mole');
    expect(themes.map((t) => t.name)).toContain('Flying');
    expect(themes.map((t) => t.name)).toContain('Mite');
    expect(themes.map((t) => t.name.toLowerCase())).not.toContain('commander');
    expect(themes.filter((t) => t.name === 'Mole')).toHaveLength(1);
  });
  it('picks uniformly from final list with supplied rng', () => {
    const themes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const rng = createRng(123);
    const counts = { A: 0, B: 0, C: 0 };
    for (let i = 0; i < 3000; i += 1) counts[pickUniformTheme(themes, rng).name] += 1;
    expect(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))).toBeLessThan(160);
  });
});
