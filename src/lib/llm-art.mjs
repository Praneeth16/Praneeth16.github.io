const ink = '#393c37';
const palette = { blue: '#a9c7d3', red: '#d98a72', green: '#a7bea4', yellow: '#dfc478', violet: '#b3a7c5', paper: '#f7f2e7' };
const line = (x1,y1,x2,y2,extra='') => `<path d="M${x1} ${y1}L${x2} ${y2}" ${extra}/>`;
const txt = (x,y,text,size=16,extra='') => `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${text}</text>`;
const path = (d, extra='') => `<path d="${d}" ${extra}/>`;
const circle=(x,y,r,fill=palette.paper,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
function box(x,y,w,d,h,c) {
  const a=[x,y],b=[x+w,y+w*.42],e=[x-d,y+d*.5],f=[x+w-d,y+w*.42+d*.5];
  const points=p=>p.map(q=>q.join(',')).join(' ');
  return `<g class="ink-object"><polygon points="${points([e,f,[f[0],f[1]+h],[e[0],e[1]+h]])}" fill="${c}"/><polygon points="${points([b,f,[f[0],f[1]+h],[b[0],b[1]+h]])}" fill="${c}"/><polygon points="${points([b,f,[f[0],f[1]+h],[b[0],b[1]+h]])}" fill="#252c32" opacity=".15"/><polygon points="${points([a,b,f,e])}" fill="${c}"/><polygon points="${points([a,b,f,e])}" fill="url(#hatch)" opacity=".27"/>${line(e[0]+3,e[1]+h+3,f[0]-1,f[1]+h+2,'opacity=".35"')}${line(f[0]+3,f[1]+h+2,b[0]+3,b[1]+h,'opacity=".3"')}</g>`;
}
function person(x,y,color,turn=1) {
  return `<g transform="translate(${x} ${y}) scale(${turn} 1)" class="tiny-person">${path('M-5 8L-6 29L0 30L1 13M2 10L5 30L11 29L8 7','fill="#536069"')}${path('M-9-17Q0-23 10-16L11 6Q0 13-11 7Z',`fill="${color}"`)}${path('M-10-13L-17 0L-13 6M10-13L17-3L26-8','fill="none"')}${circle(0,-29,10,'#f2ddc7')}${path('M-10-32Q-5-46 7-36L10-28Q3-34-10-30','fill="#525349"')}${circle(3,-29,.7,ink)}${path('M-1-24L4-23','fill="none"')}${path('M-8 31L0 32M5 32L13 31','stroke-width="3"')}</g>`;
}
function paper(x,y,rot=0,color=palette.paper) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0L42 0L50 9L50 59L0 59Z" fill="${color}"/><path d="M42 0L42 9L50 9" fill="none"/>${[17,24,31,38,45].map((v,i)=>line(8,v,39-i%2*5,v,'opacity=".5"')).join('')}</g>`;
}
function rack(x,y,c=palette.blue) {
  let s=box(x,y,57,34,117,c);
  for(let i=0;i<4;i++) { const yy=y+36+i*22; s+=path(`M${x-25} ${yy}l40 17v14l-40-17z`,'fill="#f0ede4"');s+=circle(x-18,yy+7,2,'#b96446','class="blink"');s+=line(x-10,yy+12,x+10,yy+20,'stroke-width="2"'); }
  return s;
}
function fan(x,y,r=9){return `<g class="fan" style="transform-origin:${x}px ${y}px">${circle(x,y,r,'#f4eee0')}${[0,120,240].map(a=>path(`M${x} ${y}q${r} ${-r} ${r-1} 1q-4 7 ${1-r} -1`,`fill="#85969b" transform="rotate(${a} ${x} ${y})"`)).join('')}${circle(x,y,2,ink)}</g>`;}
const defs = `<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)"><path d="M0 0V7" stroke="#443f36" stroke-width=".7" opacity=".45"/></pattern><filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale=".7" xChannelSelector="R" yChannelSelector="G"/></filter><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="#b16a50" stroke-width="1.4"/></marker></defs>`;
const svg=(content,viewBox,label,namespace=label.replace(/[^a-zA-Z]/g,'').slice(0,18))=>{
  const drawing=content.replaceAll('class="ink-object"','class="ink-object" filter="url(#pencil)"').replaceAll('class="tiny-person"','class="tiny-person" filter="url(#pencil)"');
  let result=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}" class="workshop-svg">${defs}<g stroke="${ink}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" font-family="Kevin,monospace" fill="${ink}">${drawing}</g></svg>`;
  for(const id of ['hatch','pencil','arrow']) result=result.replaceAll(`id="${id}"`,`id="${namespace}-${id}"`).replaceAll(`url(#${id})`,`url(#${namespace}-${id})`);
  return result;
};
function label(x,y,n,title,sub){return `<g class="station-label" stroke="none">${txt(x,y,n,12,'fill="#aa614b"')}${txt(x,y+24,title,21)}${txt(x,y+44,sub,12,'fill="#77776e"')}</g>`;}
export function workshop(namespace='workshop') {
 let s=`<g fill="none" stroke="#c1b59b" opacity=".3">${[-50,60,170,280,390,500].map(y=>path(`M50 ${y+220}L1000 ${y+620}`)).join('')}${[0,150,300,450,600,750,900].map(x=>path(`M${x+80} 80L${x-380} 550`)).join('')}</g>`;
 const routes=['M240 230C300 270 320 190 385 218','M500 236C550 250 560 310 610 310','M748 288C800 250 810 202 880 220','M970 290C1070 350 1070 406 980 430','M865 475C800 520 775 500 710 500','M574 523C510 550 492 510 435 480'];
 s+=`<g fill="none" stroke="#b16a50" stroke-width="1.5">${routes.map(d=>path(d,'marker-end="url(#arrow)" class="flow-path"')).join('')}</g>`;
 s+=`<a href="#data" class="station" data-stop="0" aria-label="Explore data curation"><g class="station-art">${box(122,195,112,72,12,'#ddd4bd')}${box(127,80,76,40,116,palette.green)}${[0,1,2].map(i=>path(`M93 ${127+i*29}l67 28v20l-67-28z`,'fill="#ece7d8"')).join('')}${paper(185,151,-12)}${paper(193,159,5,palette.blue)}${person(239,207,palette.red,-1)}</g>${label(80,297,'01 / THE CORPUS','Choose the text','collect · filter · deduplicate')}</a>`;
 s+=`<a href="#tokens" class="station" data-stop="1" aria-label="Explore tokenization"><g class="station-art">${box(388,178,115,70,14,'#d5c9b4')}${box(411,137,83,53,49,palette.yellow)}${path('M366 169l80 34v21l-80-34z','fill="#eee6d7"')}${[0,1,2,3,4].map(i=>box(369+i*16,194+i*6,12,9,7,[palette.red,palette.blue,palette.green][i%3])).join('')}${paper(411,97,-7)}${fan(459,183,11)}</g>${label(321,33,'02 / THE VOCABULARY','Text → numbers','a shared codebook')}</a>`;
 s+=`<a href="#transformer" class="station" data-stop="2" aria-label="Explore the transformer"><g class="station-art">${box(633,253,124,80,18,'#cdc7b5')}${[3,2,1,0].map(i=>box(652,139+i*29,92,64,17,[palette.blue,palette.violet,palette.green,palette.blue][i])).join('')}${path('M592 281C563 280 562 155 590 154','fill="none" stroke="#b46a51" stroke-width="2"')}${Array.from({length:6},(_,i)=>circle(646+i*8,151+i*3.4,2.5,'#d98a72')).join('')}${person(754,305,palette.yellow)}</g>${label(574,78,'03 / THE NETWORK','Mix the context','attention + feed-forward layers')}</a>`;
 s+=`<a href="#learning" class="station" data-stop="3" aria-label="Explore pretraining"><g class="station-art">${box(884,178,153,74,13,'#ccc3b0')}${rack(894,62)}${rack(957,87,palette.violet)}${rack(1020,113,palette.green)}${person(836,220,palette.blue)}${path('M882 247C816 279 812 132 861 145','fill="none" stroke="#b46a51" marker-end="url(#arrow)"')}</g>${label(851,33,'04 / PRETRAINING','Learn by prediction','repeat across a cluster')}</a>`;
 s+=`<a href="#assistant" class="station" data-stop="4" aria-label="Explore post-training"><g class="station-art">${box(906,395,119,67,13,'#d7cdb8')}${box(929,331,64,48,63,palette.red)}${path('M897 358l45 19v27l-45-19z','fill="#f4eadb"')}${txt(900,379,'SFT',13,'stroke="none"')}${person(1000,411,palette.green,-1)}${paper(851,379,-7)}${paper(879,390,4,palette.yellow)}</g>${label(851,528,'05 / POST-TRAINING','Learn to assist','demonstrations + feedback')}</a>`;
 s+=`<a href="#evaluation" class="station" data-stop="5" aria-label="Explore evaluation"><g class="station-art">${box(605,450,112,69,12,'#d7cbb4')}${box(646,384,52,35,60,palette.yellow)}${path('M618 406l39 16v24l-39-16z','fill="#eff0d8"')}${path('M627 424l7 9 12-10','fill="none" stroke="#668b75" stroke-width="3"')}${paper(565,412,-12)}${person(721,466,palette.red,-1)}</g>${label(559,576,'06 / THE CHECKPOINT','Test what changed','held-out tasks · safety · regressions')}</a>`;
 s+=`<a href="#inference" class="station" data-stop="6" aria-label="Explore inference"><g class="station-art">${box(338,411,116,73,13,'#d5c9b4')}${box(380,346,70,33,60,palette.blue)}${path('M352 364l55 23v32l-55-23z','fill="#e7ecd9"')}${txt(360,387,'hello_',16,'stroke="none" fill="#486d60"')}${path('M378 421l36 15-20 13-36-15z','fill="#e9dfc9"')}${person(297,426,palette.violet)}</g>${label(265,527,'07 / YOUR TURN','Generate a continuation','weights fixed · context grows')}</a>`;
 s+=`<g stroke="none">${txt(56,415,'the long way',15,'fill="#b16a50" transform="rotate(-10 56 415)"')}${txt(49,439,'to a short answer.',15,'fill="#b16a50" transform="rotate(-10 49 439)"')}</g>`;
 return svg(s,'0 0 1140 660','An illustrated workshop follows a language model from a curated document archive through tokenization, transformer layers, a GPU cluster, post-training, evaluation, and inference. Select a station to explore.',namespace).replace('role="img"','role="group"');
}
export function engine(){
 let s=box(310,356,230,118,14,'#ded4be');
 for(let l=2;l>=0;l--){let y=167+l*61;s+=box(333,y,174,91,29,[palette.blue,palette.green,palette.violet][l]);s+=txt(283,y+48,l===0?'masked attention':l===1?'feed-forward':'decoder block × L',17,'stroke="none" transform="rotate(22 283 '+(y+48)+')"');}
 s+=path('M226 374C170 375 175 181 233 187M222 251C180 258 186 227 232 230','fill="none" stroke="#b16a50" stroke-width="2" marker-end="url(#arrow)"');
 s+=txt(72,259,'residual',16,'stroke="none" fill="#ab654f"');s+=txt(72,280,'connections',16,'stroke="none" fill="#ab654f"');
 s+=path('M349 408L349 436M349 129L349 163','fill="none" marker-end="url(#arrow)" stroke="#b16a50" stroke-width="2"');
 s+=txt(290,470,'token vectors + position',19,'stroke="none"');
 s+=txt(288,76,'vocabulary logits',19,'stroke="none"');
 for(let i=0;i<9;i++)s+=`<rect x="${279+i*18}" y="${121-[17,25,12,41,19,32,13,56,20][i]}" width="11" height="${[17,25,12,41,19,32,13,56,20][i]}" fill="${i===7?palette.red:palette.blue}"/>`;
 s+=path('M474 240L576 206M452 301L576 300M423 356L576 388','fill="none" opacity=".6"');
 s+=txt(589,202,'Q · K · V',20,'stroke="none"');s+=txt(589,226,'retrieve from the prefix',15,'stroke="none" fill="#73746b"');
 s+=txt(589,297,'MLP',20,'stroke="none"');s+=txt(589,321,'transform each position',15,'stroke="none" fill="#73746b"');
 s+=txt(589,385,'RMSNorm',20,'stroke="none"');s+=txt(589,409,'control activation scale',15,'stroke="none" fill="#73746b"');
 return svg(s,'0 0 800 510','A simplified pre-normalized decoder stack with residual connections, masked attention, feed-forward layers, token vectors at the input, and vocabulary logits at the output. Exact operation order is described beside the figure.');
}
export function cluster(){let s='';for(let j=0;j<2;j++)for(let i=0;i<4;i++)s+=rack(150+i*108-j*60,80+i*32+j*130,[palette.blue,palette.green,palette.violet,palette.blue][i]);s+=person(596,326,palette.red);s+=path('M78 290Q225 372 520 443M117 160Q230 237 535 300','fill="none" stroke="#b16a50" stroke-width="2" stroke-dasharray="5 5"');s+=txt(252,458,'compute needs communication.',22,'stroke="none"');return svg(s,'0 0 730 490','Eight GPU racks linked by communication paths. Data, tensor, pipeline, and optimizer-state parallelism divide different parts of the training workload.');}
export function serving(){let s=box(180,163,400,80,12,'#d6ccb8');s+=rack(225,30,palette.blue);s+=rack(300,62,palette.green);s+=box(425,135,78,48,70,palette.yellow);s+=path('M390 160l60 25v34l-60-25z','fill="#e8eddc"');s+=txt(400,188,'next?',17,'stroke="none"');s+=paper(500,170,14,palette.paper);s+=person(126,222,palette.violet);s+=txt(190,302,'the weights stay. the tokens move.',24,'stroke="none"');return svg(s,'0 0 650 340','At inference the server reuses fixed model weights and cached attention keys and values while it generates new tokens.');}
