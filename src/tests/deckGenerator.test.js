import { describe, expect, it } from 'vitest';
import { generateDeck } from '../lib/deckGenerator.js';
import { selectCardsForTheme } from '../lib/cardSelection.js';
import { isCreature } from '../lib/filters.js';
import { createRng } from '../lib/random.js';

describe('deck generator', () => {
  it('forges a complete deck when Scryfall is unavailable', async () => {
    globalThis.fetch = async () => { throw new Error('network disabled for offline generation test'); };
    const deck = await generateDeck({ seed: 7, onProgress: () => {} });
    expect(deck.nonlands).toHaveLength(23);
    expect(deck.lands.length).toBeGreaterThanOrEqual(15);
    expect(deck.lands.length).toBeLessThan(26);
    expect(deck.exportText.split('\n').length).toBeGreaterThan(30);
    expect(deck.debugLog).toMatch(/Offline Scryfall fallback/);
  });

  it('preserves the required creature/support split in the 12-card core', async () => {
    globalThis.fetch = async () => { throw new Error('network disabled for core composition test'); };
    for (const name of ['Buyback', 'Myr']) {
      const selection = await selectCardsForTheme({ name, category: 'keyword', sources: ['test'] }, { rng: createRng(3) });
      const coreCreatures = selection.core.filter(isCreature);
      expect(selection.nonlands).toHaveLength(23);
      expect(selection.core).toHaveLength(12);
      expect(coreCreatures.length).toBeGreaterThanOrEqual(5);
      expect(selection.core.length - coreCreatures.length).toBeGreaterThanOrEqual(7);
    }
  });
});
