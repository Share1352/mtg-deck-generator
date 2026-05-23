import { categorizeTheme, themeKey } from './themePool.js';
const parasitic = new Set(['enchant','auras','equipment','equip','vehicles','crew','saddle','mount','mutate','ninjutsu','buyback','cipher','spectacle','bloodthirst']);
export function exactOracleQuery(theme) { return `oracle:/\\b${String(theme).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b/i`; }
function pluralizeTypal(name) {
  const n = String(name || '');
  if (/f$/i.test(n)) return `${n.slice(0, -1)}ves`;
  if (/[sxz]$/i.test(n) || /ch$/i.test(n) || /sh$/i.test(n)) return `${n}es`;
  if (/y$/i.test(n) && !/[aeiou]y$/i.test(n)) return `${n.slice(0, -1)}ies`;
  return `${n}s`;
}
export function buildThemeQuery(theme, { creature = null } = {}) {
  const name = typeof theme === 'string' ? theme : theme?.name;
  const category = typeof theme === 'string' ? categorizeTheme(name) : (theme?.category || categorizeTheme(name, theme?.category || ''));
  const key = themeKey(name);
  let q;
  if (category === 'typal') {
    const singular = String(name || '');
    const plural = pluralizeTypal(singular);
    q = creature === false
      ? `(oracle:/\\b${singular}\\b/i OR oracle:/\\b${plural}\\b/i OR oracle:"choose a creature type")`
      : `(type:"${singular}" OR oracle:/\\b${singular}\\b/i OR oracle:/\\b${plural}\\b/i)`;
  }
  else if (key === 'auras') q = '(type:aura OR oracle:/\\bAura\\b/i OR otag:auras)';
  else if (key === 'equipment' || key === 'equip') q = '(type:equipment OR keyword:equip OR otag:equipment OR (type:creature (oracle:/\bequip(?:ment|ped)?\b/i OR oracle:/\battach\b/i OR oracle:/\bmodified\b/i)))';
  else if (key === 'vehicles' || key === 'crew') q = '(type:vehicle OR keyword:crew OR otag:vehicles)';
  else if (key === 'enchant') q = '(type:enchantment OR keyword:enchant OR otag:enchantress)';
  else q = `(keyword:"${name}" OR otag:"${key}" OR ${exactOracleQuery(name)})`;
  if (creature === true) q += ' type:creature';
  if (creature === false) q += ' -type:creature';
  return q;
}
export function getHostQuery(theme) {
  const key = themeKey(theme);
  if (!parasitic.has(key)) return null;
  if (['enchant','auras','bestow','totem armor'].includes(key)) return '(type:creature (keyword:hexproof OR keyword:ward OR oracle:enchantment OR oracle:aura))';
  if (['equipment','equip','reconfigure'].includes(key)) return '(type:creature (oracle:/\bequip(?:ment|ped)?\b/i OR oracle:/\battach\b/i OR oracle:/\bmodified\b/i))';
  if (['vehicles','crew'].includes(key)) return '(type:creature (oracle:crew OR oracle:Vehicle OR pow>=2))';
  if (['saddle','mount'].includes(key)) return '(type:creature (oracle:saddle OR type:mount OR pow>=2))';
  if (key === 'mutate') return '(type:creature -type:human)';
  if (['ninjutsu','cipher','spectacle','bloodthirst'].includes(key)) return '(type:creature (keyword:flying OR keyword:menace OR oracle:unblockable OR keyword:skulk))';
  if (key === 'buyback') return '(type:creature (oracle:"instant or sorcery" OR oracle:"cost less" OR oracle:"copy target"))';
  return null;
}
