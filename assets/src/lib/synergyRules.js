import { isLand, oracleText, sameCard, typeLine } from './filters.js';

const CARD_NAME_PATTERNS = [
  /cards? named ([^.,;\n]+)/gi,
  /a card named ([^.,;\n]+)/gi,
];

const SPECIFIC_TUTOR_PATTERNS = [
  {
    name: 'artifact mana value 2 or less',
    re: /search your library for an artifact card with mana value (?:2|two) or less/i,
    query: 'type:artifact cmc<=2 -type:land',
    matches: (card) => /(^|\s|—)Artifact(\s|$)/i.test(typeLine(card)) && Number(card?.cmc ?? 99) <= 2 && !isLand(card),
  },
  {
    name: 'artifact mana value 1 or less',
    re: /search your library for an artifact card with mana value (?:1|one) or less/i,
    query: 'type:artifact cmc<=1 -type:land',
    matches: (card) => /(^|\s|—)Artifact(\s|$)/i.test(typeLine(card)) && Number(card?.cmc ?? 99) <= 1 && !isLand(card),
  },
  {
    name: 'Equipment card',
    re: /search your library for an Equipment card/i,
    query: 'type:equipment -type:land',
    matches: (card) => /(^|\s|—)Equipment(\s|$)/i.test(typeLine(card)) && !isLand(card),
  },
  {
    name: 'Aura card',
    re: /search your library for an Aura card/i,
    query: 'type:aura -type:land',
    matches: (card) => /(^|\s|—)Aura(\s|$)/i.test(typeLine(card)) && !isLand(card),
  },
];

function cleanReferencedName(raw) {
  return String(raw || '')
    .replace(/\s+and\s+put.*$/i, '')
    .replace(/\s+from.*$/i, '')
    .replace(/\s+in.*$/i, '')
    .replace(/\s+onto.*$/i, '')
    .replace(/["“”]/g, '')
    .trim();
}

export function referencedCardNames(card) {
  const names = [];
  const text = oracleText(card);
  for (const pattern of CARD_NAME_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const parts = cleanReferencedName(match[1]).split(/\s+(?:or|and)\s+/i).map(cleanReferencedName).filter(Boolean);
      for (const name of parts) if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

export function hasUnsupportedSelfNameSynergy(card) {
  return referencedCardNames(card).some((name) => name.toLowerCase() === String(card?.name || '').toLowerCase());
}

export function missingNamedReferences(card, cards) {
  return referencedCardNames(card).filter((name) => {
    if (name.toLowerCase() === String(card?.name || '').toLowerCase()) return false;
    return !cards.some((candidate) => String(candidate?.name || '').toLowerCase() === name.toLowerCase());
  });
}

export function tutorRequirements(card) {
  const text = oracleText(card);
  if (!/search your library/i.test(text)) return [];
  return SPECIFIC_TUTOR_PATTERNS.filter((rule) => rule.re.test(text));
}

export function hasTutorTarget(card, cards) {
  const requirements = tutorRequirements(card);
  if (!requirements.length) return true;
  return requirements.every((requirement) => cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate)));
}

export function directSynergyIssues(cards) {
  const issues = [];
  for (const card of cards) {
    if (hasUnsupportedSelfNameSynergy(card)) issues.push({ card, type: 'self-name', detail: `${card.name} needs extra copies in a singleton deck` });
    for (const missing of missingNamedReferences(card, cards)) issues.push({ card, type: 'named-card', detail: `${card.name} directly references missing card ${missing}`, missingName: missing });
    for (const requirement of tutorRequirements(card)) {
      if (!cards.some((candidate) => !sameCard(candidate, card) && requirement.matches(candidate))) issues.push({ card, type: 'tutor-target', detail: `${card.name} needs a ${requirement.name} target`, requirement });
    }
  }
  return issues;
}
