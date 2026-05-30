# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | OK ✅ |
| Generated | 2026-05-30T13:07:22.221Z |
| Commit | `5df316343e7faf00a514aff2b8b16f914b1d6d52` |
| Theme | Counterspell Automatic |
| Colors | U |
| Counts | nonlands=23 lands=22 total=45 |
| Seed | 1780146442221 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26684580668 |

## Deck list

```
1 Kira, Great Glass-Spinner
1 Cephalid Shrine
1 Jace, Unraveler of Secrets
1 Ice Cave
1 Bazaar of Wonders
1 Lunar Force
1 Swindler's Scheme
1 Void Mirror
1 Ambiguity
1 Jin-Gitaxias, Progress Tyrant
1 Chalice of the Void
1 Vexing Bauble
1 Jetting Glasskite
1 Nullstone Gargoyle
1 Unctus, Grand Metatect
1 Ruin Crab
1 Mesmeric Orb
1 Smuggler's Copter
1 Kozilek, the Great Distortion
1 Three Steps Ahead
1 Library of Leng
1 Bag of Holding
1 The Millennium Calendar
1 Urza's Mine
1 Urza's Tower
1 Urborg, Tomb of Yawgmoth
1 Wasteland
1 Tomb of the Spirit Dragon
1 Dark Depths
1 Secluded Courtyard
1 Urza's Power Plant
1 Valgavoth's Lair
1 Plaza of Heroes
1 Misty Rainforest
2 Island (S99) 159
4 Island (S99) 160
3 Island (S99) 158
1 Wastes (SLD) 706
1 Wastes (CMM) 1056
```

## Full generation log

