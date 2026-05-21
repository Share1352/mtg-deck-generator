import { canonicalSynergyTag, getSynergyCardsForTag, EdhrecError } from './edhrecClient.js';
import { namedCard, searchCards, ScryfallError } from './scryfallClient.js';
import { buildThemeQuery, exactOracleQuery, getHostQuery } from './themeQueries.js';
import { chooseDeckColors, maybeExpandColors } from './colorEngine.js';
import { colorIdentityWithin, isCreature, isLand, isPlayableMainDeckCard, uniqueByOracle, sameCard } from './filters.js';
import { directSynergyIssues, hasUnsupportedSelfNameSynergy } from './synergyRules.js';
import { shuffle } from './random.js';

function isHardOutage(error) {
  if (error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429)) return true;
  if (error instanceof EdhrecError && (error.status === 0 || error.status >= 500 || error.status === 429)) return true;
  return false;
}

function addIfValid(selected, card, colors, source, logger, sources) {
  if (selected.length >= 23) return false;
  if (!isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false })) return false;
  if (hasUnsupportedSelfNameSynergy(card)) { logger?.line(`Skipped ${card.name}: direct named-card synergy needs extra copies, but this deck is singleton.`); return false; }
  if (!colorIdentityWithin(card, colors)) return false;
  if (selected.some((c) => sameCard(c, card))) return false;
  selected.push(card);
  sources.set(card.name, source);
  logger?.line(`${source.section} card added: ${card.name} / source: ${source.source} / reason: ${source.reason}`);
  return true;
}

function replacementIndex(selected, protectedCard) {
  for (let i = selected.length - 1; i >= 12; i -= 1) if (!sameCard(selected[i], protectedCard)) return i;
  for (let i = selected.length - 1; i >= 0; i -= 1) if (!sameCard(selected[i], protectedCard)) return i;
  return -1;
}

function addReplacement(selected, card, colors, source, logger, sources, protectedCard = null) {
  if (!isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false })) return false;
  if (hasUnsupportedSelfNameSynergy(card)) return false;
  if (!colorIdentityWithin(card, colors)) return false;
  if (selected.some((c) => sameCard(c, card))) return false;
  const index = selected.length < 23 ? selected.length : replacementIndex(selected, protectedCard);
  if (index < 0) return false;
  const removed = selected[index];
  selected[index] = card;
  sources.set(card.name, source);
  if (removed) sources.delete(removed.name);
  logger?.line(`${source.section} card ${removed ? 'replaced' : 'added'}: ${card.name}${removed ? ` over ${removed.name}` : ''} / source: ${source.source} / reason: ${source.reason}`);
  return true;
}

async function repairDirectSynergies(selected, pool, colors, logger, sources) {
  for (let pass = 1; pass <= 8; pass += 1) {
    const issues = directSynergyIssues(selected);
    if (!issues.length) {
      logger?.line(`Direct synergy validation passed after ${pass - 1} repair pass(es).`);
      return;
    }
    const issue = issues[0];
    logger?.line(`Direct synergy repair needed: ${issue.detail}`);
    let repaired = false;
    if (issue.type === 'named-card') {
      const target = pool.find((card) => String(card?.name || '').toLowerCase() === String(issue.missingName || '').toLowerCase());
      if (target) repaired = addReplacement(selected, target, colors, { section: 'Random all-time', source: 'direct named-card synergy repair', reason: `required by ${issue.card.name}` }, logger, sources, issue.card);
    }
    if (issue.type === 'tutor-target') {
      const target = pool.find((card) => issue.requirement.matches(card) && !sameCard(card, issue.card));
      if (target) repaired = addReplacement(selected, target, colors, { section: 'Random all-time', source: 'direct tutor-target synergy repair', reason: `search target for ${issue.card.name}` }, logger, sources, issue.card);
      if (!repaired) {
        try {
          const fetched = await searchCards(`${issue.requirement.query} id<=${colors.join('')} game:paper lang:en`, { order: 'edhrec', limit: 40, logger });
          const fetchedTarget = fetched.find((card) => issue.requirement.matches(card) && !sameCard(card, issue.card));
          if (fetchedTarget) repaired = addReplacement(selected, fetchedTarget, colors, { section: 'Random all-time', source: 'Scryfall direct tutor-target synergy repair', reason: `guaranteed target for ${issue.card.name}` }, logger, sources, issue.card);
        } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`direct tutor-target repair for ${issue.card.name}`, e); }
      }
    }
    if (!repaired) {
      const index = selected.findIndex((card) => sameCard(card, issue.card));
      if (index >= 0) {
        logger?.line(`Removed ${issue.card.name}: ${issue.detail}.`);
        selected.splice(index, 1);
        sources.delete(issue.card.name);
        repaired = true;
      }
    }
    if (selected.length < 23) {
      for (const card of pool) {
        if (addIfValid(selected, card, colors, { section: 'Random all-time', source: 'direct synergy backfill', reason: 'replaced unsupported direct-synergy card' }, logger, sources)) break;
      }
    }
    if (!repaired) break;
  }
  const remaining = directSynergyIssues(selected);
  if (remaining.length) logger?.line(`Direct synergy validation remaining issues: ${remaining.map((issue) => issue.detail).join('; ')}`);
}

