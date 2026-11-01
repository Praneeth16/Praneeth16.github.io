/* Sixteen small motion studies. All coordinates use a 480 × 330 drawing sheet.
 * The pictures illustrate mechanisms, not measured model performance.
 * Static paper is cached; only visible canvases are painted by the story controller.
 */
(() => {
  'use strict';
  const W = 480, H = 330, TAU = Math.PI * 2;
  const C = {gold:'#f0c86a', mint:'#91d8be', red:'#f28b90', cream:'#f8efdc', blue:'#92bfdc', violet:'#c5abe0'};
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
  const span = (p,a,b) => smooth((p-a)/(b-a));
  const mix = (a,b,t) => a+(b-a)*t;
  const phase = (t,d) => ((t%d)+d)%d/d;
  const themes = new Map();
  const cues = {
    crawl:['Gather source documents','Filter the incoming stream','Keep useful material'],
    dedup:['Compare document signatures','Merge near-duplicate groups','Keep a varied corpus'],
    bpe:['Start with byte-level pieces','Merge a frequent adjacent pair','Merge again into a token'],
    rope:['Look up token vectors','Rotate projected queries and keys','Compare their relative phase'],
    attention:['Select a query token','Score only its allowed prefix','Mix the corresponding values'],
    mask_bug:['Select an earlier token','A future target crosses the mask','Training receives leaked information'],
    moe:['Score the expert routes','Dispatch to two selected experts','Combine their weighted outputs'],
    parallel:['Partition gradient chunks','Reduce chunks around the ring','Gather the reduced result'],
    nan_bug:['Begin with finite values','Inject numerical instability','Non-finite values propagate'],
    adamw:['Start with finite gradients','Clip norms and update moments','Take an AdamW weight step'],
    base_ckpt:['Collect the learned tensors','Serialize a checkpoint','A base model is ready'],
    sft:['Read the prompt as context','Predict the demonstration response','Apply loss to assistant tokens'],
    reward_bug:['Optimize the proxy reward','The policy exploits the proxy','High reward, poor task result'],
    grpo:['Sample a group of responses','Compare scores within the group','Update with a KL penalty'],
    kv_cache:['Prefill the prompt cache','Read earlier keys and values','Append the new token’s K and V'],
    healthy_end:['Read the conversation','Sample the next token','Stream an answer, then evaluate it']
  };
  const durations = {crawl:9,dedup:9,bpe:10,rope:12,attention:10,mask_bug:9,moe:8,parallel:12,nan_bug:9,adamw:10,base_ckpt:10,sft:11,reward_bug:10,grpo:12,kv_cache:11,healthy_end:12};
  function alpha(ctx,a,fn) { ctx.save(); ctx.globalAlpha*=clamp(a); fn(); ctx.restore(); }
  function path(ctx,pts,color,width=1.5,dash=[]) {
    ctx.save(); ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=width;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.setLineDash(dash);
    pts.forEach((v,i)=> i ? ctx.lineTo(v[0],v[1]) : ctx.moveTo(v[0],v[1]));
    ctx.stroke(); ctx.restore();
  }
  function curve(ctx,a,b,color,width=1.5,bend=0,dash=[]) {
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const cp=[(a[0]+b[0])/2-dy*bend,(a[1]+b[1])/2+dx*bend];
    ctx.save(); ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...cp,...b);
    ctx.lineWidth=width;ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.stroke();ctx.restore();
    return u=>[(1-u)*(1-u)*a[0]+2*(1-u)*u*cp[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*(1-u)*u*cp[1]+u*u*b[1]];
  }
  function box(ctx,x,y,w,h,fill,stroke,r=6) {
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
    if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.4;ctx.stroke();}
  }
  function dot(ctx,x,y,r,color,outline) {
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.strokeStyle=outline;ctx.lineWidth=1.2;ctx.stroke();}
  }
  function halo(ctx,x,y,r,color) {
    ctx.save(); const glow=ctx.createRadialGradient(x,y,1,x,y,r);
    glow.addColorStop(0,color);glow.addColorStop(1,'#0000');ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
  }
  function text(ctx,str,x,y,color=C.cream,size=13,align='left',font='mono') {
    ctx.save();ctx.font=`${size}px ${font==='hand'?'"KevinSans", "Fraunces", serif':'"DM Mono", ui-monospace, monospace'}`;
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore();
  }
  function pill(ctx,str,x,y,color=C.gold,fill='#211e19',width=100) {
    box(ctx,x-width/2,y-12,width,24,fill,color,12);text(ctx,str,x,y,color,11,'center');
  }
  function arrow(ctx,a,b,color,width=1.5) {
    path(ctx,[a,b],color,width); const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
    path(ctx,[[b[0]-7*Math.cos(angle-.5),b[1]-7*Math.sin(angle-.5)],b,[b[0]-7*Math.cos(angle+.5),b[1]-7*Math.sin(angle+.5)]],color,width);
  }
  function movingDot(ctx,point,u,color=C.gold,r=4) {
    if(u<0||u>1)return;
    for(let i=5;i>=0;i--) {const p=point(clamp(u-i*.025));alpha(ctx,(1-i/6)*.65,()=>dot(ctx,...p,r*(1-i*.09),color));}
    dot(ctx,...point(u),r,color);
  }
  function documentCard(ctx,x,y,color=C.cream,mark='web',angle=0,scale=1) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
    ctx.shadowColor='#0005';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
    box(ctx,-20,-26,40,52,color,'#342b25',3);ctx.shadowColor='transparent';
    path(ctx,[[8,-26],[8,-15],[20,-15]],'#342b25',1);
    if(mark==='code') {text(ctx,'</>',0,-2,'#342b25',14,'center');}
    else if(mark==='math') {text(ctx,'∑ x',0,-2,'#342b25',15,'center');}
    else {for(let i=0;i<3;i++)path(ctx,[[-12,-5+i*7],[i===2?5:11,-5+i*7]],'#342b2580',1.4);}
    ctx.restore();
  }
  function chip(ctx,x,y,color=C.gold,label='GPU',active=0) {
    for(let i=0;i<3;i++) {path(ctx,[[x-24,y-7+i*7],[x-19,y-7+i*7]],color,1);path(ctx,[[x+19,y-7+i*7],[x+24,y-7+i*7]],color,1);}
    box(ctx,x-19,y-15,38,30,active?color:'#262d32',color,4);
    text(ctx,label,x,y,active?'#28241c':color,9,'center');
  }
  function check(ctx,x,y,color=C.mint,scale=1) {path(ctx,[[x-5*scale,y],[x-1*scale,y+4*scale],[x+7*scale,y-5*scale]],color,2);}
  function paper(ctx,color) {
    if(!themes.has(color)) {
      const sheet=document.createElement('canvas');sheet.width=W*2;sheet.height=H*2;
      const c=sheet.getContext('2d');c.scale(2,2);c.fillStyle=color;c.fillRect(0,0,W,H);
      const wash=c.createLinearGradient(0,0,W,H);wash.addColorStop(0,'#ffffff08');wash.addColorStop(1,'#00000020');c.fillStyle=wash;c.fillRect(0,0,W,H);
      let seed=91;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<550;i++){c.fillStyle=i%2?'#ffffff0b':'#0000000b';c.fillRect(random()*W,random()*H,.5+random()*1.5,.5+random());}
      for(let i=0;i<45;i++){const x=random()*W,y=random()*H;path(c,[[x,y],[x+4+random()*16,y+random()*2]],i%2?'#ffffff09':'#00000009',.7);}
      themes.set(color,sheet);
    }
    ctx.drawImage(themes.get(color),0,0,W,H);
  }
  function footer(ctx,left,right,ink) {
    path(ctx,[[22,293],[458,293]],ink+'40',.8);
    text(ctx,left,24,310,ink,10);if(right)text(ctx,right,456,310,ink,10,'right');
  }
  function sourceScene(ctx,_p,t,ink) {
    const origins=[[80,65],[240,55],[400,65]],colors=[C.cream,C.mint,C.violet],marks=['web','code','math'];
    origins.forEach(([x,y],i)=>{documentCard(ctx,x+5,y+4,colors[i],marks[i],-.06);documentCard(ctx,x,y,colors[i],marks[i],.04);text(ctx,['WEB','CODE','PAPERS'][i],x,y+40,ink,11,'center');});
    // Source rails converge at a wide, stationary sieve.
    origins.forEach((o,i)=>{const rail=curve(ctx,[o[0],o[1]+28],[240,160],ink+'45',1,.1*(i-1));
      for(let k=0;k<2;k++){const u=phase(t+i*1.1+k*2,5);const xy=rail(smooth(u));alpha(ctx,Math.sin(Math.PI*u),()=>documentCard(ctx,...xy,colors[i],marks[i],Math.sin(u*4)*.14,.38));}});
    ctx.save();ctx.beginPath();ctx.moveTo(142,158);ctx.lineTo(338,158);ctx.lineTo(267,228);ctx.lineTo(213,228);ctx.closePath();ctx.fillStyle=ink+'10';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();ctx.restore();
    for(let i=0;i<9;i++)path(ctx,[[157+i*20,170],[166+i*16,183]],ink+'40',1);
    path(ctx,[[154,183],[326,183]],'#a45b4d',2);
    const reject=curve(ctx,[310,184],[406,208],'#a45b4d80',1.2,-.2,[3,5]);movingDot(ctx,reject,phase(t,4),'#b35c44',3);
    text(ctx,'filter',404,233,ink,11,'center');
    const keep=curve(ctx,[240,228],[240,263],ink+'60',1.4);movingDot(ctx,keep,phase(t+1,2.6),C.gold,4);
    for(let i=2;i>=0;i--)box(ctx,211+i*2,249+i*5,58,16,'#efcc7d',ink,3);
    footer(ctx,'SOURCE MATERIAL','FILTERED CORPUS',ink);
  }
  function dedupScene(ctx,p,_t,ink) {
    const merge=span(p,.23,.62),exit=span(p,.64,.9),fade=1-span(p,.88,1);
    const ys=[76,160,244],signatures=['A7','C4','A7'];
    ys.forEach((y,i)=>{const dup=i!==1; const dst=dup?112:208;
      const x=mix(74,250,merge),yy=mix(y,dst,merge);
      const a=i===2?1-span(p,.43,.64):1;
      alpha(ctx,a*fade,()=>{documentCard(ctx,x,yy,dup?C.cream:C.mint,dup?'web':'math',0,.8);pill(ctx,signatures[i],x,yy+33,dup?C.gold:C.mint,'#19363b',50);});
      curve(ctx,[98,y],[245,dst],ink+'30',1,.12);
    });
    box(ctx,205,45,90,220,null,ink+'40',12);
    const scanY=mix(55,255,span(p,.1,.58));alpha(ctx,Math.sin(Math.PI*span(p,0,.65)),()=>path(ctx,[[210,scanY],[290,scanY]],C.gold,2));
    for(let i=0;i<2;i++){const xy=[mix(250,397,exit),i===0?112:208];alpha(ctx,merge*fade,()=>{documentCard(ctx,...xy,i?C.mint:C.cream,i?'math':'web',0,.85);check(ctx,xy[0]+30,xy[1],C.mint);});}
    text(ctx,'signatures',75,29,ink,11,'center');text(ctx,'group',250,29,ink,11,'center');text(ctx,'keep one',397,29,ink,11,'center');
    footer(ctx,'NEAR-DUPLICATE GROUPS','DIVERSE SOURCES',ink);
  }
  function bpeScene(ctx,p,_t,ink) {
    ctx.save();ctx.strokeStyle=ink+'0c';ctx.lineWidth=.6;for(let x=0;x<W;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.restore();
    const one=span(p,.08,.34),two=span(p,.4,.67),three=span(p,.72,.92);
    const tile=(str,x,y,w,color,a=1)=>alpha(ctx,a,()=>{box(ctx,x-w/2,y-20,w,40,'#17283f',color,6);text(ctx,str,x,y,color,23,'center','hand');});
    ['t','h','e'].forEach((str,i)=>tile(str,150+i*90,63,48,C.cream));
    const a=curve(ctx,[150,86],[195,145],C.mint+'70',1.6,-.12),b=curve(ctx,[240,86],[195,145],C.mint+'70',1.6,.12);
    movingDot(ctx,a,one,C.mint);movingDot(ctx,b,one,C.mint);
    curve(ctx,[330,86],[315,145],C.gold+'70',1.6);tile('th',195,165,82,C.mint,one);tile('e',315,165,48,C.gold,one);
    const c=curve(ctx,[195,187],[240,240],C.mint+'70',1.6,-.12),d=curve(ctx,[315,187],[240,240],C.gold+'70',1.6,.12);
    movingDot(ctx,c,two,C.mint);movingDot(ctx,d,two,C.gold);tile('the',240,259,100,C.gold,two);
    alpha(ctx,three,()=>pill(ctx,'token ID',375,259,C.mint,'#17283f',92));arrow(ctx,[295,259],[322,259],C.mint,1.5);
    text(ctx,'pieces',60,63,ink,11,'center');text(ctx,'merge',62,165,ink,11,'center');text(ctx,'merge',62,259,ink,11,'center');
    footer(ctx,'ILLUSTRATIVE BPE MERGES','t + h → th; th + e → the',ink);
  }
  function ropeScene(ctx,_p,t,ink) {
    const theta=.67+.39*Math.sin(t*TAU/12); const centerY=151;
    [140,340].forEach((x,i)=>{
      const angle=-.4+(i?1:3)*theta;
      path(ctx,[[x-66,centerY],[x+66,centerY]],ink+'30',1);path(ctx,[[x,centerY-66],[x,centerY+66]],ink+'30',1);
      for(let r=23;r<=61;r+=19){ctx.beginPath();ctx.arc(x,centerY,r,0,TAU);ctx.strokeStyle=ink+'25';ctx.lineWidth=1;ctx.stroke();}
      path(ctx,[[x,centerY],[x+55*Math.cos(-.4),centerY-55*Math.sin(.4)]],ink+'55',1,[4,4]);
      ctx.save();ctx.beginPath();ctx.arc(x,centerY,55,-.4,angle);ctx.strokeStyle=(i?C.mint:C.gold)+'60';ctx.lineWidth=5;ctx.stroke();ctx.restore();
      const tip=[x+55*Math.cos(angle),centerY+55*Math.sin(angle)];halo(ctx,...tip,20,(i?C.mint:C.gold)+'38');arrow(ctx,[x,centerY],tip,i?C.mint:C.gold,2.8);dot(ctx,...tip,5,i?C.mint:C.gold,C.cream);
      pill(ctx,i?'K · n = 1':'Q · m = 3',x,46,i?C.mint:C.gold,'#392139',126);
      text(ctx,i?'θ':'3θ',x,235,i?C.mint:C.gold,15,'center');
    });
    const c=curve(ctx,[201,151],[279,151],ink+'60',1.4,.28);movingDot(ctx,c,phase(t,3),C.cream,3);
    pill(ctx,'relative phase = (m − n)θ',240,272,C.cream,'#392139',300);
    footer(ctx,'A PROJECTED Q/K COORDINATE PAIR','RoPE',ink);
  }
  function attentionScene(ctx,p,t,ink,broken) {
    const n=5,cell=34,x0=72,y0=76,row=broken?1:Math.min(4,Math.floor(p*5));
    const labels=['The','cat','sat','on','…'];
    text(ctx,'keys / earlier positions',156,34,ink,12,'center');
    for(let c=0;c<n;c++)text(ctx,labels[c],x0+c*cell+15,60,ink,10,'center');
    for(let r=0;r<n;r++){
      text(ctx,String(r+1),48,y0+r*cell+15,r===row?C.gold:ink,12,'center');
      for(let c=0;c<n;c++){
        const future=c>r,selected=r===row,leak=broken&&selected&&c===4;
        const weight=!future?(1+Math.sin((r+2)*(c+1)*1.3))/2:0;
        box(ctx,x0+c*cell,y0+r*cell,30,30,future?(leak?'#a33b45':'#101925'):(selected?`rgba(240,200,106,${.32+weight*.6})`:'#ffffff13'),selected?C.gold:ink+'35',3);
        if(future&&!leak)path(ctx,[[x0+c*cell+9,y0+r*cell+9],[x0+c*cell+21,y0+r*cell+21]],ink+'35',.9);
        if(leak){halo(ctx,x0+c*cell+15,y0+r*cell+15,25,C.red+'55');dot(ctx,x0+c*cell+15,y0+r*cell+15,4,C.red);}
      }
    }
    arrow(ctx,[23,y0+row*cell+15],[36,y0+row*cell+15],C.gold,2);
    const target=[354,161];
    for(let c=0;c<=row;c++){const start=[x0+c*cell+15,y0+row*cell+15];const rail=curve(ctx,start,target,C.gold+'50',1,-.16-c*.04);movingDot(ctx,rail,phase(t+c*.27,2.2),C.gold,3);}
    if(broken){const rail=curve(ctx,[x0+4*cell+15,y0+row*cell+15],target,C.red,2.3,-.5);movingDot(ctx,rail,phase(t,2.8),C.red,4);pill(ctx,'future leak',355,65,C.red,'#461b26',112);}
    halo(ctx,...target,35,(broken?C.red:C.gold)+'25');dot(ctx,...target,24,'#1a2234',broken?C.red:C.gold);text(ctx,'Σ V',...target,broken?C.red:C.gold,15,'center');
    arrow(ctx,[380,161],[411,161],broken?C.red:C.mint,2);box(ctx,414,142,32,38,broken?'#a33b45':'#41665b',broken?C.red:C.mint,5);
    text(ctx,broken?'leaked':'mixed',430,207,ink,11,'center');
    pill(ctx,broken?'future target is visible':`query ${row+1} reads positions 1…${row+1}`,240,269,broken?C.red:C.gold,'#1a2234',314);
    footer(ctx,broken?'BROKEN CAUSAL MASK':'CAUSAL ATTENTION',broken?'MODELLED FAILURE':'PREFIX ONLY',ink);
  }
  function moeScene(ctx,_p,t,ink) {
    const token=Math.floor(t/8),a=(token*3)%8,b=(a+3)%8;
    const gate=[130,158],out=[413,158];
    for(let i=0;i<8;i++){
      const y=48+i*29,active=i===a||i===b,col=active?C.gold:ink+'35';
      const inRail=curve(ctx,gate,[259,y],col,active?1.9:1,.13*(i-3.5));
      const outRail=curve(ctx,[310,y],out,col,active?1.6:.8,-.08*(i-3.5));
      box(ctx,260,y-10,50,21,active?'#8d6534':'#1d352c',col,4);text(ctx,`E${i+1}`,285,y,active?C.gold:ink+'80',10,'center');
      if(active){movingDot(ctx,inRail,span(phase(t,8),.14,.56),i===a?C.gold:C.mint,3.5);movingDot(ctx,outRail,span(phase(t,8),.55,.91),i===a?C.gold:C.mint,3.5);}
    }
    const rail=curve(ctx,[34,158],[108,158],C.mint,2);movingDot(ctx,rail,span(phase(t,8),0,.2),C.mint,5);
    ctx.beginPath();ctx.moveTo(130,128);ctx.lineTo(160,158);ctx.lineTo(130,188);ctx.lineTo(100,158);ctx.closePath();ctx.fillStyle='#284437';ctx.fill();ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();text(ctx,'gate',130,158,C.gold,12,'center');
    dot(ctx,...out,15,'#2e473b',C.gold);text(ctx,'+',...out,C.gold,18,'center');arrow(ctx,[430,158],[455,158],C.mint,2);
    text(ctx,'token',48,192,ink,11,'center');text(ctx,'8 of 64 shown',285,25,ink,11,'center');text(ctx,'mix',413,198,ink,11,'center');
    footer(ctx,'TWO EXPERTS ACTIVE PER TOKEN','SPARSE FFN',ink);
  }
  function parallelScene(ctx,p,t,ink) {
    const nodes=Array.from({length:8},(_,i)=>[240+153*Math.cos(i*TAU/8-Math.PI/2),158+99*Math.sin(i*TAU/8-Math.PI/2)]);
    const colors=[C.mint,C.gold,C.blue,C.violet];const gather=p>.5; const local=phase(t,6);
    nodes.forEach((a,i)=>{const b=nodes[(i+1)%8];const rail=curve(ctx,a,b,ink+'40',1.5,.05);
      movingDot(ctx,rail,phase(t*.52+i*.125,1),gather?C.gold:colors[i%4],4);
      chip(ctx,...a,C.gold,String(i),gather?span(local,.1,.9)*.8:0);
      for(let k=0;k<3;k++)box(ctx,a[0]-13+k*9,a[1]+20,6,4,gather?C.gold:colors[(i+k)%4],null,1);
    });
    halo(ctx,240,157,63,C.gold+'18');text(ctx,gather?'all-gather':'reduce-scatter',240,145,C.gold,16,'center','hand');
    text(ctx,'gradient chunks',240,172,ink,11,'center');
    for(let k=0;k<8;k++)box(ctx,181+k*15,199,10,5,k<Math.floor(local*9)?C.gold:ink+'25',null,2);
    footer(ctx,'FIXED GPU NODES · MOVING GRADIENTS','RING ALL-REDUCE',ink);
  }
  function nanScene(ctx,p,_t,ink) {
    const points=[[38,97],[75,131],[111,146],[146,159],[182,167],[216,172],[251,177],[285,182],[311,63]];
    path(ctx,[[35,50],[35,252],[324,252]],ink+'70',1.2);text(ctx,'loss',36,30,ink,11);text(ctx,'step',306,270,ink,11);
    path(ctx,points,ink+'22',1.5);const visible=span(p,.02,.63)*(points.length-1),count=Math.floor(visible),frac=visible-count;
    const drawn=points.slice(0,count+1);if(count<points.length-1)drawn.push([mix(points[count][0],points[count+1][0],frac),mix(points[count][1],points[count+1][1],frac)]);
    path(ctx,drawn,p>.48?C.red:C.cream,2.7);
    const tip=drawn[drawn.length-1];if(tip){halo(ctx,...tip,20,C.red+'30');dot(ctx,...tip,4,C.gold);}
    const fault=span(p,.49,.7);alpha(ctx,fault,()=>{pill(ctx,'Inf',313,37,C.gold,'#5b2028',58);path(ctx,[[318,76],[337,92],[328,113],[351,128]],C.red,2);});
    for(let i=0;i<4;i++){const x=368+(i%2)*48,y=147+Math.floor(i/2)*56;const invalid=span(p,.59+i*.055,.72+i*.055);box(ctx,x-20,y-20,42,40,invalid>.5?'#9c3b45':'#3a2a31',invalid>.5?C.red:ink+'55',5);alpha(ctx,invalid,()=>text(ctx,'NaN',x+1,y,C.cream,11,'center'));}
    footer(ctx,'INJECTED NUMERICAL FAILURE','NOT A TRAINING TRACE',ink);
  }
  function adamScene(ctx,p,_t,ink) {
    const clip=span(p,.23,.52),update=span(p,.55,.92);
    text(ctx,'finite gradients',125,32,ink,12,'center');text(ctx,'weight updates',361,32,ink,12,'center');
    path(ctx,[[32,63],[32,230],[210,230]],ink+'50',1);path(ctx,[[268,63],[268,230],[448,230]],ink+'50',1);
    const values=[1.8,.65,1.45,.9,1.65,.5];
    values.forEach((v,i)=>{const norm=Math.hypot(...values);const height=v*75*mix(1,1/norm,clip);box(ctx,47+i*26,228-height,17,height,i%2?C.cream:C.gold,null,3);});
    path(ctx,[[38,153],[207,153]],C.gold,1.5,[4,4]);text(ctx,'norm bound',124,140,C.gold,10,'center');
    // Norm clipping rescales the whole finite gradient, preserving its direction.
    // Bar heights depict components of one vector, all scaled by the same factor.
    const end=update,pts=[];for(let i=0;i<=60;i++){const u=i/60;if(u>end)break;pts.push([278+u*164,79+(1-Math.exp(-u*3))*139]);}
    path(ctx,Array.from({length:61},(_,i)=>[278+i/60*164,79+(1-Math.exp(-i/60*3))*139]),ink+'25',1.5);if(pts.length>1)path(ctx,pts,C.cream,2.5);
    if(pts.length){const pos=pts[pts.length-1];halo(ctx,...pos,18,C.gold+'35');dot(ctx,...pos,4,C.gold);}
    ['m','v'].forEach((label,i)=>{box(ctx,80+i*65,256,44,15,'#713c30',ink+'55',3);box(ctx,82+i*65,258,(40)*span(p,.44,.66),11,i?C.mint:C.gold,null,2);text(ctx,label,72+i*65,264,ink,12,'right');});
    footer(ctx,'CLIP → MOMENTS → ADAMW','ILLUSTRATIVE LOSS',ink);
  }
  function checkpointScene(ctx,p,t,ink) {
    const save=span(p,.26,.84);halo(ctx,243,151,136,'#ffe6a535');
    for(let l=4;l>=0;l--){const x=144+l*4,y=87+l*29;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+111,y-24);ctx.lineTo(x+184,y+9);ctx.lineTo(x+73,y+34);ctx.closePath();ctx.fillStyle=l%2?'#dcb16c':'#eccb89';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.stroke();
      for(let i=0;i<5;i++)path(ctx,[[x+17+i*21,y+7-i*4.5],[x+72+i*21,y+29-i*4.5]],ink+'35',.8);
      alpha(ctx,.25+.6*Math.max(0,1-Math.abs(p*6-l)),()=>path(ctx,[[x,y],[x+111,y-24],[x+184,y+9]],'#fff0b0',2));
    }
    box(ctx,137,245,214,30,'#e8c17b',ink,5);box(ctx,142,250,204*save,20,'#79633c',null,3);
    text(ctx,save>.99?'checkpoint saved':'writing tensors',244,260,save>.99?C.cream:'#fff3d8',12,'center');
    for(let i=0;i<6;i++){const x=67+(i%2)*30,y=95+Math.floor(i/2)*43;alpha(ctx,1-span(p,.5,.9),()=>box(ctx,x,y,19,23,'#eed9a5',ink+'80',2));const rail=curve(ctx,[x+20,y+11],[155,142],ink+'50',1,.15);movingDot(ctx,rail,phase(t+i*.5,4),C.cream,3);}
    footer(ctx,'LEARNED TENSORS','BASE MODEL CHECKPOINT',ink);
  }
  function sftScene(ctx,p,_t,ink) {
    box(ctx,28,40,300,69,'#f8e9e1b0',ink+'80',12);text(ctx,'USER · context only',45,57,'#72535b',10);text(ctx,'Why does rain fall?',45,83,ink,15,'left','hand');
    const reveal=span(p,.26,.72);box(ctx,111,128,341,103,'#f1d78c',ink,12);text(ctx,'ASSISTANT · demonstration',128,146,'#6a4d32',10);
    const lines=['Water droplets grow,','then fall under gravity.'];lines.forEach((str,i)=>{const n=Math.round(str.length*clamp(reveal*2-i*.65));text(ctx,str.slice(0,n),129,175+i*28,ink,14,'left','hand');});
    const loss=span(p,.67,.93);text(ctx,'loss mask',29,263,ink,11);
    for(let i=0;i<10;i++){const active=i>=4;box(ctx,118+i*30,252,23,22,active?'#e8c16a':'#b998a1',ink+'60',3);text(ctx,active?'1':'0',130+i*30,263,active?ink:'#71555d',11,'center');if(active)alpha(ctx,loss,()=>path(ctx,[[118+i*30,280],[140+i*30,280]],'#355b49',2));}
    footer(ctx,'PROMPT: NO DIRECT LOSS','ASSISTANT: LOSS ACTIVE',ink);
  }
  function rewardScene(ctx,p,t,ink) {
    const drift=span(p,.23,.78);
    text(ctx,'proxy reward',87,37,C.gold,12,'center');text(ctx,'task result',388,37,C.red,12,'center');
    for(let i=0;i<5;i++){box(ctx,47+i*17,102-(i+1)*11,10,(i+1)*11,i/5<drift?C.gold:ink+'20',null,2);box(ctx,350+i*17,103-(5-i)*10,10,(5-i)*10,i/5>drift?C.mint:ink+'20',null,2);}
    const ref=[77,217],start=[164,195],end=[362,166];
    dot(ctx,...ref,15,'#29493f',C.mint);text(ctx,'reference',77,251,ink,11,'center');
    path(ctx,[ref,[127,205]],C.gold,1.7,[5,4]);path(ctx,[[140,202],start],drift>.45?C.red:C.gold,1.7,[5,4]);
    if(drift>.45){path(ctx,[[125,196],[135,207],[128,214]],C.red,2);}
    const rail=curve(ctx,start,end,C.red+'60',2,-.32);movingDot(ctx,rail,drift,C.gold,6);
    ctx.save();ctx.translate(...end);ctx.rotate(Math.sin(t*.8)*.12);for(let i=0;i<5;i++){const a=i*TAU/5-Math.PI/2;path(ctx,[[0,0],[Math.cos(a)*30,Math.sin(a)*30]],C.gold,4);}ctx.restore();
    alpha(ctx,span(p,.65,.88),()=>{pill(ctx,'task failed',338,248,C.red,'#461b26',130);path(ctx,[[404,235],[420,251]],C.red,2);path(ctx,[[420,235],[404,251]],C.red,2);});
    footer(ctx,'A MODELLED REWARD EXPLOIT','PROXY ≠ GOAL',ink);
  }
  function grpoScene(ctx,p,_t,ink) {
    const root=[45,153],scores=[-.65,.2,.95,-.3,.45,-.85,.6,-.4],sample=span(p,.02,.34),score=span(p,.35,.65),update=span(p,.67,.93);
    for(let i=0;i<8;i++){
      const y=39+i*30;const color=scores[i]>0?C.mint:C.red;const rail=curve(ctx,root,[259,y],ink+'45',1,.05*(i-3));movingDot(ctx,rail,sample,C.gold,3);
      alpha(ctx,sample,()=>{box(ctx,253,y-8,51,17,'#1c382f',ink+'70',4);for(let k=0;k<3;k++)path(ctx,[[261+k*12,y],[267+k*12,y]],ink+'70',1);});
      path(ctx,[[362,y-10],[362,y+10]],ink+'40',.8);
      alpha(ctx,score,()=>{const len=scores[i]*61;box(ctx,len<0?362+len:362,y-5,Math.max(.1,Math.abs(len)),10,color,null,2);});
    }
    dot(ctx,...root,16,'#254135',C.gold);text(ctx,'π',...root,C.gold,18,'center');text(ctx,'8 rollouts',149,19,ink,11,'center');text(ctx,'relative advantage',360,19,ink,11,'center');
    const feedback=curve(ctx,[425,250],[55,259],C.gold+'70',1.5,-.08,[5,4]);movingDot(ctx,feedback,update,C.gold,4);
    pill(ctx,'KL penalty · reference policy',240,278,C.gold,'#1d3b31',310);
    footer(ctx,'SAMPLE → SCORE → POLICY UPDATE','GRPO EXAMPLE',ink);
  }
  function kvScene(ctx,p,_t,ink) {
    const prefill=span(p,.02,.32),read=span(p,.36,.68),append=span(p,.72,.93);
    const cache=[];
    for(let i=0;i<6;i++){
      const x=48+(i%3)*94,y=118+Math.floor(i/3)*66;cache.push([x+36,y+24]);
      const filled=i<5?clamp(prefill*6-i):append;
      box(ctx,x,y,76,48,'#192e49',ink+'50',6);
      text(ctx,'K',x+8,y+13,C.blue,9);text(ctx,'V',x+8,y+33,C.mint,9);
      for(let k=0;k<4;k++){box(ctx,x+19+k*12,y+7,8,11,k/4<filled?C.blue:ink+'15',null,1);box(ctx,x+19+k*12,y+27,8,11,k/4<filled?C.mint:ink+'15',null,1);}
    }
    const query=[399,83];pill(ctx,'new query',399,49,C.gold,'#1b2c48',110);dot(ctx,...query,15,'#654f34',C.gold);text(ctx,'q',...query,C.gold,16,'center');
    cache.slice(0,5).forEach((pos,i)=>{const rail=curve(ctx,pos,query,C.gold+'36',1,.12);movingDot(ctx,rail,clamp(read*1.3-i*.07),C.gold,3);});
    const write=curve(ctx,query,cache[5],C.mint+'75',1.8,-.22);movingDot(ctx,write,append,C.mint,4);
    for(let i=0;i<5;i++){const x=51+i*35;box(ctx,x,54,27,26,i/5<prefill?C.gold:ink+'15',ink+'40',4);text(ctx,String(i+1),x+13,67,i/5<prefill?'#253855':ink,10,'center');}
    text(ctx,'prompt',48,38,ink,11);text(ctx,'cached prefix',174,269,ink,12,'center');text(ctx,'append',397,244,C.mint,11,'center');
    footer(ctx,'REUSE PROJECTIONS; READ THE PREFIX','PAGED K & V',ink);
  }
  function answerScene(ctx,p,t,ink) {
    box(ctx,30,34,279,53,'#fff9ed',ink+'65',11);text(ctx,'How do LLMs learn?',47,61,ink,16,'left','hand');
    const rail=curve(ctx,[178,88],[236,135],ink+'50',1.6,.1);movingDot(ctx,rail,span(p,.02,.2),'#3c8d6d',4);
    for(let i=2;i>=0;i--)box(ctx,207+i*4,113+i*10,62,39,i%2?'#dec68d':'#f0d896',ink+'85',4);
    ['predict','learn','read'].forEach((label,i)=>{text(ctx,label,355,116+i*22,ink,10);box(ctx,404,110+i*22,[43,26,13][i],10,i===0?'#3c8d6d':'#b7a782',null,2);});
    box(ctx,71,198,358,79,'#fff9ed',ink+'80',12);const reveal=span(p,.24,.88);
    const lines=['By predicting, updating,','and learning from feedback.'];
    lines.forEach((str,i)=>{const n=Math.round(str.length*clamp(reveal*2-i*.8));text(ctx,str.slice(0,n),90,223+i*28,ink,14.5,'left','hand');});
    const out=curve(ctx,[248,176],[248,198],'#3c8d6d',1.6);movingDot(ctx,out,phase(t,1.2),'#3c8d6d',3);
    footer(ctx,'STREAMED TOKENS','EVALUATION STILL MATTERS',ink);
  }
  const painters={crawl:sourceScene,dedup:dedupScene,bpe:bpeScene,rope:ropeScene,attention:(c,p,t,i)=>attentionScene(c,p,t,i,false),mask_bug:(c,p,t,i)=>attentionScene(c,p,t,i,true),moe:moeScene,parallel:parallelScene,nan_bug:nanScene,adamw:adamScene,base_ckpt:checkpointScene,sft:sftScene,reward_bug:rewardScene,grpo:grpoScene,kv_cache:kvScene,healthy_end:answerScene};
  function render(ctx,w,h,state,seconds,reduced=false) {
    const duration=durations[state.artType]||10;
    // A complete, legible mechanism is visible when reduced motion is requested.
    const t=reduced?duration*.72:Math.max(0,seconds),p=phase(t,duration);
    ctx.save();ctx.setTransform(w/W,0,0,h/H,0,0);ctx.clearRect(0,0,W,H);paper(ctx,state.paperBg);
    ctx.lineCap='round';ctx.lineJoin='round';
    // A small quiet border keeps every illustration on the same drawing sheet.
    box(ctx,10,10,460,310,null,state.paperText+'16',9);
    const continuous=['crawl','rope','attention','mask_bug','moe','parallel'].includes(state.artType);
    const loopAlpha=reduced||continuous?1:span(p,0,.025)*(1-span(p,.965,1));
    alpha(ctx,loopAlpha,()=>painters[state.artType]?.(ctx,p,t,state.paperText));
    ctx.restore();
    const index=Math.min(2,Math.floor(p*3));
    return {cue:cues[state.artType]?.[index]||'',phase:index,progress:p};
  }
  window.LLMScenes=Object.freeze({render,cues,durations,types:Object.keys(painters),version:2});
})();
