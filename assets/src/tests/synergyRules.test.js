import { describe, expect, it } from 'vitest';
import { directSynergyIssues, hasUnsupportedSelfNameSynergy, hasTutorTarget, referencedCardNames } from '../lib/synergyRules.js';

function card(name, type_line = 'Instant', oracle_text = '', cmc = 2) {
  return { name, type_line, oracle_text, cmc, layout: 'normal', lang: 'en', color_identity: [], oracle_id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}

describe('direct synergy rules', () => {
  it('flags singleton cards that need extra copies by name', () => {
    const ancestralAnger = card('Ancestral Anger', 'Sorcery', 'Target creature gains trample until end of turn and gets +X/+0, where X is 1 plus the number of cards named Ancestral Anger in your graveyard. Draw a card.');
    expect(referencedCardNames(ancestralAnger)).toContain('Ancestral Anger');
    expect(hasUnsupportedSelfNameSynergy(ancestralAnger)).toBe(true);
    expect(directSynergyIssues([ancestralAnger])[0].type).toBe('self-name');
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
});
