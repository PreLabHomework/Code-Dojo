# CONTRIBUTING (protocol for future Claude sessions)

This file tells any future session exactly how to grow DOJO without touching the engine.

## Adding a section's exercises
1. Pick queued section ids from `content/manifest.js` (e.g. cpp07, py07, fw02).
2. Create `content/<trackid>-batchN.js`:
```js
window.SECTIONS = window.SECTIONS || {};
Object.assign(window.SECTIONS, {
  cpp07: [ {id:"cpp07a", t:"Title", d:1, p:"Prompt. Input via stdin, exact stdout.",
            s:"starter", sol:"solution", tests:[{in:"stdin",out:"exact stdout"}],
            h:["clue 1","clue 2"]}, ... ],
});
```
3. Add `<script src="content/<file>.js"></script>` to index.html BEFORE js/app.js.
4. Flip `ready:true` on those sections in manifest.js.

## Rules for exercises
- 5-10 per section, difficulty ramping d:1 -> d:3.
- Every test must be exact-match stdout (trimmed). Verify solutions mentally against every test.
- C++ before section ~19: interpreter-safe only (iostream, arrays, functions, no STL containers, no templates). After: STL allowed, note "Judge0 recommended" in the prompt if needed.
- 2+ tests per exercise, including one edge case (negatives, zero, single element).
- Clues: first clue = direction, second = near-spoiler. Never full code in clues.
- Section themes and target depth are named in manifest.js; resume-level sections should reach Hamza's actual project difficulty (BLE stacks, session-safe ML splits, GAN concepts, register-level C).

## Batch size guidance
5-10 sections per session is sustainable. Prioritize: cpp07-12 and py07-12 next, then fw02-06 (his Tier 1 roles are firmware), then DSA sections in both languages, then hw/ds/ai tracks.

## Engine invariants (do not break)
- SECTIONS is a flat map sectionId -> exercise array; generated exercises merge at runtime from localStorage.
- Runner contract: Runner.run(lang, code, stdin, statusCb) -> {ok, out}.
- State keys: solved, attempts, code, generated, styleProfile, judge0Key, playground, history.
