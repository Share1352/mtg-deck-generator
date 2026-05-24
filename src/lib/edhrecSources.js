// Multi-source EDHREC fetcher. Tries each strategy in order, returns first success.
// Each source.fetch(path, ctx) takes a path like "/pages/themes.json" or
// "/pages/themes/equipment.json" and returns the same EDHREC-shaped JSON that
// json.edhrec.com would serve, so existing parsers in edhrecClient.js work unchanged.
//
// Only browser-reachable sources live here. Dead sources removed after observing
// session logs:
//   - direct-edhrec-json: always 403 (Cloudflare blocks browser origins)
//   - cors-proxy:         always 403 (corsproxy.io forwards upstream 403)
//   - edhrec-next-data:   CORS-blocked (NetworkError every call)
//   - edhrec-s3:          CORS-blocked + ~40s timeout per attempt
// Build-time prefetch (scripts/prefetch-edhrec.js) still uses direct EDHREC from
// Node, where CORS does not apply, and writes results into the bundled-static path.

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

// Diagnostic state – one-shot logs per session to avoid log spam.
const _diag = { mirrorStatusLogged: false, manifestLogged: false };

export function _resetSourcesCache() {
  negativeCache.clear();
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
      // Only cache permanent misses (404/403). Network errors and 5xx may be transient.
      if (e instanceof SourceUnavailableError && (e.status === 404 || e.status === 403)) {
        recordMissing(this.id, path);
      }
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

// ---- Orchestrator ----

// Only two browser-reachable sources remain: same-origin bundle first (fastest,
// stays out of the network entirely when prefetch ran), then GitHub mirror.
export const SOURCES = [
  bundledStaticSource,
  githubMirrorSource,
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

      // After both mirror sources fail, log a clear warning. With dead browser
      // fallbacks removed, this is the terminal state — caller falls back to Scryfall.
      if (!_diag.mirrorStatusLogged && source.id === 'gh-mirror-raw' && bundledFailed) {
        logger?.line('EDHREC bundled mirror available: no');
        logger?.line('EDHREC GitHub mirror branch available: no');
        logger?.line(
          'Bundled EDHREC mirror missing. Run refresh-edhrec-mirror workflow or prefetch-edhrec before deploy.',
        );
        _diag.mirrorStatusLogged = true;
      }

      // Preserve 403 as worst status for the cardSelection.js 403-branch.
      if (status === 403) worstStatus = 403;
      else if (worstStatus !== 403 && status > worstStatus) worstStatus = status;
    }
  }
  const summary = attempts.map((a) => `${a.sourceId}=${a.status || 'err'}`).join(', ');
  logger?.line(`EDHREC all sources failed for ${path}: ${summary}`);
  throw new AllSourcesFailedError(`all EDHREC sources failed for ${path}: ${summary}`, { worstStatus, attempts });
}
