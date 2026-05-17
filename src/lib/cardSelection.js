import { getSynergyCardsForTag } from './edhrecClient.js';
import { namedCard, searchCards } from './scryfallClient.js';
import { buildThemeQuery, getHostQuery } from './themeQueries.js';
import { chooseDeckColors, maybeExpandColors } from './colorEngine.js';
import { colorIdentityWithin, isCreature, isPlayableMainDeckCard, uniqueByOracle, sameCard } from './filters.js';
import { shuffle } from './random.js';

function addIfValid(selected, card, colors, source, logger, sources) {
  if (selected.length >= 23) return false;
  if (!isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false })) return false;
  if (!colorIdentityWithin(card, colors)) return false;
  if (selected.some((c) => sameCard(c, card))) return false;
  selected.push(card);
  sources.set(card.name, source);
  logger?.line(`${source.section} card added: ${card.name} / source: ${source.source} / reason: ${source.reason}`);
  return true;
}
async function fetchNames(names, logger) {
  const cards = [];
  for (const name of names) {
    try { cards.push(await namedCard(name, { logger })); } catch (e) { logger?.error(`EDHREC named card ${name}`, e); }
  }
  return cards;
}
async function themePoolCards(theme, logger) {
  const queries = [buildThemeQuery(theme.name || theme), getHostQuery(theme.name || theme)].filter(Boolean);
  const cards = [];
  for (const q of queries) {
    try { cards.push(...await searchCards(`${q} game:paper lang:en`, { limit: 120, logger })); } catch (e) { logger?.error(`theme pool query ${q}`, e); }
  }
  return uniqueByOracle(cards.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false })));
}
export async function selectCardsForTheme(theme, { logger, rng = Math.random } = {}) {
  const name = theme.name || theme;
  const synergyNames = await getSynergyCardsForTag(name);
  logger?.line(`EDHREC high-synergy cache found for ${name}: ${synergyNames.length ? 'yes' : 'no'}`);
  if (!synergyNames.length) logger?.line(`No cached EDHREC high-synergy data found for ${name}. Using Scryfall otag/mechanical fallback instead.`);
  const edhrecCards = await fetchNames(synergyNames, logger);
  const pool = uniqueByOracle([...edhrecCards, ...await themePoolCards(theme, logger)]);
  logger?.line(`Theme pool valid cards: ${pool.length}`);
  let colorResult = chooseDeckColors(pool, { rng, logger });
  let expansion = maybeExpandColors({ chosenColors: colorResult.colors, allCards: pool, needed: 23, logger });
  const colors = expansion.colors;
  const selected = [];
  const sources = new Map();
  const addMany = (cards, section, source, targetCreature, limit) => {
    for (const card of shuffle(cards, rng)) {
      if (selected.length >= limit) break;
      if (targetCreature !== null && isCreature(card) !== targetCreature) continue;
      addIfValid(selected, card, colors, { section, source, reason: targetCreature === true ? 'creature/payoff target' : targetCreature === false ? 'non-creature support target' : 'theme match' }, logger, sources);
    }
  };
  const legalEdhrec = edhrecCards.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false }));
  addMany(legalEdhrec, 'Core', 'EDHREC high synergy cache', true, 5);
  addMany(legalEdhrec, 'Core', 'EDHREC high synergy cache', false, 12);
  addMany(pool, 'Core', synergyNames.length ? 'EDHREC related/Scryfall fallback' : 'Scryfall otag/mechanical fallback', null, 12);
  if (selected.length < 12) logger?.line(`Core shortfall: selected ${selected.length}/12 after fallback hierarchy.`);
  const randomPool = pool.filter((c) => !selected.some((s) => sameCard(s, c)));
  addMany(randomPool, 'Random all-time', 'Scryfall local shuffled theme pool', null, 23);
  if (selected.length < 23) {
    const host = getHostQuery(name);
    if (host) {
      logger?.line(`Parasitic host injection query used for ${name}: ${host}`);
      try { addMany(await searchCards(`${host} id<=${colors.join('')} game:paper lang:en`, { limit: 80, logger }), 'Random all-time', 'parasitic host/payoff injector', null, 23); } catch (e) { logger?.error('host injector', e); }
    }
  }
  if (selected.length < 23) {
    logger?.line(`Narrow theme-adjacent fallback needed: ${selected.length}/23.`);
    try { addMany(await searchCards(`id<=${colors.join('')} game:paper lang:en -type:land`, { order: 'random', limit: 100, logger }), 'Random all-time', 'narrow color-locked fallback', null, 23); } catch (e) { logger?.error('narrow fallback', e); }
  }
  if (selected.length < 23) throw new Error(`Could not build 23 non-land cards for ${name}; got ${selected.length}`);
  const core = selected.slice(0, 12);
  const random = selected.slice(12, 23);
  logger?.line(`Selected 12 core cards: ${core.map((c) => c.name).join(', ')}`);
  logger?.line(`Selected 11 random/fallback cards: ${random.map((c) => c.name).join(', ')}`);
  return { nonlands: selected.slice(0, 23), core, random, colors, colorResult, sources };
}
