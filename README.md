# DOJO v2

Personal learning platform: Python, C++, and firmware from absolute zero up to Hamza's resume level. Courses + runnable exercises + AI tutor that learns his coding style.

## Run
Open `index.html` in a browser, or serve the folder (`python -m http.server`) for cleanest behavior. Deployable directly on GitHub Pages.

## Features
- **Tracks**: C++ (40 sections), Python (31), Firmware (14), Hardware (9), Data/SQL (5), AI/ML (6). Role tracks (Firmware/Hardware/Software/AI/Data Engineer) map to ordered track combinations.
- **Runner**: Python via Pyodide (real CPython in WASM). C++ via built-in interpreter by default; add a free Judge0 key in Settings for full real compilation.
- **Exercises**: prompt + starter + progressive clues + AI clue + auto-graded stdin/stdout tests + revealable solution + post-solve AI code review.
- **Playground**: mini editor (CodeMirror) with runner, both languages.
- **Self-learning**: "Learn my style" distills a style profile from playground code + your last solved solutions; the profile is injected into every AI clue and review. "Generate 3 more exercises" grows any section with AI-authored, weakness-targeted problems saved locally.
- **AI features** work when the app is opened inside Claude (artifact preview uses the Claude API directly); everywhere else the app degrades gracefully (runner, tests, built-in clues all still work).

## Content status
Live now: C++ 01-06 (36 exercises), Python 01-06 (35), Firmware 01 (4). Everything else is mapped in `content/manifest.js` and marked queued. Growth protocol in CONTRIBUTING.md.

## GitHub setup
```bash
cd dojo
git init
git add -A
git commit -m "DOJO v2: engine + core curriculum"
# create the repo (choose one):
gh repo create dojo --private --source=. --push        # if you have GitHub CLI
# or make an empty repo named dojo on github.com, then:
git remote add origin https://github.com/PreLabHomework/dojo.git
git branch -M main
git push -u origin main
```
GitHub Pages: repo Settings > Pages > Deploy from branch > main / root. Site appears at https://prelabhomework.github.io/Code-Dojo/.
