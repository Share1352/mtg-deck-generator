import { COLORS } from './constants.js';

const COLOR_HINTS = [
  [/white|plains|norn|skrelv|kemba|sram|puresteel|stoneforge|danitha|felidar|mite|crawling|charge|compleat|kor|mesa|daybreak|tempered/i, ['W']],
  [/blue|island|mystic|capsize|forbid|muse|talrand|serpent|blink|ice|wizard/i, ['U']],
  [/black|swamp|vraska|drown|bloated|thrull|aristocrat|sacrifice|zombie|grave/i, ['B']],
  [/red|mountain|goblin|young pyromancer|reiterate|bruenor|fighter|hotshot|start your engines|dragon/i, ['R']],
  [/green|forest|lotus|tireless|baloth|scute|avenger|cultivate|harrow|explore|rancor|setessan|enchantress|mole|ox|landfall/i, ['G']],
  [/boros|bruenor|fighter class|depal|veteran|vehicle|equipment/i, ['R', 'W']],
  [/golgari|vraska|aristocrat/i, ['B', 'G']],
  [/azorius|blink/i, ['W', 'U']],
];
const CREATURE_HINTS = /myr|mite|skrelv|processor|cobra|provisioner|baloth|scute|avenger|spiritdancer|sram|champion|enchantress|paladin|mystic|kemba|danitha|bruenor|depala|motorist|greasefang|mechanic|goblin|baral|pyromancer|talrand|thrull|ox|mole|serpent|ninja|wizard|elf|zombie|cat|dragon|god|sliver/i;
const ARTIFACT_HINTS = /myr|equipment|hammer|shadowspear|sword|vehicle|copter|bankbuster|mech|fleshcutter|wellspring|matrix|turbine/i;
const ENCHANTMENT_HINTS = /hive|retreat|armor|growth|rancor|mask|coronet|faith|presence|grove|aid|class|drive/i;

export const BASIC_PRINTS = {
  Plains: [['DMU', '277'], ['M21', '260'], ['LTR', '263']],
  Island: [['DMU', '278'], ['M21', '263'], ['LTR', '265']],
  Swamp: [['DMU', '279'], ['M21', '266'], ['LTR', '267']],
  Mountain: [['DMU', '280'], ['M21', '269'], ['LTR', '269']],
  Forest: [['DMU', '281'], ['M21', '272'], ['LTR', '271']],
  Wastes: [['OGW', '184'], ['OGW', '185']],
  'Snow-Covered Plains': [['KHM', '276']],
  'Snow-Covered Island': [['KHM', '278']],
  'Snow-Covered Swamp': [['KHM', '280']],
  'Snow-Covered Mountain': [['KHM', '282']],
  'Snow-Covered Forest': [['KHM', '284']],
  'Snow-Covered Wastes': [['MH1', '250']],
};

