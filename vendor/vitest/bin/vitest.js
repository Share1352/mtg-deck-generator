#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { __run } from '../index.js';
const testDir = join(process.cwd(), 'src', 'tests');
for (const file of readdirSync(testDir).filter((name) => name.endsWith('.test.js')).sort()) {
  await import(pathToFileURL(join(testDir, file)).href);
}
await __run();
