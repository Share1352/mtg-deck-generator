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
  if (/draft/i.test(oracleText(card))) return false;
  return true;
}
export function colorIdentityWithin(card, colors) {
  const id = card?.color_identity || [];
  if (!id.length) return true;
  return id.every((c) => colors.includes(c));
}
export function uniqueByOracle(cards) {
  const out = [];
  for (const card of cards) if (!out.some((x) => sameCard(x, card))) out.push(card);
  return out;
}
