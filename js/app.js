// app.js : state, routing, views
/* ============ state ============ */
const State = (() => {
  let mem = {};
  const load = () => { try { return JSON.parse(localStorage.getItem('dojo2') || '{}'); } catch (e) { return mem; } };
  let S = Object.assign({ solved: {}, attempts: {}, code: {}, generated: {}, styleProfile: '', judge0Key: '', playground: { lang: 'py', code: '# playground\nprint("hi")' }, history: [] }, load());
  const save = () => { try { localStorage.setItem('dojo2', JSON.stringify(S)); } catch (e) { mem = S; } };
  return { get: () => S, patch: p => { Object.assign(S, p); save(); }, save };
})();
window.State = State;

const $ = s => document.querySelector(s);
const app = () => $('#app');
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* merge generated exercises into SECTIONS */
function sectionExercises(id) {
  const base = (window.SECTIONS && SECTIONS[id]) || [];
  const gen = State.get().generated[id] || [];
  return base.concat(gen);
}
function sectionSolved(id) { return sectionExercises(id).filter(e => State.get().solved[e.id]).length; }
function langOf(secId) { return secId.startsWith('py') ? 'py' : 'cpp'; }

/* ============ editor factory (CodeMirror) ============ */
function makeEditor(parent, lang, value) {
  return CodeMirror(parent, {
    value, mode: lang === 'py' ? 'python' : 'text/x-c++src',
    theme: 'material-darker', lineNumbers: true, indentUnit: 4,
    autofocus: false, viewportMargin: Infinity,
  });
}

/* ============ views ============ */
function viewHome() {
  const t = MANIFEST.tracks;
  const roleRows = Object.entries(MANIFEST.roles).map(([r, trs]) =>
    `<div class="role"><span class="rname">${r}</span>${trs.map(k => `<a class="pill" href="#/track/${k}">${t[k].name}</a>`).join('')}</div>`).join('');
  app().innerHTML = `
    <div class="grid2">
      ${Object.entries(t).map(([k, tr]) => {
        const ready = tr.sections.filter(s => s.ready).length;
        const solved = tr.sections.reduce((a, s) => a + sectionSolved(s.id), 0);
        const total = tr.sections.reduce((a, s) => a + sectionExercises(s.id).length, 0);
        return `<a class="card track" href="#/track/${k}">
          <h3>${tr.name}</h3>
          <div class="meta">${tr.sections.length} sections \u00B7 ${ready} live \u00B7 ${solved}/${total || '...'} solved</div>
        </a>`;
      }).join('')}
    </div>
    <h2 class="h2">Role Tracks</h2>
    <div class="card">${roleRows}</div>
    <h2 class="h2">Tools</h2>
    <div class="grid2">
      <a class="card track" href="#/playground"><h3>Playground</h3><div class="meta">Mini editor + runner. Code here feeds your style profile.</div></a>
      <a class="card track" href="#/settings"><h3>Settings & Style Profile</h3><div class="meta">Judge0 key, learn-my-style, data export.</div></a>
    </div>`;
}

function viewTrack(key) {
  const tr = MANIFEST.tracks[key];
  if (!tr) return viewHome();
  app().innerHTML = `
    <a class="crumb" href="#/">\u2190 tracks</a>
    <h2 class="h2">${tr.name}</h2>
    ${tr.sections.map((s, i) => {
      const exs = sectionExercises(s.id);
      const done = sectionSolved(s.id);
      const live = s.ready || exs.length;
      return `<a class="sec ${live ? '' : 'locked'}" href="${live ? '#/section/' + s.id : 'javascript:void(0)'}">
        <span class="num">${String(i).padStart(2, '0')}.</span>
        <span class="sn">${s.n}</span>
        <span class="cnt">${live ? done + ' / ' + exs.length : 'queued'}</span>
      </a>`;
    }).join('')}
    <p class="small">Queued sections get populated in future build sessions or via the AI generator inside any live section.</p>`;
}

