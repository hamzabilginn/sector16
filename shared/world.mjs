import {CITY} from './city.mjs';
import {DEPOT} from './depot.mjs';
export const ARENA={width:56,depth:64,name:'DOKLAR'};
// All coordinates and collision geometry are shared by server and renderer.
const DOCK_BOXES=[
 {x:-29,y:3,z:0,w:2,h:6,d:66,kind:'wall'}, {x:29,y:3,z:0,w:2,h:6,d:66,kind:'wall'},
 {x:0,y:3,z:-33,w:56,h:6,d:2,kind:'wall'},{x:0,y:3,z:33,w:56,h:6,d:2,kind:'wall'},
 {x:-17,y:1.5,z:-17,w:12,h:3,d:4,kind:'container',color:0x306272},
 {x:17,y:1.5,z:17,w:12,h:3,d:4,kind:'container',color:0xa7623f},
 {x:-17,y:1.5,z:12,w:4,h:3,d:12,kind:'container',color:0x53684d},
 {x:17,y:1.5,z:-12,w:4,h:3,d:12,kind:'container',color:0x9a824c},
 {x:0,y:2,z:0,w:8,h:4,d:10,kind:'building'},
 {x:-6,y:.65,z:-9,w:2.6,h:1.3,d:2.6,kind:'crate'},
 {x:6,y:.65,z:9,w:2.6,h:1.3,d:2.6,kind:'crate'},
 {x:7,y:1.25,z:-21,w:3,h:2.5,d:3,kind:'crate'},
 {x:-7,y:1.25,z:21,w:3,h:2.5,d:3,kind:'crate'},
 {x:-24,y:.6,z:-3,w:3,h:1.2,d:3,kind:'crate'},
 {x:24,y:.6,z:3,w:3,h:1.2,d:3,kind:'crate'},
 {x:-8,y:1.1,z:3,w:2,h:2.2,d:4,kind:'barrier'},
 {x:8,y:1.1,z:-3,w:2,h:2.2,d:4,kind:'barrier'},
 {x:0,y:.55,z:-27,w:8,h:1.1,d:1.4,kind:'barrier'},
 {x:0,y:.55,z:27,w:8,h:1.1,d:1.4,kind:'barrier'},
];
export const SPAWNS={blue:[[-20,27],[-12,27],[-4,30],[8,28],[20,27]],orange:[[20,-27],[12,-27],[4,-30],[-8,-28],[-20,-27]]};
export const WEAPONS={
 m249:{name:'M249 · 5-1',price:5750,slot:'primary',mag:100,reserve:200,damage:32,head:96,interval:.085,reload:4.5,spread:.009,kick:.024},
 knife:{name:'Taktik Bıçak',price:0,slot:'melee',mag:1,reserve:0,damage:55,head:55,interval:.30,reload:0,spread:0,kick:0,range:2.15,melee:true},
 pistol:{name:'Glock 18',price:0,slot:'secondary',mag:20,reserve:120,damage:26,head:78,interval:.20,reload:1.5,spread:.006,kick:.016},
 deagle:{name:'Desert Eagle',price:700,slot:'secondary',mag:7,reserve:35,damage:52,head:130,interval:.34,reload:1.9,spread:.004,kick:.05},
 rifle:{name:'AK-47',price:2700,slot:'primary',mag:30,reserve:90,damage:36,head:108,interval:.105,reload:2.4,spread:.006,kick:.020},
 m4:{name:'M4A1',price:3100,slot:'primary',mag:30,reserve:90,damage:31,head:93,interval:.09,reload:2.2,spread:.003,kick:.013},
 awp:{name:'AWP',price:4750,slot:'primary',mag:10,reserve:30,damage:115,head:250,interval:1.25,reload:3.2,spread:.001,kick:.07},
 smg:{name:'MP5',price:1500,slot:'primary',mag:30,reserve:120,damage:23,head:69,interval:.075,reload:1.9,spread:.008,kick:.012},
 shotgun:{name:'M3',price:1700,slot:'primary',mag:8,reserve:32,damage:15,head:30,pellets:8,interval:.85,reload:2.8,spread:.085,kick:.06}
};
const wall=(x,z,w,d,h=5,kind='wall')=>({x,y:h/2,z,w,h,d,kind});
const boundary=[wall(-29,0,2,66),wall(29,0,2,66),wall(0,-33,56,2),wall(0,33,56,2)];
const ice=[...boundary,
 wall(-13,-12,12,12,4,'ice'),wall(13,-12,12,12,4,'ice'),
 wall(-13,12,12,12,4,'ice'),wall(13,12,12,12,4,'ice'),
 wall(0,0,3,3,1.1,'ice'),wall(-23,0,3,5,1.1,'ice'),wall(23,0,3,5,1.1,'ice')];
