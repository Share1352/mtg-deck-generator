import React, { useEffect, useRef } from 'react';
const h = React.createElement;

export default function LiveLog({ lines, title = 'Live build log' }) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    pinnedRef.current = distanceFromBottom < 40;
  };

  return h('div', { className: 'live-log' },
    h('div', { className: 'live-log-head' },
      h('strong', null, title),
      h('span', { className: 'live-log-count' }, `${lines.length} line${lines.length === 1 ? '' : 's'}`),
    ),
    h('pre', { className: 'live-log-body', ref: scrollRef, onScroll },
      lines.length ? lines.join('\n') : 'Waiting for first log line…',
    ),
  );
}
