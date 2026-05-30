import { BANNED_CARD_NAMES, GOODSTUFF_NAMES } from './constants.js';

const invalidLayouts = new Set(['token','double_faced_token','emblem','art_series','reversible_card','dungeon','bounty','planar','scheme','vanguard','phenomenon','contraption','attraction','augment','host']);
const invalidTypeWords = ['Sticker','Hero','Vanguard','Conspiracy','Phenomenon','Plane','Dungeon','Bounty','Attraction','Contraption','Scheme','Background','Host'];
const commanderPhrases = [/\bcommander(?:s|'s)?\b/i, /command zone/i, /lieutenant/i, /commander tax/i, /choose a background/i, /\bpartner(?: with)?\b/i, /friends forever/i];
const bannedNormalizedNames = new Set([...BANNED_CARD_NAMES].map((n) => String(n).toLowerCase().replace(/\s+/g, ' ').trim()));
function normalizeName(name) { return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
const sidePhrases = [
  /open an attraction/i,
  /visit.*attraction/i,
  /put a sticker/i,
  /sticker sheet/i,
  /ticket counter/i,
  /assemble a contraption/i,
  /\bcontraption\b/i,
  /\battractions?\b/i,
  /\bstickers?\b/i,
  /combine .* host/i,
  /\baugment\b/i,
  /venture into .*dungeon card/i,
  /outside the game/i,
];
const bandingPatterns = [/\bbanding\b/i, /\bbands? with other\b/i];
// Mechanics/cards that only function in multiplayer (3+ players). This app builds 1v1 decks,
// so these are dead or degraded weight. Myriad makes copies attacking *other* opponents (none in 1v1);
// the council/vote/join-forces family is table politics; "attacks one of your opponents" style triggers
// (e.g. Combat Calligrapher) need players attacking each other. Goad and Melee are kept — both work in 1v1.
const multiplayerKeywords = new Set(['myriad', 'join forces', 'tempting offer', 'will of the council', "council's dilemma", 'parley']);
const multiplayerPhrases = [
  /\bmyriad\b/i,
  /\bjoin forces\b/i,
  /\btempting offer\b/i,
  /\bwill of the council\b/i,
  /\bcouncil'?s dilemma\b/i,
  /\bparley\b/i,
  /each player votes/i,
  /\bvotes? for\b/i,
  /attacks one of your opponents/i,
];
const bannedSets = new Set([
  '40k','t40k','pw23',
  'who','twho',
  'pip','tpip',
  'tla','tle','ttla','ptla',
  'spm','spe','tspm','pspm',
  'bot','tbot','ptbot',
  'acr','tacr','pacr',
  'fin','fic','tfin','tfic','pfin','pfic',
  'rex',
  // Teenage Mutant Ninja Turtles (Viacom crossover) — every printing/token/promo of the family.
  'tmt','tmc','ttmt','ttmc','atmt','ftmc','pza','ptmt','ptmc',
]);
const bannedNameFamilies = [
  /Transformers/i,
  /Warhammer 40,?000/i,
  /Doctor Who/i,
  /\bFallout\b/i,
  /Spider-Man/i,
  /\bMarvel\b/i,
  /Avatar: The Last Airbender/i,
  /Assassin'?s Creed/i,
  /Final Fantasy/i,
  /Jurassic (World|Park)/i,
  /Teenage Mutant Ninja Turtles/i,
  /Ninja Turtles/i,
];
const lotrAllowedSets = new Set(['ltr','ltc','tltr','tltc','pltr','pltc']);
const lotrNameFamilies = [/Lord of the Rings/i, /Middle-earth/i, /Tales of Middle/i];

export function cardFaces(card) { return card?.card_faces?.length ? card.card_faces : [card]; }
export function typeLine(card) { return cardFaces(card).map((f) => f.type_line || '').join(' // '); }
export function oracleText(card) { return cardFaces(card).map((f) => f.oracle_text || '').join('\n'); }
export function isLand(card) { return /(^|\s|—)Land(\s|$)/.test(typeLine(card)); }
export function isCreature(card) { return /(^|\s|—)Creature(\s|$)/.test(typeLine(card)); }
const LAND_TYPE_RE = /(^|\s|—)Land(\s|$)/;
export function isPlayableAsLand(card) {
  if (!card) return false;
  const faces = cardFaces(card);
  const front = faces[0] || card;
  const layout = card.layout;
  if (layout === 'modal_dfc') return faces.some((f) => LAND_TYPE_RE.test(f?.type_line || ''));
  if (layout === 'transform' || layout === 'meld' || layout === 'flip') return LAND_TYPE_RE.test(front?.type_line || '');
  return LAND_TYPE_RE.test(front?.type_line || typeLine(card));
}
export function isBasicLand(card) {
  const name = card?.name || '';
  return /^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$/.test(name) || /Basic Land/.test(typeLine(card));
}
export function sameCard(a, b) {
  if (!a || !b) return false;
  if (isBasicLand(a) && isBasicLand(b)) return false;
  return (a.oracle_id && b.oracle_id && a.oracle_id === b.oracle_id) || a.name === b.name;
}
export function isBannedCrossover(card) {
  const set = String(card?.set || '').toLowerCase();
  const haystack = `${card?.set_name || ''} ${card?.name || ''}`;
  if (lotrAllowedSets.has(set)) return false;
  if (lotrNameFamilies.some((re) => re.test(haystack))) return false;
  if (bannedSets.has(set)) return true;
  return bannedNameFamilies.some((re) => re.test(haystack));
}
export function isCommanderOnly(card) {
  if (bannedNormalizedNames.has(normalizeName(card?.name))) return true;
  for (const face of cardFaces(card)) if (bannedNormalizedNames.has(normalizeName(face?.name))) return true;
  return commanderPhrases.some((re) => re.test(oracleText(card)));
}
export function needsSideDeck(card) { return sidePhrases.some((re) => re.test(`${oracleText(card)} ${typeLine(card)}`)); }
export function isMultiplayerOnly(card) {
  if (!card) return false;
  const keywords = Array.isArray(card.keywords) ? card.keywords : [];
  if (keywords.some((k) => multiplayerKeywords.has(String(k).toLowerCase().trim()))) return true;
  return multiplayerPhrases.some((re) => re.test(oracleText(card)));
}
export function hasBanding(card) {
  if (!card) return false;
  const keywords = Array.isArray(card.keywords) ? card.keywords : [];
  if (keywords.some((k) => /^banding$/i.test(String(k)) || /^bands with other/i.test(String(k)))) return true;
  return bandingPatterns.some((re) => re.test(oracleText(card)));
}
export function isPlayableMainDeckCard(card, { allowLands = true, allowGoodstuff = true } = {}) {
  if (!card) return false;
  if (invalidLayouts.has(card.layout)) return false;
  if (card.digital || card.lang && card.lang !== 'en') return false;
  if (card.set_type === 'alchemy' || card.set_type === 'memorabilia' || card.set_type === 'token') return false;
  if (card.set === 'mbtest' || card.set === 'cmb1' || card.set === 'cmb2' || card.set === 'ptg') return false;
  if (card.legalities?.commander === 'banned' || card.legalities?.vintage === 'banned') return false;
  if (card.name?.startsWith('A-')) return false;
  if (!allowLands && isLand(card)) return false;
  if (!allowGoodstuff && GOODSTUFF_NAMES.has(card.name)) return false;
  const types = typeLine(card);
  if (invalidTypeWords.some((word) => new RegExp(`(^|\\s|—)${word}(\\s|$)`, 'i').test(types))) return false;
  if (isCommanderOnly(card) || needsSideDeck(card) || isBannedCrossover(card)) return false;
  if (hasBanding(card)) return false;
  if (isMultiplayerOnly(card)) return false;
  if (/draft/i.test(oracleText(card))) return false;
  return true;
}
export function colorIdentityWithin(card, colors) {
  const id = card?.color_identity || [];
  if (!id.length) return true;
  return id.every((c) => colors.includes(c));
}
const COLOR_LETTERS = ['W','U','B','R','G'];
const COLOR_WORD_RE = { W: /\bwhite\b/i, U: /\bblue\b/i, B: /\bblack\b/i, R: /\bred\b/i, G: /\bgreen\b/i };
export function producesOnlyOffColorMana(card, deckColors) {
  const produced = Array.isArray(card?.produced_mana) ? card.produced_mana : [];
  const coloredProduced = produced.filter((c) => COLOR_LETTERS.includes(c));
  if (!coloredProduced.length) return false;
  return !coloredProduced.some((c) => deckColors.includes(c));
}
export function mentionsOnlyOffDeckColors(card, deckColors) {
  const ci = card?.color_identity || [];
  if (ci.length) return false;
  const text = oracleText(card);
  if (!text) return false;
  const mentioned = new Set();
  for (const c of COLOR_LETTERS) if (COLOR_WORD_RE[c].test(text)) mentioned.add(c);
  const symbolMatches = text.match(/\{([WUBRG])\}/g) || [];
  for (const m of symbolMatches) mentioned.add(m.slice(1, -1));
  if (!mentioned.size) return false;
  for (const c of mentioned) if (deckColors.includes(c)) return false;
  return true;
}
export function isOffColorSupportCard(card, deckColors) {
  if (!Array.isArray(deckColors) || !deckColors.length) return false;
  if (producesOnlyOffColorMana(card, deckColors)) return true;
  if (mentionsOnlyOffDeckColors(card, deckColors)) return true;
  return false;
}
export function uniqueByOracle(cards) {
  const out = [];
  for (const card of cards) if (!out.some((x) => sameCard(x, card))) out.push(card);
  return out;
}
