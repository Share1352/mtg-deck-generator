# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | OK ✅ |
| Generated | 2026-05-30T13:32:36.243Z |
| Commit | `c955567ae72b7bf18acf56bd2cc18bc6a59bde0a` |
| Theme | Construct |
| Colors | BW |
| Counts | nonlands=23 lands=23 total=46 |
| Seed | 1780147956243 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26685088104 |

## Deck list

```
1 Su-Chi Cave Guard
1 Walking Atlas
1 Scrapyard Recombiner
1 Lupine Prototype
1 Traxos, Scourge of Kroog
1 Hexavus
1 Ancient Stone Idol
1 Karn, Scion of Urza
1 Gemini Engine
1 Shardless Outlander
1 Triskelion
1 Automatic Librarian
1 Eager Construct
1 Wishclaw Talisman
1 Hangarback Walker
1 Vat of Rebirth
1 Woe Strider
1 Parting Gust
1 Tezzeret, Cruel Captain
1 Threefold Thunderhulk
1 Sword of Truth and Justice
1 Grateful Apparition
1 Elenda, the Dusk Rose
1 Bojuka Bog
1 Vault of Champions
1 Minas Tirith
1 Shattered Sanctum
1 Shadowy Backstreet
1 Orzhov Guildgate
1 Shineshadow Snarl
1 Witch Enchanter // Witch-Blessed Meadow
1 Razorgrass Ambush // Razorgrass Field
1 Frostwalk Bastion
1 Hostile Hostel // Creeping Inn
1 Swamp (ZEN) 239
1 Swamp (ZEN) 238a
2 Swamp (ZEN) 238
2 Swamp (ZEN) 239a
1 Swamp (ZEN) 241a
1 Plains (ZEN) 232a
1 Plains (ZEN) 231
2 Plains (ZEN) 233a
1 Plains (ZEN) 230a
```

## Full generation log

