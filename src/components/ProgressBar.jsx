import React from 'react';
const h = React.createElement;
export default function ProgressBar({ progress, joke }) {
  return h('div', { className: 'loading-card' },
    h('div', { className: 'progress-row' },
      h('div', { className: 'progress' }, h('div', { style: { width: `${progress}%` } })),
      h('strong', null, `${progress}%`),
    ),
    h('p', null, joke),
  );
}
