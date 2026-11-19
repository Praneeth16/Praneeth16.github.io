// All coordinates are local to the building. The entrance looks towards +Y.
function drafter(scene, cx, cy) {
  const place = ([x, y, z]) => [cx + x, cy + y, z];
  return {
    face: (points, color) => scene.poly(points.map(place), color),
    box: (x, y, z, w, d, h, color) => scene.box(cx + x, cy + y, z, w, d, h, color),
    round: (x, y, z, r1, r2, h, color, n = 8) =>
      scene.frustum(cx + x, cy + y, z, r1, r2, h, color, n),
    line: (points, color, width) => scene.line(points.map(place), color, width),
  };
}

// A small physical reveal separates the window faces from the stone behind.
function facade(a, start, end, base, height, count, wall, glass, arched = true) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  const at = (u, z, reveal = 0) => [
    start[0] + dx*u + dy/length*reveal,
    start[1] + dy*u - dx/length*reveal, z,
  ];
  a.face([at(0,base),at(1,base),at(1,base+height),at(0,base+height)],wall);
  const sill = base + height*.14, spring = base + height*(arched ? .64 : .79);
  for (let i=0; i<count; i++) {
    const left=(i+.22)/count, right=(i+.78)/count, middle=(i+.5)/count;
    const points = [[left,sill],[right,sill],[right,spring]];
    if (arched) points.push([(i+.70)/count,spring+.14*height],
      [middle,spring+.19*height],[(i+.30)/count,spring+.14*height]);
    points.push([left,spring]);
    a.face(points.map(([u,z])=>at(u,z,.045)),glass);
  }
}

function hall(a, x, y, w, d, base, h, bays, endBays, wall, glass, arched) {
  const l = x - w/2, r = x + w/2, f = y + d/2, b = y - d/2;
  facade(a, [r, f], [l, f], base, h, bays, wall, glass, arched);
  facade(a, [l, b], [r, b], base, h, bays, wall, glass, arched);
  facade(a, [l, f], [l, b], base, h, endBays, wall, glass, arched);
  facade(a, [r, b], [r, f], base, h, endBays, wall, glass, arched);
  a.face([[l,b,base+h],[r,b,base+h],[r,f,base+h],[l,f,base+h]], wall);
}

function stairs(a, width, farEdge, depth, height, count, color, x = 0) {
  for (let i = 0; i < count; i++) {
    const tread = depth / count;
    a.box(x, farEdge - (i + .5) * tread, 0, width, tread, height*(i+1)/count, color);
  }
}

function hipRoof(a, x, y, eave, width, depth, rise, color) {
  const left = x-width/2, right = x+width/2;
  const back = y-depth/2, front = y+depth/2;
  const ridge = Math.min(depth*.38,width*.3), top = eave+rise;
  const bl=[left,back,eave], br=[right,back,eave], fr=[right,front,eave], fl=[left,front,eave];
  const rl=[left+ridge,y,top], rr=[right-ridge,y,top];
  a.face([bl,br,rr,rl], color);
  a.face([br,fr,rr], color);
  a.face([fr,fl,rl,rr], color);
  a.face([fl,bl,rl], color);
}

function onion(a, x, y, z, radius, height, color, sides) {
  // The shoulder swells above a narrow neck and folds back into the spire.
  const profile = [[.73,0],[1,.18],[1.04,.37],[.92,.56],[.58,.78],[.15,1]];
  for (let i=1; i<profile.length; i++) {
    const [rb,zb]=profile[i-1], [rt,zt]=profile[i];
    a.round(x,y,z+height*zb,radius*rb,radius*rt,height*(zt-zb),color,sides);
  }
  a.round(x,y,z+height,radius*.12,.04,height*.19,'#c29750',6);
}