const desert=[...boundary,
 wall(-13,7,13,17,5,'sand'),wall(14,8,12,14,5,'sand'),
 wall(-13,-14,12,12,5,'sand'),wall(12,-15,10,10,5,'sand'),
 wall(-3,-2,3,8,4,'sand'),wall(4,0,3,12,4,'sand'),
 wall(-22,-3,4,2,3,'sand'),wall(22,0,4,2,3,'sand'),
 wall(-8,22,6,2,2.2,'crate'),wall(10,21,3,3,1.1,'crate'),
 wall(-19,-25,3,3,1.3,'crate'),wall(19,-25,3,3,1.3,'crate'),
 wall(-2,-23,2,3,2.8,'door'),wall(2,-23,2,3,2.8,'door'),
 wall(-25,17,2,4,1.2,'crate'),wall(25,-12,2,4,1.2,'crate')];
const refinery=[...boundary,wall(0,0,8,18,6,'building'),wall(-18,-12,10,4,3,'container'),wall(18,12,10,4,3,'container'),wall(-18,15,4,12,4,'building'),wall(18,-15,4,12,4,'building'),wall(-7,-22,5,3,1.4,'crate'),wall(7,22,5,3,1.4,'crate'),wall(-22,2,3,7,2,'barrier'),wall(22,-2,3,7,2,'barrier')];
export const MAPS={
 city:CITY,
 depot:DEPOT,
 range:{id:'range',name:'Antrenman Alanı',boxes:[...boundary],spawns:{blue:[[0,27]],orange:[[-16,-8],[-8,-8],[0,-8],[8,-8],[16,-8]]},sky:0x91a8ae,floor:0x6d766c},
 docks:{id:'docks',name:'Doklar',description:'Endüstriyel liman',boxes:DOCK_BOXES,spawns:SPAWNS,floor:0x696f6a,sky:0x809297},
 iceworld:{id:'iceworld',name:'Buz Arenası',description:'Iceworld esintili · Dört blok, hızlı çatışma',boxes:ice,spawns:SPAWNS,floor:0xc2dce3,sky:0xabcddd},
 dust2:{id:'dust2',name:'Çöl Geçidi',description:'Dust 2 esintili · Uzun koridor, orta ve tünel',boxes:desert,spawns:SPAWNS,floor:0xbda071,sky:0xdac6a0}
 ,refinery:{id:'refinery',name:'Rafineri',description:'Yakın ve orta menzil çatışma',boxes:refinery,spawns:SPAWNS,floor:0x596064,sky:0x87939a}
};
export let BOXES=DOCK_BOXES;
export let ACTIVE_MAP='docks';
export function mapBounds(id=ACTIVE_MAP){const m=MAPS[id]||MAPS.docks;return {x:(m.width||56)/2,z:(m.depth||64)/2}}
export function baseZone(id='docks'){const m=MAPS[id]||MAPS.docks;return {z:m.baseZ||28,halfWidth:m.baseHalfWidth||27.65,depth:m.baseDepth||8}}
const boundsByBoxes=new WeakMap();
function boundsFor(boxes){if(!boundsByBoxes.has(boxes)){const m=Object.values(MAPS).find(m=>m.boxes===boxes);boundsByBoxes.set(boxes,mapBounds(m?.id||'docks'))}return boundsByBoxes.get(boxes)}
export function setActiveMap(id){ACTIVE_MAP=Object.hasOwn(MAPS,id)?id:'docks';BOXES=MAPS[ACTIVE_MAP].boxes}
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function inOwnBase(p){const b=baseZone(p.room?.map||p.map||'docks'),sign=p.team==='blue'?1:p.team==='orange'?-1:0;return !!sign&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)&&Math.abs(p.x)<=b.halfWidth&&p.y>=0&&p.y<=2.5&&Math.abs(p.z-sign*b.z)<=b.depth/2-.35}
export function direction(yaw,pitch){return {x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)}}
export function freshBody(x=0,z=25,yaw=0){return {x,y:0,z,vx:0,vy:0,vz:0,yaw,pitch:0,ground:true,crouch:false,jumpHeld:false}}
export function height(p){return p.crouch?1.12:1.78}
export function eye(p){return p.y+(p.crouch?.96:1.62)}
function overlap(p,b){const h=height(p);return p.y<b.y+b.h/2-.001&&p.y+h>b.y-b.h/2+.001}
function blockedAt(p,x,z,boxes){return boxes.some(b=>overlap(p,b)&&x+.34>b.x-b.w/2&&x-.34<b.x+b.w/2&&z+.34>b.z-b.d/2&&z-.34<b.z+b.d/2)}
export function simulate(p,i,dt=1/60,boxes=BOXES){
 const oldCrouch=p.crouch;p.crouch=!!i.crouch;
 if(oldCrouch&&!p.crouch&&blockedAt(p,p.x,p.z,boxes))p.crouch=true;
 p.yaw=Number.isFinite(i.yaw)?i.yaw:p.yaw;p.pitch=clamp(Number.isFinite(i.pitch)?i.pitch:0,-1.45,1.45);
 let sx=clamp(i.x||0,-1,1),sz=clamp(i.z||0,-1,1);const mag=Math.hypot(sx,sz);if(mag>1){sx/=mag;sz/=mag}
 const speed=p.crouch?2.6:i.aim?3.1:i.sprint&&!i.fire?7.1:5.15;
 const tx=(Math.cos(p.yaw)*sx+Math.sin(p.yaw)*sz)*speed,tz=(-Math.sin(p.yaw)*sx+Math.cos(p.yaw)*sz)*speed;
 const accel=p.ground?1-Math.exp(-18*dt):1-Math.exp(-4.5*dt);p.vx+=(tx-p.vx)*accel;p.vz+=(tz-p.vz)*accel;
 if(i.jump&&!p.jumpHeld&&p.ground){p.vy=6.3;p.ground=false}p.jumpHeld=!!i.jump;
 // Walk up shallow stairs without jumping; never step through an overhead slab.
 const step=(x,z)=>{if(!p.ground)return false;const candidates=boxes.filter(b=>x+.34>b.x-b.w/2&&x-.34<b.x+b.w/2&&z+.34>b.z-b.d/2&&z-.34<b.z+b.d/2);const tops=candidates.map(b=>b.y+b.h/2).filter(y=>y>p.y+.001&&y<=p.y+.28);if(!tops.length)return false;const y=Math.max(...tops);if(blockedAt({...p,y},x,z,boxes))return false;p.y=y;return true;};
 let nx=p.x+p.vx*dt;if(!blockedAt(p,nx,p.z,boxes)||step(nx,p.z))p.x=nx;else p.vx=0;
 let nz=p.z+p.vz*dt;if(!blockedAt(p,p.x,nz,boxes)||step(p.x,nz))p.z=nz;else p.vz=0;
 const oldY=p.y;p.vy-=18*dt;p.y+=p.vy*dt;p.ground=false;
 for(const b of boxes){if(p.x+.33<=b.x-b.w/2||p.x-.33>=b.x+b.w/2||p.z+.33<=b.z-b.d/2||p.z-.33>=b.z+b.d/2)continue;
 const top=b.y+b.h/2,bottom=b.y-b.h/2;
 if(p.vy<=0&&oldY>=top-.02&&p.y<=top){p.y=top;p.vy=0;p.ground=true}
 else if(p.vy>0&&oldY+height(p)<=bottom+.02&&p.y+height(p)>=bottom){p.y=bottom-height(p);p.vy=0}}
 if(p.y<=0){p.y=0;p.vy=0;p.ground=true}const bounds=boundsFor(boxes);p.x=clamp(p.x,-bounds.x+.35,bounds.x-.35);p.z=clamp(p.z,-bounds.z+.35,bounds.z-.35);return p;
}
export function rayBox(o,d,b){let near=0,far=250;for(const [a,size] of [['x','w'],['y','h'],['z','d']]){const min=b[a]-b[size]/2,max=b[a]+b[size]/2;if(Math.abs(d[a])<1e-8){if(o[a]<min||o[a]>max)return Infinity;continue}let t1=(min-o[a])/d[a],t2=(max-o[a])/d[a];if(t1>t2)[t1,t2]=[t2,t1];near=Math.max(near,t1);far=Math.min(far,t2);if(near>far)return Infinity}return far>=0?near:Infinity}
export function wallDistance(o,d,boxes=BOXES){let n=220;for(const b of boxes)n=Math.min(n,rayBox(o,d,b));if(d.y<0)n=Math.min(n,-o.y/d.y);return n}
export function playerHit(o,d,p,padding=0){const h=height(p);const head=rayBox(o,d,{x:p.x,y:p.y+h-.18,z:p.z,w:.42+padding,h:.38,d:.42+padding});const body=rayBox(o,d,{x:p.x,y:p.y+(h-.38)/2,z:p.z,w:.62+padding,h:h-.38,d:.52+padding});return head<body?{distance:head,head:true}:{distance:body,head:false}}
