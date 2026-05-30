# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | OK ✅ |
| Generated | 2026-05-30T12:31:00.438Z |
| Commit | `030ba8d99444378cfa334fe911fec4b996d7166b` |
| Theme | Djinn |
| Colors | U |
| Counts | nonlands=23 lands=22 total=45 |
| Seed | 1780144260438 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26683840557 |

## Deck list

```
1 Mistfire Weaver
1 Skywise Teachings
1 Cloud Djinn
1 Dirgur Focusmage // Braingeyser
1 Serendib Djinn
1 Djinni Windseer
1 Riverwheel Aerialists
1 Djinn of Fool's Fall
1 Waterspout Djinn
1 Tidespout Tyrant
1 Bottle of Suleiman
1 Zanam Djinn
1 Tester of the Tangential
1 Djinn of the Lamp
1 Herald's Horn
1 Mana Vault
1 Arcane Denial
1 Flusterstorm
1 Preordain
1 Sol Ring
1 The Ozolith
1 Frantic Search
1 Ponder
1 Conduit Pylons
1 Demolition Field
1 Prismatic Vista
1 Tarnished Citadel
1 Tyrite Sanctum
1 Geier Reach Sanitarium
1 Uncharted Haven
1 Terrain Generator
1 Brokers Hideout
1 Horizon of Progress
1 Talon Gates of Madara
9 Island (PAL01) 3
1 Wastes (SLD) 706
1 Wastes (J22) 834
```

## Full generation log