async function fetchNames(names, logger) {
  const cards = [];
  for (const name of names) {
    try {
      const card = await namedCard(name, { logger });
      if (isLand(card)) continue;
      cards.push(card);
    } catch (e) {
      if (isHardOutage(e)) throw e;
      logger?.error(`EDHREC named card ${name}`, e);
    }
  }
  return cards;
}
async function themePoolCards(theme, logger) {
  const queries = [buildThemeQuery(theme.name || theme), getHostQuery(theme.name || theme)].filter(Boolean);
  const cards = [];
  for (const q of queries) {
    try {
      cards.push(...await searchCards(`${q} game:paper lang:en`, { order: 'edhrec', limit: 120, logger }));
    } catch (e) {
      if (isHardOutage(e)) throw e;
      logger?.error(`theme pool query ${q}`, e);
    }
  }
  return uniqueByOracle(cards.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false })));
}
export async function selectCardsForTheme(theme, { logger, rng = Math.random } = {}) {
  const name = theme.name || theme;
  const synergyTag = canonicalSynergyTag(name);
  let synergyNames = [];
  try {
    synergyNames = await getSynergyCardsForTag(name, { logger });
  } catch (error) {
    if (isHardOutage(error)) throw error;
    logger?.line(`EDHREC synergy lookup failed for ${name}: ${error.message}. Falling back to Scryfall otag/mechanical search.`);
  }
  logger?.line(`EDHREC high-synergy data for ${name}${synergyTag && synergyTag !== name ? ` via ${synergyTag}` : ''}: ${synergyNames.length ? `${synergyNames.length} cards` : 'none'}`);
  if (!synergyNames.length) logger?.line(`No EDHREC high-synergy data found for ${name}. Using Scryfall otag/mechanical search instead.`);
  const edhrecCards = await fetchNames(synergyNames, logger);
  const pool = uniqueByOracle([...edhrecCards, ...await themePoolCards(theme, logger)].filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false })));
  logger?.line(`Theme pool valid cards: ${pool.length}`);
  let colorResult = chooseDeckColors(pool, { rng, logger });
  let expansion = maybeExpandColors({ chosenColors: colorResult.colors, allCards: pool, needed: 23, logger });
  const colors = expansion.colors;
  const selected = [];
  const sources = new Map();
  const ordered = (cards, source) => source.startsWith('EDHREC') ? cards : shuffle(cards, rng);
  const addMany = (cards, section, source, targetCreature, limit) => {
    for (const card of ordered(cards, source)) {
      if (selected.length >= limit) break;
      if (targetCreature !== null && isCreature(card) !== targetCreature) continue;
      addIfValid(selected, card, colors, { section, source, reason: targetCreature === true ? 'creature/payoff target' : targetCreature === false ? 'non-creature support target' : 'theme match' }, logger, sources);
    }
  };
  const addCoreUntil = (cards, source, targetCreature, stopWhen) => {
    for (const card of ordered(cards, source)) {
      if (selected.length >= 12 || stopWhen()) break;
      if (targetCreature !== null && isCreature(card) !== targetCreature) continue;
      addIfValid(selected, card, colors, {
        section: 'Core',
        source,
        reason: targetCreature === true ? 'creature/payoff target' : targetCreature === false ? 'non-creature support target' : 'theme match',
      }, logger, sources);
    }
  };
  const coreCreatureCount = () => selected.slice(0, 12).filter(isCreature).length;
  const coreNonCreatureCount = () => selected.slice(0, 12).filter((card) => !isCreature(card)).length;
  const legalEdhrec = edhrecCards.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false }));
  const coreFallbackSource = synergyNames.length ? 'Scryfall EDHREC-ordered theme fallback' : 'Scryfall otag/mechanical fallback';
  const themeOracle = exactOracleQuery(name);
  const colorLock = `id<=${colors.join('')} game:paper lang:en`;
  addCoreUntil(legalEdhrec, 'EDHREC high synergy cache', true, () => coreCreatureCount() >= 5);
  addCoreUntil(pool, coreFallbackSource, true, () => coreCreatureCount() >= 5);
  if (coreCreatureCount() < 5) {
    try {
      const themedCreatures = await searchCards(`${themeOracle} ${colorLock} type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(themedCreatures, 'theme-oracle creature/payoff fallback', true, () => coreCreatureCount() >= 5);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle core creature fallback', e); }
  }
  if (coreCreatureCount() < 5) {
    try {
      const creatureSupport = await searchCards(`${colorLock} type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(creatureSupport, 'color-locked creature/payoff fallback (last resort)', true, () => coreCreatureCount() >= 5);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('core creature fallback', e); }
  }
  addCoreUntil(legalEdhrec, 'EDHREC high synergy cache', false, () => coreNonCreatureCount() >= 7);
  addCoreUntil(pool, coreFallbackSource, false, () => coreNonCreatureCount() >= 7);
  if (coreNonCreatureCount() < 7) {
    try {
      const themedSupport = await searchCards(`${themeOracle} ${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(themedSupport, 'theme-oracle non-creature support fallback', false, () => coreNonCreatureCount() >= 7);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle core non-creature fallback', e); }
  }
  if (coreNonCreatureCount() < 7) {
    try {
      const supportSpells = await searchCards(`${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(supportSpells, 'color-locked non-creature support fallback (last resort)', false, () => coreNonCreatureCount() >= 7);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('core non-creature fallback', e); }
  }
  addCoreUntil(pool, coreFallbackSource, null, () => selected.length >= 12);
  if (selected.length < 12) logger?.line(`Core shortfall: selected ${selected.length}/12 after fallback hierarchy.`);
  logger?.line(`Core composition: creatures=${coreCreatureCount()} noncreatures=${coreNonCreatureCount()}`);
  const randomPool = pool.filter((c) => !selected.some((s) => sameCard(s, c)));
  if (synergyNames.length) addMany(legalEdhrec.filter((c) => !selected.some((s) => sameCard(s, c))), 'Random all-time', 'EDHREC high synergy cache', null, 23);
  addMany(randomPool, 'Random all-time', synergyNames.length ? 'Scryfall EDHREC-ordered theme fallback' : 'Scryfall local shuffled theme pool', null, 23);
  if (selected.length < 23) {
    const host = getHostQuery(name);
    if (host) {
      logger?.line(`Parasitic host injection query used for ${name}: ${host}`);
      try { addMany(await searchCards(`${host} id<=${colors.join('')} game:paper lang:en`, { limit: 80, logger }), 'Random all-time', 'parasitic host/payoff injector', null, 23); } catch (e) { if (isHardOutage(e)) throw e; logger?.error('host injector', e); }
    }
  }
  if (selected.length < 23) {
    logger?.line(`Theme-oracle broadened fallback needed: ${selected.length}/23.`);
    try {
      const broaderTheme = await searchCards(`${themeOracle} ${colorLock} -type:land`, { order: 'edhrec', limit: 175, logger });
      addMany(broaderTheme, 'Random all-time', 'theme-oracle broadened fallback', null, 23);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle broadened fallback', e); }
  }
  if (selected.length < 23) {
    logger?.line(`Narrow color-locked fallback (last resort) needed: ${selected.length}/23.`);
    try { addMany(await searchCards(`${colorLock} -type:land`, { order: 'edhrec', limit: 100, logger }), 'Random all-time', 'narrow color-locked fallback (last resort)', null, 23); } catch (e) { if (isHardOutage(e)) throw e; logger?.error('narrow fallback', e); }
  }
  if (selected.length < 23) throw new Error(`Could not build 23 non-land cards for ${name}; got ${selected.length}`);
  await repairDirectSynergies(selected, pool, colors, logger, sources);
  if (selected.length < 23) throw new Error(`Could not build 23 non-land cards for ${name} after direct synergy repair; got ${selected.length}`);
  const directIssues = directSynergyIssues(selected);
  if (directIssues.length) throw new Error(`Unresolved direct synergy issues: ${directIssues.map((issue) => issue.detail).join('; ')}`);
  const core = selected.slice(0, 12);
  const random = selected.slice(12, 23);
  logger?.line(`Selected 12 core cards: ${core.map((c) => c.name).join(', ')}`);
  logger?.line(`Selected 11 random/fallback cards: ${random.map((c) => c.name).join(', ')}`);
  return { nonlands: selected.slice(0, 23), core, random, colors, colorResult, sources };
}
