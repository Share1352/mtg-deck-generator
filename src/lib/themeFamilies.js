import { themeKey } from './themePool.js';

const FAMILIES = {
  graveyardFill: {
    label: 'graveyard-fill',
    enablers: [
      '(otag:self-mill OR oracle:/mill .* card/i OR oracle:/put .* top .* of your library .* graveyard/i)',
      '(oracle:/sacrifice (a|an|another|two|three) (creature|artifact|enchantment|land|permanent|token)/i OR otag:aristocrats)',
      '(oracle:/discard (a|two|three|your hand) card/i OR oracle:/discard your hand/i)',
      '(otag:reanimator OR oracle:/return target .* card from .* graveyard to the battlefield/i)',
    ],
    payoffs: [
      '(otag:graveyard-matters OR oracle:/cards? in (your|all) graveyards?/i)',
      '(keyword:flashback OR keyword:dredge OR keyword:disturb OR keyword:escape OR keyword:unearth OR keyword:delirium OR keyword:threshold OR keyword:descend OR keyword:scavenge OR keyword:embalm OR keyword:eternalize OR keyword:madness OR keyword:"jump-start" OR keyword:encore OR keyword:retrace)',
    ],
  },
  spellsMatter: {
    label: 'spells-matter',
    enablers: [
      '(oracle:/(instant|sorcery) (spells? )?(you cast )?cost .* less/i)',
      '(keyword:flashback OR keyword:buyback OR keyword:overload OR keyword:rebound OR keyword:replicate OR keyword:storm OR keyword:cascade OR keyword:conspire OR keyword:splice)',
    ],
    payoffs: [
      '(otag:spellslinger OR oracle:/whenever you cast (a noncreature|an instant|a sorcery) spell/i OR otag:magecraft)',
      '(keyword:prowess OR oracle:/\\bprowess\\b/i)',
    ],
  },
  tokens: {
    label: 'tokens',
    enablers: [
      '(oracle:/create .* (one|two|three|four|five|\\d+).* token/i)',
      '(keyword:populate OR otag:populate OR keyword:fabricate OR keyword:amass)',
    ],
    payoffs: [
      '(otag:tokens-matter OR oracle:/whenever .* token .* enters/i)',
      '(oracle:/creatures you control get \\+/i)',
    ],
  },
  attack: {
    label: 'attack-triggers',
    enablers: [
      '(keyword:haste OR keyword:menace OR keyword:trample)',
      '(otag:goad OR oracle:/\\bgoad\\b/i OR oracle:/attacks each combat if able/i)',
    ],
    payoffs: [
      '(oracle:/whenever .* attacks/i OR otag:attack-trigger)',
      '(keyword:battalion OR keyword:raid OR keyword:bloodthirst OR keyword:dethrone OR keyword:exalted OR keyword:mentor OR keyword:"battle cry" OR keyword:myriad)',
    ],
  },
  etb: {
    label: 'etb-flicker',
    enablers: [
      '(oracle:/exile (target|another target) (creature|permanent) .* return .* battlefield/i)',
      '(keyword:flicker OR oracle:/\\bblink\\b/i)',
    ],
    payoffs: [
      '(oracle:/whenever .* enters the battlefield under your control/i OR otag:etb)',
    ],
  },
  counters: {
    label: 'counters-matter',
    enablers: [
      '(oracle:/put a \\+1\\/\\+1 counter/i OR otag:counters-matter)',
      '(keyword:proliferate OR oracle:/\\bproliferate\\b/i OR keyword:adapt OR keyword:monstrosity OR keyword:evolve OR keyword:outlast OR keyword:graft OR keyword:modular)',
    ],
    payoffs: [
      '(oracle:/whenever .* counter is placed on/i OR oracle:/for each \\+1\\/\\+1 counter/i)',
      '(otag:counters-matter)',
    ],
  },
  lifegain: {
    label: 'lifegain',
    enablers: [
      '(keyword:lifelink OR otag:lifegain OR oracle:/you gain \\d+ life/i)',
    ],
    payoffs: [
      '(oracle:/whenever you gain life/i OR otag:lifegain-matters)',
    ],
  },
  sacrifice: {
    label: 'sacrifice-aristocrats',
    enablers: [
      '(oracle:/sacrifice (a|an|another) (creature|permanent|artifact|enchantment|token)/i OR otag:aristocrats)',
      '(oracle:/create .* token/i)',
    ],
    payoffs: [
      '(oracle:/whenever (a|another) creature (you control )?dies/i OR otag:aristocrats)',
      '(keyword:exploit OR keyword:devour OR keyword:emerge OR keyword:blitz OR keyword:offering OR keyword:champion)',
    ],
  },
  discard: {
    label: 'discard-matters',
    enablers: [
      '(oracle:/discard (a|two|three) card/i OR oracle:/discard your hand/i OR otag:wheels)',
    ],
    payoffs: [
      '(keyword:madness OR oracle:/\\bhellbent\\b/i OR oracle:/whenever you discard/i)',
    ],
  },
  artifacts: {
    label: 'artifacts-matter',
    enablers: [
      '(type:artifact -type:creature -type:land cmc<=2)',
      '(oracle:/create .* (treasure|clue|food|blood|powerstone|gold) token/i)',
    ],
    payoffs: [
      '(otag:artifacts-matter OR oracle:/whenever (an|another) artifact .* enters/i OR oracle:/for each artifact/i)',
      '(keyword:affinity OR keyword:improvise OR keyword:metalcraft OR keyword:fabricate)',
    ],
  },
  enchantments: {
    label: 'enchantments-matter',
    enablers: [
      '(type:enchantment -type:creature -type:land cmc<=3)',
      '(type:aura -type:land)',
    ],
    payoffs: [
      '(keyword:constellation OR oracle:/\\bconstellation\\b/i OR oracle:/whenever (an|another) enchantment .* enters/i OR otag:enchantress)',
    ],
  },
  lands: {
    label: 'lands-matter',
    enablers: [
      '(otag:ramp OR oracle:/search your library for .* (basic|land) card/i OR oracle:/put .* land card .* onto the battlefield/i)',
      '(oracle:/you may play (an additional|two additional) lands?/i)',
    ],
    payoffs: [
      '(keyword:landfall OR otag:landfall OR oracle:/whenever a land enters the battlefield under your control/i)',
      '(otag:domain OR oracle:/for each basic land type/i)',
    ],
  },
  mill: {
    label: 'mill',
    enablers: [
      '(otag:self-mill OR oracle:/mill (a card|\\d+ cards|target player)/i OR keyword:surveil)',
    ],
    payoffs: [
      '(otag:graveyard-matters OR oracle:/cards in (your|all) graveyards?/i)',
    ],
  },
};

