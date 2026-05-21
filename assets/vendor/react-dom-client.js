import React, { __flushEffects, __prepare, StrictMode } from './react.js';
function setProps(node, props = {}) {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || value === undefined || value === null) continue;
    if (key === 'className') node.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'disabled' && value) node.setAttribute('disabled', '');
    else node.setAttribute(key, value);
  }
}
function toNode(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(String(vnode));
  if (!vnode) return document.createTextNode('');
  if (vnode.type === StrictMode) return fragment(vnode.props.children);
  if (typeof vnode.type === 'function') return toNode(vnode.type(vnode.props || {}));
  const node = document.createElement(vnode.type);
  setProps(node, vnode.props);
  for (const child of vnode.props?.children || []) node.appendChild(toNode(child));
  return node;
}
function fragment(children = []) {
  const frag = document.createDocumentFragment();
  for (const child of children) frag.appendChild(toNode(child));
  return frag;
}
export function createRoot(container) {
  const root = { element: null, render(element) { __prepare(root, element); container.replaceChildren(toNode(element)); __flushEffects(); } };
  return root;
}
