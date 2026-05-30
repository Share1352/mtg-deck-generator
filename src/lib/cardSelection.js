import { searchCards, namedCard, ScryfallError } from './scryfallClient.js';
import { buildThemeQuery, getHostQuery, getThemeAdjacentQueries } from './themeQueries.js';
import { getThemeFamilyQueries } from './themeFamilies.js';
import { getSupportPlan, inferSupportTiersFromCards } from './supportProfiles.js';
import { chooseDeckColors, maybeExpandColors } from './colorEngine.js';
import { colorIdentityWithin, isCreature, isLand, isPlayableMainDeckCard, isOffColorSupportCard, oracleText, typeLine, uniqueByOracle, sameCard } from './filters.js';
import { directSynergyIssues, copiesFor } from './synergyRules.js';
import { shuffle } from './random.js';

const TOTAL = 23;
const THEME_TARGET = Math.round(TOTAL * 0.6); // 14 on-theme
const HIGH_EDHREC_TARGET = Math.floor(THEME_TARGET / 2); // 7 high-edhrec
const CREATURE_FLOOR = 6; // never ship a deck that cannot field bodies
const MIN_DIRECT_THEME_CARDS = 10; // reroll genuinely unbuildable themes (preserved from main)

const lower = (c) => String(c?.name || '').toLowerCase();
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pluralize = (name) => {
  const n = String(name || '');
  if (/f$/i.test(n)) return `${n.slice(0, -1)}ves`;
  if (/[sxz]$/i.test(n) || /ch$/i.test(n) || /sh$/i.test(n)) return `${n}es`;
  if (/y$/i.test(n) && !/[aeiou]y$/i.test(n)) return `${n.slice(0, -1)}ies`;
  return `${n}s`;
};
export function colorClause(colors) { return colors.length ? `id<=${colors.join('')}` : 'id:c'; }
function isHardOutage(error) { return error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429); }
// Land-target requirements (fetch a basic / a land) are guaranteed by the mana base, not the 23 non-lands.
function openSynergyIssues(cards) { return directSynergyIssues(cards).filter((i) => !((i.type === 'tutor-target' || i.type === 'type-control') && i.requirement.landTarget)); }

async function themePoolCards(theme, logger) {
  const queries = [buildThemeQuery(theme), getHostQuery(theme.name || theme)].filter(Boolean);
  const cards = [];
  for (const q of queries) {
    try { cards.push(...await searchCards(`${q} game:paper lang:en`, { order: 'edhrec', limit: 120, logger })); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error(`theme pool query ${q}`, e); }
  }
  return uniqueByOracle(cards.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false }) && isDirectThemeCard(c, theme)));
}

export function isDirectThemeCard(card, theme) {
  if (!card) return false;
  if ((typeof theme === 'object' ? theme?.category : null) !== 'typal') return true;
  const name = String(theme?.name || theme || '');
  const singular = escapeRe(name);
  const plural = escapeRe(pluralize(name));
  const typeRe = new RegExp(`(^|[\\s—-])${singular}([\\s—-]|$)`, 'i');
  if (typeRe.test(typeLine(card))) return true;
  const text = oracleText(card);
  const word = `(?:${singular}|${plural})`;
  return [
    new RegExp(`\\bother ${word}\\b`, 'i'),
    new RegExp(`\\b${word} you control\\b`, 'i'),
    new RegExp(`\\bwhenever (?:a|another|one or more) ${word}\\b`, 'i'),
    new RegExp(`\\beach ${word}\\b`, 'i'),
    new RegExp(`\\bcreate\\b[^.\\n;]*\\b${word}\\b[^.\\n;]*\\b(?:creature )?token\\b`, 'i'),
    /\bchoose a creature type\b/i,
    /\bchosen type\b/i,
  ].some((re) => re.test(text));
}

