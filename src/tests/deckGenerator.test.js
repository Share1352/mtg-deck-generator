import { describe, expect, it } from 'vitest';
import { generateDeck } from '../lib/deckGenerator.js';

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
});
