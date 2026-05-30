# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | FAILED ❌ |
| Generated | 2026-05-30T20:10:40.329Z |
| Commit | `50c55661e0eeaa9a79a8e47a592ab2b9583b9d7f` |
| Theme | n/a |
| Colors | n/a |
| Counts | n/a |
| Seed | 1780171840329 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26693737623 |

**Error:** `Online card database is unreachable while building Lifelink Counter. The deck generator only works while Scryfall is reachable. Scryfall transient 429 for /cards/search`

## Deck list

```
(no deck produced — see log below)
```

## Full generation log

```
[20:10:40] START v2.0.0 seed=1780171840329
[20:10:40] Scryfall request /catalog/keyword-abilities 
[20:10:40] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[20:10:40] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[20:10:40] Scryfall catalog keyword-abilities: 218 entries
[20:10:40] Scryfall request /catalog/keyword-actions 
[20:10:40] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[20:10:40] Scryfall catalog keyword-actions: 73 entries
[20:10:40] Scryfall request /catalog/ability-words 
[20:10:40] Scryfall /catalog/ability-words status=200 attempt=1/8
[20:10:40] Scryfall catalog ability-words: 70 entries
[20:10:40] Scryfall request /catalog/creature-types 
[20:10:40] Scryfall /catalog/creature-types status=200 attempt=1/8
[20:10:40] Scryfall catalog creature-types: 329 entries
[20:10:40] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[20:10:40] Loaded 32 color-combination themes.
[20:10:40] Candidate themes after dedupe/bans: 5843
[20:10:40] Banned theme count: 42
[20:10:40] Attempt 1: selected theme: Five-Color / color / source: Generated color identity themes
[20:10:40] Scryfall request /cards/search q=id%3C%3DWUBRG+-type%3Aland+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:42] Scryfall /cards/search status=200 attempt=1/8
[20:10:42] Scryfall search count=175 q=id<=WUBRG -type:land game:paper lang:en
[20:10:42] Theme pool valid cards: 100
[20:10:42] Color theme selected: Five-Color; locked deck color identity to WUBRG and disabled basic lands.
[20:10:42] Scryfall request /cards/search q=id%3C%3DWUBRG+-type%3Aland+id%3C%3DWUBRG+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:45] Scryfall /cards/search status=200 attempt=1/8
[20:10:45] Scryfall search count=175 q=id<=WUBRG -type:land id<=WUBRG game:paper lang:en
[20:10:45] On-theme (high EDHREC) card added: Mana Drain / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: Brainstorm / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: Faithless Looting / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: The One Ring / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: Swiftfoot Boots / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: Wild Growth / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] On-theme (high EDHREC) card added: Reanimate / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:45] Scryfall request /cards/search q=id%3C%3DWUBRG+-type%3Aland+id%3C%3DWUBRG+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[20:10:47] Scryfall /cards/search status=200 attempt=1/8
[20:10:47] Scryfall search count=175 q=id<=WUBRG -type:land id<=WUBRG game:paper lang:en
[20:10:47] On-theme (random all-time) card added: Abiding Grace / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: Eternal Witness / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: _____ / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: Abstruse Interference / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: Assassin's Trophy / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: Aberrant Manawurm / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme (random all-time) card added: Abomination / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:47] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[20:10:47] Synergy validation passed after 0 repair pass(es).
[20:10:47] Support archetype: keyword (3 tiers)
[20:10:47] Inferred support needs from selected theme cards: graveyard fuel, instant/sorcery density, counter support
[20:10:47] Scryfall request /cards/search q=%28otag%3Aself-mill+OR+oracle%3A%22mill%22+OR+oracle%3A%22discard+a+card%22+OR+oracle%3A%22discard+your+hand%22%29+-type%3Aland+id%3C%3DWUBRG+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:48] Scryfall /cards/search status=200 attempt=1/8
[20:10:48] Scryfall search count=175 q=(otag:self-mill OR oracle:"mill" OR oracle:"discard a card" OR oracle:"discard your hand") -type:land id<=WUBRG game:paper lang:en
[20:10:48] Support card added: Hedge Shredder / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Hazoret's Monument / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Millikin / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Kozilek, the Great Distortion / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Jaxis, the Troublemaker / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Monument to Endurance / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Consider / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Thought Scour / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Support card added: Collector's Vault / source: inferred need: self-mill and discard to fuel theme cards / reason: graveyard fuel support inferred from selected theme cards
[20:10:48] Synergy validation passed after 0 repair pass(es).
[20:10:48] Final non-land split: theme=14 support=9 creatures=7
[20:10:48] Average mana value: 2.78
[20:10:48] Virtual curve entries: 23
[20:10:48] Final land count: 20. Reason: 15 + average mana value 2.78 * 1.8, clamped to 15-25
[20:10:48] Pip counts: {"W":1,"U":7,"B":4,"R":3.0500000000000003,"G":7.35} snowRequired=false snowMatters=false colorlessNeed=true
[20:10:48] Injected -1x Wastes so colorless {C} costs are always castable.
[20:10:48] Basic land allocation: none (strict color theme)
[20:10:48] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22five-color%22+OR+oracle%3A%2F%5CbFive-Color%5Cb%2Fi+OR+type%3A%22Five-Color%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DWUBRG+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:48] Scryfall /cards/search status=404 attempt=1/8
[20:10:48] Scryfall search returned no matches for q=(type:land (otag:"five-color" OR oracle:/\bFive-Color\b/i OR type:"Five-Color")) type:land -type:basic id<=WUBRG game:paper lang:en
[20:10:48] Theme-related nonbasic lands found: 0
[20:10:48] Scryfall request /cards/search q=type%3Aland+-type%3Abasic+id%3C%3DWUBRG+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:50] Scryfall /cards/search status=200 attempt=1/8
[20:10:50] Scryfall search count=175 q=type:land -type:basic id<=WUBRG game:paper lang:en
[20:10:50] In-color fixing non-basics: 16/16
[20:10:50] Scryfall cache hit /cards/search
[20:10:50] Scryfall search count=175 q=type:land -type:basic id<=WUBRG game:paper lang:en
[20:10:50] Scryfall request /cards/named exact=Plains
[20:10:50] Scryfall /cards/named status=200 attempt=1/8
[20:10:50] Land synergy: added Plains required by Glacial Fortress.
[20:10:50] Scryfall request /cards/search q=%21%22Orzhov+Basilica%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:50] Scryfall /cards/search status=200 attempt=1/8
[20:10:50] Scryfall search count=25 q=!"Orzhov Basilica" unique:prints game:paper lang:en
[20:10:50] Alt art rolled for Orzhov Basilica: C17 268
[20:10:50] Scryfall request /cards/search q=%21%22Stomping+Ground%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:50] Scryfall /cards/search status=200 attempt=1/8
[20:10:50] Scryfall search count=18 q=!"Stomping Ground" unique:prints game:paper lang:en
[20:10:50] Alt art rolled for Stomping Ground: EOE 378
[20:10:50] Scryfall request /cards/search q=%21%22Golgari+Rot+Farm%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:51] Scryfall /cards/search status=200 attempt=1/8
[20:10:51] Scryfall search count=24 q=!"Golgari Rot Farm" unique:prints game:paper lang:en
[20:10:51] Alt art rolled for Golgari Rot Farm: IMA 236
[20:10:51] Scryfall request /cards/search q=%21%22Temple+of+Mystery%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:51] Scryfall /cards/search status=200 attempt=1/8
[20:10:51] Scryfall search count=32 q=!"Temple of Mystery" unique:prints game:paper lang:en
[20:10:51] Alt art rolled for Temple of Mystery: PIP 308
[20:10:51] Scryfall request /cards/search q=%21%22Bountiful+Promenade%22+unique%3Aprints+game%3Apaper+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:51] Scryfall /cards/search status=200 attempt=1/8
[20:10:51] Scryfall search count=6 q=!"Bountiful Promenade" unique:prints game:paper lang:en
[20:10:51] Alt art rolled for Bountiful Promenade: BBD 81
[20:10:51] Non-basic land allocation: Plains, Nomad Outpost, Seat of the Synod, Orzhov Basilica, Battlefield Forge, Fetid Heath, Stomping Ground, Prairie Stream, Boseiju, Who Endures, Temple of Silence, Fortified Village, Golgari Rot Farm, Badlands, Glacial Fortress, Temple of Mystery, Foreboding Ruins, Zagoth Triome, Bountiful Promenade, Game Trail, Cavern of Souls
[20:10:51] Final whole-deck synergy check: all 43 cards have their synergies satisfied.
[20:10:51] Final deck counts: nonlands=23 lands=20 total=43
[20:10:51] ERROR generation attempt 1: Land section contains an invalid non-basic land: Temple of Mystery
[20:10:51] Rerolled theme "Five-Color" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Land section contains an invalid non-basic land: Temple of Mystery
[20:10:51] Attempt 2: selected theme: Lifelink Counter / tagger / source: Scryfall Oracle Tagger
[20:10:51] Scryfall request /cards/search q=%28otag%3A%22lifelink-counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:52] Scryfall /cards/search status=200 attempt=1/8
[20:10:52] Scryfall search count=24 q=(otag:"lifelink-counter" OR oracle:/\bLifelink Counter\b/i) game:paper lang:en
[20:10:52] Theme pool valid cards: 22
[20:10:52] Theme pool color counts: W=11 U=0 B=11 R=0 G=3
[20:10:52] Dominance threshold: 6.6
[20:10:52] Dominant colors: WB
[20:10:52] Equal-color case: no
[20:10:52] Multicolor exception: not triggered
[20:10:52] Final chosen deck colors: BW
[20:10:52] Color expansion triggered: original=BW valid=19 needed=23 expanded=BGW available=22
[20:10:52] Scryfall request /cards/search q=%28otag%3A%22lifelink-counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi%29+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:52] Scryfall /cards/search status=200 attempt=1/8
[20:10:52] Scryfall search count=23 q=(otag:"lifelink-counter" OR oracle:/\bLifelink Counter\b/i) id<=BGW game:paper lang:en
[20:10:52] On-theme (high EDHREC) card added: Duskfang Mentor / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Grimdancer / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Dust Animus / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Qarsi Revenant / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Aragorn, Company Leader / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Crystalline Giant / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] On-theme (high EDHREC) card added: Unexpected Fangs / source: Scryfall edhrec-rank theme pool / reason: random pick among high edhrec-rated theme cards
[20:10:52] Scryfall request /cards/search q=%28otag%3A%22lifelink-counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi%29+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=random&dir=asc
[20:10:53] Scryfall /cards/search status=200 attempt=1/8
[20:10:53] Scryfall search count=23 q=(otag:"lifelink-counter" OR oracle:/\bLifelink Counter\b/i) id<=BGW game:paper lang:en
[20:10:53] On-theme (random all-time) card added: Alchemist's Assistant / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: Vitality Hunter / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: Sorin of House Markov // Sorin, Ravenous Neonate / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: T-45 Power Armor / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: Boot Nipper / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: Gilraen, Dúnedain Protector / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme (random all-time) card added: Arwen, Mortal Queen / source: Scryfall random across all MTG history / reason: random theme card from full history
[20:10:53] On-theme cards selected: 14/14 (target 7 high-edhrec + 7 random all-time)
[20:10:53] Synergy validation passed after 0 repair pass(es).
[20:10:53] Support archetype: keyword (3 tiers)
[20:10:53] Inferred support needs from selected theme cards: counter support, graveyard fuel
[20:10:53] Scryfall request /cards/search q=%28oracle%3A%22%2B1%2F%2B1+counter%22+OR+keyword%3Aproliferate+OR+otag%3Acounters-matter%29+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:55] Scryfall /cards/search status=200 attempt=1/8
[20:10:55] Scryfall search count=175 q=(oracle:"+1/+1 counter" OR keyword:proliferate OR otag:counters-matter) -type:land id<=BGW game:paper lang:en
[20:10:55] Support card added: Gaea's Gift / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Cleric Class / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Meren of Clan Nel Toth / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Tribute to the World Tree / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Abzan Falconer / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Mossborn Hydra / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Avenger of Zendikar / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Kodama of the West Tree / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Support card added: Bristly Bill, Spine Sower / source: inferred need: +1/+1 counter sources for theme cards / reason: counter support support inferred from selected theme cards
[20:10:55] Synergy repair needed: Meren of Clan Nel Toth wants creatures to die but the deck has no sacrifice outlet
[20:10:55] Scryfall request /cards/search q=%28%28otag%3A%22lifelink-counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi%29%29+%28oracle%3A%22sacrifice+a+creature%3A%22+OR+oracle%3A%22sacrifice+another+creature%22+OR+oracle%3A%22%2C+sacrifice+a+creature%22%29+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:55] Scryfall /cards/search status=404 attempt=1/8
[20:10:55] Scryfall search returned no matches for q=((otag:"lifelink-counter" OR oracle:/\bLifelink Counter\b/i)) (oracle:"sacrifice a creature:" OR oracle:"sacrifice another creature" OR oracle:", sacrifice a creature") -type:land id<=BGW game:paper lang:en
[20:10:55] Scryfall request /cards/search q=%28oracle%3A%22sacrifice+a+creature%3A%22+OR+oracle%3A%22sacrifice+another+creature%22+OR+oracle%3A%22%2C+sacrifice+a+creature%22%29+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:57] Scryfall /cards/search status=200 attempt=1/8
[20:10:57] Scryfall search count=175 q=(oracle:"sacrifice a creature:" OR oracle:"sacrifice another creature" OR oracle:", sacrifice a creature") -type:land id<=BGW game:paper lang:en
[20:10:57] Support card added: Ashnod's Altar / source: synergy repair / reason: Scryfall mechanic-presence (a sacrifice outlet to make creatures die on demand) for Meren of Clan Nel Toth
[20:10:57] Synergy repair needed: Kodama of the West Tree wants a aura you control
[20:10:57] Scryfall request /cards/search q=%28%28otag%3A%22lifelink-counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi%29%29+type%3Aaura+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:57] Scryfall /cards/search status=404 attempt=1/8
[20:10:57] Scryfall search returned no matches for q=((otag:"lifelink-counter" OR oracle:/\bLifelink Counter\b/i)) type:aura -type:land id<=BGW game:paper lang:en
[20:10:57] Scryfall request /cards/search q=type%3Aaura+-type%3Aland+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:58] Scryfall /cards/search status=200 attempt=1/8
[20:10:58] Scryfall search count=175 q=type:aura -type:land id<=BGW game:paper lang:en
[20:10:58] Support card added: Wild Growth / source: synergy repair / reason: Scryfall type-control (a aura you control) for Kodama of the West Tree
[20:10:58] Synergy validation passed after 2 repair pass(es).
[20:10:58] Final non-land split: theme=14 support=9 creatures=16
[20:10:58] Average mana value: 2.85
[20:10:58] Virtual curve entries: 23
[20:10:58] Final land count: 20. Reason: 15 + average mana value 2.85 * 1.8, clamped to 15-25
[20:10:58] Pip counts: {"W":10.149999999999999,"U":0,"B":11.4,"R":0,"G":11.35} snowRequired=false snowMatters=false colorlessNeed=false
[20:10:58] Basic land allocation: Swamp, Swamp, Swamp, Swamp, Forest, Forest, Forest, Plains, Plains, Plains
[20:10:58] Scryfall request /cards/search q=%21%22Swamp%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:58] Scryfall /cards/search status=200 attempt=1/8
[20:10:58] Scryfall /cards/search:page status=200 attempt=1/8
[20:10:58] Scryfall search count=350 q=!"Swamp" include:extras unique:prints lang:en
[20:10:58] Scryfall request /cards/search q=%21%22Forest%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:58] Scryfall /cards/search status=200 attempt=1/8
[20:10:58] Scryfall /cards/search:page status=200 attempt=1/8
[20:10:58] Scryfall search count=350 q=!"Forest" include:extras unique:prints lang:en
[20:10:58] Scryfall request /cards/search q=%21%22Plains%22+include%3Aextras+unique%3Aprints+lang%3Aen&unique=prints&order=released&dir=asc
[20:10:59] Scryfall /cards/search status=200 attempt=1/8
[20:10:59] Scryfall /cards/search:page status=200 attempt=1/8
[20:10:59] Scryfall search count=350 q=!"Plains" include:extras unique:prints lang:en
[20:10:59] Random basic-land art set: USG
[20:10:59] Scryfall request /cards/search q=%28type%3Aland+%28otag%3A%22lifelink+counter%22+OR+oracle%3A%2F%5CbLifelink+Counter%5Cb%2Fi+OR+type%3A%22Lifelink+Counter%22%29%29+type%3Aland+-type%3Abasic+id%3C%3DBGW+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[20:10:59] Scryfall /cards/search status=429 attempt=1/8
[20:10:59] Scryfall waiting 800ms before retry
[20:11:00] Scryfall /cards/search status=429 attempt=2/8
[20:11:00] Scryfall waiting 1600ms before retry
[20:11:01] Scryfall /cards/search status=429 attempt=3/8
[20:11:01] Scryfall waiting 3200ms before retry
[20:11:04] Scryfall /cards/search status=429 attempt=4/8
[20:11:04] Scryfall waiting 6400ms before retry
[20:11:11] Scryfall /cards/search status=429 attempt=5/8
[20:11:11] Scryfall waiting 12800ms before retry
[20:11:24] Scryfall /cards/search status=429 attempt=6/8
[20:11:24] Scryfall waiting 15000ms before retry
[20:11:39] Scryfall /cards/search status=429 attempt=7/8
[20:11:39] Scryfall waiting 15000ms before retry
[20:11:54] Scryfall /cards/search status=429 attempt=8/8
[20:11:54] ERROR generation attempt 2: Scryfall transient 429 for /cards/search
```
