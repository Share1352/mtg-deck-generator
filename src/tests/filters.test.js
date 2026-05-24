import { describe, expect, it } from 'vitest';
import { isPlayableMainDeckCard, isCreature, isLand, isBasicLand, isPlayableAsLand } from '../lib/filters.js';
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
    expect(isPlayableMainDeckCard(card({ name: 'command beacon', type_line: 'Land', oracle_text: 'Add {C}.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: '  Command   Beacon ', type_line: 'Land', oracle_text: 'Add {C}.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Path of Ancestry', type_line: 'Land', oracle_text: 'Add {C}.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Command Tower', type_line: 'Land', oracle_text: 'Add one mana of any color.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Guild Artisan', type_line: 'Legendary Enchantment — Background', oracle_text: 'Commander creatures you own have an ability.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Aang, at the Crossroads', set: 'tla' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'The Tenth Doctor', set: 'who' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Vault Boy', set: 'pip' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Marneus Calgar', set: '40k' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Optimus Prime', set: 'bot' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Spider-Man', set: 'spm' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Bayek of Siwa', set: 'acr' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Cloud, Ex-SOLDIER', set: 'fin' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Tifa Lockhart', set_name: 'Final Fantasy Commander', set: 'fic' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Velociraptor Pack', set: 'rex', set_name: 'Jurassic World Collection' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Stranger by Set Name', set: 'xxx', set_name: 'Doctor Who Commander' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Some Conspiracy', layout: 'normal', type_line: 'Conspiracy', legalities: { commander: 'not_legal' } }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Eternal-legal Unfinity Card', set: 'unf', set_type: 'funny', type_line: 'Creature — Dog', legalities: { commander: 'legal' } }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Steam-Powered', set: 'ust', set_type: 'funny', border_color: 'silver', type_line: 'Artifact — Contraption' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: '_____ Goblin', set: 'unf', security_stamp: 'acorn', type_line: 'Creature — Goblin', oracle_text: 'Put a name sticker on this creature.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Park Re-Entry', set: 'unf', security_stamp: 'acorn', oracle_text: 'Open an Attraction.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Augmented Buster', set: 'ust', layout: 'augment', type_line: 'Creature — Construct' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Hot Sauce', set: 'ust', security_stamp: 'acorn', type_line: 'Creature — Construct Host', oracle_text: 'When this enters, combine it.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Squirrel Farm', set: 'unh', border_color: 'silver', type_line: 'Enchantment', oracle_text: 'Whenever you cast a spell, create a Squirrel token.' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Mother Kangaroo', type_line: 'Creature — Kangaroo', keywords: ['Banding'], oracle_text: 'Banding' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Old Bands-With-Other', type_line: 'Creature — Soldier', oracle_text: 'Bands with other Legends.' }))).toBe(false);
    expect(isPlayableMainDeckCard(card({ name: 'Channel', oracle_text: 'Pay X life. Add X.', legalities: { commander: 'banned' } }))).toBe(false);
  });
  it('allows specified valid categories', () => {
    expect(isPlayableMainDeckCard(card({ name: 'Frodo, Adventurous Hobbit', set: 'ltr' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Aragorn, the Uniter', set: 'ltc', set_name: 'Tales of Middle-earth Commander' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Gollum, Patient Plotter', set: 'tltr', set_name: 'Tales of Middle-earth Tokens' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Minsc', set: 'afr' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Nearby Planet', type_line: 'Legendary Planeswalker — Test' }))).toBe(true);
    expect(isPlayableMainDeckCard(card({ name: 'Dungeon Delver', oracle_text: 'Venture into the dungeon.' }))).toBe(true);
  });
  it('classifies card types', () => {
    expect(isCreature(card({ type_line: 'Artifact Creature — Myr' }))).toBe(true);
    expect(isLand(card({ type_line: 'Land' }))).toBe(true);
    expect(isBasicLand(card({ name: 'Snow-Covered Forest', type_line: 'Basic Snow Land — Forest' }))).toBe(true);
  });
  it('isPlayableAsLand requires front face land for transform layout', () => {
    expect(isPlayableAsLand({
      name: 'Profane Procession // Tomb of the Dusk Rose',
      layout: 'transform',
      card_faces: [
        { type_line: 'Legendary Enchantment', name: 'Profane Procession' },
        { type_line: 'Legendary Land', name: 'Tomb of the Dusk Rose' },
      ],
    })).toBe(false);
    expect(isPlayableAsLand({
      name: 'Westvale Abbey // Ormendahl, Profane Prince',
      layout: 'transform',
      card_faces: [
        { type_line: 'Land', name: 'Westvale Abbey' },
        { type_line: 'Legendary Creature — Demon', name: 'Ormendahl, Profane Prince' },
      ],
    })).toBe(true);
  });
  it('isPlayableAsLand accepts modal_dfc if any face is a land', () => {
    expect(isPlayableAsLand({
      name: 'Akoum Warrior // Akoum Teeth',
      layout: 'modal_dfc',
      card_faces: [
        { type_line: 'Creature — Minotaur Warrior', name: 'Akoum Warrior' },
        { type_line: 'Land', name: 'Akoum Teeth' },
      ],
    })).toBe(true);
  });
  it('isPlayableAsLand accepts normal lands', () => {
    expect(isPlayableAsLand({ name: 'Plains', layout: 'normal', type_line: 'Basic Land — Plains' })).toBe(true);
    expect(isPlayableAsLand({ name: 'Lightning Bolt', layout: 'normal', type_line: 'Instant' })).toBe(false);
  });
});