export async function selectCardsForTheme(theme, { logger, rng = Math.random } = {}) {
  const name = theme.name || theme;
  const category = theme.category;
  const localPool = await themePoolCards(theme, logger);
  if (localPool.length < MIN_DIRECT_THEME_CARDS) throw new Error(`Theme ${name} rejected: only ${localPool.length} direct theme cards found; minimum is ${MIN_DIRECT_THEME_CARDS}.`);
  logger?.line(`Theme pool valid cards: ${localPool.length}`);

  const colorResult = chooseDeckColors(localPool, { rng, logger });
  const expansion = maybeExpandColors({ chosenColors: colorResult.colors, allCards: localPool, needed: TOTAL, logger });
  const colors = expansion.colors;
  const cc = colorClause(colors);

  const selected = [];
  const names = new Set();
  const protectedNames = new Set();
  const sources = new Map();
  const requiredLandCards = []; // land dependencies discovered on non-land cards, handed to the mana base
  const deferredRefs = new Set(); // named refs satisfied by the mana base

  const canAdd = (card) => isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false })
    && colorIdentityWithin(card, colors) && !isOffColorSupportCard(card, colors) && !names.has(lower(card));

  const addCard = (card, source, { protect = false, cap = TOTAL } = {}) => {
    if (!canAdd(card)) return 0;
    const copies = Math.min(copiesFor(card), cap - selected.length);
    if (copies <= 0) return 0;
    for (let i = 0; i < copies; i += 1) selected.push(card);
    names.add(lower(card));
    sources.set(card.name, source);
    if (protect || copies > 1) protectedNames.add(lower(card));
    logger?.line(`${source.section} ${copies > 1 ? `${copies}x ` : ''}card added: ${card.name} / source: ${source.source} / reason: ${source.reason}`);
    return copies;
  };
  const addFromList = (cards, source, { creature = null, until = TOTAL } = {}) => {
    for (const card of shuffle(cards, rng)) {
      if (selected.length >= until) break;
      if (creature !== null && isCreature(card) !== creature) continue;
      addCard(card, source, { cap: until });
    }
  };
  const fetchTheme = async (query, order, limit = 70) => {
    try { return await searchCards(`${query} ${cc} game:paper lang:en`, { order, limit, logger }); }
    catch (e) { if (isHardOutage(e)) throw e; logger?.error(`theme fetch ${query}`, e); return []; }
  };

  const themeQ = buildThemeQuery(theme);
  const hostQ = getHostQuery(name);

  // --- PHASE A: high-EDHREC half of the on-theme 60% (random pick among high edhrec-rated theme cards) ---
  const highList = uniqueByOracle([...localPool, ...await fetchTheme(themeQ, 'edhrec', 80)].filter((c) => isDirectThemeCard(c, theme)));
  addFromList(highList, { section: 'On-theme (high EDHREC)', source: 'Scryfall edhrec-rank theme pool', reason: 'random pick among high edhrec-rated theme cards' }, { until: HIGH_EDHREC_TARGET });
  for (const c of selected) protectedNames.add(lower(c));

  // --- PHASE B: random all-time half (random across all MTG history within the theme) ---
  const randomList = uniqueByOracle([...localPool, ...await fetchTheme(themeQ, 'random', 80)].filter((c) => isDirectThemeCard(c, theme)));
  addFromList(randomList, { section: 'On-theme (random all-time)', source: 'Scryfall random across all MTG history', reason: 'random theme card from full history' }, { until: THEME_TARGET });
  logger?.line(`On-theme cards selected: ${selected.length}/${THEME_TARGET} (target ${HIGH_EDHREC_TARGET} high-edhrec + ${THEME_TARGET - HIGH_EDHREC_TARGET} random all-time)`);

  // --- PHASE C: smart 40% support package tailored to the theme's archetype ---
  const plan = getSupportPlan(name, category);
  logger?.line(`Support archetype: ${plan.id} (${plan.tiers.length} tiers)`);
  const inferredTiers = inferSupportTiersFromCards(selected);
  if (inferredTiers.length) {
    const needs = [...new Set(inferredTiers.map((tier) => tier.inferredLabel))].join(', ');
    logger?.line(`Inferred support needs from selected theme cards: ${needs}`);
  }
  for (const tier of inferredTiers) {
    if (selected.length >= TOTAL) break;
    addFromList(await fetchTheme(tier.query, 'edhrec', 80), { section: 'Support', source: `inferred need: ${tier.label}`, reason: `${tier.inferredLabel} support inferred from selected theme cards` }, { creature: tier.creature, until: TOTAL });
  }
  for (const tier of plan.tiers) {
    if (selected.length >= TOTAL) break;
    addFromList(await fetchTheme(tier.query, 'edhrec', 60), { section: 'Support', source: `support tier: ${tier.label}`, reason: `${plan.id} support` }, { creature: tier.creature, until: TOTAL });
  }
  // supplement with main's theme-adjacent + theme-family queries
  if (selected.length < TOTAL) {
    for (const { query } of getThemeAdjacentQueries(theme)) {
      if (selected.length >= TOTAL) break;
      addFromList(await fetchTheme(`${query} -type:land`, 'edhrec', 80), { section: 'Support', source: `theme-adjacent: ${query}`, reason: 'theme-adjacent support' }, { until: TOTAL });
    }
  }
  if (selected.length < TOTAL) {
    for (const { query, family, role } of getThemeFamilyQueries(theme)) {
      if (selected.length >= TOTAL) break;
      addFromList(await fetchTheme(`${query} -type:land`, 'edhrec', 80), { section: 'Support', source: `theme-family ${family}/${role}: ${query}`, reason: 'theme-family support' }, { until: TOTAL });
    }
  }
  if (selected.length < TOTAL && hostQ) {
    logger?.line(`Parasitic host injection for ${name}: ${hostQ}`);
    addFromList(await fetchTheme(hostQ, 'edhrec', 60), { section: 'Support', source: 'parasitic host/payoff injector', reason: 'host bodies for parasitic theme' }, { until: TOTAL });
  }
  if (selected.length < TOTAL) {
    addFromList(await fetchTheme('type:creature -type:land', 'edhrec', 80), { section: 'Support', source: 'color-locked creature support', reason: 'on-color bodies' }, { creature: true, until: TOTAL });
    addFromList(await fetchTheme('-type:creature -type:land', 'edhrec', 80), { section: 'Support', source: 'color-locked non-creature support', reason: 'on-color support spells' }, { creature: false, until: TOTAL });
  }
  if (selected.length < TOTAL) addFromList(await fetchTheme('-type:land', 'edhrec', 250), { section: 'Support', source: 'narrow color-locked fallback', reason: 'last-resort on-color fill' }, { until: TOTAL });

  // --- PHASE D: creature floor so theme decks (Auras/Equipment/etc.) can field bodies ---
  await ensureCreatureFloor();

  // --- PHASE E: guarantee every explicit synergy printed on the cards is supported ---
  await repairSynergies();

  if (selected.length < TOTAL) {
    addFromList(randomList, { section: 'On-theme (random all-time)', source: 'post-repair theme backfill', reason: 'replace dropped card' }, { until: TOTAL });
    if (selected.length < TOTAL) addFromList(await fetchTheme('-type:land', 'edhrec', 250), { section: 'Support', source: 'post-repair narrow fallback', reason: 'final on-color fill' }, { until: TOTAL });
  }

  if (selected.length < TOTAL) throw new Error(`Could not build ${TOTAL} non-land cards for ${name}; got ${selected.length}`);
  const remaining = liveIssues();
  if (remaining.length) logger?.line(`Direct synergy issues remaining (non-fatal): ${remaining.map((i) => i.detail).join('; ')}`);

  const themeCards = selected.filter((c) => String(sources.get(c.name)?.section || '').startsWith('On-theme'));
  const supportCards = selected.filter((c) => !String(sources.get(c.name)?.section || '').startsWith('On-theme'));
  logger?.line(`Final non-land split: theme=${themeCards.length} support=${supportCards.length} creatures=${selected.filter(isCreature).length}`);
  if (requiredLandCards.length) logger?.line(`Land dependencies passed to mana base: ${requiredLandCards.map((c) => c.name).join(', ')}`);
  return { nonlands: selected.slice(0, TOTAL), themeCards, supportCards, core: themeCards, random: supportCards, colors, colorResult, sources, requiredLands: requiredLandCards };

  // ---- helpers (hoisted) ----
  function liveIssues() { return openSynergyIssues(selected).filter((i) => !(i.type === 'named-card' && deferredRefs.has(i.missingName.toLowerCase()))); }

  function makeRoom({ avoidCreatures = false } = {}) {
    for (let i = selected.length - 1; i >= 0; i -= 1) {
      const card = selected[i];
      if (protectedNames.has(lower(card))) continue;
      if (avoidCreatures && isCreature(card)) continue;
      selected.splice(i, 1);
      if (!selected.some((c) => sameCard(c, card))) { names.delete(lower(card)); sources.delete(card.name); }
      return card;
    }
    return null;
  }

  async function ensureCreatureFloor() {
    let creatures = selected.filter(isCreature).length;
    if (creatures >= CREATURE_FLOOR) return;
    const pools = [
      uniqueByOracle([...localPool, ...await fetchTheme(themeQ, 'edhrec', 80)]).filter(isCreature),
      await fetchTheme('type:creature -type:land', 'edhrec', 80),
    ];
    for (const pool of pools) {
      for (const card of shuffle(pool, rng)) {
        if (creatures >= CREATURE_FLOOR) return;
        if (!canAdd(card) || !isCreature(card)) continue;
        if (selected.length >= TOTAL && !makeRoom({ avoidCreatures: true })) return;
        if (addCard(card, { section: 'Support', source: 'creature-floor guarantee', reason: 'ensure enough bodies to win' })) { protectedNames.add(lower(card)); creatures += 1; }
      }
    }
  }

  async function resolveNamed(refName) {
    try { const exact = await namedCard(refName, { logger }); if (exact?.name) return exact; }
    catch (e) { if (isHardOutage(e)) throw e; }
    try {
      const hits = await searchCards(`name:"${refName}" game:paper lang:en`, { order: 'edhrec', limit: 20, logger });
      return hits.find((c) => String(c.name).toLowerCase().includes(refName.toLowerCase())) || hits[0] || null;
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`named search ${refName}`, e); return null; }
  }

  async function repairSynergies() {
    for (let pass = 1; pass <= 16; pass += 1) {
      const issues = liveIssues();
      if (!issues.length) { logger?.line(`Synergy validation passed after ${pass - 1} repair pass(es).`); return; }
      const issue = issues[0];
      logger?.line(`Synergy repair needed: ${issue.detail}`);
      let target = null;
      let src = '';
      if (issue.type === 'named-card') {
        const fetched = await resolveNamed(issue.missingName);
        if (fetched && isLand(fetched)) {
          if (!requiredLandCards.some((l) => l.name === fetched.name)) requiredLandCards.push(fetched);
          deferredRefs.add(issue.missingName.toLowerCase());
          logger?.line(`Land dependency ${fetched.name} for ${issue.card.name} deferred to mana base.`);
          continue;
        }
        if (fetched && canAdd(fetched) && colorIdentityWithin(fetched, colors)) { target = fetched; src = `required named card for ${issue.card.name}`; }
      } else if (issue.type === 'tutor-target' || issue.type === 'type-control') {
        const localHit = localPool.find((c) => issue.requirement.matches(c) && canAdd(c));
        if (localHit) { target = localHit; src = `local ${issue.type} for ${issue.card.name}`; }
        if (!target) {
          const fetched = await fetchTheme(issue.requirement.query, 'edhrec', 40);
          const hit = fetched.find((c) => issue.requirement.matches(c) && canAdd(c));
          if (hit) { target = hit; src = `Scryfall ${issue.type} (${issue.requirement.name}) for ${issue.card.name}`; }
        }
      }
      if (target) {
        if (selected.length >= TOTAL && !makeRoom()) { dropCard(issue.card); continue; }
        protectedNames.add(lower(issue.card));
        if (!addCard(target, { section: 'Support', source: 'synergy repair', reason: src }, { protect: true })) dropCard(issue.card);
      } else {
        dropCard(issue.card);
      }
    }
    const left = liveIssues();
    if (left.length) logger?.line(`Synergy repair exhausted; remaining: ${left.map((i) => i.detail).join('; ')}`);
  }

  function dropCard(card) {
    const idx = selected.findIndex((c) => sameCard(c, card));
    if (idx < 0) return;
    logger?.line(`Removed ${card.name}: its required synergy target could not be guaranteed.`);
    selected.splice(idx, 1);
    if (!selected.some((c) => sameCard(c, card))) { names.delete(lower(card)); sources.delete(card.name); }
    protectedNames.delete(lower(card));
  }
}
