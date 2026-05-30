import { BANNED_THEMES, BANNED_THEME_PATTERNS, CREATURE_TYPES } from './constants.js';
import { buildColorThemes, isColorTheme } from './colorThemes.js';
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

export function mergeThemeSources(entries, { banned = BANNED_THEMES, bannedPatterns = BANNED_THEME_PATTERNS } = {}) {
  const bannedSet = new Set(banned.map(themeKey));
  const map = new Map();
  let bannedCount = 0;
  for (const item of entries) {
    const name = normalizeTheme(item.name);
    if (!name) continue;
    const key = themeKey(name);
    // color themes are first-party and never name-banned; pattern bans only police external feeds
    const patternBanned = item.category !== 'color' && bannedPatterns.some((re) => re.test(name));
    if (bannedSet.has(key) || patternBanned) { bannedCount += 1; continue; }
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

// Color-only themes (#39) share a flat 10% of picks as a single bucket; every other theme/concept
// splits the remaining 90% with equal probability. Without this, the ~32 color themes would just be
// 32 more uniform entries among ~1700 and almost never surface.
export const COLOR_THEME_PROBABILITY = 0.1;
export function pickTheme(themes, rng = Math.random, { colorProbability = COLOR_THEME_PROBABILITY } = {}) {
  if (!themes?.length) throw new Error('Cannot pick theme: theme pool is empty');
  const colorThemes = themes.filter(isColorTheme);
  const otherThemes = themes.filter((t) => !isColorTheme(t));
  if (!colorThemes.length || !otherThemes.length) return choice(themes, rng);
  return rng() < colorProbability ? choice(colorThemes, rng) : choice(otherThemes, rng);
}

export async function getFrontendThemePool({ logger } = {}) {
  // Catalogs come from Scryfall and ARE the reachability signal: if they fail, Scryfall is genuinely
  // down and generation must abort. The Oracle Tagger index is a *bundled static enrichment file* on our
  // own Pages site; a transient 404/cache-miss there must NOT masquerade as "Scryfall unreachable" and
  // kill an otherwise-buildable deck. Degrade gracefully — log a warning and continue without tagger themes.
  const [catalogs, oracleTags] = await Promise.all([
    fetchScryfallThemeCatalogs({ logger }),
    fetchScryfallOracleTagThemes({ logger }).catch((error) => {
      logger?.line(`WARNING Oracle Tagger themes unavailable, continuing with catalog + color themes only: ${error.message}`);
      return [];
    }),
  ]);
  const colorThemes = buildColorThemes();
  logger?.line(`Loaded ${catalogs.length} keyword/mechanic/type entries from Scryfall catalogs.`);
  logger?.line(`Loaded ${colorThemes.length} color-combination themes.`);
  if (!catalogs.length && !oracleTags.length) {
    throw new Error('Cannot build a theme pool: Scryfall catalog endpoints returned no entries.');
  }
  return mergeThemeSources([...catalogs, ...oracleTags, ...colorThemes]);
}
