export const APP_VERSION = '2.0.0';
// Usual non-land count is 23. In exceptional cases the synergy engine may grow the deck up to
// MAX_NONLANDS when every remaining card is synergy-critical and a chain still needs more (#41).
export const BASE_NONLANDS = 23;
export const MAX_NONLANDS = 40;
export const COLORS = ['W', 'U', 'B', 'R', 'G'];
export const COLOR_NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };
export const BASIC_BY_COLOR = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest', C: 'Wastes' };
export const SNOW_BASIC_BY_COLOR = { W: 'Snow-Covered Plains', U: 'Snow-Covered Island', B: 'Snow-Covered Swamp', R: 'Snow-Covered Mountain', G: 'Snow-Covered Forest', C: 'Snow-Covered Wastes' };
export const BANNED_THEMES = [
  'myriad', 'will of the council', 'goad', 'melee', 'dethrone', 'monarch',
  'tempting offer', 'join forces', 'parley', 'undaunted', "council's dilemma",
  'assist', 'secret council', 'voting', 'draft', 'conspiracy', 'lieutenant',
  'partner', 'friends forever', 'choose a background', 'background', 'demonstrate',
  'squad', 'scheme', 'vanguard', 'phenomenon', 'archenemy', 'planechase',
  'hidden agenda', 'commander', 'commander matters'
];
// Pattern bans for theme NAMES. The Scryfall Oracle Tagger feed introduces multiplayer-only
// concepts under many tag spellings (e.g. "Gains Myriad", "Monarch Matters", "Cycle Ugl
// Multiplayer"). This app builds 1v1 decks, so any multiplayer/political theme is rejected
// regardless of exact spelling. Mirrors the BANNED_THEMES intent for the tagger source.
export const BANNED_THEME_PATTERNS = [
  /multiplayer/i,
  /\bmyriad\b/i,
  /join forces/i,
  /tempting offer/i,
  /will of the council/i,
  /council'?s dilemma/i,
  /\bparley\b/i,
  /\bmonarch\b/i,
  /\bvote\b/i,
  /\bgoad\b/i,
  /planechase/i,
  /archenemy/i,
  /\bdethrone\b/i,
];
export const LOADING_JOKES = [
  'Asking Gracee which card has the prettiest art...',
  'Letting P inspect the opening hand from the bed...',
  'Bargaining over chores for one more game...',
  'Shuffling until Stass and Gracee both trust the deck...',
  'Picking cute card art before Stass notices...',
  'Promising Gracee this game will be quick...',
  'Checking whether P thinks this mana base is cozy...',
  'Watching Gracee slowly learn the trick and beat Stass...',
  'Negotiating dinner plans around combat damage...',
  'Tucking P in before the final turn...',
  'Gracee is reading every card and getting dangerously powerful...',
  'Stass is pretending not to be scared of Gracee’s board...'
];
export const GOODSTUFF_NAMES = new Set([
  'Smothering Tithe','Rhystic Study','Cyclonic Rift','Demonic Tutor','Vampiric Tutor',
  'Dockside Extortionist','Ragavan, Nimble Pilferer','Esper Sentinel','Mystic Remora',
  'Fierce Guardianship','Deflecting Swat','Deadly Rollick','Craterhoof Behemoth',
  'Heroic Intervention','Swords to Plowshares','Generous Gift','Psychosis Crawler','Rampaging Baloths'
]);
export const BANNED_CARD_NAMES = new Set([
  'Command Tower',
  'Command Beacon',
  'Path of Ancestry',
]);
// Canonical MTG creature types so any tribal theme (Wall, Angel, Insect, ...) is treated as typal.
export const CREATURE_TYPES = new Set([
  'advisor','aetherborn','alien','ally','angel','antelope','ape','archer','archon','armadillo','army','artificer','assassin','assembly-worker','astartes','atog','aurochs','avatar','azra','badger','balloon','barbarian','bard','basilisk','bat','bear','beast','beaver','beeble','beholder','berserker','bird','blinkmoth','boar','bringer','brushwagg','camarid','camel','capybara','caribou','carrier','cat','centaur','child','chimera','citizen','cleric','clown','cockatrice','construct','coward','coyote','crab','crocodile','ctan','custodes','cyberman','cyclops','dalek','dauthi','demigod','demon','deserter','detective','devil','dinosaur','djinn','dog','dragon','drake','dreadnought','drix','drone','druid','dryad','dwarf','efreet','egg','elder','eldrazi','elemental','elephant','elf','elk','employee','eye','faerie','ferret','fish','flagbearer','fox','fractal','frog','fungus','gamer','gargoyle','germ','giant','gith','glimmer','gnoll','gnome','goat','goblin','god','golem','gorgon','graveborn','gremlin','griffin','guest','hag','halfling','hamster','harpy','hellion','hippo','hippogriff','homarid','homunculus','horror','horse','human','hydra','hyena','illusion','imp','incarnation','inkling','inquisitor','insect','jackal','jellyfish','juggernaut','kavu','kirin','kithkin','knight','kobold','kor','kraken','llama','lamia','lammasu','leech','leviathan','lhurgoyf','licid','lizard','manticore','masticore','mercenary','merfolk','metathran','minion','minotaur','mite','mole','monger','mongoose','monk','monkey','moonfolk','mount','mouse','mutant','myr','mystic','naga','nautilus','necron','nephilim','nightmare','nightstalker','ninja','noble','noggle','nomad','nymph','octopus','ogre','ooze','orb','orc','orgg','otter','ouphe','ox','oyster','pangolin','peasant','pegasus','pentavite','performer','pest','phelddagrif','phoenix','phyrexian','pilot','pincher','pirate','plant','porcupine','possum','praetor','primarch','prism','processor','rabbit','raccoon','ranger','rat','rebel','reflection','reveler','rhino','rigger','robot','rogue','sable','salamander','samurai','sand','saproling','satyr','scarecrow','scientist','scion','scorpion','scout','sculpture','serf','serpent','servo','shade','shaman','shapeshifter','shark','sheep','siren','skeleton','slith','sliver','sloth','slug','snail','snake','soldier','soltari','spawn','specter','spellshaper','sphinx','spider','spike','spirit','splinter','sponge','squid','squirrel','starfish','surrakar','survivor','synth','tentacle','tetravite','thalakos','thopter','thrull','tiefling','time lord','toy','treefolk','trilobite','triskelavite','troll','turtle','tyranid','unicorn','vampire','vedalken','viashino','volver','wall','walrus','warlock','warrior','weasel','weird','werewolf','whale','wizard','wolf','wolverine','wombat','worm','wraith','wurm','yeti','zombie','zubera',
]);