const KNOWN_NAMES = [
  'Myr Battlesphere','Myr Retriever','Palladium Myr','Myr Galvanizer','Myr Sire','Myr Superion','Myr Enforcer','Myrsmith','Myr Turbine','Myr Matrix','Wake the Past','Tempered Steel','All Is Dust','Steel Overseer',
  "Skrelv's Hive",'Sculpted Perfection','Crawling Chorus','Skrelv, Defector Mite','Infested Fleshcutter','Charge of the Mites',"Norn's Wellspring", "White Sun's Twilight",'Compleat Devotion',"Vraska's Fall",'Bloated Processor','Drown in Ichor',
  'Capsize','Reiterate','Whispers of the Muse','Forbid','Mystic Speculation','Sprout Swarm','Clockspinning','Spellweaver Helix','Goblin Electromancer','Baral, Chief of Compliance','Young Pyromancer','Talrand, Sky Summoner',
  'Kor Spiritdancer','Sram, Senior Edificer','Setessan Champion','Mesa Enchantress','Ethereal Armor','All That Glitters','Rancor','Ancestral Mask','Daybreak Coronet','Shielded by Faith',"Enchantress's Presence",'Sterling Grove',
  'Puresteel Paladin','Stoneforge Mystic','Kemba, Kha Regent','Colossus Hammer','Shadowspear','Sword of the Animist',"Sigarda's Aid",'Open the Armory','Danitha Capashen, Paragon','Bruenor Battlehammer','Fighter Class',
  'Depala, Pilot Exemplar','Veteran Motorist','Greasefang, Okiba Boss','Peacewalker Colossus',"Smuggler's Copter",'Heart of Kiran','Mobilizer Mech','Reckoner Bankbuster','Born to Drive','Start Your Engines','Armed and Armored','Hotshot Mechanic',
  'Lotus Cobra','Tireless Provisioner','Felidar Retreat','Scute Swarm','Avenger of Zendikar','Roiling Regrowth','Harrow','Explore','Cultivate','Evolving Wilds','Terramorphic Expanse',
  'Zulaport Cutthroat','Blood Artist','Village Rites','Doomed Traveler','Viscera Seer','Cruel Celebrant','Deadly Dispute','Bastion of Remembrance','Reassembling Skeleton','Morbid Opportunist','Pawn of Ulamog','Plumb the Forbidden',
  'Soul Warden',"Ajani's Pridemate",'Authority of the Consuls','Revitalize','Healer\'s Hawk','Linden, the Steadfast Queen','Cleric Class','Daxos, Blessed by the Sun','Dawn of Hope','Impassioned Orator','Righteous Valkyrie','Light of Promise',
  'Cloudshift','Ephemerate','Momentary Blink','Mulldrifter','Reflector Mage','Charming Prince','Soulherder','Flickerwisp','Restoration Angel','Displace','Teleportation Circle','Elite Guardmage',
  'Serpent of Yawning Depths','Tolarian Serpent','Waker of Waves','Cryptic Serpent','Gearseeker Serpent','Striped Riverwinder','Ominous Seas','Serpent of the Endless Sea','Sea Monster','Aethersquall Ancient','Kiora, Behemoth Beckoner','Quest for Ula\'s Temple',
  'Ravenous Chupacabra','Thrull Parasite','Endrek Sahr, Master Breeder','Sengir Autocrat','Ogre Slumlord','Teysa Karlov','Skeletal Vampire','Dark Prophecy','Fungal Plots','Eaten Alive','Bone Splinters','Victimize',
  'Ox of Agonas','Ageless Guardian','Giant Ox','Yoked Ox','Pillarfield Ox','Rumor Gatherer','Universal Automaton','Adaptive Automaton','Icon of Ancestry','Vanquisher\'s Banner','Maskwood Nexus','Shared Triumph',
  'Tunnel Tipster','Mole God of Mischief','Excavation Mole','Miner\'s Guidewing','Bristly Bill, Spine Sower','Rootrider Faun','Roaring Earth','Case of the Locked Hothouse','Map the Frontier','They Went This Way','Conduit Pylons','Escape Tunnel',
  'Bounding Felidar','Fortune, Loyal Steed','Calamity, Galloping Inferno','Bristlepack Sentry','Congregation Gryff','Sheriff of Safe Passage','Take Up the Shield','Snakeskin Veil','Gryff\'s Boon','Cartouche of Solidarity','Cartouche of Strength','Mounted Dreadknight',
  'Resolute Reinforcements','Witty Roastmaster','Gala Greeters','Charming Scoundrel','Imodane\'s Recruiter','Rally at the Hornburg','Krenko\'s Command','Raise the Alarm','Hopeful Vigil','Song of Totentanz','Impact Tremors','Tocasia\'s Welcome',
  'Sanguine Evangelist','Anim Pakal, Thousandth Moon','Queen Allenal of Ruadach','Baird, Argivian Recruiter','Join the Dance','Servo Exhibition','Queen Kayla bin-Kroog','Horn of Valhalla','Heroic Reinforcements','Wedding Announcement','Pollen-Shield Hare','Call the Coppercoats',
  'Phyrexian Awakening','Progenitor Exarch','Chrome Host Seedshark','Essence of Orthodoxy','Invasion of Gobakhan','Invasion of New Phyrexia','Norn\'s Inquisitor','Compleated Huntmaster','Converter Beast','Glissa, Herald of Predation','Invasion of Shandalar','Ancient Imperiosaur'
];

