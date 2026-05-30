# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | OK ✅ |
| Generated | 2026-05-30T19:39:14.401Z |
| Commit | `7bdbc5de0df0d3976ce26800fd57ef189bd99a6d` |
| Theme | Tribal Spirit |
| Colors | GUW |
| Counts | nonlands=23 lands=21 total=44 |
| Seed | 1780169954401 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26693059315 |

## Deck list

```
1 Spectral Arcanist
1 Sire of the Storm
1 Apothecary Geist
1 Unchecked Growth
1 Mausoleum Wanderer
1 Briarknit Kami
1 Tallowisp
1 Elder Pine of Jukai
1 Innocence Kami
1 Haru-Onna
1 Breath of the Sleepless
1 Supernatural Rescue
1 Orbweaver Kumo
1 Hallowed Haunting
1 Katilda, Dawnhart Martyr // Katilda's Rising Dawn
1 Spirit Bonds
1 Tocasia's Welcome
1 Authority of the Consuls
1 Kodama's Reach
1 Opt
1 Three Visits
1 Reprieve
1 Dramatic Reversal
1 Seat of the Synod
1 Port Town
1 Castle Garenbrig
1 Ancient Den
1 Branchloft Pathway // Boulderloft Pathway
1 Savannah
1 Thornwood Falls
1 Emeria, the Sky Ruin
1 Accursed Duneyard
1 Karn's Bastion
1 Forest (SHM) 299
1 Forest (SHM) 300
1 Forest (SHM) 301
3 Island (SHM) 286
2 Plains (SHM) 284
2 Plains (SHM) 285
1 Plains (SHM) 283
```

## Full generation log

