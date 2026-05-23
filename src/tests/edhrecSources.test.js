import { describe, expect, it } from 'vitest';
import { SOURCES, tryAllSources, _resetSourcesCache } from '../lib/edhrecSources.js';
import { _resetEdhrecCache, getSynergyCardsForTag } from '../lib/edhrecClient.js';

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}
function statusResponse(status) {
  return { ok: false, status, json: async () => ({}), text: async () => '' };
}
function isProxyUrl(url) {
  return /corsproxy\.io|allorigins\.win|codetabs\.com/.test(url);
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
  it('exposes all 6 source strategies in priority order', () => {
    resetCaches();
    expect(SOURCES.map((s) => s.id)).toEqual([
      'bundled-static',
      'gh-mirror-raw',
      'direct-edhrec-json',
      'edhrec-next-data',
      'edhrec-s3',
      'cors-proxy',
    ]);
  });

  it('stops at the first successful source', async () => {
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

  it('cascades from bundled to direct json.edhrec.com on 404', async () => {
    resetCaches();
    await withFetch((url) => {
      if (url === 'https://json.edhrec.com/pages/themes.json') {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(404);
    }, async (calls) => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('direct-edhrec-json');
      expect(calls.some((u) => u.includes('/data/edhrec/pages/themes.json'))).toBe(true);
      expect(calls.some((u) => u === 'https://json.edhrec.com/pages/themes.json')).toBe(true);
    });
  });

  it('cascades past 403 from direct to cors-proxy and succeeds', async () => {
    resetCaches();
    await withFetch((url) => {
      if (isProxyUrl(url)) {
        return jsonResponse({ container: { json_dict: { card_lists: [] } } });
      }
      return statusResponse(403);
    }, async () => {
      const { sourceId } = await tryAllSources('/pages/themes.json');
      expect(sourceId).toBe('cors-proxy');
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
});
