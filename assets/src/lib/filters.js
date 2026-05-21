import { BANNED_CARD_NAMES, GOODSTUFF_NAMES } from './constants.js';

const invalidLayouts = new Set(['token','double_faced_token','emblem','art_series','reversible_card','dungeon','bounty','planar','scheme','vanguard','phenomenon','contraption','attraction']);
const invalidTypeWords = ['Sticker','Hero','Vanguard','Conspiracy','Phenomenon','Plane','Dungeon','Bounty','Attraction','Contraption','Scheme','Background'];
const commanderPhrases = [/\bcommander(?:s|'s)?\b/i, /command zone/i, /lieutenant/i, /commander tax/i, /choose a background/i, /\bpartner(?: with)?\b/i, /friends forever/i];
const bannedNormalizedNames = new Set([...BANNED_CARD_NAMES].map((n) => String(n).toLowerCase().replace(/\s+/g, ' ').trim()));
function normalizeName(name) { return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
const sidePhrases = [/open an attraction/i, /visit.*attraction/i, /put a sticker/i, /ticket counter/i, /assemble a contraption/i, /venture into .*dungeon card/i];
const bannedSets = new Set(['bot','40k','who','pip','tla','tle','ttla','spm','spe']);
const bannedNameFamilies = [/Transformers/i, /Warhammer 40,?000/i, /Doctor Who/i, /Fallout/i, /Spider-Man/i, /Marvel/i, /Avatar: The Last Airbender/i];

export function cardFaces(card) { return card?.card_faces?.length ? card.card_faces : [card]; }
export function typeLine(card) { return cardFaces(card).map((f) => f.type_line || '').join(' // '); }
export function oracleText(card) { return cardFaces(card).map((f) => f.oracle_text || '').join('\n'); }
export function isLand(card) { return /(^|\s|—)Land(\s|$)/.test(typeLine(card)); }
export function isCreature(card) { return /(^|\s|—)Creature(\s|$)/.test(typeLine(card)); }
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
  if (bannedSets.has(set)) return true;
  const haystack = `${card?.set_name || ''} ${card?.name || ''}`;
  return bannedNameFamilies.some((re) => re.test(haystack));
}
export function isCommanderOnly(card) {
  if (bannedNormalizedNames.has(normalizeName(card?.name))) return true;
  for (const face of cardFaces(card)) if (bannedNormalizedNames.has(normalizeName(face?.name))) return true;
  return commanderPhrases.some((re) => re.test(oracleText(card)));
}
export function needsSideDeck(card) { return sidePhrases.some((re) => re.test(`${oracleText(card)} ${typeLine(card)}`)); }
export function isPlayableMainDeckCard(card, { allowLands = true, allowGoodstuff = true } = {}) {
  if (!card) return false;
  if (invalidLayouts.has(card.layout)) return false;
  if (card.digital || card.lang && card.lang !== 'en') return false;
  if (card.set_type === 'alchemy' || card.set_type === 'memorabilia' || card.set_type === 'token') return false;
  if (card.set === 'mbtest' || card.set === 'cmb1' || card.set === 'cmb2' || card.set === 'ptg') return false;
  if (card.border_color === 'silver') return false;
  if (card.security_stamp === 'acorn') return false;
  if (card.name?.startsWith('A-')) return false;
  if (!allowLands && isLand(card)) return false;
  if (!allowGoodstuff && GOODSTUFF_NAMES.has(card.name)) return false;
  const types = typeLine(card);
  if (invalidTypeWords.some((word) => new RegExp(`(^|\\s|—)${word}(\\s|$)`, 'i').test(types))) return false;
  if (isCommanderOnly(card) || needsSideDeck(card) || isBannedCrossover(card)) return false;
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