const NONBASIC_LANDS = [
  ['Evolving Wilds', [], 'Search your library for a basic land card.'],
  ['Terramorphic Expanse', [], 'Search your library for a basic land card.'],
  ['Ash Barrens', [], 'Basic landcycling.'],
  ['Command Beacon', [], 'Add {C}.'],
  ['Rogue\'s Passage', [], 'Target creature can\'t be blocked this turn.'],
  ['Karn\'s Bastion', [], 'Proliferate.'],
  ['Secluded Courtyard', [], 'Choose a creature type. Add one mana of any color to cast a creature spell of the chosen type.'],
  ['Unclaimed Territory', [], 'Choose a creature type. Add one mana of any color to cast a creature spell of the chosen type.'],
  ['Meandering River', ['W', 'U'], 'Add {W} or {U}.'],
  ['Scoured Barrens', ['W', 'B'], 'Add {W} or {B}.'],
  ['Wind-Scarred Crag', ['R', 'W'], 'Add {R} or {W}.'],
  ['Jungle Hollow', ['B', 'G'], 'Add {B} or {G}.'],
  ['Thornwood Falls', ['G', 'U'], 'Add {G} or {U}.'],
  ['Rugged Highlands', ['R', 'G'], 'Add {R} or {G}.'],
  ['Swiftwater Cliffs', ['U', 'R'], 'Add {U} or {R}.'],
  ['Tranquil Cove', ['W', 'U'], 'Add {W} or {U}.'],
];

