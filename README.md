# MTG Theme Deck Generator

A one-button Vite + React app that forges a small casual 1v1 Magic: The Gathering theme deck. It is **not Commander**: the app chooses a fair random theme, builds 23 non-land cards, adds 15-25 lands, displays card images, exports a decklist, and exposes a full debug log.


## Open the hosted app

After changes are merged to `main`, GitHub Actions publishes the static build to GitHub Pages:

- Live app: <https://share1352.github.io/mtg-deck-generator/>
- Auto-forge link: <https://share1352.github.io/mtg-deck-generator/?forge=1>

The normal link opens on the single `FORGE DECK` button. Add `?forge=1`, `?autoforge=true`, or `?start` to the URL when you want the deck forge to begin as soon as the page loads. You can also run `npm run open:live` to print both links in a terminal.

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

This repository vendors tiny local package shims under `vendor/` for `vite`, `vitest`, `react`, `react-dom`, `@vitejs/plugin-react`, and `lucide-react`. They exist so `npm install`, `npm run test`, `npm run build`, and `npm run preview` work in restricted environments where the npm registry/proxy returns `403 Forbidden`. The public package names and scripts remain the same, and the lockfile points at these local `file:` packages.

## Deployment

The repository includes `.github/workflows/deploy.yml`, which installs dependencies, runs Vitest, builds the static app, and deploys `dist/` to GitHub Pages.

## Data and limitations

EDHREC high-synergy data is represented by a starter static cache in `public/data/edhrec-synergy-cache.json`. When a generated theme is not present in that cache, the debug log honestly states that the app is using Scryfall otag/mechanical fallback rather than pretending Scryfall popularity is EDHREC theme synergy.

Generation uses the live Scryfall API, so network failures or rate limits can cause a generation retry. Use **Copy whole log** after a deck is forged to troubleshoot card filtering, color choice, fallback choices, and mana base decisions.

## Design notes

- First screen is only the `FORGE DECK` button.
- Theme selection is uniform after merging cached EDHREC tags, catalog fallback terms, and a hardcoded safety list.
- Filters reject Commander-only, side-deck, playtest, digital-only, token/object, and banned crossover cards while allowing normal Planeswalkers and standalone playable Un-set/acorn cards.
- Mana bases use a 50/50 basic/non-basic split, pip-aware basics, snow conversion when required, compatible non-basics, and fetchland guardrails.
