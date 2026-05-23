// Multi-source EDHREC fetcher. Tries each strategy in order, returns first success.
// Each source.fetch(path, ctx) takes a path like "/pages/themes.json" or
// "/pages/themes/equipment.json" and returns the same EDHREC-shaped JSON that
// json.edhrec.com would serve, so existing parsers in edhrecClient.js work unchanged.

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export class SourceUnavailableError extends Error {
  constructor(message, { status = 0, sourceId = '', url = '' } = {}) {
    super(message);
    this.name = 'SourceUnavailableError';
    this.status = status;
    this.sourceId = sourceId;
    this.url = url;
  }
}

export class AllSourcesFailedError extends Error {
  constructor(message, { worstStatus = 0, attempts = [] } = {}) {
    super(message);
    this.name = 'AllSourcesFailedError';
    this.status = worstStatus;
    this.attempts = attempts;
  }
}

const negativeCache = new Map(); // sourceId -> Set<path> we already know is missing

function recordMissing(sourceId, path) {
  if (!negativeCache.has(sourceId)) negativeCache.set(sourceId, new Set());
  negativeCache.get(sourceId).add(path);
}

function isMissing(sourceId, path) {
  return negativeCache.get(sourceId)?.has(path) || false;
}

// Diagnostic state – one-shot mirror availability log per session.
const _diag = { mirrorStatusLogged: false, manifestLogged: false };

export function _resetSourcesCache() {
  negativeCache.clear();
  _nextBuildIdCache.value = null;
  _nextBuildIdCache.refreshedAt = 0;
  _diag.mirrorStatusLogged = false;
  _diag.manifestLogged = false;
}

async function fetchJsonOnce(url, { logger, sourceId } = {}) {
  let res;
  try {
    res = await fetch(url);
  } catch (error) {
    logger?.line(`EDHREC source ${sourceId} network error: ${error.message}`);
    throw new SourceUnavailableError(`network error: ${error.message}`, { sourceId, url });
  }
  if (res.ok) {
    let data;
    try { data = await res.json(); }
    catch (error) {
      logger?.line(`EDHREC source ${sourceId} bad JSON at ${url}: ${error.message}`);
      throw new SourceUnavailableError(`bad JSON: ${error.message}`, { status: res.status, sourceId, url });
    }
    return data;
  }
  const reason = `HTTP ${res.status}`;
  logger?.line(`EDHREC source ${sourceId} ${reason} for ${url}`);
  throw new SourceUnavailableError(reason, { status: res.status, sourceId, url });
}

async function fetchTextOnce(url, { logger, sourceId } = {}) {
  let res;
  try { res = await fetch(url); }
  catch (error) { throw new SourceUnavailableError(`network error: ${error.message}`, { sourceId, url }); }
  if (!res.ok) {
    logger?.line(`EDHREC source ${sourceId} HTTP ${res.status} fetching ${url}`);
    throw new SourceUnavailableError(`HTTP ${res.status}`, { status: res.status, sourceId, url });
  }
  return res.text();
}

// ---- a. Bundled / static same-origin (build-time pre-fetch or mirror commit) ----

function siteOrigin() {
  if (typeof globalThis !== 'undefined' && globalThis.location?.origin) return globalThis.location.origin;
  return 'http://localhost';
}

function siteBasePath() {
  try {
    const base = import.meta.env?.BASE_URL;
    if (typeof base === 'string' && base.length) return base.replace(/\/$/, '');
  } catch {}
  return '';
}

function bundledStaticUrl(path) {
  return `${siteOrigin()}${siteBasePath()}/data/edhrec${path}`;
}

const bundledStaticSource = {
  id: 'bundled-static',
  async fetch(path, ctx) {
    if (isMissing(this.id, path)) throw new SourceUnavailableError('cached miss', { sourceId: this.id });
    const url = bundledStaticUrl(path);
    try { return await fetchJsonOnce(url, { ...ctx, sourceId: this.id }); }
    catch (e) {
      if (e instanceof SourceUnavailableError) recordMissing(this.id, path);
      throw e;
    }
  },
};

// ---- b. GitHub mirror branch (raw.githubusercontent.com) ----

const GITHUB_MIRROR_BASE =
  'https://raw.githubusercontent.com/Share1352/mtg-deck-generator/data/edhrec-mirror/public/data/edhrec';

