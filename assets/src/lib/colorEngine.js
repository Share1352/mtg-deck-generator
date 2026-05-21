import { COLORS } from './constants.js';
import { sample } from './random.js';
import { colorIdentityWithin } from './filters.js';
export function countColors(cards) {
  const counts = Object.fromEntries(COLORS.map((c) => [c, 0]));
  for (const card of cards) for (const c of card.color_identity || card.colors || []) if (counts[c] !== undefined) counts[c] += 1;
  return counts;
}
export function mostCommonMulticolor(cards) {
  const map = new Map();
  for (const card of cards) {
    const id = [...(card.color_identity || [])].sort().join('');
    if (id.length >= 2) map.set(id, (map.get(id) || 0) + 1);
  }
  const [identity = '', count = 0] = [...map.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return { identity: identity.split(''), count };
}
export function chooseDeckColors(cards, { rng = Math.random, logger = null } = {}) {
  const counts = countColors(cards);
  const values = Object.values(counts);
  const max = Math.max(...values, 0);
  const threshold = max * 0.6;
  let dominant = COLORS.filter((c) => max > 0 && counts[c] >= threshold);
  const equal = max > 0 && values.every((v) => v === max);
  const multi = mostCommonMulticolor(cards);
  const meaningfulMulti = multi.count >= Math.max(4, Math.ceil(cards.length * 0.18));
  let multicolorTriggered = false;
  let colors;
  if (meaningfulMulti && rng() < 0.5) {
    colors = multi.identity;
    multicolorTriggered = true;
  } else if (max === 0) colors = [];
  else if (equal || dominant.length >= 4) colors = sample(dominant.length ? dominant : COLORS, 2, rng).sort();
  else colors = dominant.slice(0, 3).sort();
  logger?.line(`Theme pool color counts: W=${counts.W} U=${counts.U} B=${counts.B} R=${counts.R} G=${counts.G}`);
  logger?.line(`Dominance threshold: ${threshold.toFixed(1)}`);
  logger?.line(`Dominant colors: ${dominant.join('') || 'none'}`);
  logger?.line(`Equal-color case: ${equal ? 'yes' : 'no'}`);
  logger?.line(`Multicolor exception: ${multicolorTriggered ? `forced ${colors.join('')}` : 'not triggered'}`);
  logger?.line(`Final chosen deck colors: ${colors.join('')}`);
  return { colors, counts, threshold, dominant, equal, multicolorTriggered };
}
export function maybeExpandColors({ chosenColors, allCards, needed = 23, logger = null }) {
  let colors = [...chosenColors];
  let available = allCards.filter((c) => colorIdentityWithin(c, colors));
  if (available.length >= needed || colors.length >= 3) return { colors, expanded: false, available };
  const original = colors.join('') || 'colorless';
  const counts = countColors(allCards);
  const extras = COLORS.filter((c) => !colors.includes(c)).sort((a, b) => counts[b] - counts[a]);
  while (available.length < needed && colors.length < 3 && extras.length) {
    colors = [...colors, extras.shift()].sort();
    available = allCards.filter((c) => colorIdentityWithin(c, colors));
  }
  logger?.line(`Color expansion triggered: original=${original} valid=${allCards.filter((c) => colorIdentityWithin(c, chosenColors)).length} needed=${needed} expanded=${colors.join('') || 'colorless'} available=${available.length}`);
  return { colors, expanded: true, available };
}
