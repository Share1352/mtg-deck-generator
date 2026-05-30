# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | OK ✅ |
| Generated | 2026-05-30T12:27:44.717Z |
| Commit | `local` |
| Theme | Cycle Woe R 2c Adventurer |
| Colors | BGW |
| Counts | nonlands=23 lands=22 total=45 |
| Seed | 1780144064717 |

## Deck list

```
1 Mosswood Dreadknight // Dread Whispers
1 Pollen-Shield Hare // Hare Raising
1 Devouring Sugarmaw // Have for Dinner
1 Terastodon
1 Stroke of Midnight
1 Elenda's Hierophant
1 Charismatic Conqueror
1 Army of the Damned
1 Elenda, the Dusk Rose
1 Bastion of Remembrance
1 Jadar, Ghoulcaller of Nephalia
1 Secure the Wastes
1 Elspeth, Sun's Champion
1 Elvish Warmaster
1 Caretaker's Talent
1 Teval's Judgment
1 Zendikar's Roil
1 The Eternal Wanderer
1 Pawn of Ulamog
1 Wurmcoil Engine
1 Myrel, Shield of Argive
1 Horn of Gondor
1 Springheart Nantuko
1 Tainted Field
1 Temple Garden
1 Gaea's Cradle
1 Sandsteppe Citadel
1 Twilight Mire
1 Bountiful Promenade
1 Emeria, the Sky Ruin
1 Hushwood Verge
1 Scrubland
1 Bloodstained Mire
4 Swamp (PAL06) 3
3 Forest (PAL06) 5
2 Plains (PAL06) 1
1 Wastes (TSR) 410
1 Wastes (OGW) 183a
1 Plains (HOB) 194
```

## Full generation log

