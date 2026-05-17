import React, { useState, useEffect } from "react";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LOADING_JOKES = [
  "Asking Gracee which card has the prettiest art...",
  "Promising Gracee this is the last deck I'll build today...",
  "Hiding the receipt for my new shiny cards from Gracee...",
  "Asking P if this opening hand is keepable...",
  "Waiting for Gracee to shuffle...",
  "Tucking P in while Gracee takes a 10-minute turn...",
  "Thinking I've won before Gracee draws the exact card to destroy my stuff...",
  "Consulting with P about my mana curve...",
  "Hoping Gracee doesn't cancel my favorite spell...",
  "Convincing Gracee that cardboard is a valid financial investment...",
  "Asking Gracee if we can play 'just one quick game'...",
  "Gracee sighing as I explain the rules for the tenth time...",
  "Wondering if P is judging my misplays...",
  "Begging Gracee to just let my card resolve...",
  "Negotiating chore assignments based on who wins this match...",
  "Reminding Gracee that 'in sickness and in health' includes when I draw zero lands...",
  "Trying to read Gracee's poker face...",
  "Promising P I won't get mad if Gracee counters my spell...",
  "Wondering if Gracee will get mad if I destroy her favorite card again...",
  "Apologizing in advance to Gracee for building a super annoying deck...",
  "Letting Gracee take back her turn so I don't sleep on the couch...",
  "Debating with Gracee whose turn it is to do the dishes and whose turn it is to shuffle...",
  "Hoping Gracee doesn't realize I spent our date night budget on fancy land cards...",
  "Sending Gracee a peace offering after destroying her favorite creature...",
  "Explaining to Gracee that yes, this new deck *is* completely different from my other 10 decks...",
  "Promising to cook dinner if Gracee lets me win this game...",
  "Watching Gracee read a card for the 5th time and pretending I'm not terrified...",
  "Hiding behind P when Gracee declares attackers...",
  "Agreeing with Gracee that the card with the cutest dog on it is definitely the best one...",
  "Pretending I don't mind when Gracee attacks me for absolutely no reason...",
  "Gracee explaining the rules to P while I try to understand them...",
  "Asking Gracee nervously if she's *sure* she wants to play that card...",
  "Bargaining with Gracee: 'If you don't attack me this turn, I'll take out the trash'...",
  "Asking P for moral support before I cast this...",
  "P looking at me like I should have countered that...",
  "Promising P that Gracee and I are still friends even after she destroys my lands...",
  "Secretly loving that Gracee is getting better and beating me..."
];

const BANNED_MULTIPLAYER_TAGS = new Set([
  "myriad", "will of the council", "goad", "melee", "dethrone", 
  "monarch", "tempting offer", "join forces", "parley", "undaunted", 
  "council's dilemma", "assist", "secret council", "voting", 
  "draft", "conspiracy", "lieutenant", "partner", "friends forever", 
  "choose a background", "demonstrate", "squad", "scheme", 
  "vanguard", "phenomenon", "archenemy", "planechase", "hidden agenda"
]);

// STRICT GLOBAL FILTERS
const STRICT_BASE = "(-is:ub OR e:ltr OR e:ltc OR e:fin OR e:afr OR e:afc OR e:clb) -is:digital -is:playtest -st:alchemy -st:memorabilia -layout:planar -layout:scheme -layout:vanguard -layout:token -layout:double_faced_token -layout:emblem -layout:art_series -layout:reversible_card -layout:dungeon -layout:bounty -layout:mutation -layout:contraption -layout:attraction -t:sticker -t:hero -t:conspiracy -t:phenomenon -t:dungeon -t:bounty -o:commander -o:draft -o:attraction -o:contraption -o:sticker -set:cmb1 -set:cmb2 -set:mbtest -set:ptg -set:htr lang:en";

const GLOBAL_FILTERS = `-t:land ${STRICT_BASE}`;

const EDHREC_THEMES = [
  "Aristocrats", "Spellslinger", "Lifegain", "Blink", "Sacrifice", "Voltron",
  "Tokens", "Enchantress", "Artifacts", "Superfriends", "Graveyard", "Ramp",
  "Equipment", "Auras", "Landfall", "Discard", "Draw", "Stax", "Prison",
  "Wheels", "Treasure", "Food", "Clues", "Vehicles", "Sagas", "Toughness",
  "Pingers", "Clones", "Theft", "Historic", "Counters", "Madness", "Spells"
];

const ALL_MTG_KEYWORDS = [
  "Deathtouch", "Defender", "Double Strike", "Enchant", "Equip", "First Strike",
  "Flash", "Flying", "Haste", "Hexproof", "Indestructible", "Lifelink", "Menace",
  "Protection", "Prowess", "Reach", "Trample", "Vigilance", "Ward", "Cycling",
  "Kicker", "Flashback", "Scry", "Surveil", "Mutate", "Ninjutsu", "Undying",
  "Persist", "Cascade", "Storm", "Populate", "Proliferate", "Exalted", "Annihilator",
  "Saddle", "Convoke", "Infect", "Mill", "Extort", "Evolve", "Morph", "Manifest",
  "Cloak", "Disguise", "Suspend", "Retrace", "Buyback", "Split second", "Dredge",
  "Delve", "Threshold", "Landfall", "Magecraft", "Party", "Adventure", "Foretell",
  "Backup", "Bloodthirst", "Unleash", "Outlast", "Bolster", "Exploit", "Emerge",
  "Escalate", "Fabricate", "Crew", "Improvise", "Aftermath", "Explore", "Enrage",
  "Ascend", "Mentor", "Spectacle", "Riot", "Amass", "Adamant", "Escape", "Companion",
  "Boast", "Learn", "Cleave", "Connive", "Casualty", "Enlist", "Read Ahead", "Toxic",
  "Corrupted", "For Mirrodin!", "Incubate", "Bargain", "Celebration", "Descend",
  "Craft", "Echo", "Flanking", "Phasing", "Shadow", "Bushido", "Soulshift", "Splice",
  "Epic", "Haunt", "Ripple", "Recover", "Champion", "Evoke", "Hideaway", "Prowl",
  "Reinforce", "Conspire", "Devour", "Unearth", "Level up", "Rebound", "Totem armor",
  "Battle cry", "Living weapon", "Miracle", "Soulbond", "Overload", "Scavenge",
  "Cipher", "Fuse", "Bestow", "Tribute", "Inspire", "Dash", "Skulk", "Embalm",
  "Eternalize", "Afflict", "Jump-start", "Daybound", "Nightbound", "Disturb",
  "Training", "Reconfigure", "Compleated", "Blitz", "Spree", "Plot"
];

