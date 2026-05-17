import { COLORS } from './constants.js';
import { cardFaces, oracleText } from './filters.js';
export function countManaPips(cards) {
  const pips = Object.fromEntries(COLORS.map((c) => [c, 0]));
  let snow = 0;
  const add = (text = '', weight = 1) => {
    const symbols = text.match(/\{[^}]+\}/g) || [];
    for (const symbol of symbols) {
      const body = symbol.slice(1, -1).toUpperCase();
      if (body === 'S') snow += 1;
      for (const c of COLORS) if (body.split('/').some((part) => part.replace('P', '') === c)) pips[c] += weight / Math.max(1, body.split('/').filter((p) => COLORS.includes(p.replace('P', ''))).length);
    }
  };
  for (const card of cards) {
    for (const face of cardFaces(card)) add(face.mana_cost);
    add(oracleText(card), 0.35);
  }
  return { pips, snowRequired: snow > 0 };
}
