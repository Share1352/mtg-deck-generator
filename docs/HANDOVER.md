# MTG Theme Deck Generator — revised Codex handover

Version: 2  
Prepared for repository: `Share1352/mtg-deck-generator`  
Purpose: give Codex a clean, exact, production-ready specification based on the full Gemini conversation, not just the latest Gemini code.

## 0. Direct instruction to Codex

Build this app from scratch as a clean Vite + React project.

Do not paste the Gemini prototype directly as the production app.

The Gemini code may be saved as:

```txt
reference/gemini-latest.jsx
```

Use it only as a reference for ideas, previous bugs, loading jokes, and UI direction. The real app must be refactored into modules with tests.

The current Gemini prototype is not the source of truth. This handover is the source of truth.

## 1. What the app is

A one-button web app that generates a small casual Magic: The Gathering 1v1 theme deck.

The user opens the website, presses one button, and receives:

- one randomly selected theme/tag/keyword/typal concept;
- 23 non-land cards built around that theme;
- 15 to 25 lands based on the deck’s mana curve and color requirements;
- card images;
- a copyable decklist;
- a copyable full debug log explaining why the app made each decision.

This is not Commander.

This is not EDH, even though EDHREC data is used as a synergy source.

This is for casual 1v1 play, including online play on EDHPlay or similar tools.

Do not use Commander language in the UI or debug logs. Do not say “commander color identity.” Say “chosen deck colors” or “deck color identity.”

## 2. Repository and deployment

Repository:

```txt
https://github.com/Share1352/mtg-deck-generator
```

The repo is empty or should be treated as empty.

Build:

```txt
Vite + React
```

Deployment target:

```txt
GitHub Pages
```

Expected public URL:

```txt
https://share1352.github.io/mtg-deck-generator/
```

Vite config must include:

```js
export default defineConfig({
  plugins: [react()],
  base: "/mtg-deck-generator/",
});
```

Add GitHub Pages workflow.

The final project must support:

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## 3. Suggested architecture

Do not build one giant `App.jsx`.

Suggested structure:

```txt
mtg-deck-generator/
  index.html
  package.json
  vite.config.js
  README.md
  reference/
    gemini-latest.jsx
  public/
    data/
      edhrec-tags.json
      edhrec-synergy-cache.json
      banned-tags.json
      crossover-set-policy.json
  scripts/
    build-edhrec-tags.mjs
    build-edhrec-synergy-cache.mjs
    verify-scryfall-set-policy.mjs
  src/
    main.jsx
    App.jsx
    styles.css
    lib/
      constants.js
      logger.js
      random.js
      scryfallClient.js
      edhrecClient.js
      filters.js
      themePool.js
      themeQueries.js
      colorEngine.js
      cardSelection.js
      parasiticMechanics.js
      manaValue.js
      manaPips.js
      manaBase.js
      printSelection.js
      exportDeck.js
      validation.js
      cardClassification.js
    components/
      GenerateButton.jsx
      ProgressBar.jsx
      DeckView.jsx
      CardGrid.jsx
      DebugLogButton.jsx
    tests/
      themePool.test.js
      filters.test.js
      colorEngine.test.js
      cardSelection.test.js
      manaValue.test.js
      manaPips.test.js
      manaBase.test.js
      exportDeck.test.js
      validation.test.js
```

Recommended dependencies:

```txt
vite
react
react-dom
lucide-react
vitest
@vitejs/plugin-react
```

Tailwind is optional. Plain CSS is fine.

## 4. Final UI requirements

### 4.1 Before generation

The page should show only one main button.

Text:

```txt
FORGE DECK
```

No settings.  
No forms.  
No draft mode.  
No visible technical explanation.  
No card list.  
No extra mode tabs.

### 4.2 During generation

Show:

- progress bar;
- percentage;
- short loading joke.

Do not show technical loading phrases to the normal user.

The technical details must go only into the debug log.

### 4.3 Loading jokes

The jokes should be easy for Gracee to understand as a beginner MTG player.

Use jokes about:

- Stass and Gracee playing 1v1 online;
- marriage;
- P, Gracee’s favorite plush toy on the bed;
- shuffling;
- cute card art;
- bargaining over chores;
- one more game;
- Gracee slowly learning and beating Stass.

Avoid:

- children;
- proxies;
- Commander;
- EDH;
- too much MTG jargon;
- jokes that require advanced rules knowledge.

The current Gemini file has a useful list of Gracee/P/marriage jokes. It can be reused and cleaned up.

### 4.4 After generation

Show:

1. Selected theme.
2. EDHREC synergy core section.
3. Random all-time theme cards section.
4. Mana base section.
5. Export decklist button.
6. Copy full debug log button.
7. Roll again button.

The deck should be visual, using card images.

If an image is missing, show a clean text placeholder, but missing images should be rare and logged.

## 5. Deck size and structure

Always generate:

```txt
23 non-land cards
15-25 lands
```

Total deck size is usually:

```txt
38-48 cards
```

There must never be fewer than 23 non-land cards.

There must never be missing lands.

There must never be blank “dummy” lands unless the debug log explicitly says Scryfall failed and a hard fallback was used. Even then, the exported decklist must still be valid.

## 6. How theme selection must work

### 6.1 Sources for candidate themes

Build the final candidate theme list from these sources:

1. EDHREC all-tags data, including:
   - Themes
   - Typal
   - Keywords
   - Mechanics
   - any other real EDHREC tag groups that are useful

2. Scryfall catalog data:
   - keyword abilities
   - keyword actions / mechanics where available
   - creature types

3. Hardcoded MTG mechanics/keywords safety list:
   - evergreen keywords
   - deciduous keywords
   - set-specific mechanics
   - older mechanics
   - recent mechanics

