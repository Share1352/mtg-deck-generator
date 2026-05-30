import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LOADING_JOKES } from './lib/constants.js';
import { generateDeck } from './lib/deckGenerator.js';
import { shouldAutoForge } from './lib/startup.js';
import GenerateButton from './components/GenerateButton.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import DeckView from './components/DeckView.jsx';
import LiveLog from './components/LiveLog.jsx';
const h = React.createElement;

const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
const BASELINE_KEY = 'mtgLastGenMs';
const DEFAULT_BASELINE_MS = 25000;
function loadBaseline() {
  try { const v = Number(globalThis.localStorage?.getItem(BASELINE_KEY)); return Number.isFinite(v) && v > 0 ? v : DEFAULT_BASELINE_MS; }
  catch { return DEFAULT_BASELINE_MS; }
}
function saveBaseline(ms) {
  try { if (Number.isFinite(ms) && ms > 0) globalThis.localStorage?.setItem(BASELINE_KEY, String(Math.round(ms))); } catch {}
}
// Live ETA: blend the historical run time with the projection from current progress,
// trusting the live projection more as progress climbs. Keeps the countdown honest
// even when a single Scryfall call stalls the bar.
function estimateRemaining(elapsedMs, progress, baselineMs) {
  if (progress >= 100) return 0;
  const live = progress > 3 ? elapsedMs * (100 / progress) : baselineMs;
  const w = Math.min(1, Math.max(0, progress / 100));
  const total = baselineMs ? (1 - w) * baselineMs + w * live : live;
  return Math.max(0, total - elapsedMs);
}

function errorHeadline(error) {
  const msg = error?.message || '';
  if (/Online theme sources are unreachable/i.test(msg)) return 'Online card databases unreachable';
  if (/Online card database is unreachable/i.test(msg)) return 'Online card databases unreachable';
  return 'The forge fizzled';
}

function errorBlurb(error) {
  const msg = error?.message || 'Unknown error';
  if (/Online theme sources are unreachable/i.test(msg) || /Online card database is unreachable/i.test(msg)) {
    return 'Scryfall must be reachable to build a deck. The app does not use any offline card data. Check your connection and try again.';
  }
  return msg.split('\n')[0];
}

export default function App() {
  const autoForge = useMemo(() => shouldAutoForge(), []);
  const [state, setState] = useState(() => (autoForge ? 'loading' : 'idle'));
  const [progress, setProgress] = useState(() => (autoForge ? 1 : 0));
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState(null);
  const [logLines, setLogLines] = useState([]);
  const [tick, setTick] = useState(0);
  const autoForgeStarted = useRef(false);
  const startRef = useRef(0);
  const baselineRef = useRef(loadBaseline());
  const joke = useMemo(() => LOADING_JOKES[Math.min(LOADING_JOKES.length - 1, Math.floor(progress / 9))], [progress]);

  const elapsedMs = state === 'loading' ? Math.max(0, nowMs() - startRef.current) : 0;
  const remainingMs = state === 'loading' ? estimateRemaining(elapsedMs, progress, baselineRef.current) : 0;
  void tick; // re-render driver for the live timer

  useEffect(() => {
    if (state !== 'loading') return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [state]);

  async function forge() {
    startRef.current = nowMs();
    setState('loading'); setError(null); setDeck(null); setProgress(1); setLogLines([]); setTick((t) => t + 1);
    const buffer = [];
    let pending = null;
    const flush = () => { pending = null; setLogLines(buffer.slice()); };
    const handleLog = (formatted) => {
      buffer.push(formatted);
      if (pending == null) {
        pending = (typeof requestAnimationFrame === 'function')
          ? requestAnimationFrame(flush)
          : setTimeout(flush, 16);
      }
    };
    try {
      const built = await generateDeck({
        onProgress: (p) => setProgress(Math.round(p)),
        onLog: handleLog,
      });
      const took = Math.max(0, nowMs() - startRef.current);
      saveBaseline(took);
      baselineRef.current = took;
      setLogLines(buffer.slice());
      setDeck(built);
      setState('done');
    } catch (e) {
      setLogLines(buffer.slice());
      setError(e);
      setState('error');
    }
  }

  useEffect(() => {
    if (!autoForge || autoForgeStarted.current) return;
    autoForgeStarted.current = true;
    forge();
  }, [autoForge]);

  if (state === 'idle') return h('main', { className: 'single-button' }, h(GenerateButton, { onClick: forge }));
  if (state === 'loading') return h(
    'main',
    { className: 'loading-page' },
    h('div', { className: 'loading-card' },
      h(ProgressBar, { progress, joke, elapsedMs, remainingMs }),
    ),
    h(LiveLog, { lines: logLines }),
  );
  if (state === 'error') return h(
    'main',
    { className: 'error-page' },
    h('div', { className: 'error' },
      h('h1', null, errorHeadline(error)),
      h('p', null, errorBlurb(error)),
      h(GenerateButton, { onClick: forge }, 'TRY AGAIN'),
    ),
    logLines.length ? h(LiveLog, { lines: logLines, title: 'Build log' }) : null,
  );
  return h(DeckView, { deck, onAgain: forge });
}
