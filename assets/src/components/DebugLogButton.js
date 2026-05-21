import React from '../../vendor/react.js';
const h = React.createElement;
export default function DebugLogButton({ log }) {
  const copy = async () => navigator.clipboard?.writeText(log);
  return h('button', { className: 'secondary', onClick: copy }, 'Copy whole log');
}
