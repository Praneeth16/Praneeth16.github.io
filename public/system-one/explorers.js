/* Recorded benchmark evidence only. No model API calls or credentials. */
const $=(root,s)=>root.querySelector(s);
const $$=(root,s)=>Array.from(root.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(n,d=1)=>(100*n).toFixed(d)+'%';
const fmt=(n,d=2)=>Number(n).toFixed(d);
const COLORS={jev:'#4e8766',luna:'#a38b6e',sol:'#8a709b',gray:'#a2a5a4',bad:'#b45445'};
const NAMES={jev:'Jev 1.13',luna:'GPT-6 Luna'};
const header=(title,sub)=>`<div class="widget-head"><h3>${title}</h3><span>${sub}</span></div>`;
const note=s=>`<p class="widget-note">${s}</p>`;
const legend=items=>`<div class="legend">${items.map(([name,color])=>`<span><i class="dot" style="background:${color}"></i>${name}</span>`).join('')}</div>`;
const plotFrame=(inner,height,title)=>`<div class="plot-scroll"><svg class="plot" viewBox="0 0 820 ${height}" role="img" aria-label="${esc(title)}">${inner}</svg></div>`;
const point=(x,y,text,color,r=5)=>`<circle class="plot-point" cx="${x}" cy="${y}" r="${r}" fill="${color}" tabindex="0" role="img" aria-label="${esc(text)}" data-tip="${esc(text)}"><title>${esc(text)}</title></circle>`;
const label=r=>r.replace(/_/g,' ');
function bindPlot(root){for(const el of $$(root,'[data-tip]')){const show=()=>{const readout=$(root,'.plot-readout');if(readout)readout.textContent=el.dataset.tip};el.addEventListener('pointerenter',show);el.addEventListener('focus',show)}}

function routeMetrics(host,data){
 const T=data.route.test;let view='overall';
 host.innerHTML=header('Compare the routers','Task A · 330 test requests · 11 routes')+`<div class="widget-body"><div class="controls"><label>View<select data-view><option value="overall">Overall metrics</option><option value="route">Accuracy by route</option></select></label></div>${legend([[NAMES.jev,COLORS.jev],[NAMES.luna,COLORS.luna]])}<div data-chart></div><div class="plot-readout" aria-live="polite">Hover or focus a bar to inspect its value.</div></div>`+note('Each route has 30 test requests, so one request moves a route’s accuracy by 3.3 points.');
 function render(){
  const groups=view==='overall'?[['Accuracy','accuracy'],['Macro-F1','macro_f1'],['In-scope accuracy','in_scope_accuracy'],['Out-of-scope recall','oos_recall'],['Out-of-scope precision','oos_precision']].map(([n,k])=>[n,m=>m[k]]):data.route.routes.map(r=>[label(r),m=>m.per_route_accuracy[r]]);
  const rows=[];for(const [name,get] of groups)for(const k of ['jev','luna']){const v=get(T[k]);rows.push({label:k==='jev'?name:'',value:v,color:COLORS[k],tip:`${NAMES[k]} · ${name}: ${pct(v)}`})}
  let svg='';const left=200,width=560,x=v=>left+v*width,rowH=13,gap=10;let y=12;
  for(let i=0;i<=5;i++){const v=i/5;svg+=`<line class="grid" x1="${x(v)}" y1="6" x2="${x(v)}" y2="${12+groups.length*(2*rowH+gap)}"/><text x="${x(v)}" y="${30+groups.length*(2*rowH+gap)}" text-anchor="middle">${i*20}%</text>`}
  rows.forEach((r,i)=>{if(i%2===0&&i)y+=gap;if(r.label)svg+=`<text x="${left-12}" y="${y+18}" text-anchor="end">${esc(r.label)}</text>`;svg+=`<rect x="${left}" y="${y}" width="${x(r.value)-left}" height="${rowH-2}" fill="${r.color}" rx="2" tabindex="0" data-tip="${esc(r.tip)}"><title>${esc(r.tip)}</title></rect><text x="${x(r.value)+6}" y="${y+10}" class="value">${pct(r.value)}</text>`;y+=rowH});
  $(host,'[data-chart]').innerHTML=plotFrame(svg,y+40,'Router metrics');bindPlot(host);
 }
 $(host,'[data-view]').onchange=e=>{view=e.target.value;render()};render();
}

function latencyExplorer(host,data){
 let run='concurrent';
 host.innerHTML=header('Inspect request latency','Client-observed round trips through OpenRouter')+`<div class="widget-body"><div class="controls"><label>Recorded requests<select data-run><option value="concurrent">Task A · 330 per router · 8 in flight</option><option value="serial">Serial probe · 40 per router · one at a time</option></select></label></div>${legend([[NAMES.jev,COLORS.jev],[NAMES.luna,COLORS.luna]])}<div data-chart></div><div class="plot-readout" aria-live="polite">Hover or focus a bin to inspect its request count.</div></div>`+note('Timings include network, OpenRouter, and provider queueing. They are not model inference times.');
 function render(){
  const series=run==='concurrent'?data.route.concurrent_latency_values:{jev:data.route.serial_latency.jev.values,luna:data.route.serial_latency.luna.values};
  const lo=Math.log10(.3),hi=Math.log10(4),bins=28,x=v=>70+(Math.log10(v)-lo)/(hi-lo)*690;
  const counts={};for(const k of ['jev','luna']){counts[k]=Array(bins).fill(0);for(const v of series[k])counts[k][Math.max(0,Math.min(bins-1,Math.floor((Math.log10(v)-lo)/(hi-lo)*bins)))]++}
  const ymax=Math.max(...counts.jev,...counts.luna),y=v=>220-v/ymax*180;let svg='';
  for(let i=0;i<=4;i++){const v=ymax*i/4;svg+=`<line class="grid" x1="70" x2="760" y1="${y(v)}" y2="${y(v)}"/><text x="60" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`}
  for(const t of [.3,.5,1,2,4])svg+=`<text x="${x(t)}" y="244" text-anchor="middle">${t} s</text>`;
  const bw=690/bins;
  for(const k of ['jev','luna'])counts[k].forEach((c,i)=>{if(!c)return;const a=10**(lo+i*(hi-lo)/bins),b=10**(lo+(i+1)*(hi-lo)/bins),tip=`${NAMES[k]}: ${c} requests between ${a.toFixed(2)} and ${b.toFixed(2)} s`;svg+=`<rect x="${70+i*bw+1}" y="${y(c)}" width="${bw-2}" height="${220-y(c)}" fill="${COLORS[k]}" opacity=".85" tabindex="0" data-tip="${esc(tip)}"><title>${esc(tip)}</title></rect>`});
  const q=(v,p)=>{const s=[...v].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(p*(s.length-1)+.5))]};
  svg+=`<text x="760" y="24" text-anchor="end">${NAMES.jev} median ${fmt(q(series.jev,.5))} s · ${NAMES.luna} median ${fmt(q(series.luna,.5))} s</text>`;
  $(host,'[data-chart]').innerHTML=plotFrame(svg,255,'Latency histogram');bindPlot(host);
 }
 $(host,'[data-run]').onchange=e=>{run=e.target.value;render()};render();
}