The hardcoded list exists because Scryfall/EDHREC may not expose every concept in the exact way needed.

Examples that must be covered:

```txt
Trample
Double Strike
Vigilance
Flying
Ward
Undying
Persist
Mutate
Ninjutsu
Buyback
Saddle
Incubate
Celebration
Plot
Spree
Mobilize
Enchant
Equip
Crew
Auras
Vehicles
Landfall
Aristocrats
Spellslinger
Blink
Myr
Mite
Thrull
Ox
Mole
Serpent
```

### 6.2 Equal chance requirement

After all candidate themes are merged, normalized, deduplicated, and banned themes are removed:

```txt
every remaining theme must have equal chance to be selected
```

This is important.

Do not weight by popularity.  
Do not weight by EDHREC deck count.  
Do not weight by number of cards.  
Do not give obscure tags lower probability.  
Do not skip obscure tags just because they are obscure.

The original requirement explicitly says even obscure tags at the bottom of EDHREC should have equal chance.

### 6.3 Small themes must not be automatically rejected

The current Gemini prototype rejects themes with fewer than 10 cards. That violates the original requirement.

Do not do this:

```js
if (theme.totalCards < 10) reroll();
```

Small themes like Mole, Ox, Mite, Saddle, Celebration, Mobilize, or Hexproof from must still be allowed if they have enough support after synergy fallback.

Correct behavior:

1. Pick theme fairly.
2. Try to build exact theme cards.
3. If exact theme cards are too few, use the theme’s high-synergy support cards.
4. If still short, use strict theme-adjacent mechanical support.
5. Only fail/reroll if the theme is genuinely impossible or not usable after all fallback levels.

If the app must reroll, log the exact reason:

```txt
Rerolled theme "X" because it had 0 playable cards and no supported synergy fallback.
```

Do not reroll because a theme is merely narrow.

## 7. Banned theme/tag pool

Exclude themes or tags that are mainly:

- multiplayer-only;
- Commander-only;
- draft-only;
- side-deck-only;
- Planechase / Archenemy / Vanguard / Conspiracy related;
- not suited to normal 1v1 deck play.

Initial banlist:

```js
[
  "myriad",
  "will of the council",
  "goad",
  "melee",
  "dethrone",
  "monarch",
  "tempting offer",
  "join forces",
  "parley",
  "undaunted",
  "council's dilemma",
  "assist",
  "secret council",
  "voting",
  "draft",
  "conspiracy",
  "lieutenant",
  "partner",
  "friends forever",
  "choose a background",
  "background",
  "demonstrate",
  "squad",
  "scheme",
  "vanguard",
  "phenomenon",
  "archenemy",
  "planechase",
  "hidden agenda",
  "commander",
  "commander matters"
]
```

Do not ban normal Planeswalker cards.

Do ban Planechase plane cards.

Do not use broad substring checks that accidentally exclude Planeswalkers because they contain the word “Plane.”

## 8. Card filtering rules

### 8.1 Always exclude these card objects

Exclude:

- lands from the 23 non-land card section;
- tokens;
- emblems;
- art series;
- reversible cards;
- dungeons;
- bounties;
- sticker sheets;
- attractions;
- contraptions;
- schemes;
- vanguards;
- conspiracies;
- phenomena;
- plane cards;
- hero cards;
- playtest cards;
- memorabilia cards;
- Alchemy cards;
- Arena-only/digital-only cards;
- non-English printings;
- Commander-only cards;
- cards that require the command zone;
- cards that rely on drafting;
- cards that require side decks such as attractions, contraptions, stickers, dungeons, or similar external systems.

Examples of cards/categories that must never appear:

```txt
Command Tower
cards with Lieutenant that require a commander
Dungeon of the Mad Mage
Ferris Wheel
Attractions
Contraptions
Sticker sheets
17-Year Cicadas
More of That Strange Oil...
Ate-o'-Clock
Jarsyl, Dark Age Scion
Arena/Alchemy A- cards
```

### 8.2 Be careful with Commander filtering

The user wants to remove commander-only cards, not accidentally remove every card with harmless text.

Avoid using a blind filter if it removes useful normal cards.

Better approach:

- explicitly reject cards whose oracle text depends on “your commander,” “commander you control,” “commander tax,” “command zone,” or Lieutenant;
- reject well-known Commander-only mana/fixing cards such as Command Tower;
- use tests with known examples.

If Codex uses Scryfall syntax like `-o:commander`, it must prove with tests that it does not remove too much. Prefer internal validation over a huge blunt query.

### 8.3 Token nuance

Do not generate token cards.

Do not create a token sideboard.

Do not add “related token cards” as dependencies.

However, real playable cards that create tokens may still be valid if they are actually thematic and not generic goodstuff. For example, a real card that makes Mites may be valid in a Mite deck. A generic token staple should not be used as fallback just because many Mite cards mention tokens.

### 8.4 Un-set / acorn card nuance

Standalone joke/acorn/silver-border/Un-set cards are allowed.

But unplayable external-system cards are not allowed.

Allowed:

```txt
standalone Un-set cards
standalone acorn cards
fun cards that work as main-deck cards
```

Not allowed:

```txt
playtest cards with weird/blank data
sticker sheets
attractions
contraptions
cards that tell you to open attractions
cards that require sticker mechanics
dungeons as deck cards
bounties
```

Important: do not ban all “funny” or acorn cards. The user explicitly changed their mind and wants joke/acorn/Un-set cards allowed if they work as actual main-deck cards.

## 9. Universes Beyond / crossover policy

The user does not want a blanket Universes Beyond ban.

Allowed crossover families:

```txt
Lord of the Rings
Final Fantasy
Dungeons & Dragons
```

