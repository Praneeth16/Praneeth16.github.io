// A compressed slice through an elevated railway, an arts boulevard and a book street.
import { Geometry } from './render.js';

export const stops = [
  { id:'metro', x:-38, y:-43, z:22 },
  { id:'bookshop', x:-20, y:13, z:19 },
  { id:'boulevard', x:35, y:-29, z:9 },
  { id:'church-street', x:21, y:34, z:4 },
];

const steel='#577776', glass='#547986', ink='#354548', cream='#e5d8af';
const books=['#db9a55','#a64c55','#4c817e','#d5b451','#6b6384','#7c9e85','#c56750','#86abc2'];
const granite=['#b39d90','#c6b2a4','#b6aaa2','#cebaae','#c0a89d'];

function rect(s,x,y,z,w,d,color) {
  s.face([[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],color,false);
}
function front(s,x,y,z,w,h,color) {
  s.face([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h],[x-w/2,y,z+h]],color,false);
}
const letters={
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['111','100','100','100','111'],
  D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],
  G:['111','100','101','101','111'],K:['101','110','100','110','101'],M:['101','111','111','101','101'],
  O:['111','101','101','101','111'],R:['110','101','110','101','101'],S:['111','100','111','001','111'],
  T:['111','010','010','010','010'],
};
function lettering(s,word,x,y,z,unit,color){
  let left=x-(word.length*4-1)*unit/2;
  for(const char of word){
    const glyph=letters[char];
    if(glyph)glyph.forEach((row,r)=>[...row].forEach((on,c)=>{
      if(on==='1')front(s,left+(c+.5)*unit,y,z+(4-r)*unit,unit,unit,color);
    }));
    left+=4*unit;
  }
}
function railings(s,x0,x1,y,z,high=1.2){
  for(let x=x0;x<=x1;x+=2.5)s.line([[x,y,z],[x,y,z+high]],steel,1);
  s.line([[x0,y,z+high],[x1,y,z+high]],ink,1);
  s.line([[x0,y,z+high*.45],[x1,y,z+high*.45]],steel,.6);
}
function viaduct(s) {
  const y=-43;
  for(let x=-63;x<72;x+=18) {
    s.box(x,y,.12,3.3,2.6,8.8,'#a6a398');
    // Flared hammerhead over each single concrete pier.
    for(const side of [-1,1]) {
      s.face([[x-1.7,y+side*1.3,8.8],[x+1.7,y+side*1.3,8.8],
        [x+3.3,y+side*3.7,11],[x-3.3,y+side*3.7,11]],'#b9b8a9');
    }
    s.box(x,y,10.75,6.5,7.6,.8,'#aaa89c');
  }
  s.box(0,y,11.5,144,8.7,1.22,'#b2b0a5');
  s.box(0,y,12.72,144,9,.3,'#c8c8b7');
  rect(s,0,y,13.04,144,7.9,'#817f72');
  for(let x=-71;x<72;x+=1.45)rect(s,x,y,13.065,.3,6.5,'#9b9587');
  for(const dy of [-2.45,-1.15,1.15,2.45])s.box(0,y+dy,13.09,144,.115,.17,'#a5a7a0');
  for(const side of [-1,1])s.box(0,y+side*4.22,13,144,.31,.62,'#c5c4b7');
}
function station(s,x,y) {
  const roofWidth=35,roofDepth=14;
  railings(s,x-17,x+17,y-6.75,13.74,.9);
  for(const side of [-1,1]){
    s.box(x,y+side*5.55,12.68,roofWidth,2.7,1.04,'#ddc9a3');
    rect(s,x,y+side*4.4,13.75,roofWidth,.25,'#e3ac46');
    for(let k=-15;k<=15;k+=6){
      s.box(x+k,y+side*5.9,13.72,.48,.52,5.65,'#759795');
      if(k%2!==0)s.line([[x+k-2,y+side*5.9,19.1],[x+k,y+side*5.9,17.2],[x+k+2,y+side*5.9,19.1]],steel);
    }
  }
  // Individual roof panels leave the barrel-vault profile legible from either end.
  const curve=Array.from({length:11},(_,i)=>{
    const a=i*Math.PI/10;return [y-Math.cos(a)*roofDepth/2,18.75+Math.sin(a)*3.15];
  });
  for(let i=0;i<curve.length-1;i++){
    const [a,z]=curve[i],[b,v]=curve[i+1];
    s.face([[x-roofWidth/2,a,z],[x+roofWidth/2,a,z],[x+roofWidth/2,b,v],[x-roofWidth/2,b,v]],
      ['#9bb5ad','#b9c6b7','#aabeb4'][i%3],false);
  }
  for(let k=-17.5;k<=17.5;k+=3.5)s.line(curve.map(([yy,z])=>[x+k,yy,z+.035]),'#849e94');
  s.box(x,y+6.95,16.65,22,.22,2.9,'#475a63');
  lettering(s,'MG ROAD',x,y+7.08,17.03,.4,'#f0e2b4');
  // Public stair, tactile landing and handrails down to the boulevard.
  const stairY=y+9;
  for(let k=0;k<20;k++)s.box(x-20+k*.84,stairY,.2,.85,2.65,(k+1)*.66,'#b7aaa0');
  for(const sy of [-1.35,1.35])s.line([[x-20.4,stairY+sy,1.6],[x-3.5,stairY+sy,15]],steel,1.4);
  s.box(x-2.35,stairY,12.56,3.1,3.1,1.02,'#c4b6a0');
}
function streetTree(s,x,y,sz,season,i){
  s.box(x,y,.08,3.4,3.4,.3,'#997e67');
  s.box(x,y,.39,3,3,.14,'#7d8064');
  s.frustum(x,y,.53,.46,.28,sz*.65,'#795e49',7);
  const colors=season==='rain'?['#4e8066','#6e9274','#528465']:
    season==='dry'?['#a5a263','#839559','#a4a76a']:['#638664','#82a26c','#91a66d'];
  for(let j=0;j<3;j++){
    const a=j*2.095+i;
    s.ellipsoid(x+Math.cos(a)*sz*.19,y+Math.sin(a)*sz*.17,sz*(.63+j*.095),
      sz*.28,sz*.26,sz*.23,colors[j]);
  }
}
function tiledStreet(s){
  rect(s,0,34,.09,144,23,'#a7907f');
  for(let ix=0;ix<48;ix++)for(let iy=0;iy<7;iy++){
    const x=-70.5+3*ix,y=25+3*iy;
    rect(s,x,y,.11,2.95,2.95,granite[(ix*7+iy*3+Math.floor(ix/5))%granite.length]);
  }
  // Four-colour stepped lozenges echo the street's Kasuti-inspired granite paving.
  for(let x=-65;x<=66;x+=13){
    for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){
      const ring=Math.abs(row)+Math.abs(col);
      if(ring>3)continue;
      rect(s,x+col*1.18,34+row*1.18,.145,1.16,1.16,
        ['#a65c40','#edc99f','#6e665d','#eee0c4'][ring]);
    }
  }
  for(const yy of [23.1,44.6])rect(s,0,yy,.15,144,.42,'#907a62');
}
function shopWindow(s,x,y,z,w,h) {
  front(s,x,y,z,w,h,'#eee1bf');
  front(s,x,y+.04,z+.19,w-.45,h-.43,glass);
  for(const side of [-1,1])front(s,x+side*w*.22,y+.07,z+.32,w*.32,h-.76,'#6e9096');
  s.line([[x-w*.1,y+.09,z+.5],[x+w*.18,y+.09,z+h-.6]],'#a6b5ac');
  s.box(x,y+.15,z-.16,w+.45,.55,.23,'#d2be95');
}
function awning(s,x,y,z,w,stripes,colors){
  for(let k=0;k<stripes;k++){
    const l=x-w/2+k*w/stripes,r=l+w/stripes,p=colors[k%2];
    s.face([[l,y,z],[r,y,z],[r,y+2.15,z-.8],[l,y+2.15,z-.8]],p,false);
    front(s,(l+r)/2,y+2.18,z-1.25,r-l,.45,p);
  }
  for(const end of [-1,1])s.line([[x+end*w*.47,y,z-1.85],[x+end*w*.47,y+2,z-.82]],steel);
}
function rooftop(s,x,y,z,w,d){
  s.box(x,y,z,w+.45,d+.45,.35,'#d6c6aa');
  for(const off of [-1,1]) {
    s.box(x,y+off*d*.48,z+.35,w,.28,.65,'#d6c6aa');
    s.box(x+off*w*.48,y,z+.35,.28,d,.65,'#d6c6aa');
  }
  const tx=x+w*.26,ty=y-d*.21;
  s.box(tx,ty,z+.35,2.75,2.75,.5,'#b2a18b');
  s.frustum(tx,ty,z+.85,1.22,1.22,2.12,'#555954',8);
  for(const dz of [1.04,1.72,2.48])s.frustum(tx,ty,z+dz,1.27,1.27,.1,'#666b60',8);
  s.box(x-w*.23,y,z+.35,w*.27,d*.32,1.95,'#c3b59c');
}
function shop(s,x,y,w,d,h,body,trim,sign,index){
  const fy=y+d/2;
  s.box(x,y,.2,w,d,h,body);
  for(let floor=6.2;floor<h-2;floor+=4.1){
    const count=Math.max(2,Math.floor(w/4.8));
    for(let j=0;j<count;j++)shopWindow(s,x+(j+.5)*w/count-w/2,fy+.05,floor,w/count*.65,2.4);
    s.box(x,fy+.16,floor-.34,w+.26,.47,.26,trim);
    for(const side of [-1,1]){
      const xx=x+side*(w/2+.025);
      for(let k=0;k<2;k++)
        s.face([[xx,y+(k-.75)*d*.41,floor],[xx,y+(k-.25)*d*.41,floor],
          [xx,y+(k-.25)*d*.41,floor+2],[xx,y+(k-.75)*d*.41,floor+2]],glass,false);
    }
  }
  front(s,x,fy+.035,.53,w-.75,3.65,ink);
  for(let j=0;j<3;j++)shopWindow(s,x+(j-1)*w*.295,fy+.09,.65,w*.26,2.85);
  s.box(x,fy+.31,4.12,w-.42,.59,1.62,trim);
  if(sign)lettering(s,sign,x,fy+.62,4.37,.22,cream);
  awning(s,x,fy+.05,3.93,w-.8,9,[trim,cream]);
  rooftop(s,x,y,h+.2,w,d);
  if(index%2===0){
    const ax=x+w*.40;
    s.box(ax,fy+.54,h-2.55,1.6,.95,1.13,'#c0b9a7');
    for(let i=0;i<4;i++)s.line([[ax-.55,fy+1.04,h-2.38+i*.16],[ax+.55,fy+1.04,h-2.38+i*.16]],steel);
  }
}
function bookRows(s,x,y,z,width,levels,seed) {
  const n=Math.round(width/.35);
  front(s,x,y,z,width,levels*.95,'#533d34');
  for(let j=0;j<levels;j++){
    for(let k=0;k<n;k++){
      const pos=x-width/2+(k+.5)*width/n,h=.49+(.1*((k*3+j+seed)%4));
      front(s,pos,y+.06,z+j*.95+.1,width/n*.84,h,books[(k+3*j+seed)%books.length]);
      if(k%4===0)front(s,pos,y+.08,z+j*.95+.17,width/n*.6,.09,cream);
    }
    s.box(x,y+.12,z+j*.95,width+.2,.45,.12,'#ad805b');
  }
}
function bookshop(s,x,y){
  shop(s,x,y-1.5,22,16,13.7,'#dfb873','#45746d','',0);
  const fy=y+6.5;
  s.box(x,fy+.34,4.7,19,.7,2.68,'#38685f');
  lettering(s,'BOOKS',x,fy+.71,5.08,.39,'#fae1aa');
  for(const side of [-1,1])bookRows(s,x+side*6.9,fy+.73,.54,4.9,3,side+5);
  s.box(x,fy+.82,.37,3.3,1.55,.28,'#ab8773');
  for(let k=0;k<2;k++){
    const bx=x+(k?5.7:-6),by=fy+3.5;
    s.box(bx,by,.14,4.65,1.75,1.15,'#7c5746');
    for(let j=0;j<5;j++){
      const xx=bx+(j-2)*.78;
      for(let stack=0;stack<2+(j%2);stack++){
        s.box(xx,by+.13,1.29+stack*.21,.65,1.12,.16,'#e4d2b1');
        rect(s,xx,by+.13,1.46+stack*.21,.69,1.17,books[(j+k*3+stack)%8]);
      }
    }
  }
  // Oversized projecting book sign, drawn in section so its pages show from the street.
  const sx=x+10.8;
  s.box(sx,fy+1.3,8.3,.29,2.6,.22,ink);
  s.box(sx,fy+2.38,5.45,.64,1.72,2.85,'#e4d1a5');
  for(const side of [-1,1])s.box(sx+side*.36,fy+2.38,5.4,.09,1.89,2.94,'#b34d43');
  for(let z=5.7;z<8.2;z+=.38)s.line([[sx-.21,fy+3.25,z],[sx+.22,fy+3.25,z]],'#aa9577');
}
function gallery(s,x,y){
  s.box(x,y,.2,36,6.6,4.2,'#d2ac8c');
  s.box(x,y,4.4,36.6,7.1,.42,'#c6b29b');
  for(let i=0;i<7;i++){
    const bx=x+(i-3)*4.85,fy=y+3.34;
    front(s,bx,fy,.65,4.48,3.2,'#e4d1a8');
    front(s,bx,fy+.04,.92,3.97,2.64,books[(i+5)%8]);
    // Original gouache-like landscape triptychs.
    s.face([[bx-1.94,fy+.08,1.01],[bx+1.93,fy+.08,1.01],[bx-.44,fy+.08,2.68]],books[(i+1)%8],false);
    s.face([[bx-.76,fy+.1,1.02],[bx+1.9,fy+.1,1.02],[bx+1.11,fy+.1,2.23]],'#e6bd85',false);
  }
  for(let i=0;i<3;i++){
    const x0=x-15+i*11.7;
    s.box(x0,y+5.8,.29,4,.78,.53,'#ae8060');
    s.box(x0,y+6.16,.81,4,.16,.68,'#b98b68');
  }
  const top=6.7;
  for(let k=-15;k<=15;k+=5){
    s.box(x+k,y+3.8,.3,.28,.29,top,steel);
    s.line([[x+k,y+3.8,top],[x+k,y-2.7,top+.72]],steel,1.1);
  }
  for(const dy of [-2.7,1,3.8])s.box(x,y+dy,top+.19,32,.26,.22,steel);
}
function streetFeature(s,x,y) {
  // This section owns part of the paving as well as its street furniture, so taps
  // on the textile-inspired geometry select the field note.
  for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
    const r=Math.abs(i)+Math.abs(j);
    if(r>4)continue;
    rect(s,x+i*.93,y+j*.93,.18,.91,.91,['#b56242','#e7c493','#675e58','#eedab5','#9a7161'][r]);
  }
  for(const xx of [x-5,x+5]){
    s.frustum(xx,y+8,.1,.23,.18,1.25,'#655f58',6);
    s.frustum(xx,y+8,1.06,.21,.21,.19,'#cbb681',6);
  }
  s.box(x+7,y+7,.14,.26,.25,3.95,ink);
  s.box(x+7,y+7,3.62,4.4,.24,.92,'#397667');
  front(s,x+7,y+7.14,3.99,3.48,.12,'#e9debf');
}
function scooter(s,x,y,c){
  for(const dx of [-.7,.72]){
    s.frustum(x+dx,y,.11,.27,.29,.38,ink,6);
  }
  s.box(x,y,.42,1.65,.64,.37,c);
  s.box(x-.34,y,.79,.83,.57,.2,ink);
  s.line([[x+.63,y,.7],[x+.5,y,1.42],[x+.25,y,1.45]],steel,1);
}
function treePlanter(s,x,y,i,season){
  streetTree(s,x,y,7.2+(i%3),season,i);
  for(const side of [-1,1])s.box(x+side*2.1,y,.23,.29,3.8,.39,'#a68d71');
}
function terrace(s,x,y,variant){
  for(let k=0;k<2;k++){
    const sx=x+k*4.8;
    s.frustum(sx,y,.07,.14,.14,2.95,ink,6);
    const cover=variant?'#c77654':'#ca9d52';
    s.frustum(sx,y,2.76,1.95,.12,.7,cover,8);
    s.frustum(sx,y,.96,1.08,1.08,.15,'#a88060',8);
    for(const side of [-1,1]){
      s.box(sx+side*1.5,y,.12,.63,.75,.55,'#71918a');
      s.box(sx+side*1.78,y,.64,.13,.77,.65,'#71918a');
    }
  }
}
function pitchedRoof(s,x,y,z,w,d) {
  const l=x-w/2,r=x+w/2,f=y+d/2,b=y-d/2;
  s.face([[l,f,z],[r,f,z],[r-2,y,z+2.9],[l+2,y,z+2.9]],'#af6953',false);
  s.face([[l,b,z],[r,b,z],[r-2,y,z+2.9],[l+2,y,z+2.9]],'#ad765d',false);
  s.face([[r,f,z],[r,b,z],[r-2,y,z+2.9]],'#915d4b');
  s.face([[l,f,z],[l,b,z],[l+2,y,z+2.9]],'#945e4b');
  for(let k=0;k<14;k++){
    const a=(k+.5)/14;
    s.line([[l+a*w,f,z+.025],[l+2+a*(w-4),y,z+2.925]],'#9b614b',.5);
  }
}
function upperBalcony(s,x,y,z,w) {
  s.box(x,y,z,w,2.2,.36,'#b6a88c');
  s.box(x,y+1,z+.36,w,.13,.28,'#839486');
  railings(s,x-w/2,x+w/2,y+1,z+.64,.86);
  for(const side of [-1,1]){
    const xx=x+side*w*.36;
    s.box(xx,y+.42,z+.36,1.82,.8,.6,'#a87659');
    s.ellipsoid(xx,y+.42,z+1.25,1.03,.45,.58,'#789368');
  }
}
function paperStall(s,x,y,n) {
  // Pavement prints, displayed on trestles below a patchwork cloth.
  s.box(x,y,.12,5.5,2.15,1.32,'#92694d');
  for(const side of [-1,1])s.box(x+side*2.56,y,1.34,.14,.14,2.25,ink);
  awning(s,x,y-.75,3.55,6.5,7,[n===1?'#8b7696':'#427e83','#ddc99e']);
  for(let i=0;i<6;i++){
    const xx=x-2.19+i*.88;
    s.box(xx,y+.18,1.45,.8,1.22,.24,'#e0ceac');
    rect(s,xx,y+.18,1.71,.72,1.09,books[(n+i)%8]);
  }
  for(let k=0;k<2;k++){
    const xx=x-2.35+k*4.7;
    s.face([[xx-.57,y+1.65,.24],[xx+.57,y+1.65,.24],[xx+.57,y+.94,1.55],[xx-.57,y+.94,1.55]],cream);
    s.face([[xx-.43,y+1.54,.43],[xx+.4,y+1.54,.43],[xx+.31,y+1.09,1.28]],books[(n+k*3)%8],false);
  }
}
function streetscapeDetails(s) {
  pitchedRoof(s,-62,11.5,11.6,14,16);
  pitchedRoof(s,37.2,11.1,10.65,17.6,16.4);
  for(const z of [6,10.15,14.3])upperBalcony(s,-47,19.55,z,12.9);
  upperBalcony(s,19.4,19.6,10.05,10.7);
  // A stepped corner fin and sunburst make the mint-and-cream cafe stand out.
  for(let j=0;j<3;j++){
    s.box(63.2+j*.88,18.2,13.6,.65,1.4,4.6+j*.83,'#dbc197');
    s.box(63.2+j*.88,18.2,18.2+j*.83,.85,1.62,.27,'#ece0bc');
  }
  for(const z of [7.1,7.74,8.35])s.box(62,19.15,z,10.2,.39,.22,'#e9d7ab');
  // Mural wrapped around a street-facing end wall.
  const xx=9.99;
  for(let i=0;i<6;i++){
    const yy=4.05+i*2.55;
    s.face([[xx,yy,.86],[xx,yy+2.25,.86],[xx,yy+2.25,7.18],[xx,yy,4.9]],
      books[(i+3)%8],false);
  }
  for(const [x,y,w,base] of [[-46,19.32,13,12.1],[36.2,19.25,13.5,6.95]]){
    s.line([[x-w/2,y,base],[x,y+.35,base-.95],[x+w/2,y,base]],ink);
    for(let k=0;k<8;k++){
      const f=(k+.5)/8,xx=x-w/2+f*w;
      const zz=base-.9*(1-Math.abs(2*f-1));
      s.face([[xx-.41,y+.37,zz],[xx+.41,y+.37,zz],[xx,y+.4,zz-.8]],books[(k+2)%8],false);
    }
  }
  // A low, stepped outdoor performance court beneath the tracks.
  for(let j=0;j<3;j++) {
    const width=16.5-j*2;
    s.box(-2,-34+j*.8,.14,width,.85,(j+1)*.41,'#b4836e');
  }
  for(let i=0;i<5;i++){
    const x=-18+i*6;
    s.box(x,-36,.12,.28,.28,4.75,steel);
    s.box(x,-38.4,4.85,.28,5.3,.23,steel);
  }
  for(let j=0;j<3;j++)s.box(-6,-40.8+j*2.25,5.06,25,.24,.25,'#b98964');
}

