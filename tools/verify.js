#!/usr/bin/env node
// tools/verify.js : compiles/runs every exercise solution against its tests.
// Usage: node tools/verify.js [sectionPrefix]
// Requires: node, python3, g++ on PATH. Run from repo root.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), vm = require('vm');

const ctx = { window: {} }; vm.createContext(ctx);
const contentDir = path.join(__dirname, '..', 'content');
for (const f of fs.readdirSync(contentDir)) {
  if (f.endsWith('.js') && f !== 'manifest.js')
    vm.runInContext(fs.readFileSync(path.join(contentDir, f), 'utf8'), ctx);
}
const SECTIONS = ctx.window.SECTIONS || {};
const filter = process.argv[2] || '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-'));

function runPy(code, stdin) {
  const p = path.join(tmp, 'sol.py'); fs.writeFileSync(p, code);
  const r = cp.spawnSync('python3', [p], { input: stdin, encoding: 'utf8', timeout: 8000 });
  return { out: ((r.stdout || '') + (r.status ? '\n' + (r.stderr || '') : '')).trim(), ok: r.status === 0 };
}
function runCpp(code, stdin, binCache) {
  if (!binCache.bin) {
    const src = path.join(tmp, 'sol.cpp'), bin = path.join(tmp, 'sol.out');
    fs.writeFileSync(src, code);
    const c = cp.spawnSync('g++', ['-O0', '-o', bin, src], { encoding: 'utf8', timeout: 20000 });
    if (c.status !== 0) return { out: 'COMPILE ERROR:\n' + c.stderr, ok: false };
    binCache.bin = bin;
  }
  const r = cp.spawnSync(binCache.bin, [], { input: stdin, encoding: 'utf8', timeout: 8000 });
  return { out: (r.stdout || '').trim(), ok: r.status === 0 };
}

let pass = 0, fail = 0;
const fails = [];
for (const [sec, exs] of Object.entries(SECTIONS)) {
  if (filter && !sec.startsWith(filter)) continue;
  const lang = sec.startsWith('py') ? 'py' : 'cpp';
  for (const ex of exs) {
    const binCache = {};
    ex.tests.forEach((t, i) => {
      const r = lang === 'py' ? runPy(ex.sol, t.in) : runCpp(ex.sol, t.in, binCache);
      if (r.ok && r.out === t.out.trim()) pass++;
      else { fail++; fails.push(`${sec}/${ex.id} test${i}: expected "${t.out.replace(/\n/g, '\\n')}" got "${r.out.replace(/\n/g, '\\n')}"`); }
    });
  }
}
console.log(`\nVERIFY: ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  FAIL ' + f));
process.exit(fail ? 1 : 0);
