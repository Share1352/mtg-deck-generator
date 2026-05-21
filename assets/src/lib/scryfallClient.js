const API = 'https://api.scryfall.com';
const retry = {
  minGapMs: 100,
  maxAttempts: 8,
  baseBackoffMs: 800,
  maxBackoffMs: 15000,
};
export function configureScryfallRetry(overrides = {}) { Object.assign(retry, overrides); }
let lastRequest = 0;
const cache = new Map();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class ScryfallError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'ScryfallError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

async function queuedFetch(url, { logger, label } = {}) {
  const elapsed = Date.now() - lastRequest;
  if (elapsed < retry.minGapMs) await wait(retry.minGapMs - elapsed);
  lastRequest = Date.now();
  const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  let lastError;
  for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
    let res;
    try {
      res = await fetch(url);
    } catch (error) {
      lastError = error;
      logger?.line(`Scryfall ${label || pathname} network error attempt=${attempt}/${retry.maxAttempts}: ${error.message}`);
      if (attempt < retry.maxAttempts) {
        const backoff = Math.min(retry.maxBackoffMs, retry.baseBackoffMs * 2 ** (attempt - 1));
        logger?.line(`Scryfall waiting ${backoff}ms before retry`);
        await wait(backoff);
      }
      continue;
    }
    logger?.line(`Scryfall ${label || pathname} status=${res.status} attempt=${attempt}/${retry.maxAttempts}`);
    if (res.ok) return res.json();
    if (res.status === 404) throw new ScryfallError(`Scryfall returned 404 for ${pathname}`, 404, url);
    if (!TRANSIENT_STATUS.has(res.status)) throw new ScryfallError(`Scryfall non-retryable status ${res.status} for ${pathname}`, res.status, url);
    lastError = new ScryfallError(`Scryfall transient ${res.status} for ${pathname}`, res.status, url);
    if (attempt < retry.maxAttempts) {
      const backoff = Math.min(retry.maxBackoffMs, retry.baseBackoffMs * 2 ** (attempt - 1));
      logger?.line(`Scryfall waiting ${backoff}ms before retry`);
      await wait(backoff);
    }
  }
  throw lastError instanceof ScryfallError
    ? lastError
    : new ScryfallError(`Scryfall request failed after ${retry.maxAttempts} retries: ${lastError?.message || 'unknown error'}`, 0, url);
}

export async function scryfallGet(endpoint, params = {}, { logger } = {}) {
  const url = new URL(`${API}${endpoint}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, v);
  const key = url.toString();
  if (cache.has(key)) { logger?.line(`Scryfall cache hit ${endpoint}`); return cache.get(key); }
  logger?.line(`Scryfall request ${endpoint} ${url.searchParams.toString()}`);
  const data = await queuedFetch(key, { logger, label: endpoint });
  cache.set(key, data);
  return data;
}

export async function searchCards(query, { unique = 'cards', order = 'released', dir = 'asc', limit = 175, logger } = {}) {
  try {
    const all = [];
    let data = await scryfallGet('/cards/search', { q: query, unique, order, dir }, { logger });
    all.push(...(data.data || []));
    while (data.has_more && data.next_page && all.length < limit) {
      data = await queuedFetch(data.next_page, { logger, label: '/cards/search:page' });
      all.push(...(data.data || []));
    }
    logger?.line(`Scryfall search count=${all.length} q=${query}`);
    return all.slice(0, limit);
  } catch (error) {
    if (error instanceof ScryfallError && error.status === 404) {
      logger?.line(`Scryfall search returned no matches for q=${query}`);
      return [];
    }
    throw error;
  }
}

export async function namedCard(name, { logger } = {}) {
  return scryfallGet('/cards/named', { exact: name }, { logger });
}

export async function randomCard(query, { logger } = {}) {
  const url = new URL(`${API}/cards/random`);
  if (query) url.searchParams.set('q', query);
  logger?.line(`Scryfall request /cards/random ${url.searchParams.toString()}`);
  return queuedFetch(url.toString(), { logger, label: '/cards/random' });
}

export async function catalog(name, { logger } = {}) {
  const data = await scryfallGet(`/catalog/${name}`, {}, { logger });
  return data.data || [];
}

export async function sets({ logger } = {}) {
  const data = await scryfallGet('/sets', {}, { logger });
  return data.data || [];
}

export function _resetScryfallCache() {
  cache.clear();
  lastRequest = 0;
}
