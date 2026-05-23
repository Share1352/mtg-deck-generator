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
  if (cache.has(path)) { logger?.line(`EDHREC cache hit ${path}`); return cache.get(path); }
  try {
    const { data, sourceId } = await tryAllSources(path, { logger });
    cache.set(path, data);
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
      throw new EdhrecError(msg, status, `${EDHREC_API}${path}`);
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

export async function getSynergyCardsForTag(tag, { logger } = {}) {
  const slug = slugifyTheme(canonicalSynergyTag(tag));
  if (!slug) return [];
  let lastError;
  for (const category of THEME_PAGE_CATEGORIES) {
    try {
      const data = await edhrecFetch(`/pages/${category}/${slug}.json`, { logger });
      const allNames = extractCardNames(data);
      const highSynergy = [];
      for (const list of collectCardLists(data)) {
        if (/high\s*synergy|high-synergy|top\s*synergy/i.test(list.header)) {
          for (const item of list.items) {
            const name = item?.name || item?.cardview?.name;
            if (name) highSynergy.push(String(name));
          }
        }
      }
      if (highSynergy.length) {
        logger?.line(`EDHREC /${category}/${slug}: ${highSynergy.length} high-synergy names`);
        return highSynergy;
      }
      logger?.line(`EDHREC /${category}/${slug}: ${allNames.length} total card names (no explicit high-synergy section)`);
      if (allNames.length) return allNames;
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
