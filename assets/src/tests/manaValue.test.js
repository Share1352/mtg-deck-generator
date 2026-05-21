import { describe, expect, it } from 'vitest';
import { manaCostValue, virtualCastableEntries, calculateLandCount } from '../lib/manaValue.js';
import { countManaPips } from '../lib/manaPips.js';
describe('mana value and pips', () => {
  it('counts X as 4 and ability X as pressure', () => {
    expect(manaCostValue('{X}{G}')).toBe(5);
    expect(virtualCastableEntries({ name: 'X ability', mana_cost: '{1}{U}', type_line: 'Creature', oracle_text: '{X}{U}: Draw.' })[0].value).toBeGreaterThan(3);
  });
  it('handles split/adventure/MDFC virtual parts', () => {
    const entries = virtualCastableEntries({ name: 'Fire // Ice', card_faces: [{ name: 'Fire', mana_cost: '{1}{R}', type_line: 'Instant' }, { name: 'Ice', mana_cost: '{1}{U}', type_line: 'Instant' }] });
    expect(entries).toHaveLength(2);
    const mdfc = virtualCastableEntries({ name: 'Spell // Land', card_faces: [{ name: 'Spell', mana_cost: '{2}{G}', type_line: 'Sorcery' }, { name: 'Land', type_line: 'Land' }] });
    expect(mdfc).toHaveLength(1);
  });
  it('counts hybrid and snow symbols', () => {
    const { pips, snowRequired } = countManaPips([{ mana_cost: '{W/U}{S}', type_line: 'Instant', oracle_text: '{B/P}: test' }]);
    expect(pips.W).toBeGreaterThan(0);
    expect(pips.U).toBeGreaterThan(0);
    expect(pips.B).toBeGreaterThan(0);
    expect(snowRequired).toBe(true);
  });
  it('land count is clamped', () => {
    expect(calculateLandCount(Array.from({ length: 23 }, () => ({ mana_cost: '{8}', type_line: 'Creature' }))).lands).toBe(25);
    expect(calculateLandCount(Array.from({ length: 23 }, () => ({ mana_cost: '{1}', type_line: 'Creature' }))).lands).toBeGreaterThanOrEqual(15);
  });
});
