import { describe, expect, it } from 'vitest';
import { SOURCES, tryAllSources, _resetSourcesCache } from '../lib/edhrecSources.js';
import { _resetEdhrecCache, getSynergyCardsForTag } from '../lib/edhrecClient.js';

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}
function statusResponse(status) {
  return { ok: false, status, json: async () => ({}), text: async () => '' };
}
function withFetch(handler, fn) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(url); return handler(url); };
  return Promise.resolve(fn(calls)).finally(() => { globalThis.fetch = original; });
}
function resetCaches() {
  _resetSourcesCache();
  _resetEdhrecCache();
}
async function expectRejection(promise, predicate) {
  let caught;
  try { await promise; }
  catch (e) { caught = e; }
  if (!caught) throw new Error('Expected promise to reject, but it resolved');
  if (!predicate(caught)) throw new Error(`Rejection did not match predicate: ${caught.name}/${caught.message}`);
}

describe('EDHREC source orchestrator', () => {
  it('exposes the two browser-reachable source strategies in priority order', () => {
    resetCaches();
    // Dead sources (direct-edhrec-json, cors-proxy, edhrec-next-data, edhrec-s3) removed:
    // browser CORS / Cloudflare 403 makes them unreachable. Build-time prefetch handles
    // the direct EDHREC fetch from Node and writes into the bundled-static path.
    expect(SOURCES.map((s) => s.id)).toEqual([
      'bundled-static',
      'gh-mirror-raw',
    ]);
  });

  // ---- A. bundled-static success ----

  it('stops at bundled-static when it serves valid JSON', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('/data/edhrec/pages/themes.json')) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('bundled-static');
      expect(calls.some((u) => u.includes('json.edhrec.com'))).toBe(false);
      expect(calls.some((u) => u.includes('raw.githubusercontent.com'))).toBe(false);
    });
  });

  // ---- B. bundled-static missing + gh-mirror success ----

  it('falls back to gh-mirror-raw when bundled-static returns 404', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('raw.githubusercontent.com') && url.includes('/pages/themes.json')) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('gh-mirror-raw');
      expect(calls.some((u) => u.includes('/data/edhrec/pages/themes.json'))).toBe(true);
      expect(calls.some((u) => u.includes('raw.githubusercontent.com'))).toBe(true);
    });
  });

  // ---- C. both mirror sources missing → warning logged and AllSourcesFailedError ----

  it('warns when both mirror sources are missing and raises AllSourcesFailedError', async () => {
    resetCaches();
    const logs = [];
    const logger = { line: (msg) => logs.push(msg) };
    await withFetch(() => statusResponse(404), async () => {
      await expectRejection(
        tryAllSources('/pages/themes.json', { logger }),
        (e) => e.name === 'AllSourcesFailedError',
      );
      expect(logs.some((l) => /refresh-edhrec-mirror|prefetch-edhrec/.test(l))).toBe(true);
    });
  });

  // ---- D. all sources fail → AllSourcesFailedError with full attempts ----

  it('throws AllSourcesFailedError with attempts for every source when all fail', async () => {
    resetCaches();
    await withFetch(() => statusResponse(503), async () => {
      await expectRejection(
        tryAllSources('/pages/themes.json'),
        (e) =>
          e.name === 'AllSourcesFailedError' &&
          Array.isArray(e.attempts) &&
          e.attempts.length === SOURCES.length &&
          e.attempts.every((a) => typeof a.sourceId === 'string' && typeof a.status === 'number'),
      );
    });
  });

  it('throws AllSourcesFailedError with status=403 when every source returns 403', async () => {
    resetCaches();
    await withFetch(() => statusResponse(403), async () => {
      await expectRejection(
        tryAllSources('/pages/themes.json'),
        (e) => e.name === 'AllSourcesFailedError' && e.status === 403,
      );
    });
  });
});

describe('edhrecClient delegates to the source orchestrator', () => {
  it('translates all-source 403 failure into EdhrecError(403) for the cardSelection fallback branch', async () => {
    resetCaches();
    await withFetch(() => statusResponse(403), async () => {
      await expectRejection(
        getSynergyCardsForTag('Equipment'),
        (e) => e.name === 'EdhrecError' && e.status === 403,
      );
    });
  });

  it('returns synergy cards when the bundled-static source serves valid JSON', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('/data/edhrec/pages/themes/equipment.json')) {
        return jsonResponse({
          container: { json_dict: { card_lists: [
            { header: 'High Synergy Cards', cardviews: [{ name: 'Puresteel Paladin' }] },
          ] } },
        });
      }
      return statusResponse(404);
    }, async () => {
      const cards = await getSynergyCardsForTag('Equipment');
      expect(cards).toContain('Puresteel Paladin');
    });
  });

  it('returns synergy cards from gh-mirror-raw when bundled-static is missing', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url.includes('raw.githubusercontent.com') && url.includes('/pages/themes/equipment.json')) {
        return jsonResponse({
          container: { json_dict: { card_lists: [
            { header: 'High Synergy Cards', cardviews: [{ name: 'Sram, Senior Edificer' }] },
          ] } },
        });
      }
      return statusResponse(404);
    }, async () => {
      const cards = await getSynergyCardsForTag('Equipment');
      expect(cards).toContain('Sram, Senior Edificer');
    });
  });

  it('caches EDHREC failures so repeat fetches do not re-hit network', async () => {
    resetCaches();
    let networkCalls = 0;
    await withFetch(() => { networkCalls += 1; return statusResponse(403); }, async () => {
      await expectRejection(
        getSynergyCardsForTag('Equipment'),
        (e) => e.name === 'EdhrecError' && e.status === 403,
      );
      const callsAfterFirst = networkCalls;
      await expectRejection(
        getSynergyCardsForTag('Equipment'),
        (e) => e.name === 'EdhrecError' && e.status === 403,
      );
      expect(networkCalls).toBe(callsAfterFirst);
    });
  });
});
