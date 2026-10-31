import {softmax, crossEntropy, gradientStep, attention, sigmoid, dpoLoss, dpoStep, topP, bpeStep} from './math.mjs';
const $ = id => document.getElementById(id);
const pct = n => `${(n * 100).toFixed(1)}%`;
$('map-open').addEventListener('click', () => $('map-detail').showModal());
$('map-close').addEventListener('click', () => $('map-detail').close());
document.querySelectorAll('#map-detail a').forEach(link=>link.addEventListener('click',()=>$('map-detail').close()));
function bars(target, labels, probabilities, chosen = -1) {
  $(target).replaceChildren(...labels.map((label, i) => {
    const row = document.createElement('div'); row.className = `bar-row${i === chosen ? ' target' : ''}`;
    const name = document.createElement('span'); name.textContent = label;
    const track = document.createElement('div'); track.className = 'bar-track';
    const bar = document.createElement('i'); bar.style.width = pct(probabilities[i]); track.append(bar);
    const value = document.createElement('b'); value.textContent = pct(probabilities[i]);
    row.append(name,track,value); return row;
  }));
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
function setMotion() { document.body.classList.toggle('paused', paused); $('motion').setAttribute('aria-pressed', String(paused)); $('motion').textContent = paused ? 'Resume motion' : 'Pause motion'; }
$('motion').addEventListener('click', () => { paused = !paused; setMotion(); });
reducedMotion.addEventListener('change', event => { paused = event.matches; setMotion(); }); setMotion();
const tours = [
  'It starts with a collection of text, long before it can answer you.',
  'A learned codebook turns text into token IDs. The network looks up their vectors.',
  'Decoder layers mix information from the prefix and predict the next token.',
  'A target supplies a loss. Gradients tell the optimizer how to change the weights.',
  'Demonstrations and feedback teach a base model how to respond as an assistant.',
  'Held-out tests look for failures. A checkpoint can return for more training.',
  'Your request enters a fixed model. Tokens accumulate; the weights stay the same.'
];
let tour = -1;
$('tour-next').addEventListener('click', () => {
  tour = (tour + 1) % tours.length;
  $('world').classList.add('touring');
  document.querySelectorAll('#world .station').forEach((node, i) => node.classList.toggle('current', i === tour));
  $('tour-caption').textContent = tours[tour]; $('tour-count').textContent = `${String(tour+1).padStart(2,'0')} / 07`;
  $('tour-next').textContent = tour === 6 ? 'Follow it again ↺' : 'Next station →';
});
const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
const observer = new IntersectionObserver(entries => {
  const active = entries.filter(x => x.isIntersecting).sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top)[0];
  if (!active) return;
  chapterLinks.forEach(a => { const current = a.hash === '#'+active.target.id; a.classList.toggle('active',current); if(current) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
}, {rootMargin:'-15% 0px -60% 0px',threshold:0});
document.querySelectorAll('.chapter').forEach(x => observer.observe(x));

const docs = [
  ['A botany chapter','BOOK', 'keep'],['Python functions','CODE','keep'],['Win free tokens!','SPAM','spam'],['A weather report','WEB','keep'],
  ['A botany chapter','COPY','duplicate'],['A Hindi essay','LICENSED','keep'],['A test question','HELD OUT','test'],['A cooking guide','WEB','keep'],
  ['A test solution','HELD OUT','test'],['Click click click','SPAM','spam'],['A physics lesson','LICENSED','keep'],['Python functions','COPY','duplicate']
];
function corpus() {
  let training=0,reserved=0,removed=0;
  $('documents').replaceChildren(...docs.map(([title,type,kind],i) => {
    const state = (kind==='spam' && $('filter-quality').checked) || (kind==='duplicate' && $('filter-duplicate').checked) ? 'removed' : kind==='test' && $('filter-test').checked ? 'reserved' : 'training';
    if(state==='training') training++; else if(state==='reserved') reserved++; else removed++;
    const card=document.createElement('div');card.className='document '+state;card.style.setProperty('--angle',`${[-2,1,-1,2][i%4]}deg`);
    const tag=document.createElement('span');tag.textContent=`${String(i+1).padStart(2,'0')} / ${type}`;
    const name=document.createElement('b');name.textContent=title;
    const status=document.createElement('small');status.textContent=state==='training'?'train':state==='reserved'?'reserve':'remove';card.append(tag,name,status);return card;
  }));
  $('corpus-status').textContent=`${training} train · ${reserved} reserved · ${removed} removed.${!$('filter-test').checked?' Evaluation examples have entered training. This split now leaks.':''}`;
  $('corpus-status').style.color=$('filter-test').checked?'var(--green)':'var(--red)';
}
['filter-quality','filter-duplicate','filter-test'].forEach(id=>$(id).addEventListener('change',corpus));corpus();

let parts=[...'low lower low lowest'],merges=0;
function tokens(){
  $('token-strip').replaceChildren(...parts.map(token=>{const span=document.createElement('span');span.textContent=token===' '?'·':token;span.className=token===' '?'space':'';return span;}));
  $('token-count').textContent=String(parts.length);$('merge-count').textContent=String(merges);
}
$('merge').addEventListener('click',()=>{const result=bpeStep(parts);if(!result.pair){$('merge-status').textContent='Every word is now one unit. This tiny learning run is finished.';$('merge').disabled=true;return;}parts=result.parts;merges++;tokens();$('merge-status').textContent=`Merge ${merges}: “${result.pair[0]}” + “${result.pair[1]}” → “${result.pair.join('')}”. ${result.count} non-boundary pair occurrences counted.`;});
$('token-reset').addEventListener('click',()=>{parts=[...'low lower low lowest'];merges=0;$('merge').disabled=false;tokens();$('merge-status').textContent='Start with characters. Spaces are fixed boundaries in this toy.';});tokens();

const words=['The','small','bird','can','fly'];
const queries=[[1,0],[.7,.8],[.2,1.2],[1,-.5],[1.2,.8]],keys=[[.2,.6],[.8,.2],[1.4,.9],[.6,-.4],[.1,1.1]],values=[[1,0],[0,1],[1,1],[-1,.5],[.5,-1]];
let queryPosition=4;
$('query-buttons').replaceChildren(...words.map((_,i)=>{const button=document.createElement('button');button.type='button';button.addEventListener('click',()=>{queryPosition=i;renderAttention();});return button;}));
function renderAttention(){
  [...$('query-buttons').children].forEach((button,i)=>{button.textContent=(i===queryPosition?'● ':'')+words[i];button.setAttribute('aria-pressed',String(i===queryPosition));});
  const matrix=$('attention-matrix');matrix.replaceChildren();
  const add=(text,cls,style='',label='')=>{const cell=document.createElement('div');cell.textContent=text;cell.className=cls;if(style)cell.style.background=style;if(label)cell.setAttribute('aria-label',label);matrix.append(cell);};
  add('Q↓ K→','matrix-label');words.forEach(w=>add(w,'matrix-label'));
  for(let i=0;i<5;i++){add(words[i],'matrix-label');const row=attention(queries[i],keys,values,i);for(let j=0;j<5;j++) add(j>i?'×':row.weights[j].toFixed(2),`cell${j>i?' blocked':''}${i===queryPosition?' selected':''}`,j>i?'':`rgba(87,133,155,${.08+.7*row.weights[j]})`,`${words[i]} attends to ${words[j]}: ${j>i?'future position blocked':pct(row.weights[j])}`);}
  const selected=attention(queries[queryPosition],keys,values,queryPosition);$('attention-query').textContent=`“${words[queryPosition]}” at position ${queryPosition+1}`;bars('attention-bars',words,selected.weights,queryPosition);$('attention-output').textContent=`Weighted value output: [${selected.output.map(x=>x.toFixed(3)).join(', ')}]. Each allowed row sums to 1.`;
}renderAttention();

let logits=[0,0,0],step=0,losses=[crossEntropy(logits,0)];
function learning(){
  bars('learn-bars',['blue','green','loud'],softmax(logits),0);$('loss').textContent=crossEntropy(logits,0).toFixed(3);$('rate-value').textContent=Number($('learn-rate').value).toFixed(2);
  const x=i=>35+i*465/Math.max(10,losses.length-1),y=l=>105-l/1.15*88;
  $('loss-plot').innerHTML=`<path d="M35 10V106H505" fill="none" stroke="#c6bea9"/><path d="${losses.map((l,i)=>`${i?'L':'M'}${x(i).toFixed(2)} ${y(l).toFixed(2)}`).join(' ')}" fill="none" stroke="#b15e46" stroke-width="2"/>${losses.map((l,i)=>`<circle cx="${x(i)}" cy="${y(l)}" r="2.2" fill="#b15e46"/>`).join('')}<text x="4" y="18" font-family="Kevin" font-size="12" fill="#73766a">1.1</text><text x="15" y="108" font-family="Kevin" font-size="12" fill="#73766a">0</text><text x="35" y="128" font-family="Kevin" font-size="12" fill="#73766a">update 0</text><text x="420" y="128" font-family="Kevin" font-size="12" fill="#73766a">update ${step}</text>`;
  $('learn-step').disabled=step>=40;
}
$('learn-step').addEventListener('click',()=>{logits=gradientStep(logits,0,Number($('learn-rate').value));step++;losses.push(crossEntropy(logits,0));learning();$('learn-status').textContent=`Step ${step}. p(blue) = ${pct(softmax(logits)[0])}. Cross-entropy = ${crossEntropy(logits,0).toFixed(3)}.${step===40?' Forty steps complete. Reset to explore another step size.':''}`;});
$('learn-reset').addEventListener('click',()=>{logits=[0,0,0];step=0;losses=[crossEntropy(logits,0)];learning();$('learn-status').textContent='Step 0. All three choices are equally likely.';});$('learn-rate').addEventListener('input',learning);learning();
function compute(){const n=Number($('parameters').value),d=Number($('training-tokens').value)/10;$('parameters-value').textContent=n+'B';$('training-tokens-value').textContent=d.toFixed(1)+'T';$('compute-value').textContent=(6*n*d).toFixed(1)+' ZFLOP';}
['parameters','training-tokens'].forEach(id=>$(id).addEventListener('input',compute));compute();
function sft(assistantOnly){$('mode-pretrain').setAttribute('aria-pressed',String(!assistantOnly));$('mode-sft').setAttribute('aria-pressed',String(assistantOnly));document.querySelectorAll('[data-chat-token]').forEach(node=>{const counts=!assistantOnly||node.dataset.chatToken==='answer';node.classList.toggle('counts',counts);node.classList.toggle('masked',!counts);});$('sft-status').textContent=assistantOnly?'Only the five assistant token groups contribute to loss. All prompt groups supply context.':'All eight displayed target groups contribute to loss in this full-sequence objective.';}
$('mode-pretrain').addEventListener('click',()=>sft(false));$('mode-sft').addEventListener('click',()=>sft(true));sft(true);
let margin=0,dpoSteps=0;
function preference(){$('preference-marker').style.left=pct(sigmoid(margin));$('dpo-status').textContent=`Update ${dpoSteps} · pair score σ(m) = ${pct(sigmoid(margin))} · DPO loss = ${dpoLoss(margin,0,.5).toFixed(3)}.`;$('dpo-step').disabled=dpoSteps>=30;}
$('dpo-step').addEventListener('click',()=>{margin=dpoStep(margin,0,.5,1);dpoSteps++;preference();});$('dpo-reset').addEventListener('click',()=>{margin=0;dpoSteps=0;preference();});preference();
function gate(){const failures=[['eval-leak','isolate the evaluation set'],['eval-capability','meet the capability target'],['eval-safety','resolve required safety failures'],['eval-regression','fix regressions']].filter(([id])=>!$(id).checked).map(([,reason])=>reason);const result=$('gate-result');result.classList.toggle('blocked',!!failures.length);result.replaceChildren(document.createTextNode(failures.length?'Return for more work ↺':'Advance to serving →'));const detail=document.createElement('small');detail.textContent=failures.length?'Before advancing: '+failures.join('; ')+'.':'All four illustrative requirements are satisfied. Real release decisions require broader evidence.';result.append(detail);$('gate-state').textContent=failures.length?'REVISE':'SERVE';}
['eval-leak','eval-capability','eval-safety','eval-regression'].forEach(id=>$(id).addEventListener('change',gate));gate();

let decodePhase='ready',generated=[],cached=0;
function nextDistribution(){
  if(!generated.length)return {labels:['blue','gray','pink','green'],logits:[2.5,1.5,.5,.1]};
  const last=generated.at(-1);
  if(last==='today')return {labels:['.','<end>'],logits:[2,1]};
  if(last==='above')return {labels:['us','the city'],logits:[2,1]};
  if(last==='us'||last==='the city')return {labels:['.','<end>'],logits:[2,1]};
  if(last==='.')return {labels:['<end>'],logits:[0]};
  return {labels:['.','today','above','<end>'],logits:[2,1.4,.6,.1]};
}
function inference(){
  const temperature=Number($('temperature').value),threshold=Number($('top-p').value),dist=nextDistribution();
  const probabilities=topP(softmax(dist.logits,temperature),threshold);
  $('temperature-value').textContent=temperature.toFixed(2);$('top-p-value').textContent=threshold.toFixed(2);bars('inference-bars',dist.labels,decodePhase==='done'?dist.labels.map(()=>0):probabilities);
  $('generated-text').textContent='The sky is'+(generated.length?' '+generated.filter(x=>x!=='<end>').join(' ').replace(/ \./g,'.'):'')+(decodePhase==='done'?' ⟨end⟩':'');
  $('decode-state').textContent=decodePhase==='ready'?'READY':decodePhase==='done'?'FINISHED':'DECODING';$('cache-size').textContent=String(cached);$('decode').disabled=decodePhase==='done';$('decode').textContent=decodePhase==='ready'?'Prefill the prompt →':decodePhase==='done'?'Request complete':'Sample the next token →';
  return {probabilities,dist};
}
$('decode').addEventListener('click',()=>{
  if(decodePhase==='ready'){decodePhase='decoding';cached=3;inference();$('decode-status').textContent='Prefill complete. Three prompt positions are cached. Their final position supplies the first next-token distribution.';return;}
  if(decodePhase==='done')return;
  if(generated.length)cached++;
  const {probabilities,dist}=inference();let draw=Math.random(),index=probabilities.length-1;for(let i=0;i<probabilities.length;i++){draw-=probabilities[i];if(draw<0){index=i;break;}}
  const word=dist.labels[index];generated.push(word);if(word==='<end>')decodePhase='done';inference();
  $('decode-status').textContent=decodePhase==='done'?`End token sampled. ${cached} positions cached. No parameter updates occurred.`:`Sampled “${word}”. The context has ${3+generated.length} positions; ${cached} have cached keys and values. The new token is processed on the next pass.`;
});
$('decode-reset').addEventListener('click',()=>{decodePhase='ready';generated=[];cached=0;inference();$('decode-status').textContent='First, prefill the three-token toy prompt. Then sample one token at a time.';});['temperature','top-p'].forEach(id=>$(id).addEventListener('input',inference));inference();