function selectiveExplorer(host,data){
 const T=data.route.test;let target=.8;
 host.innerHTML=header('Route automatically, send the rest to a person','Task A · confidence-gated routing')+`<div class="widget-body"><div class="controls"><label class="grow">Share routed automatically <output data-value>80%</output><input aria-label="Share routed automatically" data-target type="range" min="0.5" max="1" step="0.01" value="0.8"/></label></div><div class="stat-row four" data-stats></div>${legend([[NAMES.jev,COLORS.jev],[NAMES.luna,COLORS.luna]])}<div data-chart></div><div class="plot-readout" aria-live="polite">Move the slider or hover a point.</div></div>`+note('Each router uses the highest threshold that still reaches the chosen share, picked on the test set. Requests with tied probabilities move together, so the realised share can overshoot.');
 const pick=k=>T[k].selective.filter(v=>v.coverage>=target-1e-9).reduce((a,b)=>b.coverage<a.coverage?b:a,{coverage:2});
 function render(){
  $(host,'[data-value]').textContent=Math.round(target*100)+'%';
  const p={jev:pick('jev'),luna:pick('luna')};
  $(host,'[data-stats]').innerHTML=['jev','luna'].map(k=>{const n=Math.round(p[k].coverage*330),wrong=Math.round(n*(1-p[k].accuracy));return `<div><strong>${pct(p[k].accuracy)}</strong><span>${NAMES[k]} · accuracy on ${n} auto-routed</span></div><div class="risk"><strong>${wrong}</strong><span>${NAMES[k]} · wrong, unreviewed · p ≥ ${fmt(p[k].t)}</span></div>`}).join('');
  const x=c=>70+(c-.4)/.6*690,y=a=>220-(a-.84)/.16*190;let svg='';
  for(let a=.84;a<=1.0001;a+=.04)svg+=`<line class="grid" x1="70" x2="760" y1="${y(a)}" y2="${y(a)}"/><text x="60" y="${y(a)+4}" text-anchor="end">${Math.round(a*100)}%</text>`;
  for(let c=.4;c<=1.0001;c+=.1)svg+=`<text x="${x(c)}" y="244" text-anchor="middle">${Math.round(c*100)}%</text>`;
  svg+=`<line x1="${x(target)}" x2="${x(target)}" y1="20" y2="220" stroke="#c2c7c2" stroke-dasharray="3 3"/>`;
  for(const k of ['jev','luna']){const pts=T[k].selective.filter(v=>v.coverage>=.4);svg+=`<polyline fill="none" stroke="${COLORS[k]}" stroke-width="2" points="${pts.map(v=>`${x(v.coverage)},${y(Math.max(.84,v.accuracy))}`).join(' ')}"/>`;svg+=point(x(p[k].coverage),y(Math.max(.84,p[k].accuracy)),`${NAMES[k]}: ${pct(p[k].coverage)} routed at ${pct(p[k].accuracy)} accuracy, threshold ${fmt(p[k].t)}`,COLORS[k],6)}
  $(host,'[data-chart]').innerHTML=plotFrame(svg,255,'Selective routing curve');bindPlot(host);
 }
 $(host,'[data-target]').oninput=e=>{target=Number(e.target.value);render()};render();
}

