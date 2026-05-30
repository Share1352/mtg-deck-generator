import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://scryfall.com/docs/tagger-tags';
const OUT = new URL('../public/data/scryfall-oracle-tags.json', import.meta.url);

// Scryfall blocks requests with a missing/generic User-Agent. Identify ourselves and accept HTML.
const HEADERS = {
  'User-Agent': 'mtg-deck-generator/1.0 (+https://github.com/share1352/mtg-deck-generator)',
  Accept: 'text/html',
};
// Mirror the spirit of src/lib/scryfallClient.js so a transient block/5xx doesn't kill the build.
const RETRY = { maxAttempts: 5, baseBackoffMs: 800, maxBackoffMs: 15000 };
// Sanity floor + a few slugs we know exist, so a structurally-valid-but-wrong scrape still fails loudly.
const MIN_TAGS = 1000;
const KNOWN_SLUGS = ['removal', 'sacrifice-outlet', 'draw-card'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSource() {
  let lastError;
  for (let attempt = 1; attempt <= RETRY.maxAttempts; attempt += 1) {
    try {
      const response = await fetch(SOURCE, { headers: HEADERS });
      if (response.ok) return response.text();
      // Retry transient server-side blocks; fail fast on hard client errors (e.g. 404).
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
      }
      lastError = new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < RETRY.maxAttempts) {
      const backoff = Math.min(RETRY.maxBackoffMs, RETRY.baseBackoffMs * 2 ** (attempt - 1));
      console.warn(`  attempt ${attempt} failed (${lastError.message}); retrying in ${backoff}ms`);
      await wait(backoff);
    }
  }
  throw lastError;
}

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

const html = await fetchSource();
const tags = [...html.matchAll(/(?:oracletag|function)%3A([^"&]+)/g)]
  .map((match) => decodeTag(match[1]))
  .filter((tag) => /^[a-z0-9][a-z0-9-]*$/i.test(tag));

const unique = [...new Set(tags)].sort((a, b) => a.localeCompare(b));
if (unique.length < MIN_TAGS) throw new Error(`Expected ${MIN_TAGS}+ Oracle tags, got ${unique.length}`);

const slugSet = new Set(unique);
const missingKnown = KNOWN_SLUGS.filter((slug) => !slugSet.has(slug));
if (missingKnown.length) {
  throw new Error(`Scrape looks wrong: missing known Oracle tag slug(s): ${missingKnown.join(', ')}`);
}

const payload = {
  source: SOURCE,
  builtAt: new Date().toISOString(),
  count: unique.length,
  tags: unique.map((tag) => ({ tag, name: titleFromTag(tag) })),
};

await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${unique.length} Scryfall Oracle tags to ${OUT.pathname}`);