export function buildDistrict({ ground,landscape,season }){
  rect(ground,0,0,.055,144,112,'#c9b99c');
  rect(ground,0,-43,.07,144,23,'#acb199');
  rect(ground,0,-13.1,.08,144,17,'#96968a');
  rect(ground,0,-13.1,.1,144,13,'#777a76');
  for(let x=-69;x<70;x+=9)rect(ground,x,-13.1,.12,3.55,.19,'#dccca8');
  for(const x of [-62,59])for(let i=-4;i<=4;i++)rect(ground,x,-13.1+i*1.22,.13,1.75,.65,'#d4c9bb');
  tiledStreet(ground);
  const s=landscape;
  viaduct(s);
  // Rooftops, roller awnings and side lanes make a continuous urban block.
  const row=[
    [-62,11.5,13,15,10.6,'#bc816a','#5e7c78','CAFE'],
    [-47,12,14,14,17.4,'#a8bab0','#a25e4d',''],
    [1.6,11.2,16.9,15.8,10.6,'#c57f65','#597d7c',''],
    [19.4,10.9,15.8,16,13.4,'#b6c3b1','#786585',''],
    [37.2,11.1,17,16,9.7,'#dabd89','#a15842','CAFE'],
    [58,12,19.7,14.1,15.7,'#c3afa2','#4f7371',''],
  ];
  row.forEach((v,i)=>shop(s,...v,i));
  streetscapeDetails(s);
  for(const [x,w,h] of [[-61,14,6.7],[-42,15,7.9],[36,15,6.4],[54,16,7.7]]){
    shop(s,x,-1.8,w,6.05,h,'#c0ac92','#8e725d','',1);
  }
  for(let k=0;k<6;k++){
    const x=-58+k*15;
    s.box(x,-27,.14,9.6,3.2,.55,'#9b8d6b');
    s.box(x,-27,.69,9.1,2.77,.34,'#719665');
  }
  for(const [i,[x,y]] of [[-64,-25],[-45,-25],[-18,-25],[4,-26],[12,-45],[60,-31],
    [-63,46],[-38,43],[6,44],[48,43],[68,22],[-34,2]].entries())treePlanter(s,x,y,i,season);
  for(let i=0;i<8;i++){
    const x=-62+i*16.5;
    s.frustum(x,-21.45,.16,.17,.13,5.55,'#726d62',6);
    s.line([[x,-21.45,5.6],[x,-20.3,6.15],[x,-19.36,6.15]],ink,1.15);
    s.box(x,-19.28,6.01,.62,.9,.2,'#c1b697');
  }
  for(let i=0;i<8;i++)scooter(s,-52+i*2.7,24.3,['#768a91','#be805d','#7d6a76'][i%3]);
  for(let k=0;k<5;k++) {
    const x=-60+k*29;
    if(k===1||k===3)paperStall(s,x+1,49.1,k);
    else terrace(s,x,49.1,k%2);
    rect(ground,x+2,49.2,.1,10,6.25,'#bd9d85');
    for(const sign of [-1,1]){
      s.frustum(x+sign*5,49.3,.11,.6,.77,.86,'#af7155',7);
      s.ellipsoid(x+sign*5,49.3,1.37,.85,.7,.65,'#749267');
    }
  }
  for(let x=-69;x<70;x+=11.5)s.frustum(x,43.3,.15,.21,.19,1.15,'#776f63',6);
}
export function buildStop(s,id,x,y){
  if(id==='metro')station(s,x,y);
  if(id==='bookshop')bookshop(s,x,y);
  if(id==='boulevard')gallery(s,x,y);
  if(id==='church-street')streetFeature(s,x,y);
}
function person(s,x,y,t,coat,rain){
  const gait=Math.sin(t)*.33;
  s.line([[x-gait,y-.13,.21],[x,y-.13,1]],ink,1);
  s.line([[x+gait,y+.13,.21],[x,y+.13,1]],ink,1);
  s.frustum(x,y,.92,.31,.25,.72,coat,6);
  s.frustum(x,y,1.65,.2,.21,.37,'#9e7255',7);
  s.frustum(x,y,1.96,.22,.18,.13,'#55463b',7);
  if(rain){
    s.line([[x+.25,y,1.26],[x+.25,y,2.35]],ink);
    s.frustum(x+.25,y,2.25,.83,.12,.36,coat,8);
  }
}
function coach(s,x,y,dir,end){
  s.box(x,y,13.47,9.75,2.7,.63,'#586267');
  s.box(x,y,14.1,10.16,2.96,2.43,'#e4e0cd');
  s.box(x,y,16.53,10.14,2.87,.26,'#b1b9ad');
  s.box(x-.6,y,16.79,4.5,1.88,.25,'#949f96');
  for(const side of [-1,1]){
    const sy=y+side*1.5;
    front(s,x,sy,14.44,10.12,.57,'#835884');
    front(s,x,sy+side*.015,15.26,9.85,1.02,'#435e64');
    for(let i=0;i<5;i++){
      const xx=x-3.92+i*1.96;
      front(s,xx,sy+side*.03,15.4,1.42,.7,'#7197a1');
      s.line([[xx+.79,sy+side*.05,14.23],[xx+.79,sy+side*.05,16.34]],'#838c86');
    }
  }
  if(end){
    const xx=x+dir*5.1;
    s.face([[xx,y-1.25,15.36],[xx,y+1.25,15.36],[xx,y+.95,16.38],[xx,y-.95,16.38]],ink,false);
    for(const side of [-1,1])s.line([[xx,y+side*.91,14.85],[xx,y+side*1.19,14.85]],cream,1.1);
  }
}
function car(s,x,y,color) {
  s.box(x,y,.4,3.8,1.55,.8,color);
  s.box(x-.15,y,1.2,2.15,1.39,.59,'#6a8890');
  s.box(x-.16,y,1.78,2.05,1.4,.11,color);
  for(const sign of [-1,1])s.box(x+sign*1.19,y,.22,.62,1.57,.36,ink);
}
export function movingDistrict(t,season){
  const s=new Geometry();
  // Slow reversals keep the complete train visible within the miniature.
  const phase=(t%48)/48, center=42*Math.sin(phase*Math.PI*2+.45),dir=Math.cos(phase*Math.PI*2+.45)>=0?1:-1;
  for(let i=-1;i<=1;i++)coach(s,center+i*10.46,-41.15, i===0?dir:Math.sign(i),i!==0);
  for(let i=0;i<5;i++){
    const x=((t*(i%2?3.6:4.35)+i*27)%151)-75;
    if(Math.abs(x)<69.9)car(s,i%2?-x:x,i%2?-15.8:-10.4,['#a47867','#b8b78f','#587c86','#c49d64','#739a93'][i]);
  }
  for(let i=0;i<11;i++){
    const phase=(t*(.62+i*.025)+i*14)%270;
    const x=phase>135?202.5-phase:phase-67.5;
    person(s,x,i<7?30+i%3*3:-24.5,t*3.1+i,books[i%8],season==='rain'&&i%2===0);
  }
  return s;
}
