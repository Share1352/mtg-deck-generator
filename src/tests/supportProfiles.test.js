import { describe, expect, it } from 'vitest';
import { getSupportPlan, inferSupportTiersFromCards } from '../lib/supportProfiles.js';
import { needsColorless } from '../lib/manaBase.js';

describe('support profiles', () => {
  it('routes parasitic themes to bespoke support archetypes', () => {
    expect(getSupportPlan('Auras', 'theme').id).toBe('auras');
    expect(getSupportPlan('Equipment', 'theme').id).toBe('equipment');
    expect(getSupportPlan('Vehicles', 'theme').id).toBe('vehicles');
    expect(getSupportPlan('Wall', 'typal').id).toBe('walls');
    expect(getSupportPlan('Buyback', 'mechanic').id).toBe('spellslinger');
  });

  it('gives Aura decks creature hosts so the deck cannot fall apart', () => {
    const tiers = getSupportPlan('Auras', 'theme').tiers;
    expect(tiers.some((t) => /creature/i.test(t.query) && t.creature === true)).toBe(true);
    expect(tiers.some((t) => /enchantress|whenever you cast an aura/i.test(t.query))).toBe(true);
  });

  it('gives Wall decks defender / toughness payoffs', () => {
    const tiers = getSupportPlan('Wall', 'typal').tiers;
    expect(tiers.some((t) => /defender/i.test(t.query))).toBe(true);
    expect(tiers.some((t) => /toughness/i.test(t.query))).toBe(true);
  });

  it('falls back to typal support for any creature type and keyword support otherwise', () => {
    const elf = getSupportPlan('Elf', 'typal');
    expect(elf.id).toBe('typal');
    expect(elf.tiers.some((t) => /changeling/i.test(t.query))).toBe(true);
    expect(getSupportPlan('Flying', 'mechanic').id).toBe('keyword');
  });

  it('infers instant and sorcery support from selected theme cards', () => {
    const tiers = inferSupportTiersFromCards([
      { name: 'Melek', type_line: 'Creature — Weird Wizard', oracle_text: 'Whenever you cast an instant or sorcery spell, copy it.' },
      { name: 'Spellgorger Weird', type_line: 'Creature — Weird', oracle_text: 'Whenever you cast a noncreature spell, put a +1/+1 counter on Spellgorger Weird.' },
    ]);
    expect(tiers.some((t) => /instant\/sorcery|instants and sorceries/i.test(t.label))).toBe(true);
    expect(tiers[0].query).toMatch(/type:instant|type:sorcery|-type:creature/);
  });

  it('infers forced-discard support for discard-matters payoffs (#48 Waste Not)', () => {
    const tiers = inferSupportTiersFromCards([
      { name: 'Waste Not', type_line: 'Enchantment', oracle_text: 'Whenever an opponent discards a creature card, create a 2/2 black Zombie creature token.' },
    ]);
    expect(tiers.some((t) => /opponent-discard|forced opponent discard/i.test(`${t.inferredLabel} ${t.label}`))).toBe(true);
    expect(tiers.some((t) => /discards/i.test(t.query))).toBe(true);
  });
});

describe('mana base colorless detection', () => {
  it('flags decks that need {C}', () => {
    expect(needsColorless([{ name: 'Devourer of Destiny', mana_cost: '{5}{C}{C}', type_line: 'Creature', oracle_text: '' }])).toBe(true);
    expect(needsColorless([{ name: 'Ulamog', mana_cost: '{10}', type_line: 'Creature', oracle_text: '{C}: do thing' }])).toBe(true);
    expect(needsColorless([{ name: 'Bear', mana_cost: '{1}{G}', type_line: 'Creature', oracle_text: 'Vanilla' }])).toBe(false);
  });
});