// Trimmed to 15 top offenders to keep Scryfall queries strictly under the 1000 character limit limit.
const GOODSTUFF_PURGE = [
  "Smothering Tithe", "Rhystic Study", "Cyclonic Rift", "Demonic Tutor",
  "Vampiric Tutor", "Dockside Extortionist", "Ragavan, Nimble Pilferer",
  "Esper Sentinel", "Mystic Remora", "Fierce Guardianship", "Deflecting Swat",
  "Deadly Rollick", "Craterhoof Behemoth", "Heroic Intervention", "Swords to Plowshares"
].map(name => `-"${name}"`).join(" ");

const isValidSpell = (c) => {
    if (!c) return false;
    const invalidLayouts = ['planar', 'scheme', 'vanguard', 'token', 'double_faced_token', 'emblem', 'art_series', 'reversible_card', 'dungeon', 'bounty', 'mutation', 'contraption', 'attraction'];
    if (invalidLayouts.includes(c.layout)) return false;
    
    const frontType = c.card_faces && c.card_faces.length > 0 ? c.card_faces[0].type_line : c.type_line;
    if (!frontType) return false;
    if (frontType.includes("Land") || frontType.includes("Sticker") || frontType.includes("Hero") || frontType.includes("Vanguard") || frontType.includes("Conspiracy") || frontType.includes("Phenomenon") || frontType.includes("Card") || frontType.includes("Dungeon") || frontType.includes("Bounty")) return false;

    if (c.set === 'mb2' && c.set_type === 'memorabilia') return false; 
    if (c.set === 'cmb1' || c.set === 'cmb2' || c.set === 'mbtest') return false;

    return true;
};

const getExactOracle = (tag) => {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return `oracle:/\\b${escaped}\\b/i`;
};

// THE NEW HOST INJECTOR: Maps Parasitic mechanics to their most synergistic host bodies
const getHostQuery = (tag) => {
    const t = tag.toLowerCase();
    if (["enchant", "auras", "aura", "bestow", "totem armor", "umbra"].includes(t)) {
        return `OR (t:creature (otag:enchantress OR oracle:"enchantment" OR keyword:hexproof OR oracle:"modified"))`;
    }
    if (["equip", "equipment", "reconfigure", "living weapon", "for mirrodin!"].includes(t)) {
        return `OR (t:creature (oracle:"equipped" OR oracle:"equipment" OR keyword:"double strike" OR oracle:"modified"))`;
    }
    if (["crew", "vehicles", "vehicle"].includes(t)) {
        return `OR (t:creature (oracle:"vehicle" OR type:pilot))`;
    }
    if (["saddle", "mounts", "mount"].includes(t)) {
        return `OR (t:creature (oracle:"mount" OR type:mount))`;
    }
    if (["mutate"].includes(t)) {
        return `OR (t:creature -t:human (keyword:hexproof OR keyword:flying OR keyword:trample OR otag:mutate-payoff))`;
    }
    if (["bloodthirst", "spectacle", "ninjutsu", "prowl", "cipher"].includes(t)) {
        return `OR (t:creature (oracle:"can't be blocked" OR keyword:flying OR keyword:menace OR keyword:skulk OR keyword:haste))`;
    }
    return "";
};

const getStrictFallbackQuery = (tag, cat, colorId, typeRequired) => {
    let typeFilter = typeRequired === 'creature' ? 't:creature' : typeRequired === 'non-creature' ? '-t:creature' : '';
    const exactOracle = getExactOracle(tag);
    
    if (cat === 'type') {
        if (typeRequired === 'creature') {
            return `(${typeFilter} (type:"${tag}" OR oracle:changeling)) id<=${colorId} ${STRICT_BASE}`;
        } else {
            return `(${typeFilter} (${exactOracle} OR oracle:"choose a creature type" OR oracle:"of the chosen type" OR otag:tribal-support)) id<=${colorId} ${STRICT_BASE}`;
        }
    } else {
        return `(${typeFilter} (keyword:"${tag}" OR ${exactOracle} OR otag:"${tag}")) id<=${colorId} ${STRICT_BASE}`;
    }
};

