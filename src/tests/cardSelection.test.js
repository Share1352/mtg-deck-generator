import { describe, expect, it } from 'vitest';
import { buildThemeQuery, getHostQuery } from '../lib/themeQueries.js';
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
  it('injects hosts for parasitic mechanics', () => {
    expect(getHostQuery('Enchant')).toMatch(/creature/i);
    expect(getHostQuery('Equipment')).toMatch(/creature/i);
    expect(getHostQuery('Equipment')).not.toMatch(/trample/i);
    expect(getHostQuery('Vehicles')).toMatch(/creature/i);
    expect(getHostQuery('Buyback')).toMatch(/instant or sorcery|cost less/i);
  });
});
