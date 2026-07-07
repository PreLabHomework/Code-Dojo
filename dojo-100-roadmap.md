# DOJO: Road to 100%

Four gaps stand between the live site and complete. Work through them in order.

## Gap 1: Content (the big one, ~90 queued sections)
Each batch is one Claude session. Exact workflow per batch:
1. Open a NEW chat in the self-optimization Claude project.
2. Say: "DOJO batch N: populate [section ids] per CONTRIBUTING.md. Repo: https://github.com/PreLabHomework/dojo" (Claude fetches manifest + CONTRIBUTING from the repo).
3. Claude returns: one content/<batch>.js file, the manifest.js lines to flip ready:true, and the script tag for index.html.
4. Add to the repo. Easiest way, GitHub web UI: repo page > Add file > Upload files (drop the new content file), then edit manifest.js and index.html in the browser (pencil icon), commit. Or locally: copy files in, then
   git add -A && git commit -m "batch N" && git push
5. Pages redeploys itself in 1-2 minutes. Refresh the site, new sections are live.

Batch order (fire these off one per session):
- Batch 2: cpp07-cpp12 (challenges, strings, loop depth)
- Batch 3: py07-py12 (strings, dicts, comprehensions, sorting)
- Batch 4: fw02-fw06 (volatile/C-for-firmware, GPIO, ISRs, timers, protocols) <- Tier 1 priority
- Batch 5: cpp13-cpp19 (Big O, functions/classes, pointers, memory, STL)
- Batch 6: py13-py19 (two pointers, hashing, binary search, recursion, DP intro)
- Batch 7: cpp20-cpp27 (brute force through recursion ladder)
- Batch 8: py20-py27 + cpp28-cpp32 (DSA core both languages)
- Batch 9: cpp33-cpp40 (heap through resume-level modern C++/concurrency)
- Batch 10: fw07-fw14 (state machines through BLE/DSP resume level)
- Batch 11: hw01-hw09 (hardware track)
- Batch 12: ds01-ds05 + ai01-ai06 (data + ML tracks)
- Batch 13: py28-py31 (NumPy/Pandas/ML-pipeline resume level)

After batch 13 every section in the manifest is live. ~13 sessions total.

## Gap 2: AI features on the live site
Currently AI clue/review/style/generate only work when the app is opened inside Claude. To enable them on prelabhomework.github.io:
1. Replace js/ai.js in the repo with the updated ai.js provided alongside this roadmap (upload via GitHub web UI over the old one, commit).
2. In js/app.js, find the Settings view. Directly AFTER the Judge0 card closing </div>, paste:
```
    <div class="card">
      <p class="small">Anthropic API key (optional): unlocks AI clues, reviews, style-learning and the generator on this site. Personal use only.</p>
      <input id="ak" class="inpt wide" placeholder="sk-ant-..." value="${esc(S.anthropicKey || '')}">
      <button class="btn primary" id="saveak">Save key</button>
    </div>
```
   And directly AFTER the line containing `$('#savejk').addEventListener`... (the whole line), paste:
```
  $('#saveak').addEventListener('click', () => { State.patch({ anthropicKey: $('#ak').value }); alert('Saved.'); });
```
3. Get a key at console.anthropic.com > API keys. Paste it into DOJO Settings on the live site.
Security notes, read them: the key lives only in your browser's localStorage, never in the repo. NEVER commit the key anywhere. Anyone with the key can spend your API credits, so this pattern is for a personal tool only. API usage is pay-per-call (cents per grading).
Alternative if you skip this: keep using the dojo-v2-preview.html inside Claude whenever you want the AI layer; the live site stays runner+tests+clues.

## Gap 3: Make AI-generated exercises permanent
Exercises created by the in-app generator save to your browser only. To promote them into the real repo: Settings > Export all progress > copy the JSON > paste it into your next batch session and say "promote my generated exercises into content files". Claude converts them into a proper content/<file>.js with verified tests.

## Gap 4: Judge0 (full C++)
rapidapi.com > Judge0 CE > subscribe free plan > copy X-RapidAPI-Key > DOJO Settings > save. Interpreter remains the fallback automatically.

## Definition of done
- [ ] Batches 2-13 merged (all manifest sections ready:true)
- [ ] ai.js replaced + settings patch applied + your API key saved in-browser
- [ ] Judge0 key saved
- [ ] Generated exercises promoted at least once
When those boxes tick, DOJO is 100%: every track, zero to resume level, runnable, AI-tutored, self-growing.
