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
  it('rejects a deck whose land section contains a commander-only card', () => {
    const nonlands = Array.from({ length: 23 }, (_, i) => ({ name: `Spell ${i}`, type_line: 'Creature', layout: 'normal', lang: 'en', color_identity: [], oracle_id: `s${i}` }));
    const lands = [
      { name: 'Command Beacon', type_line: 'Land', layout: 'normal', lang: 'en', color_identity: [], oracle_id: 'cmd-beacon', oracle_text: '{T}, Sacrifice this land: Put your commander into your hand from the command zone.' },
      ...Array.from({ length: 19 }, (_, i) => ({ name: 'Forest', type_line: 'Basic Land — Forest', layout: 'normal', lang: 'en', color_identity: [], oracle_id: `b${i}` })),
    ];
    const result = validateDeck({ nonlands, lands });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/Command Beacon|invalid non-basic land/i);
  });
});
