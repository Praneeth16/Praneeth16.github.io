import { Geometry, camera, draw, surface } from './render.js';
import { buildLandmark } from './architecture.js';
import { buildPark, movingLife } from './park.js';

export const places = [
  {id:'soudha',x:-27,y:-36,z:29},
  {id:'court',x:-27,y:5,z:16},
  {id:'library',x:37,y:28,z:14},
  {id:'bandstand',x:33,y:-34,z:12},
];
export const startAngle=.55;
export function makeWorld(season='blossom'){
  const ground=new Geometry(), landscape=new Geometry();
  // Cutaway plinth, with the thin soil layer visible around the edge.
  ground.box(0,0,-5,144,112,3.7,'#9b7961');
  ground.box(0,0,-1.3,144,112,1.3,'#adc28d');
  const object=(x,y,build)=>build(landscape);
  buildPark({ground,object,season});
  const buildings=places.map(p=>{
    const mesh=new Geometry();
    buildLandmark(mesh,p.id,p.x,p.y);
    return mesh;
  });
  return {ground,landscape,buildings};
}
export function drawCity(world,w,h,angle,zoom=1,slant=.52,center=[0,0,0]){
  const project=camera(w,h,angle,zoom,slant,center), base=surface(w,h);
  draw(base,world.ground,project);
  for(const mesh of [world.landscape,...world.buildings])draw(base,mesh,project,true);
  base.owners=new Uint8Array(w*h);
  world.buildings.forEach((mesh,i)=>{base.owner=i+1;draw(base,mesh,project);});
  base.owner=0;
  draw(base,world.landscape,project);
  return {base,project};
}
export function drawLife(frame,time){
  const moving=new Geometry();
  for(const item of movingLife(time))item.build(moving);
  const {base,project}=frame;
  const target={w:base.w,h:base.h,pixels:base.pixels.slice(),depth:base.depth.slice()};
  draw(target,moving,project);
  return target;
}