Banned crossover families:

```txt
Transformers
Warhammer 40,000
Spider-Man / Marvel
Avatar: The Last Airbender
Doctor Who
Fallout
```

Known Scryfall set-code examples as of this handover:

```txt
Transformers: BOT
Warhammer 40,000: 40K
Doctor Who: WHO
Fallout: PIP
Avatar: TLA, TLE, TTLA and related Avatar products
Spider-Man: SPM, SPE and related Spider-Man products
LOTR allowed: LTR, LTC and related LOTR products
Final Fantasy allowed: FIN and related Final Fantasy products
D&D allowed: AFR, AFC, CLB and related D&D products, excluding digital-only products
```

Codex must verify current set codes through Scryfall’s sets endpoint or metadata before finalizing.

Do not rely only on hardcoded guesses if Scryfall exposes better set metadata.

Implementation recommendation:

- create `crossover-set-policy.json`;
- use Scryfall `/sets` to verify set codes during a build script;
- deny banned families by set code and/or set name matching;
- allow only the named exceptions from Universes Beyond;
- test with known bad examples such as Aang and known good examples from LOTR / Final Fantasy / D&D.

## 10. Print selection

### 10.1 Non-land cards

Use original paper English printing where possible.

If the original printing is not allowed because of filters, use the earliest valid paper English printing.

Do not use digital-only printings.

Do not use Alchemy rebalanced variants.

If an `A-` variant somehow slips through, strip `A-` in export as a last safety net, but the real fix is to prevent it from entering the deck.

### 10.2 Basic lands

Basics should have random art each generation.

Each individual basic land can have a different set/art.

Export format:

```txt
1 Forest (SOS) 280
1 Island (ELD) 257
1 Snow-Covered Swamp (KHM) 280
```

Do not collapse all basics into one identical art unless they genuinely rolled the same printing.

## 11. Card selection overview

The latest intended structure is:

```txt
12 EDHREC high-synergy core cards
11 Scryfall all-time random theme cards
= 23 non-land cards
```

The older 10 EDHREC + 13 Scryfall requirement has been superseded.

The older “add specifically named dependency cards from rules text” requirement has also been superseded. Do not add dependencies now.

## 12. EDHREC core selection: 12 cards

> **Implementation status (current reality).** This section is the *original aspirational spec* and
> does not match shipped behaviour. There is **no live EDHREC integration**: `json.edhrec.com` has no
> public API, sends no CORS headers for browser apps, and blocks programmatic/datacenter access
> (verified 403 across every path variant), so a static client cannot reach per-theme high-synergy
> lists. No `edhrecClient.js`, `edhrec-synergy-cache.json`, or build-time EDHREC scraper exists.
>
> What actually happens: the on-theme "high-EDHREC" half is sourced from Scryfall search with
> `order=edhrec` (a **global-popularity proxy**, explicitly *not* theme-specific synergy as §12.1
> warns against). The **reliable, guaranteed functional-theme source is the Scryfall Oracle Tagger**
> via `otag:`/`oracletag:` queries (official, CORS-enabled API) — see `src/lib/themeQueries.js` and
> `scripts/build-scryfall-oracle-tags.mjs`. Build-time EDHREC caching was evaluated and rejected as
> not guaranteed and contrary to the app's online-only, no-offline-cache design. Treat the rest of
> this section as a wishlist, not a description of the code.

### 12.1 Must use EDHREC high-synergy data

The first 12 cards must come from the theme’s EDHREC high-synergy / most-synergistic card list whenever available.

Do not use the EDHREC “top popular” list as a replacement.

Do not use Scryfall `order=edhrec` and pretend it means theme-specific EDHREC synergy.

Important distinction:

```txt
Scryfall order=edhrec = global/card popularity style ordering.
EDHREC theme high synergy = cards that overperform specifically inside that theme.
```

Those are not the same.

### 12.2 If exact EDHREC high-synergy data is unavailable

Codex must be honest.

The app may fall back to Scryfall oracle tags / otags and strict mechanical matching, but the debug log must say this clearly:

```txt
No cached EDHREC high-synergy data found for [theme].
Using Scryfall otag/mechanical fallback instead.
```

Do not silently pretend the fallback is EDHREC high synergy.

### 12.3 EDHREC data adapter

Build a clear adapter:

```ts
getAllEdhrecTags(): Promise<Tag[]>
getSynergyCardsForTag(tag): Promise<CardName[]>
getRelatedSectionsForTag(tag): Promise<RelatedCardGroup[]>
```

Preferred approach:

- fetch/parse EDHREC tags and high-synergy data at build time with Node scripts;
- save static JSON under `public/data`;
- frontend reads JSON only;
- no browser-side scraping during generation.

Why:

- avoids CORS problems;
- avoids slow generation;
- avoids live EDHREC breakage;
- makes logs reproducible;
- makes equality of theme pool testable.

If build-time extraction is blocked, implement a curated JSON starter dataset plus honest fallback logging.

### 12.4 Required split in the 12-card EDHREC core

The 12 EDHREC/high-synergy core cards must include:

```txt
at least 5 creatures
at least 7 non-creature non-land cards
```

This does not mean exactly 5/7 forever if there is a strong reason to exceed one side, but the default required target is:

```txt
5 creatures
7 non-creature non-land spells
```

If a theme is creature typal, still include 7 synergetic non-creature support spells.

If a theme is spell-based, still include at least 5 synergetic creatures or host/payoff bodies.

Examples:

- Thrull must not produce 23 creatures.
- Buyback must not produce 0 creatures.
- Enchant must include creatures or other valid bodies to enchant.
- Equipment must include creatures/payoffs that care about Equipment.
- Vehicles must include creatures/pilots to crew them.
- Saddle/Mount must include enough mounts and bodies.
- Celebration/Mobilize must not become alphabet-soup filler.

