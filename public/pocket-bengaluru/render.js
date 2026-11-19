// An orthographic ink-and-colour renderer. The static city and its depth buffer
// are kept between frames so moving traffic only paints its own pixels.
const TAU = 2 * Math.PI;
const paint = new Map();
function pigment(color, light = 1) {
  const key = color + light.toFixed(2);
  if (paint.has(key)) return paint.get(key);
  const n = parseInt(color.slice(1), 16);
  const channel = shift => Math.min(255, Math.round(((n >> shift) & 255) * light));
  const value = (0xff000000 | channel(16) | (channel(8) << 8) | (channel(0) << 16)) >>> 0;
  paint.set(key, value);
  return value;
}
function shade(points) {
  const [a,b,c] = points;
  const u = b.map((v,i) => v-a[i]), v = c.map((val,i) => val-a[i]);
  let nx=u[1]*v[2]-u[2]*v[1], ny=u[2]*v[0]-u[0]*v[2], nz=u[0]*v[1]-u[1]*v[0];
  const len = Math.hypot(nx,ny,nz) || 1;
  if (nz < -0.01) { nx=-nx; ny=-ny; nz=-nz; }
  return .88 + .14*nz/len - .085*nx/len + .08*ny/len;
}
export class Geometry {
  constructor() { this.faces=[]; this.lines=[]; }
  face(points,color,edge=true,light=shade(points)) {
    this.faces.push({points, fill:pigment(color,light), ink:edge ? pigment(color,light*.78) : null});
  }
  poly(points,color) { if(points.length>=3) this.face(points,color); }
  line(points,color,width=.6) { this.lines.push({points,fill:pigment(color),width}); }
  box(x,y,z,w,d,h,color) {
    const ring=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]];
    const top=ring.map(([a,b])=>[a,b,z+h]);
    for(let i=0;i<4;i++) this.face([ring[i],ring[(i+1)%4],top[(i+1)%4],top[i]],color);
    this.face(top,color);
  }
  frustum(x,y,z,r,rt,h,color,sides=12) {
    const ring = (rad,zz) => Array.from({length:sides},(_,i)=>[x+rad*Math.cos(TAU*i/sides),y+rad*Math.sin(TAU*i/sides),zz]);
    const bottom=ring(r,z), top=ring(rt,z+h);
    for(let i=0;i<sides;i++) {
      let j=(i+1)%sides;
      this.face(rt===0?[bottom[i],bottom[j],top[i]]:[bottom[i],bottom[j],top[j],top[i]],color,false);
    }
    if(rt>0) this.face(top,color);
  }
  ellipsoid(x,y,z,rx,ry,rz,color) {
    const levels=[-.98,-.60,.03,.63,.98], sides=9;
    const rings=levels.map((h,j)=>Array.from({length:sides},(_,i)=>{
      const a=TAU*(i+(j%2)*.23)/sides, r=Math.sqrt(1-h*h);
      return [x+r*rx*Math.cos(a),y+r*ry*Math.sin(a),z+h*rz];
    }));
    for(let j=0;j<rings.length-1;j++) for(let i=0;i<sides;i++){
      const k=(i+1)%sides;
      this.face([rings[j][i],rings[j][k],rings[j+1][k],rings[j+1][i]],color,false);
    }
    this.face(rings.at(-1),color,false);
  }
}
export function camera(width,height,angle,zoom=1) {
  const c=Math.cos(angle),s=Math.sin(angle),slant=.52,up=Math.sqrt(1-slant**2);
  const scale = Math.min(width/192,height/123)*zoom;
  return ([x,y,z])=>{
    const forward=x*s+y*c;
    return [width/2+(x*c-y*s)*scale,height*.52+(forward*slant-z*up)*scale,forward*up+z*slant];
  };
}
function triangle(surface,a,b,c,fill,shadow=false) {
  const {w,h,pixels,depth}=surface;
  const det=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  if(Math.abs(det)<.005)return;
  const left=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0]))), right=Math.min(w-1,Math.floor(Math.max(a[0],b[0],c[0])));
  const top=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1]))),bottom=Math.min(h-1,Math.floor(Math.max(a[1],b[1],c[1])));
  const ux=(c[1]-a[1])/det, uy=(a[0]-c[0])/det, vx=(a[1]-b[1])/det, vy=(b[0]-a[0])/det;
  const zu=b[2]-a[2], zv=c[2]-a[2];
  for(let y=top;y<=bottom;y++){
    let u=(left-a[0])*ux+(y-a[1])*uy, v=(left-a[0])*vx+(y-a[1])*vy;
    for(let x=left,idx=y*w+x;x<=right;x++,idx++,u+=ux,v+=vx){
      if(u<-.00001||v<-.00001||u+v>1.00001) continue;
      if(shadow) {
        if(surface.shadow[idx] || pixels[idx]===0)continue;
        const n=pixels[idx]; pixels[idx]=((n&0xfefefe)>>>1)+((n&0xfcfcfc)>>>2)+((n&0xf8f8f8)>>>3) | 0xff000000;
        surface.shadow[idx]=1;
      } else {
        const z=a[2]+u*zu+v*zv;
        if(z+.0005<depth[idx])continue;
        pixels[idx]=fill; depth[idx]=z;
        if(surface.owners)surface.owners[idx]=surface.owner;
      }
    }
  }
}
function stroke(surface,a,b,fill,weight) {
  const dx=b[0]-a[0],dy=b[1]-a[1],steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))) || 1;
  const radius=Math.min(2,Math.max(0,Math.floor(weight/2)));
  for(let j=0;j<=steps;j++){
    const t=j/steps, x=Math.round(a[0]+dx*t), y=Math.round(a[1]+dy*t), z=a[2]+(b[2]-a[2])*t;
    for(let yy=y-radius;yy<=y+radius;yy++)for(let xx=x-radius;xx<=x+radius;xx++){
      if(xx<0||yy<0||xx>=surface.w||yy>=surface.h)continue;
      const k=yy*surface.w+xx;
      if(z+.18>=surface.depth[k])surface.pixels[k]=fill;
    }
  }
}
export function surface(w,h) {
  return {w,h,pixels:new Uint32Array(w*h),depth:new Float32Array(w*h).fill(-Infinity),shadow:new Uint8Array(w*h)};
}
export function draw(target,mesh,project,shadow=false) {
  const cache=new Map();
  const point=p=>{
    if(!cache.has(p))cache.set(p,project(shadow?[p[0]+.52*p[2],p[1]+.18*p[2],.05]:p));
    return cache.get(p);
  };
  for(const f of mesh.faces){
    const pts=f.points.map(point);
    for(let j=1;j<pts.length-1;j++)triangle(target,pts[0],pts[j],pts[j+1],f.fill,shadow);
    if(!shadow&&f.ink!==null)for(let j=0;j<pts.length;j++)stroke(target,pts[j],pts[(j+1)%pts.length],f.ink,.6);
  }
  if(!shadow)for(const l of mesh.lines){
    const pts=l.points.map(point);
    for(let j=1;j<pts.length;j++)stroke(target,pts[j-1],pts[j],l.fill,l.width);
  }
}
