#!/usr/bin/env node
// Fails with exit code 1 if the required EDHREC mirror files are absent from
// public/data/edhrec/. Run this in CI before the build step to ensure the
// bundled mirror is present; without it the app silently falls back to
// unreliable browser requests.

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const REQUIRED = [
  'public/data/edhrec/pages/themes.json',
  'public/data/edhrec/pages/tribes.json',
  'public/data/edhrec/pages/typal.json',
  'public/data/edhrec/pages/keywords.json',
];

let allPresent = true;
for (const rel of REQUIRED) {
  if (existsSync(join(ROOT, rel))) {
    console.log(`verify-edhrec-mirror: present  ${rel}`);
  } else {
    console.error(`verify-edhrec-mirror: MISSING  ${rel}`);
    allPresent = false;
  }
}

if (!allPresent) {
  console.error(
    'verify-edhrec-mirror: one or more EDHREC mirror files are missing.\n' +
    'Run the refresh-edhrec-mirror workflow (workflow_dispatch) or locally:\n' +
    '  node scripts/prefetch-edhrec.js --top-n=1000',
  );
  process.exit(1);
}
console.log('verify-edhrec-mirror: all required EDHREC mirror files are present.');