### 12.5 EDHREC core fallback hierarchy

If the exact high-synergy list lacks enough cards of the required type, use this order:

1. EDHREC high-synergy cards for exact tag.
2. EDHREC related sections for the same tag.
3. EDHREC cards from closely related tags.
4. Scryfall `otag:` for exact concept.
5. Exact keyword/type/oracle query with word boundaries.
6. Parasitic host/payoff injector for themes that need hosts.
7. Mechanical fingerprint from already selected theme cards.
8. Narrow theme-adjacent fallback.

Never jump straight to random popular cards.

Never use generic goodstuff simply because it matches color.

Never use alphabetically first cards.

## 13. Scryfall 11-card random section

After the 12-card core, pick 11 additional non-land cards from Scryfall.

They must be:

- random within the valid pool;
- from all MTG history;
- related to the chosen theme;
- restricted to chosen colors;
- subject to all filters;
- non-land;
- non-duplicate by `oracle_id`;
- not side-deck/object cards;
- not banned crossover cards.

Use Scryfall `/cards/random` or local random sampling from a fetched result pool. Respect rate limits.

If the exact theme query runs out, fallback to strict synergy support, not unrelated random cards.

## 14. Avoiding bad fallback behavior

The conversation exposed several bad fallback patterns. Codex must explicitly avoid them.

### 14.1 Alphabet soup

Bad examples:

```txt
Abeyance
Accelerate
Acrobatic Maneuver
Adventurer's Airship
Aetherflux Conduit
Aegis of Honor
```

This happened because a query returned default alphabetical results or used the wrong sort parameter.

Fix:

- use correct Scryfall query parameters;
- shuffle a valid pool locally;
- log response order;
- never take page 1 blindly as “synergy.”

### 14.2 Goodstuff drift

Bad examples:

```txt
Smothering Tithe
Ragavan, Nimble Pilferer
Generous Gift
Psychosis Crawler
Rampaging Baloths
```

These appeared because generic words like “token,” “draw,” or “sacrifice” were treated as enough synergy.

Fix:

- do not use generic verbs as primary fallback;
- weight theme-specific subtypes and mechanics higher;
- avoid broad goodstuff;
- use EDHREC high-synergy or exact mechanical relation first.

### 14.3 Random set filler

Bad examples from previous failures:

- Ox decks filled with unrelated recent-set cards.
- Mobilize/Celebration decks filled with random cards after exact cards ran out.

Fix:

- narrow themes should use their support ecology, not random cards from the same set or color;
- if using set context, it must be last-resort and logged, not normal behavior.

## 15. Typal theme rules

Typal themes must be exact.

If the theme is `Mite`, include real Mites and real Mite support.

Do not include:

```txt
Smite
Samite
Elspeth's Smite
```

If the theme is `Myr`, include Myr and Myr support.

Do not include:

```txt
Myriad
Myra-only false positives
```

Implementation:

- for creature cards, use `type:"Mite"` / `type:"Myr"` etc.;
- for non-creature support, use exact word-boundary oracle regex;
- include changelings and “choose a creature type” support when appropriate;
- do not search typal tags as fuzzy keywords;
- classify tag category first, then build category-specific queries.

## 16. Parasitic mechanics and host/payoff rules

Some themes cannot work if all cards are the mechanic itself.

The app must detect parasitic themes and inject hosts/payoffs.

### 16.1 Enchant / Aura / Bestow / Totem Armor

Need:

- Auras/enchantments;
- creatures or valid permanents to enchant;
- enchantress/payoff cards;
- protection/hexproof/modified support when appropriate.

Bad output:

```txt
23 Auras and almost no creatures
```

Good output:

```txt
Auras + enchantment payoffs + enough legal bodies to carry them
```

### 16.2 Equipment / Equip / Reconfigure / Living Weapon / For Mirrodin

Need:

- equipment;
- creatures to equip;
- equipment payoff creatures;
- double strike or modified support where relevant.

### 16.3 Vehicles / Crew

Need:

- vehicles;
- pilots or creatures that can crew;
- vehicle payoff cards.

### 16.4 Saddle / Mount

Need:

- mounts;
- creatures that support saddle/mount gameplay;
- non-creature support if available.

### 16.5 Mutate

Need:

- mutate cards;
- legal non-Human host creatures;
- mutate payoffs.

### 16.6 Ninjutsu / Prowl / Cipher / Spectacle / Bloodthirst

Need enablers:

- evasion;
- combat damage support;
- unblockable/flying/menace/skulk style cards;
- small creatures if relevant.

### 16.7 Buyback / spell mechanics

A spell mechanic like Buyback must not produce zero creatures. It needs:

- cost reducers;
- spell payoff creatures;
- mana engines;
- recursion/value creatures if synergistic.

## 17. Color-picking engine

This is one of the most important parts.

The app must choose deck colors before final card selection is locked.

### 17.1 Analyze the theme pool

After selecting a theme:

1. Fetch/build the valid theme-related card pool.
2. Apply hard legality filters.
3. Count color identity frequency across that pool.
4. Include color identity from:
   - mana cost;
   - all card faces;
   - activated abilities;
   - triggered ability costs;
   - back faces where relevant;
   - oracle text mana symbols.

Do not only count the 23 drafted cards for color choice. The color decision should come from the broader theme pool first.

### 17.2 Dominant color rule

Let:

```txt
maxColorCount = highest color count
threshold = maxColorCount * 0.60
```

A color is dominant if:

```txt
colorCount >= threshold
```

Rules:

