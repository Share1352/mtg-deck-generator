import React, { useMemo, useState } from 'react';
import { LOADING_JOKES } from './lib/constants.js';
import { generateDeck } from './lib/deckGenerator.js';
import GenerateButton from './components/GenerateButton.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import DeckView from './components/DeckView.jsx';
const h = React.createElement;
export default function App() {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState(null);
  const joke = useMemo(() => LOADING_JOKES[Math.min(LOADING_JOKES.length - 1, Math.floor(progress / 9))], [progress]);
  async function forge() {
    setState('loading'); setError(null); setDeck(null); setProgress(1);
    try { setDeck(await generateDeck({ onProgress: (p) => setProgress(Math.round(p)) })); setState('done'); }
    catch (e) { setError(e); setState('error'); }
  }
  if (state === 'idle') return h('main', { className: 'single-button' }, h(GenerateButton, { onClick: forge }));
  if (state === 'loading') return h('main', { className: 'single-button' }, h(ProgressBar, { progress, joke }));
  if (state === 'error') return h('main', { className: 'error' }, h('h1', null, 'The forge fizzled'), h('p', null, error.message), h(GenerateButton, { onClick: forge }, 'TRY AGAIN'));
  return h(DeckView, { deck, onAgain: forge });
}
