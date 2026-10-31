/* Explanatory widgets. The trace data is synthetic and generated in the browser; nothing here calls a workspace. */
import {stages,traceSpans,capabilities,buildPaths,modelRoutes} from './platform-data.js?v=capabilities-20261101';
const $=(root,s)=>root.querySelector(s);
const $$=(root,s)=>Array.from(root.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const header=(title,sub)=>`<div class="widget-head"><h3>${title}</h3><span>${sub}</span></div>`;
const note=s=>`<p class="widget-note">${s}</p>`;

function loop(host){
 const n=stages.length,cx=210,cy=210,r=150,step=2*Math.PI/n;
 const ring=(i,rad)=>[cx+rad*Math.cos(-Math.PI/2+i*step),cy+rad*Math.sin(-Math.PI/2+i*step)];
 let svg=`<circle class="loop-track" cx="${cx}" cy="${cy}" r="${r}"/>`;
 stages.forEach((s,i)=>{const [x,y]=ring(i,r),[lx,ly]=ring(i,r+40),side=Math.abs(lx-cx)<10?'middle':lx>cx?'start':'end',dy=side==='middle'?(ly<cy?-4:20):7;
  svg+=`<g class="loop-stop" data-stop="${i}"><circle cx="${x}" cy="${y}" r="26" class="hit"/><circle cx="${x}" cy="${y}" r="8"/><text x="${lx}" y="${ly+dy}" text-anchor="${side}">${esc(s.verb)}</text></g>`});
 svg+=`<text class="loop-center" x="${cx}" y="${cy+2}" text-anchor="middle"></text><text class="loop-center-sub" x="${cx}" y="${cy+30}" text-anchor="middle"></text><g class="loop-token" tabindex="0" role="slider" aria-label="Position of the trace in the loop" aria-valuemin="1" aria-valuemax="${n}"><circle r="27"/><text y="6" text-anchor="middle"></text></g>`;
 host.innerHTML=header('Follow one trace around the loop','Drag the dot, click a stage, or use the arrow keys')+`<div class="loop-layout"><svg class="loop-svg" viewBox="-34 -26 488 476">${svg}</svg><div class="loop-detail" aria-live="polite"><span class="micro" data-k="product"></span><h4 data-k="title"></h4><p data-k="body"></p><p class="micro">WHAT LEAVES THIS STAGE</p><p class="loop-artifact" data-k="artifact"></p><pre data-k="code"></pre><a class="micro" data-k="href" href="#">Documentation ↗</a></div></div>`+note('Each stop changes the shape of the same evidence: a request becomes spans, spans become rows, rows become labeled examples, examples become a checkpoint, and the checkpoint becomes the endpoint the next request calls.');
 const svgEl=$(host,'svg'),token=$(host,'.loop-token');let pos=0,drag=false;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const place=a=>token.setAttribute('transform',`translate(${(cx+r*Math.cos(a)).toFixed(1)} ${(cy+r*Math.sin(a)).toFixed(1)})`);
 function show(i,snap=true){
  pos=(i+n)%n;const s=stages[pos];
  token.classList.toggle('moving',snap&&!reduce);
  if(snap)place(-Math.PI/2+pos*step);
  $(token,'text').textContent=s.glyph;token.setAttribute('aria-valuenow',pos+1);token.setAttribute('aria-valuetext',`${s.verb}: ${s.title}`);
  $(host,'.loop-center').textContent=s.shape;$(host,'.loop-center-sub').textContent=`stop ${pos+1} of ${n}`;
  for(const k of ['product','title','body','artifact','code'])$(host,`[data-k=${k}]`).textContent=s[k];
  $(host,'[data-k=href]').href=s.href;
  $$(host,'.loop-stop').forEach((g,j)=>g.classList.toggle('on',j===pos));
 }
 const angleFrom=e=>{const p=svgEl.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svgEl.getScreenCTM().inverse());return Math.atan2(q.y-cy,q.x-cx)};
 const nearest=a=>((Math.round((a+Math.PI/2)/step)%n)+n)%n;
 token.addEventListener('pointerdown',e=>{drag=true;token.setPointerCapture(e.pointerId);token.classList.remove('moving');token.classList.add('grabbed')});
 token.addEventListener('pointermove',e=>{if(!drag)return;const a=angleFrom(e);place(a);const i=nearest(a);if(i!==pos)show(i,false)});
 const drop=()=>{if(!drag)return;drag=false;token.classList.remove('grabbed');show(pos)};
 token.addEventListener('pointerup',drop);token.addEventListener('pointercancel',drop);
 $$(host,'.loop-stop').forEach(g=>g.addEventListener('click',()=>show(Number(g.dataset.stop))));
 token.addEventListener('keydown',e=>{const d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(e.key==='Home'){e.preventDefault();show(0)}else if(e.key==='End'){e.preventDefault();show(n-1)}else if(d){e.preventDefault();show(pos+d)}});
 show(0);
}

