import {MAPS,clamp} from './world.mjs';
export const ESCORT_RADIUS=5.5,ESCORT_SPEED=1.8;
export function escortRoute(map='depot'){return MAPS[map]?.escortRoute||MAPS.depot.escortRoute}
export function escortPoint(map,progress){const route=escortRoute(map),lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.z-route[i].z)),total=lengths.reduce((a,b)=>a+b,0);let distance=clamp(progress,0,1)*total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const t=lengths[i]?distance/lengths[i]:0,a=route[i],b=route[i+1];return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(-(b.x-a.x),-(b.z-a.z)),distance:clamp(progress,0,1)*total,total}}distance-=lengths[i]}return {...route.at(-1),yaw:Math.PI,distance:total,total}}
export function freshEscort(map='depot'){const pos=escortPoint(map,0);return {progress:0,x:pos.x,z:pos.z,yaw:pos.yaw,attackers:0,defenders:0,contested:false,completed:false,checkpoint:0}}
export function stepEscort(room,dt){const cart=room.escort;if(!cart||cart.completed||room.restart)return null;let attackers=0,defenders=0;for(const p of room.players.values()){if(p.hp<=0||p.bot&&room.mode==='training')continue;if(Math.hypot(p.x-cart.x,p.z-cart.z)>ESCORT_RADIUS||Math.abs(p.y)>3)continue;if(p.team==='orange')attackers++;else if(p.team==='blue')defenders++}
 cart.attackers=attackers;cart.defenders=defenders;cart.contested=attackers>0&&defenders>0;
 if(!attackers||defenders)return null;
 const point=escortPoint(room.map,cart.progress);cart.progress=clamp(cart.progress+ESCORT_SPEED*dt/point.total,0,1);Object.assign(cart,escortPoint(room.map,cart.progress));
 if(cart.progress>=1){cart.completed=true;return 'delivered'}
 if(!cart.checkpoint&&cart.progress>=.5){cart.checkpoint=1;return 'checkpoint'}
 return null;
}