const githubMirrorSource = {
  id: 'gh-mirror-raw',
  async fetch(path, ctx) {
    if (isMissing(this.id, path)) throw new SourceUnavailableError('cached miss', { sourceId: this.id });
    const url = `${GITHUB_MIRROR_BASE}${path}`;
    try { return await fetchJsonOnce(url, { ...ctx, sourceId: this.id }); }
    catch (e) {
      if (e instanceof SourceUnavailableError && (e.status === 404 || e.status === 403)) {
        recordMissing(this.id, path);
      }
      throw e;
    }
  },
};

// ---- c. Direct json.edhrec.com (current production endpoint) ----

const directEdhrecSource = {
  id: 'direct-edhrec-json',
  async fetch(path, ctx) {
    const url = `https://json.edhrec.com${path}`;
    return fetchJsonOnce(url, { ...ctx, sourceId: this.id });
  },
};

// ---- d. edhrec.com _next/data hydration JSON ----

const _nextBuildIdCache = { value: null, refreshedAt: 0 };
const NEXT_BUILDID_TTL_MS = 15 * 60 * 1000;

async function getEdhrecNextBuildId(ctx, { force = false } = {}) {
  const now = Date.now();
  if (!force && _nextBuildIdCache.value && now - _nextBuildIdCache.refreshedAt < NEXT_BUILDID_TTL_MS) {
    return _nextBuildIdCache.value;
  }
  const html = await fetchTextOnce('https://edhrec.com/', { ...ctx, sourceId: 'edhrec-next-data' });
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!match) throw new SourceUnavailableError('no buildId in edhrec.com HTML', { sourceId: 'edhrec-next-data' });
  _nextBuildIdCache.value = match[1];
  _nextBuildIdCache.refreshedAt = now;
  ctx?.logger?.line(`EDHREC source edhrec-next-data: discovered buildId=${match[1]}`);
  return match[1];
}

