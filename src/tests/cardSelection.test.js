import { describe, expect, it } from 'vitest';
import { buildThemeQuery, getHostQuery } from '../lib/themeQueries.js';
describe('theme queries and parasitic support', () => {
  it('uses exact typal queries for Mite and Myr', () => {
    expect(buildThemeQuery('Mite')).toContain('type:"Mite"');
    expect(buildThemeQuery('Mite')).not.toContain('Smite');
    expect(buildThemeQuery('Myr')).toContain('type:"Myr"');
  });
  it('injects hosts for parasitic mechanics', () => {
    expect(getHostQuery('Enchant')).toMatch(/creature/i);
    expect(getHostQuery('Equipment')).toMatch(/creature/i);
    expect(getHostQuery('Vehicles')).toMatch(/creature/i);
    expect(getHostQuery('Buyback')).toMatch(/instant or sorcery|cost less/i);
  });
});
