import { describe, expect, it } from 'vitest';
import { chooseDeckColors, maybeExpandColors } from '../lib/colorEngine.js';
import { createRng } from '../lib/random.js';
const c = (id) => ({ name: id + Math.random(), color_identity: id.split('') });
describe('color engine', () => {
  it('handles dominance cases', () => {
    expect(chooseDeckColors([c('W'), c('W'), c('U')], { rng: () => 0.9 }).colors).toEqual(['W']);
    expect(chooseDeckColors([c('W'), c('W'), c('B'), c('B'), c('G')], { rng: () => 0.9 }).colors).toEqual(['B', 'W']);
    expect(chooseDeckColors([c('W'), c('B'), c('G')], { rng: () => 0.9 }).colors).toHaveLength(3);
    expect(chooseDeckColors([c('W'), c('U'), c('B'), c('R')], { rng: createRng(1) }).colors).toHaveLength(2);
    expect(chooseDeckColors([c('W'), c('U'), c('B'), c('R'), c('G')], { rng: createRng(2) }).colors).toHaveLength(2);
  });
  it('forces meaningful multicolor around half the time', () => {
    let forced = 0;
    for (let i = 0; i < 50; i += 1) if (chooseDeckColors(Array.from({ length: 12 }, () => c('WU')), { rng: createRng(i) }).multicolorTriggered) forced += 1;
    expect(forced).toBeGreaterThan(10);
    expect(forced).toBeLessThan(40);
  });
  it('expands small pools deliberately without WUBRG', () => {
    const result = maybeExpandColors({ chosenColors: ['W'], allCards: [c('W'), c('G'), c('G'), c('B')], needed: 3 });
    expect(result.expanded).toBe(true);
    expect(result.colors.length).toBe(2);
  });
});
