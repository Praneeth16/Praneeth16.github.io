import assert from 'node:assert/strict';
import fs from 'node:fs';
import {platformData} from '../public/agents/platform-data.js';
const html=fs.readFileSync(new URL('../src/generated/agents/article.html',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../src/pages/blog/databricks-for-agents/index.astro',import.meta.url),'utf8');
const all=html+page;
const ids=[...all.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate element IDs');
for(const [,target] of all.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(target),`Missing anchor ${target}`);
const groups={layer:'layers',context:'context',runtime:'runtime',analysis:'analysis',recipe:'recipes',serving:'serving'};
let count=0;
for(const [attribute,key] of Object.entries(groups)){
 const controls=[...html.matchAll(new RegExp(`data-${attribute}="([^"]+)"`,'g'))].map(m=>m[1]);
 assert.equal(controls.length,platformData[key].length,`Incomplete ${key} controls`);
 assert.equal(new Set(controls).size,controls.length,`Duplicate ${key} controls`);
 for(const control of controls){const item=key==='layers'?platformData[key].find(x=>x.id===control):platformData[key][Number(control)];assert.ok(item,`Missing content ${key}/${control}`);assert.ok(item.body.length>30);if(item.href)assert.equal(new URL(item.href).protocol,'https:');count++;}
}
for(const field of ['title','body','model','compute','framework','output'])for(const recipe of platformData.recipes)assert.ok(recipe[field],`Incomplete recipe ${field}`);
assert.ok(platformData.analysis[2].code.includes("'version', '2.1'"),'Classification interface must be explicit');
assert.ok(platformData.serving[1].code.includes('env_pack="databricks_model_serving"'));
assert.ok(!all.includes('policy-lab'),'Removed policy simulation still present');
assert.ok(!all.includes('cost-lab'),'Removed cost simulation still present');
console.log(`Verified ${count} explorer states, recipe completeness, code contracts, unique IDs, and article anchors.`);
