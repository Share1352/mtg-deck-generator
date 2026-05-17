import React from 'react';
const h = React.createElement;
export default function GenerateButton({ onClick, disabled, children = 'FORGE DECK' }) {
  return h('button', { className: 'forge-button', onClick, disabled }, children);
}
