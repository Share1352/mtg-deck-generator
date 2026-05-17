import React from 'react';
import CardGrid from './CardGrid.jsx';
import DebugLogButton from './DebugLogButton.jsx';
const h = React.createElement;
export default function DeckView({ deck, onAgain }) {
  const copyDeck = async () => navigator.clipboard?.writeText(deck.exportText);
  return h('main', { className: 'deck-view' },
    h('section', { className: 'hero-result' },
      h('div', null, h('span', { className: 'eyebrow' }, 'Selected theme'), h('h1', null, deck.theme.name), h('p', null, `Chosen deck colors: ${deck.colors.join('') || 'Colorless'}`)),
      h('button', { className: 'forge-button small', onClick: onAgain }, 'Roll again'),
    ),
    h('section', null, h('h2', null, 'EDHREC synergy core'), h(CardGrid, { cards: deck.core })),
    h('section', null, h('h2', null, 'Random all-time theme cards'), h(CardGrid, { cards: deck.random })),
    h('section', null, h('h2', null, 'Mana base'), h(CardGrid, { cards: deck.lands })),
    h('section', { className: 'actions' }, h('button', { className: 'secondary', onClick: copyDeck }, 'Export decklist'), h(DebugLogButton, { log: deck.debugLog })),
    h('details', { className: 'log' }, h('summary', null, 'Debug log preview'), h('pre', null, deck.debugLog)),
  );
}