function vidhanaSoudha(a) {
  const stone='#e6cf9e', trim='#f3e3bd', drum='#cab486', blue='#495e58';
  a.box(0,-.7,0,52,16,1.1,'#af9a78');
  for (const side of [-1,1]) {
    const x=side*15.7;
    hall(a,x,-1.1,18.6,13,1.1,4.1,7,3,stone,blue,true);
    a.box(x,-1.1,5.2,19.1,13.6,.55,trim);
    hall(a,x,-1.1,18.6,13,5.75,3.9,7,3,stone,blue,false);
    a.box(x,-1.1,9.65,19.7,14.1,.65,trim);
    a.box(x,-1.1,10.3,18.7,13.1,.55,drum);
    const tx=side*22.6;
    a.box(tx,-1.1,10.85,5.65,5.65,.62,trim);
    a.round(tx,-1.1,11.47,2.5,2.5,2.2,stone,8);
    a.round(tx,-1.1,13.67,3,2.8,.5,trim,8);
    onion(a,tx,-1.1,14.17,2.45,2.9,'#ded1aa',8);
  }
  hall(a,0,-.6,14.1,15.7,1.1,10.6,5,4,stone,blue,true);
  a.box(0,-.6,11.7,15.3,16.8,.7,trim);
  a.box(0,-.8,12.4,13.0,13.8,1.7,stone);
  a.box(0,-.8,14.1,13.9,14.6,.66,trim);
  a.round(0,-.8,14.76,5.55,5.55,3.65,drum,12);
  a.round(0,-.8,18.41,5.95,5.45,.75,trim,12);
  onion(a,0,-.8,19.16,5.0,6.65,'#e3d5ac',12);
  for (const x of [-5.6,5.6]) {
    for (const y of [-6.0,4.4]) {
      a.round(x,y,14.76,.8,.8,1.3,stone,6);
      onion(a,x,y,16.06,.94,1.32,trim,6);
    }
  }
  stairs(a,15.4,11.4,3.8,2.15,5,'#d9c69e');
  a.box(0,7.05,1.6,14.6,3.25,.65,trim);
  for (const x of [-6.05,-3.64,-1.22,1.22,3.64,6.05]) {
    a.box(x,7.85,2.25,1.0,1.05,.4,trim);
    a.round(x,7.85,2.65,.4,.34,6.55,stone,6);
    a.box(x,7.85,9.2,1.03,1.08,.48,trim);
  }
  a.box(0,7.35,9.68,15.3,3.12,1.25,stone);
  a.box(0,7.35,10.93,16,3.63,.68,trim);
}

function courtPortico(a, x, width, center) {
  const red='#bc5445', trim='#d87560';
  const outer=width/2-.75;
  const floor=center?1.12:.85, top=center?9.3:8.55;
  const f=center?7.55:6.95, b=4.35, columnY=f-.42;
  stairs(a,width+.4,f+.85,1.55,floor,3,'#c59177',x);
  a.box(x,(f+b)/2,0,width,f-b,floor,'#c3735b');
  for (let i=0;i<4;i++) {
    const col=x-outer+i*(2*outer/3);
    a.box(col,columnY,floor,.95,.9,.34,trim);
    a.round(col,columnY,floor+.34,.37,.32,top-floor-.8,red,6);
    a.box(col,columnY,top-.46,1.02,.95,.46,trim);
  }
  a.box(x,(f+b)/2,top,width+.5,f-b+.5,.72,trim);
  const ridge=top+(center?3.4:2.8), eave=top+.72;
  a.face([[x+width/2,f+.25,eave],[x-width/2,f+.25,eave],[x,f+.25,ridge]],red);
  a.face([[x-width/2,b,eave],[x+width/2,b,eave],[x,b,ridge]],red);
  a.face([[x-width/2,f+.25,eave],[x-width/2,b,eave],[x,b,ridge],[x,f+.25,ridge]],trim);
  a.face([[x,f+.25,ridge],[x,b,ridge],[x+width/2,b,eave],[x+width/2,f+.25,eave]],trim);
  if (center) {
    a.line([[x-width*.34,f+.28,eave+.27],[x,f+.28,ridge-.45],[x+width*.34,f+.28,eave+.27]],'#e79a7a',.63);
  }
}

function attaraKacheri(a) {
  const wall='#b94e43', trim='#cf7056', glass='#493f3c';
  a.box(0,-.8,0,44.9,12.4,.75,'#ac826e');
  hall(a,0,-.8,44.4,11.6,.75,3.55,13,3,wall,glass,true);
  a.box(0,-.8,4.3,44.8,11.95,.4,trim);
  hall(a,0,-.8,44.4,11.6,4.7,3.85,13,3,wall,glass,true);
  a.box(0,-.8,8.55,45.0,12.28,.6,trim);
  hipRoof(a,0,-.8,9.15,44.5,12.02,1.28,'#995447');
  courtPortico(a,-17.2,8.4,false);
  courtPortico(a,0,12.7,true);
  courtPortico(a,17.2,8.4,false);
  a.line([[0,5.25,11],[0,5.25,14.2]],'#7a6550',.6);
  const y=5.25;
  for (const [i,color] of ['#e59943','#f4e9cd','#46865d'].entries()) {
    const z=14.1-i*.3;
    a.face([[0,y,z],[2.2,y-.3,z-.18],[2.2,y-.3,z-.48],[0,y,z-.3]],color);
  }
}

