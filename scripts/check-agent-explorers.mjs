import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stages,traceSpans,capabilities,buildPaths,modelRoutes} from '../public/agents/platform-data.js';
import {makeTraces} from '../public/agents/explorers.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const all=read('../src/generated/agents/article.html')+read('../src/generated/agents/contents.html')+read('../src/pages/blog/databricks-for-agents/index.astro');
const ids=[...all.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate element IDs');
for(const [,target] of all.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(target),`Missing anchor ${target}`);
const refs=[...all.matchAll(/id="ref-(\d+)"/g)].map(m=>m[1]);
for(const r of refs)assert.ok(all.includes(`href="#ref-${r}"`),`Reference ${r} is never cited`);
for(const w of ['loop','traceTable','stack','models'])assert.ok(all.includes(`data-widget="${w}"`),`Missing widget ${w}`);
assert.equal(stages.length,6);
for(const s of stages){for(const k of ['verb','glyph','shape','product','title','body','artifact','code','href'])assert.ok(s[k],`Stage ${s.verb} missing ${k}`);assert.equal(new URL(s.href).protocol,'https:')}
assert.ok(traceSpans.some(s=>s.bad));
const t=makeTraces(),rate=f=>{const r=t.filter(f);return [r.filter(x=>x.failed).length,r.length]};
const eq=(f,[b,n],label)=>assert.deepEqual(rate(f),[b,n],`${label} no longer matches the prose`);
eq(x=>x.harness==='v13'&&x.tool==='exchange_items',[25,55],'v13 exchange');
eq(x=>x.harness==='v12'&&x.tool==='exchange_items',[1,63],'v12 exchange');
const [hb,hn]=rate(x=>x.model==='hosted'),[ob,on]=rate(x=>x.model==='open-8b');
assert.equal((100*hb/hn).toFixed(1),'7.1');assert.equal((100*ob/on).toFixed(1),'7.1');
const [eb,en]=rate(x=>x.tool==='exchange_items');assert.equal(Math.round(100*eb/en),22);
const capIds=capabilities.map(c=>c.id);
assert.equal(new Set(capIds).size,capIds.length);
for(const c of capabilities){for(const k of ['id','label','products','job','input','output','href'])assert.ok(c[k],`Capability ${c.id} missing ${k}`);assert.equal(new URL(c.href).protocol,'https:');}
for(const p of Object.values(buildPaths))for(const id of p.active)assert.ok(capIds.includes(id),`Unknown capability ${id}`);
assert.ok(!buildPaths.hosted.active.includes('adapt'),'Hosted path should not require GPU training');
assert.ok(buildPaths.custom.active.includes('adapt'),'Custom inference path requires GPU environment testing');
for(const r of modelRoutes){for(const k of ['label','title','method','compute','software','output','body','code','href'])assert.ok(r[k],`Model route ${r.label} missing ${k}`);assert.equal(new URL(r.href).protocol,'https:');}
assert.ok(stages[2].code.includes("'version', '2.1'"),'AI Functions interface must be explicit');
assert.ok(stages[5].code.includes('env_pack="databricks_model_serving"'),'Serving registration must package the environment');
assert.ok(all.includes('assistant turns'),'Dataset inventory must distinguish turns from conversations');
console.log(`Verified ${ids.length} unique IDs, ${refs.length} cited references, ${capabilities.length} capabilities, ${Object.keys(buildPaths).length} build paths, ${modelRoutes.length} model routes, and synthetic trace counts.`);
