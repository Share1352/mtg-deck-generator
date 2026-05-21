import React from '../../vendor/react.js';
const h = React.createElement;
function imageFor(card) { return card.image_uris?.normal || card.card_faces?.find((f) => f.image_uris)?.image_uris?.normal; }
export default function CardGrid({ cards }) {
  return h('div', { className: 'card-grid' }, cards.map((card, i) => h('article', { className: 'mtg-card', key: `${card.name}-${i}` },
    imageFor(card)
      ? h('img', { src: imageFor(card), alt: card.name, loading: 'lazy' })
      : h('div', { className: 'missing-art' }, h('strong', null, card.name), h('span', null, 'Image unavailable')),
    h('p', null, card.name),
  )));
}
