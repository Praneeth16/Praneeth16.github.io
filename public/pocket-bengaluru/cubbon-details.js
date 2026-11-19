// Street-level vignettes in the Cubbon Park miniature. The carts and rugs
// illustrate everyday activities, with their positions composed for the atlas.
import {Geometry} from './render.js';

export const stops = [
  {id:'coffee-cart',x:54,y:-5.4,z:5.2},
  {id:'readers',x:-28,y:44,z:2.8},
];

const TAU = 2*Math.PI;
const ink='#344139', wood='#956643', cream='#f5dfad', steel='#bcc9be';
const skin=['#995f42','#c79166','#955c44','#af7651'];

function oval(mesh,x,y,rx,ry,z,color,n=12){
  const rim=Array.from({length:n},(_,i)=>[x+rx*Math.cos(TAU*i/n),y+ry*Math.sin(TAU*i/n),z]);
  mesh.face(rim,color,false);
}

function rod(mesh,a,b,radius,color,sides=5){
  const v=b.map((n,i)=>n-a[i]);
  const length=Math.hypot(...v);
  if(length===0)return;
  const [dx,dy,dz]=v.map(n=>n/length);
  const horizontal=Math.hypot(dx,dy);
  const u=horizontal?[-dy/horizontal,dx/horizontal,0]:[1,0,0];
  const w=[dy*u[2]-dz*u[1],dz*u[0]-dx*u[2],dx*u[1]-dy*u[0]];
  const ring=p=>Array.from({length:sides},(_,i)=>{
    const c=radius*Math.cos(TAU*i/sides),s=radius*Math.sin(TAU*i/sides);
    return p.map((n,j)=>n+u[j]*c+w[j]*s);
  });
  const low=ring(a), high=ring(b);
  for(let i=0;i<sides;i++){
    const next=(i+1)%sides;
    mesh.face([low[i],low[next],high[next],high[i]],color,false);
  }
}

function wheel(mesh,x,y,z,radius){
  const rim=Array.from({length:14},(_,i)=>[x+radius*Math.cos(TAU*i/14),y,z+radius*Math.sin(TAU*i/14)]);
  mesh.line([...rim,rim[0]],ink,1.85);
  for(let i=0;i<7;i++)mesh.line([rim[i],rim[i+7]],'#8f9d90',.7);
  mesh.box(x,y,z-.09,.2,.21,.18,ink);
}

function canopy(mesh,x,y,top,r,colors){
  const n=8, ring=Array.from({length:n},(_,i)=>[x+r*Math.cos(i*TAU/n),y+r*Math.sin(i*TAU/n),top-r*.32]);
  for(let i=0;i<n;i++){
    const a=ring[i],b=ring[(i+1)%n],col=colors[i%colors.length];
    mesh.poly([[x,y,top],a,b],col);
    mesh.poly([a,b,[(a[0]+b[0])/2,(a[1]+b[1])/2,a[2]-r*.11]],col);
  }
}

function head(mesh,x,y,z,index,s=1){
  mesh.frustum(x,y,z,.23*s,.27*s,.4*s,skin[index%skin.length],7);
  mesh.frustum(x,y,z+.29*s,.28*s,.19*s,.19*s,'#483b32',7);
}
function standing(mesh,x,y,index,shirt,z=0){
  const leg='#4e5652';
  rod(mesh,[x-.16,y,z+.1],[x-.18,y+.07,z+1.06],.108,leg);
  rod(mesh,[x+.16,y-.13,z+.1],[x+.18,y,z+1.06],.108,leg);
  mesh.frustum(x,y,z+.95,.36,.3,.83,shirt,7);
  head(mesh,x,y,z+1.78,index);
  rod(mesh,[x-.32,y,z+1.58],[x-.42,y+.3,z+1.23],.09,shirt);
  rod(mesh,[x+.28,y,z+1.61],[x+.42,y+.22,z+1.24],.09,shirt);
  rod(mesh,[x+.42,y+.22,z+1.24],[x+.29,y+.42,z+1.43],.08,skin[index%4]);
}

