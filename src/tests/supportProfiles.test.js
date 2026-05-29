import { describe, expect, it } from 'vitest';
import { getSupportPlan } from '../lib/supportProfiles.js';
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
});

describe('mana base colorless detection', () => {
  it('flags decks that need {C}', () => {
    expect(needsColorless([{ name: 'Devourer of Destiny', mana_cost: '{5}{C}{C}', type_line: 'Creature', oracle_text: '' }])).toBe(true);
    expect(needsColorless([{ name: 'Ulamog', mana_cost: '{10}', type_line: 'Creature', oracle_text: '{C}: do thing' }])).toBe(true);
    expect(needsColorless([{ name: 'Bear', mana_cost: '{1}{G}', type_line: 'Creature', oracle_text: 'Vanilla' }])).toBe(false);
  });
});
