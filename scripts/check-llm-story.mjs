// Keeps the visual story honest against the drawings and the checked lifecycle model.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const page = fs.readFileSync(new URL('src/pages/blog/how-llms-are-built/index.astro', root), 'utf8');
const art = fs.readFileSync(new URL('public/llm/card-scenes.js', root), 'utf8');
const spec = fs.readFileSync(new URL('public/llm/argon-model/LLMBuild.tla', root), 'utf8');

const context = { window: {}, document: { createElement: () => ({ getContext: () => ({}) }) } };
vm.runInNewContext(art, context, { timeout: 1000 });
const engine = context.window.LLMScenes;

const scenes = [...page.matchAll(/\{ id: '([a-z]+)', art: '([a-z_]+)', state: '(s\d+)'[\s\S]*?(?=\n  \{ id:|\n\];)/g)].map(m => {
  const detour = m[0].match(/detour: \{ art: '([a-z_]+)', state: '(s\d+)'/);
  return { id: m[1], art: m[2], state: m[3], detour: detour && { art: detour[1], state: detour[2] } };
});
assert.equal(scenes.length, 13, 'thirteen healthy scenes');
assert.equal(new Set(scenes.map(s => s.id)).size, 13, 'unique scene ids');
const arts = scenes.flatMap(s => [s.art, s.detour?.art].filter(Boolean));
assert.deepEqual([...arts].sort(), [...engine.types].sort(), 'every drawing is used exactly once');
for (const a of arts) assert.equal(engine.cues[a].length, 3, `${a} has three cues`);

const edges = [...spec.matchAll(/Move(s\d+)To(s\d+) ==/g)].map(m => [m[1], m[2]]);
const connected = (a, b) => edges.some(([x, y]) => x === a && y === b);
for (let i = 1; i < scenes.length; i++) assert.ok(connected(scenes[i - 1].state, scenes[i].state), `${scenes[i - 1].id} → ${scenes[i].id} is a model transition`);
for (const s of scenes.filter(s => s.detour)) {
  assert.ok(connected(s.state, s.detour.state), `${s.id} can break into ${s.detour.state}`);
  assert.ok(connected(s.detour.state, s.state), `${s.detour.state} can be repaired back to ${s.id}`);
  assert.ok(spec.includes(`phase # "${s.detour.state}"`), `${s.detour.state} violates a named invariant`);
}
const ids = [...page.matchAll(/\bid="([^"{]+)"/g)].map(m => m[1]);
assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), [], 'static ids are unique');
assert.ok(!page.includes('<dialog'), 'no modal reader');
assert.ok(!/On [a-z ]+ paper,/.test(page), 'copy does not narrate its own paper colour');
console.log(`PASS: 13 scenes + 3 detours, ${engine.types.length} drawings, order follows ${edges.length} checked transitions.`);
