import { isDeepStrictEqual } from 'node:util';
const tests = [];
export function describe(name, fn) { tests.push({ type: 'suite', name }); fn(); }
export function it(name, fn) { tests.push({ type: 'test', name, fn }); }
function fail(message) { throw new Error(message); }
function makeExpect(actual, negate = false) {
  const check = (ok, message) => { if (negate ? ok : !ok) fail(message); };
  const api = {
    get not() { return makeExpect(actual, !negate); },
    toBe(expected) { check(Object.is(actual, expected), `Expected ${actual} to be ${expected}`); },
    toEqual(expected) { check(isDeepStrictEqual(actual, expected), `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`); },
    toContain(expected) { check(actual?.includes?.(expected), `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`); },
    toHaveLength(expected) { check(actual?.length === expected, `Expected length ${actual?.length} to be ${expected}`); },
    toBeLessThan(expected) { check(actual < expected, `Expected ${actual} to be less than ${expected}`); },
    toBeGreaterThan(expected) { check(actual > expected, `Expected ${actual} to be greater than ${expected}`); },
    toBeGreaterThanOrEqual(expected) { check(actual >= expected, `Expected ${actual} to be greater than or equal to ${expected}`); },
    toMatch(expected) { const re = expected instanceof RegExp ? expected : new RegExp(expected); check(re.test(String(actual)), `Expected ${actual} to match ${re}`); },
  };
  return api;
}
export const expect = makeExpect;
export async function __run() {
  let passed = 0;
  let failed = 0;
  for (const item of tests) {
    if (item.type === 'suite') { console.log(`\n${item.name}`); continue; }
    try { await item.fn(); passed += 1; console.log(`  ✓ ${item.name}`); }
    catch (error) { failed += 1; console.error(`  ✗ ${item.name}`); console.error(`    ${error.stack || error.message}`); }
  }
  console.log(`\nTest Files  ${failed ? 'failed' : 'passed'}`);
  console.log(`Tests       ${passed} passed${failed ? `, ${failed} failed` : ''}`);
  if (failed) process.exitCode = 1;
}
