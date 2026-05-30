import { isBasicLand, isLand, oracleText, sameCard, typeLine } from './filters.js';
import { CREATURE_TYPES } from './constants.js';

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const BASIC_LAND_TYPES = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
const CARD_TYPES = ['artifact', 'creature', 'enchantment', 'instant', 'sorcery', 'planeswalker', 'land', 'battle'];
// Recognised card types and well known subtypes that a "search your library for a ___ card" clause can ask for.
const TYPE_WORDS = [...CARD_TYPES, 'kindred', 'aura', 'equipment', 'vehicle', 'saga', 'class', 'background', 'food', 'clue', 'treasure', 'blood', 'powerstone'];
const OTHER_PERMANENT_SUBTYPES = new Set(['aura', 'equipment', 'vehicle', 'saga', 'class', 'room', 'shrine', 'curse', 'background', 'fortification', 'contraption', 'attraction']);
const TOKEN_ARTIFACT_TYPES = new Set(['treasure', 'clue', 'food', 'blood', 'powerstone', 'map', 'incubator', 'gold', 'junk', 'oil', 'shard']);
// words that look like a "type" but must NOT trigger a card-presence requirement
const SKIP_TYPE_WORDS = new Set(['legendary', 'snow', 'basic', 'world', 'token', 'permanent', 'spell', 'card', 'cards', 'red', 'blue', 'green', 'white', 'black', 'colorless', 'colourless', 'multicolored', 'monocolored', 'nonland', 'noncreature', 'nontoken', 'tapped', 'untapped', 'another', 'other', 'attacking', 'blocking', 'opponent', 'opponents', 'player', 'players', 'creatureyou', 'thing']);
const BASIC_LAND_WORDS = new Set(['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes']);

const singular = (w) => (w.endsWith('s') ? w.slice(0, -1) : w);
const isCreatureType = (w) => CREATURE_TYPES.has(w) || CREATURE_TYPES.has(singular(w));
const hasTypeWord = (card, word) => new RegExp(`(^|\\s|—)${word}(\\s|$)`, 'i').test(typeLine(card));
const createsToken = (card, word) => /\bcreate\b/i.test(oracleText(card)) && new RegExp(`\\b${word}\\b`, 'i').test(oracleText(card));

const CARD_NAME_PATTERNS = [
  /cards? named ([^.,;\n]+)/gi,
  /a card named ([^.,;\n]+)/gi,
];

