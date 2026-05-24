import { searchCards, ScryfallError } from './scryfallClient.js';
import { buildThemeQuery, exactOracleQuery, getHostQuery, getThemeAdjacentQueries } from './themeQueries.js';
import { chooseDeckColors, maybeExpandColors } from './colorEngine.js';
import { colorIdentityWithin, isCreature, isLand, isPlayableMainDeckCard, uniqueByOracle, sameCard } from './filters.js';
import { directSynergyIssues, hasUnsupportedSelfNameSynergy } from './synergyRules.js';
import { shuffle } from './random.js';

const GENERIC_TYPAL_SUPPORT_ALLOWLIST = new Set([
  "herald's horn",
  "vanquisher's banner",
  "patchwork banner",
  "icon of ancestry",
  'roaming throne',
  'shared animosity',
  'kindred discovery',
  'kindred dominance',
  'door of destinies',
  'realmwalker',
  'maskwood nexus',
]);

const TYPAL_SUPPORT_ORACLE_QUERY = '(oracle:"of the chosen type" OR oracle:"choose a creature type" OR oracle:"of that creature type" OR oracle:"creature type" OR oracle:"creatures you control of" OR oracle:"all creatures of the chosen")';

export function isGenericTypalSupport(card) {
  const normalized = String(card?.name || '').trim().toLowerCase();
  return GENERIC_TYPAL_SUPPORT_ALLOWLIST.has(normalized);
}

function pluralizeTypalName(name) {
  const n = String(name || '');
  if (/f$/i.test(n)) return `${n.slice(0, -1)}ves`;
  if (/[sxz]$/i.test(n) || /ch$/i.test(n) || /sh$/i.test(n)) return `${n}es`;
  if (/y$/i.test(n) && !/[aeiou]y$/i.test(n)) return `${n.slice(0, -1)}ies`;
  return `${n}s`;
}

async function runTypalSelectionPipeline({
  name,
  colors,
  selected,
  randomPool,
  logger,
  addMany,
}) {
  const typalName = String(name || '');
  const pluralTypalName = pluralizeTypalName(typalName);
  const colorLock = `id<=${colors.join('')} game:paper lang:en`;
  const typalMentionQuery = `(oracle:/\\b${typalName}\\b/i OR oracle:/\\b${pluralTypalName}\\b/i)`;
  const creatureTypeQuery = `type:"${typalName}" ${colorLock} -type:land`;
  const remainingCapacity = () => Math.max(0, 23 - selected.length);
  const stageLog = (stage, before) => logger?.line(`Typal stage ${stage} fill: +${selected.length - before} (${selected.length}/23).`);
  const runStage = async (stage, loader, { kind = 'direct-theme', creatureOnly = null, promotedDirect = true } = {}) => {
    if (remainingCapacity() <= 0) return;
    const before = selected.length;
    let candidates = [];
    try {
      candidates = await loader();
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`typal pipeline stage ${stage}`, e); }
    if (Array.isArray(candidates) && candidates.length) addMany(candidates, 'Random all-time', `typal-stage-${stage}`, kind, creatureOnly, 23, promotedDirect);
    if (selected.length === before) logger?.line(`Typal stage ${stage} yielded zero viable candidates.`);
    stageLog(stage, before);
  };

  await runStage(
    'A (strong tribe-synergy enablers)',
    async () => searchCards(creatureTypeQuery, { order: 'edhrec', limit: 120, logger }),
    { kind: 'direct-theme', promotedDirect: true },
  );
  await runStage(
    'B (on-tribe role fillers)',
    async () => searchCards(`${typalMentionQuery} ${colorLock} -type:land`, { order: 'edhrec', limit: 160, logger }),
    { kind: 'direct-theme', promotedDirect: true },
  );
  await runStage(
    'C (Changeling tribal fill)',
    async () => searchCards(`type:changeling type:creature ${colorLock}`, { order: 'edhrec', limit: 80, logger }),
    { kind: 'direct-theme', creatureOnly: true, promotedDirect: true },
  );
  await runStage(
    'D (generic typal support)',
    async () => {
      const fromPool = randomPool.filter((card) => isGenericTypalSupport(card));
      if (fromPool.length) return fromPool;
      return searchCards(`${TYPAL_SUPPORT_ORACLE_QUERY} ${colorLock} -type:land`, { order: 'edhrec', limit: 80, logger });
    },
    { kind: 'typal-support', creatureOnly: false, promotedDirect: true },
  );
  await runStage(
    'E (theme-adjacent non-tribal support)',
    async () => searchCards(`oracle:/\\bchangeling\\b/i ${colorLock} legal:commander -is:funny -type:land`, { order: 'edhrec', limit: 80, logger }),
    { kind: 'theme-adjacent', promotedDirect: false },
  );
  await runStage(
    'F (generic filler)',
    async () => searchCards(`${colorLock} -type:land`, { order: 'edhrec', limit: 250, logger }),
    { kind: 'generic-color-filler', promotedDirect: false },
  );
}