const buildSynergyProfile = (cards) => {
    if (!cards || cards.length === 0) return "";
    const counts = {};
    const evergreen = ['flying', 'haste', 'trample', 'lifelink', 'deathtouch', 'vigilance', 'reach', 'defender', 'first strike', 'flash', 'hexproof', 'indestructible', 'menace', 'prowess', 'ward'];

    cards.forEach(c => {
        if (c.keywords) {
            c.keywords.forEach(k => {
                const cleanK = k.toLowerCase().replace(/[^a-z -]/g, '');
                if (cleanK && !evergreen.includes(cleanK)) {
                    counts[`keyword:"${cleanK}"`] = (counts[`keyword:"${cleanK}"`] || 0) + 4;
                }
            });
        }
        if (c.type_line && c.type_line.includes('—')) {
            const subtypes = c.type_line.split('—')[1];
            if (subtypes) {
                subtypes.split(' ').forEach(s => {
                    const t = s.trim().toLowerCase().replace(/[^a-z-]/g, '');
                    if (t.length > 2) counts[`type:"${t}"`] = (counts[`type:"${t}"`] || 0) + 3;
                });
            }
        }
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 4);
    return sorted.length > 0 ? `(${sorted.join(' OR ')})` : "";
};

const getHardcodedBasic = (name) => {
    const urls = {
        'Plains': 'https://cards.scryfall.io/normal/front/1/4/14edc076-7936-417c-b166-51e60f04dbf5.jpg',
        'Island': 'https://cards.scryfall.io/normal/front/e/0/e0ff7b5a-ea35-46b5-8240-bd4b64fdd967.jpg',
        'Swamp': 'https://cards.scryfall.io/normal/front/c/c/ccb1070e-f495-46aa-bdba-36872a912bb0.jpg',
        'Mountain': 'https://cards.scryfall.io/normal/front/7/b/7bd2228e-8eec-4a7b-a01c-ea9baf3aa8b8.jpg',
        'Forest': 'https://cards.scryfall.io/normal/front/a/1/a15a81ce-83a3-4b68-8cf9-c32abec8bc91.jpg',
        'Wastes': 'https://cards.scryfall.io/normal/front/0/2/0272c948-b6e8-46f1-b842-b011d82136e7.jpg',
        'Snow-Covered Plains': 'https://cards.scryfall.io/normal/front/e/4/e4eb98ed-9945-4002-b5e7-0bec0b5d4a77.jpg',
        'Snow-Covered Island': 'https://cards.scryfall.io/normal/front/3/b/3bfa5ebc-5623-4eec-89ea-dc187489ee4a.jpg',
        'Snow-Covered Swamp': 'https://cards.scryfall.io/normal/front/6/a/6aa85af8-15f5-4620-8aea-0b45c28372ed.jpg',
        'Snow-Covered Mountain': 'https://cards.scryfall.io/normal/front/5/4/5474e67d-d014-411a-ab53-dfa33827d0f9.jpg',
        'Snow-Covered Forest': 'https://cards.scryfall.io/normal/front/c/a/ca17acea-f079-4e53-8afe-52304a9d40ec.jpg',
        'Snow-Covered Wastes': 'https://cards.scryfall.io/normal/front/0/2/0272c948-b6e8-46f1-b842-b011d82136e7.jpg'
    };
    return urls[name] || urls['Wastes'];
};

const calculateCustomCmc = (c) => {
    let cmc = c.cmc || 0; 
    const costStr = c.mana_cost || (c.card_faces ? c.card_faces.map(f=>f.mana_cost).join("") : "");
    const oracleStr = c.oracle_text || (c.card_faces ? c.card_faces.map(f=>f.oracle_text).join(" ") : "");
    
    const xCostMatches = costStr.match(/\{X\}/gi);
    if (xCostMatches) {
        cmc += (xCostMatches.length * 4);
    } else {
        if (oracleStr.match(/\{X\}[^:\n]*:/i) || oracleStr.match(/pay \{X\}/i)) {
            cmc += 4; 
        }
    }
    return cmc;
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [finalDeck, setFinalDeck] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [debugLogs, setDebugLogs] = useState([]);
  const [logCopied, setLogCopied] = useState(false);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStatus(LOADING_JOKES[Math.floor(Math.random() * LOADING_JOKES.length)]);
      interval = setInterval(() => {
        setLoadingStatus(LOADING_JOKES[Math.floor(Math.random() * LOADING_JOKES.length)]);
      }, 2500);
    } else {
      setLoadingStatus("");
    }
    return () => clearInterval(interval);
  }, [loading]);

  const addLog = (msg, data = null) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      let dataStr = "";
      if (data) {
          try { 
              dataStr = "\n  -> " + (Array.isArray(data) ? data.join(', ') : JSON.stringify(data)); 
          } catch (e) { 
              dataStr = "\n  -> [Unserializable Data]"; 
          }
      }
      const logEntry = `[${timestamp}] ${msg}${dataStr}`;
      console.log(logEntry);
      setDebugLogs(prev => [...prev, logEntry]);
  };

  const generateTagDeck = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setFinalDeck(null);
    setCopied(false);
    setLogCopied(false);
    setDebugLogs([]); 

    try {
      setProgress(5);
      addLog("=== STARTING DECK FORGE ===");
      addLog("Fetching master list of mechanics, typals, and themes...");
      let rawTags = [];
      try {
          const [kwRes, mechRes, typeRes] = await Promise.all([
              fetch("https://api.scryfall.com/catalog/keyword-abilities"),
              fetch("https://api.scryfall.com/catalog/keyword-mechanics"),
              fetch("https://api.scryfall.com/catalog/creature-types")
          ]);
          
          const kwData = kwRes.ok ? await kwRes.json() : {data: []};
          const mechData = mechRes.ok ? await mechRes.json() : {data: []};
          const typeData = typeRes.ok ? await typeRes.json() : {data: []};
          
          rawTags = [
            ...(kwData.data || []).map(t => ({ category: 'keyword', name: t })),
            ...(mechData.data || []).map(t => ({ category: 'oracle', name: t })),
            ...(typeData.data || []).map(t => ({ category: 'type', name: t })),
            ...EDHREC_THEMES.map(t => ({ category: 'theme', name: t })),
            ...ALL_MTG_KEYWORDS.map(t => ({ category: 'keyword', name: t }))
          ];
          if (rawTags.length === 0) throw new Error("Catalogs returned empty.");
      } catch (err) {
          addLog("WARNING: Catalog fetch failed. Using hardcoded fallback tags.", err.message);
          rawTags = [
              ...EDHREC_THEMES.map(t => ({ category: 'theme', name: t })),
              ...ALL_MTG_KEYWORDS.map(t => ({ category: 'keyword', name: t })),
              ...["Zombie", "Goblin", "Elf", "Vampire", "Dragon", "Merfolk", "Sliver", "Spirit", "Eldrazi", "Cat", "Dog", "Homunculus", "Myr", "Thrull"].map(t => ({category: 'type', name: t}))
          ];
      }

      const uniqueTagsMap = new Map();
      rawTags.forEach(t => {
          const key = t.name.toLowerCase().trim();
          if (!BANNED_MULTIPLAYER_TAGS.has(key)) {
              if (!uniqueTagsMap.has(key)) uniqueTagsMap.set(key, t);
          }
      });
      const tags = Array.from(uniqueTagsMap.values());
      addLog(`Master lists compiled. Available unique tags: ${tags.length}`);

      setProgress(10);
      let selectedTag = "";
      let baseQ = "";
      let edhrecCards = [];
      let allTimeCards = [];
      let tagQuery = "";
      let deckLockedColorId = 'C';

      let tagAttempts = 0;
      while (tagAttempts < 25) {
        tagAttempts++;
        const randomTagObj = tags[Math.floor(Math.random() * tags.length)];
        const randomTag = randomTagObj.name;
        const randomCat = randomTagObj.category;
        
        addLog(`[Attempt ${tagAttempts}] Testing theme: "${randomTag}" (Category: ${randomCat})...`);
        const exactOracle = getExactOracle(randomTag);

        baseQ = "";
        if (randomCat === 'type') {
            baseQ = `(type:"${randomTag}" OR ${exactOracle} OR otag:"${randomTag}")`;
        } else if (randomCat === 'keyword') {
            baseQ = `(keyword:"${randomTag}" OR ${exactOracle} OR otag:"${randomTag}")`;
        } else if (randomCat === 'theme') {
            baseQ = `(otag:"${randomTag}" OR ${exactOracle})`;
        } else {
            baseQ = `(${exactOracle} OR otag:"${randomTag}")`;
        }

        // --- THE PARASITIC HOST INJECTION ---
        // Expands base query to include bodies capable of holding parasitic spells
        const hostAddition = getHostQuery(randomTag);
        if (hostAddition) {
            baseQ = `(${baseQ} ${hostAddition})`;
            addLog(`Parasitic Mechanic Detected. Injected Host Framework into query: ${hostAddition}`);
        }

        tagQuery = `${baseQ} ${GLOBAL_FILTERS}`;
        
        try {
          addLog(`Phase 1 Exact Query: ${tagQuery}`);
          const edhRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(tagQuery)}&order=edhrec`);
          if (!edhRes.ok) { 
              addLog(`API request rejected (Likely no results). Retrying...`);
              await sleep(150); continue; 
          }
          
          const edhData = await edhRes.json();
          if (!edhData.data || edhData.total_cards < 10) {
            addLog(`Theme "${randomTag}" is too obscure (${edhData.total_cards} total cards). Skipping...`);
            await sleep(150); continue;
          }

          const validEdhPool = edhData.data.filter(isValidSpell);
          addLog(`Found ${edhData.total_cards} cards. ${validEdhPool.length} are valid playable spells.`);

          let colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
          let multiColorIdentities = [];

          validEdhPool.forEach(c => {
              if (c.color_identity && c.color_identity.length > 0) {
                  c.color_identity.forEach(color => colorCounts[color]++);
                  if (c.color_identity.length >= 2) multiColorIdentities.push(c.color_identity);
              }
          });

          let chosenColors = [];
          let forceMulticolor = false;

          if (multiColorIdentities.length >= 4 && Math.random() < 0.5) {
              forceMulticolor = true;
              const identityStrings = multiColorIdentities.map(id => [...id].sort().join(''));
              const identityFreq = {};
              let bestIdStr = "";
              let maxFreq = 0;
              identityStrings.forEach(str => {
                  identityFreq[str] = (identityFreq[str] || 0) + 1;
                  if (identityFreq[str] > maxFreq) { maxFreq = identityFreq[str]; bestIdStr = str; }
              });
              chosenColors = bestIdStr.split('');
              addLog(`Forcing Multi-Color Identity Based on Density: ${bestIdStr}`);
          } else {
              const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
              const maxCount = sortedColors[0][1];

              if (maxCount === 0) {
                  chosenColors = []; 
              } else {
                  const threshold = maxCount * 0.6;
                  const dominantColors = sortedColors.filter(c => c[1] >= threshold).map(c => c[0]);

                  if (dominantColors.length <= 3) {
                      chosenColors = dominantColors;
                  } else {
                      const shuffled = dominantColors.sort(() => 0.5 - Math.random());
                      chosenColors = [shuffled[0], shuffled[1]];
                  }
              }
              addLog(`Calculated Dominant Colors:`, chosenColors);
          }

          const fitsColor = (card, allowedColors) => {
              if (!card.color_identity || card.color_identity.length === 0) return true;
              return card.color_identity.every(c => allowedColors.includes(c));
          };

          let colorFilteredPool = validEdhPool.filter(c => fitsColor(c, chosenColors));
          addLog(`Applied Strict Color Identity Lock. Core pool reduced to ${colorFilteredPool.length} cards.`);

          deckLockedColorId = chosenColors.join('') || 'C';
          addLog(`Final Assigned Commander Color Identity: ${deckLockedColorId}`);

          let poolNC = colorFilteredPool.filter(c => !(c.type_line || "").includes("Creature"));
          let poolC = colorFilteredPool.filter(c => (c.type_line || "").includes("Creature"));

          if (forceMulticolor) {
              poolNC.sort((a, b) => (b.color_identity?.length || 0) - (a.color_identity?.length || 0));
              poolC.sort((a, b) => (b.color_identity?.length || 0) - (a.color_identity?.length || 0));
          }
          
          let chosenNC = poolNC.slice(0, 7);
          let chosenC = poolC.slice(0, 5);
          const seenIds = new Set([...chosenNC, ...chosenC].map(c => c.oracle_id));

          addLog(`Phase 1 Initial Split drafted: ${chosenNC.length} NC, ${chosenC.length} C.`, {
              nonCreatures: chosenNC.map(c=>c.name),
              creatures: chosenC.map(c=>c.name)
          });

          // STRICT LOOP: Forcefully find missing Non-Creatures
          if (chosenNC.length < 7) {
              addLog(`Strict Enforcement: Missing ${7 - chosenNC.length} Non-Creatures. Hunting fallbacks...`);
              const dynamicProfile = buildSynergyProfile(colorFilteredPool);
              const ncFallbacks = [];
              const exactFallback = getStrictFallbackQuery(randomTag, randomCat, deckLockedColorId, 'non-creature');
              
              if (exactFallback) ncFallbacks.push(exactFallback);
              if (dynamicProfile) ncFallbacks.push(`(-t:creature ${dynamicProfile} ${GOODSTUFF_PURGE}) id<=${deckLockedColorId} ${STRICT_BASE}`);
              ncFallbacks.push(`(-t:creature (otag:synergy OR otag:tribal-support) ${GOODSTUFF_PURGE}) id<=${deckLockedColorId} ${STRICT_BASE}`);
              
              for (const q of ncFallbacks) {
                  if (chosenNC.length >= 7) break;
                  await sleep(150);
                  try {
                      addLog(`Trying Non-Creature Fallback Query: ${q}`);
                      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=edhrec`);
                      if (res.ok) {
                          const data = await res.json();
                          const valid = data.data.filter(c => isValidSpell(c) && !seenIds.has(c.oracle_id));
                          
                          const topStaples = valid.slice(0, 30);
                          const shuffled = topStaples.sort(() => 0.5 - Math.random());
                          
                          const needed = 7 - chosenNC.length;
                          const toAdd = shuffled.slice(0, needed);
                          chosenNC.push(...toAdd);
                          toAdd.forEach(c => seenIds.add(c.oracle_id));
                          addLog(`Successfully pulled ${toAdd.length} fallback non-creatures:`, toAdd.map(c=>c.name));
                      }
                  } catch (e) {}
              }
          }

          // STRICT LOOP: Forcefully find missing Creatures
          if (chosenC.length < 5) {
              addLog(`Strict Enforcement: Missing ${5 - chosenC.length} Creatures. Hunting fallbacks...`);
              const dynamicProfile = buildSynergyProfile(colorFilteredPool);
              const cFallbacks = [];
              const exactFallback = getStrictFallbackQuery(randomTag, randomCat, deckLockedColorId, 'creature');
              
              if (exactFallback) cFallbacks.push(exactFallback);
              if (dynamicProfile) cFallbacks.push(`(t:creature ${dynamicProfile} ${GOODSTUFF_PURGE}) id<=${deckLockedColorId} ${STRICT_BASE}`);
              cFallbacks.push(`(t:creature (otag:synergy OR otag:tribal-support) ${GOODSTUFF_PURGE}) id<=${deckLockedColorId} ${STRICT_BASE}`);
              
              for (const q of cFallbacks) {
                  if (chosenC.length >= 5) break;
                  await sleep(150);
                  try {
                      addLog(`Trying Creature Fallback Query: ${q}`);
                      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=edhrec`);
                      if (res.ok) {
                          const data = await res.json();
                          const valid = data.data.filter(c => isValidSpell(c) && !seenIds.has(c.oracle_id));
                          
                          const topStaples = valid.slice(0, 30);
                          const shuffled = topStaples.sort(() => 0.5 - Math.random());
                          
                          const needed = 5 - chosenC.length;
                          const toAdd = shuffled.slice(0, needed);
                          chosenC.push(...toAdd);
                          toAdd.forEach(c => seenIds.add(c.oracle_id));
                          addLog(`Successfully pulled ${toAdd.length} fallback creatures:`, toAdd.map(c=>c.name));
                      }
                  } catch (e) {}
              }
          }

          edhrecCards = [...chosenNC, ...chosenC];
          selectedTag = randomTag;
          
          setProgress(40);
          addLog(`Phase 1 Complete: Exact 12 Core Cards drafted.`);
          break;
        } catch (err) {
          addLog(`Network error while testing theme "${randomTag}", skipping to next...`);
          await sleep(150);
        }
      }

      if (!selectedTag) throw new Error("Failed to find a viable theme after multiple attempts. Please try again.");

      setProgress(45);
      const seenIds = new Set(edhrecCards.map((c) => c.oracle_id));
      
      const targetAllTime = 23 - edhrecCards.length;
      addLog(`Phase 2: Grabbing ${targetAllTime} all-time randoms strictly matching "${selectedTag}"...`);
      
      let attempts = 0;
      const colorRestrictedTagQuery = `${tagQuery} id<=${deckLockedColorId}`;

      while (allTimeCards.length < targetAllTime && attempts < 35) {
        attempts++;
        await sleep(100); 
        try {
          const rRes = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(colorRestrictedTagQuery)}`);
          if (rRes.ok) {
            const card = await rRes.json();
            if (!seenIds.has(card.oracle_id) && isValidSpell(card)) {
              seenIds.add(card.oracle_id);
              allTimeCards.push(card);
              setProgress(prev => Math.min(65, prev + (20 / targetAllTime)));
            }
          }
        } catch (err) {}
      }
      
      addLog(`Phase 2 Complete. Fetched ${allTimeCards.length} random all-time cards:`, allTimeCards.map(c=>c.name));

      setProgress(65);
      let missingCount = 23 - (edhrecCards.length + allTimeCards.length);

      // === PHASE 3: TRUE MECHANICAL SYNERGY FALLSAFE ===
      if (missingCount > 0) {
          setProgress(75);
          addLog(`Theme exhausted early. Phase 3 triggering to fill ${missingCount} remaining slots.`);
          
          const dynamicProfile = buildSynergyProfile([...edhrecCards, ...allTimeCards]);
          addLog(`Calculated STRICT Mechanical Fingerprint: ${dynamicProfile}`);
          
          const fallbackQs = [];
          
          // --- THE CREATURE CURVE FAILSAFE ---
          // Evaluates how many true creatures exist before drafting spells. 
          const currentCreatures = [...edhrecCards, ...allTimeCards].filter(c => (c.type_line || "").includes("Creature")).length;
          
          if (currentCreatures < 10) {
              addLog(`WARNING: Creature density critically low (${currentCreatures}). Forcing synergistic bodies in Phase 3.`);
              if (dynamicProfile) fallbackQs.push(`t:creature ${dynamicProfile} ${GOODSTUFF_PURGE} id<=${deckLockedColorId} ${STRICT_BASE}`);
              fallbackQs.push(`t:creature (otag:synergy OR otag:tribal-support) ${GOODSTUFF_PURGE} id<=${deckLockedColorId} ${STRICT_BASE}`);
          }
          
          if (dynamicProfile) fallbackQs.push(`${dynamicProfile} ${GOODSTUFF_PURGE} id<=${deckLockedColorId} ${STRICT_BASE}`);
          fallbackQs.push(`(otag:synergy OR otag:tribal-support) ${GOODSTUFF_PURGE} id<=${deckLockedColorId} ${STRICT_BASE}`);
          
          for (const q of fallbackQs) {
              if (missingCount <= 0) break;
              await sleep(150);
              try {
                  addLog(`Executing Synergy Query: ${q}`);
                  const ffRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=edhrec`);
                  if (ffRes.ok) {
                      const ffData = await ffRes.json();
                      const validFinal = (ffData.data || []).filter(c => !seenIds.has(c.oracle_id) && isValidSpell(c));
                      
                      const topStaples = validFinal.slice(0, 50);
                      const shuffledFinal = topStaples.sort(() => 0.5 - Math.random());
                      
                      const toAdd = shuffledFinal.slice(0, missingCount);
                      toAdd.forEach(c => { seenIds.add(c.oracle_id); allTimeCards.push(c); });
                      missingCount -= toAdd.length;
                      addLog(`Added ${toAdd.length} True Synergy pieces to deck:`, toAdd.map(c=>c.name));
                  }
              } catch (err) {}
          }
      }

      setProgress(80);
      addLog(`Successfully built the 23-card non-land base.`);
      const deckNonLands = [...edhrecCards, ...allTimeCards];

      addLog(`Analyzing deep mana costs and abilities for perfect land fixing...`);
      let pips = { W: 0, U: 0, B: 0, R: 0, G: 0 };
      let identitySet = new Set();
      let totalCmc = 0;
      let validCmcCards = 0;
      let requiresSnow = false;

      const parsePips = (text) => {
          if (!text) return;
          const symbols = text.match(/\{[^}]+\}/g);
          if (symbols) {
              symbols.forEach(sym => {
                  const letters = sym.match(/[WUBRG]/gi);
                  if (letters) {
                      letters.forEach(l => {
                          const color = l.toUpperCase();
                          if (pips[color] !== undefined) pips[color]++;
                      });
                  }
              });
          }
      };

      deckNonLands.forEach(c => {
        totalCmc += calculateCustomCmc(c);
        validCmcCards++;

        let fullTextToScan = (c.oracle_text || "") + " " + (c.mana_cost || "");
        if (c.card_faces) {
            fullTextToScan += " " + c.card_faces.map(f => (f.oracle_text || "") + " " + (f.mana_cost || "")).join(" ");
        }
        parsePips(fullTextToScan);

        if (fullTextToScan.includes("{S}")) requiresSnow = true;
        if (c.color_identity) c.color_identity.forEach(color => identitySet.add(color));
      });

      const avgCmc = validCmcCards > 0 ? (totalCmc / validCmcCards) : 3.0;
      const deckColors = Array.from(identitySet);
      const totalPips = deckColors.reduce((sum, color) => sum + pips[color], 0);
      
      addLog(`Pip Color Distribution:`, pips);
      addLog(`Curve Analysis -> Total CMC: ${totalCmc}, Valid Cards: ${validCmcCards}, Avg CMC: ${avgCmc.toFixed(2)}`);
      
      let calculatedLands = Math.round(15 + Math.max(0, (avgCmc - 1.5) * 3.5));
      const TOTAL_LANDS = Math.max(15, Math.min(25, calculatedLands));
      addLog(`Land Calculation: 15 + Math.max(0, (${avgCmc.toFixed(2)} - 1.5) * 3.5) = ${calculatedLands}. Capped at ${TOTAL_LANDS} Total Lands.`);
      
      const BASIC_LAND_TOTAL = Math.ceil(TOTAL_LANDS * 0.5); 
      const NON_BASIC_TOTAL = Math.floor(TOTAL_LANDS * 0.5); 
      const lands = [];

      setProgress(85);
      const basicsToFetch = [];
      const basicNames = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest', C: 'Wastes' };

      if (deckColors.length === 0) {
        if (requiresSnow) {
            basicsToFetch.push({ color: 'C', name: 'Snow-Covered Wastes', count: Math.ceil(BASIC_LAND_TOTAL * 0.30) });
            basicsToFetch.push({ color: 'C', name: 'Wastes', count: BASIC_LAND_TOTAL - Math.ceil(BASIC_LAND_TOTAL * 0.30) });
        } else {
            basicsToFetch.push({ color: 'C', name: 'Wastes', count: BASIC_LAND_TOTAL });
        }
      } else {
        let remaining = BASIC_LAND_TOTAL;
        deckColors.forEach((color, i) => {
          let count = 0;
          if (i === deckColors.length - 1) {
            count = Math.max(0, remaining);
          } else {
            const proportion = totalPips === 0 ? (1 / deckColors.length) : (pips[color] / totalPips);
            count = Math.min(remaining, Math.round(proportion * BASIC_LAND_TOTAL));
          }
          
          if (requiresSnow) {
             const snowCount = Math.ceil(count * 0.30);
             const normalCount = count - snowCount;
             if (snowCount > 0) basicsToFetch.push({ color, name: `Snow-Covered ${basicNames[color]}`, count: snowCount });
             if (normalCount > 0) basicsToFetch.push({ color, name: basicNames[color], count: normalCount });
          } else {
             basicsToFetch.push({ color, name: basicNames[color], count });
          }
          remaining -= count;
        });
      }

      addLog(`Basic Land Allocation Array:`, basicsToFetch);

      for (const req of basicsToFetch) {
        if (req.count <= 0) continue;
        setProgress(prev => Math.min(95, prev + (10 / basicsToFetch.length)));
        await sleep(150);
        try {
          const bQuery = `t:basic "${req.name}" -is:digital lang:en`;
          const bRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(bQuery)}&unique=art`);
          if (bRes.ok) {
            const bData = await bRes.json();
            const availableBasics = bData.data || [];
            
            for (let k = 0; k < req.count; k++) {
              const randomArt = availableBasics[Math.floor(Math.random() * availableBasics.length)];
              lands.push({ ...randomArt, id: `${randomArt.id}-${k}` });
            }
          } else {
            throw new Error("Basic fetch rejected");
          }
        } catch (err) {
            addLog(`API failed basic fetch for ${req.name}. Using hardcoded failsafe images.`);
            for (let k = 0; k < req.count; k++) {
                lands.push({ 
                    name: req.name, 
                    type_line: "Basic Land", 
                    set: "ugl", 
                    collector_number: "1", 
                    color_identity: [req.color], 
                    image_uris: { normal: getHardcodedBasic(req.name) },
                    id: `hardcoded-fb-${req.name}-${k}` 
                });
            }
        }
      }
      
      addLog(`Successfully parsed basics.`);

      setProgress(95);
      await sleep(150);
      try {
        const colorStr = deckColors.join('') || 'c';
        let selectedNb = [];
        const seenNbIds = new Set(seenIds); 
        
        const allColors = ['W', 'U', 'B', 'R', 'G'];
        const missingColors = allColors.filter(c => !deckColors.includes(c));
        let colorlessLandFilter = "";
        
        if (missingColors.length === 0) {
            colorlessLandFilter = ""; // FIX: Prevents the empty () syntax error on 5-color decks
        } else if (deckColors.length > 0) {
            const onColorOracles = deckColors.map(c => `oracle:${basicNames[c]}`).join(' OR ');
            const missingOracles = missingColors.map(c => `-oracle:${basicNames[c]}`).join(' ');
            colorlessLandFilter = `(-id:c OR ${onColorOracles} OR oracle:"basic land" OR (${missingOracles}))`;
        } else {
            const allMissingOracles = allColors.map(c => `-oracle:${basicNames[c]}`).join(' ');
            colorlessLandFilter = `(-id:c OR oracle:"basic land" OR (${allMissingOracles}))`;
        }
        
        if (colorlessLandFilter) {
            addLog(`Assembling Fetchland/Off-Color Land Guardrail Filter: ${colorlessLandFilter}`);
        }
        
        const nbFilters = `-t:basic t:land ${STRICT_BASE} ${colorlessLandFilter}`;
        const maxSynergyCount = Math.ceil(NON_BASIC_TOTAL * 0.5);

        try {
            const themeNbQuery = `${baseQ} ${nbFilters} id<=${colorStr}`;
            addLog(`Executing Thematic Non-Basic Query: ${themeNbQuery}`);
            const tNbRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(themeNbQuery)}&order=edhrec`);
            if (tNbRes.ok) {
                const tNbData = await tNbRes.json();
                const availableThemeNb = tNbData.data || [];
                const shuffledThemeNb = availableThemeNb.sort(() => 0.5 - Math.random());
                const toAdd = shuffledThemeNb.slice(0, maxSynergyCount);
                toAdd.forEach(c => {
                    selectedNb.push(c);
                    seenNbIds.add(c.oracle_id);
                });
                addLog(`Added ${toAdd.length} thematic non-basic lands:`, toAdd.map(c=>c.name));
            }
        } catch (err) {}

        const remainingNb = NON_BASIC_TOTAL - selectedNb.length;
        if (remainingNb > 0) {
            await sleep(150);
            const nbQuery = `${nbFilters} id<=${colorStr}`;
            addLog(`Executing Generic Synergy Non-Basic Query: ${nbQuery}`);
            const nbRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(nbQuery)}&order=edhrec`);
            if (nbRes.ok) {
                const nbData = await nbRes.json();
                const availableNb = (nbData.data || []).filter(c => !seenNbIds.has(c.oracle_id));
                const shuffledNb = availableNb.sort(() => 0.5 - Math.random());
                const toAdd = shuffledNb.slice(0, remainingNb);
                selectedNb.push(...toAdd);
                addLog(`Added ${toAdd.length} general non-basic lands:`, toAdd.map(c=>c.name));
            }
        }
        
        lands.push(...selectedNb);
        
        const stillMissing = NON_BASIC_TOTAL - selectedNb.length;
        if (stillMissing > 0) {
            addLog(`Non-Basics exhausted. Filling ${stillMissing} remaining slots with basic fallback.`);
            const fallbackColor = deckColors.length > 0 ? deckColors[0] : 'C';
            const fbName = basicNames[fallbackColor] || 'Wastes';
            
            try {
                await sleep(150);
                const bQuery = `t:basic "${fbName}" -is:digital lang:en`;
                const fnbRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(bQuery)}&unique=art`);
                if (fnbRes.ok) {
                     const fnbData = await fnbRes.json();
                     const availableBasics = fnbData.data || [];
                     for(let m = 0; m < stillMissing; m++) {
                         const randomArt = availableBasics[Math.floor(Math.random() * availableBasics.length)];
                         lands.push({ ...randomArt, id: `${randomArt.id}-fb-${Math.random()}` });
                     }
                } else throw new Error("Fallback fetch failed");
            } catch (err) {
                 for(let m = 0; m < stillMissing; m++) {
                     lands.push({ 
                         name: fbName, 
                         type_line: "Basic Land", 
                         set: "ugl", 
                         collector_number: "1", 
                         color_identity: [fallbackColor],
                         image_uris: { normal: getHardcodedBasic(fbName) },
                         id: `hardcoded-fb-${Math.random()}` 
                     });
                 }
            }
        }
      } catch (err) {
          addLog(`Critical Non-Basic Land failure. Deploying hardcoded ugly lands.`);
          const fallbackColor = deckColors.length > 0 ? deckColors[0] : 'C';
          const fbName = basicNames[fallbackColor] || 'Wastes';
          for(let m = 0; m < NON_BASIC_TOTAL; m++) {
              lands.push({ 
                  name: fbName, 
                  type_line: "Basic Land", 
                  set: "ugl", 
                  collector_number: "1",
                  image_uris: { normal: getHardcodedBasic(fbName) },
                  id: `hardcoded-last-fb-${Math.random()}` 
              });
          }
      }

      setProgress(100);
      addLog("=== DECK GENERATION SUCCESSFUL ===");
      setFinalDeck({
        tag: selectedTag,
        edhrec: edhrecCards,
        allTime: allTimeCards,
        lands
      });
      setLoading(false);

    } catch (e) {
      addLog(`CRITICAL SYSTEM ERROR: ${e.message}`);
      setError(e.message);
      setLoading(false);
    }
  };

  const getImg = (c) => c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal;

  const copyToClipboard = () => {
      if (!finalDeck) return;
      const counts = {};
      
      const add = (c) => { 
          const cleanName = (c.name || "").replace(/^A-/, '');
          const isBasic = (c.type_line || "").includes("Basic Land");
          
          const key = isBasic 
            ? `${cleanName} (${(c.set || 'ugl').toUpperCase()}) ${c.collector_number || '1'}`
            : cleanName;
          counts[key] = (counts[key] || 0) + 1; 
      };
      
      finalDeck.edhrec.forEach(add);
      finalDeck.allTime.forEach(add);
      finalDeck.lands.forEach(add);

      const text = Object.entries(counts).map(([key, count]) => `${count} ${key}`).join('\n');
      
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        const timeout = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timeout);
      } catch (err) {
        console.error('Failed to copy', err);
      }
      document.body.removeChild(textArea);
  };

  const copyLogToClipboard = () => {
      const text = debugLogs.join('\n\n');
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setLogCopied(true);
        const timeout = setTimeout(() => setLogCopied(false), 2000);
        return () => clearTimeout(timeout);
      } catch (err) {
        console.error('Failed to copy log', err);
      }
      document.body.removeChild(textArea);
  };

  const renderCardGrid = (title, cards, badgeColor) => {
      if (!cards || cards.length === 0) return null;
      return (
          <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-xl font-bold text-slate-100">{title}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-md text-slate-900 ${badgeColor}`}>{cards.length} Cards</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {cards.map((card, i) => (
                      <div key={card.id || i} className="relative group rounded-xl overflow-hidden shadow-md transition-transform hover:scale-105 border border-slate-700 bg-slate-800 flex items-center justify-center min-h-[200px]">
                          {getImg(card) ? (
                              <img src={getImg(card)} alt={card.name} className="w-full h-auto object-cover" />
                          ) : (
                              <div className="p-4 text-center text-sm font-bold text-slate-300">
                                  {card.name.replace(/^A-/, '')}
                                  {card.type_line && <div className="text-xs text-slate-500 mt-2 font-mono">{card.type_line}</div>}
                              </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                              <div className="text-xs text-center text-white font-bold">{card.name.replace(/^A-/, '')}</div>
                              <div className="text-[10px] text-center text-slate-400 mt-1">{card.type_line}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-rose-500/30 pb-12">
      
      {/* MINIMALIST HEADER */}
      {(loading || finalDeck || error) && (
        <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-center">
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              THEME DECK FORGE
            </h1>
          </div>
        </header>
      )}

      <main className={!loading && !finalDeck && !error ? "min-h-screen flex items-center justify-center" : "py-8"}>
        <div className="w-full max-w-6xl mx-auto p-4">
          
          {/* THE NEW MINIMALIST ENTRY SCREEN */}
          {!loading && !finalDeck && !error && (
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={generateTagDeck}
                className="px-14 py-8 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-black text-4xl rounded-full shadow-2xl shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-4 border border-rose-400/30 tracking-tight"
              >
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                FORGE DECK
              </button>
            </div>
          )}

          {(loading || error) && (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-inner mt-12">
              {error ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-red-500 font-bold text-sm border border-red-500/30 bg-red-500/10 p-3 rounded w-full text-center">
                      CRITICAL ERROR: {error}
                    </div>
                    {debugLogs.length > 0 && (
                        <button 
                          onClick={copyLogToClipboard}
                          className="px-4 py-2 text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 w-full sm:w-auto"
                        >
                          {logCopied ? "Copied Log!" : "Copy Debug Log for Troubleshooting"}
                        </button>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="animate-pulse">{loadingStatus || "Initializing..."}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {finalDeck && !loading && (
            <div className="animate-fade-in-up mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-8 border-b border-slate-800 pb-6 gap-4">
                 <div className="text-center sm:text-left">
                    <p className="text-rose-400 text-xs font-black uppercase tracking-widest mb-1">Generated Synergy Theme</p>
                    <h2 className="text-5xl font-black text-white capitalize">{finalDeck.tag.replace(/-/g, ' ')}</h2>
                 </div>
                 <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                     <button 
                        onClick={generateTagDeck}
                        className="px-5 py-2.5 font-bold rounded-xl shadow-lg transition-all active:scale-95 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      >
                        Roll Again
                     </button>
                     <button 
                        onClick={copyToClipboard}
                        className={`px-5 py-2.5 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border border-rose-500/50 hover:from-orange-400 hover:to-rose-400'}`}
                      >
                        {copied ? (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Copied!</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg> Export Decklist</>
                        )}
                     </button>
                     <button 
                        onClick={copyLogToClipboard}
                        className={`px-5 py-2.5 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${logCopied ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
                      >
                        {logCopied ? (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Log Copied!</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Debug Log</>
                        )}
                     </button>
                 </div>
              </div>

              {renderCardGrid("Strict Thematic EDHREC Core (7 Non-Creatures / 5 Creatures)", finalDeck.edhrec, "bg-blue-500 text-white")}
              {renderCardGrid("Random Thematic Draft (History of MTG)", finalDeck.allTime, "bg-purple-500 text-white")}
              {renderCardGrid(`Dynamic Mana Base (${finalDeck.lands.length} Lands)`, finalDeck.lands, "bg-emerald-500 text-white")}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
}
