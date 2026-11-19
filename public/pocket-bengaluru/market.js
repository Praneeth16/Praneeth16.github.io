// A compressed study of the old Pete. The heritage frontage faces the flower
// lane; the shop row and loading yard are representative market street scenes.
import { Geometry } from './render.js';

export const stops = [
  {id:'market-hall',x:-31,y:-34,z:24},
  {id:'flower-lane',x:-30,y:8,z:7},
  {id:'avenue-shops',x:42,y:-30,z:16},
  {id:'produce-yard',x:42,y:14,z:9},
];

const tau=Math.PI*2;
const brick='#ad4941', red='#953833', cream='#f1d9aa', tile='#a95039';
const cloth=['#187b7c','#d66b40','#f3c564','#4e869f','#b44762','#729267'];
const flowers=['#fc9c19','#f6d02e','#cb386e','#ffead0','#f37826','#e28da7'];
const veg=['#8bb242','#e27244','#995486','#b6c75d','#d99144','#437b47'];
const shirts=['#e8dabe','#a86172','#578d86','#c59c4f','#526f94','#af6748'];
function face(s,pts,colour){s.face(pts,colour,false);}
function flat(s,x,y,w,d,z,colour){
  face(s,[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],colour);
}
function front(s,x,y,z,w,h,color) {
  face(s,[[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h],[x-w/2,y,z+h]],color);
}
function disc(s,x,y,z,r,color,n=12){
  face(s,Array.from({length:n},(_,i)=>[x+r*Math.cos(i*tau/n),y,z+r*Math.sin(i*tau/n)]),color);
}
function hood(s,x,y,z,w,d,c) {
  const h=.8;
  face(s,[[x-w/2,y-d/2,z+h],[x+w/2,y-d/2,z+h],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],c);
  front(s,x,y+d/2,z-.36,w,.36,c);
}
function arch(s,x,y,z,w,h,colour){
  const r=w/2, spring=z+h-r;
  const pts=[[x-r,y,z],[x+r,y,z],[x+r,y,spring]];
  for(let k=1;k<=10;k++)pts.push([x+r*Math.cos(k*Math.PI/10),y,spring+r*Math.sin(k*Math.PI/10)]);
  face(s,pts,colour);
}
function portal(s,x,y,z,w,h,glaze){
  arch(s,x,y,z,w,h,cream);
  arch(s,x,y+.055,z,w-.9,h-.48,glaze);
  front(s,x,y+.08,z,w-.94,.21,'#ad7a54');
  const r=w/2,spring=z+h-r;
  for(let k=1;k<9;k++){
    const a=k*Math.PI/9;
    s.line([[x+Math.cos(a)*(r-.44),y+.095,spring+Math.sin(a)*(r-.44)],[x+Math.cos(a)*r,y+.095,spring+Math.sin(a)*r]],'#ba8e65');
  }
  s.line([[x,y+.105,z],[x,y+.105,spring+.1]],'#8f7962',.7);
}
function pyramid(s,x,y,z,w,d,h,colors){
  const p=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]];
  for(let i=0;i<4;i++)s.poly([p[i],p[(i+1)%4],[x,y,z+h]],colors[i%colors.length]);
}
function pitched(s,x,y,z,w,d,rise,c){
  const l=x-w/2,r=x+w/2,b=y-d/2,f=y+d/2;
  s.poly([[l,b,z],[r,b,z],[r,y,z+rise],[l,y,z+rise]],c);
  s.poly([[l,y,z+rise],[r,y,z+rise],[r,f,z],[l,f,z]],c);
  s.poly([[r,b,z],[r,f,z],[r,y,z+rise]],'#b1876a');
  s.poly([[l,b,z],[l,y,z+rise],[l,f,z]],'#b1876a');
}
const letters={
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],
  C:['011','100','100','100','011'],D:['110','101','101','101','110'],
  E:['111','100','110','100','111'],H:['101','101','111','101','101'],
  I:['111','010','010','010','111'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],
  M:['10001','11011','10101','10001','10001'],N:['1001','1101','1011','1001','1001'],
  O:['010','101','101','101','010'],P:['110','101','110','100','100'],R:['110','101','110','101','101'],
  S:['011','100','010','001','110'],T:['111','010','010','010','010'],W:['10101','10101','10101','01010','01010'],
  Y:['101','101','010','010','010'],' ':['0','0','0','0','0'],
};
function sign(s,x,y,z,text,width,height,bg,ink){
  front(s,x,y,z,width,height,bg);
  const glyphs=[...text].map(c=>letters[c]);
  const count=glyphs.reduce((n,g)=>n+g[0].length+1,-1);
  const pixel=Math.min((height*.77)/5,(width*.91)/count);
  let pen=x-count*pixel/2;
  for(const glyph of glyphs){
    glyph.forEach((row,j)=>{
      for(const match of row.matchAll(/1+/g)){
        const w=match[0].length*pixel;
        front(s,pen+match.index*pixel+w/2,y+.05,z+(height+5*pixel)/2-(j+1)*pixel,w,pixel,ink);
      }
    });
    pen+=(glyph[0].length+1)*pixel;
  }
}
function marketHall(s,x,y){
  // The tiled gateway and rose windows stand in front of long covered sheds.
  for(let i=0;i<3;i++){
    const cy=y-8.4+i*6.6;
    s.box(x,cy,.16,71,6.7,6.15,'#bd825c');
    pitched(s,x,cy,6.32,71.6,7.35,2.05,i%2?'#b36549':'#b65a41');
    for(let xx=x-34;xx<=x+35;xx+=3.35)s.line([[xx,cy,8.45],[xx,cy+3.67,6.36]],'#cb8560',.7);
  }
  const fy=y+8.15;
  s.box(x,y+5.2,.16,73,6,9.3,brick);
  s.box(x,y+5.2,9.44,73.4,6.5,.5,cream);
  s.box(x,y+6.2,9.95,73,3.4,.68,red);
  for(let i=-6;i<=6;i++){
    if(i===0||Math.abs(i)===5)continue;
    const bx=x+i*5.55;
    portal(s,bx,fy+.09,.28,4.4,6.3,'#3d4541');
    front(s,bx,fy+.12,7,3.8,.34,cream);
    for(let k=0;k<3;k++)front(s,bx-1.3+k*1.3,fy+.13,7.64,.65,.9,'#694d46');
  }
  for(const side of [-1,1]){
    const tx=x+side*27.75;
    s.box(tx,y+5.8,.14,6.7,7.4,12.3,brick);
    portal(s,tx,y+9.57,.33,4.65,6.75,'#34423f');
    s.box(tx,y+5.8,7.45,7.1,7.7,.44,cream);
    disc(s,tx,y+9.58,10.25,1.58,cream);
    disc(s,tx,y+9.64,10.25,1.23,'#434c47');
    for(let a=0;a<8;a++)s.line([[tx,y+9.7,10.25],[tx+1.19*Math.cos(a*tau/8),y+9.7,10.25+1.19*Math.sin(a*tau/8)]],cream,.65);
    s.box(tx,y+5.8,12.42,7.5,8,.58,cream);
    pyramid(s,tx,y+5.8,13,7.75,8.25,5.8,[tile,'#b06043']);
    s.frustum(tx,y+5.8,18.8,.22,.035,1.22,'#745840',5);
  }
  const gy=y+10.3;
  s.box(x,y+6,.14,10.2,8.6,12.5,brick);
  portal(s,x,gy+.06,.22,7.3,8.23,'#302f32');
  sign(s,x,gy+.12,8.85,'K R MARKET',9.65,1.65,cream,'#714b3c');
  s.poly([[x-5.1,gy,12.64],[x+5.1,gy,12.64],[x,gy,15.9]],brick);
  s.box(x, y+5.5,12.44,4.2,4.4,5.02,brick);
  disc(s,x,y+7.75,15.85,1.48,cream);
  disc(s,x,y+7.81,15.85,1.19,'#f7eac9');
  s.line([[x-.64,y+7.88,16.24],[x,y+7.88,15.85],[x+.08,y+7.88,16.74]],'#53473d',1.4);
  s.box(x,y+5.5,17.46,4.65,4.85,.52,cream);
  pyramid(s,x,y+5.5,17.98,4.8,5,3.45,[tile,'#ba6648']);
  s.frustum(x,y+5.5,21.43,.24,.03,1.0,'#83673b',6);
}
function awning(s,x,y,z,w,d,base,accent){
  for(let j=0;j<8;j++){
    const sx=x-w/2+(j+.5)*w/8;
    hood(s,sx,y,z,w/8+.015,d,j%4===0?accent:base);
  }
  for(const dx of [-w/2+.22,w/2-.22]){
    s.line([[x+dx,y+d/2,.22],[x+dx,y+d/2,z]],'#675345',1);
  }
}
function wheel(s,x,y,z,r){
  disc(s,x,y,z,r,'#404944',9);
  disc(s,x,y+.025,z,r*.67,'#bba588',9);
  s.line([[x-r*.67,y+.06,z],[x+r*.67,y+.06,z]],'#585b4c');
  s.line([[x,y+.06,z-r*.67],[x,y+.06,z+r*.67]],'#585b4c');
}
function cart(s,x,y,flowersOnBoard=false){
  for(const side of [-1,1])for(const dx of [-1.57,1.57])wheel(s,x+dx,y+side*.99,.97,.89);
  s.box(x,y,1.32,4.8,2.18,.36,'#926c44');
  for(const dx of [-.55,.55])s.line([[x+2.2,y+dx,1.53],[x+3.8,y+dx,1.72]],'#705439',1.25);
  if(flowersOnBoard)for(let i=0;i<3;i++)basket(s,x-1.36+i*1.31,y,1.69,.63,flowers[i]);
}
function basket(s,x,y,z,r,heaps){
  s.frustum(x,y,z,r*.68,r,.52*r,'#ab7c4b',7);
  s.frustum(x,y,z+.52*r,r,r*.96,.16*r,'#c39a64',7);
  s.frustum(x,y,z+.68*r,r*.86,r*.4,.65*r,heaps,7);
  s.frustum(x-.13*r,y+.14*r,z+1.3*r,r*.43,.16*r,.16*r,heaps,5);
  // Individual flower heads emerge from the heap at close zoom.
  if(r>.75){
    const hi=({'#fc9c19':'#ffcf4c','#f6d02e':'#ffea70','#cb386e':'#ed7296','#ffead0':'#fff7e8','#f37826':'#ffae50','#e28da7':'#f5b9ce'})[heaps]||heaps;
    for(let k=0;k<21;k++){
      const a=k*2.39996,rad=Math.sqrt((k+.4)/21)*r*.82;
      const px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad,pz=z+r*(1.52-.8*(rad/r)**1.55);
      const h=r*.12;
      s.face([[px-h,py,pz],[px,py-h,pz+h*.22],[px+h,py,pz],[px,py+h,pz]],k%3===0?hi:heaps,false,1);
    }
  }
}
function figure(s,x,y,color,step=0,load=false){
  const skin='#a66d49';
  s.line([[x-.44*step,y+.18,.2],[x-.15,y+.13,1.02],[x,y,1.26],[x+.44*step,y-.17,.18]],'#43494b',1.4);
  s.frustum(x,y,1.06,.38,.45,.94,color,6);
  s.frustum(x,y,2.02,.28,.31,.51,skin,7);
  s.frustum(x,y,2.52,.33,.22,.17,'#4e433a',7);
  const hand=load?2.66:1.2;
  s.line([[x-.35,y,1.96],[x-.56,y+.1,1.55],[x-.45,y+.25,hand]],skin,1);
  if(load)basket(s,x,y,2.69,.77,'#efa52d');
}
function umbrella(s,x,y,z,r,c,alt){
  s.frustum(x,y,.1,.1,.09,z+.37,'#736040',5);
  const crown=[x,y,z+.75];
  for(let j=0;j<8;j++){
    const a=tau*j/8,b=tau*(j+1)/8;
    s.poly([crown,[x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z]],j%2?alt:c);
  }
}
function garlands(s,x,y,z,w){
  for(let i=0;i<7;i++) {
    const px=x-w*.46+i*w*.146,drop=1.15+(i%3)*.29;
    const hue=flowers[(i+1)%flowers.length];
    s.line([[px,y,z],[px+.1,y+.02,z-drop*.7],[px+.44,y+.04,z-drop],[px+.75,y,z-drop*.75],[px+.85,y,z]],hue,2.15);
  }
}
function flowerLane(s,x,y){
  const tarps=['#30878c','#ad5363','#357ba1','#d07a49'];
  for(let row=0;row<2;row++){
    const cy=y-10+row*13;
    for(let i=0;i<6;i++){
      const cx=x+(i-2.5)*10.85;
      s.box(cx,cy+1,.12,8.35,3.1,.56,'#9b7850');
      if((row+i)%3!==0){
        awning(s,cx,cy-2.0,4.5,9.35,4.3,tarps[(i+row*2)%4], '#e8cfa8');
        garlands(s,cx,cy+.18,4.05,8.3);
      }else{
        umbrella(s,cx-2.45,cy-1.62,4.25,2.9,i%2?'#b74943':'#cc9152','#e7c16c');
      }
      for(let k=0;k<5;k++)basket(s,cx-3.3+k*1.64,cy+1.52,.7,.78,flowers[(i+row*2+k)%6]);
      for(let k=0;k<3;k++)basket(s,cx-2.82+k*2.7,cy+4.05,.15,1.18,flowers[(i+k*2+row)%6]);
      figure(s,cx+2.75,cy-.8,shirts[(i+row)%6]);
    }
  }
  // Buyers move between the ground-level flower heaps and shaded counters.
  for(let i=0;i<18;i++){
    const xx=x-29+(i*9.73)%61, yy=y+(i%2?-3.3:10.2)+(i%3)*.37;
    figure(s,xx,yy,shirts[(i+3)%6],Math.sin(i*2),i%7===0);
  }
  for(let i=0;i<6;i++){
    const xx=x-26.8+i*9.7,yy=y+14.6+(i%2)*1.7;
    flat(s,xx,yy,6.6,3.15,.18,['#e4c498','#9888a0','#80a291'][i%3]);
    for(let j=0;j<3;j++)basket(s,xx+(j-1)*1.76,yy,.21,.81,flowers[(i*2+j)%6]);
  }
}
function shutter(s,x,y,z,w,h,c){
  front(s,x,y,z,w,h,'#4d514b');
  front(s,x,y+.04,z+.09,w-.3,h-.42,c);
  for(let k=0;k<5;k++)s.line([[x-w*.45,y+.08,z+.4+k*h/6],[x+w*.45,y+.08,z+.4+k*h/6]],'#798781');
}
function upperWindow(s,x,y,z,w,h,frame){
  front(s,x,y,z,w,h,frame);
  front(s,x,y+.035,z+.16,w-.45,h-.35,'#39595b');
  s.line([[x,y+.09,z+.18],[x,y+.09,z+h-.19]],'#97a59a');
}
function shop(s,x,y,w,h,c,i,label) {
  const depth=12.4,frontY=y+depth/2+.04;
  const accent=cloth[i%cloth.length];
  s.box(x,y,.18,w,depth,h,c);
  s.box(x,y,h+.18,w+.32,depth+.29,.46,'#d7be9a');
  if(i%3===0){
    pitched(s,x,y,h+.65,w+.4,depth+.5,1.9,'#a8664b');
  }else{
    s.box(x,y-depth/2+.29,h+.64,w,.55,.8,c);
    s.box(x-w/2+.25,y,h+.64,.5,depth,.8,c);
    s.frustum(x+.19*w,y-2,h+.8,1.15,1.12,1.78,'#49514e',8);
    s.frustum(x+.19*w,y-2,h+2.58,1.17,1,.18,'#616865',8);
    for(let j=0;j<3;j++)s.line([[x-w*.4,y-4+j*1.38,h+.85],[x-w*.21,y-4+j*1.38,h+.85]],'#827f69');
  }
  const wy=frontY+.03;
  for(let j=0;j<2;j++)upperWindow(s,x+(j-.5)*w*.4,wy,h-3.7,w*.25,2.6,'#d9c89e');
  if(i%2===0){
    s.box(x,wy+.47,h-4.1,w*.85,1.17,.3,'#c8b49b');
    s.line([[x-w*.4,wy+1.06,h-2.65],[x+w*.4,wy+1.06,h-2.65]],'#59675c');
    for(let j=0;j<6;j++)s.line([[x+w*(j/6-.4),wy+1.06,h-4],[x+w*(j/6-.4),wy+1.06,h-2.65]],'#59675c');
  }
  front(s,x,wy,.22,w-.68,4.4,'#404d48');
  sign(s,x,wy+.06,4.42,label,w-.71,1.63,accent,'#fff0bd');
  if(i%4===1)shutter(s,x-w*.21,wy+.12,.27,w*.35,3.65,'#78928a');
  else for(let j=0;j<4;j++) {
    const bx=x-w*.34+j*w*.19;
    for(let k=0;k<3;k++)front(s,bx,wy+.1,.45+k*.62,w*.15,.42,cloth[(j+i+k)%6]);
  }
  awning(s,x,wy+1.7,3.65,w-.15,3.3,accent,'#f0d5a4');
}
function shopRow(s,x,y) {
  const hues=['#d3a25e','#8fae9b','#be8374','#d9b688','#91a8af','#dbab78'];
  const names=['BOOKS','SILKS','PAPER','TEA','DYES','SILKS'];
  for(let i=0;i<6;i++){
    const w=8.45,xx=x+(i-2.5)*w;
    shop(s,xx,y-13,w,11.7+(i*2%5),hues[(i+2)%6],i+2,names[(i+2)%6]);
    shop(s,xx,y+7,w,8.0+(i*3%5),hues[i],i,names[i]);
  }
  // Overhead service wires span the lane, sagging between the rooftop poles.
  for(const xx of [x-23,x-3,x+22]){
    s.frustum(xx,y-3,.14,.17,.13,8.8,'#6d6153',5);
    s.line([[xx-.85,y-3,8.4],[xx+.85,y-3,8.4]],'#6d6153',1.2);
  }
  for(const shift of [-.6,.6])for(const [a,b] of [[-23,-3],[-3,22]]){
    s.line([[x+a+shift,y-3,8.55],[x+(a+b)/2+shift,y-2.83,7.15],[x+b+shift,y-3,8.55]],'#615e57',.6);
  }
}
function crate(s,x,y,z,hue,loaded=true){
  const w=1.85,d=1.4,h=.94;
  s.box(x,y,z,w,d,h,hue);
  for(const side of [-1,1]){
    const yy=y+side*(d/2+.025);
    for(let j=0;j<2;j++)front(s,x,yy,z+.28+j*.27,w*.76,.11,'#714f38');
  }
  if(loaded){
    flat(s,x,y,w*.84,d*.79,z+h+.025,'#7d623b');
    for(let j=0;j<4;j++){
      const xx=x+((j%2)-.5)*.68,yy=y+((j>>1)-.5)*.45;
      s.frustum(xx,yy,z+h+.04,.29,.18,.24,veg[(Math.floor(Math.abs(x+y))+j)%6],5);
    }
  }
}
function truck(s,x,y) {
  s.box(x+.65,y,.68,6.85,2.75,.63,'#515c59');
  s.box(x+.02,y,1.28,5.2,2.75,.32,'#af8550');
  for(const side of [-1,1]){
    for(const xx of [x-1.68,x+2.75])wheel(s,xx,y+side*1.44,.8,.72);
    s.box(x+.04,y+side*1.31,1.58,5.22,.13,1.02,'#669174');
  }
  s.box(x+3.42,y,1.3,1.68,2.79,1.98,'#dba641');
  s.box(x+3.42,y,3.28,1.83,2.93,.2,'#e3c687');
  front(s,x+3.48,y+1.41,2.4,1.2,.7,'#638384');
  for(let i=0;i<2;i++)crate(s,x-1.28+i*2.09,y,1.62,'#c88c51');
}
function produceYard(s,x,y){
  // An open loading court, tarpaulin-covered sorting counters and stacked boxes.
  for(let i=0;i<3;i++){
    const xx=x+(i-1)*12.6;
    s.box(xx,y-7,.18,11.6,6.4,3.8,['#b29171','#c79a6d','#a2a88f'][i]);
    front(s,xx,y-3.76,.5,8.9,2.9,'#4e5b50');
    pitched(s,xx,y-6.1,4.05,12.25,9.2,1.38,['#698a8d','#7c9688','#707b91'][i]);
    for(let k=0;k<6;k++)s.line([[xx-5+k*2,y-6.1,5.44],[xx-5+k*2,y-1.5,4.07]],'#9ba8a0');
    for(let j=0;j<3;j++)crate(s,xx-3+j*2.35,y-2.1,.21,['#b58456','#a08e60','#ba8456'][j]);
  }
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
    const xx=x-19.4+col*4.7,yy=y+2.0+row*5.0;
    const c=['#d09452','#ab8c58','#ac7552'][(row+col)%3];
    crate(s,xx,yy,.19,c);
    crate(s,xx+1.98,yy,.19,c);
    if((col+row)%2===0)crate(s,xx+.76,yy,1.15,c);
    basket(s,xx+.02,yy+1.82,.19,.8,veg[(col+row*2)%6]);
  }
  truck(s,x+14.4,y+9.1);
  truck(s,x+14.4,y+2.8);
  for(const [dx,dy] of [[-17,16],[-4,14],[8,-2],[19,16],[-8,1]])figure(s,x+dx,y+dy,shirts[Math.abs(dx)%6],.55);
  cart(s,x+6,y+14,true);
}
export function buildStop(mesh,id,x,y){
  const builds={'market-hall':marketHall,'flower-lane':flowerLane,'avenue-shops':shopRow,'produce-yard':produceYard};
  if(!builds[id])throw new RangeError('Unknown market stop '+id);
  builds[id](mesh,x,y);
}
function teaCart(s,x,y){
  cart(s,x,y,false);
  s.box(x,y,1.68,3.5,1.7,.77,'#53827a');
  s.frustum(x+.55,y,2.47,.49,.38,.85,'#bcb5a0',9);
  s.frustum(x-1.01,y,2.47,.23,.19,.38,'#b9c3ac',6);
  awning(s,x,y,4.15,4.6,2.44,'#bd694b','#e5bb77');
}
function tree(s,x,y,h){
  s.frustum(x,y,.16,.55,.31,h*.78,'#78654c',7);
  for(const [a,dx,dy] of [[.84,-1.36,.02],[.78,.73,1.24],[.87,.63,-1.42]])
    s.ellipsoid(x+dx,y+dy,h*a,2.5,2.22,1.6,dx<0?'#577b56':'#738d5d');
}
export function buildDistrict({ground,landscape,season}){
  // One broad carriageway serves market deliveries. Two service lanes let
  // the animated porters travel between the wholesale bays and the shops.
  flat(ground,0,0,144,111.97,.015,'#c2aa89');
  flat(ground,0,42.4,144,15,.035,'#aa9d88');
  flat(ground,0,42.4,144,11,.05,season==='rain'?'#677675':'#767c75');
  flat(ground,10.4,-9.9,7.8,91.8,.065,'#8b8880');
  flat(ground,0,-11.5,144,7.6,.077,'#928a7b');
  flat(ground,-30.8,1.0,72,2.0,.093,'#b99775');
  for(let x=-69;x<72;x+=8.3){
    flat(ground,x,42.4,3.6,.23,.095,'#d8cba7');
    flat(ground,x,34.7,3.5,.52,.1,Math.round(x)%2?'#c7ac76':'#8d7860');
  }
  for(let k=0;k<8;k++)flat(ground,10.4,37.8+k*1.13,4.7,.48,.14,'#dacfb4');
  for(let i=0;i<37;i++){
    const x=-68+(i*29.75)%135,y=-53+(i*17.93)%105;
    if(Math.abs(y-42)<7)continue;
    ground.line([[x,y,.1],[x+.95,y+.02,.11],[x+1.63,y+.25,.1]],'#a38f73',.55);
  }
  for(const [x,y] of [[-65,30],[-7,29],[68,31],[-61,-21],[-62,51],[31,51],[66,-50]])tree(landscape,x,y,7+Math.abs(x)%3);
  for(const [x,y] of [[-55,31],[-2,-16],[58,34],[-35,51]]){
    teaCart(landscape,x,y);
    figure(landscape,x+3.7,y,shirts[Math.abs(x)%6]);
  }
  for(const [x,y] of [[-44,30],[0,33],[26,33],[59,-9],[-64,-15],[-28,51],[-50,51],[39,51]])cart(landscape,x,y,Math.abs(x)%3!==0);
  for(let i=0;i<6;i++){
    const x=-53+i*23.1;
    landscape.frustum(x,48.9,.15,.17,.13,6.2,'#57675d',5);
    landscape.line([[x,48.9,6.35],[x,47.7,7.1],[x,46.55,7.1]],'#57675d',1);
    landscape.box(x,46.45,6.93,.48,.72,.18,'#ddcf96');
  }
}
function cargoAuto(s,x,y,dir){
  s.box(x-dir*.68,y,.72,2.4,1.67,.72,'#62805d');
  s.box(x+dir*.94,y,.73,1.25,1.62,.7,'#317459');
  s.box(x+dir*.94,y,1.92,1.48,1.76,.24,'#edbc51');
  for(const dy of [-.68,.68])s.line([[x+dir*.32,y+dy,1.43],[x+dir*.38,y+dy,1.95],[x+dir*1.4,y+dy,1.95],[x+dir*1.51,y+dy,1.41]],'#77684c');
  for(const xx of [x-dir*1.18,x+dir*1.37])for(const yy of [y-.86,y+.86])wheel(s,xx,yy,.6,.46);
  s.box(x-dir*.81,y,1.45,1.28,1.35,.54,'#ba8654');
}
function ping(t,min,max,speed){
  const span=max-min,phase=(t*speed)%(span*2);
  return min+(phase>span?2*span-phase:phase);
}
export function movingDistrict(t,season){
  const mesh=new Geometry();
  for(let i=0;i<3;i++){
    const dir=i===1?-1:1;
    const x=(((t*(3.5+i*.51)+i*51+32)%155)-77.5)*dir;
    if(Math.abs(x)<69)cargoAuto(mesh,x,42.4-dir*2.56,dir);
  }
  for(let i=0;i<9;i++){
    const cross=i%3===0;
    const x=cross?ping(t+i*35,-63,63,.76):9.1+i%3*1.48;
    const y=cross?(-10.3+i%2*1.2):ping(t+i*14,-48,32,.78);
    figure(mesh,x,y,shirts[i%6],Math.sin(t*3.5+i),i%4===0);
    if(season==='rain'&&i%4===1)umbrella(mesh,x,y,2.75,1.1,cloth[i%6],'#a3bec4');
  }
  const x=ping(t,-58,1,.84);
  cart(mesh,x,31,true);
  figure(mesh,x+4.1,31,'#a76659',Math.sin(t*4));
  return mesh;
}