export async function __runTypalSelectionPipelineForTest(args) {
  return runTypalSelectionPipeline(args);
}

function isHardOutage(error) {
  if (error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429)) return true;
  return false;
}

function normalizeSourceModel(source = {}) {
  const stage = source.stage || source.section || 'unknown-stage';
  const kind = source.kind || (
    source.promotedDirect === true || source.category === 'direct-theme'
      ? 'direct_evidence'
      : source.category === 'typal-support'
        ? 'typal_support'
        : source.category === 'theme-adjacent' || source.category === 'indirect-theme-support'
          ? 'theme_adjacent'
          : 'generic_filler'
  );
  return {
    ...source,
    source: source.source || 'unknown-source',
    stage,
    kind,
    query: source.query || null,
    reason: source.reason || null,
  };
}

function addIfValid(selected, card, colors, source, logger, sources) {
  if (selected.length >= 23) return false;
  if (!isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false })) return false;
  if (hasUnsupportedSelfNameSynergy(card)) { logger?.line(`Skipped ${card.name}: direct named-card synergy needs extra copies, but this deck is singleton.`); return false; }
  if (!colorIdentityWithin(card, colors)) return false;
  if (selected.some((c) => sameCard(c, card))) return false;
  selected.push(card);
  const normalizedSource = normalizeSourceModel(source);
  sources.set(card.name, normalizedSource);
  logger?.line(`${normalizedSource.section} card added: ${card.name} / source: ${normalizedSource.source} / stage: ${normalizedSource.stage} / kind: ${normalizedSource.kind} / reason: ${normalizedSource.reason || 'n/a'}`);
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
  const normalizedSource = normalizeSourceModel(source);
  sources.set(card.name, normalizedSource);
  if (removed) sources.delete(removed.name);
  logger?.line(`${normalizedSource.section} card ${removed ? 'replaced' : 'added'}: ${card.name}${removed ? ` over ${removed.name}` : ''} / source: ${normalizedSource.source} / stage: ${normalizedSource.stage} / kind: ${normalizedSource.kind} / reason: ${normalizedSource.reason || 'n/a'}`);
  return true;
}

