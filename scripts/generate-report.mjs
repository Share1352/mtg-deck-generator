// Headless end-to-end generation run for CI.
//
// Runs the real deck generator (live Scryfall) exactly as the browser does and
// writes the resulting deck list + full log to reports/latest-deck.md. The CI
// workflow commits that file back to the repo so it is the FIRST artifact to
// review next session: confirm the generator still works end to end before any
// new feature work begins. A thrown generation also produces a FAILED report and
// exits non-zero, so a broken pipeline shows up red and is recorded in the repo.
import { readFile } from 'node:fs/promises';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const publicDir = join(repoRoot, 'public');
const reportPath = join(repoRoot, 'reports', 'latest-deck.md');

// The frontend loads its bundled Oracle-tag index with a root-relative fetch
// ("/data/scryfall-oracle-tags.json"). In Node there is no origin to resolve
// that against, so shim fetch: serve root-relative paths from public/, pass
// every absolute (Scryfall) URL through to the real fetch untouched.
const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url || String(input);
  if (/^https?:\/\//i.test(url)) return realFetch(input, init);
  const relative = url.replace(/^\/+/, '').split('?')[0];
  try {
    const body = await readFile(join(publicDir, relative));
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  } catch {
    return new Response(`not found: ${relative}`, { status: 404 });
  }
};

const { generateDeck } = await import('../src/lib/deckGenerator.js');

const startedAt = new Date();
const seed = process.env.REPORT_SEED ? Number(process.env.REPORT_SEED) : Date.now();
const commit = process.env.GITHUB_SHA || 'local';
const runUrl = process.env.GITHUB_RUN_ID
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;

const logLines = [];
let deck = null;
let error = null;
try {
  deck = await generateDeck({ seed, onLog: (line) => logLines.push(line) });
} catch (e) {
  error = e;
}

const status = error ? 'FAILED ❌' : 'OK ✅';
const log = deck?.debugLog || logLines.join('\n') || String(error?.stack || error || '');
const deckList = deck?.exportText || '(no deck produced — see log below)';
const counts = deck
  ? `nonlands=${deck.nonlands.length} lands=${deck.lands.length} total=${deck.nonlands.length + deck.lands.length}`
  : 'n/a';

const md = `# Latest generation report

> **Reviewer note (read this first):** automated end-to-end generation run on every push to \`main\`.
> Confirm the generator still works — status below should be \`OK\` and the deck list / log should look sane —
> **before** starting any new feature. If status is \`FAILED\`, fix that first.

| Field | Value |
| --- | --- |
| Status | ${status} |
| Generated | ${startedAt.toISOString()} |
| Commit | \`${commit}\` |
| Theme | ${deck?.theme?.name || 'n/a'} |
| Colors | ${(deck?.colors || []).join('') || 'n/a'} |
| Counts | ${counts} |
| Seed | ${seed} |${runUrl ? `\n| CI run | ${runUrl} |` : ''}
${error ? `\n**Error:** \`${String(error.message || error).split('\n')[0]}\`\n` : ''}
## Deck list

\`\`\`
${deckList.trim()}
\`\`\`

## Full generation log

\`\`\`
${log.trim()}
\`\`\`
`;

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, md, 'utf8');
console.log(`Wrote ${reportPath} — status ${status} (theme: ${deck?.theme?.name || 'n/a'})`);

// Non-zero on failure so the CI job goes red; the commit step runs with if: always().
if (error) process.exitCode = 1;