export function inferColors(name) {
  const hit = COLOR_HINTS.find(([re]) => re.test(name));
  return hit ? hit[1] : [COLORS[Math.abs(hash(name)) % COLORS.length]];
}
function hash(text) { return [...text].reduce((sum, ch) => ((sum * 31) + ch.charCodeAt(0)) | 0, 0); }
function manaCostFor(colors, creature) {
  const pip = colors.map((c) => `{${c}}`).join('');
  return creature ? `{2}${pip || '{C}'}` : `{1}${pip || '{C}'}`;
}
export function makeOfflineCard(name, overrides = {}) {
  const isKnownLand = /^(Evolving Wilds|Terramorphic Expanse|Conduit Pylons|Escape Tunnel)$/i.test(name);
  const colors = overrides.color_identity || (isKnownLand ? [] : inferColors(name));
  const isCreature = overrides.type_line ? /Creature/.test(overrides.type_line) : !isKnownLand && CREATURE_HINTS.test(name);
  let type = isKnownLand ? 'Land' : isCreature ? 'Creature' : 'Instant';
  if (!isKnownLand && !isCreature && ARTIFACT_HINTS.test(name)) type = /vehicle|copter|bankbuster|mech/i.test(name) ? 'Artifact — Vehicle' : 'Artifact';
  if (!isKnownLand && !isCreature && ENCHANTMENT_HINTS.test(name)) type = /armor|rancor|mask|coronet|faith|boon|cartouche/i.test(name) ? 'Enchantment — Aura' : 'Enchantment';
  if (!isKnownLand && /class/i.test(name)) type = 'Enchantment — Class';
  return {
    name,
    layout: 'normal',
    type_line: type,
    oracle_text: overrides.oracle_text || `${name} supports its deck theme in this offline Scryfall fallback card record.`,
    mana_cost: overrides.mana_cost ?? (isKnownLand ? '' : manaCostFor(colors, isCreature)),
    cmc: overrides.cmc ?? (isKnownLand ? 0 : isCreature ? 3 : 2),
    color_identity: colors,
    colors,
    lang: 'en',
    digital: false,
    set: overrides.set || 'fdn',
    set_name: overrides.set_name || 'Foundations',
    collector_number: overrides.collector_number || String(100 + (Math.abs(hash(name)) % 300)),
    oracle_id: overrides.oracle_id || `offline-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...overrides,
  };
}
export const OFFLINE_CARDS = [
  ...KNOWN_NAMES.map((name) => makeOfflineCard(name.replaceAll('\\\'', "'"))),
  ...Object.entries(BASIC_PRINTS).flatMap(([name, prints]) => prints.map(([set, collector], index) => makeOfflineCard(name, { type_line: `Basic Land — ${name.replace('Snow-Covered ', '')}`, oracle_text: `Add mana.`, mana_cost: '', cmc: 0, colors: [], color_identity: [], set: set.toLowerCase(), collector_number: collector, oracle_id: `offline-basic-${name}-${index}` }))),
  ...NONBASIC_LANDS.map(([name, colors, text]) => makeOfflineCard(name.replaceAll('\\\'', "'"), { type_line: 'Land', oracle_text: text, mana_cost: '', cmc: 0, colors: [], color_identity: colors, set: 'fdn' })),
];
export function offlineNamedCard(name) {
  return OFFLINE_CARDS.find((card) => card.name.toLowerCase() === String(name).toLowerCase()) || makeOfflineCard(name);
}
function parseAllowedColors(query) {
  const match = query.match(/id<=([WUBRG]+)/i);
  return match ? [...match[1].toUpperCase()] : null;
}
function queryTerms(query) {
  const terms = [];
  for (const m of query.matchAll(/type:"([^"]+)"|keyword:"([^"]+)"|otag:"?([a-z -]+)"?|oracle:\/\\b([^\\]+)\\b\/i/gi)) terms.push((m[1] || m[2] || m[3] || m[4] || '').toLowerCase().trim());
  return terms.filter(Boolean).filter((term) => !['utility-land'].includes(term));
}
export function offlineSearchCards(query, { limit = 175 } = {}) {
  const wantsLand = /(?:^|\s)type:land/i.test(query);
  const rejectsLand = /-type:land/i.test(query);
  const wantsBasic = /(?:^|\s)type:basic|!"(Plains|Island|Swamp|Mountain|Forest|Wastes|Snow-Covered [^"]+)"/i.test(query);
  const wantsCreature = /(?:^|\s)type:creature/i.test(query);
  const rejectsCreature = /-type:creature/i.test(query);
  const allowed = parseAllowedColors(query);
  const terms = queryTerms(query);
  let cards = OFFLINE_CARDS.filter((card) => {
    const isLand = /Land/.test(card.type_line || '');
    const isCreature = /Creature/.test(card.type_line || '');
    if (wantsLand && !isLand) return false;
    if (rejectsLand && isLand) return false;
    if (wantsBasic && !/^Basic Land/.test(card.type_line || '')) return false;
    if (wantsCreature && !isCreature) return false;
    if (rejectsCreature && isCreature) return false;
    if (allowed && !(card.color_identity || []).every((c) => allowed.includes(c))) return false;
    return true;
  });
  if (terms.length) {
    const exact = cards.filter((card) => terms.some((term) => `${card.name} ${card.type_line} ${card.oracle_text}`.toLowerCase().includes(term)));
    if (exact.length) cards = exact;
  }
  return cards.slice(0, limit);
}
export function offlineRandomCard(query) {
  const cards = offlineSearchCards(query, { limit: 999 });
  if (!cards.length) return makeOfflineCard('Evolving Wilds', { type_line: 'Land', oracle_text: 'Search your library for a basic land card.', mana_cost: '', colors: [], color_identity: [] });
  return cards[Math.floor(Math.random() * cards.length)];
}
