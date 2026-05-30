import { describe, expect, it } from 'vitest';
import { isDirectThemeCard } from '../lib/cardSelection.js';
import { buildThemeQuery, getHostQuery, getThemeAdjacentQueries } from '../lib/themeQueries.js';

describe('theme queries and parasitic support', () => {
  it('uses exact typal queries for Mite and Myr', () => {
    expect(buildThemeQuery('Mite')).toContain('type:"Mite"');
    expect(buildThemeQuery('Mite')).not.toContain('Smite');
    expect(buildThemeQuery('Myr')).toContain('type:"Myr"');
  });
  it('preserves typal category for object themes and includes plural support', () => {
    const q = buildThemeQuery({ name: 'Dwarf', category: 'typal' });
    expect(q).toContain('type:"Dwarf"');
    expect(q).toContain('oracle:/\\bDwarves\\b/i');
    expect(q).not.toContain('keyword:"Dwarf"');
  });
  it('builds deterministic adjacent query groups for Riot', () => {
    const riotQueries = getThemeAdjacentQueries('Riot');
    expect(riotQueries.map((q) => q.group)).toEqual([
      'mechanicSynonyms',
      'mechanicSynonyms',
      'mechanicEnablers',
      'mechanicEnablers',
      'mechanicPayoffs',
      'closelyRelated',
    ]);
    expect(riotQueries[0].query).toContain('keyword:riot');
    expect(riotQueries.some((q) => q.query.includes('modified'))).toBe(true);
  });

  it('injects hosts for parasitic mechanics', () => {
    expect(getHostQuery('Enchant')).toMatch(/creature/i);
    expect(getHostQuery('Equipment')).toMatch(/creature/i);
    expect(getHostQuery('Equipment')).not.toMatch(/trample/i);
    expect(getHostQuery('Vehicles')).toMatch(/creature/i);
    expect(getHostQuery('Buyback')).toMatch(/instant or sorcery|cost less/i);
  });

  it('rejects incidental oracle word matches for typal theme cards', () => {
    const weirdTheme = { name: 'Weird', category: 'typal' };
    expect(isDirectThemeCard({
      name: 'Nothic',
      type_line: 'Creature — Horror',
      oracle_text: 'Weird Insight — When Nothic enters, roll a d20.',
    }, weirdTheme)).toBe(false);
    expect(isDirectThemeCard({
      name: 'Experimental Overload',
      type_line: 'Sorcery',
      oracle_text: 'Create a blue and red Weird creature token.',
    }, weirdTheme)).toBe(true);
    expect(isDirectThemeCard({
      name: 'Blistercoil Weird',
      type_line: 'Creature — Weird',
      oracle_text: 'Whenever you cast an instant or sorcery spell, untap Blistercoil Weird.',
    }, weirdTheme)).toBe(true);
  });
});
