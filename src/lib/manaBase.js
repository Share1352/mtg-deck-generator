import { BASIC_BY_COLOR, SNOW_BASIC_BY_COLOR } from './constants.js';
import { countManaPips } from './manaPips.js';
import { calculateLandCount } from './manaValue.js';
import { colorIdentityWithin, isPlayableMainDeckCard, uniqueByOracle } from './filters.js';
import { namedCard, randomCard, searchCards } from './scryfallClient.js';
import { getSynergyCardsForTag } from './edhrecClient.js';
import { exactOracleQuery } from './themeQueries.js';
import { themeKey } from './themePool.js';
const fallbackBasics = { Plains: ['SLD', '101'], Island: ['SLD', '102'], Swamp: ['SLD', '103'], Mountain: ['SLD', '104'], Forest: ['SLD', '105'], Wastes: ['OGW', '184'], 'Snow-Covered Plains': ['KHM', '276'], 'Snow-Covered Island': ['KHM', '278'], 'Snow-Covered Swamp': ['KHM', '280'], 'Snow-Covered Mountain': ['KHM', '282'], 'Snow-Covered Forest': ['KHM', '284'], 'Snow-Covered Wastes': ['MH1', '250'] };
export function splitLandSlots(total) { return { basics: Math.ceil(total / 2), nonbasics: Math.floor(total / 2) }; }
export function allocateBasics(colors, basicSlots, pips, snowRequired = false) {
  const active = colors.length ? colors : ['C'];
  const totalPips = active.reduce((sum, c) => sum + (pips[c] || 0), 0);
  const counts = Object.fromEntries(active.map((c) => [c, 0]));
  for (let i = 0; i < basicSlots; i += 1) {
    const color = totalPips ? active.map((c) => ({ c, score: (pips[c] || 0) / totalPips * basicSlots - counts[c] })).sort((a, b) => b.score - a.score)[0].c : active[i % active.length];
    counts[color] += 1;
  }
  const snowCount = snowRequired ? Math.ceil(basicSlots * 0.3) : 0;
  const names = [];
  let snowLeft = snowCount;
  for (const c of active) for (let i = 0; i < counts[c]; i += 1) names.push((snowLeft-- > 0 ? SNOW_BASIC_BY_COLOR : BASIC_BY_COLOR)[c]);
  return names;
}
export function isUsefulFetchland(card, colors) {
  const text = card.oracle_text || '';
  if (!/search your library/i.test(text)) return true;
  if (/basic land card/i.test(text)) return true;
  const landTypes = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };
  return colors.some((c) => new RegExp(landTypes[c], 'i').test(text));
}
async function makeBasic(name, logger) {
  try {
    const q = `!"${name}" include:extras unique:prints lang:en`;
    const card = await randomCard(q, { logger });
    return card;
  } catch (error) {
    logger?.error(`random basic ${name}`, error);
    const [set, collector_number] = fallbackBasics[name] || ['SLD', '999'];
    return { name, type_line: 'Basic Land', set, collector_number, lang: 'en', color_identity: [], oracle_id: `${name}-fallback` };
  }
}

function themeLandQuery(theme, colorQuery) {
  const key = themeKey(theme);
  if (!theme) return null;
  if (key === 'equipment' || key === 'equip') {
    return `(type:land (oracle:/\\bEquipment\\b/i OR oracle:/\\bartifact\\b/i OR oracle:/\\battach\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  if (key === 'auras' || key === 'enchant' || key === 'enchantress') {
    return `(type:land (oracle:/\\bAura\\b/i OR oracle:/\\benchantment\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  if (key === 'vehicles' || key === 'crew') {
    return `(type:land (oracle:/\\bVehicle\\b/i OR oracle:/\\bartifact\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  return `(type:land ${exactOracleQuery(theme)}) type:land -type:basic ${colorQuery} game:paper lang:en`;
}

async function edhrecLandCards(theme, logger) {
  const names = await getSynergyCardsForTag(theme);
  const cards = [];
  for (const name of names) {
    try {
      const card = await namedCard(name, { logger });
      if (/Land/.test(card?.type_line || '')) cards.push(card);
    } catch (e) { logger?.error(`EDHREC land named card ${name}`, e); }
  }
  return cards;
}
async function getNonbasics({ colors, theme, count, existing = [], logger }) {
  const colorQuery = colors.length ? `id<=${colors.join('')}` : 'id:c';
  const genericQuery = `type:land -type:basic ${colorQuery} game:paper lang:en`;
  const desiredTheme = Math.min(count, Math.ceil(count * 0.75));
  let cards = [];
  try { cards = await edhrecLandCards(theme, logger); } catch (e) { logger?.error('EDHREC non-basic lands', e); }
  const directLandQuery = themeLandQuery(theme, colorQuery);
  if (directLandQuery) {
    try { cards.push(...await searchCards(directLandQuery, { order: 'edhrec', limit: 50, logger })); } catch (e) { logger?.error('theme non-basic lands', e); }
  }
  let selected = uniqueByOracle(cards.filter((c) => isPlayableMainDeckCard(c) && colorIdentityWithin(c, colors) && isUsefulFetchland(c, colors))).slice(0, desiredTheme);
  if (selected.length < desiredTheme) logger?.line('Theme-synergistic non-basic lands exhausted; filling remaining land slots from EDHREC-ranked compatible non-basics.');
  try { cards = await searchCards(genericQuery, { order: 'edhrec', limit: 100, logger }); } catch (e) { logger?.error('generic non-basic lands', e); cards = []; }
  for (const c of cards) {
    if (selected.length >= count) break;
    if ([...existing, ...selected].some((x) => x.oracle_id && x.oracle_id === c.oracle_id)) continue;
    if (isPlayableMainDeckCard(c) && colorIdentityWithin(c, colors) && isUsefulFetchland(c, colors)) selected.push(c);
  }
  while (selected.length < count) selected.push({ name: 'Evolving Wilds', type_line: 'Land', oracle_text: 'Search your library for a basic land card.', lang: 'en', color_identity: [], oracle_id: `fallback-evolving-${selected.length}` });
  return uniqueByOracle(selected).slice(0, count);
}
export async function buildManaBase(nonlands, colors, { theme = '', logger, rng = Math.random } = {}) {
  const { lands: landCount, average, virtualEntries, reason } = calculateLandCount(nonlands);
  const { basics, nonbasics } = splitLandSlots(landCount);
  const { pips, snowRequired } = countManaPips(nonlands);
  logger?.line(`Average mana value: ${average.toFixed(2)}`);
  logger?.line(`Virtual curve entries: ${virtualEntries}`);
  logger?.line(`Final land count: ${landCount}. Reason: ${reason}`);
  logger?.line(`Pip counts: ${JSON.stringify(pips)} snowRequired=${snowRequired}`);
  const basicNames = allocateBasics(colors, basics, pips, snowRequired);
  logger?.line(`Basic land allocation: ${basicNames.join(', ')}`);
  const basicCards = [];
  for (const name of basicNames) basicCards.push(await makeBasic(name, logger));
  const nonbasicCards = await getNonbasics({ colors, theme, count: nonbasics, existing: nonlands, logger, rng });
  logger?.line(`Non-basic land allocation: ${nonbasicCards.map((c) => c.name).join(', ')}`);
  return [...basicCards, ...nonbasicCards];
}
