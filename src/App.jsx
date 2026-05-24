import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LOADING_JOKES } from './lib/constants.js';
import { generateDeck } from './lib/deckGenerator.js';
import { shouldAutoForge } from './lib/startup.js';
import GenerateButton from './components/GenerateButton.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import DeckView from './components/DeckView.jsx';
import LiveLog from './components/LiveLog.jsx';
const h = React.createElement;

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
  const autoForgeStarted = useRef(false);
  const joke = useMemo(() => LOADING_JOKES[Math.min(LOADING_JOKES.length - 1, Math.floor(progress / 9))], [progress]);

  async function forge() {
    setState('loading'); setError(null); setDeck(null); setProgress(1); setLogLines([]);
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
      h(ProgressBar, { progress, joke }),
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