function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function makeTraces(){
 const R=rng(31),tools=['get_order','return_items','exchange_items','cancel_order'],rows=[];
 for(let i=0;i<480;i++){
  const harness=R()<.5?'v12':'v13',model=R()<.55?'hosted':'open-8b',tool=tools[Math.floor(R()*tools.length)];
  let p=model==='open-8b'?.045:.025;if(harness==='v13'&&tool==='exchange_items')p=.31;
  rows.push({id:`tr-${4100+i}`,harness,model,tool,failed:R()<p});
 }
 return rows;
}
const GROUPS={tool:['tool'],harness:['harness'],model:['model'],'harness,tool':['harness','tool']};

function traceTable(host){
 const traces=makeTraces();let view='one',by='tool',picked=null;const evalSet=new Set();
 host.innerHTML=header('The same failure, seen two ways','480 synthetic support-agent traces, generated in your browser')+`<div class="widget-body"><div class="controls"><div class="tab-row" role="group" aria-label="View"><button type="button" data-view="one" aria-pressed="true">One trace</button><button type="button" data-view="all" aria-pressed="false">All traces</button></div><label data-by-wrap hidden>Group by<select data-by><option value="tool">tool</option><option value="harness">harness version</option><option value="model">model</option><option value="harness,tool">harness version × tool</option></select></label><span class="eval-tray" aria-live="polite"></span></div><div data-out></div></div>`+note('Synthetic data with one planted problem. On Databricks the same query would run against trace tables in Unity Catalog, through a summary view you define.');
 const out=$(host,'[data-out]'),tray=$(host,'.eval-tray');
 const renderTray=()=>{tray.textContent=`Evaluation dataset: ${evalSet.size||'empty'}${evalSet.size?' traces':''}`;tray.classList.toggle('full',evalSet.size>0)};
 function one(){
  out.innerHTML=`<div class="span-list">${traceSpans.map(s=>`<div class="span-row${s.bad?' bad':''}" style="--depth:${s.depth}"><span>${esc(s.name)}</span><code>${esc(s.detail)}</code><b>${esc(s.ms)}</b></div>`).join('')}</div><p class="widget-text">A trace viewer is the right tool for this question. You can see <code>exchange_items</code> receive item 3 when the customer was talking about item 2. You can’t see whether it happened once or forty times, or what changed before it started. Switch to <em>All traces</em>.</p>`;
 }
 function all(){
  const keys=GROUPS[by],groups=new Map();
  for(const t of traces){const k=keys.map(x=>t[x]).join(' · ');const g=groups.get(k)||{key:k,n:0,bad:0,ids:[]};g.n++;if(t.failed){g.bad++;g.ids.push(t.id)}groups.set(k,g)}
  const rows=[...groups.values()].sort((a,b)=>b.bad/b.n-a.bad/a.n);const max=Math.max(...rows.map(g=>g.bad/g.n),.05);
  const cols=keys.map(k=>k==='harness'?'harness_version':k).join(', ');
  const sql=`SELECT ${cols},\n       count(*) AS traces,\n       avg(IF(tool_status = 'wrong_item', 1, 0))\n         AS failure_rate\nFROM support.trace_summary\nGROUP BY ${cols}\nORDER BY failure_rate DESC;`;
  out.innerHTML=`<div class="table-split"><div class="bars">${rows.map(g=>`<button type="button" class="bar-row" data-key="${esc(g.key)}" aria-pressed="${picked===g.key}"><span>${esc(g.key)}</span><i style="--w:${(g.bad/g.n/max*100).toFixed(1)}%"></i><b>${(100*g.bad/g.n).toFixed(1)}%</b><small>${g.bad}/${g.n}</small></button>`).join('')}</div><pre class="sql">${esc(sql)}</pre></div><div class="pick" aria-live="polite"></div>`;
  const pick=$(out,'.pick');
  const renderPick=()=>{const g=rows.find(x=>x.key===picked);if(!g){pick.innerHTML=`<p class="widget-text">Click a row to pull its failing traces.</p>`;return}
   const added=g.bad>0&&g.ids.every(id=>evalSet.has(id));
   pick.innerHTML=`<p class="widget-text"><strong>${esc(g.key)}</strong>: ${g.bad} failing ${g.bad===1?'trace':'traces'}. ${g.ids.slice(0,5).map(id=>`<code>${id}</code>`).join(' ')}${g.ids.length>5?' …':''}</p><button type="button" class="add-eval" ${added||!g.bad?'disabled':''}>${added?'In the evaluation dataset ✓':`Add ${g.bad} to the evaluation dataset`}</button>`;
   const b=$(pick,'.add-eval');b.onclick=()=>{g.ids.forEach(id=>evalSet.add(id));renderTray();renderPick()}};
  $$(out,'.bar-row').forEach(b=>b.onclick=()=>{picked=b.dataset.key;$$(out,'.bar-row').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderPick()});
  renderPick();
 }
 const render=()=>{$(host,'[data-by-wrap]').hidden=view!=='all';view==='one'?one():all()};
 $$(host,'[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;$$(host,'[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});
 $(host,'[data-by]').onchange=e=>{by=e.target.value;picked=null;render()};
 renderTray();render();
}