```
[13:32:36] START v2.0.0 seed=1780147956243
[13:32:36] Scryfall request /catalog/keyword-abilities 
[13:32:36] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[13:32:36] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[13:32:36] Scryfall catalog keyword-abilities: 218 entries
[13:32:36] Scryfall request /catalog/keyword-actions 
[13:32:36] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[13:32:36] Scryfall catalog keyword-actions: 73 entries
[13:32:36] Scryfall request /catalog/ability-words 
[13:32:36] Scryfall /catalog/ability-words status=200 attempt=1/8
[13:32:36] Scryfall catalog ability-words: 70 entries
[13:32:36] Scryfall request /catalog/creature-types 
[13:32:39] Scryfall /catalog/creature-types status=200 attempt=1/8
[13:32:39] Scryfall catalog creature-types: 329 entries
[13:32:39] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[13:32:39] Loaded 32 color-combination themes.
[13:32:39] Candidate themes after dedupe/bans: 5843
[13:32:39] Banned theme count: 42
[13:32:39] Attempt 1: selected theme: Construct / typal / source: Scryfall creature-types
[13:32:39] Scryfall request /cards/search q=%28type%3A%22Construct%22+OR+oracle%3A%2F%5CbConstruct%5Cb%2Fi+OR+oracle%3A%2F%5CbConstructs%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:41] Scryfall /cards/search status=200 attempt=1/8
[13:32:41] Scryfall search count=175 q=(type:"Construct" OR oracle:/\bConstruct\b/i OR oracle:/\bConstructs\b/i) game:paper lang:en
[13:32:41] Theme pool valid cards: 106
[13:32:41] Theme pool color counts: W=12 U=12 B=9 R=11 G=5
[13:32:41] Dominance threshold: 7.2
[13:32:41] Dominant colors: WUBR
[13:32:41] Equal-color case: no
[13:32:41] Multicolor exception: not triggered
[13:32:41] Final chosen deck colors: BW
[13:32:41] Scryfall request /cards/search q=%28type%3A%22Construct%22+OR+oracle%3A%2F%5CbConstruct%5Cb%2Fi+OR+oracle%3A%2F%5CbConstructs%5Cb%2Fi%29+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:42] Scryfall /cards/search status=200 attempt=1/8
[13:32:42] Scryfall search count=175 q=(type:"Construct" OR oracle:/\bConstruct\b/i OR oracle:/\bConstructs\b/i) id<=BW game:paper lang:en
[13:32:42] On-theme (high EDHREC) card added: Su-Chi Cave Guard / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Walking Atlas / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Scrapyard Recombiner / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Lupine Prototype / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Traxos, Scourge of Kroog / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Hexavus / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] On-theme (high EDHREC) card added: Ancient Stone Idol / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[13:32:42] Scryfall request /cards/search q=%28type%3A%22Construct%22+OR+oracle%3A%2F%5CbConstruct%5Cb%2Fi+OR+oracle%3A%2F%5CbConstructs%5Cb%2Fi%29+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[13:32:43] Scryfall /cards/search status=200 attempt=1/8
[13:32:43] Scryfall search count=175 q=(type:"Construct" OR oracle:/\bConstruct\b/i OR oracle:/\bConstructs\b/i) id<=BW game:paper lang:en
[13:32:43] On-theme (random all-time) card added: Karn, Scion of Urza / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Gemini Engine / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Shardless Outlander / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Triskelion / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Pentavus / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Automatic Librarian / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme (random all-time) card added: Eager Construct / source: Scryfall random across all MTG history / reason: random theme card from full history
[13:32:43] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[13:32:43] Synergy repair needed: Pentavus wants a pentavite you control
[13:32:43] Scryfall request /cards/search q=%28%28type%3A%22Construct%22+OR+oracle%3A%2F%5CbConstruct%5Cb%2Fi+OR+oracle%3A%2F%5CbConstructs%5Cb%2Fi%29%29+type%3Apentavite+-type%3Aland+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:44] Scryfall /cards/search status=404 attempt=1/8
[13:32:44] Scryfall search returned no matches for q=((type:"Construct" OR oracle:/\bConstruct\b/i OR oracle:/\bConstructs\b/i)) type:pentavite -type:land id<=BW game:paper lang:en
[13:32:44] Scryfall request /cards/search q=type%3Apentavite+-type%3Aland+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:44] Scryfall /cards/search status=404 attempt=1/8
[13:32:44] Scryfall search returned no matches for q=type:pentavite -type:land id<=BW game:paper lang:en
[13:32:44] Removed Pentavus: its required synergy target could not be guaranteed.
[13:32:44] Synergy validation passed after 1 repair pass(es).
[13:32:44] Support archetype: typal (5 tiers)
[13:32:44] Inferred support needs from selected theme cards: counter support, artifact density, token density, sacrifice support
[13:32:44] Scryfall request /cards/search q=%28oracle%3A%22%2B1%2F%2B1+counter%22+OR+keyword%3Aproliferate+OR+otag%3Acounters-matter%29+-type%3Aland+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:45] Scryfall /cards/search status=200 attempt=1/8
[13:32:45] Scryfall search count=175 q=(oracle:"+1/+1 counter" OR keyword:proliferate OR otag:counters-matter) -type:land id<=BW game:paper lang:en
[13:32:45] Support card added: Wishclaw Talisman / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Hangarback Walker / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Vat of Rebirth / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Woe Strider / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Parting Gust / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Tezzeret, Cruel Captain / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Threefold Thunderhulk / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Sword of Truth and Justice / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Grateful Apparition / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Support card added: Elenda, the Dusk Rose / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[13:32:45] Synergy validation passed after 0 repair pass(es).
[13:32:45] Final non-land split: theme=13 support=10 creatures=17
[13:32:45] Average mana value: 4.26
[13:32:45] Virtual curve entries: 23
[13:32:45] Final land count: 23. Reason: 15 + average mana value 4.26 * 1.8, clamped to 15-25
[13:32:45] Pip counts: {"W":4,"U":0,"B":5.05,"R":0,"G":0} snowRequired=false snowMatters=false colorlessNeed=false
[13:32:45] Basic land allocation: Swamp, Swamp, Swamp, Swamp, Swamp, Swamp, Swamp, Plains, Plains, Plains, Plains, Plains
[13:32:45] Scryfall request /cards/search q=%21%22Swamp%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[13:32:46] Scryfall /cards/search status=200 attempt=1/8
[13:32:46] Scryfall /cards/search:page status=200 attempt=1/8
[13:32:46] Scryfall search count=350 q=!"Swamp" include:extras unique:prints lang:en
[13:32:46] Scryfall request /cards/search q=%21%22Plains%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[13:32:46] Scryfall /cards/search status=200 attempt=1/8
[13:32:47] Scryfall /cards/search:page status=200 attempt=1/8
[13:32:47] Scryfall search count=350 q=!"Plains" include:extras unique:prints lang:en
[13:32:47] Random basic-land art set: ZEN
[13:32:47] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22construct%22+OR+oracle%3A%2F%5CbConstruct%5Cb%2Fi+OR+type%3A%22Construct%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:47] Scryfall /cards/search status=200 attempt=1/8
[13:32:47] Scryfall search count=2 q=(type:land (otag:"construct" OR oracle:/\bConstruct\b/i OR type:"Construct")) type:land -type:basic id<=BW game:paper lang:en
[13:32:47] Theme-related nonbasic lands found: 2
[13:32:47] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DBW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:32:48] Scryfall /cards/search status=200 attempt=1/8
[13:32:48] Scryfall search count=175 q=type:land -type:basic id<=BW game:paper lang:en
[13:32:48] In-color fixing non-basics: 9/9
[13:32:48] Scryfall request /cards/search q=%21%22Hostile+Hostel+%2F%2F+Creeping+Inn%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[13:32:48] Scryfall /cards/search status=200 attempt=1/8
[13:32:48] Scryfall search count=4 q=!"Hostile Hostel // Creeping Inn" unique:prints game:paper lang:en
[13:32:48] Alt art rolled for Hostile Hostel // Creeping Inn: PMID 264s
[13:32:48] Non-basic land allocation: Bojuka Bog, Vault of Champions, Minas Tirith, Shattered Sanctum, Shadowy Backstreet, Orzhov Guildgate, Shineshadow Snarl, Witch Enchanter // Witch-Blessed Meadow, Razorgrass Ambush // Razorgrass Field, Frostwalk Bastion, Hostile Hostel // Creeping Inn
[13:32:48] Final whole-deck synergy check: all 46 cards have their synergies satisfied.
[13:32:48] Final deck counts: nonlands=23 lands=23 total=46
```
