import { describe, expect, it } from 'vitest';
import { allocateBasics, isUsefulFetchland, splitLandSlots } from '../lib/manaBase.js';
describe('mana base helpers', () => {
  it('splits lands 50/50 with extra basic', () => {
    expect(splitLandSlots(21)).toEqual({ basics: 11, nonbasics: 10 });
    expect(splitLandSlots(22)).toEqual({ basics: 11, nonbasics: 11 });
  });
  it('allocates basics by pips and snow conversion', () => {
    const basics = allocateBasics(['W', 'G'], 10, { W: 8, G: 2 }, true);
    expect(basics.filter((n) => /Plains/.test(n)).length).toBeGreaterThan(basics.filter((n) => /Forest/.test(n)).length);
    expect(basics.filter((n) => n.startsWith('Snow-Covered')).length).toBe(3);
  });
  it('rejects off-color fetchlands', () => {
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a Mountain or Forest card.' }, ['U'])).toBe(false);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for an Island or Swamp card.' }, ['U'])).toBe(true);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a basic land card.' }, ['W'])).toBe(true);
  });
});