function frontierExplorer(host,data){
 const T=data.tier.test;let share=.38;
 host.innerHTML=header('Send easy questions to the cheap model','Task B · 308 MMLU-Pro test questions')+`<div class="widget-body"><div class="controls"><label class="grow">Share of questions sent to Luna <output data-value>38%</output><input aria-label="Share of questions sent to Luna" data-share type="range" min="0" max="1" step="0.01" value="0.38"/></label><button data-reset>Jev’s dev-selected point</button></div><div class="stat-row four" data-stats></div>${legend([['Routed by Jev',COLORS.jev],['Routed by Luna',COLORS.luna],['Always Luna / always Sol / oracle',COLORS.gray]])}<div data-chart></div><div class="plot-readout" aria-live="polite">Move the slider or hover a point.</div></div>`+note('Each router sends its highest-scored questions to Luna and the rest to Sol. Router curves include the router call and the answering model, from recorded usage. The always-Luna, always-Sol, and oracle points use no router, so they carry answering cost only.');
 const pick=k=>T[k].frontier.reduce((a,b)=>Math.abs(b.luna_share-share)<Math.abs(a.luna_share-share)?b:a);
 function render(){
  $(host,'[data-value]').textContent=Math.round(share*100)+'%';
  const p={jev:pick('jev'),luna:pick('luna')};
  $(host,'[data-stats]').innerHTML=['jev','luna'].map(k=>`<div><strong>${pct(p[k].accuracy)}</strong><span>${NAMES[k]} router · correct, ${pct(p[k].luna_share,0)} to Luna</span></div><div><strong>$${fmt(p[k].cost_per_1k)}</strong><span>${NAMES[k]} router · per 1,000 questions</span></div>`).join('');
  const x=c=>70+c/1.15*690,y=a=>220-(a-.55)/.37*190;let svg='';
  for(let a=.55;a<=.9201;a+=.05)svg+=`<line class="grid" x1="70" x2="760" y1="${y(a)}" y2="${y(a)}"/><text x="60" y="${y(a)+4}" text-anchor="end">${Math.round(a*100)}%</text>`;
  for(let c=0;c<=1.1001;c+=.2)svg+=`<text x="${x(c)}" y="244" text-anchor="middle">$${c.toFixed(1)}</text>`;
  for(const k of ['jev','luna']){const f=[...T[k].frontier].sort((a,b)=>a.cost_per_1k-b.cost_per_1k);svg+=`<polyline fill="none" stroke="${COLORS[k]}" stroke-width="2" points="${f.map(v=>`${x(v.cost_per_1k)},${y(v.accuracy)}`).join(' ')}"/>`}
  for(const [n,c,a,dx,dy,anchor] of [['Always Luna',T.luna_cost_per_1k,T.luna_accuracy,4,22,'start'],['Always Sol',T.sol_cost_per_1k,T.sol_accuracy,0,-12,'middle'],['Oracle',T.oracle_cost_per_1k,T.oracle_accuracy,9,4,'start']])svg+=`<rect x="${x(c)-5}" y="${y(a)-5}" width="10" height="10" fill="${COLORS.gray}" tabindex="0" data-tip="${esc(`${n}: ${pct(a)} at $${fmt(c)} per 1,000`)}"><title>${esc(n)}</title></rect><text x="${x(c)+dx}" y="${y(a)+dy}" text-anchor="${anchor}" class="micro">${n}</text>`;
  for(const k of ['jev','luna'])svg+=point(x(p[k].cost_per_1k),y(p[k].accuracy),`${NAMES[k]} router: ${pct(p[k].luna_share)} to Luna, ${pct(p[k].accuracy)} correct, $${fmt(p[k].cost_per_1k)} per 1,000, threshold ${fmt(p[k].t)}`,COLORS[k],7);
  $(host,'[data-chart]').innerHTML=plotFrame(svg,255,'Cost against accuracy');bindPlot(host);
 }
 $(host,'[data-share]').oninput=e=>{share=Number(e.target.value);render()};
 $(host,'[data-reset]').onclick=()=>{share=data.tier.jev_operating_point.luna_share;$(host,'[data-share]').value=String(share);render()};render();
}

