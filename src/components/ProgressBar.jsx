import React from 'react';
const h = React.createElement;

function fmt(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

export default function ProgressBar({ progress, joke, elapsedMs = 0, remainingMs = 0 }) {
  const finishing = progress >= 100 || remainingMs <= 0;
  return h('div', { className: 'loading-card' },
    h('div', { className: 'progress-row' },
      h('div', { className: 'progress' }, h('div', { style: { width: `${progress}%` } })),
      h('strong', null, `${progress}%`),
    ),
    h('div', { className: 'timer-row' },
      h('span', { className: 'timer-elapsed' }, `⏱ ${fmt(elapsedMs)} elapsed`),
      h('span', { className: 'timer-eta' }, finishing ? 'finishing up…' : `~${fmt(remainingMs)} left`),
    ),
    h('p', null, joke),
  );
}