// /pages/themes.json            -> /_next/data/{id}/themes.json
// /pages/themes/equipment.json  -> /_next/data/{id}/themes/equipment.json
function pathToNextDataPath(path) {
  return path.replace(/^\/pages\//, '/');
}

const edhrecNextDataSource = {
  id: 'edhrec-next-data',
  async fetch(path, ctx) {
    if (isMissing(this.id, path)) throw new SourceUnavailableError('cached miss', { sourceId: this.id });
    let buildId;
    try { buildId = await getEdhrecNextBuildId(ctx); }
    catch (e) { throw new SourceUnavailableError(`buildId lookup failed: ${e.message}`, { sourceId: this.id }); }
    const nextPath = pathToNextDataPath(path);
    const url = `https://edhrec.com/_next/data/${buildId}${nextPath}`;
    try {
      return await fetchJsonOnce(url, { ...ctx, sourceId: this.id });
    } catch (e) {
      if (e instanceof SourceUnavailableError && e.status === 404 && buildId === _nextBuildIdCache.value) {
        // buildId may have rotated; refresh once and retry
        try {
          const fresh = await getEdhrecNextBuildId(ctx, { force: true });
          if (fresh !== buildId) {
            const retryUrl = `https://edhrec.com/_next/data/${fresh}${nextPath}`;
            return await fetchJsonOnce(retryUrl, { ...ctx, sourceId: this.id });
          }
        } catch {}
      }
      if (e instanceof SourceUnavailableError && (e.status === 404 || e.status === 403)) {
        recordMissing(this.id, path);
      }
      throw e;
    }
  },
};

// ---- e. EDHREC S3 / static CDN variants (speculative; may or may not exist) ----

const S3_BASES = [
  'https://edhrec-json.s3.amazonaws.com',
  'https://static.edhrec.com',
];

const edhrecS3Source = {
  id: 'edhrec-s3',
  async fetch(path, ctx) {
    if (isMissing(this.id, path)) throw new SourceUnavailableError('cached miss', { sourceId: this.id });
    let lastError;
    for (const base of S3_BASES) {
      const url = `${base}${path}`;
      try { return await fetchJsonOnce(url, { ...ctx, sourceId: this.id }); }
      catch (e) { lastError = e; }
    }
    if (lastError instanceof SourceUnavailableError && (lastError.status === 404 || lastError.status === 403)) {
      recordMissing(this.id, path);
    }
    throw lastError || new SourceUnavailableError('all S3 bases failed', { sourceId: this.id });
  },
};

// ---- f. Public CORS proxies wrapping json.edhrec.com ----

function wrapProxyUrl(provider, targetUrl) {
  const enc = encodeURIComponent(targetUrl);
  switch (provider) {
    case 'corsproxy.io':   return `https://corsproxy.io/?${enc}`;
    case 'allorigins':     return `https://api.allorigins.win/raw?url=${enc}`;
    case 'codetabs':       return `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`;
    default: throw new Error(`unknown proxy: ${provider}`);
  }
}

const PROXY_PROVIDERS = ['corsproxy.io', 'allorigins', 'codetabs'];

const corsProxySource = {
  id: 'cors-proxy',
  async fetch(path, ctx) {
    const target = `https://json.edhrec.com${path}`;
    let lastError;
    for (const provider of PROXY_PROVIDERS) {
      const url = wrapProxyUrl(provider, target);
      try {
        const data = await fetchJsonOnce(url, { ...ctx, sourceId: `${this.id}/${provider}` });
        return data;
      } catch (e) {
        lastError = e;
        if (e instanceof SourceUnavailableError && (e.status === 404 || e.status === 403)) {
          // 404 from a proxy means the underlying EDHREC endpoint is gone, not the proxy.
          // We can short-circuit the remaining proxies.
          break;
        }
      }
    }
    throw lastError || new SourceUnavailableError('all proxies failed', { sourceId: this.id });
  },
};

// ---- Orchestrator ----

// Order: same-origin bundled first, then GitHub mirror, then direct EDHREC,
// then CORS proxies (reliable fallback for CORS/403), then fragile speculative
// sources (_next/data buildId can rotate; S3 endpoints unconfirmed).
export const SOURCES = [
  bundledStaticSource,
  githubMirrorSource,
  directEdhrecSource,
  corsProxySource,
  edhrecNextDataSource,
  edhrecS3Source,
];

export async function tryAllSources(path, { logger } = {}) {
  const attempts = [];
  let worstStatus = 0;
  let bundledFailed = false;

  for (const source of SOURCES) {
    try {
      logger?.line(`EDHREC source ${source.id}: trying ${path}`);
      const data = await source.fetch(path, { logger });

      // One-shot mirror availability log on the first call that reaches a mirror source.
      if (!_diag.mirrorStatusLogged) {
        if (source.id === 'bundled-static') {
          logger?.line('EDHREC bundled mirror available: yes');
          // Best-effort: fetch manifest and log coverage details.
          if (!_diag.manifestLogged) {
            _diag.manifestLogged = true;
            fetch(bundledStaticUrl('/manifest.json'))
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((m) => {
                if (m?.generatedAt) {
                  logger?.line(
                    `EDHREC mirror manifest: generatedAt=${m.generatedAt}, themePagesFetched=${m.themePagesFetched ?? '?'}`,
                  );
                }
              })
              .catch(() => {});
          }
        } else if (source.id === 'gh-mirror-raw') {
          logger?.line('EDHREC bundled mirror available: no');
          logger?.line('EDHREC GitHub mirror branch available: yes');
        }
        _diag.mirrorStatusLogged = true;
      }

      logger?.line(`EDHREC source ${source.id}: success for ${path}`);
      return { data, sourceId: source.id };
    } catch (error) {
      const status = error?.status || 0;
      attempts.push({ sourceId: source.id, status, message: error?.message || String(error) });

      if (source.id === 'bundled-static') bundledFailed = true;

      // After both mirror sources fail, log a clear warning before falling through
      // to unreliable browser-based sources.
      if (!_diag.mirrorStatusLogged && source.id === 'gh-mirror-raw' && bundledFailed) {
        logger?.line('EDHREC bundled mirror available: no');
        logger?.line('EDHREC GitHub mirror branch available: no');
        logger?.line(
          'Bundled EDHREC mirror missing. Run refresh-edhrec-mirror workflow or prefetch-edhrec before deploy.',
        );
        _diag.mirrorStatusLogged = true;
      }

      // 403 is the worst because it's the symptom we're trying to overcome — preserve it
      // so cardSelection.js's 403-branch still triggers.
      if (status === 403) worstStatus = 403;
      else if (worstStatus !== 403 && status > worstStatus) worstStatus = status;
    }
  }
  const summary = attempts.map((a) => `${a.sourceId}=${a.status || 'err'}`).join(', ');
  logger?.line(`EDHREC all sources failed for ${path}: ${summary}`);
  throw new AllSourcesFailedError(`all EDHREC sources failed for ${path}: ${summary}`, { worstStatus, attempts });
}