function disagreementExplorer(host,data){
 const rows=data.route.rows.map((r,i)=>({...r,i}));let filter='jev',route='all',page=0,selected=null;const size=7;
 const kind=r=>r.jev===r.route?(r.luna===r.route?'both':'jev'):(r.luna===r.route?'luna':'neither');
 const counts=Object.fromEntries(['jev','luna','neither','both'].map(k=>[k,rows.filter(r=>kind(r)===k).length]));
 host.innerHTML=header('Read the requests the routers disagreed on','Task A · CLINC150 test utterances, CC BY 3.0')+`<div class="widget-body"><div class="controls"><label>Show<select data-filter><option value="jev">Only Jev right (${counts.jev})</option><option value="luna">Only Luna right (${counts.luna})</option><option value="neither">Both wrong (${counts.neither})</option><option value="both">Both right (${counts.both})</option></select></label><label>Correct route<select data-route><option value="all">All routes</option>${data.route.routes.map(r=>`<option value="${r}">${label(r)}</option>`).join('')}</select></label></div><p class="micro" data-count></p><div class="browser"><div class="browser-list" aria-label="Routing requests" data-list></div><div class="browser-detail" data-detail></div></div><div class="pagination"><button data-prev>← Previous</button><span data-page></span><button data-next>Next →</button></div></div>`;
 function detail(r){
  const bar=(name,p,color)=>`<div class="kv-bar"><span>${esc(name)}</span><i style="width:${Math.round(p*100)}%;background:${color}"></i><b>${fmt(p)}</b></div>`;
  return `<p class="sentence">“${esc(r.text)}”</p><dl class="kv-grid"><div><dt>Correct route</dt><dd>${label(r.route)} <small class="micro">${esc(r.intent.replace(/_/g,' '))}</small></dd></div><div><dt>Jev chose</dt><dd>${label(r.jev)} <small class="micro">${r.jev===r.route?'right':'wrong'}</small></dd></div><div><dt>Luna chose</dt><dd>${label(r.luna)} <small class="micro">${r.luna===r.route?'right':'wrong'} · stated ${fmt(r.pLuna)}</small></dd></div></dl><p class="micro">Jev’s top three probabilities</p>${r.jevTop.map(([k,p])=>bar(label(k),p,k===r.route?COLORS.jev:COLORS.gray)).join('')}`;
 }
 function render(){
  const pool=rows.filter(r=>kind(r)===filter&&(route==='all'||r.route===route));
  const pages=Math.max(1,Math.ceil(pool.length/size));page=Math.min(page,pages-1);const shown=pool.slice(page*size,(page+1)*size);
  if(!shown.some(r=>r.i===selected))selected=shown[0]?.i;
  $(host,'[data-count]').textContent=`${pool.length} matching requests`;
  $(host,'[data-list]').innerHTML=shown.map(r=>`<button class="browser-row" data-i="${r.i}" aria-pressed="${r.i===selected}">${esc(r.text)}<small>${label(r.route)} · Jev ${fmt(r.pJev)} · Luna ${fmt(r.pLuna)}</small></button>`).join('')||'<p class="empty-state">No requests match.</p>';
  const current=pool.find(r=>r.i===selected);$(host,'[data-detail]').innerHTML=current?detail(current):'';
  $(host,'[data-page]').textContent=`Page ${page+1} of ${pages}`;$(host,'[data-prev]').disabled=page===0;$(host,'[data-next]').disabled=page>=pages-1;
  for(const b of $$(host,'[data-i]'))b.onclick=()=>{selected=Number(b.dataset.i);render()};
 }
 $(host,'[data-filter]').onchange=e=>{filter=e.target.value;page=0;render()};$(host,'[data-route]').onchange=e=>{route=e.target.value;page=0;render()};
 $(host,'[data-prev]').onclick=()=>{page--;render()};$(host,'[data-next]').onclick=()=>{page++;render()};render();
}

