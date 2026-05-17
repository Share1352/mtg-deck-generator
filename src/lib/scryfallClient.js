const API = 'https://api.scryfall.com';
let lastRequest = 0;
const cache = new Map();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export class ScryfallError extends Error { constructor(message, status, endpoint) { super(message); this.status = status; this.endpoint = endpoint; } }
async function queuedFetch(url, { logger } = {}) {
  const elapsed = Date.now() - lastRequest;
  if (elapsed < 500) await wait(500 - elapsed);
  lastRequest = Date.now();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url);
    logger?.line(`Scryfall ${new URL(url).pathname} status=${res.status} attempt=${attempt + 1}`);
    if (res.ok) return res.json();
    if (![429, 500, 502, 503, 504].includes(res.status)) throw new ScryfallError(`Scryfall request failed ${res.status}`, res.status, url);
    await wait(800 * (attempt + 1));
  }
  throw new ScryfallError('Scryfall request failed after retries', 0, url);
}
export async function scryfallGet(endpoint, params = {}, { logger } = {}) {
  const url = new URL(`${API}${endpoint}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, v);
  const key = url.toString();
  if (cache.has(key)) { logger?.line(`Scryfall cache hit ${endpoint}`); return cache.get(key); }
  logger?.line(`Scryfall request ${endpoint} ${url.searchParams.toString()}`);
  const data = await queuedFetch(key, { logger });
  cache.set(key, data);
  return data;
}
export async function searchCards(query, { unique = 'cards', order = 'released', dir = 'asc', limit = 175, logger } = {}) {
  const all = [];
  let data = await scryfallGet('/cards/search', { q: query, unique, order, dir }, { logger });
  all.push(...(data.data || []));
  while (data.has_more && data.next_page && all.length < limit) {
    data = await queuedFetch(data.next_page, { logger });
    all.push(...(data.data || []));
  }
  logger?.line(`Scryfall query result count=${all.length} q=${query}`);
  return all.slice(0, limit);
}
export async function namedCard(name, { logger } = {}) { return scryfallGet('/cards/named', { exact: name }, { logger }); }
export async function randomCard(query, { logger } = {}) { return scryfallGet('/cards/random', { q: query }, { logger }); }
export async function catalog(name, { logger } = {}) { const data = await scryfallGet(`/catalog/${name}`, {}, { logger }); return data.data || []; }
export async function sets({ logger } = {}) { const data = await scryfallGet('/sets', {}, { logger }); return data.data || []; }
