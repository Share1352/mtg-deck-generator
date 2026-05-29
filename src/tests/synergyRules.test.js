import { describe, expect, it } from 'vitest';
import { directSynergyIssues, referencesOwnName, copiesFor, isMultiCopyCard, hasTutorTarget, referencedCardNames, typeControlRequirements } from '../lib/synergyRules.js';

function card(name, type_line = 'Instant', oracle_text = '', cmc = 2) {
  return { name, type_line, oracle_text, cmc, layout: 'normal', lang: 'en', color_identity: [], oracle_id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}

describe('direct synergy rules', () => {
  it('gives self-referencing cards multiple copies instead of dropping them', () => {
    const ancestralAnger = card('Ancestral Anger', 'Sorcery', 'Target creature gains trample until end of turn and gets +X/+0, where X is 1 plus the number of cards named Ancestral Anger in your graveyard. Draw a card.');
    expect(referencedCardNames(ancestralAnger)).toContain('Ancestral Anger');
    expect(referencesOwnName(ancestralAnger)).toBe(true);
    expect(copiesFor(ancestralAnger)).toBeGreaterThan(1);
    expect(isMultiCopyCard(ancestralAnger)).toBe(true);
    // self-reference is now supported via copies, so it is not a removable synergy issue
    expect(directSynergyIssues([ancestralAnger])).toHaveLength(0);
  });

  it('runs a playset of "any number" cards', () => {
    const rats = card('Relentless Rats', 'Creature — Rat', 'Relentless Rats gets +1/+1 for each other creature named Relentless Rats. A deck can have any number of cards named Relentless Rats.');
    expect(copiesFor(rats)).toBe(6);
  });

  it('requires direct named-card references to be present', () => {
    const caller = card('Bogbrew Witch', 'Creature — Human Wizard', 'Search your library for a card named Festering Newt or Bubbling Cauldron, reveal it, put it into your hand, then shuffle.');
    expect(directSynergyIssues([caller]).some((issue) => issue.type === 'named-card')).toBe(true);
  });

  it('requires specific library searches to have guaranteed targets', () => {
    const tutor = card('Artifact Tutor', 'Creature', 'When Artifact Tutor enters, search your library for an artifact card with mana value 2 or less, reveal it, then shuffle.');
    const target = card('Cheap Bauble', 'Artifact', 'Draw a card.', 1);
    const expensive = card('Costly Bauble', 'Artifact', 'Draw a card.', 4);
    expect(hasTutorTarget(tutor, [tutor, expensive])).toBe(false);
    expect(hasTutorTarget(tutor, [tutor, target])).toBe(true);
  });

  it('pulls in named permanents a card requires (Urza tron, named planeswalkers)', () => {
    const funhouse = card('Urza\'s Fun House', 'Land — Urza\'s', 'Add 1 to your mana pool. Activate only if you control an Urza\'s Mine, an Urza\'s Power-Plant, and an Urza\'s Tower.');
    const tron = referencedCardNames(funhouse);
    for (const piece of ["Urza's Mine", "Urza's Power-Plant", "Urza's Tower"]) expect(tron).toContain(piece);
    const fink = card('Bramblefort Fink', 'Creature — Ouphe', 'Activate this ability only if you control an Oko planeswalker.');
    expect(referencedCardNames(fink)).toContain('Oko');
    // plain "control a Black creature" must not become a bogus "Black" card dependency
    const ferocious = card('Ferocious', 'Instant', 'As long as you control a Black creature, this costs less.');
    expect(referencedCardNames(ferocious)).not.toContain('Black');
  });

  it('requires the type of permanent a card cares about to be present', () => {
    const lord = card('Dragon Tempest', 'Enchantment', 'Whenever a Dragon you control enters, it deals damage. Dragons you control have haste.');
    const reqs = typeControlRequirements(lord);
    expect(reqs.some((r) => r.type === 'dragon')).toBe(true);
    const dragon = card('Shivan Dragon', 'Creature — Dragon', 'Flying');
    const plain = card('Grizzly Bears', 'Creature — Bear', '');
    expect(directSynergyIssues([lord, plain]).some((i) => i.type === 'type-control')).toBe(true);
    expect(directSynergyIssues([lord, dragon]).some((i) => i.type === 'type-control')).toBe(false);
  });

  it('guarantees fetchland basic-type targets and typed tutors generally', () => {
    const fetch = card('Wooded Foothills', 'Land', 'Pay 1 life, sacrifice Wooded Foothills: Search your library for a Mountain or Forest card, put it onto the battlefield, then shuffle.');
    const mountain = card('Mountain', 'Basic Land — Mountain', '');
    expect(hasTutorTarget(fetch, [fetch])).toBe(false);
    expect(hasTutorTarget(fetch, [fetch, mountain])).toBe(true);

    const dragonTutor = card('Dragon Caller', 'Creature', 'Search your library for a Dragon card, reveal it, put it into your hand, then shuffle.');
    const dragon = card('Shivan Dragon', 'Creature — Dragon', 'Flying');
    expect(hasTutorTarget(dragonTutor, [dragonTutor])).toBe(false);
    expect(hasTutorTarget(dragonTutor, [dragonTutor, dragon])).toBe(true);
  });
});
