import { APP_VERSION } from './constants.js';
export function createLogger({ onLine } = {}) {
  const lines = [];
  const subscribers = new Set();
  if (typeof onLine === 'function') subscribers.add(onLine);
  const stamp = () => new Date().toISOString().slice(11, 19);
  function emit(formatted) {
    lines.push(formatted);
    for (const cb of subscribers) {
      try { cb(formatted, lines); } catch {}
    }
  }
  return {
    line(message) { emit(`[${stamp()}] ${message}`); },
    start(seed) { this.line(`START v${APP_VERSION}${seed ? ` seed=${seed}` : ''}`); },
    error(context, error) { this.line(`ERROR ${context}: ${error?.message || String(error)}`); },
    text() { return lines.join('\n'); },
    subscribe(cb) { if (typeof cb === 'function') { subscribers.add(cb); return () => subscribers.delete(cb); } return () => {}; },
    lines,
  };
}