```
[19:39:14] START v2.0.0 seed=1780169954401
[19:39:14] Scryfall request /catalog/keyword-abilities 
[19:39:14] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[19:39:15] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[19:39:16] Scryfall catalog keyword-abilities: 218 entries
[19:39:16] Scryfall request /catalog/keyword-actions 
[19:39:16] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[19:39:16] Scryfall catalog keyword-actions: 73 entries
[19:39:16] Scryfall request /catalog/ability-words 
[19:39:18] Scryfall /catalog/ability-words status=200 attempt=1/8
[19:39:18] Scryfall catalog ability-words: 70 entries
[19:39:18] Scryfall request /catalog/creature-types 
[19:39:18] Scryfall /catalog/creature-types status=200 attempt=1/8
[19:39:18] Scryfall catalog creature-types: 329 entries
[19:39:18] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[19:39:18] Loaded 32 color-combination themes.
[19:39:18] Candidate themes after dedupe/bans: 5843
[19:39:18] Banned theme count: 42
[19:39:18] Attempt 1: selected theme: Tribal Spirit / tagger / source: Scryfall Oracle Tagger
[19:39:18] Scryfall request /cards/search q=%28otag%3A%22tribal-spirit%22+OR+oracle%3A%2F%5CbTribal+Spirit%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:19] Scryfall /cards/search status=200 attempt=1/8
[19:39:19] Scryfall search count=128 q=(otag:"tribal-spirit" OR oracle:/\bTribal Spirit\b/i) game:paper lang:en
[19:39:19] Theme pool valid cards: 116
[19:39:19] Theme pool color counts: W=37 U=26 B=20 R=17 G=27
[19:39:19] Dominance threshold: 22.2
[19:39:19] Dominant colors: WUG
[19:39:19] Equal-color case: no
[19:39:19] Multicolor exception: not triggered
[19:39:19] Final chosen deck colors: GUW
[19:39:19] Scryfall request /cards/search q=%28otag%3A%22tribal-spirit%22+OR+oracle%3A%2F%5CbTribal+Spirit%5Cb%2Fi%29+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:20] Scryfall /cards/search status=200 attempt=1/8
[19:39:20] Scryfall search count=90 q=(otag:"tribal-spirit" OR oracle:/\bTribal Spirit\b/i) id<=GUW game:paper lang:en
[19:39:20] On-theme (high EDHREC) card added: Spectral Arcanist / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Sire of the Storm / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Apothecary Geist / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Unchecked Growth / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Mausoleum Wanderer / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Briarknit Kami / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] On-theme (high EDHREC) card added: Tallowisp / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[19:39:20] Scryfall request /cards/search q=%28otag%3A%22tribal-spirit%22+OR+oracle%3A%2F%5CbTribal+Spirit%5Cb%2Fi%29+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[19:39:22] Scryfall /cards/search status=200 attempt=1/8
[19:39:22] Scryfall search count=90 q=(otag:"tribal-spirit" OR oracle:/\bTribal Spirit\b/i) id<=GUW game:paper lang:en
[19:39:22] On-theme (random all-time) card added: Elder Pine of Jukai / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Innocence Kami / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Haru-Onna / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Breath of the Sleepless / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Supernatural Rescue / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Orbweaver Kumo / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme (random all-time) card added: Hallowed Haunting / source: Scryfall random across all MTG history / reason: random theme card from full history
[19:39:22] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[19:39:22] Synergy repair needed: Hallowed Haunting needs 7+ enchantments (have 3)
[19:39:22] Scryfall request /cards/search q=%28%28otag%3A%22tribal-spirit%22+OR+oracle%3A%2F%5CbTribal+Spirit%5Cb%2Fi%29%29+type%3Aenchantment+-type%3Aland+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:24] Scryfall /cards/search status=200 attempt=1/8
[19:39:24] Scryfall search count=5 q=((otag:"tribal-spirit" OR oracle:/\bTribal Spirit\b/i)) type:enchantment -type:land id<=GUW game:paper lang:en
[19:39:24] Scryfall request /cards/search q=type%3Aenchantment+-type%3Aland+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:26] Scryfall /cards/search status=200 attempt=1/8
[19:39:26] Scryfall search count=175 q=type:enchantment -type:land id<=GUW game:paper lang:en
[19:39:26] Support card added: Katilda, Dawnhart Martyr // Katilda's Rising Dawn / source: synergy repair / reason: count threshold: 7+ enchantments for Hallowed Haunting
[19:39:26] Support card added: Spirit Bonds / source: synergy repair / reason: count threshold: 7+ enchantments for Hallowed Haunting
[19:39:26] Support card added: Tocasia's Welcome / source: synergy repair / reason: count threshold: 7+ enchantments for Hallowed Haunting
[19:39:26] Support card added: Authority of the Consuls / source: synergy repair / reason: count threshold: 7+ enchantments for Hallowed Haunting
[19:39:26] Synergy validation passed after 1 repair pass(es).
[19:39:26] Support archetype: keyword (3 tiers)
[19:39:26] Inferred support needs from selected theme cards: instant/sorcery density, graveyard fuel, token density, counter support, sacrifice support
[19:39:26] Scryfall request /cards/search q=%28type%3Ainstant+OR+type%3Asorcery%29+cmc%3C%3D3+-type%3Aland+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:28] Scryfall /cards/search status=200 attempt=1/8
[19:39:28] Scryfall search count=175 q=(type:instant OR type:sorcery) cmc<=3 -type:land id<=GUW game:paper lang:en
[19:39:28] Support card added: Kodama's Reach / source: inferred need: cheap instants and sorceries for theme cards / reason: instant/sorcery density support inferred from selected theme cards
[19:39:28] Support card added: Opt / source: inferred need: cheap instants and sorceries for theme cards / reason: instant/sorcery density support inferred from selected theme cards
[19:39:28] Support card added: Three Visits / source: inferred need: cheap instants and sorceries for theme cards / reason: instant/sorcery density support inferred from selected theme cards
[19:39:28] Support card added: Reprieve / source: inferred need: cheap instants and sorceries for theme cards / reason: instant/sorcery density support inferred from selected theme cards
[19:39:28] Support card added: Dramatic Reversal / source: inferred need: cheap instants and sorceries for theme cards / reason: instant/sorcery density support inferred from selected theme cards
[19:39:28] Synergy validation passed after 0 repair pass(es).
[19:39:28] Final non-land split: theme=14 support=9 creatures=11
[19:39:28] Average mana value: 3.28
[19:39:28] Virtual curve entries: 23
[19:39:28] Final land count: 21. Reason: 15 + average mana value 3.28 * 1.8, clamped to 15-25
[19:39:28] Pip counts: {"W":14.749999999999998,"U":7,"B":0,"R":0,"G":9} snowRequired=false snowMatters=false colorlessNeed=false
[19:39:28] Basic land allocation: Forest, Forest, Forest, Island, Island, Island, Plains, Plains, Plains, Plains, Plains
[19:39:28] Scryfall request /cards/search q=%21%22Forest%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:33] Scryfall /cards/search status=200 attempt=1/8
[19:39:39] Scryfall /cards/search:page status=200 attempt=1/8
[19:39:39] Scryfall search count=350 q=!"Forest" include:extras unique:prints lang:en
[19:39:39] Scryfall request /cards/search q=%21%22Island%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:39] Scryfall /cards/search status=200 attempt=1/8
[19:39:39] Scryfall /cards/search:page status=200 attempt=1/8
[19:39:39] Scryfall search count=350 q=!"Island" include:extras unique:prints lang:en
[19:39:39] Scryfall request /cards/search q=%21%22Plains%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:39] Scryfall /cards/search status=200 attempt=1/8
[19:39:39] Scryfall /cards/search:page status=200 attempt=1/8
[19:39:39] Scryfall search count=350 q=!"Plains" include:extras unique:prints lang:en
[19:39:39] Random basic-land art set: SHM
[19:39:39] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22tribal+spirit%22+OR+oracle%3A%2F%5CbTribal+Spirit%5Cb%2Fi+OR+type%3A%22Tribal+Spirit%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:43] Scryfall /cards/search status=200 attempt=1/8
[19:39:43] Scryfall search count=1 q=(type:land (otag:"tribal spirit" OR oracle:/\bTribal Spirit\b/i OR type:"Tribal Spirit")) type:land -type:basic id<=GUW game:paper lang:en
[19:39:43] Theme-related nonbasic lands found: 1
[19:39:43] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DGUW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[19:39:44] Scryfall /cards/search status=200 attempt=1/8
[19:39:44] Scryfall search count=175 q=type:land -type:basic id<=GUW game:paper lang:en
[19:39:44] In-color fixing non-basics: 8/8
[19:39:44] Scryfall cache hit /cards/search
[19:39:44] Scryfall search count=175 q=type:land -type:basic id<=GUW game:paper lang:en
[19:39:44] Scryfall request /cards/search q=%21%22Castle+Garenbrig%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:44] Scryfall /cards/search status=200 attempt=1/8
[19:39:44] Scryfall search count=5 q=!"Castle Garenbrig" unique:prints game:paper lang:en
[19:39:44] Alt art rolled for Castle Garenbrig: PLST ELD-240
[19:39:44] Scryfall request /cards/search q=%21%22Savannah%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:45] Scryfall /cards/search status=200 attempt=1/8
[19:39:45] Scryfall search count=5 q=!"Savannah" unique:prints game:paper lang:en
[19:39:45] Alt art rolled for Savannah: LEB 281
[19:39:45] Scryfall request /cards/search q=%21%22Emeria%2C+the+Sky+Ruin%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:45] Scryfall /cards/search status=200 attempt=1/8
[19:39:45] Scryfall search count=5 q=!"Emeria, the Sky Ruin" unique:prints game:paper lang:en
[19:39:45] Alt art rolled for Emeria, the Sky Ruin: C14 293
[19:39:45] Scryfall request /cards/search q=%21%22Accursed+Duneyard%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:45] Scryfall /cards/search status=200 attempt=1/8
[19:39:45] Scryfall search count=2 q=!"Accursed Duneyard" unique:prints game:paper lang:en
[19:39:45] Alt art rolled for Accursed Duneyard: DRC 36
[19:39:45] Scryfall request /cards/search q=%21%22Karn%27s+Bastion%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[19:39:45] Scryfall /cards/search status=200 attempt=1/8
[19:39:45] Scryfall search count=12 q=!"Karn's Bastion" unique:prints game:paper lang:en
[19:39:45] Alt art rolled for Karn's Bastion: SLD 1751
[19:39:45] Non-basic land allocation: Seat of the Synod, Port Town, Castle Garenbrig, Ancient Den, Branchloft Pathway // Boulderloft Pathway, Savannah, Thornwood Falls, Emeria, the Sky Ruin, Accursed Duneyard, Karn's Bastion
[19:39:45] Final whole-deck synergy check: all 44 cards have their synergies satisfied.
[19:39:45] Final deck counts: nonlands=23 lands=21 total=44
```