function coffeeCart(mesh,x,y){
  oval(mesh,x,y,6.4,3.35,.055,'#c5b49a',20);
  const wheels=[[x-2.45,y+1.02],[x+2.45,y+1.02],[x-2.45,y-1.12],[x+2.45,y-1.12]];
  for(const [wx,wy] of wheels)wheel(mesh,wx,wy,.63,.59);
  mesh.box(x,y,1.05,6,2.15,1.05,'#387776');
  mesh.box(x,y+.02,2.1,6.5,2.56,.18,steel);
  // Ribbed teal panels with a cream enamel stripe and brass tap.
  mesh.box(x,y+1.083,1.78,5.83,.055,.105,'#edca83');
  for(let i=0;i<10;i++)mesh.line([[x-2.76+i*.61,y+1.09,1.12],[x-2.76+i*.61,y+1.09,1.7]],'#225b5e',.75);
  for(const sx of [x-2.92,x+2.92])
    rod(mesh,[sx,y-.88,2.2],[sx,y-.88,4.65],.09,'#84532f');
  // Awning covers the back half only, preserving sight of the serving counter.
  for(let i=0;i<12;i++){
    const l=x-3.38+i*.565,r=l+.565,c=i%2?'#c35037':'#f2c277';
    mesh.poly([[l,y-2.07,4.49],[r,y-2.07,4.49],[r,y-.56,4.85],[l,y-.56,4.85]],c);
    mesh.poly([[l,y-.56,4.85],[r,y-.56,4.85],[r,y+.3,4.37],[l,y+.3,4.37]],c);
    mesh.poly([[l,y+.3,4.37],[r,y+.3,4.37],[r-.07,y+.31,4.13],[l+.07,y+.31,4.13]],c);
  }
  // The two chambers of a brass coffee filter, a broad aluminium idli
  // steamer and a neat row of steel tumblers each have a different silhouette.
  const cx=x-1.94, front=y+.59;
  mesh.frustum(cx,front,2.28,.42,.38,.7,'#b88d52',10);
  mesh.frustum(cx,front,2.98,.47,.46,.64,'#d7a960',10);
  mesh.frustum(cx,front,3.62,.51,.4,.09,'#edc878',10);
  mesh.box(cx+.48,front,2.55,.26,.12,.15,'#595955');
  const potX=x+.05;
  mesh.frustum(potX,front,2.28,.65,.73,.62,'#95aca9',12);
  mesh.frustum(potX,front,2.9,.78,.26,.27,'#d9ddd0',12);
  mesh.frustum(potX,front,3.16,.12,.13,.12,ink,6);
  for(let i=0;i<4;i++){
    const tx=x+1.02+i*.39;
    mesh.frustum(tx,y+.9,2.29,.13,.19,.32,steel,7);
    oval(mesh,tx,y+.9,.132,.132,2.613,'#70492d',7);
  }
  mesh.box(x+1.92,y+.12,2.28,1.65,.68,.055,'#679359');
  for(let i=0;i<3;i++)mesh.frustum(x+1.41+i*.47,y+.12,2.34,.19,.13,.09,'#fff6cf',8);
  standing(mesh,x+1.45,y-1.65,0,'#eeeece');
  standing(mesh,x+2.51,y+2.13,1,'#c67e3f');
  standing(mesh,x-2.32,y+2.36,2,'#637f9b');
  // A small side table and the chalked menu with a painted coffee-cup symbol.
  mesh.box(x-4.23,y,0,1.45,1.45,1.33,wood);
  mesh.box(x-4.23,y,1.33,1.75,1.6,.13,'#dcb581');
  mesh.frustum(x-4.35,y+.1,1.47,.41,.34,.72,'#a7bbaf',9);
  const px=x+4.05,py=y+.61;
  for(const dx of [-.68,.68])rod(mesh,[px+dx,py+.46,.06],[px+dx,py,2.17],.08,wood);
  mesh.box(px,py, .55,1.66,.12,1.55,'#ab754c');
  mesh.box(px,py+.075,.66,1.39,.05,1.32,'#344b43');
  mesh.poly([[px-.32,py+.12,1.52],[px+.23,py+.12,1.52],[px+.15,py+.12,1.18],[px-.25,py+.12,1.18]],cream);
  mesh.line([[px+.22,py+.14,1.47],[px+.42,py+.14,1.45],[px+.36,py+.14,1.28],[px+.21,py+.14,1.28]],cream,.7);
  mesh.line([[px-.4,py+.14,1.08],[px+.42,py+.14,1.08]],cream,.9);
}

function rotatedPoint(x,y,angle,a,b,z){
  return [x+a*Math.cos(angle)-b*Math.sin(angle),y+a*Math.sin(angle)+b*Math.cos(angle),z];
}

