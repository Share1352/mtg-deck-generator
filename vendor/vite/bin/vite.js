#!/usr/bin/env node
import { createServer } from 'node:http';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const cwd = process.cwd();
const command = process.argv[2] || 'dev';
const base = '/mtg-deck-generator/';
const outDir = join(cwd, 'dist');
function ensure(dir) { mkdirSync(dir, { recursive: true }); }
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path)); else out.push(path);
  }
  return out;
}
function replaceExt(file) { return file.replace(/\.jsx$/, '.js'); }
function relImport(fromOutFile, targetOutFile) {
  let rel = relative(dirname(fromOutFile), targetOutFile).replaceAll('\\\\', '/').replaceAll('\\', '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}
function vendorTarget(spec) {
  if (spec === 'react') return join(outDir, 'assets', 'vendor', 'react.js');
  if (spec === 'react-dom/client') return join(outDir, 'assets', 'vendor', 'react-dom-client.js');
  return null;
}
function transformJs(source, srcFile, outFile) {
  let code = source.replace(/^import\s+['"]\.\/styles\.css['"];?\n?/m, '');
  code = code.replace(/from ['"]([^'"]+)['"]/g, (match, spec) => {
    const vendor = vendorTarget(spec);
    if (vendor) return `from '${relImport(outFile, vendor)}'`;
    if (spec.startsWith('.')) {
      const targetSrc = resolve(dirname(srcFile), spec);
      const withExt = existsSync(targetSrc) ? targetSrc : existsSync(`${targetSrc}.js`) ? `${targetSrc}.js` : existsSync(`${targetSrc}.jsx`) ? `${targetSrc}.jsx` : targetSrc;
      const targetOut = join(outDir, 'assets', replaceExt(relative(cwd, withExt)));
      return `from '${relImport(outFile, targetOut)}'`;
    }
    return match;
  });
  code = code.replace(/import\(['"]([^'"]+)['"]\)/g, (match, spec) => match);
  return code;
}
function copyRecursiveFiles(srcDir, destDir) {
  for (const file of walk(srcDir)) {
    const rel = relative(srcDir, file);
    const dest = join(destDir, rel);
    ensure(dirname(dest));
    copyFileSync(file, dest);
  }
}
function build() {
  rmSync(outDir, { recursive: true, force: true });
  ensure(join(outDir, 'assets', 'src'));
  copyRecursiveFiles(join(cwd, 'public'), outDir);
  for (const file of walk(join(cwd, 'src'))) {
    const ext = extname(file);
    const rel = relative(cwd, file);
    const dest = join(outDir, 'assets', replaceExt(rel));
    ensure(dirname(dest));
    if (ext === '.js' || ext === '.jsx') writeFileSync(dest, transformJs(readFileSync(file, 'utf8'), file, dest));
    else copyFileSync(file, dest);
  }
  ensure(join(outDir, 'assets', 'vendor'));
  copyFileSync(join(cwd, 'vendor', 'react', 'index.js'), join(outDir, 'assets', 'vendor', 'react.js'));
  writeFileSync(join(outDir, 'assets', 'vendor', 'react-dom-client.js'), readFileSync(join(cwd, 'vendor', 'react-dom', 'client.js'), 'utf8').replace("from 'react'", "from './react.js'"));
  const html = readFileSync(join(cwd, 'index.html'), 'utf8')
    .replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/mtg-deck-generator/assets/src/styles.css" />\n    <script type="module" src="/mtg-deck-generator/assets/src/main.js"></script>');
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('vite v6.0.0-local building for production...');
  console.log('✓ built in local offline mode');
}
function mime(file) {
  if (file.endsWith('.html')) return 'text/html';
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}
function serve(dir, port = 4173) {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const stripped = urlPath.startsWith(base) ? urlPath.slice(base.length - 1) : urlPath;
    let file = join(dir, stripped === '/' ? 'index.html' : stripped);
    if (!existsSync(file)) file = join(dir, 'index.html');
    res.setHeader('Content-Type', mime(file));
    res.end(readFileSync(file));
  });
  server.listen(port, () => console.log(`  ➜  Local:   http://localhost:${port}${base}`));
}
if (command === 'build') build();
else if (command === 'preview') { if (!existsSync(outDir)) build(); serve(outDir, Number(process.env.PORT || 4173)); }
else { build(); serve(outDir, Number(process.env.PORT || 5173)); }
