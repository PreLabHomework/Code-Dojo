// runner.js : code execution. Python via Pyodide, C++ via JSCPP (default) or Judge0 (optional).
const Runner = (() => {
  let pyodide = null, pyLoading = null;

  async function ensurePy(status) {
    if (pyodide) return pyodide;
    if (!pyLoading) {
      status && status('Loading Python runtime (first run only, ~10s)...');
      pyLoading = (async () => {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          s.onload = res; s.onerror = () => rej(new Error('Pyodide CDN unreachable'));
          document.head.appendChild(s);
        });
        pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
        return pyodide;
      })();
    }
    return pyLoading;
  }

  async function runPython(code, stdin, status) {
    const py = await ensurePy(status);
    let out = '';
    py.setStdout({ batched: s => out += s + '\n' });
    py.setStderr({ batched: s => out += s + '\n' });
    // feed stdin via input() override
    const lines = JSON.stringify((stdin || '').split('\n'));
    const harness = `
import builtins, sys
__lines = ${lines}
__i = [0]
def __input(prompt=''):
    if __i[0] >= len(__lines): raise EOFError('no more input')
    v = __lines[__i[0]]; __i[0]+=1; return v
builtins.input = __input
`;
    try {
      await py.runPythonAsync(harness + '\n' + code);
      return { ok: true, out: out.replace(/\n$/, '') };
    } catch (e) {
      const msg = String(e.message || e).split('\n').filter(l =>
        l.includes('Error') || l.includes('line') || l.includes('^')).slice(-6).join('\n');
      return { ok: false, out: out + (out ? '\n' : '') + (msg || String(e)) };
    }
  }

  let jscppLoading = null;
  async function ensureJSCPP(status) {
    if (window.JSCPP) return;
    if (!jscppLoading) {
      status && status('Loading C++ interpreter...');
      jscppLoading = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/JSCPP@2.0.5/dist/JSCPP.es5.min.js';
        s.onload = res; s.onerror = () => rej(new Error('JSCPP CDN unreachable'));
        document.head.appendChild(s);
      });
    }
    return jscppLoading;
  }

  async function runCppInterp(code, stdin, status) {
    await ensureJSCPP(status);
    let out = '';
    try {
      JSCPP.run(code, stdin || '', { stdio: { write: s => out += s } });
      return { ok: true, out: out.replace(/\n$/, '') };
    } catch (e) {
      return { ok: false, out: out + (out ? '\n' : '') + 'Interpreter: ' + String(e.message || e) +
        '\n(Note: the built-in interpreter covers core C++. For full STL/templates, add a Judge0 key in Settings.)' };
    }
  }

  async function runCppJudge0(code, stdin, key) {
    const r = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true&base64_encoded=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' },
      body: JSON.stringify({ language_id: 54, source_code: btoa(unescape(encodeURIComponent(code))), stdin: btoa(unescape(encodeURIComponent(stdin || ''))) })
    });
    const d = await r.json();
    const dec = s => s ? decodeURIComponent(escape(atob(s))) : '';
    const out = (dec(d.stdout) + (d.stderr ? '\n' + dec(d.stderr) : '') + (d.compile_output ? '\n' + dec(d.compile_output) : '')).trim();
    return { ok: d.status && d.status.id === 3, out };
  }

  async function run(lang, code, stdin, status) {
    if (lang === 'py') return runPython(code, stdin, status);
    const key = (window.State && State.get().judge0Key || '').trim();
    if (key) { try { return await runCppJudge0(code, stdin, key); } catch (e) { /* fall through */ } }
    return runCppInterp(code, stdin, status);
  }

  return { run };
})();