function tierExplorer(host,data){
 const rows=data.tier.rows.map((r,i)=>({...r,i}));let category='all',outcome='wrong',sort='luna',page=0,selected=null;const size=7;
 const cats=[...new Set(rows.map(r=>r.category))].sort();
 host.innerHTML=header('Which questions did each router flag as hard?','Task B · MMLU-Pro test questions, MIT')+`<div class="widget-body"><div class="controls"><label>Luna’s answer<select data-outcome><option value="wrong">Luna was wrong</option><option value="right">Luna was right</option><option value="all">All</option></select></label><label>Subject<select data-category><option value="all">All subjects</option>${cats.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Sort by<select data-sort><option value="luna">Luna’s prediction, high first</option><option value="jev">Jev’s prediction, high first</option><option value="gap">Largest disagreement</option></select></label></div><p class="micro" data-count></p><div class="browser"><div class="browser-list" aria-label="Questions" data-list></div><div class="browser-detail" data-detail></div></div><div class="pagination"><button data-prev>← Previous</button><span data-page></span><button data-next>Next →</button></div></div>`+note('Predictions are each router’s probability that Luna, answering immediately with reasoning off, picks the correct option.');
 function detail(r){
  const bar=(name,p,color)=>`<div class="kv-bar"><span>${esc(name)}</span><i style="width:${Math.round(p*100)}%;background:${color}"></i><b>${fmt(p)}</b></div>`;
  const letters='ABCDEFGHIJ',marks=i=>[letters[i]===r.answer?'correct':'',letters[i]===r.lunaAnswer?'Luna':'',letters[i]===r.solAnswer?'Sol':''].filter(Boolean).join(' · ');
  return `<p class="sentence">${esc(r.q)}</p><ol class="options" type="A">${r.options.map((o,i)=>`<li${letters[i]===r.answer?' class="answer"':''}>${esc(o)}${marks(i)?` <small class="micro">${marks(i)}</small>`:''}</li>`).join('')}</ol><dl class="kv-grid"><div><dt>Correct option</dt><dd>${r.answer}</dd></div><div><dt>Luna answered</dt><dd>${r.lunaAnswer} <small class="micro">${r.lunaOk?'right':'wrong'}</small></dd></div><div><dt>Sol answered</dt><dd>${r.solAnswer} <small class="micro">${r.solOk?'right':'wrong'}</small></dd></div><div><dt>Subject</dt><dd>${esc(r.category)}</dd></div></dl><p class="micro">Predicted probability that Luna answers correctly</p>${bar('Jev',r.pJev,COLORS.jev)}${bar('Luna',r.pLuna,COLORS.luna)}`;
 }
 function render(){
  const key={luna:r=>-r.pLuna,jev:r=>-r.pJev,gap:r=>-Math.abs(r.pLuna-r.pJev)}[sort];
  const pool=rows.filter(r=>(category==='all'||r.category===category)&&(outcome==='all'||(outcome==='right')===r.lunaOk)).sort((a,b)=>key(a)-key(b));
  const pages=Math.max(1,Math.ceil(pool.length/size));page=Math.min(page,pages-1);const shown=pool.slice(page*size,(page+1)*size);
  if(!shown.some(r=>r.i===selected))selected=shown[0]?.i;
  $(host,'[data-count]').textContent=`${pool.length} matching questions`;
  $(host,'[data-list]').innerHTML=shown.map(r=>`<button class="browser-row" data-i="${r.i}" aria-pressed="${r.i===selected}">${esc(r.q.slice(0,110))}${r.q.length>110?'…':''}<small>${esc(r.category)} · Jev ${fmt(r.pJev)} · Luna ${fmt(r.pLuna)}</small></button>`).join('')||'<p class="empty-state">No questions match.</p>';
  const current=pool.find(r=>r.i===selected);$(host,'[data-detail]').innerHTML=current?detail(current):'';
  $(host,'[data-page]').textContent=`Page ${page+1} of ${pages}`;$(host,'[data-prev]').disabled=page===0;$(host,'[data-next]').disabled=page>=pages-1;
  for(const b of $$(host,'[data-i]'))b.onclick=()=>{selected=Number(b.dataset.i);render()};
 }
 for(const [sel,set] of [['[data-outcome]',v=>outcome=v],['[data-category]',v=>category=v],['[data-sort]',v=>sort=v]])$(host,sel).onchange=e=>{set(e.target.value);page=0;render()};
 $(host,'[data-prev]').onclick=()=>{page--;render()};$(host,'[data-next]').onclick=()=>{page++;render()};render();
}

