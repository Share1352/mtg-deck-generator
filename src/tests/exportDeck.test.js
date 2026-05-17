import { describe, expect, it } from 'vitest';
import { exportDeck } from '../lib/exportDeck.js';
import { validateDeck } from '../lib/validation.js';
describe('export and validation', () => {
  it('exports basics with set/collector and strips A- prefix', () => {
    const text = exportDeck({ nonlands: [{ name: 'A-Goldspan Dragon' }, { name: 'Mirrorhall Mimic // Ghastly Mimicry' }], lands: [{ name: 'Forest', type_line: 'Basic Land — Forest', set: 'blb', collector_number: '378' }] });
    expect(text).toContain('1 Goldspan Dragon');
    expect(text).toContain('1 Mirrorhall Mimic // Ghastly Mimicry');
    expect(text).toContain('1 Forest (BLB) 378');
  });
  it('validates exact deck counts', () => {
    const nonlands = Array.from({ length: 23 }, (_, i) => ({ name: `Spell ${i}`, type_line: 'Creature', layout: 'normal', lang: 'en', color_identity: [], oracle_id: `s${i}` }));
    const lands = Array.from({ length: 20 }, (_, i) => ({ name: 'Forest', type_line: 'Basic Land — Forest', layout: 'normal', lang: 'en', color_identity: [], oracle_id: `b${i}` }));
    expect(validateDeck({ nonlands, lands }).ok).toBe(true);
  });
});
