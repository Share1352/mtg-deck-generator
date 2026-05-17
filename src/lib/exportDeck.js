import { isBasicLand } from './filters.js';
export function displayName(card) { return (card.name || '').replace(/^A-/, ''); }
export function exportDeck({ nonlands = [], lands = [] }) {
  const lines = [];
  for (const card of nonlands) lines.push(`1 ${displayName(card)}`);
  const groupedBasics = new Map();
  for (const card of lands) {
    if (isBasicLand(card) && card.set && card.collector_number) {
      const key = `${displayName(card)} (${String(card.set).toUpperCase()}) ${card.collector_number}`;
      groupedBasics.set(key, (groupedBasics.get(key) || 0) + 1);
    } else lines.push(`1 ${displayName(card)}`);
  }
  for (const [key, count] of groupedBasics) lines.push(`${count} ${key}`);
  return lines.join('\n');
}
