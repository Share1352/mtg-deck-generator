import { themeKey, categorizeTheme } from './themePool.js';
import { exactOracleQuery } from './themeQueries.js';
import { oracleText, typeLine } from './filters.js';

// A support tier is { label, query, creature } where creature true=creature only, false=non-creature only, null=any.
// Tiers are tried in order until the support quota is filled. Queries get color-locked by the caller.

const re = (theme) => exactOracleQuery(theme); // oracle:/\bTheme\b/i with escaping
const lc = (s) => String(s).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generic tribal hardware that works for any creature type.
const CHANGELINGS = { label: 'changelings (count as every type)', query: 'type:creature (oracle:changeling OR otag:changeling)', creature: true };
const KINDRED_HARDWARE = {
  label: 'generic typal payoffs (Coat of Arms / banners / chosen-type)',
  query: '(oracle:"choose a creature type" OR oracle:"the chosen type" OR oracle:"creatures of the chosen" OR oracle:"each creature you control" OR oracle:"creatures you control get +") -type:land',
  creature: null,
};

function typalTiers(theme) {
  const t = lc(theme);
  return [
    { label: `${theme} lords / direct ${theme} payoffs`, query: `(${re(theme)} (oracle:/other ${t}s?/i OR oracle:/${t}s? you control/i OR oracle:/whenever a ${t}/i OR oracle:/each ${t}/i OR oracle:/${t}s? you control get/i)) -type:land`, creature: null },
    { label: `${theme} type-matters non-creature support`, query: `(${re(theme)}) -type:creature -type:land`, creature: false },
    CHANGELINGS,
    KINDRED_HARDWARE,
    { label: `bodies that share the ${theme} plan`, query: `(${re(theme)}) type:creature`, creature: true },
  ];
}

// keyword / mechanic fallback: bodies that have it + payoffs that reward it + granters.
function keywordTiers(theme) {
  const t = lc(theme);
  return [
    { label: `${theme} payoffs (cares about ${theme})`, query: `(${re(theme)} (oracle:/creatures? you control/i OR oracle:/whenever/i OR oracle:/each creature/i OR oracle:/for each/i)) -type:land`, creature: null },
    { label: `grants ${theme} to your creatures`, query: `(oracle:/gains? ${t}/i OR oracle:/creatures? you control (?:have|gain) ${t}/i OR oracle:/have ${t}/i) -type:land`, creature: null },
    { label: `creature bodies with ${theme}`, query: `(keyword:"${theme}" OR ${re(theme)}) type:creature`, creature: true },
  ];
}

