// Small-scale landscape, street furniture and moving figures for the Cubbon Park model.
// Coordinates are local to the illustrated city block. The boulevard runs east–west.
const palette = {
  road: '#777c77', sidewalk: '#d6c9a9', gravel: '#e5d5b3', gravelEdge: '#bfa780',
  grass: '#a8ba83', flowerSoil: '#a77254', hedge: '#738b5c', iron: '#405951',
};
const tau = Math.PI * 2;
const walkRoute = [[-68,44],[-54,39],[-38,35],[-22,34],[-7,37],[6,43],[20,48],[39,48],[55,44],[68,37]];
const parkAvenue = [[5,-10],[8,-2],[11,5],[13,12],[17,19],[19,27],[17,35],[13,40],[10,45],[7,53]];

function tileRect(scene,x,y,w,d,z,color) {
  scene.poly([[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],color);
}

function oval(scene,x,y,rx,ry,z,color,n=20) {
  scene.poly(Array.from({length:n},(_,i)=>[x+rx*Math.cos(tau*i/n),y+ry*Math.sin(tau*i/n),z]),color);
}

// A continuous ribbon avoids seams between segments of the curved paths.
function ribbon(scene,points,width,z,color) {
  const left=[],right=[];
  points.forEach(([x,y],i)=>{
    const a=points[Math.max(0,i-1)], b=points[Math.min(points.length-1,i+1)];
    const dx=b[0]-a[0],dy=b[1]-a[1], length=Math.hypot(dx,dy);
    const nx=-dy*width/(2*length),ny=dx*width/(2*length);
    left.push([x+nx,y+ny,z]); right.push([x-nx,y-ny,z]);
  });
  for(let i=1;i<left.length;i++) {
    scene.face([left[i-1],left[i],right[i],right[i-1]],color,false,1);
  }
}

function path(scene,points,width) {
  ribbon(scene,points,width+.7,.04,palette.gravelEdge);
  ribbon(scene,points,width,.05,palette.gravel);
}

function ellipseBed(scene,x,y,rx,ry,variation) {
  oval(scene,x,y,rx,ry,.08,'#d0bd94');
  oval(scene,x,y,rx-.45,ry-.45,.09,palette.hedge);
  oval(scene,x,y,rx-.95,ry-.85,.1,palette.flowerSoil);
  const flowers=['#d58375','#e6b879','#c96c65','#dabc8e'];
  for(let i=0;i<10;i++) {
    const t=tau*i/10+variation;
    oval(scene,x+Math.cos(t)*(rx-1.6),y+Math.sin(t)*(ry-1.2),.48,.36,.11,flowers[(i+variation)%flowers.length],6);
  }
  oval(scene,x,y,rx*.31,ry*.28,.12,'#8d9b63',10);
}

function drawGround(scene) {
  // Lawns around the civic buildings and a gravel clearing under the bandstand.
  tileRect(scene,-27,-36,62,31,.01,'#a2b07d');
  tileRect(scene,-27,-35,58,27,.025,'#d6cbaa');
  tileRect(scene,-27,5,52,22,.025,'#d2c09f');
  tileRect(scene,37,28,38,20,.025,'#d3c29f');
  oval(scene,33,-34,12,10.6,.025,'#99af76');
  oval(scene,33,-34,10.4,9,.03,palette.gravel);
  path(scene,walkRoute,2.8);
  path(scene,parkAvenue,2.6);
  path(scene,[[-26,-11],[-26,-5]],3.8);
  path(scene,[[-26,14],[-26,34]],3.8);
  path(scene,[[37,36],[37,48]],3.3);
  path(scene,[[13,12],[25,10],[36,7],[48,5],[58,0],[66,-9]],2.15);
  path(scene,[[13,12],[5,18],[-5,22],[-16,23],[-26,23],[-41,23],[-53,19],[-63,12]],1.9);
  path(scene,[[33,-24],[33,-21]],2.8);
  path(scene,[[42,-35],[48,-36],[54,-40],[60,-45],[64,-54]],1.8);
  for (const x of [-37,-15]) ellipseBed(scene,x,26,5.3,2.9,x===-37?0:1);
  for (const x of [28,46]) ellipseBed(scene,x,42,4.45,2.65,x===28?2:3);
  // Continuous sidewalks, kerbs and a painted two-lane street.
  tileRect(scene,0,-15.5,144,12.8,.13,palette.sidewalk);
  tileRect(scene,0,-15.5,144,8.8,.14,'#9e9e8d');
  tileRect(scene,0,-15.5,144,7.8,.15,palette.road);
  for(let x=-69;x<72;x+=8) {
    if(Math.abs(x-5)<6 || Math.abs(x+55)<5) continue;
    tileRect(scene,x,-15.5,3,.21,.16,'#ded5b2');
  }
  for(const x of [-54,5]) {
    for(let i=-3;i<=3;i++)
      tileRect(scene,x,-15.5+i,2.4,.4,.17,'#e7dfc6');
  }
  // Narrow red bands are the edition's little cutaway of Bengaluru soil.
  for(const [cx,cy,r] of [[-59,30,4.6],[56,12,3.9],[3,-40,4.3],[-58,-45,3.8]])
    oval(scene,cx,cy,r,r*.69,.03,'#9cae7a',12);
}

function tree(scene,x,y,h,variant,flowering,season) {
  const bark='#776447';
  const shades = season==='rain' ? ['#3d7357','#5a8968','#7e9e71'] :
    season==='dry' && variant%3===0 ? ['#ac9155','#c2a368','#cfb579'] :
    flowering && season==='blossom' ? ['#b36e90','#d99ab4','#e4b0c9'] :
    [['#477550','#6a9462','#91a970'],['#46745e','#699378','#89a97f'],['#78905a','#90a66c','#a8b87b']][variant%3];
  scene.frustum(x,y,0,h*.075,h*.047,h*.63,bark,6);
  const spin=variant*.91;
  for(let i=0;i<3;i++) {
    const a=tau*i/3+spin;
    const dx=Math.cos(a)*h*.19,dy=Math.sin(a)*h*.16;
    scene.line([[x,y,h*.37],[x+dx*.46,y+dy*.46,h*.55],[x+dx,y+dy,h*.66]],'#645c46',1.1);
    scene.ellipsoid(x+dx,y+dy,h*(.67+i*.025),h*.265,h*.24,h*(.21+i*.013),shades[i%3]);
  }
  scene.ellipsoid(x+h*.015,y-h*.05,h*.84,h*.235,h*.205,h*.18,shades[1]);
}

function bench(scene,x,y,reverse=false) {
  const back=reverse?-1:1;
  for(const shift of [-.9,.9]) {
    scene.box(x+shift,y,.05,.25,.85,.6,palette.iron);
    scene.box(x+shift,y+back*.4,.5,.18,.16,.95,palette.iron);
  }
  scene.box(x,y,.58,2.55,1,.17,'#a67c53');
  scene.box(x,y+back*.41,1.05,2.55,.17,.32,'#b48d61');
}

function lamp(scene,x,y) {
  scene.frustum(x,y,0,.29,.16,.65,palette.iron,6);
  scene.frustum(x,y,.55,.115,.085,3.75,palette.iron,5);
  scene.frustum(x,y,4.3,.19,.39,.62,'#eee2ad',5);
  scene.frustum(x,y,4.92,.44,.07,.29,palette.iron,5);
}

function kiosk(scene,x,y) {
  scene.box(x,y,0,2.8,1.7,1,'#577a64');
  scene.box(x,y,1,3.1,1.9,.22,'#cfbc8a');
  for(const dx of [-1.23,1.23]) scene.box(x+dx,y,.95,.12,.14,1.65,'#6c6654');
  const colors=['#d18b62','#e5cc98'];
  for(let i=0;i<6;i++) scene.box(x-1.55+i*.62,y,2.56,.62,2.4,.21,colors[i%2]);
}

export function buildPark({ground, object, season}) {
  drawGround(ground);
  // Deliberate gaps in the canopy preserve views of all four buildings from the opening angle.
  const trees=[
    [-66,-43,10],[-56,-50,8],[-8,-52,8.8],[5,-44,10],[14,-50,8],
    [48,-48,9],[64,-39,9.8],[69,-27,7.4],[-65,-26,8],
    [-63,1,10],[-57,13,7.7],[-66,26,9],[-57,33,8.5],
    [-64,47,8],[-49,49,9.7],[-39,44,8],[-18,49,9],[-3,45,7.5],
    [4,24,8.5],[1,3,8],[22,2,6.5],[42,-3,7.8],[59,8,10],[66,19,8.7],
    [63,31,7.7],[58,48,7.6],[19,51,5.9],[0,-27,6.5],[20,-41,6.2],
    [-67,-35,10],[-64,39,8.5],[-47,42,6.6],[-7,47,7.8],[9,-37,9.1],[60,-48,8.8],
    [55,-29,7.4],[61,3,9.6],[64,42,9],[7,30,7.2],[-59,23,6.4],[3,-2,7.9],
  ];
  trees.forEach(([x,y,h],i)=>{
    oval(ground,x+h*.15,y+h*.12,h*.36,h*.22,.18,'#889b70',12);
    object(x,y,scene=>tree(scene,x,y,h*(i%4===0?1.32:1.12),i,[3,10,16,22,30,35].includes(i),season));
  });
  for (const [x,y,reverse] of [[-44,32,true],[-13,36,false],[27,47,true],[47,46,true],[49,5,false],[15,18,false],[46,-32,false],[-57,19,true]])
    object(x,y,s=>bench(s,x,y,reverse));
  for (const [x,y] of [[-62,-21],[-38,-10],[-9,-21],[16,-10],[45,-21],[64,-10],[-23,31],[40,46]])
    object(x,y,s=>lamp(s,x,y));
  object(-59,-8,s=>kiosk(s,-59,-8));
}

function wheel(s,x,y,z,r) {
  const circle=(rr,offset,color)=>{
    s.poly(Array.from({length:10},(_,i)=>[x+rr*Math.cos(i*tau/10),y+offset,z+rr*Math.sin(i*tau/10)]),color);
  };
  circle(r,0,'#3f4844');
  circle(r*.42,.018*Math.sign(y), '#b1ada0');
}

function bus(s,x,y,dir) {
  s.box(x,y,.48,7.7,2.35,2.25,'#7aa4a0');
  s.box(x,y,.53,7.75,2.39,.61,'#497b88');
  s.box(x,y,2.7,7.63,2.32,.18,'#e1d9bb');
  for(const side of [-1,1]) {
    const sy=y+side*1.196;
    for(let i=0;i<5;i++) {
      const sx=x+(i-2)*1.41;
      s.poly([[sx-.56,sy,1.58],[sx+.56,sy,1.58],[sx+.56,sy,2.42],[sx-.56,sy,2.42]],'#425d60');
    }
    for(const a of [-2.42,2.42]) wheel(s,x+a,y+side*1.216,.56,.52);
  }
  for(const sign of [-1,1]){
    const sx=x+sign*3.87;
    s.poly([[sx,y-.95,1.63],[sx,y+.95,1.63],[sx,y+.95,2.47],[sx,y-.95,2.47]],sign===dir?'#47696b':'#668889');
  }
}

function auto(s,x,y,dir) {
  s.box(x,y,.38,2.65,1.36,1,'#327758');
  s.box(x-dir*.21,y,1.36,1.9,1.28,.65,'#d8a740');
  s.box(x-dir*.1,y,1.94,2.39,1.55,.22,'#e7b347');
  for(const side of [-1,1]) {
    const sy=y+side*.65;
    s.poly([[x-dir*1.05,sy,1.19],[x+dir*.5,sy,1.19],[x+dir*.57,sy,1.84],[x-dir*.96,sy,1.84]],'#465a4a');
    wheel(s,x-dir*.84,y+side*.708,.4,.38);
  }
  s.poly([[x+dir*1.17,y-.56,1.28],[x+dir*1.17,y+.56,1.28],[x+dir*.86,y+.56,1.94],[x+dir*.86,y-.56,1.94]],'#596b5c');
  s.box(x+dir*.99,y,.23,.55,.38,.44,'#42473d');
}

function walker(s,x,y,color,phase,angle) {
  const dx=Math.cos(angle),dy=Math.sin(angle),stride=Math.sin(phase)*.26;
  for(const sign of [-1,1]) {
    const hipX=x-dy*sign*.105,hipY=y+dx*sign*.105;
    s.line([[hipX,hipY,.71],[hipX+dx*sign*stride,hipY+dy*sign*stride,.13]],'#4e554a',1.32);
  }
  s.frustum(x,y,.68,.28,.23,.78,color,5);
  s.ellipsoid(x,y,1.68,.215,.215,.245,'#a77351');
}

function pointOnPath(points,distance) {
  const lengths=[];
  for(let i=1;i<points.length;i++) lengths.push(Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const total=lengths.reduce((sum,n)=>sum+n,0);
  let progress=distance%(total*2);
  const reverse=progress>total;
  if(reverse) progress=2*total-progress;
  for(let i=0;i<lengths.length;i++){
    if(progress<=lengths[i] || i===lengths.length-1) {
      const [x,y]=points[i], dx=points[i+1][0]-x,dy=points[i+1][1]-y;
      return {x:x+dx*progress/lengths[i],y:y+dy*progress/lengths[i],angle:Math.atan2(dy,dx)+(reverse?Math.PI:0)};
    }
    progress-=lengths[i];
  }
}

export function movingLife(t) {
  const groups=[];
  // A vehicle spends part of each cycle outside the slice before it re-enters.
  for(const [offset,speed,direction,draw,halfLength] of [[48,3.1,1,bus,3.9],[103,4,1,auto,1.35],[85,3.85,-1,auto,1.35],[8,4.4,-1,auto,1.35]]) {
    const x=(((t*speed+offset)%186)-93)*direction, y=-15.5-direction*1.95;
    if(Math.abs(x)+halfLength<72) groups.push({x,y,build:s=>draw(s,x,y,direction)});
  }
  const colors=['#b26551','#56768a','#b48741','#706b8c','#6e825f','#9e606c'];
  for(let i=0;i<6;i++){
    const route=i%2===0?walkRoute:parkAvenue;
    const {x,y,angle}=pointOnPath(route,t*(.49+i*.055)+i*23+18);
    groups.push({x,y,build:s=>walker(s,x,y,colors[i],t*4.8+i,angle)});
  }
  return groups;
}