async function repairDirectSynergies(selected, pool, colors, logger, sources) {
  for (let pass = 1; pass <= 8; pass += 1) {
    const issues = directSynergyIssues(selected);
    if (!issues.length) {
      logger?.line(`Direct dependency repair completed after ${pass - 1} repair pass(es).`);
      return;
    }
    const issue = issues[0];
    logger?.line(`Direct synergy repair needed: ${issue.detail}`);
    let repaired = false;
    if (issue.type === 'named-card') {
      const target = pool.find((card) => String(card?.name || '').toLowerCase() === String(issue.missingName || '').toLowerCase());
      if (target) repaired = addReplacement(selected, target, colors, { section: 'Random all-time', source: 'direct named-card synergy repair', category: 'direct-theme', promotedDirect: true, reason: `required by ${issue.card.name}` }, logger, sources, issue.card);
    }
    if (issue.type === 'tutor-target') {
      const target = pool.find((card) => issue.requirement.matches(card) && !sameCard(card, issue.card));
      if (target) repaired = addReplacement(selected, target, colors, { section: 'Random all-time', source: 'direct tutor-target synergy repair', category: 'direct-theme', promotedDirect: true, reason: `search target for ${issue.card.name}` }, logger, sources, issue.card);
      if (!repaired) {
        try {
          const fetched = await searchCards(`${issue.requirement.query} id<=${colors.join('')} game:paper lang:en`, { order: 'edhrec', limit: 40, logger });
          const fetchedTarget = fetched.find((card) => issue.requirement.matches(card) && !sameCard(card, issue.card));
          if (fetchedTarget) repaired = addReplacement(selected, fetchedTarget, colors, { section: 'Random all-time', source: 'Scryfall direct tutor-target synergy repair', category: 'direct-theme', promotedDirect: true, reason: `guaranteed target for ${issue.card.name}` }, logger, sources, issue.card);
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
        if (addIfValid(selected, card, colors, { section: 'Random all-time', source: 'direct synergy backfill', category: 'direct-theme', promotedDirect: true, reason: 'replaced unsupported direct-synergy card' }, logger, sources)) break;
      }
    }
    if (!repaired) break;
  }
  const remaining = directSynergyIssues(selected);
  if (remaining.length) logger?.line(`Direct synergy validation remaining issues: ${remaining.map((issue) => issue.detail).join('; ')}`);
}

export function validateThemeSynergySources(selected, sources) {
  const minimumRequired = 10;
  const directEvidenceCards = [];
  const fallbackOnlyCardIds = [];
  const missingMetadata = [];
  for (const card of selected.slice(0, 23)) {
    const existingMeta = sources.get(card.name);
    if (!existingMeta) {
      missingMetadata.push(card.name);
      continue;
    }
    const meta = normalizeSourceModel(existingMeta);
    if (meta.kind === 'direct_evidence') directEvidenceCards.push(card.name);
    else fallbackOnlyCardIds.push(card.name);
  }
  const directEvidenceCount = directEvidenceCards.length;
  const passesMinimum = directEvidenceCount >= minimumRequired;
  return { directEvidenceCount, minimumRequired, passesMinimum, directEvidenceCards, fallbackOnlyCardIds, missingMetadata };
}

function rebalanceToMinimumDirectEvidence({ selected, sources, pool, colors, logger }) {
  let validation = validateThemeSynergySources(selected, sources);
  if (validation.passesMinimum) return validation;
  logger?.line(`Theme evidence shortfall before rebalance: ${validation.directEvidenceCount}/${validation.minimumRequired}. Attempting deterministic evidence-first refill.`);

  const evidenceCandidates = pool
    .filter((card) => !selected.some((s) => sameCard(s, card)))
    .filter((card) => isPlayableMainDeckCard(card, { allowLands: false, allowGoodstuff: false }))
    .filter((card) => colorIdentityWithin(card, colors));

  const fallbackIndices = selected
    .slice(0, 23)
    .map((card, idx) => ({ idx, meta: normalizeSourceModel(sources.get(card.name)) }))
    .filter(({ meta }) => meta.kind !== 'direct_evidence')
    .map(({ idx }) => idx)
    .reverse();

  for (const idx of fallbackIndices) {
    validation = validateThemeSynergySources(selected, sources);
    if (validation.passesMinimum) break;
    const next = evidenceCandidates.shift();
    if (!next) break;
    const removed = selected[idx];
    selected[idx] = next;
    sources.delete(removed.name);
    sources.set(next.name, normalizeSourceModel({
      section: 'Random all-time',
      stage: 'evidence-rebalance',
      source: 'deterministic evidence-first rebalance',
      category: 'direct-theme',
      kind: 'direct_evidence',
      promotedDirect: true,
      reason: `replaced fallback-only card ${removed.name}`,
    }));
    logger?.line(`Evidence rebalance replaced ${removed.name} -> ${next.name} (stage: evidence-rebalance).`);
  }
  return validateThemeSynergySources(selected, sources);
}

export function __rebalanceToMinimumDirectEvidenceForTest(args) {
  return rebalanceToMinimumDirectEvidence(args);
}

async function themePoolCards(theme, logger) {
  const queries = [buildThemeQuery(theme), getHostQuery(theme.name || theme)].filter(Boolean);
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
  const MIN_DIRECT_THEME_CARDS = 10;
  const name = theme.name || theme;
  const scryfallThemePool = await themePoolCards(theme, logger);
  const directThemeCards = uniqueByOracle(scryfallThemePool);
  if (directThemeCards.length < MIN_DIRECT_THEME_CARDS) throw new Error(`Theme ${name} rejected: only ${directThemeCards.length} direct theme cards found; minimum is ${MIN_DIRECT_THEME_CARDS}.`);
  logger?.line(`Theme ${name} accepted: ${directThemeCards.length} direct theme cards found; minimum is ${MIN_DIRECT_THEME_CARDS}.`);
  const pool = uniqueByOracle(scryfallThemePool.filter((c) => isPlayableMainDeckCard(c, { allowLands: false, allowGoodstuff: false })));
  logger?.line(`Theme pool valid cards: ${pool.length}`);
  let colorResult = chooseDeckColors(pool, { rng, logger });
  let expansion = maybeExpandColors({ chosenColors: colorResult.colors, allCards: pool, needed: 23, logger });
  const colors = expansion.colors;
  const selected = [];
  const sources = new Map();
  const isTypal = theme?.category === 'typal';
  const ordered = (cards, source) => shuffle(cards, rng);
  const reasonForSource = (source, targetCreature) => {
    if (targetCreature === true) return 'creature/payoff target';
    if (targetCreature === false) return 'non-creature support target';
    if (source.includes('direct theme match')) return 'direct theme match';
    if (source.includes('broad oracle match')) return 'broad oracle match';
    if (source.includes('Changeling')) return 'changeling tribal fill';
    if (source.includes('typal support')) return 'generic typal support';
    if (source.includes('theme-adjacent') || source.includes('mechanic')) return 'theme-adjacent';
    if (source.includes('/cards/random')) return 'true random card';
    return 'generic color-compatible fallback';
  };
  const addMany = (cards, section, source, category, targetCreature, limit, promotedDirect = false) => {
    for (const card of ordered(cards, source)) {
      if (selected.length >= limit) break;
      if (targetCreature !== null && isCreature(card) !== targetCreature) continue;
      addIfValid(selected, card, colors, { section, source, category, promotedDirect, reason: reasonForSource(source, targetCreature) }, logger, sources);
    }
  };
  const addCoreUntil = (cards, source, category, targetCreature, stopWhen, promotedDirect = false) => {
    for (const card of ordered(cards, source)) {
      if (selected.length >= 12 || stopWhen()) break;
      if (targetCreature !== null && isCreature(card) !== targetCreature) continue;
      addIfValid(selected, card, colors, {
        section: 'Core',
        source,
        category,
        promotedDirect,
        reason: reasonForSource(source, targetCreature),
      }, logger, sources);
    }
  };
  const coreCreatureCount = () => selected.slice(0, 12).filter(isCreature).length;
  const coreNonCreatureCount = () => selected.slice(0, 12).filter((card) => !isCreature(card)).length;
  const coreFallbackSource = 'Scryfall broad oracle match';
  const themeOracle = exactOracleQuery(name);
  const colorLock = `id<=${colors.join('')} game:paper lang:en`;

  // ---- Core creature slots (target 5) ----
  addCoreUntil(pool, coreFallbackSource, 'direct-theme', true, () => coreCreatureCount() >= 5, true);
  if (coreCreatureCount() < 5) {
    try {
      const themedCreatures = await searchCards(`${themeOracle} ${colorLock} type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(themedCreatures, 'theme-oracle creature/payoff fallback', 'direct-theme', true, () => coreCreatureCount() >= 5, true);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle core creature fallback', e); }
  }
  if (isTypal && coreCreatureCount() < 5) {
    try {
      const changelings = await searchCards(`type:changeling type:creature ${colorLock}`, { order: 'edhrec', limit: 60, logger });
      addCoreUntil(changelings, 'Changeling tribal fill', 'direct-theme', true, () => coreCreatureCount() >= 5, true);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('Changeling core creature fill', e); }
  }
  if (coreCreatureCount() < 5) {
    try {
      const creatureSupport = await searchCards(`${colorLock} type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(creatureSupport, 'color-locked creature/payoff fallback (last resort)', 'generic-color-filler', true, () => coreCreatureCount() >= 5);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('core creature fallback', e); }
  }

  // ---- Core non-creature slots (target 7) ----
  addCoreUntil(pool, coreFallbackSource, 'direct-theme', false, () => coreNonCreatureCount() >= 7, true);
  if (coreNonCreatureCount() < 7) {
    try {
      const themedSupport = await searchCards(`${themeOracle} ${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(themedSupport, 'theme-oracle non-creature support fallback', 'direct-theme', false, () => coreNonCreatureCount() >= 7, true);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle core non-creature fallback', e); }
  }
  if (coreNonCreatureCount() < 7) {
    const adjacentQueries = getThemeAdjacentQueries(theme);
    for (const { query } of adjacentQueries) {
      if (coreNonCreatureCount() >= 7) break;
      try {
        const adjacentSupport = await searchCards(`${query} ${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
        addCoreUntil(adjacentSupport, `theme-adjacent non-creature query: ${query}`, 'theme-adjacent', false, () => coreNonCreatureCount() >= 7, false);
      } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`theme-adjacent core non-creature query ${query}`, e); }
    }
  }
  if (isTypal && coreNonCreatureCount() < 7) {
    try {
      const typalSupport = await searchCards(`${TYPAL_SUPPORT_ORACLE_QUERY} ${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(typalSupport, 'typal support oracle fallback', 'typal-support', false, () => coreNonCreatureCount() >= 7, true);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('typal support core non-creature fallback', e); }
  }
  if (coreNonCreatureCount() < 7) {
    try {
      const supportSpells = await searchCards(`${colorLock} -type:creature -type:land`, { order: 'edhrec', limit: 80, logger });
      addCoreUntil(supportSpells, 'color-locked non-creature support fallback (last resort)', 'generic-color-filler', false, () => coreNonCreatureCount() >= 7);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('core non-creature fallback', e); }
  }
  addCoreUntil(pool, coreFallbackSource, 'direct-theme', null, () => selected.length >= 12, true);
  if (selected.length < 12) logger?.line(`Core shortfall: selected ${selected.length}/12 after fallback hierarchy.`);
  logger?.line(`Core composition: creatures=${coreCreatureCount()} noncreatures=${coreNonCreatureCount()}`);

  // ---- Random/fallback slots (target 11 to reach 23) ----
  const randomPool = pool.filter((c) => !selected.some((s) => sameCard(s, c)));
  if (isTypal) {
    await runTypalSelectionPipeline({ name, colors, selected, randomPool, logger, addMany });
  } else {
    const logNonTypalStageFill = (stage, before) => logger?.line(`Non-typal stage ${stage} fill: +${selected.length - before} (${selected.length}/23).`);
    const stageAStart = selected.length;
    addMany(randomPool, 'Random all-time', 'Scryfall direct theme match', 'direct-theme', null, 23, true);
    logNonTypalStageFill('A (direct theme query)', stageAStart);

    if (selected.length < 23) {
      const stageBStart = selected.length;
      const adjacentQueries = getThemeAdjacentQueries(theme);
      const enablersAndPayoffs = adjacentQueries.filter(({ group }) => group === 'mechanicEnablers' || group === 'mechanicPayoffs');
      for (const { query } of enablersAndPayoffs) {
        if (selected.length >= 23) break;
        try {
          addMany(
            await searchCards(`${query} ${colorLock} -type:land`, { order: 'edhrec', limit: 160, logger }),
            'Random all-time',
            `theme enabler/payoff query: ${query}`,
            'theme-adjacent',
            null,
            23,
            false,
          );
        } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`theme enabler/payoff fallback query ${query}`, e); }
      }
      logNonTypalStageFill('B (mechanic enablers/payoffs)', stageBStart);

      if (selected.length < 23) {
        const stageCStart = selected.length;
        const adjacentOnly = adjacentQueries.filter(({ group }) => group !== 'mechanicEnablers' && group !== 'mechanicPayoffs');
        for (const { query } of adjacentOnly) {
          if (selected.length >= 23) break;
          try {
            addMany(
              await searchCards(`${query} ${colorLock} -type:land`, { order: 'edhrec', limit: 160, logger }),
              'Random all-time',
              `theme-adjacent query: ${query}`,
              'theme-adjacent',
              null,
              23,
              false,
            );
          } catch (e) { if (isHardOutage(e)) throw e; logger?.error(`theme-adjacent fallback query ${query}`, e); }
        }
        logNonTypalStageFill('C (theme-adjacent queries)', stageCStart);
      }
    }
  }
  if (selected.length < 23) {
    const host = getHostQuery(name);
    if (host) {
      logger?.line(`Parasitic host injection query used for ${name}: ${host}`);
      try { addMany(await searchCards(`${host} id<=${colors.join('')} game:paper lang:en`, { limit: 250, logger }), 'Random all-time', 'Scryfall broad oracle match', 'indirect-theme-support', null, 23); } catch (e) { if (isHardOutage(e)) throw e; logger?.error('host injector', e); }
    }
  }
  if (selected.length < 23) {
    logger?.line(`Theme-oracle broadened fallback needed: ${selected.length}/23.`);
    try {
      const broaderTheme = await searchCards(`${themeOracle} ${colorLock} -type:land`, { order: 'edhrec', limit: 500, logger });
      addMany(broaderTheme, 'Random all-time', 'Scryfall broad oracle match', 'theme-adjacent', null, 23, false);
    } catch (e) { if (isHardOutage(e)) throw e; logger?.error('theme-oracle broadened fallback', e); }
  }
  if (selected.length < 23) {
    logger?.line(`Narrow color-locked fallback (last resort) needed: ${selected.length}/23.`);
    try { addMany(await searchCards(`${colorLock} -type:land`, { order: 'edhrec', limit: 500, logger }), 'Random all-time', 'generic color-compatible fallback', 'generic-color-filler', null, 23); } catch (e) { if (isHardOutage(e)) throw e; logger?.error('narrow fallback', e); }
  }
  if (selected.length < 23) throw new Error(`Could not build 23 non-land cards for ${name}; got ${selected.length}`);
  await repairDirectSynergies(selected, pool, colors, logger, sources);
  if (selected.length < 23) throw new Error(`Could not build 23 non-land cards for ${name} after direct synergy repair; got ${selected.length}`);
  const directIssues = directSynergyIssues(selected);
  if (directIssues.length) throw new Error(`Unresolved direct synergy issues: ${directIssues.map((issue) => issue.detail).join('; ')}`);
  let themeValidation = validateThemeSynergySources(selected, sources);
  logger?.line(`Theme evidence validation before rebalance: direct_evidence=${themeValidation.directEvidenceCount}/${themeValidation.minimumRequired}; fallback_only=${themeValidation.fallbackOnlyCardIds.length}.`);
  if (!themeValidation.passesMinimum) themeValidation = rebalanceToMinimumDirectEvidence({ selected, sources, pool, colors, logger });
  if (themeValidation.missingMetadata.length) throw new Error(`Theme synergy metadata missing for selected cards: ${themeValidation.missingMetadata.join(', ')}`);
  if (!themeValidation.passesMinimum) {
    throw new Error(`Theme evidence shortfall after deterministic evidence-first rebalance: ${themeValidation.directEvidenceCount}/${themeValidation.minimumRequired}. Fallback-only cards: ${themeValidation.fallbackOnlyCardIds.join(', ') || 'none'}.`);
  }
  logger?.line(`Theme evidence validation passed: direct_evidence=${themeValidation.directEvidenceCount}/${themeValidation.minimumRequired}.`);
  const core = selected.slice(0, 12);
  const random = selected.slice(12, 23);
  logger?.line(`Selected 12 core cards: ${core.map((c) => c.name).join(', ')}`);
  logger?.line(`Selected 11 random/fallback cards: ${random.map((c) => c.name).join(', ')}`);
  return { nonlands: selected.slice(0, 23), core, random, colors, colorResult, sources };
}
