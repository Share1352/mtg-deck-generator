import { tryAllSources, AllSourcesFailedError, _resetSourcesCache } from './edhrecSources.js';

const EDHREC_API = 'https://json.edhrec.com';

const cache = new Map();

export class EdhrecError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'EdhrecError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

// Kept for backward compatibility with tests / callers that tuned retry behavior.
// The new source orchestrator manages retries per-source internally.
const retry = { maxAttempts: 6, baseBackoffMs: 800, maxBackoffMs: 15000 };
export function configureEdhrecRetry(overrides = {}) { Object.assign(retry, overrides); }

const THEME_ALIASES = {
  equip: 'equipment',
  crew: 'vehicles',
  auras: 'aura',
  ramp: 'ramp',
};

export function canonicalSynergyTag(tag) {
  const raw = String(tag?.name || tag || '').trim();
  const lower = raw.toLowerCase();
  return THEME_ALIASES[lower] || raw;
}

export function slugifyTheme(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function edhrecFetch(path, { logger } = {}) {
  const cached = cache.get(path);
  if (cached) {
    if (cached.error) {
      logger?.line(`EDHREC cache hit ${path} (prior failure: ${cached.error.message})`);
      throw cached.error;
    }
    logger?.line(`EDHREC cache hit ${path}`);
    return cached.data;
  }
  try {
    const { data, sourceId } = await tryAllSources(path, { logger });
    cache.set(path, { data });
    if (logger) logger.lastEdhrecSourceId = sourceId;
    return data;
  } catch (error) {
    if (error instanceof AllSourcesFailedError) {
      const status = error.status || 0;
      const msg = status === 404
        ? `EDHREC 404 for ${path}`
        : status === 403
          ? `EDHREC unavailable (403) for ${path} after trying all sources`
          : `EDHREC fetch failed for ${path}: ${error.message}`;
      const edhrecErr = new EdhrecError(msg, status, `${EDHREC_API}${path}`);
      cache.set(path, { error: edhrecErr });
      throw edhrecErr;
    }
    throw error;
  }
}

function collectCardLists(data) {
  const out = [];
  const lists = data?.container?.json_dict?.card_lists
    || data?.container?.json_dict?.cardlists
    || data?.json_dict?.card_lists
    || data?.cardlists
    || data?.card_lists
    || [];
  for (const list of lists) {
    const items = list?.cardviews || list?.cards || [];
    out.push({ header: String(list?.header || list?.tag || '').toLowerCase(), items });
  }
  return out;
}

// Sections on a per-theme EDHREC page that contain real card recommendations.
// Skip commander rosters (Top Commanders / New Commanders) and land utility lists
// (those are mostly noise for a non-Commander theme deck — generic lands like
// Command Tower, Reliquary Tower, etc.). Everything else is fair game.
const SYNERGY_SECTION_PATTERNS = [
  /high\s*[- ]?synergy/i,
  /^top\s*cards?$/i,
  /game\s*changers?/i,
  /^new\s*cards?$/i,
  /^creatures?$/i,
  /^instants?$/i,
  /^sorceries$/i,
  /^enchantments?$/i,
  /^planeswalkers?$/i,
  /^battles?$/i,
  /utility\s*artifacts?/i,
  /mana\s*artifacts?/i,
  /^artifacts?$/i,
];

const SYNERGY_SECTION_SKIP = [
  /commanders?/i,
  /\blands?\b/i,
];

function isSynergySection(header) {
  const h = String(header || '');
  if (SYNERGY_SECTION_SKIP.some((re) => re.test(h))) return false;
  return SYNERGY_SECTION_PATTERNS.some((re) => re.test(h));
}

function isHighSynergyHeader(header) {
  return /high\s*[- ]?synergy|top\s*synergy/i.test(String(header || ''));
}

function synergyScore(item) {
  const n = Number(item?.synergy);
  return Number.isFinite(n) ? n : 0;
}

function extractCardNames(data) {
  const names = [];
  for (const list of collectCardLists(data)) {
    for (const item of list.items) {
      const name = item?.name || item?.cardview?.name || item?.card_name;
      if (name) names.push(String(name));
    }
  }
  return names;
}

function extractThemeEntries(data, source) {
  const out = [];
  for (const list of collectCardLists(data)) {
    for (const item of list.items) {
      const name = item?.name || item?.cardview?.name || item?.card_name;
      if (!name) continue;
      const url = item?.url || item?.sanitized_url || '';
      const category = list.header || source;
      out.push({ name: String(name), category, source, url });
    }
  }
  return out;
}

const THEME_INDEX_PAGES = [
  { path: '/pages/themes.json', source: 'EDHREC themes' },
  { path: '/pages/tribes.json', source: 'EDHREC tribes' },
  { path: '/pages/typal.json', source: 'EDHREC typal' },
  { path: '/pages/keywords.json', source: 'EDHREC keywords' },
];

export async function getAllEdhrecThemes({ logger } = {}) {
  const out = [];
  const errors = [];
  for (const { path, source } of THEME_INDEX_PAGES) {
    try {
      const data = await edhrecFetch(path, { logger });
      const entries = extractThemeEntries(data, source);
      logger?.line(`EDHREC ${path}: parsed ${entries.length} theme entries`);
      out.push(...entries);
    } catch (error) {
      if (error instanceof EdhrecError && error.status === 404) {
        logger?.line(`EDHREC ${path}: 404 — page not exposed, skipping`);
        continue;
      }
      errors.push(error);
      logger?.line(`EDHREC ${path}: ${error.message}`);
    }
  }
  if (!out.length) {
    const detail = errors.map((e) => e.message).join('; ') || 'no EDHREC theme pages reachable';
    throw new EdhrecError(`Unable to fetch any EDHREC theme list: ${detail}`, 0, EDHREC_API);
  }
  return out;
}

const THEME_PAGE_CATEGORIES = ['themes', 'tribes', 'typal'];

// Pull as many synergy-relevant card names as the theme page exposes.
// Returns names ordered by section priority (High Synergy first), then by per-card
// synergy score descending within each section. Duplicates across sections are
// deduplicated, keeping the higher-priority placement.
//
// `maxNames` caps how many names we return — full theme pages can carry 300+ cards
// and each name becomes a Scryfall /cards/named lookup downstream, so a cap keeps
// builds responsive without losing meaningful synergy coverage.
export async function getSynergyCardsForTag(tag, { logger, maxNames = 120 } = {}) {
  const slug = slugifyTheme(canonicalSynergyTag(tag));
  if (!slug) return [];
  let lastError;
  for (const category of THEME_PAGE_CATEGORIES) {
    try {
      const data = await edhrecFetch(`/pages/${category}/${slug}.json`, { logger });
      const ordered = [];
      const seen = new Set();
      let highCount = 0;
      let breakdown = [];

      // Pass 1: explicit "High Synergy" sections (always front of list).
      for (const list of collectCardLists(data)) {
        if (!isHighSynergyHeader(list.header)) continue;
        const items = [...list.items].sort((a, b) => synergyScore(b) - synergyScore(a));
        let added = 0;
        for (const item of items) {
          const name = item?.name || item?.cardview?.name;
          if (!name) continue;
          const key = String(name).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          ordered.push(String(name));
          added += 1;
        }
        if (added) { highCount += added; breakdown.push(`${list.header}=${added}`); }
      }

      // Pass 2: every other synergy-relevant section (Top Cards, Creatures, Instants, ...).
      for (const list of collectCardLists(data)) {
        if (isHighSynergyHeader(list.header)) continue;
        if (!isSynergySection(list.header)) continue;
        const items = [...list.items].sort((a, b) => synergyScore(b) - synergyScore(a));
        let added = 0;
        for (const item of items) {
          const name = item?.name || item?.cardview?.name;
          if (!name) continue;
          const key = String(name).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          ordered.push(String(name));
          added += 1;
        }
        if (added) breakdown.push(`${list.header}=${added}`);
      }

      if (ordered.length) {
        const capped = ordered.slice(0, maxNames);
        logger?.line(`EDHREC /${category}/${slug}: ${ordered.length} synergy names (${highCount} from high-synergy section, returning top ${capped.length}) — sections: ${breakdown.join(', ')}`);
        return capped;
      }

      // Fallback: page exists but no recognized synergy section — take every name we can see.
      const allNames = extractCardNames(data);
      if (allNames.length) {
        const deduped = [];
        for (const name of allNames) {
          const key = String(name).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(String(name));
        }
        const capped = deduped.slice(0, maxNames);
        logger?.line(`EDHREC /${category}/${slug}: ${deduped.length} total card names (no explicit synergy section, returning top ${capped.length})`);
        return capped;
      }
    } catch (error) {
      if (error instanceof EdhrecError && error.status === 404) {
        logger?.line(`EDHREC /${category}/${slug}: 404 — not present`);
        continue;
      }
      lastError = error;
      logger?.line(`EDHREC /${category}/${slug}: ${error.message}`);
    }
  }
  if (lastError) throw lastError;
  return [];
}

export async function getRelatedSectionsForTag(tag, { logger } = {}) {
  const slug = slugifyTheme(canonicalSynergyTag(tag));
  if (!slug) return [];
  for (const category of THEME_PAGE_CATEGORIES) {
    try {
      const data = await edhrecFetch(`/pages/${category}/${slug}.json`, { logger });
      return collectCardLists(data).map(({ header, items }) => ({
        header,
        cards: items.map((it) => it?.name || it?.cardview?.name).filter(Boolean),
      }));
    } catch (error) {
      if (error instanceof EdhrecError && error.status === 404) continue;
      throw error;
    }
  }
  return [];
}

export function _resetEdhrecCache() {
  cache.clear();
  _resetSourcesCache();
}
