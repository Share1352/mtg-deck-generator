import { COLORS, COLOR_NAMES } from './constants.js';

const COMBO_NAMES = {
  WU: 'White/Blue',
  UB: 'Blue/Black',
  BR: 'Black/Red',
  RG: 'Red/Green',
  GW: 'Green/White',
  WB: 'White/Black',
  UR: 'Blue/Red',
  BG: 'Black/Green',
  WR: 'Red/White',
  RW: 'Red/White',
  GU: 'Green/Blue',
  WUB: 'White/Blue/Black',
  UBR: 'Blue/Black/Red',
  BRG: 'Black/Red/Green',
  RGW: 'Red/Green/White',
  GWU: 'Green/White/Blue',
  WBG: 'White/Black/Green',
  URW: 'Blue/Red/White',
  BGU: 'Black/Green/Blue',
  RWB: 'Red/White/Black',
  GUR: 'Green/Blue/Red',
  WUBR: 'White/Blue/Black/Red',
  UBRG: 'Blue/Black/Red/Green',
  BRGW: 'Black/Red/Green/White',
  RGWU: 'Red/Green/White/Blue',
  GWUB: 'Green/White/Blue/Black',
  WUBRG: 'Five-Color',
};

function combinations(items, size, start = 0, prefix = [], out = []) {
  if (prefix.length === size) {
    out.push([...prefix]);
    return out;
  }
  for (let i = start; i < items.length; i += 1) combinations(items, size, i + 1, [...prefix, items[i]], out);
  return out;
}

function colorName(colors) {
  if (colors.length === 0) return 'Colorless';
  if (colors.length === 1) return `Mono-${COLOR_NAMES[colors[0]]}`;
  const key = colors.join('');
  return COMBO_NAMES[key] || colors.map((c) => COLOR_NAMES[c]).join('/');
}

export function buildColorThemes() {
  const combos = [[]];
  for (let size = 1; size <= COLORS.length; size += 1) combos.push(...combinations(COLORS, size));
  return combos.map((colors) => ({
    name: colorName(colors),
    category: 'color',
    source: 'Generated color identity themes',
    colors,
    isColorTheme: true,
  }));
}

export function isColorTheme(theme) {
  return theme?.category === 'color' || theme?.isColorTheme === true;
}

export function colorThemeQuery(theme) {
  const colors = theme?.colors || [];
  if (!colors.length) return 'id:c -type:land';
  return `id<=${colors.join('')} -type:land`;
}

export function isStrictMonoColorThemeCard(card, colors) {
  if (!colors || colors.length !== 1) return true;
  const symbol = colors[0];
  const costs = (card?.card_faces?.length ? card.card_faces : [card]).map((face) => face?.mana_cost || '').filter(Boolean);
  if (!costs.length) return false;
  const joined = costs.join('');
  const symbols = [...joined.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  return symbols.length > 0 && symbols.every((s) => s === symbol);
}
