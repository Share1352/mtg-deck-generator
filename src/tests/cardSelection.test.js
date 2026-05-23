import { describe, expect, it } from 'vitest';
import { buildThemeQuery, getHostQuery, getThemeAdjacentQueries } from '../lib/themeQueries.js';
import { isGenericTypalSupport } from '../lib/cardSelection.js';

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
  it('accepts typal-support cards such as Herald\'s Horn as indirect support', () => {
    expect(isGenericTypalSupport({ name: "Herald's Horn" })).toBe(true);
    expect(isGenericTypalSupport({ name: 'Vanquisher\'s Banner' })).toBe(true);
    expect(isGenericTypalSupport({ name: 'Arcane Signet' })).toBe(false);
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
});
