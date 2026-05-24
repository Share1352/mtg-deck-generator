import { describe, expect, it } from 'vitest';
import { detectFamilies, getThemeFamilyQueries, getFamilyLabels } from '../lib/themeFamilies.js';

describe('detectFamilies', () => {
  it('maps Descend to graveyard-fill family', () => {
    expect(detectFamilies('Descend')).toEqual(['graveyardFill']);
  });

  it('maps Threshold/Delirium/Dredge/Flashback to graveyard-fill', () => {
    for (const t of ['Threshold', 'Delirium', 'Dredge', 'Escape', 'Unearth', 'Embalm', 'Eternalize']) {
      expect(detectFamilies(t)).toContain('graveyardFill');
    }
  });

  it('maps Landfall to lands family', () => {
    expect(detectFamilies('Landfall')).toEqual(['lands']);
  });

  it('maps Lifegain to lifegain family', () => {
    expect(detectFamilies('Lifegain')).toEqual(['lifegain']);
  });

  it('maps Tokens / Populate / Amass to tokens family', () => {
    for (const t of ['Tokens', 'Populate', 'Amass', 'Fabricate']) {
      expect(detectFamilies(t)).toContain('tokens');
    }
  });

  it('maps Riot to attack + counters families', () => {
    const families = detectFamilies('Riot');
    expect(families).toContain('attack');
    expect(families).toContain('counters');
  });

  it('maps Blink/Flicker to etb family', () => {
    expect(detectFamilies('Blink')).toEqual(['etb']);
    expect(detectFamilies('Flicker')).toEqual(['etb']);
  });

  it('maps Mill / Surveil to mill + graveyardFill', () => {
    for (const t of ['Mill', 'Surveil']) {
      const families = detectFamilies(t);
      expect(families).toContain('mill');
      expect(families).toContain('graveyardFill');
    }
  });

  it('maps Treasure / Clue / Food to artifacts family', () => {
    expect(detectFamilies('Treasure')).toContain('artifacts');
    expect(detectFamilies('Clue')).toContain('artifacts');
    expect(detectFamilies('Food')).toContain('artifacts');
  });

  it('maps Prowess / Magecraft / Storm / Cascade to spells-matter family', () => {
    for (const t of ['Prowess', 'Magecraft', 'Storm', 'Cascade']) {
      expect(detectFamilies(t)).toContain('spellsMatter');
    }
  });

  it('maps Aristocrats / Exploit / Blitz to sacrifice family', () => {
    expect(detectFamilies('Aristocrats')).toContain('sacrifice');
    expect(detectFamilies('Exploit')).toContain('sacrifice');
    expect(detectFamilies('Blitz')).toContain('sacrifice');
  });

  it('maps Proliferate / Adapt / Evolve to counters family', () => {
    for (const t of ['Proliferate', 'Adapt', 'Evolve', 'Outlast']) {
      expect(detectFamilies(t)).toContain('counters');
    }
  });

  it('returns empty array for unknown unrelated theme', () => {
    expect(detectFamilies('Zzyzx')).toEqual([]);
  });

  it('uses heuristic match when theme not in direct map', () => {
    expect(detectFamilies('Self-Mill')).toContain('mill');
  });

  it('accepts theme object with name property', () => {
    expect(detectFamilies({ name: 'Descend' })).toEqual(['graveyardFill']);
  });
});

describe('getThemeFamilyQueries', () => {
  it('returns Scryfall queries for Descend including graveyard enablers + payoffs', () => {
    const queries = getThemeFamilyQueries('Descend');
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.some((q) => q.role === 'enabler')).toBe(true);
    expect(queries.some((q) => q.role === 'payoff')).toBe(true);
    expect(queries.every((q) => q.family === 'graveyardFill')).toBe(true);
    expect(queries.some((q) => /mill|graveyard|sacrifice|discard/.test(q.query))).toBe(true);
  });

  it('returns empty list for theme with no detected families', () => {
    expect(getThemeFamilyQueries('Zzyzx')).toEqual([]);
  });

  it('combines enablers from multiple families for multi-family themes', () => {
    const queries = getThemeFamilyQueries('Blitz');
    const families = new Set(queries.map((q) => q.family));
    expect(families.has('sacrifice')).toBe(true);
    expect(families.has('attack')).toBe(true);
    expect(families.has('graveyardFill')).toBe(true);
  });
});

describe('getFamilyLabels', () => {
  it('returns readable labels for Descend', () => {
    expect(getFamilyLabels('Descend')).toEqual(['graveyard-fill']);
  });

  it('returns multiple labels for multi-family theme', () => {
    const labels = getFamilyLabels('Blitz');
    expect(labels).toContain('sacrifice-aristocrats');
    expect(labels).toContain('attack-triggers');
    expect(labels).toContain('graveyard-fill');
  });
});
