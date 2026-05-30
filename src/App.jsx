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
const LINES_KEY = 'mtgLastGenLines';
const DEFAULT_BASELINE_MS = 25000;
const DEFAULT_BASELINE_LINES = 60;
function loadNum(key, fallback) {
  try { const v = Number(globalThis.localStorage?.getItem(key)); return Number.isFinite(v) && v > 0 ? v : fallback; }
  catch { return fallback; }
}
function saveNum(key, value) {
  try { if (Number.isFinite(value) && value > 0) globalThis.localStorage?.setItem(key, String(Math.round(value))); } catch {}
}
// Completion is measured from the deck builder's own progress — the log lines it actually emits
// as it does work (theme pick, every card added, synergy repair, mana base, finalize) — compared
// to how many lines the last successful run produced. This tracks real generation progress instead
// of the coarse loading-bar percentage, so the ETA reflects how long the wait truly is (#38).
function completionFraction(lineCount, baselineLines) {
  const denom = baselineLines > 0 ? baselineLines : DEFAULT_BASELINE_LINES;
  return Math.min(0.99, Math.max(0.01, lineCount / denom));
}
// Live ETA: blend the historical run time with the projection from live completion, trusting the
// live projection more as the deck nears completion. Keeps the countdown honest even when a single
// Scryfall call stalls one step.
function estimateRemaining(elapsedMs, fraction, baselineMs) {
  if (fraction >= 1) return 0;
  const live = fraction > 0.03 ? elapsedMs / fraction : baselineMs;
  const w = Math.min(1, Math.max(0, fraction));
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
  const baselineRef = useRef(loadNum(BASELINE_KEY, DEFAULT_BASELINE_MS));
  const baselineLinesRef = useRef(loadNum(LINES_KEY, DEFAULT_BASELINE_LINES));
  const lineCountRef = useRef(0);

  void tick; // re-render driver for the live timer
  const elapsedMs = state === 'loading' ? Math.max(0, nowMs() - startRef.current) : 0;
  const fraction = state === 'loading' ? completionFraction(lineCountRef.current, baselineLinesRef.current) : (state === 'done' ? 1 : 0);
  // The bar tracks real work (log-line completion) but never falls behind the milestone progress.
  const barProgress = state === 'loading' ? Math.max(progress, Math.round(fraction * 100)) : progress;
  const remainingMs = state === 'loading' ? estimateRemaining(elapsedMs, fraction, baselineRef.current) : 0;
  const joke = useMemo(() => LOADING_JOKES[Math.min(LOADING_JOKES.length - 1, Math.floor(barProgress / 9))], [barProgress]);

  useEffect(() => {
    if (state !== 'loading') return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [state]);

  async function forge() {
    startRef.current = nowMs();
    lineCountRef.current = 0;
    setState('loading'); setError(null); setDeck(null); setProgress(1); setLogLines([]); setTick((t) => t + 1);
    const buffer = [];
    let pending = null;
    const flush = () => { pending = null; setLogLines(buffer.slice()); };
    const handleLog = (formatted) => {
      buffer.push(formatted);
      lineCountRef.current = buffer.length;
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
      saveNum(BASELINE_KEY, took);
      saveNum(LINES_KEY, buffer.length);
      baselineRef.current = took;
      baselineLinesRef.current = buffer.length;
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
      h(ProgressBar, { progress: barProgress, joke, elapsedMs, remainingMs }),
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
