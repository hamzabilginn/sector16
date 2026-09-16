import {direction,eye,wallDistance,height} from './world.mjs';
export function createGrenade(p,time,id,kind='he'){const d=direction(p.yaw,p.pitch);return {id,kind:['he','flash','smoke'].includes(kind)?kind:'he',owner:p.id,team:p.team,name:p.name,x:p.x,y:eye(p),z:p.z,vx:d.x*14,vy:d.y*14+3,vz:d.z*14,explodeAt:time+2.2};}
export function stepGrenade(g,dt,boxes){g.vy-=13*dt;for(const axis of ['x','y','z']){const v='v'+axis,old=g[axis];g[axis]+=g[v]*dt;const hit=boxes.some(b=>Math.abs(g.x-b.x)<b.w/2+.09&&Math.abs(g.y-b.y)<b.h/2+.09&&Math.abs(g.z-b.z)<b.d/2+.09);if(hit){g[axis]=old;g[v]*=-.5;}}
 if(g.y<.1){g.y=.1;g.vy=Math.abs(g.vy)*.38;g.vx*=.82;g.vz*=.82;}return g;
}
export function blastDamage(g,p,boxes,radius=7,maxDamage=115){const target={x:p.x,y:p.y+height(p)*.5,z:p.z},dx=target.x-g.x,dy=target.y-g.y,dz=target.z-g.z,dist=Math.hypot(dx,dy,dz);if(dist>=radius)return 0;const d={x:dx/(dist||1),y:dy/(dist||1),z:dz/(dist||1)};if(wallDistance(g,d,boxes)<dist-.15)return 0;return Math.ceil(maxDamage*(1-dist/radius));}
