import { isBasicLand, isLand, isPlayableMainDeckCard, sameCard } from './filters.js';
import { isMultiCopyCard } from './synergyRules.js';
import { BASE_NONLANDS, MAX_NONLANDS } from './constants.js';
export function validateDeck(deck) {
  const errors = [];
  // Usually exactly 23; the synergy engine may grow it up to MAX_NONLANDS in rare cases (#41).
  if (deck.nonlands.length < BASE_NONLANDS || deck.nonlands.length > MAX_NONLANDS) errors.push(`Expected ${BASE_NONLANDS}-${MAX_NONLANDS} non-land cards, got ${deck.nonlands.length}`);
  if (deck.lands.length < 15 || deck.lands.length > 25) errors.push(`Expected 15-25 lands, got ${deck.lands.length}`);
  if (deck.nonlands.some(isLand)) errors.push('Non-land section contains a land');
  if (deck.nonlands.some((c) => !isPlayableMainDeckCard(c, { allowLands: false }))) errors.push('Non-land section contains an invalid card');
  if (deck.lands.some((c) => !isLand(c))) errors.push('Land section contains a non-land card');
  const nonbasicLands = deck.lands.filter((c) => !isBasicLand(c));
  if (nonbasicLands.some((c) => !isPlayableMainDeckCard(c, { allowLands: true }))) {
    const offender = nonbasicLands.find((c) => !isPlayableMainDeckCard(c, { allowLands: true }));
    errors.push(`Land section contains an invalid non-basic land: ${offender?.name || 'unknown'}`);
  }
  const nonBasic = [...deck.nonlands, ...deck.lands.filter((c) => !/^((Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes))$/.test(c.name || ''))];
  for (let i = 0; i < nonBasic.length; i += 1) for (let j = i + 1; j < nonBasic.length; j += 1) {
    // Duplicates are allowed only for cards that explicitly want multiple copies (Relentless Rats, Dragon's Approach, ...).
    if (sameCard(nonBasic[i], nonBasic[j]) && !isMultiCopyCard(nonBasic[i])) errors.push(`Duplicate singleton card: ${nonBasic[i].name}`);
  }
  return { ok: errors.length === 0, errors };
}
