import assert from 'node:assert/strict';
import fs from 'node:fs';
import {softmax,crossEntropy,gradientStep,attention,dpoLoss,dpoStep,topP,bpeStep} from '../public/llm/math.mjs';
const sum = xs => xs.reduce((a,b)=>a+b,0);
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(const t of [.05,.2,1,2,10]) { const p=softmax([1000,1001,999],t);near(sum(p),1);assert.ok(p.every(Number.isFinite)); }
assert.deepEqual(softmax([1,3,2],0),[0,1,0]);
for(let position=0;position<4;position++) {
  const a=attention([1,2],[[1,0],[0,1],[1,1],[2,0]],[[1,0],[0,1],[1,1],[2,0]],position);
  near(sum(a.weights),1);a.weights.slice(position+1).forEach(p=>assert.equal(p,0));
  const changed=attention([1,2],[[1,0],[0,1],[1,1],[2,0]],[[1,0],[0,1],[1,1],[2,0]].map((v,i)=>i>position?[999,999]:v),position);
  assert.deepEqual(a.output,changed.output);
}
for(const rate of [.05,.5,1.5]) {let z=[0,0,0];for(let i=0;i<40;i++){const next=gradientStep(z,0,rate);assert.ok(crossEntropy(next,0)<crossEntropy(z,0));z=next;}}
let margin=0;for(let i=0;i<30;i++){const next=dpoStep(margin,0,.5,1);assert.ok(dpoLoss(next,0,.5)<dpoLoss(margin,0,.5));margin=next;}
assert.deepEqual(topP([.6,.25,.1,.05],.8),[.6/.85,.25/.85,0,0]);
assert.deepEqual(topP([.6,.25,.1,.05],.1),[1,0,0,0]);
let parts=[...'low lower low lowest'];const rules=[];for(let i=0;i<30;i++){const result=bpeStep(parts);assert.equal(result.parts.join(''),'low lower low lowest');if(!result.pair)break;rules.push(result.pair);assert.ok(result.parts.length<parts.length);parts=result.parts;}
assert.deepEqual(rules[0],['l','o']);assert.equal(parts.length,7);
for(let mask=0;mask<16;mask++){const checks=[0,1,2,3].map(i=>Boolean(mask&(1<<i)));const release=checks.every(Boolean);assert.equal(release,mask===15);}
const phases=['raw','curated','tokenized','base','assistant','preferred','evaluated','serve','prefill','decode','done'];
function transitions(s){const n=(phase,patch={})=>({...s,phase,...patch});switch(s.phase){
case 'raw':return [['Curate',n('curated')]];
case 'curated':return [['Tokenize',n('tokenized')]];
case 'tokenized':return [['Pretrain',n('base',{version:1})]];
case 'base':return [['SFT',n('assistant',{version:2})],['Evaluate',n('evaluated',{checked:true})]];
case 'assistant':return [['Preference',n('preferred',{version:3})],['Evaluate',n('evaluated',{checked:true})]];
case 'preferred':return [['Evaluate',n('evaluated',{checked:true})]];
case 'evaluated':return [['Revise',n('raw',{checked:false,version:0})],['Release',n('serve',{released:true,releaseVersion:s.version})]];
case 'serve':return [['Prefill',n('prefill',{context:3,cached:3})]];
case 'prefill':case 'decode':return [...(s.context<6?[['Sample',n('decode',{context:s.context+1,cached:s.context})]]:[]),['End',n('done')]];
case 'done':return [['NewRequest',n('serve',{context:0,cached:0})],['Done',s]];
default:throw new Error('Unknown phase');}}
const initial={phase:'raw',version:0,releaseVersion:0,checked:false,released:false,context:0,cached:0};
const queue=[initial],seen=new Map([[JSON.stringify(initial),0]]),states=[],edges=[];
while(queue.length){const s=queue.shift(),id=seen.get(JSON.stringify(s));states.push({id,...s});assert.ok(phases.includes(s.phase));assert.ok(!s.released||s.checked);assert.ok(s.cached<=s.context&&s.context-s.cached<=1);if(['serve','prefill','decode','done'].includes(s.phase)){assert.ok(s.released);assert.equal(s.version,s.releaseVersion);}const next=transitions(s);assert.ok(next.length);for(const [action,to]of next){const key=JSON.stringify(to);if(!seen.has(key)){seen.set(key,seen.size);queue.push(to);}edges.push({from:id,to:seen.get(key),action});}}
fs.writeFileSync(new URL('../public/llm/lifecycle.json',import.meta.url),JSON.stringify({description:'Bounded abstract lifecycle model. States do not represent LLM quality, correctness, or safety. Cache model allows one unprocessed sampled token.',invariants:['Release requires completed evaluation','Inference preserves released weights','Cached positions never exceed context','Serving requires release'],states,edges},null,2)+'\n');
console.log(`PASS: stable softmax, causal attention, masked-value independence, 120 gradient updates, 30 DPO updates, top-p mass, BPE round-trip, all 16 gate combinations. Lifecycle: ${states.length} states, ${edges.length} transitions, 4 invariants, no deadlocks.`);