```txt
1 dominant color -> mono-color deck
2 dominant colors -> two-color deck
3 dominant colors -> three-color deck
4 dominant colors -> randomly pick exactly 2 of those dominant colors
5 dominant colors -> randomly pick exactly 2 of those dominant colors
all colors equal -> randomly pick exactly 2
```

### 17.3 Multicolor exception

If the theme has meaningful multicolored cards in costs, abilities, or color identity:

```txt
50% of the time:
  force the deck into the most common meaningful multicolor identity for that theme
50% of the time:
  use the normal dominance system
```

This must be logged.

Do not force multicolor just because there are four multicolored cards somewhere in the pool. Define a reasonable threshold, test it, and log it.

### 17.4 Not-enough-cards exception

If the chosen colors do not leave enough cards to build a coherent 23-card deck, the app may expand colors.

But this must be deliberate and logged.

Correct log example:

```txt
Color expansion triggered:
Theme: Ox
Original colors: GW
Valid cards after color lock: 14
Needed: 23
Expanded to: WBG
Reason: exact theme + high-synergy support could not reach 23.
```

Do not silently jump to WUBRG.

### 17.5 Never accidental five-color

The previous Gemini code could accidentally become WUBRG because a fallback panicked when a small pool had fewer than 23 cards.

That must not happen.

Once colors are locked:

- all card queries must use the locked color identity;
- all fallback must respect locked colors unless explicit color expansion occurs;
- expansion must be logged.

### 17.6 Color log requirements

Debug log must include:

```txt
Theme pool color counts
Dominance threshold
Dominant colors
Whether equal-color case happened
Whether multicolor exception triggered
Whether color expansion triggered
Final chosen deck colors
```

## 18. Mana value / curve calculation

Use a tested helper.

Do not rely only on Scryfall’s `cmc`.

### 18.1 X spells

If a card has `{X}` in its mana cost:

```txt
treat X as 4
```

If a card has an activated ability or relevant ability cost with `{X}`:

```txt
add X=4 weight to that card's mana needs
```

This should increase the average mana value enough to add more lands.

### 18.2 Split, fuse, adventure, aftermath, MDFC, flip cards

User requirement:

For two-sided, split, fuse, adventure, and similar cards where multiple parts can be played, treat the playable parts separately for curve calculation.

Implementation recommendation:

- create virtual castable entries for each playable face/part;
- do not double-count the physical card in the deck count;
- for average mana value, calculate based on the virtual spell entries;
- if one face is a land, do not count the land face as a spell cost;
- log how many virtual castable entries were used.

Examples to test:

```txt
Fire // Ice
adventure creature cards
modal DFC spell/land cards
aftermath cards
fuse cards
```

### 18.3 Mana symbols / pips

Count pips from:

- mana costs;
- all playable faces;
- activated abilities;
- triggered ability costs;
- oracle text;
- hybrid symbols;
- Phyrexian symbols;
- snow symbols.

Hybrid mana should influence all possible colors without wildly double-counting.

Implement this carefully in `manaPips.js` with tests.

### 18.4 Snow

If any selected non-land card requires snow mana `{S}` in cost or ability:

```txt
30% of basic lands become snow-covered basics
round up
```

If colorless and snow is required:

```txt
use Snow-Covered Wastes if available/valid
```

Otherwise use normal Wastes.

## 19. Land count

After selecting the 23 non-land cards, calculate total lands.

Range:

```txt
15 to 25 lands
```

Light low-curve decks should get closer to 15.  
Heavy high-curve decks should get closer to 25.  
Typical midrange decks should get around 20-22.

Use a configurable formula and tests.

Log:

```txt
Average mana value
Virtual curve entries
Final land count
Reason for land count
```

## 20. Mana base split

Lands must be:

```txt
50% basics
50% non-basics
```

If odd total:

```txt
one extra basic is acceptable
```

Example:

```txt
21 lands -> 11 basics + 10 non-basics
22 lands -> 11 basics + 11 non-basics
```

## 21. Basic land allocation

Basics must follow color pip distribution.

Inputs:

- color pips from mana costs;
- pips from activated abilities;
- pips from triggered ability costs;
- pips from playable card faces;
- snow requirements.

If colorless:

```txt
use Wastes
```

If no pips but colors exist:

```txt
split basics evenly across chosen deck colors
```

Use random basic art for every basic land slot.

Do not accidentally fetch Snow-Covered Mountain when the request is specifically Mountain unless snow conversion requires it.

## 22. Non-basic lands

The non-basic half should be:

```txt
at least 30% theme-synergistic if possible
the rest random compatible non-basics
```

“Compatible” means:

- can support the chosen deck colors;
- does not violate card filters;
- is not Commander-only;
- is not off-color in a useless way;
- not side-deck/Planechase/etc.;
- not duplicate of a card already selected as a spell MDFC.

The rest can include:

- colorless utility lands;
- one-color lands;
- dual lands;
- tri lands;
- lands that produce any/all colors, if legal and not banned;
- MDFC lands if not already used as non-land cards.

### 22.1 Theme-synergistic non-basics

Try to find lands related to the theme.

Examples:

```txt
Sliver Hive for Slivers
Karn's Bastion for Proliferate/Counters
Rogue's Passage for evasion/unblockable themes
Gods' Eye, Gate to the Reikai for God-related decks if valid
```

If none exist, log:

```txt
No theme-synergistic non-basic lands found.
Filled those slots with compatible random non-basics instead.
```

### 22.2 Fetchland rule

Fetchlands must be at least partially useful for chosen colors.

Examples:

```txt
Mono-blue:
  Polluted Delta allowed because it can fetch Island
  Wooded Foothills banned because it fetches Mountain/Forest only

White-black:
  Marsh Flats allowed
  Scalding Tarn banned
```

