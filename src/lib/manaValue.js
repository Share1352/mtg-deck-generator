import { cardFaces, isLand } from './filters.js';
export function manaCostValue(cost = '') {
  let total = 0;
  for (const symbol of cost.match(/\{[^}]+\}/g) || []) {
    const body = symbol.slice(1, -1).toUpperCase();
    if (body === 'X') total += 4;
    else if (/^\d+$/.test(body)) total += Number(body);
    else if (body !== 'S') total += 1;
  }
  return total;
}
export function virtualCastableEntries(card) {
  const faces = cardFaces(card);
  const entries = [];
  for (const face of faces) {
    if (/Land/.test(face.type_line || '')) continue;
    if (face.mana_cost) entries.push({ name: face.name || card.name, value: manaCostValue(face.mana_cost) });
  }
  if (!entries.length && !isLand(card)) entries.push({ name: card.name, value: Number(card.cmc || 0) });
  const text = faces.map((f) => f.oracle_text || '').join('\n');
  if (/\{X\}/i.test(text) && !/\{X\}/i.test(faces.map((f) => f.mana_cost || '').join(''))) entries.forEach((e) => { e.value += 1.5; });
  return entries;
}
export function averageManaValue(cards) {
  const entries = cards.flatMap(virtualCastableEntries);
  const avg = entries.length ? entries.reduce((sum, e) => sum + e.value, 0) / entries.length : 0;
  return { average: avg, entries };
}
export function calculateLandCount(cards) {
  const { average, entries } = averageManaValue(cards);
  const raw = Math.round(15 + average * 1.8);
  const lands = Math.max(15, Math.min(25, raw));
  return { lands, average, virtualEntries: entries.length, reason: `15 + average mana value ${average.toFixed(2)} * 1.8, clamped to 15-25` };
}