```
[12:27:44] START v2.0.0 seed=1780144064717
[12:27:44] Scryfall request /catalog/keyword-abilities 
[12:27:44] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[12:27:45] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[12:27:45] Scryfall catalog keyword-abilities: 218 entries
[12:27:45] Scryfall request /catalog/keyword-actions 
[12:27:46] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[12:27:46] Scryfall catalog keyword-actions: 73 entries
[12:27:46] Scryfall request /catalog/ability-words 
[12:27:46] Scryfall /catalog/ability-words status=200 attempt=1/8
[12:27:46] Scryfall catalog ability-words: 70 entries
[12:27:46] Scryfall request /catalog/creature-types 
[12:27:47] Scryfall /catalog/creature-types status=200 attempt=1/8
[12:27:47] Scryfall catalog creature-types: 329 entries
[12:27:47] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[12:27:47] Loaded 32 color-combination themes.
[12:27:47] Candidate themes after dedupe/bans: 5843
[12:27:47] Banned theme count: 42
[12:27:47] Attempt 1: selected theme: Cycle Woe R 2c Adventurer / tagger / source: Scryfall Oracle Tagger
[12:27:47] Scryfall request /cards/search q=otag%3A%22cycle-woe-r-2c-adventurer%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:27:48] Scryfall /cards/search status=200 attempt=1/8
[12:27:48] Scryfall search count=10 q=otag:"cycle-woe-r-2c-adventurer" game:paper lang:en
[12:27:48] Theme pool valid cards: 10
[12:27:48] Theme pool color counts: W=4 U=4 B=4 R=4 G=4
[12:27:48] Dominance threshold: 2.4
[12:27:48] Dominant colors: WUBRG
[12:27:48] Equal-color case: yes
[12:27:48] Multicolor exception: not triggered
[12:27:48] Final chosen deck colors: BG
[12:27:48] Color expansion triggered: original=BG valid=1 needed=23 expanded=BGW available=3
[12:27:48] Scryfall request /cards/search q=otag%3A%22cycle-woe-r-2c-adventurer%22+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:27:48] Scryfall /cards/search status=200 attempt=1/8
[12:27:48] Scryfall search count=3 q=otag:"cycle-woe-r-2c-adventurer" id<=BGW game:paper lang:en
[12:27:48] On-theme (high EDHREC) card added: Mosswood Dreadknight // Dread Whispers / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:27:48] On-theme (high EDHREC) card added: Pollen-Shield Hare // Hare Raising / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:27:48] On-theme (high EDHREC) card added: Devouring Sugarmaw // Have for Dinner / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[12:27:48] Scryfall request /cards/search q=otag%3A%22cycle-woe-r-2c-adventurer%22+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[12:27:49] Scryfall /cards/search status=200 attempt=1/8
[12:27:49] Scryfall search count=3 q=otag:"cycle-woe-r-2c-adventurer" id<=BGW game:paper lang:en
[12:27:49] On-theme cards selected: 3/14 (target 7 high-edhrec + 7 random all-time)
[12:27:49] Support archetype: keyword (3 tiers)
[12:27:49] Inferred support needs from selected theme cards: token density, graveyard fuel, sacrifice support
[12:27:49] Scryfall request /cards/search q=%28oracle%3A%22create%22+oracle%3A%22creature+token%22%29+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:27:53] Scryfall /cards/search status=200 attempt=1/8
[12:27:53] Scryfall search count=175 q=(oracle:"create" oracle:"creature token") -type:land id<=BGW game:paper lang:en
[12:27:53] Support card added: Terastodon / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Stroke of Midnight / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Elenda's Hierophant / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Charismatic Conqueror / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Army of the Damned / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Elenda, the Dusk Rose / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Bastion of Remembrance / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Jadar, Ghoulcaller of Nephalia / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Secure the Wastes / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Elspeth, Sun's Champion / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Elvish Warmaster / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Caretaker's Talent / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Teval's Judgment / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Zendikar's Roil / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: The Eternal Wanderer / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Pawn of Ulamog / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Wurmcoil Engine / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Myrel, Shield of Argive / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Horn of Gondor / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Support card added: Springheart Nantuko / source: inferred need: token makers for theme cards / reason: token density support inferred from selected theme cards
[12:27:53] Synergy validation passed after 0 repair pass(es).
[12:27:53] Final non-land split: theme=3 support=20 creatures=13
[12:27:53] Average mana value: 3.62
[12:27:53] Virtual curve entries: 26
[12:27:53] Final land count: 22. Reason: 15 + average mana value 3.62 * 1.8, clamped to 15-25
[12:27:53] Pip counts: {"W":13.7,"U":0,"B":13.049999999999999,"R":0,"G":9.399999999999999} snowRequired=false snowMatters=false colorlessNeed=true
[12:27:53] Injected 2x Wastes so colorless {C} costs are always castable.
[12:27:53] Basic land allocation: Swamp, Swamp, Swamp, Swamp, Forest, Forest, Forest, Plains, Plains, Wastes, Wastes
[12:27:53] Scryfall request /cards/search q=%21%22Swamp%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:27:54] Scryfall /cards/search status=200 attempt=1/8
[12:27:56] Scryfall /cards/search:page status=200 attempt=1/8
[12:27:56] Scryfall search count=350 q=!"Swamp" include:extras unique:prints lang:en
[12:27:56] Scryfall request /cards/search q=%21%22Forest%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:00] Scryfall /cards/search status=200 attempt=1/8
[12:28:05] Scryfall /cards/search:page status=200 attempt=1/8
[12:28:05] Scryfall search count=350 q=!"Forest" include:extras unique:prints lang:en
[12:28:05] Scryfall request /cards/search q=%21%22Plains%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:06] Scryfall /cards/search status=200 attempt=1/8
[12:28:08] Scryfall /cards/search:page status=200 attempt=1/8
[12:28:08] Scryfall search count=350 q=!"Plains" include:extras unique:prints lang:en
[12:28:08] Scryfall request /cards/search q=%21%22Wastes%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:09] Scryfall /cards/search status=200 attempt=1/8
[12:28:09] Scryfall search count=18 q=!"Wastes" include:extras unique:prints lang:en
[12:28:09] Random basic-land art set: PAL06
[12:28:09] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22cycle+woe+r+2c+adventurer%22+OR+oracle%3A%2F%5CbCycle+Woe+R+2c+Adventurer%5Cb%2Fi+OR+type%3A%22Cycle+Woe+R+2c+Adventurer%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:28:09] Scryfall /cards/search status=404 attempt=1/8
[12:28:09] Scryfall search returned no matches for q=(type:land (otag:"cycle woe r 2c adventurer" OR oracle:/\bCycle Woe R 2c Adventurer\b/i OR type:"Cycle Woe R 2c Adventurer")) type:land -type:basic id<=BGW game:paper lang:en
[12:28:09] Theme-related nonbasic lands found: 0
[12:28:09] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[12:28:11] Scryfall /cards/search status=200 attempt=1/8
[12:28:11] Scryfall search count=175 q=type:land -type:basic id<=BGW game:paper lang:en
[12:28:11] In-color fixing non-basics: 9/9
[12:28:11] Scryfall cache hit /cards/search
[12:28:11] Scryfall search count=175 q=type:land -type:basic id<=BGW game:paper lang:en
[12:28:11] Scryfall request /cards/named exact=Plains
[12:28:11] Scryfall /cards/named status=200 attempt=1/8
[12:28:11] Land synergy: added Plains required by Hushwood Verge.
[12:28:11] Scryfall request /cards/search q=%21%22Temple+Garden%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:12] Scryfall /cards/search status=200 attempt=1/8
[12:28:12] Scryfall search count=16 q=!"Temple Garden" unique:prints game:paper lang:en
[12:28:12] Alt art rolled for Temple Garden: UNF 281
[12:28:12] Scryfall request /cards/search q=%21%22Twilight+Mire%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:13] Scryfall /cards/search status=200 attempt=1/8
[12:28:13] Scryfall search count=11 q=!"Twilight Mire" unique:prints game:paper lang:en
[12:28:13] Alt art rolled for Twilight Mire: SOC 418
[12:28:13] Scryfall request /cards/search q=%21%22Emeria%2C+the+Sky+Ruin%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:14] Scryfall /cards/search status=200 attempt=1/8
[12:28:14] Scryfall search count=5 q=!"Emeria, the Sky Ruin" unique:prints game:paper lang:en
[12:28:14] Alt art rolled for Emeria, the Sky Ruin: SOC 368
[12:28:14] Scryfall request /cards/search q=%21%22Bloodstained+Mire%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[12:28:14] Scryfall /cards/search status=200 attempt=1/8
[12:28:14] Scryfall search count=10 q=!"Bloodstained Mire" unique:prints game:paper lang:en
[12:28:14] Alt art rolled for Bloodstained Mire: ZNE 3
[12:28:14] Non-basic land allocation: Plains, Tainted Field, Temple Garden, Gaea's Cradle, Sandsteppe Citadel, Twilight Mire, Bountiful Promenade, Emeria, the Sky Ruin, Hushwood Verge, Scrubland, Bloodstained Mire
[12:28:14] Final whole-deck synergy check: all 45 cards have their synergies satisfied.
[12:28:14] Final deck counts: nonlands=23 lands=22 total=45
```
