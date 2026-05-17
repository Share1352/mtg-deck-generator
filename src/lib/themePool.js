import { BANNED_THEMES, HARDCODED_THEMES } from './constants.js';
import { choice } from './random.js';
const catalogFallback = ['Deathtouch','Defender','First Strike','Flash','Haste','Hexproof','Indestructible','Lifelink','Menace','Prowess','Reach','Cycling','Kicker','Flashback','Scry','Surveil','Cascade','Storm','Populate','Proliferate','Convoke','Infect','Mill','Extort','Evolve','Morph','Suspend','Dredge','Delve','Magecraft','Adventure','Foretell','Connive','Bargain','Craft','Evoke','Rebound','Overload','Escape','Boast','Cleave','Toxic','Dragon','Elf','Goblin','Zombie','Cat','Wizard','Ninja','Sliver','God'];
export const normalizeTheme = (name) => String(name || '').trim().replace(/\s+/g, ' ');
export const themeKey = (name) => normalizeTheme(name).toLowerCase();
export function categorizeTheme(name) {
  const key = themeKey(name);
  if (['myr','mite','thrull','ox','mole','serpent','dragon','elf','goblin','zombie','cat','wizard','ninja','sliver','god'].includes(key)) return 'typal';
  if (['auras','equipment','vehicles','aristocrats','spellslinger','blink','landfall','lifegain','tokens','artifacts','enchantress','graveyard'].includes(key)) return 'theme';
  return 'mechanic';
}
export async function loadStaticJson(path, fallback) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch { return fallback; }
}
export async function buildThemePool({ edhrecTags = [], scryfallCatalogs = [], banned = BANNED_THEMES } = {}) {
  const candidates = [];
  for (const t of edhrecTags) candidates.push({ name: t.name || t, category: t.category || categorizeTheme(t.name || t), sources: ['EDHREC cache'] });
  for (const t of scryfallCatalogs) candidates.push({ name: t, category: categorizeTheme(t), sources: ['Scryfall catalog'] });
  for (const t of HARDCODED_THEMES) candidates.push({ name: t, category: categorizeTheme(t), sources: ['hardcoded safety list'] });
  for (const t of catalogFallback) candidates.push({ name: t, category: categorizeTheme(t), sources: ['Scryfall catalog fallback'] });
  const bannedSet = new Set(banned.map(themeKey));
  const map = new Map();
  let bannedCount = 0;
  for (const item of candidates) {
    const name = normalizeTheme(item.name);
    if (!name) continue;
    const key = themeKey(name);
    if (bannedSet.has(key)) { bannedCount += 1; continue; }
    const existing = map.get(key);
    if (existing) existing.sources = [...new Set([...existing.sources, ...item.sources])];
    else map.set(key, { ...item, name });
  }
  return { themes: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)), bannedCount };
}
export function pickUniformTheme(themes, rng = Math.random) { return choice(themes, rng); }
export async function getFrontendThemePool() {
  const edhrecTags = await loadStaticJson('data/edhrec-tags.json', []);
  return buildThemePool({ edhrecTags });
}
