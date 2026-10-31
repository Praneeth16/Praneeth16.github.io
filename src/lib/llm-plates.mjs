const C={ink:'#1c3439',paper:'#f7f5ed',blue:'#325bcb',orange:'#df6845',mint:'#a9c9bc',line:'#a9b5af',yellow:'#e9c365',pale:'#d7e1ed',dark:'#132d37'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const p=(d,attrs='')=>`<path d="${d}" ${attrs}/>`;
const text=(x,y,t,size=22,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${esc(t)}</text>`;
const line=(x,y,X,Y,attrs='')=>p(`M${x} ${y}L${X} ${Y}`,attrs);
const circle=(x,y,r,attrs='')=>`<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/>`;
const rect=(x,y,w,h,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs}/>`;
function token(x,y,w,label,color=C.blue,attrs=''){return `<g ${attrs}>${rect(x+5,y+7,w,49,`fill="${C.ink}" opacity=".1" stroke="none"`)}${rect(x,y,w,49,`fill="${C.paper}" stroke="${color}" stroke-width="1.8"`)}${rect(x,y,5,49,`fill="${color}" stroke="none"`)}${text(x+w/2,y+32,label,23,`text-anchor="middle" fill="${color}" stroke="none"`)}</g>`;}
function wire(d,color=C.blue,attrs=''){const cls=attrs.match(/class="([^"]*)"/)?.[1]||"signal";return p(d,`fill="none" stroke="${color}" stroke-width="2" class="${cls}" ${attrs.replace(/class="[^"]*"/,'')}`);}
function arrow(d,color=C.blue){return wire(d,color,`marker-end="url(#END)"`);}
function mark(x,y,label,color=C.blue){return `<g stroke="none">${circle(x,y-7,3,`fill="${color}"`)}${text(x+12,y,label,13,`fill="${color}" letter-spacing="1"`)}</g>`;}
function vector(x,y,n=12,seed=1,attrs=''){let s='';for(let i=0;i<n;i++){const a=Math.sin((i+1)*(seed+2)*1.7);s+=rect(x+i*14,y,10,34,`fill="${a>0?C.blue:C.orange}" fill-opacity="${.18+Math.abs(a)*.7}" stroke="none"`);}return `<g ${attrs}>${s}</g>`;}
function matrix(x,y,cols=8,rows=7,cell=12,seed=1,attrs=''){let s='';for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=Math.sin((i+1)*13+(j+seed)*3.2);s+=rect(x+j*(cell+3),y+i*(cell+3),cell,cell,`fill="${a>0?C.blue:C.orange}" fill-opacity="${.15+Math.abs(a)*.65}" stroke="none"`);}return `<g ${attrs}>${s}</g>`;}
function prism(x,y,w,d,h,color=C.pale,attrs=''){return `<g ${attrs}>${p(`M${x} ${y}l${w} ${w*.22} ${-d} ${d*.5} ${-w} ${-w*.22}Z`,`fill="${color}" fill-opacity=".8"`)}${p(`M${x-d} ${y+d*.5}l${w} ${w*.22}v${h}l${-w} ${-w*.22}Z`,`fill="${color}"`)}${p(`M${x+w-d} ${y+w*.22+d*.5}l${d} ${-d*.5}v${h}l${-d} ${d*.5}Z`,`fill="${color}" fill-opacity=".6"`)}${line(x-d+5,y+d*.5+h+5,x+w-d,y+w*.22+d*.5+h+5,'opacity=".2"')}</g>`;}
function sheet(x,y,w=90,h=125,angle=0,label='',color=C.paper){return `<g transform="translate(${x} ${y}) rotate(${angle})">${rect(4,6,w,h,'fill="#1c3439" opacity=".08" stroke="none"')}${p(`M0 0H${w-15}L${w} 15V${h}H0Z`,`fill="${color}"`)}${p(`M${w-15} 0v15h15`,'fill="none"')}${[30,41,52,63,74,85].filter(n=>n<h-15).map((n,i)=>line(13,n,w-15-i%2*12,n,'opacity=".28"')).join('')}${label?text(12,h-13,label,11,'stroke="none"'):''}</g>`;}
function svg(id,body,label,h=590,dark=false){const bg=dark?C.dark:C.paper;let source=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${h}" role="img" aria-label="${esc(label)}" class="plate-art" data-art="${id}"><defs><marker id="END" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="${C.orange}" stroke-width="1.4"/></marker><pattern id="HATCH" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V9" stroke="${dark?'#a9c9bc':'#677b78'}" stroke-opacity=".2"/></pattern><pattern id="GRID" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${dark?'#a9c9bc':'#77948c'}" stroke-opacity=".1" stroke-width=".7"/></pattern></defs><rect width="1000" height="${h}" fill="${bg}"/><rect width="1000" height="${h}" fill="url(#GRID)"/><g fill="${dark?'#e8eade':C.ink}" stroke="${dark?'#719288':C.ink}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" font-family="DM Mono,monospace">${body}</g></svg>`;for(const key of ['END','HATCH','GRID'])source=source.replaceAll(`id="${key}"`,`id="${id}-${key}"`).replaceAll(`url(#${key})`,`url(#${id}-${key})`);return source;}
export function opening(){let s='';
  s+=`<g opacity=".6">${sheet(80,122,92,125,-11,'TEXT')}${sheet(122,88,94,132,6,'CODE')}${sheet(173,131,89,116,15,'BOOKS')}</g>`;
  s+=wire('M228 246C320 260 298 385 430 388',C.orange);
  s+=wire('M210 195C327 181 315 314 437 314',C.blue);
  s+=wire('M223 151C370 114 320 245 442 241',C.blue);
  for(let i=4;i>=0;i--){let y=148+i*43;s+=prism(491,y,189,88,20,i%2?C.mint:C.pale,`class="hero-layer" style="--delay:${i*.2}s"`);s+=matrix(477,y+24,10,1,9,i);}
  s+=p('M408 390C357 408 340 122 452 118','fill="none" stroke="#325bcb" opacity=".6" stroke-width="1.5"');
  s+=arrow('M658 330C710 333 692 214 755 218',C.blue);
  s+=token(752,190,157,'Hello.',C.blue,'class="answer-token"');
  s+=token(742,254,132,'there',C.blue,'opacity=".3"');
  s+=token(762,318,113,'world',C.orange,'opacity=".15"');
  s+=mark(80,340,'THE MATERIAL');s+=mark(442,448,'THE LEARNED MODEL');s+=mark(751,405,'ONE NEXT TOKEN');
  s+=`<g class="traveller">${circle(0,0,4,`fill="${C.orange}" stroke="none"`)}<animateMotion dur="7s" repeatCount="indefinite" path="M210 195C327 181 315 314 437 314"/></g>`;
  return svg('opening',s,'Text and code enter a layered numerical model. A distribution at the output yields a next token. The illustrations show operations, not literal factory machinery.',510);
}
export function corpus(){let s='';
  for(let i=0;i<11;i++)s+=sheet(85+(i%4)*63,52+Math.floor(i/4)*48,73,100,[-8,4,-2,8][i%4],i===6?'TEST':'',i===6?'#d6e5e4':C.paper);
  s+=arrow('M355 200C425 196 400 274 470 274',C.orange);
  s+=rect(451,202,188,145,'fill="url(#HATCH)"');s+=rect(466,187,188,145,`fill="${C.paper}" stroke="${C.blue}" stroke-width="2"`);
  s+=text(560,235,'CURATE',21,`stroke="none" fill="${C.blue}" text-anchor="middle"`);
  s+=text(560,275,'filter / deduplicate',13,'stroke="none" text-anchor="middle"');
  s+=wire('M560 334V418H307',C.orange);s+=sheet(234,392,68,85,-8,'TEST','#d6e5e4');s+=mark(120,520,'KEEP THE TEST APART',C.orange);
  s+=arrow('M656 259H725',C.blue);s+=sheet(734,178,113,156,4,'TRAIN');
  s+=token(430,441,107,'The');s+=token(550,441,102,'sky');s+=token(665,441,78,'is');s+=token(756,441,122,'blue');
  s+=arrow('M797 345V413',C.blue);s+=mark(430,546,'A TOKENIZER MAPS PIECES TO IDS');
  s+=text(102,51,'SELECT THE TEXT',15,'stroke="none"');
  return svg('corpus',s,'A text collection passes through filtering and deduplication. Evaluation material branches into a reserved set. A tokenizer turns the retained training text into token IDs.');
}
export function attentionPlate(){let s='';const words=['The','small','bird','can','fly'];
  for(let i=0;i<5;i++){s+=text(56,144+i*74,words[i],24,'stroke="none"');s+=vector(147,120+i*74,7,i+2);s+=line(251,138+i*74,310,138+i*74,`stroke="${C.blue}" opacity=".4"`);}
  s+=mark(57,55,'IDS → LEARNED VECTORS');
  for(let i=0;i<5;i++){s+=text(352+i*62,84,words[i],15,'stroke="none" text-anchor="middle"');for(let j=0;j<5;j++){const x=324+j*62,y=108+i*74;s+=rect(x,y,55,59,j>i?'fill="url(#HATCH)" stroke-opacity=".2"':`fill="${C.blue}" fill-opacity="${.1+((i+j*2)%5)/8}" stroke-opacity=".4" data-attention-cell="${i},${j}"`);s+=text(x+27,y+36,j>i?'×':'',24,'stroke="none" text-anchor="middle" fill="#889b94"');}}
  s+=rect(320,400,310,72,'fill="none" stroke="#df6845" stroke-width="2" data-query-frame=""');
  s+=mark(675,142,'MASKED');s+=text(675,175,'No future tokens.',19,'stroke="none"');
  s+=wire('M635 435C701 435 676 361 738 361',C.orange);s+=vector(735,345,10,4,'data-attention-output=""');
  s+=mark(727,427,'MIX THE VALUES');
  s+=text(58,533,'QKᵀ / √d → mask → softmax → weighted values',19,'stroke="none"');
  return svg('attention',s,'Five token vectors enter one attention head. The upper triangle is masked. Selecting a query changes its causal attention row and the weighted value output.',590);
}
export function transformerPlate(){let s='';
  s+=vector(383,561,16,2);s+=mark(382,631,'TOKEN VECTORS + POSITION');
  for(let l=3;l>=0;l--){const x=421+l*14,y=93+l*111;s+=prism(x,y,261,125,49,l%2?C.mint:C.pale,'class="decoder-slab"');s+=rect(x-100,y+77,108,22,`fill="${C.blue}" stroke="none" opacity=".8" transform="skewY(12.4) translate(0 ${-(x-100)*.22})"`);s+=text(x-76,y+99,'ATTN',12,'stroke="none"');s+=text(x+65,y+128,'MLP',12,'stroke="none"');s+=wire(`M${x-113} ${y+99}C${x-182} ${y+102} ${x-179} ${y+38} ${x-86} ${y+40}`,C.blue);}
  s+=wire('M480 563L480 542',C.blue);s+=mark(60,242,'ONE BLOCK, REPEATED');s+=text(60,279,'Norm → attention → add',18,'stroke="none"');s+=text(60,310,'Norm → MLP → add',18,'stroke="none"');
  s+=line(278,333,349,333,'stroke="#889b94"');s+=mark(731,375,'RESIDUAL PATHS',C.blue);s+=wire('M691 415H742',C.blue);
  for(let j=0;j<10;j++){let h=[15,29,21,63,35,18,28,84,24,46][j];s+=rect(408+j*23,85-h,12,h,`fill="${j===7?C.orange:C.blue}" stroke="none"`);}
  s+=mark(677,47,'VOCABULARY LOGITS');
  return svg('transformer',s,'A dense decoder stack. Every pre-normalized block has masked attention, an MLP, and residual additions. The final norm and vocabulary projection produce next-token logits.',690);
}
export function trainingPlate(){let s='';
  s+=token(68,77,103,'The');s+=token(183,77,103,'sky');s+=token(298,77,78,'is');s+=mark(69,49,'PREFIX');
  s+=prism(194,230,158,71,90,C.pale);s+=`<g data-train-weights="">${[0,1,2].map(i=>rect(164+i*31,282,24,44,`fill="${C.blue}" fill-opacity=".3" stroke="none" data-logit-tile="${i}"`)+text(176+i*31,345,'0.0',11,`stroke="none" text-anchor="middle" data-logit-value="${i}"`)).join('')}</g>`;
  s+=arrow('M302 311C405 335 404 266 499 266',C.blue);s+=wire('M180 148L180 216',C.blue);
  ['blue','green','loud'].forEach((t,i)=>{const y=205+i*70;s+=text(529,y,t,23,'stroke="none"');s+=rect(631,y-25,250,30,'fill="#dfe4db" stroke="none"');s+=rect(631,y-25,83.3,30,`fill="${i===0?C.blue:C.mint}" stroke="none" data-train-bar="${i}"`);s+=text(927,y,'33%',17,`stroke="none" text-anchor="end" data-train-value="${i}"`);});
  s+=token(773,70,132,'blue',C.orange);s+=mark(773,48,'ACTUAL TARGET',C.orange);s+=arrow('M838 130V163',C.orange);
  s+=wire('M667 397C670 491 176 471 176 364',C.orange,'class="signal backward" marker-end="url(#END)"');s+=mark(290,490,'BACKPROPAGATE THE LOSS',C.orange);
  s+=text(528,551,'loss = −ln p(blue)',22,'stroke="none"');s+=text(927,551,'1.099',28,'stroke="none" text-anchor="end" data-train-loss=""');
  s+=mark(80,544,'WEIGHTS CHANGE');
  return svg('training',s,'A three-logit training toy predicts the next token. The actual target is blue. Cross-entropy supplies a loss; the gradient update increases target probability and changes the logits. Forward information flows in blue; the learning signal returns in orange.',610);
}
function gpu(x,y,seed){let s=rect(x,y,160,194,`fill="#183d49" stroke="#91b0aa"`);s+=rect(x+9,y+9,142,176,'fill="url(#HATCH)" stroke="#497b7e"');for(let i=0;i<3;i++){s+=rect(x+18,y+19+i*50,124,39,'fill="#14323b" stroke="#5c8888"');for(let j=0;j<3;j++){s+=circle(x+39+j*35,y+38+i*50,12,'fill="none" stroke="#7c9c94"');s+=p(`M${x+39+j*35} ${y+26+i*50}v24m-12-12h24`,'fill="none" stroke="#527671" class="fan-detail"');}s+=circle(x+132,y+31+i*50,2.5,`fill="${(i+seed)%2?C.orange:C.mint}" class="server-light"`);}return s;}
export function scalePlate(){let s='';
  for(let i=0;i<4;i++){s+=gpu(67+i*235,155,i);s+=text(147+i*235,115,`BATCH ${String.fromCharCode(65+i)}`,17,'text-anchor="middle" stroke="none" fill="#a9c9bc"');s+=wire(`M${147+i*235} 357V409Q${147+i*235} 450 500 450`,i%2?C.orange:'#86b8cf');}
  s+=circle(500,450,33,'fill="#193e47" stroke="#a9c9bc"');s+=text(500,458,'Σ',28,'text-anchor="middle" stroke="none" fill="#f7f5ed"');
  s+=wire('M500 489V523H146V365','#a9c9bc','class="signal"');s+=wire('M500 523H852V365','#a9c9bc','class="signal"');
  s+=text(500,68,'SAME MODEL. DIFFERENT BATCHES.',23,'text-anchor="middle" stroke="none" fill="#f7f5ed"');s+=text(500,568,'combine gradients → update together',24,'text-anchor="middle" stroke="none" fill="#a9c9bc"');
  return svg('scale',s,'Four data-parallel model replicas process distinct training batches. Their gradients are combined before a coordinated parameter update. Other kinds of parallelism divide matrices, layers, or model state.',620,true);
}
export function posttrainingPlate(){let s='';
  s+=mark(58,48,'BASE MODEL');s+=matrix(68,80,7,7,12,3);s+=arrow('M198 134H288',C.blue);
  s+=rect(304,63,619,174,'fill="#edf0e7" stroke="#adc2b8"');s+=mark(330,99,'1. DEMONSTRATIONS');
  s+=text(330,143,'USER',13,'stroke="none" fill="#8e9a90"');s+=text(468,143,'Explain rain.',23,'stroke="none" fill="#8e9a90"');
  s+=text(330,195,'ASSISTANT',13,'stroke="none" fill="#325bcb"');s+=rect(459,163,415,47,'fill="#d2dfed" stroke="none"');s+=text(468,195,'Water falls from clouds.',23,'stroke="none" fill="#325bcb"');
  s+=wire('M829 242V300H289',C.orange);s+=mark(57,304,'2. PREFERENCES / REWARDS',C.orange);
  s+=rect(66,336,364,111,'fill="#e4eee4" stroke="#7a9c83"');s+=text(88,373,'CHOSEN',13,'stroke="none" fill="#51785d"');s+=text(88,416,'Clear, grounded answer.',21,'stroke="none"');
  s+=rect(477,336,364,111,'fill="#f2e5dd" stroke="#c79a84"');s+=text(499,373,'REJECTED',13,'stroke="none" fill="#b35c3d"');s+=text(499,416,'Confident fabrication.',21,'stroke="none"');
  s+=wire('M250 457V494H555',C.blue);s+=wire('M660 457V494H555',C.orange);s+=arrow('M555 494V530',C.blue);
  s+=text(599,564,'ASSISTANT CHECKPOINT',19,'stroke="none" fill="#325bcb"');s+=matrix(441,533,6,3,11,5);
  s+=text(66,559,'SFT → DPO, or a reward-based route.',15,'stroke="none" fill="#75887b"');
  return svg('posttraining',s,'Supervised fine-tuning uses assistant demonstrations, often with prompt loss masked. Preference methods such as DPO, or alternative reward-based reinforcement-learning methods, refine behavior. The pair here is illustrative.',615);
}
export function evaluationPlate(){let s='';s+=matrix(85,195,10,10,14,4);s+=mark(84,158,'SAVED WEIGHTS');s+=arrow('M274 283H370',C.blue);
  s+=circle(496,275,111,'fill="#dbe6de" fill-opacity=".45" stroke="#779e8c" stroke-width="2"');s+=circle(496,275,90,'fill="none" stroke="#9cb7ab"');s+=matrix(445,220,6,6,13,4);s+=p('M574 357l60 60','stroke="#779e8c" stroke-width="17"');
  s+=mark(388,102,'HELD-OUT EVALUATION');
  s+=arrow('M620 266H739',C.blue);s+=rect(765,203,146,152,'fill="#dde8d7" stroke="#7e9b77" data-gate-panel=""');s+=text(838,270,'PASS',28,'text-anchor="middle" stroke="none" fill="#517857" data-gate-label=""');s+=text(838,316,'RELEASE',14,'text-anchor="middle" stroke="none" fill="#517857" data-gate-sub=""');
  s+=wire('M482 390C484 520 166 525 166 396',C.orange,'class="signal" marker-end="url(#END)"');s+=mark(265,533,'FAIL → RETURN TO DEVELOPMENT',C.orange);
  return svg('evaluation',s,'Held-out tests inspect a saved model. A required check failure returns it to development. Passing an illustrative gate does not establish comprehensive safety or correctness.',580);
}
export function inferencePlate(){let s='';s+=mark(59,58,'PROMPT');s+=token(58,91,106,'The');s+=token(176,91,106,'sky');s+=token(294,91,85,'is');
  s+=prism(469,177,170,89,95,C.pale);s+=matrix(434,239,8,5,11,3);s+=mark(407,388,'FIXED WEIGHTS');
  s+=arrow('M380 117C445 117 399 210 448 210',C.blue);s+=arrow('M626 302C719 312 705 202 773 202',C.blue);
  s+=token(773,176,152,'blue',C.blue,'data-decode-token=""');
  s+=rect(59,294,263,154,'fill="#e5ece4" stroke="#a4b4a4"');s+=text(80,331,'KV CACHE',18,'stroke="none"');
  for(let i=0;i<8;i++)s+=rect(83+i*27,358,18,62,`fill="${i<3?C.mint:C.paper}" stroke="#90aa9c" data-cache-slot="${i}"`);
  s+=wire('M325 362C389 371 378 285 428 285',C.blue);s+=text(80,482,'reuse earlier keys + values',15,'stroke="none" fill="#768c7d"');
  s+=wire('M851 245C930 399 803 469 654 449C564 438 567 347 631 348',C.orange,'class="signal" marker-end="url(#END)"');s+=mark(705,500,'APPEND. PREDICT AGAIN.',C.orange);
  return svg('inference',s,'Prompt prefill populates attention keys and values. A fixed checkpoint supplies next-token distributions. Sampling appends one token. The next forward pass processes that pending token and extends the KV cache. Model weights stay fixed.',570);
}