Implementation:

- detect fetchlands by oracle text such as “search your library for a [land type] card”;
- parse basic land types mentioned;
- require intersection with chosen color basic land types;
- allow generic “basic land card” fetches such as Evolving Wilds / Terramorphic Expanse if otherwise valid.

## 23. Export format

Copy decklist as plain text.

One line per card group.

Examples:

```txt
1 Wild Growth
1 Mirrorhall Mimic // Ghastly Mimicry
1 Forest (BLB) 378
1 Island (AKH) 258
1 Snow-Covered Swamp (KHM) 280
```

For spells and non-basic lands:

```txt
1 Card Name
```

For basics:

```txt
1 Basic Name (SET) COLLECTOR_NUMBER
```

If identical basic art repeats, it can be grouped:

```txt
2 Plains (HOU) 191
```

But random basic art should usually create varied lines.

Strip `A-` prefixes on export as final safety, but the card should have been excluded earlier.

## 24. Debug log requirements

Add a full copyable debug log.

Button:

```txt
Copy whole log
```

The log should include:

- timestamp;
- app version;
- random seed if implemented;
- full candidate theme count;
- banned theme count;
- selected theme;
- theme category;
- whether theme was from EDHREC, Scryfall catalog, hardcoded list, or multiple;
- exact EDHREC data source;
- exact Scryfall queries;
- API response status codes;
- API result counts;
- retry attempts;
- rejection reasons;
- color counts;
- color threshold;
- final colors;
- multicolor exception result;
- color expansion result;
- selected 12 core cards with source/reason;
- selected 11 random/fallback cards with source/reason;
- parasitic host injection decisions;
- mana value calculation;
- virtual castable entries;
- pip counts;
- snow decision;
- basic land allocation;
- non-basic land allocation;
- fetchland validation;
- final deck counts;
- errors.

Example log style:

```txt
[16:31:39] START v2.0
[16:31:41] Candidate themes after dedupe/bans: 742
[16:31:41] Selected theme: Incubate / keyword / source: Scryfall+hardcoded
[16:31:42] Theme pool valid cards: 33
[16:31:42] Color counts: W=14 B=10 G=7 U=2 R=2
[16:31:42] Dominance threshold: 8.4
[16:31:42] Dominant colors: W,B
[16:31:42] Final chosen colors: WB
[16:31:43] EDHREC high-synergy cache found: yes
[16:31:43] Core card added: Sculpted Perfection / source: EDHREC high synergy / reason: non-creature support
...
```

Do not hide errors with empty `catch {}` blocks.

Every caught error should log enough detail.

## 25. Scryfall client requirements

All Scryfall API calls must go through:

```txt
src/lib/scryfallClient.js
```

Requirements:

- minimum 500ms delay between requests;
- retry 429 and 5xx with backoff;
- log endpoint/query/status;
- cache repeated queries during one generation;
- no silent failures;
- typed errors.

Scryfall endpoints likely needed:

```txt
/cards/search
/cards/random
/cards/named
/catalog/keyword-abilities
/catalog/keyword-actions or available mechanic catalogs
/catalog/keyword-mechanics
/catalog/creature-types
/sets
```

Check the current Scryfall docs while implementing.

## 26. Important Scryfall query notes

Known issue from the conversation:

```txt
sort=edhrec
```

is wrong for Scryfall API search ordering.

Use:

```txt
order=edhrec
```

But remember:

```txt
order=edhrec is not EDHREC theme-page high synergy.
```

Use exact regex for word boundaries when searching oracle text:

```txt
oracle:/\bMite\b/i
```

But also URL-encode properly.

Use category-specific search:

```txt
type:"Myr"
keyword:"Buyback"
otag:"Aristocrats"
```

Do not use a single fuzzy query for every category.

## 27. Internal validation helpers

Create tested helpers.

### 27.1 `isPlayableMainDeckCard(card)`

Must reject:

- tokens;
- emblems;
- dungeons;
- bounties;
- sticker sheets;
- attractions;
- contraptions;
- schemes;
- vanguards;
- conspiracies;
- phenomena;
- plane cards;
- art series;
- playtest/memorabilia;
- digital-only;
- commander-only;
- side-deck dependency cards;
- banned crossover sets.

### 27.2 `isCreature(card)`

Must correctly detect creatures even on MDFCs/adventures when appropriate.

Do not rely only on raw `type_line.includes("Creature")` everywhere.

### 27.3 `isLand(card)`

Must correctly detect lands and MDFC land faces.

### 27.4 `isBasicLand(card)`

Must handle:

```txt
Plains
Island
Swamp
Mountain
Forest
Wastes
Snow-Covered Plains
Snow-Covered Island
Snow-Covered Swamp
Snow-Covered Mountain
Snow-Covered Forest
Snow-Covered Wastes if valid
```

### 27.5 `sameCard(a,b)`

Use `oracle_id` for singleton identity where possible.

For basics, duplicates are allowed.

For different printings of the same non-basic/spell, duplicates are not allowed.

## 28. Known bad examples from the Gemini conversation

Use these as regression tests.

### 28.1 Myr bug

Theme:

```txt
Myr
```

Bad cards:

```txt
Banshee of the Dread Choir
Dalek Squadron
Myriad-related cards
Ignacio of Myra's Marvels
```

Reason:

```txt
Myr got confused with Myriad/Myra.
```

### 28.2 Mite bug

Theme:

```txt
Mite
```

Bad cards:

```txt
Smite the Deathless
Elspeth's Smite
Oriss, Samite Guardian
```

Reason:

```txt
Substring matching.
```

### 28.3 Saddle/Mole/Ox narrow-theme bugs

