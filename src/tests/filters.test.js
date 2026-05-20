import { describe, expect, it } from 'vitest';
import { isPlayableMainDeckCard, isCreature, isLand, isBasicLand } from '../lib/filters.js';
const card = (overrides) => ({ name: 'Test', layout: 'normal', type_line: 'Creature — Human', oracle_text: '', lang: 'en', set: 'abc', set_name: 'Normal Set', color_identity: [], ...overrides });
describe('filters', () => {
  it('rejects known bad categories and cards', () => {
    expect(isPlayableMainDeckCard(card({ name: 'Command Tower', type_line: 'Land' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Dungeon of the Mad Mage', layout: 'dungeon', type_line: 'Dungeon' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Ferris Wheel', type_line: 'Artifact — Attraction', oracle_text: 'Visit this attraction.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: '17-Year Cicadas', set: 'mbtest' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: "Ate-o'-Clock", set_type: 'memorabilia' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Jarsyl, Dark Age Scion', oracle_text: 'your commander' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Command Beacon', type_line: 'Land', oracle_text: 'Put your commander into your hand from the command zone.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Command Beacon', type_line: 'Land', oracle_text: 'Add {C}.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Path of Ancestry', type_line: 'Land', oracle_text: 'Add {C}.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Command Tower', type_line: 'Land', oracle_text: 'Add one mana of any color.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Guild Artisan', type_line: 'Legendary Enchantment — Background', oracle_text: 'Commander creatures you own have an ability.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Aang, at the Crossroads', set: 'tla' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'The Tenth Doctor', set: 'who' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Vault Boy', set: 'pip' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Marneus Calgar', set: '40k' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Optimus Prime', set: 'bot' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Spider-Man', set: 'spm' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Snazzy Aether Homunculus', border_color: 'silver' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Acornelia', security_stamp: 'acorn' }))).toBe(false);
  });
  it('allows specified valid categories', () => {
    expect(isPlayableMainDeckCard(card({ name: 'Frodo', set: 'ltr' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Cloud', set: 'fin' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Minsc', set: 'afr' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Nearby Planet', type_line: 'Legendary Planeswalker — Test' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Dungeon Delver', oracle_text: 'Venture into the dungeon.' }))).toBe(true);
  });
  it('classifies card types', () => {
    expect(isCreature(card({ type_line: 'Artifact Creature — Myr' }))).toBe(true);
    expect(isLand(card({ type_line: 'Land' }))).toBe(true);
    expect(isBasicLand(card({ name: 'Snow-Covered Forest', type_line: 'Basic Snow Land — Forest' }))).toBe(true);
  });
});
