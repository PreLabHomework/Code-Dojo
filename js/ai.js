// ai.js : Claude-powered layer.
// Works two ways: (a) opened inside Claude = no key needed; (b) on your own site
// with a personal Anthropic API key saved in Settings (stored in localStorage only).
const AI = (() => {
  async function ask(prompt, maxTokens = 1200) {
    const key = (window.State && State.get().anthropicKey || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (key) {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers,
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) throw new Error('API ' + r.status + (key ? ' (check your key/credits)' : ' (open inside Claude or add a key in Settings)'));
    const d = await r.json();
    return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  }

  const styleCtx = () => {
    const p = State.get().styleProfile;
    return p ? `\nThe student's coding style profile (match your suggestions to it): ${p}\n` : '';
  };

  async function hint(ex, lang, userCode) {
    return ask(`You are a coding tutor. Exercise: "${ex.p}". Language: ${lang === 'py' ? 'Python' : 'C++'}.
Student's current code:\n${userCode}\n${styleCtx()}
Give ONE nudge toward the solution: point at what's wrong or the next step. Do NOT write the solution or full lines of answer code. Max 40 words.`);
  }

  async function review(ex, lang, userCode) {
    return ask(`You are a code reviewer. The student SOLVED this exercise (tests pass): "${ex.p}" in ${lang === 'py' ? 'Python' : 'C++'}.
Their code:\n${userCode}\n
Reference solution:\n${ex.sol}\n${styleCtx()}
In under 100 words: one thing done well, one improvement (idiom, naming, efficiency, or edge case). Direct tone.`);
  }

  async function learnStyle(samples) {
    const out = await ask(`Analyze these code samples from one programmer. Distill their personal coding style into a compact profile (under 120 words): naming conventions, structure habits, idioms they favor, common weaknesses to watch. Write it as instructions for a tutor adapting to them.\n\n${samples}`, 600);
    State.patch({ styleProfile: out });
    return out;
  }

  async function generateExercises(sectionName, lang, weakNotes) {
    const raw = await ask(`Generate 3 coding exercises for the section "${sectionName}" in ${lang === 'py' ? 'Python' : 'C++ (must run with only iostream, basic arrays, no STL containers)'}.
${weakNotes ? 'Target these weaknesses: ' + weakNotes : ''}
Respond ONLY with a JSON array, no markdown fences. Each item:
{"id":"gen-<random6>","t":"title","d":1|2|3,"p":"prompt (input via stdin, exact stdout specified)","s":"starter code","sol":"full solution","tests":[{"in":"stdin","out":"exact expected stdout"}],"h":["hint1","hint2"]}
Programs must read stdin and write stdout exactly as specified. 2 tests each minimum.`, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  return { hint, review, learnStyle, generateExercises };
})();
