import {Geometry, camera, draw, surface} from './render.js';
import {buildLandmark} from './architecture.js';
import {buildPark, movingLife} from './park.js';
import * as parkDetails from './cubbon-details.js';
import * as market from './market.js';
import * as church from './church.js';

const civicStops=[
  {id:'soudha',x:-27,y:-36,z:29},{id:'court',x:-27,y:5,z:16},
  {id:'library',x:37,y:28,z:14},{id:'bandstand',x:33,y:-34,z:14},
];
const park={
  stops:[...civicStops,...parkDetails.stops],
  buildDistrict({ground,landscape,season}){
    buildPark({ground,object:(_x,_y,build)=>build(landscape),season});
    parkDetails.enrichPark({ground,landscape,season});
  },
  buildStop(mesh,id,x,y){
    if(civicStops.some(p=>p.id===id))buildLandmark(mesh,id,x,y);
    else parkDetails.buildStop(mesh,id,x,y);
  },
  movingDistrict(t,season){
    const mesh=parkDetails.movingDetails(t,season);
    for(const item of movingLife(t))item.build(mesh);
    return mesh;
  }
};
const districts={market,park,church};
export const startAngle=.55;
export function makeWorld(key='market',season='blossom'){
  const district=districts[key], ground=new Geometry(),landscape=new Geometry();
  ground.box(0,0,-4.6,144,112,3.8,key==='park'?'#a78369':'#ad947b');
  ground.box(0,0,-.8,144,112,.8,key==='park'?'#adc28d':'#ccb99a');
  district.buildDistrict({ground,landscape,season});
  const buildings=district.stops.map(p=>{
    const mesh=new Geometry();
    district.buildStop(mesh,p.id,p.x,p.y);
    return mesh;
  });
  return {ground,landscape,buildings,stops:district.stops,life:t=>district.movingDistrict(t,season)};
}
export function drawCity(world,w,h,angle,zoom=1,slant=.52,center=[0,0,0]){
  const project=camera(w,h,angle,zoom,slant,center),base=surface(w,h);
  draw(base,world.ground,project);
  for(const mesh of [world.landscape,...world.buildings])draw(base,mesh,project,true);
  base.owners=new Uint8Array(w*h);
  world.buildings.forEach((mesh,i)=>{base.owner=i+1;draw(base,mesh,project);});
  base.owner=0;draw(base,world.landscape,project);
  return {base,project,world};
}
export function drawLife(frame,time){
  const {base,project,world}=frame;
  const target={w:base.w,h:base.h,pixels:base.pixels.slice(),depth:base.depth.slice()};
  draw(target,world.life(time),project);
  return target;
}
