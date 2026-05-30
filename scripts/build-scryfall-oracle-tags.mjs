import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://scryfall.com/docs/tagger-tags';
const OUT = new URL('../public/data/scryfall-oracle-tags.json', import.meta.url);

function decodeTag(tag) {
  return decodeURIComponent(tag.replace(/\+/g, ' ')).trim();
}

function titleFromTag(tag) {
  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
const html = await response.text();
const tags = [...html.matchAll(/(?:oracletag|function)%3A([^"&]+)/g)]
  .map((match) => decodeTag(match[1]))
  .filter((tag) => /^[a-z0-9][a-z0-9-]*$/i.test(tag));

const unique = [...new Set(tags)].sort((a, b) => a.localeCompare(b));
if (unique.length < 1000) throw new Error(`Expected 1000+ Oracle tags, got ${unique.length}`);

const payload = {
  source: SOURCE,
  builtAt: new Date().toISOString(),
  count: unique.length,
  tags: unique.map((tag) => ({ tag, name: titleFromTag(tag) })),
};

await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${unique.length} Scryfall Oracle tags to ${OUT.pathname}`);
