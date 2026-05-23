#!/usr/bin/env node
// Fetches EDHREC index pages and top-N theme synergy pages, writing JSON under
// public/data/edhrec/ so the runtime can read them same-origin without hitting
// json.edhrec.com (avoids browser 403 / CORS issues).
//
// Usage:
//   node scripts/prefetch-edhrec.js               # hard mode, exit non-zero on total failure
//   node scripts/prefetch-edhrec.js --soft        # warn-only, always exit 0 (used in prebuild)
//   node scripts/prefetch-edhrec.js --top-n=300   # override how many theme pages to mirror
//
// Output shape (minimized to keep the mirror small):
//   public/data/edhrec/pages/themes.json         <- full EDHREC index page JSON (unmodified)
//   public/data/edhrec/pages/themes/equipment.json   <- full per-theme page JSON
// We keep the full EDHREC shape so the same parser in src/lib/edhrecClient.js works.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'data', 'edhrec');

const EDHREC_API = 'https://json.edhrec.com';
const INDEX_PAGES = [
  { path: '/pages/themes.json',   category: 'themes' },
  { path: '/pages/tribes.json',   category: 'tribes' },
  { path: '/pages/typal.json',    category: 'typal'  },
  { path: '/pages/keywords.json', category: null     }, // keywords -> per-page lives under themes/
];

const REQUEST_GAP_MS = 250;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const args = { soft: false, topN: 1000 };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--soft') args.soft = true;
    else if (arg.startsWith('--top-n=')) args.topN = parseInt(arg.slice('--top-n='.length), 10) || 1000;
  }
  return args;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'mtg-deck-generator prefetch (github.com/Share1352/mtg-deck-generator)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function writeJson(absPath, data) {
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, JSON.stringify(data));
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectThemeSlugsFromIndex(data, defaultCategory) {
  const lists = data?.container?.json_dict?.card_lists
    || data?.json_dict?.card_lists
    || data?.cardlists
    || data?.card_lists
    || [];
  const out = [];
  for (const list of lists) {
    const items = list?.cardviews || list?.cards || [];
    for (const item of items) {
      const name = item?.name || item?.cardview?.name;
      if (!name) continue;
      const slug = slugify(name);
      if (!slug) continue;
      const url = item?.url || item?.sanitized_url || '';
      // Try to extract category from URL like "/themes/equipment" or "/tribes/myr"
      let category = defaultCategory;
      const m = String(url).match(/\/(themes|tribes|typal|commanders)\//);
      if (m) category = m[1];
      out.push({ slug, category });
    }
  }
  return out;
}

async function main() {
  const { soft, topN } = parseArgs();
  console.log(`prefetch-edhrec: soft=${soft} topN=${topN}`);
  let hadAnyFailure = false;
  let hadAnySuccess = false;
  let indexPagesFetched = 0;
  const slugQueue = []; // [{slug, category}]
  const seenSlug = new Set();

  // 1. Index pages
  for (const { path, category } of INDEX_PAGES) {
    const url = `${EDHREC_API}${path}`;
    try {
      const data = await fetchJson(url);
      const out = join(OUT_DIR, path.replace(/^\//, ''));
      await writeJson(out, data);
      hadAnySuccess = true;
      indexPagesFetched += 1;
      const slugs = collectThemeSlugsFromIndex(data, category || 'themes');
      for (const entry of slugs) {
        const key = `${entry.category}/${entry.slug}`;
        if (seenSlug.has(key)) continue;
        seenSlug.add(key);
        slugQueue.push(entry);
      }
      console.log(`prefetch-edhrec: wrote ${path} (${slugs.length} slugs discovered)`);
    } catch (e) {
      hadAnyFailure = true;
      console.warn(`prefetch-edhrec: index ${path} failed: ${e.message}`);
    }
    await wait(REQUEST_GAP_MS);
  }

  // 2. Top-N theme pages
  const targets = slugQueue.slice(0, topN);
  let okCount = 0;
  let failCount = 0;
  for (const { slug, category } of targets) {
    const path = `/pages/${category}/${slug}.json`;
    const url = `${EDHREC_API}${path}`;
    try {
      const data = await fetchJson(url);
      const out = join(OUT_DIR, path.replace(/^\//, ''));
      await writeJson(out, data);
      okCount += 1;
      hadAnySuccess = true;
    } catch (e) {
      failCount += 1;
      // 404 is normal (slug not present in this category); only log other failures
      if (!/HTTP 404/.test(e.message)) console.warn(`prefetch-edhrec: ${path} failed: ${e.message}`);
    }
    await wait(REQUEST_GAP_MS);
  }
  console.log(`prefetch-edhrec: per-theme wrote=${okCount} failed=${failCount} of ${targets.length}`);

  // 3. Write manifest so the runtime can log mirror coverage at startup
  if (hadAnySuccess) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      indexPagesFetched,
      themePagesFetched: okCount,
      failedPages: failCount,
      topN,
      totalDiscoveredSlugs: slugQueue.length,
    };
    await writeJson(join(OUT_DIR, 'manifest.json'), manifest);
    console.log(`prefetch-edhrec: wrote manifest.json (themePagesFetched=${okCount})`);
  }

  if (!hadAnySuccess) {
    const msg = 'prefetch-edhrec: no EDHREC data could be fetched.';
    if (soft) { console.warn(`${msg} Continuing (soft mode).`); process.exit(0); }
    else { console.error(msg); process.exit(1); }
  }
  if (hadAnyFailure && !soft) process.exitCode = 0;
}

main().catch((e) => {
  console.error('prefetch-edhrec: fatal error', e);
  const soft = process.argv.includes('--soft');
  process.exit(soft ? 0 : 1);
});
