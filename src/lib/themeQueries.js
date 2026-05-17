import { categorizeTheme, themeKey } from './themePool.js';
const parasitic = new Set(['enchant','auras','equipment','equip','vehicles','crew','saddle','mount','mutate','ninjutsu','buyback','cipher','spectacle','bloodthirst']);
export function exactOracleQuery(theme) { return `oracle:/\\b${String(theme).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b/i`; }
export function buildThemeQuery(theme, { creature = null } = {}) {
  const key = themeKey(theme);
  const category = categorizeTheme(theme);
  let q;
  if (category === 'typal') q = creature === false ? `(${exactOracleQuery(theme)} OR oracle:"choose a creature type")` : `(type:"${theme}" OR ${exactOracleQuery(theme)})`;
  else if (key === 'auras') q = '(type:aura OR oracle:/\\bAura\\b/i OR otag:auras)';
  else if (key === 'equipment' || key === 'equip') q = '(type:equipment OR keyword:equip OR otag:equipment)';
  else if (key === 'vehicles' || key === 'crew') q = '(type:vehicle OR keyword:crew OR otag:vehicles)';
  else if (key === 'enchant') q = '(type:enchantment OR keyword:enchant OR otag:enchantress)';
  else q = `(keyword:"${theme}" OR otag:"${key}" OR ${exactOracleQuery(theme)})`;
  if (creature === true) q += ' type:creature';
  if (creature === false) q += ' -type:creature';
  return q;
}
export function getHostQuery(theme) {
  const key = themeKey(theme);
  if (!parasitic.has(key)) return null;
  if (['enchant','auras','bestow','totem armor'].includes(key)) return '(type:creature (keyword:hexproof OR keyword:ward OR oracle:enchantment OR oracle:aura))';
  if (['equipment','equip','reconfigure'].includes(key)) return '(type:creature (oracle:equipment OR keyword:double-strike OR keyword:trample OR oracle:modified))';
  if (['vehicles','crew'].includes(key)) return '(type:creature (oracle:crew OR oracle:Vehicle OR pow>=2))';
  if (['saddle','mount'].includes(key)) return '(type:creature (oracle:saddle OR type:mount OR pow>=2))';
  if (key === 'mutate') return '(type:creature -type:human)';
  if (['ninjutsu','cipher','spectacle','bloodthirst'].includes(key)) return '(type:creature (keyword:flying OR keyword:menace OR oracle:unblockable OR keyword:skulk))';
  if (key === 'buyback') return '(type:creature (oracle:"instant or sorcery" OR oracle:"cost less" OR oracle:"copy target"))';
  return null;
}