function viewSection(id) {
  const exs = sectionExercises(id);
  const track = Object.entries(MANIFEST.tracks).find(([k, t]) => t.sections.some(s => s.id === id));
  const meta = track[1].sections.find(s => s.id === id);
  app().innerHTML = `
    <a class="crumb" href="#/track/${track[0]}">\u2190 ${track[1].name}</a>
    <h2 class="h2">${meta.n}</h2>
    ${exs.map(e => `<a class="sec" href="#/ex/${id}/${e.id}">
      <span class="num">${State.get().solved[e.id] ? '\u2713' : '\u25CB'}</span>
      <span class="sn">${e.t}</span>
      <span class="cnt">${'\u25CF'.repeat(e.d)}</span></a>`).join('')}
    <div class="row" style="margin-top:16px">
      <button class="btn info" id="gen">AI: generate 3 more exercises here</button>
    </div><div id="gen-out" class="small"></div>`;
  $('#gen').addEventListener('click', async () => {
    $('#gen-out').textContent = 'Generating (needs Claude context)...';
    try {
      const more = await AI.generateExercises(meta.n, langOf(id), '');
      const g = State.get().generated; g[id] = (g[id] || []).concat(more); State.patch({ generated: g });
      viewSection(id);
    } catch (e) { $('#gen-out').textContent = 'Generator needs this app opened inside Claude, or the response was malformed. Try again there.'; }
  });
}

function viewExercise(secId, exId) {
  const ex = sectionExercises(secId).find(e => e.id === exId);
  if (!ex) return viewSection(secId);
  const lang = langOf(secId);
  const S = State.get();
  let hintIdx = 0;
  app().innerHTML = `
    <a class="crumb" href="#/section/${secId}">\u2190 back</a>
    <div class="exhead"><h2 class="h2" style="margin:0">${ex.t}</h2><span class="meta">${'\u25CF'.repeat(ex.d)} \u00B7 ${lang === 'py' ? 'Python' : 'C++'} ${S.solved[exId] ? '\u00B7 \u2713 solved' : ''}</span></div>
    <p class="prompt">${ex.p}</p>
    <div id="ed" class="edwrap"></div>
    <div class="row" style="margin-top:10px">
      <button class="btn primary" id="run">Run \u25B6</button>
      <button class="btn primary" id="submit">Submit tests</button>
      <button class="btn" id="hint">Clue (${ex.h.length})</button>
      <button class="btn info" id="aihint">AI clue</button>
      <button class="btn warn" id="sol">Solution</button>
    </div>
    <pre class="out" id="out">output appears here</pre>
    <div class="small" id="extra"></div>`;
  const ed = makeEditor($('#ed'), lang, S.code[exId] || ex.s);
  const saveCode = () => { const c = State.get().code; c[exId] = ed.getValue(); State.patch({ code: c }); };
  ed.on('change', saveCode);
  const out = $('#out');
  const status = m => out.textContent = m;

  $('#run').addEventListener('click', async () => {
    status('Running...');
    const stdin = ex.tests[0] ? ex.tests[0].in : '';
    const r = await Runner.run(lang, ed.getValue(), stdin, status);
    out.textContent = (stdin ? '[stdin: ' + stdin.replace(/\n/g, '\\n') + ']\n' : '') + (r.out || '(no output)');
  });

  $('#submit').addEventListener('click', async () => {
    status('Testing...');
    const a = State.get().attempts; a[exId] = (a[exId] || 0) + 1; State.patch({ attempts: a });
    let pass = 0, report = '';
    for (const t of ex.tests) {
      const r = await Runner.run(lang, ed.getValue(), t.in, status);
      const ok = r.ok && r.out.trim() === t.out.trim();
      if (ok) pass++;
      report += `${ok ? '\u2713' : '\u2717'} stdin "${t.in.replace(/\n/g, '\\n')}" \u2192 expected "${t.out.replace(/\n/g, '\\n')}" got "${(r.out || '').trim().replace(/\n/g, '\\n')}"\n`;
    }
    const all = pass === ex.tests.length;
    out.textContent = `${pass}/${ex.tests.length} tests passed\n` + report;
    if (all) {
      const s = State.get().solved; s[exId] = true; State.patch({ solved: s });
      const h = State.get().history; h.push({ id: exId, code: ed.getValue(), t: Date.now() }); State.patch({ history: h.slice(-100) });
      $('#extra').innerHTML = '<span class="ok">Solved. </span><button class="btn info" id="rev" style="margin-left:8px">AI review my solution</button><div id="rev-out" class="aiout"></div>';
      $('#rev').addEventListener('click', async () => {
        $('#rev-out').textContent = 'Reviewing...';
        try { $('#rev-out').textContent = await AI.review(ex, lang, ed.getValue()); }
        catch (e) { $('#rev-out').textContent = 'AI review needs this app opened inside Claude.'; }
      });
    }
  });

  $('#hint').addEventListener('click', () => {
    if (hintIdx < ex.h.length) $('#extra').innerHTML += `<div class="hint">Clue ${hintIdx + 1}: ${ex.h[hintIdx++]}</div>`;
  });
  $('#aihint').addEventListener('click', async () => {
    $('#extra').innerHTML += '<div class="hint" id="aih">Thinking...</div>';
    const el = document.getElementById('aih');
    try { el.textContent = 'AI clue: ' + await AI.hint(ex, lang, ed.getValue()); }
    catch (e) { el.textContent = 'AI clues need this app opened inside Claude. Built-in clues still work.'; }
  });
  $('#sol').addEventListener('click', () => {
    $('#extra').innerHTML += `<pre class="out">${esc(ex.sol)}</pre>`;
  });
}

