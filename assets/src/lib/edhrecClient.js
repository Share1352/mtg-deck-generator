const EDHREC_API = 'https://json.edhrec.com';
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const retry = {
  maxAttempts: 6,
  baseBackoffMs: 800,
  maxBackoffMs: 15000,
};
export function configureEdhrecRetry(overrides = {}) { Object.assign(retry, overrides); }
const cache = new Map();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class EdhrecError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'EdhrecError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

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
  const url = `${EDHREC_API}${path}`;
  let lastError;
  for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
    let res;
    try {
      res = await fetch(url);
    } catch (error) {
      lastError = error;
      logger?.line(`EDHREC ${path} network error attempt=${attempt}/${retry.maxAttempts}: ${error.message}`);
      if (attempt < retry.maxAttempts) {
        const backoff = Math.min(retry.maxBackoffMs, retry.baseBackoffMs * 2 ** (attempt - 1));
        logger?.line(`EDHREC waiting ${backoff}ms before retry`);
        await wait(backoff);
      }
      continue;
    }
    logger?.line(`EDHREC ${path} status=${res.status} attempt=${attempt}/${retry.maxAttempts}`);
    if (res.ok) {
      const data = await res.json();
      cache.set(path, data);
      return data;
    }
    if (res.status === 404) throw new EdhrecError(`EDHREC 404 for ${path}`, 404, url);
    if (res.status === 403) throw new EdhrecError(`EDHREC unavailable (403) for ${path}`, 403, url);
    if (!TRANSIENT_STATUS.has(res.status)) throw new EdhrecError(`EDHREC non-retryable status ${res.status} for ${path}`, res.status, url);
    lastError = new EdhrecError(`EDHREC transient ${res.status} for ${path}`, res.status, url);
    if (attempt < retry.maxAttempts) {
      const backoff = Math.min(retry.maxBackoffMs, retry.baseBackoffMs * 2 ** (attempt - 1));
      logger?.line(`EDHREC waiting ${backoff}ms before retry`);
      await wait(backoff);
    }
  }
  throw lastError instanceof EdhrecError
    ? lastError
    : new EdhrecError(`EDHREC ${path} failed after ${retry.maxAttempts} retries: ${lastError?.message || 'unknown error'}`, 0, url);
}

function collectCardLists(data) {
  const out = [];
  const lists = data?.container?.json_dict?.card_lists
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
}
