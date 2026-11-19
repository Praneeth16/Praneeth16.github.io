import {makeWorld,startAngle,drawCity,drawLife} from './world.js';
import {camera} from './render.js';
import {accelerated} from './gpu.js';

const guide=JSON.parse(document.querySelector('#guide-data').textContent);
const $=s=>document.querySelector(s), all=s=>Array.from(document.querySelectorAll(s));
const view=$('#viewport'), pins=$('.pins'), root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
let canvas=view.querySelector('canvas'), gpu;
try{gpu=accelerated(canvas);}catch(error){console.warn('Switching to software drawing.',error);}
function softwareCanvas(){
  const fresh=canvas.cloneNode(false);
  canvas.replaceWith(fresh);canvas=fresh;gpu=null;return canvas.getContext('2d');
}
let software=gpu?null:softwareCanvas();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();software=softwareCanvas();invalidate();});
const weather=document.createElement('canvas');weather.className='weather';weather.setAttribute('aria-hidden','true');view.insertBefore(weather,pins);
const sky=weather.getContext('2d');
const cam={angle:startAngle,zoom:1,slant:.52,center:[0,0,0]};
let key,world,district,selection=null,season='blossom',showPins=true,frame,dirty=true,lifeDirty=true;
let playing=!reduced.matches,visible=true,raf=0,last=0,time=5,stamp=-1;
const pinNodes=new Map();
function schedule(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(paint);}
function invalidate(){dirty=true;schedule();}
function updateClock(){last=0;$('#motion').textContent=playing?'Pause city':'Play city';schedule();}
function refreshSize(){
  const rect=view.getBoundingClientRect(),density=Math.min(devicePixelRatio||1,1.6,1450/Math.max(1,rect.width));
  const width=Math.max(1,Math.round(rect.width*density)),height=Math.max(1,Math.round(rect.height*density));
  if(canvas.width!==width||canvas.height!==height){
    canvas.width=weather.width=width;canvas.height=weather.height=height;
  }
}
function weatherLayer(){
  sky.clearRect(0,0,weather.width,weather.height);
  if(season!=='rain')return;
  const w=weather.width,h=weather.height;
  sky.fillStyle='rgba(81,113,146,.038)';sky.fillRect(0,0,w,h);
  sky.strokeStyle='rgba(75,105,128,.32)';sky.lineWidth=Math.max(1,w/1000);sky.beginPath();
  for(let i=0;i<90;i++){
    const x=((i*97.7-time*40)%(w+24)+w+24)%(w+24),y=(i*68.3+time*171)%(h+16);
    sky.moveTo(x,y);sky.lineTo(x-4,y+11);
  }
  sky.stroke();
}
function placePins(project){
  for(const p of world.stops){
    const el=pinNodes.get(p.id),[x,y]=project([p.x,p.y,p.z]);
    el.style.left=x/canvas.width*100+'%';el.style.top=y/canvas.height*100+'%';
    el.hidden=!showPins||x<16||x>canvas.width-16||y<26||y>canvas.height-8;
  }
  $('.compass i').style.transform='rotate('+Math.atan2(Math.sin(cam.angle),cam.slant*Math.cos(cam.angle))+'rad)';
  $('#zoom').textContent=Math.round(cam.zoom*100)+'%';
  $('#in').disabled=cam.zoom>=4;$('#out').disabled=cam.zoom<=.75;
}
function paint(now){
  raf=0;if(!visible||document.hidden||!world)return;
  if(playing&&last)time+=Math.min(.16,(now-last)/1000);
  last=now;
  const tick=Math.floor(time*(gpu?20:12));
  const lifeChanged=lifeDirty||tick!==stamp;
  if(dirty||lifeChanged){
    if(dirty){
      refreshSize();
      const project=camera(canvas.width,canvas.height,cam.angle,cam.zoom,cam.slant,cam.center);
      placePins(project);
      if(!gpu)frame=drawCity(world,canvas.width,canvas.height,cam.angle,cam.zoom,cam.slant,cam.center);
    }
    if(gpu){if(lifeChanged)gpu.updateLife(world.life(time));gpu.paint(cam);}
    else{
      const image=drawLife(frame,time);
      software.putImageData(new ImageData(new Uint8ClampedArray(image.pixels.buffer),image.w,image.h),0,0);
    }
    weatherLayer();dirty=false;lifeDirty=false;stamp=tick;root.classList.add('ready');
  }
  if(playing)schedule();
}
function setZoom(z){cam.zoom=Math.max(.75,Math.min(4,z));invalidate();}
function home(){
  cam.angle=startAngle;cam.center=[0,0,0];cam.slant=.52;$('#camera').value='iso';setZoom(1);
}
function newMesh(){
  world=makeWorld(key,season);gpu?.setWorld(world);lifeDirty=true;invalidate();
}
function makePins(){
  pins.replaceChildren();pinNodes.clear();
  district.stops.forEach((p,i)=>{
    const button=document.createElement('button');button.className='pin';button.dataset.stop=p.id;
    button.textContent=String.fromCharCode(65+i);button.setAttribute('aria-label',p.name);button.title=p.name;
    pins.append(button);pinNodes.set(p.id,button);
  });
}
function showStop(id,focus){
  selection=id;
  const chosen=district.stops.find(stop=>stop.id===id);
  $('#map-name').textContent=chosen?.name||district.name;
  all('[data-note]').forEach(el=>el.hidden=el.dataset.note!==id);
  all('.start').forEach(el=>el.hidden=!!id);
  for(const link of all('.stops a')){
    if(link.dataset.stop===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  }
  for(const [stop,el] of pinNodes)el.setAttribute('aria-pressed',String(stop===id));
  if(id&&focus){
    const p=world.stops.find(s=>s.id===id);
    cam.center=[p.x,p.y,p.z*.38];setZoom(['coffee-cart','readers'].includes(id)?3.35:2.1);
  }
}
function navigate(hash,write=false){
  const d=guide.find(g=>g.id===hash||g.stops.some(p=>p.id===hash))||guide[0];
  const stop=d.stops.find(p=>p.id===hash)?.id||null;
  if(d.id!==key){
    key=d.id;district=d;makePins();newMesh();home();
    all('[data-guide]').forEach(el=>el.hidden=el.dataset.guide!==key);
    all('[data-district]').forEach(el=>{
      if(el.dataset.district===key)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');
    });
    $('#map-name').textContent=d.name;$('#kannada').textContent=d.kannada;
  }else if(!stop)home();
  showStop(stop,true);
  if(write&&location.hash!=='#'+(stop||key))history.pushState(null,'','#'+(stop||key));
  invalidate();
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-district],[data-stop],[data-walk],[data-prev],[data-next]');
  if(!el||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();
  const data=el.dataset,index=district.stops.findIndex(p=>p.id===selection);
  if(data.district||data.stop)navigate(data.district||data.stop,true);
  else if(data.walk)navigate(district.stops[0].id,true);
  else if(data.prev&&index>0)navigate(district.stops[index-1].id,true);
  else if(data.next)navigate(district.stops[index+1]?.id||key,true);
  if(data.prev||data.next||data.walk){
    const nextControl=selection?document.getElementById(selection).querySelector('[data-next]'):document.querySelector('[data-guide]:not([hidden]) [data-walk]');
    nextControl?.focus({preventScroll:true});
  }
});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
$('#labels').onclick=()=>{showPins=!showPins;$('#labels').textContent=showPins?'Hide pins':'Show pins';$('#labels').setAttribute('aria-pressed',String(showPins));invalidate();};
$('#in').onclick=()=>setZoom(cam.zoom*1.25);$('#out').onclick=()=>setZoom(cam.zoom/1.25);
$('#left').onclick=()=>{cam.angle-=Math.PI/8;invalidate();};$('#right').onclick=()=>{cam.angle+=Math.PI/8;invalidate();};
$('#reset').onclick=()=>navigate(key,true);
$('#camera').onchange=e=>{cam.slant={iso:.52,bird:.88,street:.28}[e.target.value];if(!selection)setZoom(cam.slant>.8?.83:1);invalidate();};
$('#season').onchange=e=>{season=e.target.value;root.dataset.season=season;newMesh();};
$('#motion').onclick=()=>{playing=!playing;updateClock();};
reduced.addEventListener('change',e=>{playing=!e.matches;updateClock();});
view.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.target.closest('button'))return;
  e.preventDefault();setZoom(cam.zoom*Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.002));
},{passive:false});
function pan(dx,dy){
  const scale=Math.min(view.clientWidth/192,view.clientHeight/123)*cam.zoom;
  const side=-dx/scale,forward=-dy/(scale*cam.slant),c=Math.cos(cam.angle),s=Math.sin(cam.angle);
  cam.center[0]=Math.max(-78,Math.min(78,cam.center[0]+side*c+forward*s));
  cam.center[1]=Math.max(-62,Math.min(62,cam.center[1]-side*s+forward*c));invalidate();
}
view.addEventListener('keydown',e=>{
  if(e.target!==canvas)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    if(e.shiftKey)pan(e.key==='ArrowLeft'?30:-30,0);
    else cam.angle+=(e.key==='ArrowLeft'?-1:1)*Math.PI/12;
  }else if(e.key==='ArrowUp'||e.key==='ArrowDown')pan(0,e.key==='ArrowUp'?25:-25);
  else if(e.key==='+'||e.key==='=')setZoom(cam.zoom*1.2);
  else if(e.key==='-')setZoom(cam.zoom/1.2);
  else if(e.key==='Home')navigate(key,true);else return;
  e.preventDefault();invalidate();
});
const pointers=new Map();let moved=false;
const span=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1;};
view.addEventListener('pointerdown',e=>{
  if(e.target!==canvas||e.button!==0)return;
  if(!pointers.size)moved=false;else moved=true;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
  canvas.setPointerCapture(e.pointerId);
});
view.addEventListener('pointermove',e=>{
  const point=pointers.get(e.pointerId);if(!point)return;
  if(!moved&&Math.hypot(e.clientX-point.startX,e.clientY-point.startY)<4)return;
  moved=true;const oldSpan=pointers.size===2?span():0,dx=e.clientX-point.x,dy=e.clientY-point.y;
  point.x=e.clientX;point.y=e.clientY;
  if(oldSpan){setZoom(cam.zoom*span()/oldSpan);pan(dx/2,dy/2);}
  else if(e.shiftKey||$('#gesture').value==='pan')pan(dx,dy);
  else{cam.angle-=dx*.009;invalidate();}
  canvas.classList.add('dragging');
});
view.addEventListener('pointerup',e=>{
  if(!pointers.has(e.pointerId))return;
  if(!moved){
    const rect=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)*canvas.width/rect.width),y=Math.floor((e.clientY-rect.top)*canvas.height/rect.height);
    const id=gpu?gpu.hit(cam,x,y):frame?.base.owners[y*canvas.width+x];
    if(id&&world.stops[id-1])navigate(world.stops[id-1].id,true);
  }
  pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');
});
for(const event of ['pointercancel','lostpointercapture'])view.addEventListener(event,e=>{pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');});
if(gpu||software){
  navigate(location.hash.slice(1));updateClock();
  new ResizeObserver(invalidate).observe(view);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0;if(visible)schedule();}).observe(view);
  document.addEventListener('visibilitychange',()=>{last=0;schedule();});
}