Problem:

```txt
Theme had too few exact cards.
Old app either stopped early or filled randomly.
```

Correct:

```txt
Use high-synergy support, changelings, "choose a creature type", exact mechanical relation, or logged color expansion.
```

### 28.4 Serpent/Mole missing lands bug

Problem:

```txt
Deck generated non-lands but no lands.
```

Correct:

```txt
Land generation must always complete or use valid fallback basics/non-basics.
```

### 28.5 Buyback zero-creatures bug

Problem:

```txt
Buyback produced all spells and no creatures.
```

Correct:

```txt
Spell-based themes need synergistic creatures/payoff bodies.
```

### 28.6 Enchant no-host bug

Problem:

```txt
Enchant produced many Auras and not enough things to enchant.
```

Correct:

```txt
Inject host creatures/payoffs.
```

### 28.7 Celebration/Mobilize alphabet soup

Bad examples:

```txt
Abeyance
Accelerate
Acrobatic Maneuver
Aegis of Honor
Aetherflux Conduit
```

Correct:

```txt
No default alphabetical page grabbing.
```

### 28.8 Dungeon bug

Bad card:

```txt
Dungeon of the Mad Mage
```

Correct:

```txt
Cards that venture into dungeon can be allowed if otherwise valid.
Dungeon object cards cannot be included.
```

### 28.9 Ferris Wheel bug

Bad card:

```txt
Ferris Wheel
```

Reason:

```txt
It depends on Attractions/external Un-set side mechanics.
```

Correct:

```txt
Reject cards that require attractions/stickers/contraptions/side decks.
```

### 28.10 Avatar/UB bug

Bad card:

```txt
Aang, at the Crossroads // Aang, Destined Savior
```

Correct:

```txt
Avatar set family banned.
```

### 28.11 Incubate five-color bug

Problem:

```txt
Incubate became WUBRG even though color dominance should have kept it focused.
```

Correct:

```txt
No panic expansion to all colors unless explicit logged exception.
```

### 28.12 Command Tower bug

Bad card:

```txt
Command Tower
```

Correct:

```txt
Commander-only lands/cards banned.
```

### 28.13 Playtest / weird blank cards

Bad cards:

```txt
17-Year Cicadas
More of That Strange Oil...
Ate-o'-Clock
```

Correct:

```txt
Reject playtest/memorabilia/sticker-style broken data, while still allowing standalone Un-set/acorn cards.
```

## 29. Requirements superseded by later user messages

These were asked earlier but later changed.

### 29.1 Old 10/13 split

Old:

```txt
10 EDHREC cards + 13 Scryfall cards
```

Current:

```txt
12 EDHREC high-synergy core cards + 11 Scryfall all-time cards
```

### 29.2 Old dependency insertion

Old:

```txt
If a card names another specific card, add that card.
```

Current:

```txt
No dependency insertion.
```

### 29.3 Old 60/40 land split

Old:

```txt
60% basics, 40% non-basics
```

Current:

```txt
50% basics, 50% non-basics
```

### 29.4 Old draft mode

Old:

```txt
draft mode / forge mode variants
```

Current:

```txt
theme mode only
one-button app
```

### 29.5 Old token/dependency side functionality

Old:

```txt
token/dependency related features
```

Current:

```txt
no token sideboard
no generated token cards
no dependency cards
```

## 30. Tests Codex must add

Use Vitest.

### 30.1 Theme pool tests

- EDHREC tags are included.
- Scryfall catalog keywords/types are included.
- hardcoded keywords are included.
- banned themes are removed.
- duplicates are normalized away.
- final random pick is uniform across final list.
- small themes are not removed only because they are small.

### 30.2 Filter tests

Must reject:

```txt
Command Tower
Dungeon of the Mad Mage
Ferris Wheel
17-Year Cicadas
Ate-o'-Clock
Jarsyl, Dark Age Scion
Aang, at the Crossroads
Doctor Who cards
Fallout cards
Warhammer 40k cards
Transformers cards
Spider-Man cards
Avatar cards
```

Must allow if otherwise valid:

```txt
LOTR cards
Final Fantasy cards
D&D cards
standalone Un-set/acorn cards
normal Planeswalkers
cards that venture into dungeon, but are not dungeons themselves
```

### 30.3 Color engine tests

Use fake card pools.

Test:

```txt
W dominant -> W
W/B dominant -> WB
W/B/G dominant -> WBG
W/U/B/R dominant -> random exactly two among those four
all five equal -> random exactly two
multicolor-heavy -> 50% forced multicolor over seeded repeated trials
small-pool exception logs expansion
no accidental WUBRG
```

### 30.4 Typal tests

Theme `Mite`:

Must include real Mite support.  
Must not include Smite/Samite false positives.

Theme `Myr`:

Must include Myr.  
Must not include Myriad/Myra false positives.

### 30.5 Parasitic tests

Theme `Enchant`:

- must include enchantments/Auras;
- must include legal hosts/payoffs.

Theme `Equipment`:

- must include equipment;
- must include creatures/payoffs.

Theme `Vehicle`:

- must include vehicles;
- must include pilots/crew support.

Theme `Buyback`:

- must include some creatures/payoffs;
- not 0 creatures.

### 30.6 Mana value tests

Test:

- X in cost counts as 4.
- X in activated ability adds mana pressure.
- split/fuse/adventure/MDFC playable parts handled correctly.
- MDFC land face is not counted as a spell.
- hybrid pips affect possible colors.
- snow symbol triggers snow basics.

### 30.7 Mana base tests

Test:

