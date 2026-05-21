import { describe, expect, it } from 'vitest';
import { shouldAutoForge } from '../lib/startup.js';

describe('startup helpers', () => {
  it('enables immediate deck forging from shareable URL flags', () => {
    expect(shouldAutoForge('?forge=1')).toBe(true);
    expect(shouldAutoForge('autoforge=true')).toBe(true);
    expect(shouldAutoForge('?start')).toBe(true);
  });

  it('keeps the normal landing button unless the URL asks to start', () => {
    expect(shouldAutoForge('')).toBe(false);
    expect(shouldAutoForge('?forge=0')).toBe(false);
    expect(shouldAutoForge('?autoforge=false')).toBe(false);
  });
});