function stack(host){
 let path='hosted',selected='context';
 host.innerHTML=header('Choose how to build the agent','Architecture explorer · documented capabilities, not a live workspace')+`<div class="widget-body"><div class="path-tabs" role="group" aria-label="Agent build path">${Object.entries(buildPaths).map(([k,p])=>`<button type="button" data-path="${k}" aria-pressed="${k===path}">${esc(p.label)}</button>`).join('')}</div><div class="capability-layout"><div class="capability-rows" role="group" aria-label="Databricks capabilities">${capabilities.map(c=>`<button type="button" class="capability-row" data-cap="${c.id}" aria-pressed="${c.id===selected}"><span>${esc(c.label)}</span><strong>${esc(c.products)}</strong><small data-state></small></button>`).join('')}</div><div class="capability-detail" aria-live="polite"><p class="micro" data-product></p><h4 data-title></h4><p class="widget-text" data-job></p><dl><dt>Input</dt><dd data-input></dd><dt>Output</dt><dd data-output></dd></dl><a class="micro" data-doc href="#">Documentation ↗</a></div></div><div class="path-result" aria-live="polite"><span class="micro">THIS BUILD PATH</span><p data-description></p><p data-artifact></p></div></div>`;
 function render(){const p=buildPaths[path],c=capabilities.find(x=>x.id===selected);
  $$(host,'[data-path]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.path===path)));
  $$(host,'[data-cap]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.cap===selected));const active=p.active.includes(b.dataset.cap);b.classList.toggle('outside-path',!active);$(b,'[data-state]').textContent=active?'used':'optional';});
  $(host,'[data-product]').textContent=c.id==='model'?p.model:c.products;
  $(host,'[data-title]').textContent=c.label;$(host,'[data-job]').textContent=c.job;
  $(host,'[data-input]').textContent=c.input;$(host,'[data-output]').textContent=c.output;$(host,'[data-doc]').href=c.href;
  $(host,'[data-description]').textContent=p.adapt;$(host,'[data-artifact]').textContent='Release artifacts: '+p.artifact;
 }
 $$(host,'[data-path]').forEach(b=>b.onclick=()=>{path=b.dataset.path;render()});$$(host,'[data-cap]').forEach(b=>b.onclick=()=>{selected=b.dataset.cap;render();if(matchMedia('(max-width:760px)').matches)$(host,'.capability-detail').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});render();
}
function models(host){
 host.innerHTML=header('Documented open-model paths','Select an example; compute and software describe its linked recipe')+`<div class="widget-body"><div class="path-tabs" role="group" aria-label="Open-model route">${modelRoutes.map((r,i)=>`<button type="button" data-model-route="${i}" aria-pressed="${i===0}">${esc(r.label)}</button>`).join('')}</div><div class="model-route"><div aria-live="polite"><p class="micro" data-method></p><h4 data-title></h4><p class="widget-text" data-body></p><a class="micro" data-link href="#">Open the documented example ↗</a></div><div><dl class="model-spec"><dt>Compute</dt><dd data-compute></dd><dt>Software</dt><dd data-software></dd><dt>Output</dt><dd data-output></dd></dl><pre data-code></pre></div></div></div>`+note('These are documented implementation routes, not measurements from this article. Custom vLLM serving is Public Preview. Follow the selected example’s current hardware, version, and region requirements.');
 function render(i){const r=modelRoutes[i];for(const k of ['method','title','body','compute','software','output','code'])$(host,`[data-${k}]`).textContent=r[k];$(host,'[data-link]').href=r.href;$$(host,'[data-model-route]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.modelRoute)===i)));}
 $$(host,'[data-model-route]').forEach(b=>b.onclick=()=>render(Number(b.dataset.modelRoute)));render(0);
}

if(typeof document!=='undefined'){
 const mounts={loop,traceTable,stack,models};
 for(const el of document.querySelectorAll('[data-widget]'))mounts[el.dataset.widget]?.(el);
 const article=document.getElementById('agent-article'),progress=document.getElementById('reading-progress');
 const update=()=>{if(!article||!progress)return;const range=article.offsetHeight-innerHeight;progress.style.width=`${Math.max(0,Math.min(100,(scrollY-article.offsetTop)/Math.max(range,1)*100))}%`};
 addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
}
