let currentRoot = null;
let hookIndex = 0;
const hookState = [];
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
export function __prepare(root, element) { currentRoot = root; currentRoot.element = element; hookIndex = 0; }
export default { createElement, useState, useMemo, StrictMode };
