let currentRoot = null;
let hookIndex = 0;
const hookState = [];
let pendingEffects = [];
export const StrictMode = Symbol('StrictMode');
export function createElement(type, props, ...children) {
  return { type, props: { ...(props || {}), children: children.flat().filter((child) => child !== false && child !== true && child !== null && child !== undefined) } };
}
export function useState(initialValue) {
  const index = hookIndex++;
  if (!(index in hookState)) hookState[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
  const setState = (next) => {
    hookState[index] = typeof next === 'function' ? next(hookState[index]) : next;
    currentRoot?.render(currentRoot.element);
  };
  return [hookState[index], setState];
}
export function useMemo(factory) { return factory(); }
export function useRef(initialValue) {
  const index = hookIndex++;
  if (!(index in hookState)) hookState[index] = { current: initialValue };
  return hookState[index];
}
function depsChanged(previous, next) {
  if (!previous || !next || previous.length !== next.length) return true;
  return next.some((value, index) => !Object.is(value, previous[index]));
}
export function useEffect(effect, dependencies) {
  const index = hookIndex++;
  if (depsChanged(hookState[index], dependencies)) {
    hookState[index] = dependencies;
    pendingEffects.push(effect);
  }
}
export function __prepare(root, element) { currentRoot = root; currentRoot.element = element; hookIndex = 0; pendingEffects = []; }
export function __flushEffects() {
  const effects = pendingEffects;
  pendingEffects = [];
  for (const effect of effects) effect();
}
export default { createElement, useState, useMemo, useRef, useEffect, StrictMode };