const THEME_FAMILY_MAP = {
  descend: ['graveyardFill'],
  threshold: ['graveyardFill'],
  delirium: ['graveyardFill'],
  flashback: ['graveyardFill', 'spellsMatter'],
  'jump-start': ['graveyardFill', 'spellsMatter'],
  dredge: ['graveyardFill'],
  disturb: ['graveyardFill'],
  encore: ['graveyardFill'],
  escape: ['graveyardFill'],
  unearth: ['graveyardFill'],
  embalm: ['graveyardFill'],
  eternalize: ['graveyardFill'],
  scavenge: ['graveyardFill', 'counters'],
  retrace: ['graveyardFill'],
  recover: ['graveyardFill'],
  madness: ['discard', 'graveyardFill'],
  hellbent: ['discard'],
  surveil: ['mill', 'graveyardFill'],
  mill: ['mill', 'graveyardFill'],
  graveyard: ['graveyardFill'],
  reanimator: ['graveyardFill'],

  cascade: ['spellsMatter'],
  surge: ['spellsMatter'],
  storm: ['spellsMatter'],
  prowess: ['spellsMatter'],
  magecraft: ['spellsMatter'],
  spellslinger: ['spellsMatter'],
  rebound: ['spellsMatter'],
  splice: ['spellsMatter'],
  conspire: ['spellsMatter'],
  replicate: ['spellsMatter'],
  buyback: ['spellsMatter'],
  overload: ['spellsMatter'],
  awaken: ['spellsMatter', 'lands'],

  fabricate: ['tokens', 'artifacts'],
  amass: ['tokens'],
  populate: ['tokens'],
  manifest: ['tokens'],
  myriad: ['tokens', 'attack'],
  tokens: ['tokens'],

  riot: ['attack', 'counters'],
  bloodthirst: ['attack', 'counters'],
  raid: ['attack'],
  dethrone: ['attack'],
  battalion: ['attack'],
  exalted: ['attack'],
  mentor: ['attack'],
  'battle cry': ['attack'],
  skulk: ['attack'],
  prowl: ['attack'],
  goad: ['attack'],
  melee: ['attack'],
  myriad: ['attack', 'tokens'],

  blink: ['etb'],
  flicker: ['etb'],
  ephemerate: ['etb'],
  evoke: ['etb', 'graveyardFill'],

  proliferate: ['counters'],
  adapt: ['counters'],
  monstrosity: ['counters'],
  evolve: ['counters'],
  outlast: ['counters'],
  fade: ['counters'],
  vanishing: ['counters'],
  modular: ['counters', 'artifacts'],
  graft: ['counters'],
  mutate: ['counters'],
  bolster: ['counters'],
  reinforce: ['counters'],
  amplify: ['counters'],
  fading: ['counters'],
  counters: ['counters'],

  lifelink: ['lifegain'],
  lifegain: ['lifegain'],
  extort: ['lifegain'],

  aristocrats: ['sacrifice'],
  sacrifice: ['sacrifice'],
  exploit: ['sacrifice'],
  blitz: ['sacrifice', 'attack', 'graveyardFill'],
  devour: ['sacrifice', 'counters'],
  emerge: ['sacrifice'],
  offering: ['sacrifice'],
  champion: ['sacrifice'],

  improvise: ['artifacts'],
  affinity: ['artifacts'],
  metalcraft: ['artifacts'],
  treasure: ['artifacts'],
  clue: ['artifacts'],
  food: ['artifacts', 'lifegain'],
  blood: ['artifacts', 'discard'],
  powerstone: ['artifacts'],
  artifacts: ['artifacts'],

  constellation: ['enchantments'],
  enchant: ['enchantments'],
  enchantress: ['enchantments'],
  auras: ['enchantments'],
  bestow: ['enchantments'],
  'totem armor': ['enchantments'],

  landfall: ['lands'],
  domain: ['lands'],
  converge: ['lands'],
  ramp: ['lands'],
};

