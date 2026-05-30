import { describe, expect, it } from 'vitest';
import { colorThemeQuery, isStrictMonoColorThemeCard } from '../lib/colorThemes.js';

describe('color themes', () => {
  it('builds strict color identity queries', () => {
    expect(colorThemeQuery({ colors: [] })).toBe('id:c -type:land');
    expect(colorThemeQuery({ colors: ['U'] })).toBe('id<=U -type:land');
    expect(colorThemeQuery({ colors: ['U', 'B', 'R'] })).toBe('id<=UBR -type:land');
  });

  it('requires mono-color theme cards to have only that color in mana cost', () => {
    expect(isStrictMonoColorThemeCard({ mana_cost: '{U}{U}{U}{U}' }, ['U'])).toBe(true);
    expect(isStrictMonoColorThemeCard({ mana_cost: '{3}{U}' }, ['U'])).toBe(false);
    expect(isStrictMonoColorThemeCard({ mana_cost: '{U/B}' }, ['U'])).toBe(false);
    expect(isStrictMonoColorThemeCard({ mana_cost: '{U}', color_identity: ['U', 'R'] }, ['U'])).toBe(true);
    expect(isStrictMonoColorThemeCard({ mana_cost: '{3}' }, [])).toBe(true);
  });
});
