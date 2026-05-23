#!/usr/bin/env node
// Fetches EDHREC index pages and top-N theme synergy pages, writing JSON under
// public/data/edhrec/ so the runtime can read them same-origin without hitting
// json.edhrec.com (avoids browser 403 / CORS issues).
//
// Usage:
//   node scripts/prefetch-edhrec.js               # hard mode, exit non-zero on total failure
//   node scripts/prefetch-edhrec.js --soft        # warn-only, always exit 0 (used in prebuild)
//   node scripts/prefetch-edhrec.js --top-n=300   # override how many theme pages to mirror
//   node scripts/prefetch-edhrec.js --allow-stale # use existing local files as first source

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

export const DEFAULT_OUT_DIR = join(ROOT, 'public', 'data', 'edhrec');

const GITHUB_MIRROR_BASE =
  'https://raw.githubusercontent.com/Share1352/mtg-deck-generator/data/edhrec-mirror/public/data/edhrec';
const EDHREC_API = 'https://json.edhrec.com';

export const INDEX_PAGES = [
  { path: '/pages/themes.json',   category: 'themes', required: true  },
  { path: '/pages/tribes.json',   category: 'tribes', required: true  },
  { path: '/pages/typal.json',    category: 'typal',  required: false },
  { path: '/pages/keywords.json', category: null,     required: false },
];

export const EMPTY_STUB = { container: { json_dict: { card_lists: [] } } };

const FETCH_HEADERS = {
  'User-Agent': 'mtg-deck-generator prefetch (github.com/Share1352/mtg-deck-generator)',
  'Accept': 'application/json,text/plain,*/*',
};

export class PrefetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PrefetchError';
  }
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { soft: false, topN: 1000, allowStale: false };
  for (const arg of argv) {
    if (arg === '--soft') args.soft = true;
    else if (arg === '--allow-stale') args.allowStale = true;
    else if (arg.startsWith('--top-n=')) args.topN = parseInt(arg.slice('--top-n='.length), 10) || 1000;
  }
  return args;
}

export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse category and slug from an EDHREC URL like "/themes/equipment" or "/tribes/myr".
export function parseSlugFromUrl(url) {
  const m = String(url).match(/\/(themes|tribes|typal)\/([a-z0-9][a-z0-9-]*)/);
  if (m) return { category: m[1], slug: m[2] };
  return null;
}

// Normalize data returned by _next/data: follow pageProps.data wrapper and
// rename cardlists → card_lists so the runtime parser sees a consistent shape.
export function normalizeNextData(data) {
  // Unwrap pageProps.data wrapper present in _next/data responses
  const unwrapped = data?.pageProps?.data ?? data;
  // Rename cardlists → card_lists at the expected nesting path
  const jd = unwrapped?.container?.json_dict;
  if (jd && jd.cardlists && !jd.card_lists) {
    jd.card_lists = jd.cardlists;
  }
  return unwrapped;
}

