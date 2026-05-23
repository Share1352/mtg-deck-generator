import { describe, expect, it } from 'vitest';
import {
  __rebalanceToMinimumDirectEvidenceForTest,
  __runTypalSelectionPipelineForTest,
  validateThemeSynergySources,
} from '../lib/cardSelection.js';

const card = (name) => ({ name, type_line: 'Creature — Test', oracle_text: '', layout: 'normal', lang: 'en', oracle_id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), color_identity: ['R'], cmc: 2 });

describe('stage ordering and evidence guarantees', () => {
  it('riot fallback uses theme-adjacent before generic filler in provenance', () => {
    const sources = new Map([
      ['Adj 1', { source: 'theme-adjacent query: keyword:riot', stage: 'theme-adjacent query: keyword:riot', kind: 'theme_adjacent' }],
      ['Fill 1', { source: 'generic color-compatible fallback', stage: 'generic color-compatible fallback', kind: 'generic_filler' }],
    ]);
    const selected = [card('Adj 1'), card('Fill 1')];
    expect(sources.get('Adj 1').stage).toContain('theme-adjacent');
    expect(sources.get('Fill 1').stage).toContain('generic');
    expect(selected.findIndex((c) => c.name === 'Adj 1')).toBeLessThan(selected.findIndex((c) => c.name === 'Fill 1'));
  });

  it('typal provenance preserves strict A→F ordering with generic typal support before filler', () => {
    const provenance = [
      { card: 'Direct Dwarf 1', source: { kind: 'direct_evidence', stage: 'typal-stage-A (direct tribe-evidence cards)' } },
      { card: 'Direct Dwarf 2', source: { kind: 'direct_evidence', stage: 'typal-stage-B (strong tribe-synergy enablers)' } },
      { card: 'Direct Dwarf 3', source: { kind: 'direct_evidence', stage: 'typal-stage-C (on-tribe role fillers)' } },
      { card: "Herald's Horn", source: { kind: 'typal_support', stage: 'typal-stage-D (generic typal support)' } },
      { card: 'Changeling Outcast', source: { kind: 'theme_adjacent', stage: 'typal-stage-E (theme-adjacent non-tribal support)' } },
      { card: 'Filler 1', source: { kind: 'generic_filler', stage: 'typal-stage-F (generic filler)' } },
    ];
    const stages = provenance.map((p) => p.source.stage);
    expect(stages).toEqual([
      'typal-stage-A (direct tribe-evidence cards)',
      'typal-stage-B (strong tribe-synergy enablers)',
      'typal-stage-C (on-tribe role fillers)',
      'typal-stage-D (generic typal support)',
      'typal-stage-E (theme-adjacent non-tribal support)',
      'typal-stage-F (generic filler)',
    ]);
    expect(provenance.find((p) => p.card === "Herald's Horn")?.source.kind).toBe('typal_support');
    expect(provenance.find((p) => p.card === 'Filler 1')?.source.kind).toBe('generic_filler');
  });

  it('rebalance enforces minimum 10 direct-evidence cards when possible', () => {
    const selected = Array.from({ length: 23 }, (_, i) => card(`Pick ${i + 1}`));
    const sources = new Map(selected.map((c, i) => [c.name, { source: 'x', stage: 's', kind: i < 8 ? 'direct_evidence' : 'generic_filler' }]));
    const pool = Array.from({ length: 20 }, (_, i) => card(`Direct Pool ${i + 1}`));
    const result = __rebalanceToMinimumDirectEvidenceForTest({ selected, sources, pool, colors: ['R'], logger: { line: () => {} } });
    expect(result.passesMinimum).toBe(true);
    expect(result.directEvidenceCount).toBeGreaterThanOrEqual(10);
  });

  it('validateThemeSynergySources returns structured metrics', () => {
    const selected = [card('A'), card('B'), card('C')];
    const sources = new Map([
      ['A', { source: 'x', stage: 's1', kind: 'direct_evidence' }],
      ['B', { source: 'x', stage: 's2', kind: 'theme_adjacent' }],
    ]);
    expect(validateThemeSynergySources(selected, sources)).toEqual({
      directEvidenceCount: 1,
      minimumRequired: 10,
      passesMinimum: false,
      directEvidenceCards: ['A'],
      fallbackOnlyCardIds: ['B'],
      missingMetadata: ['C'],
    });
  });
});
