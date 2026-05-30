# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to `main`.
> Confirm the generator still works — status below should be `OK` and the deck list / log should look sane —
> **before** starting any new feature. If status is `FAILED`, fix that first.

| Field | Value |
| --- | --- |
| Status | FAILED ❌ |
| Generated | 2026-05-30T13:00:42.654Z |
| Commit | `a747349ef76ff7de348c2b6ea642a0f945ef71c7` |
| Theme | n/a |
| Colors | n/a |
| Counts | n/a |
| Seed | 1780146042654 |
| CI run | https://github.com/Share1352/mtg-deck-generator/actions/runs/26684444012 |

**Error:** `Generation failed after retries: Theme Capybara rejected: only 1 direct theme cards found; minimum is 10.`

## Deck list

```
(no deck produced — see log below)
```

## Full generation log

```
[13:00:42] START v2.0.0 seed=1780146042654
[13:00:42] Scryfall request /catalog/keyword-abilities 
[13:00:42] Scryfall Oracle Tagger themes: 5238 functional tags from https://scryfall.com/docs/tagger-tags
[13:00:42] Scryfall /catalog/keyword-abilities status=200 attempt=1/8
[13:00:42] Scryfall catalog keyword-abilities: 218 entries
[13:00:42] Scryfall request /catalog/keyword-actions 
[13:00:43] Scryfall /catalog/keyword-actions status=200 attempt=1/8
[13:00:43] Scryfall catalog keyword-actions: 73 entries
[13:00:43] Scryfall request /catalog/ability-words 
[13:00:43] Scryfall /catalog/ability-words status=200 attempt=1/8
[13:00:43] Scryfall catalog ability-words: 70 entries
[13:00:43] Scryfall request /catalog/creature-types 
[13:00:43] Scryfall /catalog/creature-types status=200 attempt=1/8
[13:00:43] Scryfall catalog creature-types: 329 entries
[13:00:43] Loaded 690 keyword/mechanic/type entries from Scryfall catalogs.
[13:00:43] Loaded 32 color-combination themes.
[13:00:43] Candidate themes after dedupe/bans: 5843
[13:00:43] Banned theme count: 42
[13:00:43] Attempt 1: selected theme: Cycle Tla C Hybrid / tagger / source: Scryfall Oracle Tagger
[13:00:43] Scryfall request /cards/search q=otag%3A%22cycle-tla-c-hybrid%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:00:43] Scryfall /cards/search status=200 attempt=1/8
[13:00:43] Scryfall search count=10 q=otag:"cycle-tla-c-hybrid" game:paper lang:en
[13:00:43] ERROR generation attempt 1: Theme Cycle Tla C Hybrid rejected: only 0 direct theme cards found; minimum is 10.
[13:00:43] Rerolled theme "Cycle Tla C Hybrid" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Cycle Tla C Hybrid rejected: only 0 direct theme cards found; minimum is 10.
[13:00:43] Attempt 2: selected theme: Cycle Clb God / tagger / source: Scryfall Oracle Tagger
[13:00:43] Scryfall request /cards/search q=otag%3A%22cycle-clb-god%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:00:43] Scryfall /cards/search status=200 attempt=1/8
[13:00:43] Scryfall search count=3 q=otag:"cycle-clb-god" game:paper lang:en
[13:00:43] ERROR generation attempt 2: Theme Cycle Clb God rejected: only 3 direct theme cards found; minimum is 10.
[13:00:43] Rerolled theme "Cycle Clb God" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Cycle Clb God rejected: only 3 direct theme cards found; minimum is 10.
[13:00:43] Attempt 3: selected theme: Tutor Creature Vampire / tagger / source: Scryfall Oracle Tagger
[13:00:43] Scryfall request /cards/search q=otag%3A%22tutor-creature-vampire%22+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:00:44] Scryfall /cards/search status=200 attempt=1/8
[13:00:44] Scryfall search count=1 q=otag:"tutor-creature-vampire" game:paper lang:en
[13:00:44] ERROR generation attempt 3: Theme Tutor Creature Vampire rejected: only 1 direct theme cards found; minimum is 10.
[13:00:44] Rerolled theme "Tutor Creature Vampire" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Tutor Creature Vampire rejected: only 1 direct theme cards found; minimum is 10.
[13:00:44] Attempt 4: selected theme: Capybara / typal / source: Scryfall creature-types
[13:00:44] Scryfall request /cards/search q=%28type%3A%22Capybara%22+OR+oracle%3A%2F%5CbCapybara%5Cb%2Fi+OR+oracle%3A%2F%5CbCapybaras%5Cb%2Fi%29+game%3Apaper+lang%3Aen&unique=cards&order=edhrec&dir=asc
[13:00:44] Scryfall /cards/search status=200 attempt=1/8
[13:00:44] Scryfall search count=1 q=(type:"Capybara" OR oracle:/\bCapybara\b/i OR oracle:/\bCapybaras\b/i) game:paper lang:en
[13:00:44] ERROR generation attempt 4: Theme Capybara rejected: only 1 direct theme cards found; minimum is 10.
[13:00:44] Rerolled theme "Capybara" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: Theme Capybara rejected: only 1 direct theme cards found; minimum is 10.
```
