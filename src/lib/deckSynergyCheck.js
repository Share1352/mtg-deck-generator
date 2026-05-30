import { BASIC_BY_COLOR } from './constants.js';
import { colorIdentityWithin, isBasicLand, isLand, isPlayableAsLand, isPlayableMainDeckCard, sameCard } from './filters.js';
import { directSynergyIssues, referencedCardNames } from './synergyRules.js';
import { shuffle } from './random.js';
import { searchCards, ScryfallError } from './scryfallClient.js';

function isHardOutage(error) {
  return error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429);
}

// Land-target requirements ("search for a basic land", "fetch a Forest") are inherently
// satisfied by the mana base, so they are never real open synergy issues for a finished deck.
function openIssues(cards) {
  return directSynergyIssues(cards).filter(
    (i) => !((i.type === 'tutor-target' || i.type === 'type-control') && i.requirement?.landTarget),
  );
}

// Every printed synergy in the finished deck (non-lands AND lands) whose target is missing.
// This is the check the user wants run "at the very end": lands count both as things that
// demand synergy partners and as things that can satisfy other cards.
export function deckSynergyIssues(deck) {
  const all = [...(deck?.nonlands || []), ...(deck?.lands || [])];
  return openIssues(all);
}

// A non-basic land that no other card names is safe to swap out when its own synergy is dead.
function isRemovableSynergyLand(card, referencedNames) {
  return isLand(card) && !isBasicLand(card) && !referencedNames.has(String(card?.name || '').toLowerCase());
}

function basicReplacement(deck, colors) {
  // Prefer cloning a basic already in the deck so art/snow choices stay consistent.
  const existingBasic = (deck.lands || []).find(isBasicLand);
  if (existingBasic) return existingBasic;
  const color = (colors || []).find((c) => BASIC_BY_COLOR[c]) || 'C';
  const name = BASIC_BY_COLOR[color] || 'Wastes';
  return { name, type_line: 'Basic Land', set: 'SLD', collector_number: '999', lang: 'en', color_identity: [], oracle_id: `${name}-final-fallback` };
}

async function cleanReplacementLand(colors, deckCards, logger, rng, landPool) {
  let pool = landPool;
  if (!pool) {
    const colorQuery = colors.length ? `id<=${colors.join('')}` : 'id:c';
    pool = [];
    try {
      pool = await searchCards(`type:land -type:basic ${colorQuery} game:paper lang:en`, { order: 'edhrec', limit: 175, logger });
    } catch (e) {
      if (isHardOutage(e)) throw e;
      logger?.error('final synergy replacement land fetch', e);
    }
  }
  for (const c of shuffle(pool, rng)) {
    if (!isPlayableAsLand(c) || isBasicLand(c) || !isPlayableMainDeckCard(c) || !colorIdentityWithin(c, colors)) continue;
    if (deckCards.some((x) => sameCard(x, c))) continue;
    // The replacement must not itself drag in an unmet synergy.
    if (openIssues([...deckCards, c]).some((i) => sameCard(i.card, c))) continue;
    return c;
  }
  return null;
}

// Final pass: guarantee every card kept in the deck has its printed synergies satisfied.
// Repairs the one class of dead synergy the selection phase cannot see — utility lands added
// by the mana base (they want a Dragon / an artifact / etc. that the deck never contained).
// Such lands are swapped for a synergy-clean in-colour land, falling back to a basic.
export async function finalizeDeckSynergies(deck, { colors = [], logger, rng = Math.random, landPool = null } = {}) {
  let replaced = 0;
  for (let pass = 1; pass <= 8; pass += 1) {
    const all = [...deck.nonlands, ...deck.lands];
    const issues = openIssues(all);
    if (!issues.length) break;
    const referencedNames = new Set();
    for (const c of all) for (const n of referencedCardNames(c)) referencedNames.add(n.toLowerCase());

    const landIssue = issues.find((i) => isRemovableSynergyLand(i.card, referencedNames));
    if (!landIssue) break; // remaining issues belong to non-lands / named lands — reported below

    const idx = deck.lands.findIndex((l) => sameCard(l, landIssue.card));
    if (idx < 0) break;
    const removed = deck.lands[idx];
    const deckCards = all.filter((c) => !sameCard(c, removed));
    const replacement = (await cleanReplacementLand(colors, deckCards, logger, rng, landPool)) || basicReplacement(deck, colors);
    if (!replacement) break;
    deck.lands[idx] = replacement;
    replaced += 1;
    logger?.line(`Final synergy check: replaced ${removed.name} — unmet synergy (${landIssue.detail}) — with ${replacement.name}.`);
  }

  const remaining = openIssues([...deck.nonlands, ...deck.lands]);
  if (remaining.length) {
    logger?.line(`Final whole-deck synergy check: ${remaining.length} unresolved synergy issue(s) (non-fatal): ${remaining.map((i) => i.detail).join('; ')}`);
  } else {
    logger?.line(`Final whole-deck synergy check: all ${deck.nonlands.length + deck.lands.length} cards have their synergies satisfied${replaced ? ` after ${replaced} land swap(s)` : ''}.`);
  }
  return { replaced, remaining };
}