const HEURISTIC_PATTERNS = [
  { re: /descend|threshold|delirium|flashback|dredge|disturb|encore|escape|unearth|embalm|eternalize|jump.?start|scavenge|retrace|recover|reanimate|reanimator|graveyard/, families: ['graveyardFill'] },
  { re: /surveil|mill/, families: ['mill', 'graveyardFill'] },
  { re: /cascade|surge|storm|prowess|magecraft|spell|rebound|splice|conspire|replicate|buyback|overload/, families: ['spellsMatter'] },
  { re: /token|amass|populate|fabricate|manifest|myriad/, families: ['tokens'] },
  { re: /raid|battalion|exalted|mentor|bloodthirst|dethrone|riot|battle.?cry|prowl|skulk|goad|melee|attack/, families: ['attack'] },
  { re: /blink|flicker|evoke|ephemerate/, families: ['etb'] },
  { re: /counter|proliferate|adapt|monstrosity|evolve|outlast|fade|vanish|modular|graft|mutate|bolster|reinforce|amplify|devour/, families: ['counters'] },
  { re: /lifelink|lifegain|extort|drain/, families: ['lifegain'] },
  { re: /sacrifice|aristocrat|exploit|emerge|champion|offering|blitz/, families: ['sacrifice'] },
  { re: /discard|madness|hellbent/, families: ['discard'] },
  { re: /artifact|improvise|affinity|metalcraft|treasure|clue|food|blood|powerstone/, families: ['artifacts'] },
  { re: /enchant|aura|constellation|bestow|totem/, families: ['enchantments'] },
  { re: /land|domain|landfall|converge|ramp/, families: ['lands'] },
];

export function detectFamilies(theme) {
  const name = typeof theme === 'string' ? theme : theme?.name;
  if (!name) return [];
  const key = themeKey(name);
  const mapped = THEME_FAMILY_MAP[key];
  if (mapped && mapped.length) return [...mapped];
  const result = new Set();
  for (const { re, families } of HEURISTIC_PATTERNS) {
    if (re.test(key)) for (const f of families) result.add(f);
  }
  return [...result];
}

export function getThemeFamilyQueries(theme) {
  const families = detectFamilies(theme);
  const queries = [];
  for (const family of families) {
    const def = FAMILIES[family];
    if (!def) continue;
    for (const q of def.enablers) queries.push({ query: q, family, role: 'enabler', label: def.label });
    for (const q of def.payoffs) queries.push({ query: q, family, role: 'payoff', label: def.label });
  }
  return queries;
}

export function getFamilyLabels(theme) {
  return detectFamilies(theme).map((f) => FAMILIES[f]?.label || f);
}

export const __FAMILIES_FOR_TEST = FAMILIES;
