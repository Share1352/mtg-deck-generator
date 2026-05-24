import { BASIC_BY_COLOR, SNOW_BASIC_BY_COLOR } from './constants.js';
import { countManaPips } from './manaPips.js';
import { calculateLandCount } from './manaValue.js';
import { colorIdentityWithin, isBasicLand, isPlayableAsLand, isPlayableMainDeckCard, sameCard, uniqueByOracle } from './filters.js';
import { randomCard, searchCards, ScryfallError } from './scryfallClient.js';

function isHardOutage(error) {
  if (error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429)) return true;
  return false;
}
import { exactOracleQuery } from './themeQueries.js';
import { themeKey } from './themePool.js';

const GENERIC_STAPLE_LANDS = new Set(['Evolving Wilds', 'Terramorphic Expanse', 'Reliquary Tower']);

const LAND_THEME_ALIASES = {
  lifegain: ['gain life', 'lifelink'],
  landfall: ['lands enter', 'land enters'],
  tokens: ['creature token', 'token'],
  aristocrats: ['sacrifice a creature', 'dies'],
  spellslinger: ['instant or sorcery', 'noncreature spell'],
  blink: ['exile', 'enters the battlefield'],
  graveyard: ['from your graveyard', 'mill'],
  ramp: ['search your library', 'mana'],
  artifacts: ['artifact'],
  enchantress: ['enchantment'],
  '+1/+1 counters': ['counter on', '+1/+1 counter'],
};

export function splitLandSlots(total) {
  return { basics: Math.ceil(total / 2), nonbasics: Math.floor(total / 2) };
}

export function allocateBasics(colors, basicSlots, pips, snowRequired = false) {
  const active = colors.length ? colors : ['C'];
  const totalPips = active.reduce((sum, c) => sum + (pips[c] || 0), 0);
  const counts = Object.fromEntries(active.map((c) => [c, 0]));
  for (let i = 0; i < basicSlots; i += 1) {
    const color = totalPips
      ? active.map((c) => ({ c, score: (pips[c] || 0) / totalPips * basicSlots - counts[c] })).sort((a, b) => b.score - a.score)[0].c
      : active[i % active.length];
    counts[color] += 1;
  }
  const snowCount = snowRequired ? Math.ceil(basicSlots * 0.3) : 0;
  const names = [];
  let snowLeft = snowCount;
  for (const c of active) for (let i = 0; i < counts[c]; i += 1) names.push((snowLeft-- > 0 ? SNOW_BASIC_BY_COLOR : BASIC_BY_COLOR)[c]);
  return names;
}

export function isUsefulFetchland(card, colors) {
  const text = card?.oracle_text || '';
  if (!/search your library/i.test(text)) return true;
  if (/basic land card/i.test(text)) return true;
  const landTypes = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };
  return colors.some((c) => new RegExp(landTypes[c], 'i').test(text));
}

async function makeBasic(name, logger) {
  const q = `!"${name}" include:extras -st:memorabilia -layout:art_series lang:en`;
  return randomCard(q, { logger });
}

