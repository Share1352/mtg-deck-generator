import { describe, expect, it } from 'vitest';
import { allocateBasics, buildManaBase, isUsefulFetchland, selectNonbasicLandsFromPools, splitLandSlots } from '../lib/manaBase.js';
import { _resetScryfallCache } from '../lib/scryfallClient.js';
import { _resetEdhrecCache } from '../lib/edhrecClient.js';

function landCard(name, color_identity = [], oracle_text = 'Add mana.') {
  return {
    name,
    type_line: 'Land',
    oracle_text,
    color_identity,
    lang: 'en',
    layout: 'normal',
    set: 'tst',
    collector_number: String(100 + name.length),
    oracle_id: `id-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  };
}

function basicCard(name) {
  return {
    name,
    type_line: `Basic Land — ${name.replace('Snow-Covered ', '')}`,
    oracle_text: 'Add mana.',
    color_identity: [],
    lang: 'en',
    layout: 'normal',
    set: 'tst',
    collector_number: '1',
    oracle_id: `basic-${name}`,
  };
}

function makeMockFetch({ randomLands = [], searchLands = [], basicByName = {} } = {}) {
  let randomCursor = 0;
  return async (url) => {
    const u = new URL(url);
    const path = u.pathname;
    if (path === '/cards/random') {
      const q = u.searchParams.get('q') || '';
      const basicMatch = q.match(/!"([^"]+)"/);
      if (basicMatch && basicByName[basicMatch[1]]) {
        return { ok: true, status: 200, json: async () => basicByName[basicMatch[1]] };
      }
      if (!randomLands.length) return { ok: false, status: 503, json: async () => ({}) };
      const card = randomLands[randomCursor % randomLands.length];
      randomCursor += 1;
      return { ok: true, status: 200, json: async () => card };
    }
    if (path === '/cards/search') {
      return { ok: true, status: 200, json: async () => ({ data: searchLands, has_more: false }) };
    }
    if (path === '/cards/named') {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    if (path.startsWith('/pages/')) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
}

describe('mana base helpers', () => {
  it('splits lands 50/50 with extra basic', () => {
    expect(splitLandSlots(21)).toEqual({ basics: 11, nonbasics: 10 });
    expect(splitLandSlots(22)).toEqual({ basics: 11, nonbasics: 11 });
  });

  it('allocates basics by pips and snow conversion', () => {
    const basics = allocateBasics(['W', 'G'], 10, { W: 8, G: 2 }, true);
    expect(basics.filter((n) => /Plains/.test(n)).length).toBeGreaterThan(basics.filter((n) => /Forest/.test(n)).length);
    expect(basics.filter((n) => n.startsWith('Snow-Covered')).length).toBe(3);
  });

  it('builds a mana base entirely from online Scryfall responses', async () => {
    _resetScryfallCache();
    _resetEdhrecCache();
    const original = globalThis.fetch;
    const randomLands = ['Tranquil Cove', 'Meandering River', 'Coastal Tower', 'Azorius Chancery', 'Glacial Fortress', 'Skybridge Towers', 'Port Town', 'Hallowed Fountain', 'Mystic Gate', 'Adarkar Wastes', 'Seachrome Coast', 'Prairie Stream'].map((n) => landCard(n, ['W', 'U']));
    const basicByName = {
      Plains: basicCard('Plains'),
      Island: basicCard('Island'),
      Swamp: basicCard('Swamp'),
      Mountain: basicCard('Mountain'),
      Forest: basicCard('Forest'),
    };
    globalThis.fetch = makeMockFetch({ randomLands, basicByName });
    const nonlands = Array.from({ length: 23 }, (_, i) => ({
      name: `Spell ${i}`,
      type_line: 'Creature',
      mana_cost: '{2}{W}',
      color_identity: ['W'],
      oracle_id: `spell-${i}`,
      lang: 'en',
    }));
    let lands;
    try {
      lands = await buildManaBase(nonlands, ['W', 'U'], { theme: '', rng: () => 0.42 });
    } finally {
      globalThis.fetch = original;
    }
    const nonbasics = lands.filter((card) => !/^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$/.test(card.name));
    const basics = lands.filter((card) => /^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$/.test(card.name));
    expect(nonbasics.length).toBeGreaterThanOrEqual(8);
    expect(basics.length).toBeGreaterThanOrEqual(8);
    expect(new Set(nonbasics.map((c) => c.name)).size).toBe(nonbasics.length);
  });

  it('uses theme-fitting non-basic lands before random compatible lands', () => {
    const picked = selectNonbasicLandsFromPools({
      themeCards: [landCard('Theme Grove', ['G']), landCard('Off-color Theme', ['U'])],
      randomCards: [landCard('Random Grove', ['G']), landCard('Evolving Wilds', [], 'Search your library for a basic land card.')],
      colors: ['G'],
      count: 2,
      rng: () => 0.99,
    }).map((card) => card.name);

    expect(picked).toContain('Theme Grove');
    expect(picked).toContain('Random Grove');
    expect(picked).not.toContain('Off-color Theme');
    expect(picked).not.toContain('Evolving Wilds');
  });

  it('rejects off-color fetchlands', () => {
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a Mountain or Forest card.' }, ['U'])).toBe(false);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for an Island or Swamp card.' }, ['U'])).toBe(true);
    expect(isUsefulFetchland({ oracle_text: 'Search your library for a basic land card.' }, ['W'])).toBe(true);
  });

  it('drops commander-only lands that slip into the random fallback pool', async () => {
    _resetScryfallCache();
    _resetEdhrecCache();
    const original = globalThis.fetch;
    const pool = [
      landCard('Command Beacon', [], '{T}: Add {C}. {T}, Sacrifice this land: Put your commander into your hand from the command zone.'),
      ...['Bonders\' Enclave', 'War Room', 'Mirrex', 'Demolition Field', 'Crystal Grotto', 'Hidden Grotto', 'Mishra\'s Factory', 'Roadside Reliquary', 'Hall of Storm Giants', 'Cave of the Frost Dragon', 'Den of the Bugbear', 'Eiganjo, Seat of the Empire', 'Castle Ardenvale', 'Otawara, Soaring City', 'Sokenzan, Crucible of Defiance'].map((n) => landCard(n, [], 'Add {C}.')),
    ];
    const basicByName = {
      Plains: basicCard('Plains'), Island: basicCard('Island'), Swamp: basicCard('Swamp'), Mountain: basicCard('Mountain'), Forest: basicCard('Forest'),
    };
    globalThis.fetch = makeMockFetch({ randomLands: pool, basicByName });
    const nonlands = Array.from({ length: 23 }, (_, i) => ({ name: `Spell ${i}`, type_line: 'Creature', mana_cost: '{2}{W}', color_identity: ['W'], oracle_id: `spell-${i}`, lang: 'en' }));
    let lands;
    try {
      lands = await buildManaBase(nonlands, ['W'], { theme: '', rng: () => 0.42 });
    } finally {
      globalThis.fetch = original;
    }
    expect(lands.map((c) => c.name)).not.toContain('Command Beacon');
  });

  it('samples a wide unique pool when filling random non-basic land slots', () => {
    const picked = selectNonbasicLandsFromPools({
      themeCards: [],
      randomCards: Array.from({ length: 30 }, (_, i) => landCard(`Random Land ${i}`, ['G'])),
      colors: ['G'],
      count: 10,
      rng: () => 0.31,
    });
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((c) => c.name)).size).toBe(10);
  });
});