const INFERRED_NEEDS = [
  {
    id: 'instant-sorcery-density',
    label: 'instant/sorcery density',
    weight: 3,
    match: (text) => /\binstant(?:s)? (?:and|or) sorcer(?:y|ies)\b|\binstant or sorcery spell\b|\binstant and sorcery spells\b/i.test(text),
    tiers: [
      { label: 'cheap instants and sorceries for theme cards', query: '(type:instant OR type:sorcery) cmc<=3 -type:land', creature: false },
      { label: 'spell recursion / flashback to keep spells flowing', query: '(keyword:flashback OR keyword:jump-start OR keyword:rebound OR oracle:"return target instant" OR oracle:"return target sorcery") -type:land', creature: null },
      { label: 'spellslinger payoffs that reward the same plan', query: '(otag:spellslinger OR keyword:prowess OR oracle:"whenever you cast an instant or sorcery" OR oracle:"whenever you cast a noncreature") -type:land', creature: null },
    ],
  },
  {
    id: 'noncreature-spell-density',
    label: 'noncreature spell density',
    weight: 3,
    match: (text) => /\bnoncreature spell\b|\bnoncreature spells\b/i.test(text),
    tiers: [
      { label: 'cheap noncreature spells for theme cards', query: '-type:creature -type:land cmc<=3', creature: false },
      { label: 'noncreature spell payoffs', query: '(keyword:prowess OR oracle:"whenever you cast a noncreature" OR oracle:"noncreature spells you cast cost") -type:land', creature: null },
    ],
  },
  {
    id: 'artifact-density',
    label: 'artifact density',
    weight: 2,
    match: (text) => /\bartifacts? you control\b|\bwhenever an artifact\b|\bfor each artifact\b|\bartifact spell\b/i.test(text),
    tiers: [
      { label: 'cheap artifacts for theme cards', query: 'type:artifact cmc<=2 -type:land', creature: null },
      { label: 'artifact token makers', query: '(oracle:"create" oracle:"treasure" OR oracle:"create" oracle:"clue" OR oracle:"create" oracle:"food" OR oracle:"create" oracle:"powerstone") -type:land', creature: null },
    ],
  },
  {
    id: 'token-density',
    label: 'token density',
    weight: 2,
    match: (text) => /\btokens? you control\b|\bwhenever .* token\b|\bfor each .* token\b|\bcreature tokens? you control\b/i.test(text),
    tiers: [
      { label: 'token makers for theme cards', query: '(oracle:"create" oracle:"creature token") -type:land', creature: null },
      { label: 'token payoffs', query: '(otag:tokens-matter OR oracle:"whenever" oracle:"token" OR oracle:"creatures you control get +") -type:land', creature: null },
    ],
  },
  {
    id: 'graveyard-density',
    label: 'graveyard fuel',
    weight: 2,
    match: (text) => /\byour graveyard\b|\bfrom your graveyard\b|\bcards in your graveyard\b|\bgraveyards?\b/i.test(text),
    tiers: [
      { label: 'self-mill and discard to fuel theme cards', query: '(otag:self-mill OR oracle:"mill" OR oracle:"discard a card" OR oracle:"discard your hand") -type:land', creature: null },
      { label: 'graveyard recursion for theme cards', query: '(oracle:"return" oracle:"from your graveyard" OR keyword:flashback OR keyword:escape OR keyword:unearth) -type:land', creature: null },
    ],
  },
  {
    id: 'counter-density',
    label: 'counter support',
    weight: 2,
    match: (text) => /\b\+1\/\+1 counters?\b|\bcounters? on\b|\bproliferate\b/i.test(text),
    tiers: [
      { label: '+1/+1 counter sources for theme cards', query: '(oracle:"+1/+1 counter" OR keyword:proliferate OR otag:counters-matter) -type:land', creature: null },
      { label: 'counter payoffs', query: '(oracle:"whenever" oracle:"counter" OR oracle:"for each +1/+1 counter" OR oracle:"creatures you control with counters") -type:land', creature: null },
    ],
  },
  {
    id: 'sacrifice-density',
    label: 'sacrifice support',
    weight: 2,
    match: (text) => /\bsacrifice (?:a|an|another|one or more)\b|\bwhenever .* dies\b/i.test(text),
    tiers: [
      { label: 'sacrifice outlets for theme cards', query: '(oracle:"sacrifice a creature:" OR oracle:"sacrifice another creature" OR oracle:", sacrifice") -type:land', creature: null },
      { label: 'fodder for sacrifice theme cards', query: '(oracle:"create" oracle:"creature token" OR oracle:"return" oracle:"from your graveyard to the battlefield") -type:land', creature: null },
    ],
  },
];