```
[12:31:00] START v2.0.0 seed=1780144260438
[12:31:00] Scryfall request /catalog/keyword-abilities 
[12:31:00] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[12:31:00] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[12:31:00] Scryfall catalog keyword-abilities: 218 entries
[12:31:00] Scryfall request /catalog/keyword-actions 
[12:31:00] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[12:31:00] Scryfall catalog keyword-actions: 73 entries
[12:31:00] Scryfall request /catalog/ability-words 
[12:31:00] Scryfall /catalog/ability-words status=200 attempt=1/8
[12:31:00] Scryfall catalog ability-words: 70 entries
[12:31:00] Scryfall request /catalog/creature-types 
[12:31:00] Scryfall /catalog/creature-types status=200 attempt=1/8
[12:31:00] Scryfall catalog creature-types: 329 entries
[12:31:00] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[12:31:00] Loaded 32 color-combination themes.
[12:31:00] Candidate themes after dedupe/bans: 5843
[12:31:00] Banned theme count: 42
[12:31:00] Attempt 1: selected theme: Gnoll / typal / source: Scryfall creature-types
[12:31:00] Scryfall request /cards/search q=%28type%3A%22Gnoll%22+OR+oracle%3A%2F%5CbGnoll%5Cb%2Fi+OR+oracle%3A%2F%5CbGnolls%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:01] Scryfall /cards/search status=200 attempt=1/8
[12:31:01] Scryfall search count=3 q=(type:"Gnoll" OR oracle:/\bGnoll\b/i OR oracle:/\bGnolls\b/i) game:paper lang:en
[12:31:01] ERROR generation attempt 1: Theme Gnoll rejected: only 2 direct theme cards found; minimum is 10.
[12:31:01] Rerolled theme "Gnoll" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Gnoll rejected: only 2 direct theme cards found; minimum is 10.
[12:31:01] Attempt 2: selected theme: Djinn / typal / source: Scryfall creature-types
[12:31:01] Scryfall request /cards/search q=%28type%3A%22Djinn%22+OR+oracle%3A%2F%5CbDjinn%5Cb%2Fi+OR+oracle%3A%2F%5CbDjinns%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:02] Scryfall /cards/search status=200 attempt=1/8
[12:31:02] Scryfall search count=76 q=(type:"Djinn" OR oracle:/\bDjinn\b/i OR oracle:/\bDjinns\b/i) game:paper lang:en
[12:31:02] Theme pool valid cards: 73
[12:31:02] Theme pool color counts: W=11 U=52 B=7 R=21 G=4
[12:31:02] Dominance threshold: 31.2
[12:31:02] Dominant colors: U
[12:31:02] Equal-color case: no
[12:31:02] Multicolor exception: not triggered
[12:31:02] Final chosen deck colors: U
[12:31:02] Scryfall request /cards/search q=%28type%3A%22Djinn%22+OR+oracle%3A%2F%5CbDjinn%5Cb%2Fi+OR+oracle%3A%2F%5CbDjinns%5Cb%2Fi%29+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:02] Scryfall /cards/search status=200 attempt=1/8
[12:31:02] Scryfall search count=39 q=(type:"Djinn" OR oracle:/\bDjinn\b/i OR oracle:/\bDjinns\b/i) id<=U game:paper lang:en
[12:31:02] On-theme (high EDHREC) card added: Mistfire Weaver / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Skywise Teachings / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Cloud Djinn / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Dirgur Focusmage // Braingeyser / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Serendib Djinn / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Djinni Windseer / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] On-theme (high EDHREC) card added: Riverwheel Aerialists / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:31:02] Scryfall request /cards/search q=%28type%3A%22Djinn%22+OR+oracle%3A%2F%5CbDjinn%5Cb%2Fi+OR+oracle%3A%2F%5CbDjinns%5Cb%2Fi%29+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[12:31:04] Scryfall /cards/search status=200 attempt=1/8
[12:31:04] Scryfall search count=39 q=(type:"Djinn" OR oracle:/\bDjinn\b/i OR oracle:/\bDjinns\b/i) id<=U game:paper lang:en
[12:31:04] On-theme (random all-time) card added: Djinn of Fool's Fall / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Waterspout Djinn / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Tidespout Tyrant / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Bottle of Suleiman / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Zanam Djinn / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Tester of the Tangential / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme (random all-time) card added: Djinn of the Lamp / source: Scryfall random across all MTG history / reason: random theme card from full history
[12:31:04] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[12:31:04] Support archetype: typal (5 tiers)
[12:31:04] Inferred support needs from selected theme cards: noncreature spell density, instant/sorcery density, token density, counter support, sacrifice support
[12:31:04] Scryfall request /cards/search q=-type%3Acreature+-type%3Aland+cmc%3C%3D3+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:05] Scryfall /cards/search status=200 attempt=1/8
[12:31:05] Scryfall search count=175 q=-type:creature -type:land cmc<=3 id<=U game:paper lang:en
[12:31:05] Support card added: Herald's Horn / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Mana Vault / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Arcane Denial / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Flusterstorm / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Preordain / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Sol Ring / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: The Ozolith / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Frantic Search / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Support card added: Ponder / source: inferred need: cheap noncreature spells for theme cards / reason: noncreature spell density support inferred from selected theme cards
[12:31:05] Synergy validation passed after 0 repair pass(es).
[12:31:05] Final non-land split: theme=14 support=9 creatures=12
[12:31:05] Average mana value: 3.69
[12:31:05] Virtual curve entries: 24
[12:31:05] Final land count: 22. Reason: 15 + average mana value 3.69 * 1.8, clamped to 15-25
[12:31:05] Pip counts: {"W":0,"U":26.4,"B":0,"R":0,"G":0} snowRequired=false snowMatters=false colorlessNeed=true
[12:31:05] Injected 2x Wastes so colorless {C} costs are always castable.
[12:31:05] Basic land allocation: Island, Island, Island, Island, Island, Island, Island, Island, Island, Wastes, Wastes
[12:31:05] Scryfall request /cards/search q=%21%22Island%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:31:05] Scryfall /cards/search status=200 attempt=1/8
[12:31:07] Scryfall /cards/search:page status=200 attempt=1/8
[12:31:07] Scryfall search count=350 q=!"Island" include:extras unique:prints lang:en
[12:31:07] Scryfall request /cards/search q=%21%22Wastes%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:31:07] Scryfall /cards/search status=200 attempt=1/8
[12:31:07] Scryfall search count=18 q=!"Wastes" include:extras unique:prints lang:en
[12:31:07] Random basic-land art set: PAL01
[12:31:07] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22djinn%22+OR+oracle%3A%2F%5CbDjinn%5Cb%2Fi+OR+type%3A%22Djinn%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:07] Scryfall /cards/search status=404 attempt=1/8
[12:31:07] Scryfall search returned no matches for q=(type:land (otag:"djinn" OR oracle:/\bDjinn\b/i OR type:"Djinn")) type:land -type:basic id<=U game:paper lang:en
[12:31:07] Theme-related nonbasic lands found: 0
[12:31:07] Not enough theme non-basic lands; filling with compatible non-basics.
[12:31:07] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DU+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:31:08] Scryfall /cards/search status=200 attempt=1/8
[12:31:08] Scryfall search count=175 q=type:land -type:basic id<=U game:paper lang:en
[12:31:08] Scryfall request /cards/search q=%21%22Conduit+Pylons%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:31:08] Scryfall /cards/search status=200 attempt=1/8
[12:31:08] Scryfall search count=1 q=!"Conduit Pylons" unique:prints game:paper lang:en
[12:31:08] Scryfall request /cards/search q=%21%22Tyrite+Sanctum%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:31:08] Scryfall /cards/search status=200 attempt=1/8
[12:31:08] Scryfall search count=6 q=!"Tyrite Sanctum" unique:prints game:paper lang:en
[12:31:08] Alt art rolled for Tyrite Sanctum: CMM 1049
[12:31:08] Non-basic land allocation: Conduit Pylons, Demolition Field, Prismatic Vista, Tarnished Citadel, Tyrite Sanctum, Geier Reach Sanitarium, Uncharted Haven, Terrain Generator, Brokers Hideout, Horizon of Progress, Talon Gates of Madara
[12:31:08] Final whole-deck synergy check: all 45 cards have their synergies satisfied.
[12:31:08] Final deck counts: nonlands=23 lands=22 total=45
```
