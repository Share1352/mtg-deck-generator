import { describe, expect, it } from 'vitest';
import { deckSynergyIssues, finalizeDeckSynergies } from '../lib/deckSynergyCheck.js';

function card(name, type_line, oracle_text = '', extra = {}) {
  return { name, type_line, oracle_text, layout: 'normal', lang: 'en', color_identity: [], cmc: 2, oracle_id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...extra };
}

const island = () => card('Island', 'Basic Land — Island', '', { oracle_id: 'island-basic' });
// Utility land whose ability is dead unless the deck contains a Dragon (Temple of the Dragon Queen case).
const dragonTemple = () => card('Temple of the Dragon Queen', 'Land', 'As this land enters, you may reveal a Dragon card from your hand. This land enters tapped unless you revealed a Dragon card this way or you control a Dragon. {T}: Add one mana of any color.');
const cleanDual = () => card('Tranquil Cove', 'Land', '{T}: Add {W} or {U}. This land enters tapped.', { oracle_id: 'tranquil-cove' });

describe('final whole-deck synergy check', () => {
  it('flags a utility land whose printed synergy has no target in the deck', () => {
    const deck = { nonlands: [card('Merfolk', 'Creature — Merfolk', '')], lands: [dragonTemple(), island()] };
    const issues = deckSynergyIssues(deck);
    expect(issues.some((i) => i.card.name === 'Temple of the Dragon Queen' && i.type === 'type-control')).toBe(true);
  });

  it('does not flag the land once a matching permanent is present', () => {
    const deck = { nonlands: [card('Shivan Dragon', 'Creature — Dragon', 'Flying')], lands: [dragonTemple(), island()] };
    expect(deckSynergyIssues(deck).some((i) => i.card.name === 'Temple of the Dragon Queen')).toBe(false);
  });

  it('swaps a dead-synergy land for a synergy-clean replacement at the end', async () => {
    const deck = { nonlands: [card('Merfolk', 'Creature — Merfolk', '')], lands: [dragonTemple(), island()] };
    const result = await finalizeDeckSynergies(deck, { colors: ['W', 'U'], rng: () => 0, landPool: [cleanDual()] });
    expect(result.replaced).toBe(1);
    expect(deck.lands.some((l) => l.name === 'Temple of the Dragon Queen')).toBe(false);
    expect(deck.lands.some((l) => l.name === 'Tranquil Cove')).toBe(true);
    expect(result.remaining).toHaveLength(0);
  });

  it('falls back to cloning an existing basic when no clean nonbasic is available', async () => {
    const deck = { nonlands: [card('Merfolk', 'Creature — Merfolk', '')], lands: [dragonTemple(), island()] };
    const result = await finalizeDeckSynergies(deck, { colors: ['U'], rng: () => 0, landPool: [] });
    expect(result.replaced).toBe(1);
    expect(deck.lands.filter((l) => l.name === 'Island')).toHaveLength(2);
    expect(result.remaining).toHaveLength(0);
  });
});