function viewPlayground() {
  const S = State.get();
  app().innerHTML = `
    <a class="crumb" href="#/">\u2190 home</a>
    <div class="exhead"><h2 class="h2" style="margin:0">Playground</h2>
      <select id="pl-lang"><option value="py"${S.playground.lang === 'py' ? ' selected' : ''}>Python</option><option value="cpp"${S.playground.lang === 'cpp' ? ' selected' : ''}>C++</option></select>
    </div>
    <div id="ed" class="edwrap tall"></div>
    <div class="row" style="margin-top:10px">
      <label class="small">stdin:</label><input id="pl-in" class="inpt" placeholder="optional input">
      <button class="btn primary" id="run">Run \u25B6</button>
      <button class="btn info" id="learn">Learn my style from this + solved code</button>
    </div>
    <pre class="out" id="out">output appears here</pre>
    <div class="small" id="extra"></div>`;
  const ed = makeEditor($('#ed'), S.playground.lang, S.playground.code);
  const persist = () => State.patch({ playground: { lang: $('#pl-lang').value, code: ed.getValue() } });
  ed.on('change', persist);
  $('#pl-lang').addEventListener('change', () => { persist(); viewPlayground(); });
  $('#run').addEventListener('click', async () => {
    $('#out').textContent = 'Running...';
    const r = await Runner.run($('#pl-lang').value, ed.getValue(), $('#pl-in').value, m => $('#out').textContent = m);
    $('#out').textContent = r.out || '(no output)';
  });
  $('#learn').addEventListener('click', async () => {
    $('#extra').textContent = 'Analyzing your code...';
    const solvedSamples = State.get().history.slice(-8).map(h => h.code).join('\n\n---\n\n');
    const samples = ed.getValue() + '\n\n---\n\n' + solvedSamples;
    try {
      const prof = await AI.learnStyle(samples);
      $('#extra').innerHTML = '<div class="aiout"><b>Style profile learned</b> (now used by every AI clue and review):\n\n' + esc(prof) + '</div>';
    } catch (e) { $('#extra').textContent = 'Style learning needs this app opened inside Claude.'; }
  });
}

function viewSettings() {
  const S = State.get();
  app().innerHTML = `
    <a class="crumb" href="#/">\u2190 home</a>
    <h2 class="h2">Settings</h2>
    <div class="card">
      <p class="small">Judge0 API key (optional): unlocks full real C++ compilation. Free tier at rapidapi.com/judge0-official/api/judge0-ce. Without it, the built-in interpreter handles core C++.</p>
      <input id="jk" class="inpt wide" placeholder="X-RapidAPI-Key" value="${esc(S.judge0Key)}">
      <button class="btn primary" id="savejk">Save key</button>
    </div>
    <div class="card">
      <p class="small"><b>Style profile</b> (learned in Playground, injected into AI clues/reviews):</p>
      <pre class="out">${esc(S.styleProfile || 'none yet - use Playground > Learn my style')}</pre>
    </div>
    <div class="card row">
      <button class="btn" id="exp">Export all progress</button>
      <button class="btn" id="imp">Import</button>
      <button class="btn bad" id="wipe">Reset everything</button>
    </div>`;
  $('#savejk').addEventListener('click', () => { State.patch({ judge0Key: $('#jk').value }); alert('Saved.'); });
  $('#exp').addEventListener('click', () => prompt('Copy:', JSON.stringify(State.get())));
  $('#imp').addEventListener('click', () => { const v = prompt('Paste export:'); if (v) { try { localStorage.setItem('dojo2', v); location.reload(); } catch (e) { alert('Bad JSON'); } } });
  $('#wipe').addEventListener('click', () => { if (confirm('Wipe everything?')) { localStorage.removeItem('dojo2'); location.reload(); } });
}

/* ============ router ============ */
function route() {
  const h = location.hash.slice(2).split('/');
  if (h[0] === 'track') return viewTrack(h[1]);
  if (h[0] === 'section') return viewSection(h[1]);
  if (h[0] === 'ex') return viewExercise(h[1], h[2]);
  if (h[0] === 'playground') return viewPlayground();
  if (h[0] === 'settings') return viewSettings();
  viewHome();
}
window.addEventListener('hashchange', route);
route();
