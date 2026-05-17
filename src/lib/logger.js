import { APP_VERSION } from './constants.js';
export function createLogger() {
  const lines = [];
  const stamp = () => new Date().toISOString().slice(11, 19);
  return {
    line(message) { lines.push(`[${stamp()}] ${message}`); },
    start(seed) { this.line(`START v${APP_VERSION}${seed ? ` seed=${seed}` : ''}`); },
    error(context, error) { this.line(`ERROR ${context}: ${error?.message || String(error)}`); },
    text() { return lines.join('\n'); },
    lines,
  };
}