- lands count is always 15-25.
- basics/non-basics split is 50/50.
- basics follow pip distribution.
- snow costs convert 30% of basics.
- non-basics never missing.
- at least 30% theme non-basics if available.
- off-color fetchlands rejected.
- no duplicate non-basic/spell oracle IDs.
- random basic art varies.

### 30.8 Export tests

- exactly 23 non-land cards.
- 15-25 lands.
- basics export with set and collector number.
- split cards export correctly.
- A- prefix stripped as final safety.
- debug log copies.

### 30.9 Build/deploy tests

- `npm run test` passes.
- `npm run build` passes.
- app works with Vite base `/mtg-deck-generator/`.
- no white screen on GitHub Pages.
- first screen only button.

## 31. Manual acceptance checklist

Before merging, generate at least 100 decks.

Check:

```txt
No white screens
No missing lands
No blank card objects
No banned side-deck cards
No Commander-only cards
No banned crossover cards
No random alphabet soup
No random goodstuff drift
No accidental WUBRG
Narrow tags still build decks
Parasitic themes are playable
Export works
Debug log explains every major choice
```

Specific themes to force-test manually:

```txt
Mite
Myr
Ox
Mole
Saddle
Celebration
Mobilize
Enchant
Auras
Buyback
Incubate
Serpent
Thrull
God
Hexproof from
Vehicles
Equipment
Mutate
```

## 32. Deployment workflow

Add:

```txt
.github/workflows/deploy.yml
```

Recommended workflow:

```yml
name: Deploy static content to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Test
        run: npm run test -- --run
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: "./dist"
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

If the exact version numbers for actions are unavailable, use currently valid GitHub Pages actions.

## 33. README requirements

README should include:

- what the app does;
- how to run locally;
- how to test;
- how to deploy;
- known limitations;
- explanation that EDHREC high-synergy data is cached or falls back honestly;
- troubleshooting: use Copy Debug Log.

## 34. Codex implementation order

Do this in stages.

### Stage 1: Scaffold

- Create Vite React app.
- Add GitHub Pages base.
- Add workflow.
- Add README.
- Add test setup.

### Stage 2: Core clients and filters

- Scryfall client with queue/backoff.
- Sets metadata checker.
- Card validation/filter helpers.
- Crossover policy tests.
- Basic UI button.

### Stage 3: Theme pool

- EDHREC tag adapter or static cache.
- Scryfall catalog adapter.
- hardcoded keyword safety list.
- dedupe/bans/uniform random tests.

### Stage 4: Color engine

- Dominance rule.
- multicolor exception.
- color expansion exception.
- logs and tests.

### Stage 5: Card selection

- 12-card EDHREC high-synergy core.
- 7 non-creature / 5 creature target.
- parasitic host injector.
- 11 Scryfall random theme cards.
- fallback hierarchy.
- no goodstuff drift tests.

### Stage 6: Mana base

- mana value helpers.
- pip helpers.
- snow basics.
- basic allocation.
- non-basic allocation.
- fetchland guardrail.

### Stage 7: UI and logging

- progress bar with jokes.
- card grids.
- export decklist.
- copy log.
- error display.

### Stage 8: Regression testing

- forced-theme test mode for development only.
- generate 100 decks.
- fix failures.
- remove/hide forced-theme UI from production unless behind dev flag.

## 35. Copy-paste prompt for Codex

Use this as the first Codex message:

```txt
Build this app from scratch in this empty repo:

https://github.com/Share1352/mtg-deck-generator

Use the attached revised handover document as the source of truth.

Do not paste the Gemini prototype directly as production code. Put it in reference/gemini-latest.jsx only if useful.

Build a clean Vite + React app with modular logic under src/lib and UI under src/components. Add Vitest tests. Add GitHub Pages deployment. Set Vite base to /mtg-deck-generator/.

The app is a one-button MTG Theme Deck Generator for casual 1v1 play, not Commander.

Before generation, show only one FORGE DECK button.

Generate exactly:
- 23 non-land cards
- 15-25 lands

Use:
- equal-chance theme selection from EDHREC tags, Scryfall catalogs, and a hardcoded MTG keyword/mechanic safety list;
- no automatic rejection of obscure/small themes just because they are small;
- 12 EDHREC high-synergy core cards where available, targeting 7 non-creature non-land spells and 5 creatures;
- 11 random all-time Scryfall cards related to the selected theme and chosen colors;
- strict card/category filters;
- exact typal matching;
- parasitic mechanic host/payoff injection;
- dominant-color selection rules from the handover;
- 50/50 basic/non-basic mana base with expert pip/ability/snow/fetchland handling;
- random basic land arts;
- exportable decklist;
- copyable full debug log.

If exact EDHREC high-synergy extraction is blocked, log it honestly and use the defined Scryfall otag/mechanical fallback. Do not pretend Scryfall order=edhrec is the same as EDHREC theme-page high synergy.

Run and fix:
npm install
npm run test
npm run build
npm run preview

Do not consider the task complete until tests pass and the app can generate many decks without white screen, missing lands, banned cards, or accidental five-color drift.
```

## 36. Final quality bar

The app is done only when:

- it deploys publicly;
- it opens without a white screen;
- the first page is only one button;
- generation completes reliably;
- every final deck has 23 non-land cards;
- every final deck has 15-25 lands;
- logs explain why cards/colors/lands were selected;
- obscure tags still have equal chance;
- banned card categories stay out;
- allowed Un-set/acorn cards can appear if valid;
- allowed LOTR/Final Fantasy/D&D cards can appear;
- banned Avatar/Fallout/Doctor Who/Warhammer/Transformers/Spider-Man cards cannot appear;
- color picking follows the dominance rules;
- fallback cards are actually synergetic, not alphabet soup or generic goodstuff;
- parastic themes produce playable decks;
- export and debug-log copy buttons work.
