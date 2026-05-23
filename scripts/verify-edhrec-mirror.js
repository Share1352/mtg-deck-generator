#!/usr/bin/env node
// Verifies that the EDHREC mirror in public/data/edhrec/ is present and valid
// before the build step.  Fails with exit code 1 on any policy violation.
//
// Required files (must exist and contain real card entries):
//   public/data/edhrec/pages/themes.json
//   public/data/edhrec/pages/tribes.json
//
// Optional files (may be empty stubs):
//   public/data/edhrec/pages/typal.json
//   public/data/edhrec/pages/keywords.json
//
// Manifest check:
//   public/data/edhrec/manifest.json must exist
//   manifest.themePagesFetched >= MIN_EDHREC_THEME_PAGES (default 10, env-overridable)

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const MIN_THEME_PAGES_DEFAULT = 10;

const REPAIR =
  'To repair:\n' +
  '  node scripts/prefetch-edhrec.js --top-n=1000 --allow-stale\n' +
  '  node scripts/verify-edhrec-mirror.js';

const REQUIRED_INDEX = [
  'public/data/edhrec/pages/themes.json',
  'public/data/edhrec/pages/tribes.json',
];

const OPTIONAL_INDEX = [
  'public/data/edhrec/pages/typal.json',
  'public/data/edhrec/pages/keywords.json',
];

function countCardEntries(data) {
  const lists =
    data?.container?.json_dict?.card_lists ||
    data?.container?.json_dict?.cardlists ||
    data?.json_dict?.card_lists ||
    data?.cardlists ||
    data?.card_lists ||
    [];
  return lists.reduce((acc, l) => acc + (l?.cardviews?.length || l?.cards?.length || 0), 0);
}

export function verifyMirror({ root = ROOT, minThemePages } = {}) {
  const min =
    minThemePages != null
      ? minThemePages
      : process.env.MIN_EDHREC_THEME_PAGES
        ? parseInt(process.env.MIN_EDHREC_THEME_PAGES, 10)
        : MIN_THEME_PAGES_DEFAULT;

  const failures = [];

  // 1. Manifest
  const manifestPath = join(root, 'public/data/edhrec/manifest.json');
  let manifest = null;
  if (!existsSync(manifestPath)) {
    failures.push('manifest missing: public/data/edhrec/manifest.json');
  } else {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      failures.push(`manifest invalid JSON: ${e.message}`);
    }
  }

  // 2. Required index files — must exist, parse as JSON, and contain at least one card entry
  for (const rel of REQUIRED_INDEX) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      failures.push(`required file missing: ${rel}`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(readFileSync(abs, 'utf8'));
    } catch (e) {
      failures.push(`required file invalid JSON: ${rel}: ${e.message}`);
      continue;
    }
    if (countCardEntries(data) === 0) {
      failures.push(`required file empty (no card entries): ${rel}`);
    } else {
      console.log(`verify-edhrec-mirror: present  ${rel}`);
    }
  }

  // 3. Optional index files — must exist and parse as JSON (empty stubs are fine)
  for (const rel of OPTIONAL_INDEX) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      failures.push(`optional file missing (should be stub): ${rel}`);
      continue;
    }
    try {
      JSON.parse(readFileSync(abs, 'utf8'));
      console.log(`verify-edhrec-mirror: present  ${rel}`);
    } catch (e) {
      failures.push(`optional file invalid JSON: ${rel}: ${e.message}`);
    }
  }

  // 4. Manifest theme page count
  if (manifest !== null) {
    const fetched = manifest.themePagesFetched ?? 0;
    if (fetched < min) {
      failures.push(
        `too few theme pages fetched: manifest.themePagesFetched=${fetched} < MIN_EDHREC_THEME_PAGES=${min}`,
      );
    } else {
      console.log(`verify-edhrec-mirror: themePagesFetched=${fetched} >= ${min} OK`);
    }
  }

  if (failures.length > 0) {
    console.error('verify-edhrec-mirror: FAILED');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    console.error(REPAIR);
    return { ok: false, failures };
  }

  console.log('verify-edhrec-mirror: all required EDHREC mirror files are present and valid.');
  return { ok: true, failures: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = verifyMirror();
  if (!result.ok) process.exit(1);
}