function themeLandQuery(theme, colorQuery) {
  const key = themeKey(theme);
  if (!theme) return null;
  if (key === 'equipment' || key === 'equip') {
    return `(type:land (otag:equipment OR oracle:/\\bEquipment\\b/i OR oracle:/\\bequip\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  if (key === 'auras' || key === 'enchant' || key === 'enchantress') {
    return `(type:land (otag:auras OR oracle:/\\bAura\\b/i OR oracle:/\\benchantment\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  if (key === 'vehicles' || key === 'crew') {
    return `(type:land (otag:vehicles OR oracle:/\\bVehicle\\b/i OR keyword:crew)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  }
  const branches = [`otag:"${key}"`, exactOracleQuery(theme), `type:"${theme}"`];
  const aliases = LAND_THEME_ALIASES[key];
  if (aliases) for (const alias of aliases) branches.push(`oracle:/\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b/i`);
  return `(type:land (${branches.join(' OR ')})) type:land -type:basic ${colorQuery} game:paper lang:en`;
}

function shuffle(cards, rng = Math.random) {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function playableNonbasicLand(card, colors) {
  return !isBasicLand(card) && isPlayableAsLand(card) && isPlayableMainDeckCard(card) && colorIdentityWithin(card, colors) && isUsefulFetchland(card, colors);
}

export function filterPlayableLandPool(cards, colors, existing = []) {
  const out = [];
  for (const card of uniqueByOracle(cards || [])) {
    if (!playableNonbasicLand(card, colors)) continue;
    if (existing.some((e) => sameCard(e, card))) continue;
    if (out.some((x) => sameCard(x, card))) continue;
    out.push(card);
  }
  return out;
}

function appendUniqueLand(selected, card, colors, existing = []) {
  if (!playableNonbasicLand(card, colors)) return false;
  if ([...existing, ...selected].some((x) => sameCard(x, card))) return false;
  selected.push(card);
  return true;
}

export function selectNonbasicLandsFromPools({ themeCards = [], randomCards = [], colors = [], count = 0, existing = [], rng = Math.random }) {
  const selected = [];
  const themePool = shuffle(filterPlayableLandPool(themeCards, colors, existing), rng);
  for (const c of themePool) {
    if (selected.length >= count) break;
    appendUniqueLand(selected, c, colors, existing);
  }
  const randomPool = shuffle(filterPlayableLandPool(randomCards, colors, existing), rng);
  for (const c of randomPool.filter((card) => !GENERIC_STAPLE_LANDS.has(card.name))) {
    if (selected.length >= count) break;
    appendUniqueLand(selected, c, colors, existing);
  }
  return uniqueByOracle(selected).slice(0, count);
}

async function randomCompatibleNonbasics(genericQuery, count, colors, existing, logger) {
  const cards = [];
  const seen = new Set();
  const targetUnique = Math.max(count * 2, count + 6);
  const maxAttempts = Math.min(50, Math.max(targetUnique * 2, 24));
  let attempts = 0;
  let rejectedFilter = 0;
  let rejectedDup = 0;
  while (attempts < maxAttempts && cards.length < targetUnique) {
    attempts += 1;
    const card = await randomCard(genericQuery, { logger });
    const id = card?.oracle_id || card?.name;
    if (id && seen.has(id)) { rejectedDup += 1; continue; }
    if (id) seen.add(id);
    if (!playableNonbasicLand(card, colors)) { rejectedFilter += 1; continue; }
    if (existing.some((e) => sameCard(e, card))) { rejectedDup += 1; continue; }
    cards.push(card);
  }
  logger?.line(`Random nonbasic land sampling: ${attempts} Scryfall /cards/random calls, ${cards.length} playable candidates kept (${rejectedFilter} filtered, ${rejectedDup} duplicates) for ${count} slot(s).`);
  return cards;
}

async function getNonbasics({ colors, theme, count, existing = [], logger, rng = Math.random }) {
  const colorQuery = colors.length ? `id<=${colors.join('')}` : 'id:c';
  const genericQuery = `type:land -type:basic ${colorQuery} game:paper lang:en`;
  const themeCards = [];
  const directLandQuery = themeLandQuery(theme, colorQuery);
  if (directLandQuery) {
    try { themeCards.push(...await searchCards(directLandQuery, { order: 'edhrec', limit: 100, logger })); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme non-basic lands', e); }
  }
  const playableThemeCards = filterPlayableLandPool(themeCards, colors, existing);
  const rejectedThemeCards = uniqueByOracle(themeCards).filter((card) => !colorIdentityWithin(card, colors));
  logger?.line(`Theme-related nonbasic lands found: ${playableThemeCards.length}`);
  logger?.line(`Theme-related nonbasic lands rejected by color identity: ${rejectedThemeCards.map((c) => c.name).join(', ') || 'none'}`);

  let selected = selectNonbasicLandsFromPools({ themeCards: playableThemeCards, colors, count, existing, rng });
  logger?.line(`Theme-related nonbasic lands added: ${selected.map((c) => c.name).join(', ') || 'none'}`);
  if (selected.length < count) {
    logger?.line(`Theme-synergistic non-basic lands exhausted after ${selected.length}/${count}; filling remaining land slots with absolutely random color-compatible non-basics from Scryfall.`);
    const randomCards = await randomCompatibleNonbasics(genericQuery, count - selected.length, colors, [...existing, ...selected], logger);
    selected = selectNonbasicLandsFromPools({ themeCards: selected, randomCards, colors, count, existing, rng });
  }
  if (selected.length < count) {
    throw new Error(
      `Could not assemble ${count} non-basic lands online for ${theme || 'this deck'} (got ${selected.length}). Online card databases must be reachable to build a mana base.`,
    );
  }
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
