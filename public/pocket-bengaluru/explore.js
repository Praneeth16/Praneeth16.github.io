import { makeWorld,drawCity,drawLife,startAngle,places } from './world.js';

const view=document.querySelector('#viewport'), canvas=view.querySelector('canvas');
const pins=[...view.querySelectorAll('.pin')], links=[...document.querySelectorAll('.places a')];
const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
let selection, angle=startAngle, zoom=1, frame, world, time=0, last=0, raf=0, pointer=null;
let running=!reduced.matches, visible=true, redraw=true;
const context=canvas.getContext('2d');
function select(id,remember=true) {
  if(!places.some(p=>p.id===id))id=places[0].id;
  selection=id;
  for(const link of links){
    if(link.dataset.place===id)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  }
  for(const note of document.querySelectorAll('.note'))note.hidden=note.id!==id;
  for(const pin of pins)pin.setAttribute('aria-pressed',String(pin.dataset.place===id));
  if(remember)history.replaceState(null,'','#'+id);
}
for(const el of [...links,...pins])el.addEventListener('click',event=>{
  event.preventDefault();
  select(el.dataset.place);
});
select(location.hash.slice(1),false);
window.addEventListener('hashchange',()=>select(location.hash.slice(1),false));
function motionLabel(){
  const b=document.querySelector('#motion');
  b.querySelector('span').textContent=running?'Pause city':'Play city';
  b.querySelector('b').textContent=running?'Ⅱ':'▷';
}
function schedule() {
  if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(paint);
}
function paint(now) {
  raf=0;
  if(!visible||document.hidden)return;
  if(!redraw&&last&&now-last<64){if(running)schedule();return;}
  if(last&&running)time+=Math.min((now-last)/1000,.2);
  last=now;
  if(redraw){
    const rect=view.getBoundingClientRect();
    const density=Math.min(devicePixelRatio||1,1.5,1200/Math.max(1,rect.width));
    canvas.width=Math.max(1,Math.round(rect.width*density));
    canvas.height=Math.max(1,Math.round(rect.height*density));
    frame=drawCity(world,canvas.width,canvas.height,angle,zoom);
    for(let i=0;i<places.length;i++){
      const p=places[i], [x,y]=frame.project([p.x,p.y,p.z]);
      pins[i].style.left=x/canvas.width*100+'%'; pins[i].style.top=y/canvas.height*100+'%';
      pins[i].hidden=x<5||x>canvas.width-5||y<26*density||y>canvas.height;
    }
    document.querySelector('.compass i').style.transform='rotate('+Math.atan2(Math.sin(angle),.52*Math.cos(angle))+'rad)';
    redraw=false;
  }
  const target=drawLife(frame,time);
  const img=new ImageData(new Uint8ClampedArray(target.pixels.buffer),target.w,target.h);
  context.putImageData(img,0,0);
  root.classList.add('ready');
  if(running)schedule();
}
function updateView(){redraw=true;schedule();}
function rotate(step){angle+=step;updateView();}
function changeZoom(value){
  zoom=Math.max(.8,Math.min(1.4,Math.round(value*100)/100));
  document.querySelector('#in').disabled=zoom>=1.4;
  document.querySelector('#out').disabled=zoom<=.8;
  updateView();
}
document.querySelector('#left').onclick=()=>rotate(-Math.PI/8);
document.querySelector('#right').onclick=()=>rotate(Math.PI/8);
document.querySelector('#in').onclick=()=>changeZoom(zoom+.15);
document.querySelector('#out').onclick=()=>changeZoom(zoom-.15);
document.querySelector('#reset').onclick=()=>{angle=startAngle;changeZoom(1);};
document.querySelector('#motion').onclick=()=>{running=!running;last=0;motionLabel();schedule();};
reduced.addEventListener('change',e=>{running=!e.matches;last=0;motionLabel();schedule();});
canvas.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft')rotate(-Math.PI/12);
  else if(e.key==='ArrowRight')rotate(Math.PI/12);
  else if(e.key==='+'||e.key==='=')changeZoom(zoom+.15);
  else if(e.key==='-')changeZoom(zoom-.15);
  else if(e.key==='Home'){angle=startAngle;changeZoom(1);}
  else return;
  e.preventDefault();
});
canvas.addEventListener('pointerdown',e=>{
  if(pointer||e.button!==0)return;
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY,angle,dragged:false};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  const dx=e.clientX-pointer.x;
  if(Math.abs(dx)>4)pointer.dragged=true;
  if(pointer.dragged){
    canvas.classList.add('dragging');
    angle=pointer.angle-dx*.009;
    updateView();
  }
});
function release(){pointer=null;canvas.classList.remove('dragging');}
canvas.addEventListener('pointercancel',release);
canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('pointerup',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  if(!pointer.dragged&&frame&&Math.abs(e.clientY-pointer.y)<7){
    const rect=canvas.getBoundingClientRect(), ix=Math.floor((e.clientX-rect.left)/rect.width*canvas.width);
    const iy=Math.floor((e.clientY-rect.top)/rect.height*canvas.height);
    const id=frame.base.owners[iy*canvas.width+ix];
    if(id)select(places[id-1].id);
  }
  release();
});
if(context){
  world=makeWorld();motionLabel();
  new ResizeObserver(updateView).observe(view);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;if(visible)schedule();}).observe(view);
  document.addEventListener('visibilitychange',()=>{last=0;schedule();});
  schedule();
}