export function inferSupportTiersFromCards(cards, { minScore = 2 } = {}) {
  const scored = [];
  for (const def of INFERRED_NEEDS) {
    let score = 0;
    for (const card of cards || []) {
      const text = `${oracleText(card)}\n${typeLine(card)}`;
      if (def.match(text)) score += def.weight;
    }
    if (score >= minScore) {
      for (const tier of def.tiers) scored.push({ ...tier, inferredNeed: def.id, inferredLabel: def.label, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score);
}

const ARCHETYPES = [
  {
    id: 'auras',
    match: (k) => ['auras', 'aura', 'enchant', 'bestow', 'totem armor', 'cartouche'].includes(k),
    tiers: () => [
      { label: 'enchantress payoffs (draw when you cast Auras/enchantments)', query: '(oracle:"whenever you cast an aura" OR oracle:"whenever you cast an enchantment" OR oracle:"whenever an enchantment you control enters" OR otag:enchantress) -type:land', creature: null },
      { label: 'resilient creatures to hold Auras (hexproof / ward)', query: 'type:creature (keyword:hexproof OR keyword:ward OR oracle:"can\'t be the target of spells or abilities your opponents control")', creature: true },
      { label: 'cheap creature hosts to enchant', query: 'type:creature cmc<=2 -keyword:defender', creature: true },
      { label: 'Aura recursion so the deck does not fall apart', query: '(oracle:"return" oracle:"aura" oracle:"from your graveyard") -type:land', creature: null },
    ],
  },
  {
    id: 'equipment',
    match: (k) => ['equipment', 'equip', 'reconfigure', 'living weapon', 'for mirrodin'].includes(k),
    tiers: () => [
      { label: 'Equipment payoffs (Stoneforge / Puresteel / Sram style)', query: '(oracle:"whenever you cast an equipment" OR oracle:"search your library for an equipment" OR oracle:"equipped creature" OR otag:equipment) -type:land', creature: null },
      { label: 'creatures that want to be equipped', query: 'type:creature (oracle:"equipment" OR keyword:double-strike OR keyword:trample OR oracle:"whenever" oracle:"attacks")', creature: true },
      { label: 'cheap creature carriers', query: 'type:creature cmc<=2 -keyword:defender', creature: true },
    ],
  },
  {
    id: 'vehicles',
    match: (k) => ['vehicles', 'vehicle', 'crew'].includes(k),
    tiers: () => [
      { label: 'Vehicle payoffs / pilots', query: '(oracle:crew OR oracle:"vehicles you control" OR oracle:pilot) -type:land', creature: null },
      { label: 'creatures that can crew (power 2+)', query: 'type:creature pow>=2 cmc<=4', creature: true },
    ],
  },
  {
    id: 'saddle',
    match: (k) => ['saddle', 'mount'].includes(k),
    tiers: () => [
      { label: 'Mount / saddle payoffs', query: '(oracle:saddle OR type:mount OR oracle:"saddled") -type:land', creature: null },
      { label: 'creatures with power to saddle', query: 'type:creature pow>=2 cmc<=4', creature: true },
    ],
  },
  {
    id: 'walls',
    match: (k) => ['wall', 'walls', 'defender', 'defenders'].includes(k),
    tiers: () => [
      { label: 'defender payoffs (attack with / use toughness)', query: '(oracle:"defender" (oracle:"can attack" OR oracle:"assign" oracle:"toughness" OR oracle:"as though it didn\'t have defender" OR oracle:"creatures you control with defender")) -type:land', creature: null },
      { label: 'toughness-matters payoffs (Doran / Assault Formation style)', query: '(oracle:"its toughness rather than its power" OR oracle:"equal to its toughness" OR oracle:"toughness" oracle:"deals damage") -type:land', creature: null },
      { label: 'high-toughness defenders that hold the wall', query: 'type:creature keyword:defender tou>=4', creature: true },
      { label: 'lets defenders / walls attack', query: '(oracle:"creatures you control with defender can attack" OR oracle:"defender" oracle:"attack") -type:land', creature: null },
    ],
  },
  {
    id: 'spellslinger',
    match: (k) => ['spellslinger', 'magecraft', 'prowess', 'storm', 'buyback', 'flashback', 'cipher', 'spectacle', 'instants', 'sorceries', 'spells', 'spells matter', 'overload', 'rebound', 'replicate'].includes(k),
    tiers: () => [
      { label: 'instant/sorcery payoff creatures (Young Pyromancer / Talrand)', query: 'type:creature (oracle:"whenever you cast an instant or sorcery" OR oracle:"whenever you cast a noncreature" OR keyword:prowess)', creature: true },
      { label: 'spell cost reducers & extra value', query: '(oracle:"instant and sorcery spells you cast cost" OR oracle:"noncreature spells you cast cost" OR oracle:"whenever you cast your" oracle:"instant or sorcery") -type:land', creature: null },
      { label: 'card flow to keep casting spells', query: '(oracle:"draw a card" type:instant cmc<=2)', creature: false },
    ],
  },
  {
    id: 'aristocrats',
    match: (k) => ['aristocrats', 'sacrifice', 'sac', 'morbid', 'exploit', 'devour'].includes(k),
    tiers: () => [
      { label: 'death payoffs (Blood Artist / Zulaport)', query: '(oracle:"whenever a creature you control dies" OR oracle:"whenever another creature you control dies" OR oracle:"whenever a creature dies") -type:land', creature: null },
      { label: 'sacrifice outlets', query: '(oracle:"sacrifice a creature:" OR oracle:"sacrifice another creature" OR oracle:", sacrifice") -type:land', creature: null },
      { label: 'token / recurring fodder to sacrifice', query: '(oracle:"create" oracle:"token" OR oracle:"return" oracle:"from your graveyard to the battlefield") type:creature cmc<=3', creature: true },
    ],
  },
  {
    id: 'tokens',
    match: (k) => ['tokens', 'token', 'populate', 'go wide', 'go-wide', 'mobilize', 'amass', 'fabricate'].includes(k),
    tiers: () => [
      { label: 'anthems / go-wide payoffs', query: '(oracle:"creatures you control get +" OR oracle:"for each creature you control" OR otag:anthem) -type:creature -type:land', creature: false },
      { label: 'token generators', query: '(oracle:"create" oracle:"creature token")', creature: null },
      { label: 'token payoff creatures', query: 'type:creature (oracle:"whenever" oracle:"token" OR oracle:"creatures you control")', creature: true },
    ],
  },
  {
    id: 'counters',
    match: (k) => ['counters', '+1/+1 counters', 'proliferate', 'evolve', 'adapt', 'outlast', 'bolster', 'mentor', 'graft'].includes(k),
    tiers: () => [
      { label: 'proliferate / counter multipliers', query: '(oracle:proliferate OR oracle:"twice that many" oracle:"counter") -type:land', creature: null },
      { label: '+1/+1 counter payoffs', query: '(oracle:"+1/+1 counter on" oracle:"whenever" OR oracle:"creatures you control with counters") -type:land', creature: null },
      { label: 'counter sources', query: 'type:creature oracle:"+1/+1 counter"', creature: true },
    ],
  },
  {
    id: 'landfall',
    match: (k) => ['landfall', 'lands', 'lands matter', 'ramp', 'domain', 'land', 'explore'].includes(k),
    tiers: () => [
      { label: 'extra land drops & landfall payoffs', query: '(oracle:"play an additional land" OR oracle:landfall OR oracle:"whenever a land enters the battlefield under your control") -type:land', creature: null },
      { label: 'land ramp / fetch into play', query: '(oracle:"search your library for" oracle:"land" oracle:"onto the battlefield") -type:land', creature: null },
    ],
  },
  {
    id: 'graveyard',
    match: (k) => ['graveyard', 'reanimator', 'reanimate', 'dredge', 'delve', 'mill', 'self-mill', 'escape', 'disturb', 'unearth', 'flashback', 'aftermath', 'recursion'].includes(k),
    tiers: () => [
      { label: 'self-mill / graveyard fillers', query: '(oracle:"mill" OR oracle:"put the top" oracle:"into your graveyard") -type:land', creature: null },
      { label: 'reanimation / recursion payoffs', query: '(oracle:"return target creature card from your graveyard" OR oracle:"return" oracle:"from your graveyard to the battlefield") -type:land', creature: null },
    ],
  },
  {
    id: 'lifegain',
    match: (k) => ['lifegain', 'life gain', 'lifeloss', 'life matters', 'lifelink'].includes(k),
    tiers: () => [
      { label: 'lifegain payoffs (Ajani\'s Pridemate style)', query: '(oracle:"whenever you gain life") -type:land', creature: null },
      { label: 'repeatable lifegain sources', query: '(keyword:lifelink OR oracle:"gain" oracle:"life") type:creature', creature: true },
    ],
  },
  {
    id: 'artifacts',
    match: (k) => ['artifacts', 'affinity', 'metalcraft', 'improvise', 'artifact'].includes(k),
    tiers: () => [
      { label: 'artifact payoffs (cares about artifacts)', query: '(oracle:"artifact" (oracle:"whenever" OR oracle:"for each artifact" OR oracle:"artifacts you control")) -type:land', creature: null },
      { label: 'cheap artifacts to enable', query: 'type:artifact cmc<=2 -type:creature', creature: false },
    ],
  },
  {
    id: 'enchantments',
    match: (k) => ['enchantments', 'enchantress', 'constellation', 'sagas', 'saga', 'shrines'].includes(k),
    tiers: () => [
      { label: 'constellation / enchantment payoffs', query: '(oracle:"whenever an enchantment you control enters" OR oracle:"whenever you cast an enchantment" OR otag:enchantress) -type:land', creature: null },
      { label: 'supporting enchantments', query: 'type:enchantment -type:creature cmc<=3', creature: false },
    ],
  },
];

export function getSupportPlan(themeName, category = categorizeTheme(themeName)) {
  const key = themeKey(themeName);
  for (const rule of ARCHETYPES) if (rule.match(key)) return { id: rule.id, tiers: rule.tiers(themeName, key) };
  if (category === 'typal') return { id: 'typal', tiers: typalTiers(themeName) };
  return { id: 'keyword', tiers: keywordTiers(themeName) };
}
