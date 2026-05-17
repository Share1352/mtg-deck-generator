import { describe, expect, it } from 'vitest';
import { allocateBasics, buildManaBase, isUsefulFetchland, splitLandSlots } from '../lib/manaBase.js';
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

  it('fills exhausted non-basic slots with varied random-compatible lands instead of fixed staples', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('offline test'));
    const nonlands = Array.from({ length: 23 }, (_, i) => ({
      name: `Spell ${i}`,
      type_line: 'Creature',
      mana_cost: '{2}{W}',
      color_identity: ['W'],
      oracle_id: `spell-${i}`,
      lang: 'en',
    }));
    let lands;
    try {
      lands = await buildManaBase(nonlands, ['W', 'U'], { theme: '', rng: () => 0.42 });
    } finally {
      globalThis.fetch = originalFetch;
    }
    const nonbasics = lands.filter((card) => !/^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$/.test(card.name));
    const nonbasicNames = nonbasics.map((card) => card.name);

    expect(nonbasics).toHaveLength(10);
    expect(new Set(nonbasicNames).size).toBe(10);
    expect(nonbasicNames).not.toContain('Evolving Wilds');
    expect(nonbasicNames).not.toContain('Terramorphic Expanse');
  });
  it('rejects off-color fetchlands', () => {
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a Mountain or Forest card.' }, ['U'])).toBe(false);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for an Island or Swamp card.' }, ['U'])).toBe(true);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a basic land card.' }, ['W'])).toBe(true);
  });
});
