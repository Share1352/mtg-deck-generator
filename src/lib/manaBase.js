import { BASIC_BY_COLOR, SNOW_BASIC_BY_COLOR } from './constants.js';
import { countManaPips } from './manaPips.js';
import { calculateLandCount } from './manaValue.js';
import { colorIdentityWithin, isBasicLand, isLand, isPlayableAsLand, isPlayableMainDeckCard, oracleText, sameCard, uniqueByOracle } from './filters.js';
import { referencedCardNames } from './synergyRules.js';
import { choice } from './random.js';
import { namedCard, randomCard, searchCards, ScryfallError } from './scryfallClient.js';
import { exactOracleQuery } from './themeQueries.js';
import { themeKey } from './themePool.js';

function isHardOutage(error) {
  return error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429);
}

const GENERIC_STAPLE_LANDS = new Set(['Evolving Wilds', 'Terramorphic Expanse', 'Reliquary Tower']);
const fallbackBasics = { Plains: ['SLD', '101'], Island: ['SLD', '102'], Swamp: ['SLD', '103'], Mountain: ['SLD', '104'], Forest: ['SLD', '105'], Wastes: ['OGW', '184'], 'Snow-Covered Plains': ['KHM', '276'], 'Snow-Covered Island': ['KHM', '278'], 'Snow-Covered Swamp': ['KHM', '280'], 'Snow-Covered Mountain': ['KHM', '282'], 'Snow-Covered Forest': ['KHM', '284'], 'Snow-Covered Wastes': ['MH1', '250'] };
const validBasicPrint = (c) => c && c.name && c.lang === 'en' && !c.digital && (c.image_uris || c.card_faces) && c.border_color !== 'gold' && c.set_type !== 'memorabilia' && c.layout !== 'art_series';

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

export function needsColorless(cards) {
  return cards.some((card) => {
    const cost = (card.card_faces || [card]).map((f) => f.mana_cost || '').join('');
    return /\{C\}/.test(cost) || /\{C\}/.test(oracleText(card));
  });
}

// ---- basic land art: one random expansion for the whole deck's coloured basics, re-rolled each generation ----
function fallbackBasicCard(name) {
  const [set, collector_number] = fallbackBasics[name] || ['SLD', '999'];
  return { name, type_line: `Basic ${/^Snow-Covered/.test(name) ? 'Snow ' : ''}Land`, set, collector_number, lang: 'en', color_identity: [], oracle_id: `${name}-fallback` };
}
async function fetchPrints(name, cache, logger) {
  if (cache.has(name)) return cache.get(name);
  let prints = [];
  try { prints = (await searchCards(`!"${name}" include:extras unique:prints lang:en`, { unique: 'prints', limit: 300, logger })).filter(validBasicPrint); }
  catch (e) { if (isHardOutage(e)) throw e; logger?.error(`basic prints ${name}`, e); }
  cache.set(name, prints);
  return prints;
}
async function buildBasics(basicNames, rng, logger) {
  const cache = new Map();
  const isShared = (n) => !/^Snow-Covered/.test(n) && n !== 'Wastes'; // snow/Wastes rarely share a coloured-basic set
  for (const name of new Set(basicNames)) await fetchPrints(name, cache, logger);
  const sharedNames = [...new Set(basicNames.filter(isShared))];
  let chosenSet = null;
  if (sharedNames.length) {
    const setLists = sharedNames.map((n) => new Set((cache.get(n) || []).map((c) => c.set)));
    const common = [...setLists[0]].filter((code) => setLists.every((s) => s.has(code)));
    if (common.length) chosenSet = choice(common, rng);
  }
  logger?.line(`Random basic-land art set: ${chosenSet ? chosenSet.toUpperCase() : 'mixed (no shared set found)'}`);
  const out = [];
  for (const name of basicNames) {
    const prints = cache.get(name) || [];
    let pick = null;
    if (chosenSet && isShared(name)) { const inSet = prints.filter((c) => c.set === chosenSet); if (inSet.length) pick = choice(inSet, rng); }
    if (!pick && prints.length) pick = choice(prints, rng);
    out.push(pick || fallbackBasicCard(name));
  }
  return out;
}

