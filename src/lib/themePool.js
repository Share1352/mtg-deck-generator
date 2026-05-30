import { BANNED_THEMES, CREATURE_TYPES } from './constants.js';
import { buildColorThemes } from './colorThemes.js';
import { choice } from './random.js';
import { catalog } from './scryfallClient.js';

const TYPAL_KEYS = new Set([
  'myr', 'mite', 'thrull', 'ox', 'mole', 'serpent', 'dragon', 'elf', 'goblin',
  'zombie', 'cat', 'wizard', 'ninja', 'sliver', 'god', 'angel', 'demon',
  'human', 'soldier', 'spirit', 'merfolk', 'vampire', 'beast',
]);
const singularKey = (key) => (key.endsWith('s') ? key.slice(0, -1) : key);
const THEME_KEYS = new Set([
  'auras', 'equipment', 'equip', 'vehicles', 'crew', 'aristocrats',
  'spellslinger', 'blink', 'landfall', 'lifegain', 'tokens', 'artifacts',
  'enchantress', 'graveyard', 'ramp',
]);

export const normalizeTheme = (name) => String(name || '').trim().replace(/\s+/g, ' ');
export const themeKey = (name) => normalizeTheme(name).toLowerCase();

export function categorizeTheme(name, hint = '') {
  const key = themeKey(name);
  if (TYPAL_KEYS.has(key) || CREATURE_TYPES.has(key) || CREATURE_TYPES.has(singularKey(key))) return 'typal';
  if (THEME_KEYS.has(key)) return 'theme';
  const hintLower = String(hint || '').toLowerCase();
  if (/tribe|typal|creature/.test(hintLower)) return 'typal';
  if (/theme/.test(hintLower)) return 'theme';
  if (/keyword|mechanic|ability/.test(hintLower)) return 'mechanic';
  return 'mechanic';
}

const SCRYFALL_THEME_CATALOGS = [
  { name: 'keyword-abilities', source: 'Scryfall keyword-abilities', category: 'mechanic' },
  { name: 'keyword-actions', source: 'Scryfall keyword-actions', category: 'mechanic' },
  { name: 'ability-words', source: 'Scryfall ability-words', category: 'mechanic' },
  { name: 'creature-types', source: 'Scryfall creature-types', category: 'typal' },
];

export async function fetchScryfallThemeCatalogs({ logger } = {}) {
  const out = [];
  for (const { name, source, category } of SCRYFALL_THEME_CATALOGS) {
    const items = await catalog(name, { logger });
    logger?.line(`Scryfall catalog ${name}: ${items.length} entries`);
    for (const item of items) out.push({ name: item, category, source });
  }
  return out;
}

export async function fetchScryfallOracleTagThemes({ logger } = {}) {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const response = await fetch(`${baseUrl}data/scryfall-oracle-tags.json`);
  if (!response.ok) throw new Error(`Scryfall Oracle tag theme data unavailable: ${response.status}`);
  const payload = await response.json();
  const tags = Array.isArray(payload?.tags) ? payload.tags : [];
  logger?.line(`Scryfall Oracle Tagger themes: ${tags.length} functional tags from ${payload?.source || 'bundled index'}`);
  if (tags.length < 1000) throw new Error(`Scryfall Oracle Tagger theme index is too small (${tags.length}); expected 1000+ functional tags.`);
  return tags.map((entry) => ({
    name: entry.name || entry.tag,
    tag: entry.tag,
    category: 'tagger',
    source: 'Scryfall Oracle Tagger',
  }));
}

export function mergeThemeSources(entries, { banned = BANNED_THEMES } = {}) {
  const bannedSet = new Set(banned.map(themeKey));
  const map = new Map();
  let bannedCount = 0;
  for (const item of entries) {
    const name = normalizeTheme(item.name);
    if (!name) continue;
    const key = themeKey(name);
    if (bannedSet.has(key)) { bannedCount += 1; continue; }
    const existing = map.get(key);
    if (existing) {
      existing.sources = [...new Set([...existing.sources, item.source])];
    } else {
      map.set(key, {
        name,
        category: item.category || categorizeTheme(name),
        tag: item.tag,
        colors: item.colors,
        isColorTheme: item.isColorTheme,
        sources: [item.source],
      });
    }
  }
  return {
    themes: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)),
    bannedCount,
  };
}

export function pickUniformTheme(themes, rng = Math.random) {
  if (!themes?.length) throw new Error('Cannot pick theme: theme pool is empty');
  return choice(themes, rng);
}

export async function getFrontendThemePool({ logger } = {}) {
  const [catalogs, oracleTags] = await Promise.all([
    fetchScryfallThemeCatalogs({ logger }),
    fetchScryfallOracleTagThemes({ logger }),
  ]);
  const colorThemes = buildColorThemes();
  logger?.line(`Loaded ${catalogs.length} keyword/mechanic/type entries from Scryfall catalogs.`);
  logger?.line(`Loaded ${colorThemes.length} color-combination themes.`);
  if (!catalogs.length && !oracleTags.length) {
    throw new Error('Cannot build a theme pool: Scryfall catalog endpoints returned no entries.');
  }
  return mergeThemeSources([...catalogs, ...oracleTags, ...colorThemes]);
}
