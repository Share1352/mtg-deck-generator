import { loadStaticJson } from './themePool.js';

const TAG_FALLBACK = [
  { name: 'Aristocrats', category: 'theme' }, { name: 'Spellslinger', category: 'theme' },
  { name: 'Blink', category: 'theme' }, { name: 'Lifegain', category: 'theme' },
  { name: 'Landfall', category: 'theme' }, { name: 'Myr', category: 'typal' },
  { name: 'Mite', category: 'typal' }, { name: 'Thrull', category: 'typal' },
  { name: 'Ox', category: 'typal' }, { name: 'Mole', category: 'typal' },
  { name: 'Serpent', category: 'typal' }, { name: 'Buyback', category: 'keyword' },
  { name: 'Enchant', category: 'mechanic' }, { name: 'Equipment', category: 'theme' },
  { name: 'Vehicles', category: 'theme' }, { name: 'Saddle', category: 'mechanic' },
  { name: 'Celebration', category: 'mechanic' }, { name: 'Mobilize', category: 'mechanic' },
  { name: 'Incubate', category: 'mechanic' },
];

const SYNERGY_FALLBACK = {
  Myr: ['Myr Battlesphere', 'Myr Retriever', 'Palladium Myr', 'Myr Galvanizer', 'Myr Sire', 'Myr Superion', 'Myr Enforcer', 'Myrsmith', 'Myr Turbine', 'Myr Matrix', 'Wake the Past', 'Tempered Steel', 'All Is Dust', 'Steel Overseer'],
  Mite: ["Skrelv's Hive", 'Sculpted Perfection', 'Crawling Chorus', 'Skrelv, Defector Mite', 'Infested Fleshcutter', 'Charge of the Mites', "Norn's Wellspring", "White Sun's Twilight", 'Compleat Devotion', "Vraska's Fall", 'Bloated Processor', 'Drown in Ichor'],
  Buyback: ['Capsize', 'Reiterate', 'Whispers of the Muse', 'Forbid', 'Mystic Speculation', 'Sprout Swarm', 'Clockspinning', 'Spellweaver Helix', 'Goblin Electromancer', 'Baral, Chief of Compliance', 'Young Pyromancer', 'Talrand, Sky Summoner'],
  Enchant: ['Kor Spiritdancer', 'Sram, Senior Edificer', 'Setessan Champion', 'Mesa Enchantress', 'Ethereal Armor', 'All That Glitters', 'Rancor', 'Ancestral Mask', 'Daybreak Coronet', 'Shielded by Faith', "Enchantress's Presence", 'Sterling Grove'],
  Equipment: ['Puresteel Paladin', 'Sram, Senior Edificer', 'Stoneforge Mystic', 'Kemba, Kha Regent', 'Colossus Hammer', 'Shadowspear', 'Sword of the Animist', "Sigarda's Aid", 'Open the Armory', 'Danitha Capashen, Paragon', 'Bruenor Battlehammer', 'Fighter Class'],
  Vehicles: ['Depala, Pilot Exemplar', 'Veteran Motorist', 'Greasefang, Okiba Boss', 'Peacewalker Colossus', "Smuggler's Copter", 'Heart of Kiran', 'Mobilizer Mech', 'Reckoner Bankbuster', 'Born to Drive', 'Start Your Engines', 'Armed and Armored', 'Hotshot Mechanic'],
  Landfall: ['Lotus Cobra', 'Tireless Provisioner', 'Rampaging Baloths', 'Felidar Retreat', 'Scute Swarm', 'Avenger of Zendikar', 'Roiling Regrowth', 'Harrow', 'Explore', 'Cultivate', 'Evolving Wilds', 'Terramorphic Expanse'],
};

export async function getAllEdhrecTags() {
  return loadStaticJson('data/edhrec-tags.json', TAG_FALLBACK);
}

export async function getSynergyCardsForTag(tag) {
  const key = tag.name || tag;
  const cache = await loadStaticJson('data/edhrec-synergy-cache.json', SYNERGY_FALLBACK);
  return cache[key] || SYNERGY_FALLBACK[key] || [];
}

export async function getRelatedSectionsForTag() { return []; }
