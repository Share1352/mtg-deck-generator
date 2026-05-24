import { describe, expect, it } from 'vitest';
import { generateDeck } from '../lib/deckGenerator.js';
import { _resetScryfallCache, configureScryfallRetry } from '../lib/scryfallClient.js';

describe('deck generator (online-only)', () => {
  it('fails clearly when no online card database is reachable', async () => {
    _resetScryfallCache();
    configureScryfallRetry({ minGapMs: 0, maxAttempts: 2, baseBackoffMs: 1, maxBackoffMs: 1 });
    const original = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('offline'); };
    let caught;
    try {
      await generateDeck({ seed: 7, onProgress: () => {} });
    } catch (error) {
      caught = error;
    } finally {
      globalThis.fetch = original;
      configureScryfallRetry({ minGapMs: 100, maxAttempts: 8, baseBackoffMs: 800, maxBackoffMs: 15000 });
    }
    expect(caught).not.toBe(undefined);
    expect(/Online .* (?:database|sources) (?:is|are) unreachable/i.test(caught.message)).toBe(true);
    expect(/reachable/i.test(caught.message)).toBe(true);
  });
});
