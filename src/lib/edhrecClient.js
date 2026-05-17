import { loadStaticJson } from './themePool.js';
export async function getAllEdhrecTags() { return loadStaticJson('data/edhrec-tags.json', []); }
export async function getSynergyCardsForTag(tag) {
  const cache = await loadStaticJson('data/edhrec-synergy-cache.json', {});
  return cache[tag.name || tag] || [];
}
export async function getRelatedSectionsForTag() { return []; }