function cleanReferencedName(raw) {
  return String(raw || '')
    .replace(/\s+and\s+put.*$/i, '')
    .replace(/\s+from.*$/i, '')
    .replace(/\s+in.*$/i, '')
    .replace(/\s+onto.*$/i, '')
    .replace(/\s+to\s+.*$/i, '')
    .replace(/["“”]/g, '')
    .trim();
}

// classify a captured word as a card type / subtype requirement, or null if it is not a real type.
function classifyTypeWord(word) {
  const s = singular(String(word || '').toLowerCase().replace(/[^a-z]/g, ''));
  if (!s || BASIC_LAND_WORDS.has(s) || SKIP_TYPE_WORDS.has(s)) return null;
  if (isCreatureType(s)) return { type: s, kind: 'creature-subtype' };
  if (OTHER_PERMANENT_SUBTYPES.has(s)) return { type: s, kind: 'subtype' };
  if (TOKEN_ARTIFACT_TYPES.has(s)) return { type: s, kind: 'token' };
  if (CARD_TYPES.includes(s)) return { type: s, kind: 'card-type' };
  return null;
}

// Names of specific cards a card explicitly needs in the deck: "card named X" and "control an <Proper Name>".
export function referencedCardNames(card) {
  const names = [];
  const push = (n) => { const c = cleanReferencedName(n); if (c && !names.some((x) => x.toLowerCase() === c.toLowerCase())) names.push(c); };
  const text = oracleText(card);
  for (const pattern of CARD_NAME_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      for (const part of cleanReferencedName(match[1]).split(/\s+(?:or|and)\s+/i)) push(part);
    }
  }
  // "if you control an Urza's Mine, an Urza's Power-Plant, and an Urza's Tower" / "control an Oko planeswalker"
  for (const m of text.matchAll(/\bcontrols?\s+([^.;]+)/gi)) {
    for (const a of m[1].matchAll(/\b(?:an?|another|two|three|four)\s+((?:[A-Z][A-Za-z'’.-]*)(?:[ -][A-Z][A-Za-z'’.-]*)*)/g)) {
      const phrase = a[1].trim();
      const norm = phrase.split(/[ -]/).filter(Boolean).map((t) => singular(t.toLowerCase().replace(/[^a-z]/g, '')));
      // a phrase made up entirely of type / colour / supertype / basic-land words is a *type* requirement, not a card name
      const allTypeOrSkip = norm.every((t) => !t || classifyTypeWord(t) || SKIP_TYPE_WORDS.has(t) || BASIC_LAND_WORDS.has(t));
      if (allTypeOrSkip) continue;
      push(phrase);
    }
  }
  return names;
}

export function referencesOwnName(card) {
  return referencedCardNames(card).some((name) => name.toLowerCase() === String(card?.name || '').toLowerCase());
}
// Backwards-compatible alias. Self-name cards are now *supported* by adding copies, not skipped.
export const hasUnsupportedSelfNameSynergy = () => false;

export function copiesFor(card) {
  const text = oracleText(card).toLowerCase();
  if (/a deck can have any number of cards named/.test(text)) return 6;
  if (/\bgrandeur\b/.test(text)) return 3;
  if (/\banother card named\b/.test(text)) return 3;
  if (referencesOwnName(card)) return 3;
  return 1;
}
export function isMultiCopyCard(card) { return copiesFor(card) > 1; }

// Normalise a card name for comparison: lowercase and collapse all punctuation/whitespace to single
// spaces. This is the same shape as manaBase.js's normName so the final named-reference check matches
// "Urza's Power-Plant" (older oracle templating) against the real "Urza's Power Plant" already present.
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const nameSatisfied = (ref, cards) => {
  const r = normName(ref);
  if (!r) return false;
  return cards.some((c) => {
    const faces = c?.card_faces?.length ? c.card_faces : [c];
    return [c?.name, ...faces.map((f) => f?.name)].some((nm) => {
      const n = normName(nm);
      return !!n && (n === r || n.includes(r));
    });
  });
};
export function missingNamedReferences(card, cards) {
  const self = normName(card?.name);
  return referencedCardNames(card).filter((name) => normName(name) !== self && !nameSatisfied(name, cards));
}

function mvPredicate(op, value) {
  if (op === 'less') return (n) => n <= value;
  if (op === 'greater') return (n) => n >= value;
  if (op === 'exactly') return (n) => n === value;
  return () => true;
}

function typeMatcher(word) {
  const w = word.toLowerCase();
  if (w === 'land') return (card) => isLand(card);
  return (card) => hasTypeWord(card, word) && !isLand(card);
}

// "search your library for ___" -> a requirement we can guarantee a target for.
export function tutorRequirements(card) {
  const text = oracleText(card);
  const reqs = [];
  const clauseRe = /search(?:es)? (?:your|their|that player's) library for ([^.;]+)/gi;
  for (const match of text.matchAll(clauseRe)) {
    const phrase = match[1].trim();
    const lower = phrase.toLowerCase();
    if (/card named/i.test(phrase)) continue;
    if (/basic land card/i.test(phrase)) { reqs.push({ name: 'basic land', query: 'type:basic', landTarget: true, matches: (c) => isBasicLand(c) }); continue; }
    const basicTypeHits = BASIC_LAND_TYPES.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(phrase));
    if (basicTypeHits.length) {
      reqs.push({ name: `${basicTypeHits.join('/')} land`, query: `(${basicTypeHits.map((t) => `type:${t}`).join(' OR ')})`, landTarget: true, matches: (c) => basicTypeHits.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(typeLine(c))) });
      continue;
    }
    let mv = null;
    const mvMatch = lower.match(/mana value (\d+|one|two|three|four|five|six|seven|eight|nine|ten) or (less|greater)/);
    if (mvMatch) { const value = NUMBER_WORDS[mvMatch[1]] ?? Number(mvMatch[1]); mv = { op: mvMatch[2], value, pred: mvPredicate(mvMatch[2], value) }; }
    const typeMatch = phrase.match(/\ban?\s+([A-Za-z][A-Za-z'-]+)\s+(?:permanent\s+)?cards?\b/);
    let typeWord = typeMatch ? typeMatch[1] : null;
    if (!typeWord) { const subtypeMatch = phrase.match(/\ban?\s+([A-Z][a-z]+)\b/); if (subtypeMatch) typeWord = subtypeMatch[1]; }
    if (typeWord && TYPE_WORDS.includes(typeWord.toLowerCase()) === false && !/^[A-Z]/.test(typeWord)) typeWord = null;
    if (!typeWord) continue;
    const matchType = typeMatcher(typeWord);
    const isLandTarget = typeWord.toLowerCase() === 'land';
    const cmcQuery = mv ? (mv.op === 'less' ? ` cmc<=${mv.value}` : mv.op === 'greater' ? ` cmc>=${mv.value}` : ` cmc=${mv.value}`) : '';
    const typeQueryWord = TYPE_WORDS.includes(typeWord.toLowerCase()) ? `type:${typeWord.toLowerCase()}` : `type:${typeWord}`;
    reqs.push({ name: `${typeWord} card${mv ? ` mv ${mv.op} ${mv.value}` : ''}`, query: `${typeQueryWord}${cmcQuery}${isLandTarget ? '' : ' -type:land'}`, landTarget: isLandTarget, matches: (c) => matchType(c) && (!mv || mv.pred(Number(c?.cmc ?? 99))) });
  }
  return reqs;
}

export function hasTutorTarget(card, cards) {
  const requirements = tutorRequirements(card);
  if (!requirements.length) return true;
  return requirements.every((requirement) => cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate)));
}

// Cards that reward controlling a type of permanent (your own): "control a Dragon", "Vehicles you control",
// "whenever an Artifact you control enters", "for each Goblin you control". Needs that type present in the deck.
export function typeControlRequirements(card) {
  const text = oracleText(card);
  const found = new Map();
  const consider = (word) => {
    const cls = classifyTypeWord(word);
    if (!cls || found.has(cls.type)) return;
    const { type, kind } = cls;
    const query = kind === 'token' ? `(type:${type} OR oracle:"create" oracle:"${type}") -type:land`
      : type === 'land' ? 'type:land' : `type:${type} -type:land`;
    found.set(type, {
      name: `a ${type} you control`, type, kind, query, landTarget: type === 'land',
      matches: (c) => (type === 'land' ? isLand(c) : kind === 'token' ? (hasTypeWord(c, type) || createsToken(c, type)) : (hasTypeWord(c, type) && !isLand(c))),
    });
  };
  const patterns = [
    /\b(?:control|controls)\s+(?:a|an|another)\s+([A-Za-z][A-Za-z'-]+)/gi,
    /\b([A-Za-z][A-Za-z'-]+?)s?\s+you\s+control\b/gi,
    /\bfor each\s+([A-Za-z][A-Za-z'-]+?)s?\s+you\s+control\b/gi,
    /\bwhenever\s+(?:a|an|another)\s+([A-Za-z][A-Za-z'-]+)\b(?=[^.;]*\byou control\b)/gi,
    /\bsacrifice\s+(?:a|an|another)\s+([A-Za-z][A-Za-z'-]+)\b/gi,
  ];
  for (const re of patterns) for (const m of text.matchAll(re)) consider(m[1]);
  return [...found.values()];
}

// Cards that only come online with a *quantity* of a permanent type: "control seven or more
// enchantments", "if you control five or more artifacts". The deck must actually field that many.
const COUNT_THRESHOLD_SKIP = new Set(['land', 'card', 'cards', 'permanent', 'spell']);
export function countThresholdRequirements(card) {
  const text = oracleText(card);
  const found = new Map();
  const re = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+or more\s+([a-z][a-z'-]+?)s\b/gi;
  for (const m of text.matchAll(re)) {
    const count = NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1]);
    if (!Number.isFinite(count) || count < 3 || count > 12) continue; // 1-2 are trivially met; cap absurd asks
    const cls = classifyTypeWord(m[2]);
    if (!cls || COUNT_THRESHOLD_SKIP.has(cls.type)) continue;
    const { type, kind } = cls;
    const prev = found.get(type);
    if (prev && prev.count >= count) continue;
    found.set(type, {
      name: `${count}+ ${type}s`, type, count, kind,
      query: kind === 'token' ? `(type:${type} OR oracle:"create" oracle:"${type}") -type:land` : `type:${type} -type:land`,
      matches: (c) => (kind === 'token' ? (hasTypeWord(c, type) || createsToken(c, type)) : (hasTypeWord(c, type) && !isLand(c))),
    });
  }
  return [...found.values()];
}

// Cards that reward *completing a dungeon* (e.g. White Plume Adventurer) need an active venture
// source so the dungeon mechanic actually functions. "Take the initiative" ventures Undercity.
const DUNGEON_REWARD_RE = /(completed a dungeon|complete a dungeon|you have completed|you've completed|completes a dungeon)/i;
const VENTURE_SOURCE_RE = /(venture into the dungeon|takes? the initiative|have the initiative)/i;
export function dungeonRequirements(card) {
  if (!DUNGEON_REWARD_RE.test(oracleText(card))) return [];
  return [{
    name: 'a dungeon venture source',
    query: '(oracle:"venture into the dungeon" OR oracle:"the initiative") -type:land',
    matches: (c) => VENTURE_SOURCE_RE.test(oracleText(c)),
  }];
}

// --- soft "gameplay enabler" synergies -------------------------------------------------------
// Some cards are only live if the deck supplies a gameplay action they never provide themselves:
// a discard-matters payoff needs someone to make opponents discard; a death/sacrifice payoff needs a
// repeatable way to make creatures die. These are exactly the "soft requirements" the synergy checker
// used to miss (Waste Not with no discard, Ogre Slumlord / Elenda's Hierophant with no sac outlet).

// "Whenever an opponent/player discards …" — a payoff that does nothing without a forced-discard source.
const OPP_DISCARD_PAYOFF_RE = /\bwhenever\s+(?:an?\s+)?(?:opponent|player)s?\s+discard/i;
// A card that actually forces a discard: "each/target/that opponent|player discards …".
const FORCES_DISCARD_RE = /\b(?:each|target|that)\s+(?:opponent|player)s?\s+discards?\b/i;
const forcesOpponentDiscard = (card) => FORCES_DISCARD_RE.test(oracleText(card));
export function discardSynergyRequirements(card) {
  const text = oracleText(card);
  if (!OPP_DISCARD_PAYOFF_RE.test(text)) return [];
  if (forcesOpponentDiscard(card)) return []; // self-contained: it both forces discard and pays off
  return [{
    name: 'a way to make opponents discard',
    query: '(oracle:"opponent discards" OR oracle:"target player discards" OR oracle:"each player discards" OR oracle:"each opponent discards") -type:land',
    matches: (c) => forcesOpponentDiscard(c),
  }];
}

// A repeatable sacrifice outlet: an activated ability (or rule) that sacrifices a creature on demand.
const SAC_OUTLET_RE = /\bsacrifice (?:a|an|another) (?:creature|permanent)\b/i;
const SAC_OUTLET_PAYOFF_RE = /\bwhenever you sacrifice\b/i; // a payoff, not an outlet
export const isSacrificeOutlet = (card) => SAC_OUTLET_RE.test(oracleText(card)) && !SAC_OUTLET_PAYOFF_RE.test(oracleText(card));
// A death-matters payoff about *your* creatures dying ("Whenever NAME or another creature you control
// dies", "Whenever a nontoken creature you control dies"). Combat alone is unreliable, so the deck needs
// a sacrifice outlet to make creatures die on demand. We only flag controller-side death triggers — an
// opponent-side "whenever a creature an opponent controls dies" is fed by ordinary removal, not a sac outlet.
function isOwnCreatureDeathPayoff(card) {
  return oracleText(card).split(/[.;\n]/).some((clause) => {
    if (!/\bwhenever\b/i.test(clause) || !/\bcreatures?\b/i.test(clause) || !/\b(?:dies|die)\b/i.test(clause)) return false;
    if (/\bopponent/i.test(clause)) return false; // their creatures dying — handled by removal, not a sac outlet
    return /\byou control\b/i.test(clause) || /\b(?:another|nontoken|other)\b/i.test(clause);
  });
}
export function deathPayoffRequirements(card) {
  if (!isOwnCreatureDeathPayoff(card)) return [];
  if (isSacrificeOutlet(card)) return []; // it can feed itself
  return [{
    name: 'a sacrifice outlet to make creatures die on demand',
    query: '(oracle:"sacrifice a creature:" OR oracle:"sacrifice another creature" OR oracle:", sacrifice a creature") -type:land',
    matches: (c) => isSacrificeOutlet(c),
  }];
}

export function directSynergyIssues(cards) {
  const issues = [];
  for (const card of cards) {
    for (const missing of missingNamedReferences(card, cards)) issues.push({ card, type: 'named-card', detail: `${card.name} directly references missing card ${missing}`, missingName: missing });
    for (const requirement of tutorRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'tutor-target', detail: `${card.name} needs a ${requirement.name} target`, requirement });
    }
    for (const requirement of typeControlRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'type-control', detail: `${card.name} wants ${requirement.name}`, requirement });
    }
    for (const requirement of countThresholdRequirements(card)) {
      const have = cards.filter((candidate) => requirement.matches(candidate)).length; // you control the card itself, so count it
      if (have < requirement.count) issues.push({ card, type: 'count-threshold', detail: `${card.name} needs ${requirement.name} (have ${have})`, requirement, deficit: requirement.count - have });
    }
    for (const requirement of dungeonRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'mechanic-presence', detail: `${card.name} rewards completing a dungeon but nothing ventures`, requirement });
    }
    for (const requirement of discardSynergyRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'mechanic-presence', detail: `${card.name} rewards opponents discarding but the deck has no forced-discard source`, requirement });
    }
    for (const requirement of deathPayoffRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'mechanic-presence', detail: `${card.name} wants creatures to die but the deck has no sacrifice outlet`, requirement });
    }
  }
  return issues;
}