function book(mesh,x,y,z,angle,color,size){
  const p=(a,b,zz)=>rotatedPoint(x,y,angle,a*size,b*size,z+zz*size);
  mesh.poly([p(-.64,-.46,.03),p(.64,-.46,.03),p(.64,.46,.03),p(-.64,.46,.03)],color);
  for(const side of [-1,1]){
    mesh.poly([p(0,-.44,.24),p(.58*side,-.44,.09),p(.58*side,.43,.13),p(0,.43,.27)],'#faeac7');
    for(let i=0;i<3;i++){
      const b=-.26+i*.2;
      mesh.line([p(side*.12,b,.24),p(side*.47,b,.141)],'#998f78',.54);
    }
  }
}

function reader(mesh,x,y,angle,index){
  const colors=['#d48955','#54938b','#6175a0','#b66777','#70925d'];
  const p=(a,b,z)=>rotatedPoint(x,y,angle,a,b,z);
  const shirt=colors[index%colors.length], cloth=['#a6594b','#557f85','#876a8f','#8c9c68'][index%4];
  mesh.poly([p(-1.23,-1.05,.106),p(1.23,-1.05,.106),p(1.23,1.4,.106),p(-1.23,1.4,.106)],cloth);
  for(const b of [-.86,-.74,1.16,1.29])mesh.line([p(-1.21,b,.12),p(1.21,b,.12)],cream,.7);
  for(const side of [-1,1]){
    rod(mesh,p(side*.21,-.07,.37),p(side*.56,.56,.25),.17,'#484d57');
    rod(mesh,p(side*.56,.56,.25),p(-side*.1,.77,.22),.13,'#575960');
  }
  mesh.frustum(x,y,.28,.4,.29,.8,shirt,6);
  head(mesh,x,y,1.07,index);
  for(const side of [-1,1]){
    rod(mesh,p(side*.3,.04,.95),p(side*.45,.3,.63),.1,shirt);
    rod(mesh,p(side*.45,.3,.63),p(side*.27,.64,.68),.08,skin[index%4]);
  }
  const pos=p(0,.65,.57);
  book(mesh,...pos,angle,index%2?'#4b6988':'#bc6d49',.85);
  if(index%2===0){
    const [a,b]=p(.78,-.52,0);
    mesh.box(a,b,.17,.56,.4,.48,'#9b663e');
    mesh.line([[a-.12,b,.64],[a-.08,b,.82],[a+.13,b,.82],[a+.16,b,.64]],'#694636',.7);
  }
}

function readingLawn(mesh,x,y){
  for(const [dx,dy,a,i] of [[-4,-.6,-1.35,0],[-1.9,-2.8,-.4,1],[2,-2.4,.7,2],[4.2,.7,1.6,3],[.9,2.3,2.6,4]])
    reader(mesh,x+dx,y+dy,a,i);
  // An open newspaper with two narrow columns and a mustard flask.
  book(mesh,x-2.5,y+1.4,.11,-.15,'#8e8471',1.18);
  mesh.frustum(x-3.82,y+1.65,.11,.18,.16,.56,'#b48a44',8);
  mesh.frustum(x-3.82,y+1.65,.67,.16,.15,.11,'#515b53',8);
  for(let i=0;i<3;i++){
    mesh.box(x+.4+i*.02,y-.26,.09+i*.14,1.22,.84,.14,['#ac594e','#e0b36c','#536b81'][i]);
  }
}

export function buildStop(mesh,id,x,y){
  if(id==='coffee-cart')coffeeCart(mesh,x,y);
  else if(id==='readers')readingLawn(mesh,x,y);
}

function parkGate(mesh,x,y){
  const stone='#bd9279',iron='#38534c';
  for(const dx of [-4.5,4.5]){
    mesh.box(x+dx,y,0,1.65,1.45,.39,'#b2a78f');
    mesh.box(x+dx,y,.39,1.3,1.1,2.72,stone);
    mesh.box(x+dx,y,2.78,1.58,1.38,.23,'#d7b694');
    mesh.frustum(x+dx,y,3.1,.68,.35,.43,'#cfab88',4);
    mesh.frustum(x+dx,y,3.53,.2,.05,.46,'#85765f',6);
  }
  // Receding open iron gate leaves; the opening stays clear.
  for(const side of [-1,1]){
    const start=x+4*side,end=x+1.56*side;
    for(const z of [.5,2.15])mesh.line([[start,y,z],[end,y+2.3,z]],iron,1);
    for(let i=0;i<7;i++){
      const t=i/6,px=start+(end-start)*t,py=y+t*2.3;
      rod(mesh,[px,py,.42],[px,py,2.34+.2*Math.sin(Math.PI*t)],.047,iron,4);
    }
  }
}

