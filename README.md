# MTG Theme Deck Generator

A one-button Vite + React app that forges a small casual 1v1 Magic: The Gathering theme deck. It is **not Commander**. The app picks a completely random theme/tribe/keyword/mechanic from online card databases, builds 23 non-land cards faithful to that theme, adds 15-25 lands, displays card images, exports a decklist, and exposes a full debug log.

## Online only

This app **does not store cards offline**. It calls live online card databases for everything:

- **EDHREC** (`https://json.edhrec.com`) — theme/tribe/typal/keyword index pages and high-synergy card lists per theme.
- **Scryfall** (`https://api.scryfall.com`) — catalog endpoints (`keyword-abilities`, `keyword-actions`, `ability-words`, `creature-types`) for the master mechanic/keyword/type list, plus `/cards/search`, `/cards/random`, and `/cards/named` for every card lookup.

If either source is temporarily unavailable, the clients wait and retry with exponential backoff. If they remain unreachable, the app fails with a clear "Online card databases unreachable" message instead of silently substituting fake or cached cards. The only data shipped with the bundle is exclusion data (banned themes, banned card names, crossover set policy) — never positive card lists.

## Open the hosted app

After changes are merged to `main`, GitHub Actions publishes the static build to GitHub Pages:

- Live app: <https://share1352.github.io/mtg-deck-generator/>
- Auto-forge link: <https://share1352.github.io/mtg-deck-generator/?forge=1>

The normal link opens on the single `FORGE DECK` button. Add `?forge=1`, `?autoforge=true`, or `?start` to the URL to begin the forge as soon as the page loads. You can also run `npm run open:live` to print both links in a terminal.

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm run test
npm run build
npm run preview
```

Vite is configured with `base: "/mtg-deck-generator/"` so the built app works on GitHub Pages at `https://share1352.github.io/mtg-deck-generator/`.

## Offline CI toolchain

The repository vendors tiny local package shims under `vendor/` for `vite`, `vitest`, `react`, `react-dom`, `@vitejs/plugin-react`, and `lucide-react`. These shims are CI tooling — they exist so `npm install`, `npm run test`, `npm run build`, and `npm run preview` work in restricted environments where the npm registry/proxy returns `403 Forbidden`. They are not card data.

## Deployment

`.github/workflows/deploy.yml` installs dependencies, runs Vitest, builds the static app, and deploys `dist/` to GitHub Pages.

## How a deck is built

1. **Theme pool** is assembled at runtime by combining the EDHREC theme/tribe/typal/keyword index pages with Scryfall's keyword and creature-type catalogs. The pool is deduped and the banned-theme list is applied.
2. **One theme is picked uniformly at random** from the merged pool — every theme, even tiny ones, has equal probability.
3. **Colors are chosen** from the theme's card pool using the dominance rules (60% threshold, multicolor exception, deliberate logged expansion when a pool is too small).
4. The 23 non-land cards are split **60% on-theme / 40% support**:
   - **~14 on-theme** — half are random picks among the theme's high EDHREC-rated cards (Scryfall `order:edhrec`), half are random theme cards drawn from all of MTG history.
   - **~9 support** — chosen by a per-archetype support engine (`supportProfiles.js`) plus the theme-family classifier so the theme actually functions: tribal lords/changelings/kindred hardware for typal themes; enchantress payoffs and resilient creatures for Auras; bodies/payoffs for Equipment, Vehicles and Saddle; defender + toughness-matters payoffs for Walls; spell payoffs, aristocrats, tokens, counters, landfall, graveyard, lifegain, artifacts, and enchantments otherwise.
5. **Every explicit synergy is honored.** Search/tutor effects get guaranteed targets; named-card references (and "control an X" permanents such as Urza tron pieces or a named planeswalker) are pulled in; cards that care about a type of permanent ("control a Dragon", "Vehicles you control") get that type present; and self-referencing "any number" cards (Relentless Rats, Dragon's Approach, …) run as a playset. A creature floor keeps every deck able to win.
6. **Mana base (15-25 lands)** is sized by virtual curve and split 50/50 basics/non-basics. Basics all use one randomly chosen expansion's art per generation; non-basics roll an alternate printing 30% of the time. For two-or-more-color decks ~80% of non-basics fix the deck's own colors and ~20% are theme/utility lands. Colorless `{C}` (Eldrazi) and snow sources are guaranteed when the spells need them, off-color fetchlands are rejected, and land-to-land dependencies (tron, etc.) are completed.

Use **Copy whole log** after a deck is forged to troubleshoot card filtering, color choice, fallback choices, and mana base decisions.

## Design notes

- First screen is only the `FORGE DECK` button.
- Theme selection is uniform after merging EDHREC themes and Scryfall keyword/type catalogs; any of MTG's creature types is recognised as a typal theme.
- Filters reject Commander-only, side-deck, playtest, digital-only, token/object, off-color support, and banned crossover cards while allowing normal Planeswalkers and standalone playable Un-set/acorn cards.
- Card selection is 60% on-theme (half high-EDHREC, half random all-time) and 40% archetype-aware support, with a creature floor and full synergy/tutor/named-card/type-of-card repair.
- Mana bases use a 50/50 basic/non-basic split with pip-aware basics; 2+ color decks fix their own colors with ~80% of non-basics; colorless and snow sources are guaranteed when needed; basic art is one random expansion per generation and non-basics have a 30% alternate-art chance.
- If EDHREC or Scryfall is unreachable the app surfaces the failure honestly — it never fabricates cards.