// Collect {category, slug} targets from an EDHREC index page JSON.
// Prefers URL-based extraction; falls back to slugifying the display name.
export function collectTargetsFromIndex(data, defaultCategory) {
  const lists =
    data?.container?.json_dict?.card_lists ||
    data?.container?.json_dict?.cardlists ||
    data?.json_dict?.card_lists ||
    data?.cardlists ||
    data?.card_lists ||
    [];
  const out = [];
  for (const list of lists) {
    const items = list?.cardviews || list?.cards || [];
    for (const item of items) {
      const url = item?.url || item?.sanitized_url || '';
      // 1. Try /themes/, /tribes/, /typal/ full URL parse
      const parsed = parseSlugFromUrl(url);
      if (parsed) { out.push(parsed); continue; }
      // 2. Handle /tags/ URLs — EDHREC now routes everything through /tags/
      const tagsM = String(url).match(/\/tags\/([a-z0-9][a-z0-9-]*)/);
      if (tagsM) {
        out.push({ slug: tagsM[1], category: defaultCategory || 'themes' });
        continue;
      }
      // 3. Fallback: slugify display name
      const name = item?.name || item?.cardview?.name;
      if (!name) continue;
      const slug = slugify(name);
      if (!slug) continue;
      const catMatch = String(url).match(/\/(themes|tribes|typal|commanders)\//);
      out.push({ slug, category: catMatch ? catMatch[1] : (defaultCategory || 'themes') });
    }
  }
  return out;
}

// Round-robin selection so no single category fills the quota.
export function balancedSelect(items, n) {
  const byCategory = new Map();
  for (const item of items) {
    const cat = item.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(item);
  }
  const categories = [...byCategory.keys()];
  const indices = Object.fromEntries(categories.map((c) => [c, 0]));
  const result = [];
  while (result.length < n) {
    let added = false;
    for (const cat of categories) {
      if (result.length >= n) break;
      const list = byCategory.get(cat);
      const idx = indices[cat];
      if (idx < list.length) {
        result.push(list[idx]);
        indices[cat] = idx + 1;
        added = true;
      }
    }
    if (!added) break;
  }
  return result;
}

async function fetchJsonSafe(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchTextSafe(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

let _cachedBuildId = null;
async function getEdhrecBuildId() {
  if (_cachedBuildId) return _cachedBuildId;
  const html = await fetchTextSafe('https://edhrec.com/');
  const m = html.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!m) throw new Error('no buildId in edhrec.com HTML');
  _cachedBuildId = m[1];
  return _cachedBuildId;
}

function pathToNextData(path) {
  return path.replace(/^\/pages\//, '/');
}

function wrapProxyUrl(provider, target) {
  const enc = encodeURIComponent(target);
  switch (provider) {
    case 'corsproxy.io': return `https://corsproxy.io/?${enc}`;
    case 'allorigins':   return `https://api.allorigins.win/raw?url=${enc}`;
    case 'codetabs':     return `https://api.codetabs.com/v1/proxy?quest=${target}`;
    default: throw new Error(`unknown proxy: ${provider}`);
  }
}

// Try each source in order; return {data, source} on first success or throw if all fail.
// No internal rate-limiting delays — caller is responsible for pacing.
export async function fetchPathWithFallbacks(path, { allowStale = false, outDir = DEFAULT_OUT_DIR } = {}) {
  const localPath = join(outDir, path.replace(/^\//, ''));

  // Source 1: stale local file (only when --allow-stale and file exists)
  if (allowStale && existsSync(localPath)) {
    try {
      const data = JSON.parse(readFileSync(localPath, 'utf8'));
      // Skip stale files that are Next.js redirect responses (stale bad data)
      if (data?.pageProps?.__N_REDIRECT) {
        console.warn(`  [local-stale] skipping ${path}: stale file is a redirect response, fetching fresh`);
      } else {
        console.log(`  [local-stale] hit ${path}`);
        return { data, source: 'local-stale' };
      }
    } catch (e) {
      console.warn(`  [local-stale] failed ${path}: ${e.message}`);
    }
  }

  // Source 2: GitHub raw mirror branch
  try {
    const url = `${GITHUB_MIRROR_BASE}${path}`;
    console.log(`  [gh-mirror-raw] trying ${url}`);
    const data = await fetchJsonSafe(url);
    console.log(`  [gh-mirror-raw] success ${path}`);
    return { data, source: 'gh-mirror-raw' };
  } catch (e) {
    console.warn(`  [gh-mirror-raw] failed ${path}: ${e.message}`);
  }

  // Source 3: direct json.edhrec.com
  try {
    const url = `${EDHREC_API}${path}`;
    console.log(`  [direct-edhrec-json] trying ${url}`);
    const data = await fetchJsonSafe(url);
    console.log(`  [direct-edhrec-json] success ${path}`);
    return { data, source: 'direct-edhrec-json' };
  } catch (e) {
    if (e.message.includes('HTTP 403')) {
      console.warn(`  [direct-edhrec-json] returned 403 for ${path}, trying fallbacks`);
    } else {
      console.warn(`  [direct-edhrec-json] failed ${path}: ${e.message}`);
    }
  }

  // Source 4: EDHREC _next/data hydration (buildId can rotate; EDHREC may redirect old paths to /tags/)
  try {
    const buildId = await getEdhrecBuildId();
    const nextPath = pathToNextData(path);
    const url = `https://edhrec.com/_next/data/${buildId}${nextPath}`;
    console.log(`  [edhrec-next-data] trying ${url}`);
    let raw = await fetchJsonSafe(url);

    // Follow one level of Next.js server-side redirect (e.g. /themes.json → /tags/themes)
    if (raw?.pageProps?.__N_REDIRECT) {
      const redirectTarget = raw.pageProps.__N_REDIRECT;
      const redirectUrl = `https://edhrec.com/_next/data/${buildId}${redirectTarget}.json`;
      console.log(`  [edhrec-next-data] redirect → ${redirectUrl}`);
      raw = await fetchJsonSafe(redirectUrl);
      if (raw?.pageProps?.__N_REDIRECT) {
        throw new Error(`double redirect to ${raw.pageProps.__N_REDIRECT}`);
      }
    }

    const data = normalizeNextData(raw);
    console.log(`  [edhrec-next-data] success ${path}`);
    return { data, source: 'edhrec-next-data' };
  } catch (e) {
    console.warn(`  [edhrec-next-data] failed ${path}: ${e.message}`);
  }

  // Source 5: public CORS proxies
  for (const provider of ['corsproxy.io', 'allorigins', 'codetabs']) {
    try {
      const target = `${EDHREC_API}${path}`;
      const url = wrapProxyUrl(provider, target);
      console.log(`  [cors-proxy/${provider}] trying ${url}`);
      const data = await fetchJsonSafe(url);
      console.log(`  [cors-proxy/${provider}] success ${path}`);
      return { data, source: `cors-proxy/${provider}` };
    } catch (e) {
      console.warn(`  [cors-proxy/${provider}] failed ${path}: ${e.message}`);
      if (e.message.includes('HTTP 404')) break;
    }
  }

  throw new Error(`all sources failed for ${path}`);
}

async function writeJson(absPath, data) {
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, JSON.stringify(data));
}

export async function runPrefetch({
  soft = false,
  topN = 1000,
  allowStale = false,
  outDir = DEFAULT_OUT_DIR,
  _requestGapMs = 250,
} = {}) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  console.log(`prefetch-edhrec: soft=${soft} topN=${topN} allowStale=${allowStale}`);

  let indexPagesFetched = 0;
  let indexPagesStubbed = 0;
  const allTargets = [];
  const seenKey = new Set();
  const sourceCounts = {};
  let fetchedFreshAt = null;
  const failedRequiredPages = [];
  const failedPages = [];
  const errorsPreview = [];

  function countSource(src) {
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    if (src !== 'local-stale' && src !== 'stub') fetchedFreshAt = new Date().toISOString();
  }

  // Step 1: index pages
  for (const { path, category, required } of INDEX_PAGES) {
    console.log(`prefetch-edhrec: fetching index ${path} (required=${required})`);
    try {
      const { data, source } = await fetchPathWithFallbacks(path, { allowStale, outDir });
      await writeJson(join(outDir, path.replace(/^\//, '')), data);
      indexPagesFetched++;
      countSource(source);

      const targets = collectTargetsFromIndex(data, category || 'themes');
      for (const t of targets) {
        const key = `${t.category}/${t.slug}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          allTargets.push(t);
        }
      }
      console.log(`prefetch-edhrec: wrote ${path} via ${source} (${targets.length} slugs)`);
    } catch (e) {
      if (required) {
        const msg = `REQUIRED index ${path} failed: ${e.message}`;
        console.error(`prefetch-edhrec: ${msg}`);
        errorsPreview.push(msg);
        failedRequiredPages.push(path);
      } else {
        console.warn(`prefetch-edhrec: optional index ${path} failed (${e.message}), writing stub`);
        await writeJson(join(outDir, path.replace(/^\//, '')), EMPTY_STUB);
        indexPagesStubbed++;
        countSource('stub');
        errorsPreview.push(`optional ${path}: ${e.message}`);
      }
    }
    await wait(_requestGapMs);
  }

  // Hard fail if any required index pages could not be fetched
  if (failedRequiredPages.length > 0) {
    const msg = `required index pages failed and no stale copy exists: ${failedRequiredPages.join(', ')}`;
    if (soft) {
      console.warn(`prefetch-edhrec: ${msg} Continuing (soft mode).`);
      return { errored: true };
    }
    throw new PrefetchError(msg);
  }

  // Step 2: balanced top-N per-theme/tribe pages
  const balancedTargets = balancedSelect(allTargets, topN);
  console.log(`prefetch-edhrec: selected ${balancedTargets.length} balanced targets across categories`);

  let themePagesFetched = 0;
  let themePagesFailed = 0;

  for (const { slug, category } of balancedTargets) {
    const path = `/pages/${category}/${slug}.json`;
    try {
      const { data, source } = await fetchPathWithFallbacks(path, { allowStale, outDir });
      await writeJson(join(outDir, path.replace(/^\//, '')), data);
      themePagesFetched++;
      countSource(source);
    } catch (e) {
      themePagesFailed++;
      if (!e.message.includes('HTTP 404')) {
        console.warn(`prefetch-edhrec: ${path} failed: ${e.message}`);
        if (errorsPreview.length < 10) errorsPreview.push(`${path}: ${e.message}`);
      }
      failedPages.push(path);
    }
    await wait(_requestGapMs);
  }

  console.log(
    `prefetch-edhrec: per-theme fetched=${themePagesFetched} failed=${themePagesFailed} of ${balancedTargets.length}`,
  );

  // Step 3: write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    fetchedFreshAt,
    topN,
    indexPagesFetched,
    indexPagesStubbed,
    themePagesFetched,
    failedPages: failedPages.slice(0, 50),
    totalDiscoveredSlugs: allTargets.length,
    sourceCounts,
    staleFilesUsed: sourceCounts['local-stale'] || 0,
    errorsPreview: errorsPreview.slice(0, 10),
  };
  if ((sourceCounts['local-stale'] || 0) >= Math.max(1, themePagesFetched + indexPagesFetched - 1)) {
    console.warn('prefetch-edhrec: WARNING most files came from local-stale fallback.');
  }
  await writeJson(join(outDir, 'manifest.json'), manifest);
  console.log(
    `prefetch-edhrec: wrote manifest.json (themePagesFetched=${themePagesFetched}, ` +
      `indexPagesFetched=${indexPagesFetched}, stubbed=${indexPagesStubbed})`,
  );

  if (themePagesFetched === 0 && indexPagesFetched === 0) {
    const msg = 'no EDHREC data could be fetched';
    if (soft) { console.warn(`prefetch-edhrec: ${msg}. Continuing (soft mode).`); }
    else { throw new PrefetchError(msg); }
  }

  return manifest;
}

// Only run as CLI when executed directly (not when imported in tests)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs();
  runPrefetch(args).catch((e) => {
    if (e instanceof PrefetchError) {
      console.error(`prefetch-edhrec: ${e.message}`);
    } else {
      console.error('prefetch-edhrec: fatal error', e);
    }
    process.exit(args.soft ? 0 : 1);
  });
}