function spreadingTree(mesh,x,y,h,season){
  const green=season==='rain'?['#477858','#5e8c6a','#7fa176']:['#638251','#7c995f','#91aa73'];
  const bark='#705c43';
  rod(mesh,[x,y,.05],[x+.37,y-.27,h*.5],h*.054,bark,7);
  for(let i=0;i<5;i++){
    const a=TAU*i/5+.37,dx=Math.cos(a)*h*.34,dy=Math.sin(a)*h*.32;
    rod(mesh,[x+.33,y-.2,h*.38],[x+dx,y+dy,h*.7],h*.031,bark,5);
    mesh.ellipsoid(x+dx,y+dy,h*(.74+.032*(i%2)),h*.31,h*.29,h*.16,green[i%3]);
    mesh.ellipsoid(x+dx*.62,y+dy*.62,h*(.79+.03*(i%3)),h*.215,h*.19,h*.14,green[(i+1)%3]);
  }
  mesh.ellipsoid(x+.3,y-.4,h*.9,h*.31,h*.26,h*.15,green[2]);
}

export function enrichPark({ground,landscape,season}){
  parkGate(landscape,5,-8.18);
  spreadingTree(landscape,-34.8,48.8,9,season);
  spreadingTree(landscape,49.9,-48.6,10.6,season);
  // Dabs of fallen blossoms/leaves near individual crowns, not an even grid.
  for(const [x,y] of [[-56.6,13],[5,-44],[-18,49],[59,8],[-64,39]]){
    for(let i=0;i<22;i++){
      const a=i*2.4,r=1+4.6*Math.sqrt((i+1)/22);
      const px=x+r*Math.cos(a)*1.24,py=y+r*Math.sin(a)*.86;
      const col=season==='rain'?'#728963':season==='dry'?'#ad9764':i%3===0?'#e3b9bb':'#cc94a4';
      oval(ground,px,py,.18+(i%3)*.065,.11+(i%2)*.04,.2,col,5);
    }
  }
  // A few low plantings break up the open lawns without blocking sightlines.
  for(const [x,y] of [[24,-49],[56,-45],[-60,-40],[54,14],[-51,29]]){
    for(let i=0;i<4;i++){
      const dx=(i-1.5)*.85;
      landscape.frustum(x+dx,y+.32*Math.sin(i),0,.66,.38,.6+(i%3)*.15,'#72895a',7);
    }
  }
}

function dogWalker(mesh,t,season){
  // Walk back and forth beside the lawn along the existing curved promenade.
  const cycle=t%72,forward=cycle<36,distance=forward?cycle:72-cycle;
  const x=-46+distance*.82,y=35.1+(x+35)**2*.008;
  const direction=forward?1:-1,gait=Math.sin(t*3.9);
  const z=.12;
  for(const side of [-1,1])
    rod(mesh,[x,y+side*.14,z+.95],[x+direction*gait*side*.29,y+side*.16,z+.075],.105,'#596673');
  mesh.frustum(x,y,z+.91,.33,.28,.72,'#bf7157',6);
  head(mesh,x,y,z+1.62,0);
  const ax=x+direction*.45;
  mesh.line([[x,y+.15,z+1.43],[ax,y+.38,z+1.23]],'#93684d',1.05);
  const dogX=x+direction*1.85,dogY=y+.65;
  mesh.box(dogX,dogY,z+.44,.89,.39,.35,'#ac794a');
  mesh.box(dogX+direction*.44,dogY,z+.67,.37,.37,.33,'#9b6c46');
  mesh.box(dogX+direction*.67,dogY,z+.72,.19,.25,.15,'#dbc095');
  mesh.line([[dogX-direction*.41,dogY,z+.66],[dogX-direction*.71,dogY-.1,z+.97]],'#9c784f',1.25);
  mesh.line([[ax,y+.38,z+1.23],[x+direction*1.07,y+.48,z+.96],[dogX+direction*.18,dogY,z+.75]],'#765e48',.7);
  for(const dx of [-.33,.32])for(const side of [-1,1]){
    const px=dogX+dx,py=dogY+side*.14;
    mesh.line([[px,py,z+.48],[px+gait*side*Math.sign(dx)*.17,py,z+.1]],'#775a40',1.05);
  }
  if(season==='rain'){
    rod(mesh,[ax,y+.27,z+1.17],[ax,y+.27,z+2.67],.04,ink,4);
    canopy(mesh,ax,y+.27,z+2.66,1.04,['#ba7541','#d6924d']);
  }
}

export function movingDetails(t,season){
  const mesh=new Geometry();
  dogWalker(mesh,t,season);
  return mesh;
}
