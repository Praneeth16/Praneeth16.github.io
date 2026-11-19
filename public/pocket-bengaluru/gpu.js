// The same inked geometry drives accelerated views, the software fallback and the stills.
const vertex=`
attribute vec3 position;
attribute vec4 paint;
uniform vec2 viewport, orbit;
uniform vec3 centre;
uniform float scale, slope, shadow;
varying vec4 colour;
void main(){
  vec3 p=position;
  if(shadow>0.5) p=vec3(p.xy+p.z*vec2(.52,.18),.26);
  p-=centre;
  float forwardDistance=dot(p.xy,orbit.yx);
  float up=sqrt(1.-slope*slope);
  vec2 screen=vec2(dot(p.xy,vec2(orbit.x,-orbit.y)),p.z*up-forwardDistance*slope);
  gl_Position=vec4(screen*scale*2./viewport+vec2(0.,-.04),-(forwardDistance*up+p.z*slope)/500.,1.);
  colour=paint;
}`;
const fragment=`
precision mediump float;
varying vec4 colour;
uniform float shadow,picking;
void main(){
  if(picking>.5)gl_FragColor=vec4(colour.a,0.,0.,1.);
  else if(shadow>.5)gl_FragColor=vec4(.16,.20,.19,.19);
  else gl_FragColor=vec4(colour.rgb,1.);
}`;
function program(gl){
  const p=gl.createProgram();
  for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
    gl.attachShader(p,s);gl.deleteShader(s);
  }
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  return p;
}
function pack(items){
  let triangles=0,edges=0;
  for(const [mesh] of items){
    for(const f of mesh.faces){triangles+=(f.points.length-2)*3;if(f.ink!==null)edges+=2*f.points.length;}
    for(const l of mesh.lines)edges+=2*(l.points.length-1);
  }
  const bytes=new ArrayBuffer((triangles+edges)*16);
  const xyz=new Float32Array(bytes),rgba=new Uint32Array(bytes);
  let t=0,e=triangles;
  function put(index,p,color,id){
    const k=index*4;xyz[k]=p[0];xyz[k+1]=p[1];xyz[k+2]=p[2];rgba[k+3]=(color&0xffffff)|(id<<24);
  }
  for(const [mesh,id] of items){
    for(const f of mesh.faces){
      const pts=f.points;
      for(let i=1;i<pts.length-1;i++){put(t++,pts[0],f.fill,id);put(t++,pts[i],f.fill,id);put(t++,pts[i+1],f.fill,id);}
      if(f.ink!==null)for(let i=0;i<pts.length;i++){put(e++,pts[i],f.ink,id);put(e++,pts[(i+1)%pts.length],f.ink,id);}
    }
    for(const l of mesh.lines)for(let i=1;i<l.points.length;i++){put(e++,l.points[i-1],l.fill,id);put(e++,l.points[i],l.fill,id);}
  }
  return {bytes,triangles,edges};
}
export function accelerated(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,stencil:true,premultipliedAlpha:false});
  if(!gl)return null;
  const p=program(gl);gl.useProgram(p);
  const pos=gl.getAttribLocation(p,'position'),color=gl.getAttribLocation(p,'paint');
  const u=Object.fromEntries(['viewport','orbit','centre','scale','slope','shadow','picking'].map(k=>[k,gl.getUniformLocation(p,k)]));
  gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(color);
  gl.disable(gl.DITHER);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  let ground,staticMesh,dynamic;
  function upload(items,existing,stream=false){
    const {bytes,triangles,edges}=pack(items);
    const buf=existing?.buf||gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,bytes,stream?gl.STREAM_DRAW:gl.STATIC_DRAW);
    return {buf,triangles,edges};
  }
  function drawMesh(m,outline=true){
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);
    gl.vertexAttribPointer(color,4,gl.UNSIGNED_BYTE,true,16,12);
    gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);
    gl.drawArrays(gl.TRIANGLES,0,m.triangles);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    if(outline)gl.drawArrays(gl.LINES,m.triangles,m.edges);
  }
  function setWorld(w){
    ground=upload([[w.ground,0]],ground);
    staticMesh=upload([[w.landscape,0],...w.buildings.map((m,i)=>[m,i+1])],staticMesh);
  }
  function paint(cam,pick=false){
    const {width:w,height:h}=canvas;
    gl.viewport(0,0,w,h);gl.stencilMask(255);gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
    gl.uniform2f(u.viewport,w,h);gl.uniform2f(u.orbit,Math.cos(cam.angle),Math.sin(cam.angle));
    gl.uniform3fv(u.centre,cam.center);gl.uniform1f(u.scale,Math.min(w/192,h/123)*cam.zoom);
    gl.uniform1f(u.slope,cam.slant);gl.uniform1f(u.shadow,0);gl.uniform1f(u.picking,pick?1:0);
    // Mark the tile, then darken each ground pixel at most once across overlapping shadows.
    gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.ALWAYS,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.REPLACE);
    drawMesh(ground,!pick);
    if(!pick){
      gl.stencilFunc(gl.EQUAL,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);gl.uniform1f(u.shadow,1);drawMesh(staticMesh,false);
      gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(u.shadow,0);
    }
    gl.disable(gl.STENCIL_TEST);drawMesh(staticMesh,!pick);
    if(!pick&&dynamic)drawMesh(dynamic);
  }
  return {setWorld,updateLife(mesh){dynamic=upload([[mesh,0]],dynamic,true);},paint,
    hit(cam,x,y){
      paint(cam,true);const pixel=new Uint8Array(4);
      gl.readPixels(x,canvas.height-y-1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);paint(cam);return pixel[0];
    }
  };
}
