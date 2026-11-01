import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file=fs.readFileSync(new URL('../src/pages/blog/how-llms-are-built/index.astro',import.meta.url),'utf8');
const script=file.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const states=JSON.parse(vm.runInNewContext(script.slice(0,script.indexOf('const STATE_MAP'))+'\nJSON.stringify(STATES)',{}, {timeout:1000}));
assert.equal(states.length,16);assert.equal(new Set(states.map(s=>s.id)).size,16);
const edges=states.flatMap(s=>s.steps.map(t=>({from:s.id,to:t.to,name:'Move'+s.id+'To'+t.to,label:t.label})));
assert.equal(edges.length,22);for(const edge of edges)assert.ok(states.some(s=>s.id===edge.to));
const distances={s0:0},queue=['s0'];while(queue.length){const id=queue.shift();for(const e of edges.filter(e=>e.from===id)){if(!(e.to in distances)){distances[e.to]=distances[id]+1;queue.push(e.to);}}}
assert.equal(Object.keys(distances).length,16);assert.equal(distances.s5,3);assert.equal(distances.s8,6);assert.equal(distances.s12,9);
const folder=new URL('../public/llm/argon-model/',import.meta.url);
const spec=fs.readFileSync(new URL('LLMBuild.tla',folder),'utf8');for(const edge of edges)assert.ok(spec.includes(`${edge.name} == /\\ phase = "${edge.from}" /\\ phase' = "${edge.to}"`));
const names=Object.fromEntries(states.map(s=>[s.id,(s.num+' '+s.title).replace('NaN','Non-finite')]));
fs.writeFileSync(new URL('view.mjs',folder),'const names = '+JSON.stringify(names)+';\nconst steps = '+JSON.stringify(Object.fromEntries(edges.map(e=>[e.name,e.label])))+';\nexport const title = "LLM build: abstract demonstration graph";\nexport const state = v => names[v.phase];\nexport const step = action => steps[action] ?? action;\n');
const ids=[...file.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const duplicates=ids.filter((x,i)=>ids.indexOf(x)!==i);assert.deepEqual(duplicates,[]);
assert.ok(!file.includes('74 states'));assert.ok(!file.includes('118 steps'));assert.ok(!file.includes('All 3 TLC invariants hold'));
console.log('PASS: 16 unique states, 22 valid edges, every state reachable, failure paths 3/6/9, HTML IDs unique, displayed graph matches executable TLA+ transitions.');

// The guided reader must follow real model edges, with chapters in reading order.
const route = JSON.parse(script.match(/const HEALTHY_ORDER = (\[[^;]+\]);/)[1]);
assert.equal(route.length, 13); assert.equal(new Set(route).size, 13);
assert.deepEqual(route.map(id => states.find(s => s.id === id)).filter(s => s.breaksRule), []);
for (let i = 1; i < route.length; i++) assert.ok(edges.some(e => e.from === route[i-1] && e.to === route[i]), `Invalid story edge: ${route[i-1]} to ${route[i]}`);
const chapters = ['phase-data', 'phase-arch', 'phase-train', 'phase-align'];
const order = route.map(id => chapters.indexOf(states.find(s => s.id === id).phase));
assert.deepEqual(order, [...order].sort((a,b) => a-b));
assert.ok(file.includes('<dialog class="reader"'));
assert.ok(!file.includes('id="step-route"'));
console.log('PASS: the 13-scene reader follows valid model transitions through four ordered chapters.');
