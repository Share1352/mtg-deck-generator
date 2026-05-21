import React, { useEffect, useMemo, useRef, useState } from '../vendor/react.js';
import { LOADING_JOKES } from './lib/constants.js';
import { generateDeck } from './lib/deckGenerator.js';
import { shouldAutoForge } from './lib/startup.js';
import GenerateButton from './components/GenerateButton.js';
import ProgressBar from './components/ProgressBar.js';
import DeckView from './components/DeckView.js';
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
    return 'EDHREC and Scryfall must be reachable to build a deck. The app does not use any offline card data. Check your connection and try again.';
  }
  return msg.split('\n')[0];
}

export default function App() {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState(null);
  const autoForge = useMemo(() => shouldAutoForge(), []);
  const autoForgeStarted = useRef(false);
  const joke = useMemo(() => LOADING_JOKES[Math.min(LOADING_JOKES.length - 1, Math.floor(progress / 9))], [progress]);
  async function forge() {
    setState('loading'); setError(null); setDeck(null); setProgress(1);
    try { setDeck(await generateDeck({ onProgress: (p) => setProgress(Math.round(p)) })); setState('done'); }
    catch (e) { setError(e); setState('error'); }
  }
  useEffect(() => {
    if (!autoForge || autoForgeStarted.current) return;
    autoForgeStarted.current = true;
    forge();
  }, [autoForge]);
  if (state === 'idle') return h('main', { className: 'single-button' }, h(GenerateButton, { onClick: forge }));
  if (state === 'loading') return h('main', { className: 'single-button' }, h(ProgressBar, { progress, joke }));
  if (state === 'error') return h(
    'main',
    { className: 'error' },
    h('h1', null, errorHeadline(error)),
    h('p', null, errorBlurb(error)),
    h(GenerateButton, { onClick: forge }, 'TRY AGAIN'),
  );
  return h(DeckView, { deck, onAgain: forge });
}