// ---- non-basic art: 30% chance to roll an alternative printing ----
async function maybeAltArt(card, rng, logger) {
  if (rng() >= 0.3) return card;
  try {
    const prints = (await searchCards(`!"${card.name}" unique:prints game:paper lang:en`, { unique: 'prints', limit: 40, logger }))
      .filter((p) => p.name === card.name && p.lang === 'en' && !p.digital && (p.image_uris || p.card_faces));
    if (prints.length > 1) { const pick = choice(prints, rng); logger?.line(`Alt art rolled for ${card.name}: ${(pick.set || '').toUpperCase()} ${pick.collector_number || ''}`); return pick; }
  } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`alt art ${card.name}`, e); }
  return card;
}

function landProducesColor(card, colors) {
  const text = oracleText(card);
  return colors.some((c) => new RegExp(`add[^.]*\\{${c}\\}`, 'i').test(text)) || /add one mana of any/i.test(text);
}

function themeLandQuery(theme, colorQuery) {
  const key = themeKey(theme);
  if (!theme) return null;
  if (key === 'equipment' || key === 'equip') return `(type:land (otag:equipment OR oracle:/\\bEquipment\\b/i OR oracle:/\\bequip\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  if (key === 'auras' || key === 'enchant' || key === 'enchantress') return `(type:land (otag:auras OR oracle:/\\bAura\\b/i OR oracle:/\\benchantment\\b/i)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  if (key === 'vehicles' || key === 'crew') return `(type:land (otag:vehicles OR oracle:/\\bVehicle\\b/i OR keyword:crew)) type:land -type:basic ${colorQuery} game:paper lang:en`;
  const branches = [`otag:"${key}"`, exactOracleQuery(theme), `type:"${theme}"`];
  const aliases = LAND_THEME_ALIASES[key];
  if (aliases) for (const alias of aliases) branches.push(`oracle:/\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b/i`);
  return `(type:land (${branches.join(' OR ')})) type:land -type:basic ${colorQuery} game:paper lang:en`;
}

function shuffle(cards, rng = Math.random) {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
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

async function randomCompatibleNonbasics(genericQuery, count, colors, existing, logger) {
  const cards = [];
  const seen = new Set();
  const targetUnique = Math.max(count * 2, count + 6);
  const maxAttempts = Math.min(50, Math.max(targetUnique * 2, 24));
  let attempts = 0;
  while (attempts < maxAttempts && cards.length < targetUnique) {
    attempts += 1;
    let card;
    try { card = await randomCard(genericQuery, { logger }); } catch (e) { if (isHardOutage(e)) throw e; continue; }
    const id = card?.oracle_id || card?.name;
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    if (!playableNonbasicLand(card, colors)) continue;
    if (existing.some((e) => sameCard(e, card))) continue;
    cards.push(card);
  }
  logger?.line(`Random nonbasic land sampling: ${attempts} /cards/random calls, ${cards.length} kept for ${count} slot(s).`);
  return cards;
}

async function getNonbasics({ colors, theme, count, colorlessNeed, snowNeed, existing = [], logger, rng = Math.random }) {
  if (count <= 0) return [];
  const colorQuery = colors.length ? `id<=${colors.join('')}` : 'id:c';
  const genericQuery = `type:land -type:basic ${colorQuery} game:paper lang:en`;
  const selected = [];

  const themeCards = [];
  const directLandQuery = themeLandQuery(theme, colorQuery);
  if (directLandQuery) {
    try { themeCards.push(...await searchCards(directLandQuery, { order: 'edhrec', limit: 100, logger })); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme non-basic lands', e); }
  }
  const playableThemeCards = filterPlayableLandPool(themeCards, colors, existing);
  logger?.line(`Theme-related nonbasic lands found: ${playableThemeCards.length}`);

  if (colors.length >= 2) {
    // TASK 3: ~80% of non-basics fix the deck's own colours, ~20% theme/utility lands.
    const inColorSlots = Math.round(count * 0.8);
    let fixers = [];
    try { fixers = await searchCards(genericQuery, { order: 'edhrec', limit: 175, logger }); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error('in-color fixers', e); }
    const fixerPool = filterPlayableLandPool(fixers, colors, existing).filter((c) => landProducesColor(c, colors));
    const colored = shuffle(fixerPool.filter((c) => (c.color_identity || []).some((ci) => colors.includes(ci))), rng);
    const rainbow = shuffle(fixerPool.filter((c) => !(c.color_identity || []).some((ci) => colors.includes(ci))), rng);
    for (const c of [...colored, ...rainbow]) { if (selected.length >= inColorSlots) break; appendUniqueLand(selected, c, colors, existing); }
    logger?.line(`In-color fixing non-basics: ${selected.length}/${inColorSlots}`);
    for (const c of shuffle(playableThemeCards, rng)) { if (selected.length >= count) break; appendUniqueLand(selected, c, colors, existing); }
  } else {
    // mono / colorless: at least ~30% theme-synergistic, then compatible.
    const themeWanted = Math.ceil(count * 0.3);
    for (const c of shuffle(playableThemeCards, rng)) { if (selected.length >= themeWanted) break; appendUniqueLand(selected, c, colors, existing); }
    if (selected.length < themeWanted) logger?.line('Not enough theme non-basic lands; filling with compatible non-basics.');
  }

  if (selected.length < count) {
    let generic = [];
    try { generic = await searchCards(genericQuery, { order: 'edhrec', limit: 175, logger }); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error('generic non-basics', e); }
    for (const c of shuffle(filterPlayableLandPool(generic, colors, [...existing, ...selected]).filter((c) => !GENERIC_STAPLE_LANDS.has(c.name)), rng)) {
      if (selected.length >= count) break; appendUniqueLand(selected, c, colors, existing);
    }
  }

  // Robustness: guarantee colorless {C} and snow sources so every ability is castable.
  if (colorlessNeed && colors.length && !selected.some((c) => /add[^.]*\{C\}/i.test(oracleText(c)))) {
    try { for (const c of await searchCards(`type:land -type:basic oracle:"add {C}" ${colorQuery} game:paper lang:en`, { order: 'edhrec', limit: 30, logger })) if (appendUniqueLand(selected, c, colors, existing)) break; }
    catch (e) { if (isHardOutage(e)) throw e; }
  }
  if (snowNeed && !selected.some((c) => /snow/i.test(oracleText(c)) || /snow/i.test(c.type_line || ''))) {
    try { for (const c of await searchCards(`(is:snow OR oracle:snow) type:land -type:basic ${colorQuery} game:paper lang:en`, { order: 'edhrec', limit: 30, logger })) if (appendUniqueLand(selected, c, colors, existing)) break; }
    catch (e) { if (isHardOutage(e)) throw e; }
  }

  if (selected.length < count) {
    const randomCards = await randomCompatibleNonbasics(genericQuery, count - selected.length, colors, [...existing, ...selected], logger);
    for (const c of shuffle(randomCards, rng)) { if (selected.length >= count) break; appendUniqueLand(selected, c, colors, existing); }
  }
  if (selected.length < count) throw new Error(`Could not assemble ${count} non-basic lands online for ${theme || 'this deck'} (got ${selected.length}). Online card databases must be reachable to build a mana base.`);
  return uniqueByOracle(selected).slice(0, count);
}

// ---- explicit land synergies: required lands from non-land cards + land-to-land deps (Urza tron, etc.) ----
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function freeLandSlot(landCards) {
  const idx = landCards.findIndex((l) => !isBasicLand(l) && GENERIC_STAPLE_LANDS.has(l.name));
  return idx >= 0 ? idx : landCards.findIndex((l) => !isBasicLand(l) && !referencedCardNames(l).length);
}
async function completeLandSynergies(landCards, requiredLands, colors, logger) {
  const present = (n) => landCards.some((l) => normName(l.name) === normName(n));
  for (const req of requiredLands || []) {
    if (!req || !isLand(req) || !colorIdentityWithin(req, colors) || present(req.name)) continue;
    const slot = freeLandSlot(landCards);
    if (slot >= 0) { logger?.line(`Required land added: ${req.name}.`); landCards[slot] = req; }
  }
  const tried = new Set();
  for (let pass = 0; pass < 4; pass += 1) {
    let added = false;
    for (const land of [...landCards]) {
      for (const refName of referencedCardNames(land)) {
        if (present(refName) || tried.has(normName(refName))) continue;
        tried.add(normName(refName));
        try {
          const partner = await namedCard(refName, { logger });
          if (partner && isLand(partner) && colorIdentityWithin(partner, colors) && !present(partner.name)) {
            const slot = freeLandSlot(landCards);
            if (slot >= 0) { logger?.line(`Land synergy: added ${partner.name} required by ${land.name}.`); landCards[slot] = partner; added = true; }
          }
        } catch (e) { if (isHardOutage(e)) throw e; if (e?.status !== 404) logger?.error(`land synergy ${refName}`, e); }
      }
    }
    if (!added) break;
  }
  return landCards;
}

export function selectNonbasicLandsFromPools({ themeCards = [], randomCards = [], colors = [], count = 0, existing = [], rng = Math.random }) {
  const selected = [];
  for (const c of shuffle(filterPlayableLandPool(themeCards, colors, existing), rng)) { if (selected.length >= count) break; appendUniqueLand(selected, c, colors, existing); }
  for (const c of shuffle(filterPlayableLandPool(randomCards, colors, existing), rng).filter((card) => !GENERIC_STAPLE_LANDS.has(card.name))) { if (selected.length >= count) break; appendUniqueLand(selected, c, colors, existing); }
  return uniqueByOracle(selected).slice(0, count);
}

export async function buildManaBase(nonlands, colors, { theme = '', requiredLands = [], logger, rng = Math.random } = {}) {
  const { lands: landCount, average, virtualEntries, reason } = calculateLandCount(nonlands);
  const { basics, nonbasics } = splitLandSlots(landCount);
  const { pips, snowRequired } = countManaPips(nonlands);
  const colorlessNeed = needsColorless(nonlands);
  const snowMatters = snowRequired || nonlands.some((c) => /\bsnow\b/i.test(oracleText(c)));
  logger?.line(`Average mana value: ${average.toFixed(2)}`);
  logger?.line(`Virtual curve entries: ${virtualEntries}`);
  logger?.line(`Final land count: ${landCount}. Reason: ${reason}`);
  logger?.line(`Pip counts: ${JSON.stringify(pips)} snowRequired=${snowRequired} snowMatters=${snowMatters} colorlessNeed=${colorlessNeed}`);

  const basicNames = allocateBasics(colors, basics, pips, snowMatters);
  if (colorlessNeed && colors.length && !basicNames.some((n) => /Wastes/.test(n))) {
    const wastes = snowMatters ? 'Snow-Covered Wastes' : 'Wastes';
    const inject = Math.min(2, basicNames.length - 1);
    for (let i = 0; i < inject; i += 1) basicNames[basicNames.length - 1 - i] = wastes;
    logger?.line(`Injected ${inject}x ${wastes} so colorless {C} costs are always castable.`);
  }
  logger?.line(`Basic land allocation: ${basicNames.join(', ')}`);
  const basicCards = await buildBasics(basicNames, rng, logger);

  let nonbasicCards = await getNonbasics({ colors, theme, count: nonbasics, colorlessNeed, snowNeed: snowMatters, existing: nonlands, logger, rng });
  nonbasicCards = await completeLandSynergies(nonbasicCards, requiredLands, colors, logger);
  const artNonbasics = [];
  for (const card of nonbasicCards) artNonbasics.push(await maybeAltArt(card, rng, logger));
  logger?.line(`Non-basic land allocation: ${artNonbasics.map((c) => c.name).join(', ')}`);
  return [...basicCards, ...artNonbasics];
}
