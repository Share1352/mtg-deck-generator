import { describe, expect, it } from 'vitest';
import { validateDeck } from '../lib/validation.js';

const spell = (i) => ({ name: `Spell ${i}`, layout: 'normal', type_line: 'Creature — Human', oracle_text: '', lang: 'en', set: 'abc', set_name: 'Set', color_identity: [], oracle_id: `spell-${i}` });
const spells = (n) => Array.from({ length: n }, (_, i) => spell(i));
const plains = (n) => Array.from({ length: n }, () => ({ name: 'Plains', layout: 'normal', type_line: 'Basic Land — Plains', oracle_text: '', lang: 'en', set: 'abc', color_identity: [], oracle_id: 'plains' }));
const deck = (nonlands, lands) => ({ nonlands, lands });

describe('validateDeck non-land bounds (#41)', () => {
  it('accepts the usual 23 non-lands', () => {
    expect(validateDeck(deck(spells(23), plains(18))).ok).toBe(true);
  });
  it('accepts an exceptional larger deck up to the cap', () => {
    expect(validateDeck(deck(spells(30), plains(18))).ok).toBe(true);
    expect(validateDeck(deck(spells(40), plains(18))).ok).toBe(true);
  });
  it('rejects fewer than 23 non-lands', () => {
    expect(validateDeck(deck(spells(22), plains(18))).ok).toBe(false);
  });
  it('rejects more than the cap', () => {
    expect(validateDeck(deck(spells(41), plains(18))).ok).toBe(false);
  });
});