function memorialHall(a) {
  const red='#b74d42', light='#d16a53', opening='#413f39';
  a.box(0,0,0,31.95,13.3,.73,'#ad836c');
  hall(a,0,-.3,31.1,12.4,.73,5.9,9,3,red,opening,true);
  a.box(0,-.3,6.63,31.75,13.0,.58,light);
  hipRoof(a,0,-.3,7.21,32.1,13.25,3.0,'#a35b47');
  stairs(a,10.4,8.5,2,1.05,3,'#bd8b78');
  a.box(0,6.3,0,10.1,2.8,1.05,'#bc775d');
  for (const x of [-4.25,-2.55,2.55,4.25]) {
    a.round(x,7.26,1.05,.38,.32,5.64,light,6);
    a.box(x,7.26,6.69,.92,.94,.44,'#db795f');
  }
  a.box(0,6.1,7.13,10.6,3.62,.63,light);
  // The central gable rises in shallow, scalloped shoulders.
  const yz=7.91;
  const crest=[[-5.32,7.76],[-5.32,8.46],[-4.72,8.46],[-4.25,9.1],
    [-3.2,9.4],[-2.25,10.0],[-1.52,11.15],[-.7,11.56],[0,12.17],
    [.7,11.56],[1.52,11.15],[2.25,10.0],[3.2,9.4],[4.25,9.1],
    [4.72,8.46],[5.32,8.46],[5.32,7.76]];
  a.face(crest.map(([x,z])=>[x,yz,z]), red);
  a.face(crest.map(([x,z])=>[x,4.9,z]).reverse(),red);
  for(let i=1;i<crest.length;i++) {
    const [x0,z0]=crest[i-1], [x1,z1]=crest[i];
    a.face([[x0,yz,z0],[x0,4.9,z0],[x1,4.9,z1],[x1,yz,z1]],light);
  }
  a.face([[-.68,yz+.03,9.35],[0,yz+.03,8.73],[.68,yz+.03,9.35],[0,yz+.03,10.01]],'#ecc18d');
}

function bandstand(a) {
  const green='#33746a', rim='#529185', roof='#9e5544', pale='#d7b18a';
  a.round(0,0,0,7.4,7.4,.42,'#b09478',8);
  a.round(0,0,.42,7.03,7.03,.48,'#c3a687',8);
  a.round(0,0,.9,6.38,6.38,.59,pale,8);
  const rimPoints=[];
  for (let i=0;i<8;i++) {
    const t=i*Math.PI/4;
    const x=5.83*Math.cos(t), y=5.83*Math.sin(t);
    a.round(x,y,1.49,.35,.33,.5,green,5);
    a.round(x,y,1.99,.18,.17,4.25,green,5);
    a.round(x,y,6.24,.22,.42,.6,green,5);
    rimPoints.push([x,y,3.35]);
  }
  for (let i=0;i<8;i++) {
    const p=rimPoints[i], q=rimPoints[(i+1)%8];
    if(i===1 || i===2) continue;
    a.line([p,q],green,1);
    for (const f of [.25,.5,.75]) {
      const x=p[0]+f*(q[0]-p[0]), y=p[1]+f*(q[1]-p[1]);
      a.line([[x,y,1.49],[x,y,3.35]],green,.63);
    }
  }
  a.round(0,0,6.84,7.3,7.48,.46,rim,8);
  a.round(0,0,7.3,7.48,2.1,3.55,roof,8);
  a.round(0,0,10.85,2.1,1.72,.28,'#b97759',8);
  a.round(0,0,11.13,1.46,1.12,.74,green,8);
  a.round(0,0,11.87,1.67,.1,1.15,roof,8);
  a.round(0,0,13.02,.13,.01,.63,'#ab864e',5);
}

const landmarks = { soudha: vidhanaSoudha, court: attaraKacheri, library: memorialHall, bandstand };
export function buildLandmark(scene, id, cx, cy) {
  landmarks[id](drafter(scene,cx,cy));
}
