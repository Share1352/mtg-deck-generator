import { describe, expect, it } from 'vitest';
import { canonicalSynergyTag, getSynergyCardsForTag } from '../lib/edhrecClient.js';

describe('EDHREC synergy cache aliases', () => {
  it('maps mechanic aliases to their cached EDHREC theme names', () => {
    expect(canonicalSynergyTag('Equip')).toBe('Equipment');
    expect(canonicalSynergyTag('Crew')).toBe('Vehicles');
  });

  it('uses the Equipment cache for Equip so equipment decks get real support cards', async () => {
    const cards = await getSynergyCardsForTag('Equip');
    expect(cards).toContain('Puresteel Paladin');
    expect(cards).toContain('Axgard Armory');
  });

  it('has a Flying cache instead of relying only on old released-order Scryfall cards', async () => {
    const cards = await getSynergyCardsForTag('Flying');
    expect(cards).toContain('Favorable Winds');
    expect(cards).toContain("Rogue's Passage");
  });
});
