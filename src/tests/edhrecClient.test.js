import { describe, expect, it } from 'vitest';
import { canonicalSynergyTag, slugifyTheme, getSynergyCardsForTag, getAllEdhrecThemes, _resetEdhrecCache } from '../lib/edhrecClient.js';

function withMockFetch(routes, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    const match = routes[path];
    if (!match) return { ok: false, status: 404, json: async () => ({}) };
    if (typeof match === 'function') return match();
    return { ok: true, status: 200, json: async () => match };
  };
  return Promise.resolve(fn()).finally(() => { globalThis.fetch = original; });
}

describe('EDHREC online client', () => {
  it('canonicalizes mechanic aliases for matching EDHREC pages', () => {
    expect(canonicalSynergyTag('Equip')).toBe('equipment');
    expect(canonicalSynergyTag('Crew')).toBe('vehicles');
    expect(canonicalSynergyTag('Flying')).toBe('Flying');
  });

  it('slugifies theme names for EDHREC URLs', () => {
    expect(slugifyTheme('Equipment')).toBe('equipment');
    expect(slugifyTheme("+1/+1 Counters")).toBe('1-1-counters');
    expect(slugifyTheme("Hexproof from")).toBe('hexproof-from');
  });

  it('fetches synergy cards online and orders high-synergy section before broader pools', async () => {
    _resetEdhrecCache();
    await withMockFetch({
      '/pages/themes/equipment.json': {
        container: {
          json_dict: {
            card_lists: [
              { header: 'High Synergy Cards', cardviews: [{ name: 'Puresteel Paladin', synergy: 0.7 }, { name: 'Sram, Senior Edificer', synergy: 0.6 }] },
              { header: 'Top Cards', cardviews: [{ name: 'Sol Ring', synergy: 0.4 }] },
              { header: 'Top Commanders', cardviews: [{ name: 'Sram Commander Edition', synergy: 0 }] },
            ],
          },
        },
      },
    }, async () => {
      const cards = await getSynergyCardsForTag('Equip');
      expect(cards).toContain('Puresteel Paladin');
      expect(cards).toContain('Sram, Senior Edificer');
      // Broader synergy pool (Top Cards) is now included for richer fallback.
      expect(cards).toContain('Sol Ring');
      // Commander sections are still excluded (noise for non-Commander deck).
      expect(cards).not.toContain('Sram Commander Edition');
      // High-synergy section must appear before Top Cards in the ordering.
      expect(cards.indexOf('Puresteel Paladin')).toBeLessThan(cards.indexOf('Sol Ring'));
    });
  });

  it('falls back to other category pages on 404 before failing', async () => {
    _resetEdhrecCache();
    await withMockFetch({
      '/pages/tribes/myr.json': {
        container: {
          json_dict: {
            card_lists: [
              { header: 'High Synergy Cards', cardviews: [{ name: 'Myr Battlesphere' }] },
            ],
          },
        },
      },
    }, async () => {
      const cards = await getSynergyCardsForTag('Myr');
      expect(cards).toContain('Myr Battlesphere');
    });
  });

  it('aggregates EDHREC theme/tribe/typal index pages into a themes list', async () => {
    _resetEdhrecCache();
    await withMockFetch({
      '/pages/themes.json': {
        container: {
          json_dict: {
            card_lists: [
              { header: 'Themes', cardviews: [{ name: 'Aristocrats' }, { name: 'Spellslinger' }] },
            ],
          },
        },
      },
      '/pages/tribes.json': {
        container: {
          json_dict: {
            card_lists: [
              { header: 'Tribes', cardviews: [{ name: 'Myr' }, { name: 'Mite' }] },
            ],
          },
        },
      },
    }, async () => {
      const themes = await getAllEdhrecThemes();
      const names = themes.map((t) => t.name);
      expect(names).toContain('Aristocrats');
      expect(names).toContain('Myr');
      expect(names).toContain('Mite');
    });
  });
});