const factories={routeMetrics,latency:latencyExplorer,selective:selectiveExplorer,frontier:frontierExplorer,disagreements:disagreementExplorer,tier:tierExplorer};
async function init(){
 const hosts=$$(document,'[data-s1]');if(!hosts.length)return;
 try{const data=await fetch('/system-one/evidence.json').then(r=>{if(!r.ok)throw Error('Evidence unavailable');return r.json()});
  for(const host of hosts){try{factories[host.dataset.s1]?.(host,data);host.dataset.ready='true'}catch(error){host.dataset.error='true';console.error('Explorer failed',host.dataset.s1,error)}}
 }catch(error){for(const host of hosts)host.insertAdjacentHTML('beforeend','<p class="widget-note">Interactive evidence could not load. The article’s tables and figures show the recorded results.</p>');console.error(error)}
}
init();
const progress=document.getElementById('reading-progress');function scrollProgress(){const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=(max>0?scrollY/max*100:0)+'%'}addEventListener('scroll',scrollProgress,{passive:true});scrollProgress();
const dialog=document.getElementById('figure-dialog');for(const button of $$(document,'[data-expand]'))button.onclick=()=>{const img=$(dialog,'img');img.src=button.dataset.expand;img.alt=button.dataset.alt||'Expanded diagram';dialog.showModal()};$(dialog||document,'[data-close]')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