```
[13:07:22] START v2.0.0 seed=1780146442221
[13:07:22] Scryfall request /catalog/keyword-abilities 
[13:07:22] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[13:07:22] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[13:07:22] Scryfall catalog keyword-abilities: 218 entries
[13:07:22] Scryfall request /catalog/keyword-actions 
[13:07:22] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[13:07:22] Scryfall catalog keyword-actions: 73 entries
[13:07:22] Scryfall request /catalog/ability-words 
[13:07:22] Scryfall /catalog/ability-words status=200 attempt=1/8
[13:07:22] Scryfall catalog ability-words: 70 entries
[13:07:22] Scryfall request /catalog/creature-types 
[13:07:22] Scryfall /catalog/creature-types status=200 attempt=1/8
[13:07:22] Scryfall catalog creature-types: 329 entries
[13:07:22] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[13:07:22] Loaded 32 color-combination themes.
[13:07:22] Candidate themes after dedupe/bans: 5843
[13:07:22] Banned theme count: 42
[13:07:22] Attempt 1: selected theme: Lammasu / typal / source: Scryfall creature-types
[13:07:22] Scryfall request /cards/search q=%28type%3A%22Lammasu%22+OR+oracle%3A%2F%5CbLammasu%5Cb%2Fi+OR+oracle%3A%2F%5CbLammasus%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:23] Scryfall /cards/search status=200 attempt=1/8
[13:07:23] Scryfall search count=3 q=(type:"Lammasu" OR oracle:/\bLammasu\b/i OR oracle:/\bLammasus\b/i) game:paper lang:en
[13:07:23] ERROR generation attempt 1: Theme Lammasu rejected: only 3 direct theme cards found; minimum is 10.
[13:07:23] Rerolled theme "Lammasu" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Lammasu rejected: only 3 direct theme cards found; minimum is 10.
[13:07:23] Attempt 2: selected theme: Cycle Eld U Adamant Spell / tagger / source: Scryfall Oracle Tagger
[13:07:23] Scryfall request /cards/search q=otag%3A%22cycle-eld-u-adamant-spell%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:23] Scryfall /cards/search status=200 attempt=1/8
[13:07:23] Scryfall search count=5 q=otag:"cycle-eld-u-adamant-spell" game:paper lang:en
[13:07:23] ERROR generation attempt 2: Theme Cycle Eld U Adamant Spell rejected: only 5 direct theme cards found; minimum is 10.
[13:07:23] Rerolled theme "Cycle Eld U Adamant Spell" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Cycle Eld U Adamant Spell rejected: only 5 direct theme cards found; minimum is 10.
[13:07:23] Attempt 3: selected theme: Counterspell Automatic / tagger / source: Scryfall Oracle Tagger
[13:07:23] Scryfall request /cards/search q=otag%3A%22counterspell-automatic%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:23] Scryfall /cards/search status=200 attempt=1/8
[13:07:23] Scryfall search count=33 q=otag:"counterspell-automatic" game:paper lang:en
[13:07:23] Theme pool valid cards: 32
[13:07:23] Theme pool color counts: W=5 U=21 B=1 R=2 G=0
[13:07:23] Dominance threshold: 12.6
[13:07:23] Dominant colors: U
[13:07:23] Equal-color case: no
[13:07:23] Multicolor exception: not triggered
[13:07:23] Final chosen deck colors: U
[13:07:23] Scryfall request /cards/search q=otag%3A%22counterspell-automatic%22+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:24] Scryfall /cards/search status=200 attempt=1/8
[13:07:24] Scryfall search count=25 q=otag:"counterspell-automatic" id<=U game:paper lang:en
[13:07:24] On-theme (high EDHREC) card added: Kira, Great Glass-Spinner / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Cephalid Shrine / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Jace, Unraveler of Secrets / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Ice Cave / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Bazaar of Wonders / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Lunar Force / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] On-theme (high EDHREC) card added: Swindler's Scheme / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:07:24] Scryfall request /cards/search q=otag%3A%22counterspell-automatic%22+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[13:07:24] Scryfall /cards/search status=200 attempt=1/8
[13:07:24] Scryfall search count=25 q=otag:"counterspell-automatic" id<=U game:paper lang:en
[13:07:24] On-theme (random all-time) card added: Void Mirror / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Ambiguity / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Jin-Gitaxias, Progress Tyrant / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Chalice of the Void / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Vexing Bauble / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Jetting Glasskite / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme (random all-time) card added: Nullstone Gargoyle / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:07:24] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[13:07:24] Support archetype: keyword (3 tiers)
[13:07:24] Inferred support needs from selected theme cards: graveyard fuel, counter support, noncreature spell density, token density
[13:07:24] Scryfall request /cards/search q=%28otag%3Aself-mill+OR+oracle%3A%22mill%22+OR+oracle%3A%22discard+a+card%22+OR+oracle%3A%22discard+your+hand%22%29+-type%3Aland+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:25] Scryfall /cards/search status=200 attempt=1/8
[13:07:25] Scryfall search count=175 q=(otag:self-mill OR oracle:"mill" OR oracle:"discard a card" OR oracle:"discard your hand") -type:land id<=U game:paper lang:en
[13:07:25] Support card added: Unctus, Grand Metatect / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Ruin Crab / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Mesmeric Orb / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Smuggler's Copter / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Kozilek, the Great Distortion / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Three Steps Ahead / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Library of Leng / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: Bag of Holding / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Support card added: The Millennium Calendar / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[13:07:25] Synergy validation passed after 0 repair pass(es).
[13:07:25] Final non-land split: theme=14 support=9 creatures=7
[13:07:25] Average mana value: 3.80
[13:07:25] Virtual curve entries: 23
[13:07:25] Final land count: 22. Reason: 15 + average mana value 3.80 * 1.8, clamped to 15-25
[13:07:25] Pip counts: {"W":0,"U":23.400000000000006,"B":0,"R":0,"G":0} snowRequired=false snowMatters=false colorlessNeed=true
[13:07:25] Injected 2x Wastes so colorless {C} costs are always castable.
[13:07:25] Basic land allocation: Island, Island, Island, Island, Island, Island, Island, Island, Island, Wastes, Wastes
[13:07:25] Scryfall request /cards/search q=%21%22Island%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[13:07:25] Scryfall /cards/search status=200 attempt=1/8
[13:07:25] Scryfall /cards/search:page status=200 attempt=1/8
[13:07:25] Scryfall search count=350 q=!"Island" include:extras unique:prints lang:en
[13:07:25] Scryfall request /cards/search q=%21%22Wastes%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[13:07:25] Scryfall /cards/search status=200 attempt=1/8
[13:07:25] Scryfall search count=18 q=!"Wastes" include:extras unique:prints lang:en
[13:07:25] Random basic-land art set: S99
[13:07:25] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22counterspell+automatic%22+OR+oracle%3A%2F%5CbCounterspell+Automatic%5Cb%2Fi+OR+type%3A%22Counterspell+Automatic%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:25] Scryfall /cards/search status=404 attempt=1/8
[13:07:25] Scryfall search returned no matches for q=(type:land (otag:"counterspell automatic" OR oracle:/\bCounterspell Automatic\b/i OR type:"Counterspell Automatic")) type:land -type:basic id<=U game:paper lang:en
[13:07:25] Theme-related nonbasic lands found: 0
[13:07:25] Not enough theme non-basic lands; filling with compatible non-basics.
[13:07:25] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:07:27] Scryfall /cards/search status=200 attempt=1/8
[13:07:27] Scryfall search count=175 q=type:land -type:basic id<=U game:paper lang:en
[13:07:27] Scryfall request /cards/named exact=Urza%27s+Mine
[13:07:27] Scryfall /cards/named status=200 attempt=1/8
[13:07:27] Land synergy: added Urza's Mine required by Urza's Power Plant.
[13:07:27] Scryfall request /cards/named exact=Urza%27s+Tower
[13:07:27] Scryfall /cards/named status=200 attempt=1/8
[13:07:27] Land synergy: added Urza's Tower required by Urza's Power Plant.
[13:07:27] Scryfall request /cards/search q=%21%22Urborg%2C+Tomb+of+Yawgmoth%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[13:07:27] Scryfall /cards/search status=200 attempt=1/8
[13:07:27] Scryfall search count=10 q=!"Urborg, Tomb of Yawgmoth" unique:prints game:paper lang:en
[13:07:27] Alt art rolled for Urborg, Tomb of Yawgmoth: M15 248
[13:07:27] Scryfall request /cards/search q=%21%22Wasteland%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[13:07:27] Scryfall /cards/search status=200 attempt=1/8
[13:07:27] Scryfall search count=16 q=!"Wasteland" unique:prints game:paper lang:en
[13:07:27] Alt art rolled for Wasteland: ZNE 30
[13:07:27] Scryfall request /cards/search q=%21%22Secluded+Courtyard%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[13:07:27] Scryfall /cards/search status=200 attempt=1/8
[13:07:27] Scryfall search count=9 q=!"Secluded Courtyard" unique:prints game:paper lang:en
[13:07:27] Alt art rolled for Secluded Courtyard: ECC 62
[13:07:27] Non-basic land allocation: Urza's Mine, Urza's Tower, Urborg, Tomb of Yawgmoth, Wasteland, Tomb of the Spirit Dragon, Dark Depths, Secluded Courtyard, Urza's Power Plant, Valgavoth's Lair, Plaza of Heroes, Misty Rainforest
[13:07:27] Final whole-deck synergy check: 2 unresolved synergy issue(s) (non-fatal): Urza's Mine directly references missing card Urza's Power-Plant; Urza's Tower directly references missing card Urza's Power-Plant
[13:07:27] Final deck counts: nonlands=23 lands=22 total=45
```
