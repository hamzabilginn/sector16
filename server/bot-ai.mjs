import {MAPS,eye,direction,wallDistance,clamp} from '../shared/world.mjs';
import {BOT_LEVELS,canBotFire} from '../shared/bots.mjs';
import {BOMB_SITES} from '../shared/bomb.mjs';
import {pathTo} from './navigation.mjs';
import {enemies,smokeBlocks} from '../shared/live-expansion.mjs';
export const BOT_ROLES=['Hücum','Sol kanat','Sağ kanat','Destek','Savunma'];
export function makeBrain(index){return {role:index%BOT_ROLES.length,lane:index%3-1,phase:Math.random()*Math.PI*2,nextPlan:0,path:[],nextDecision:0,holdUntil:0,patrol:0,seen:null,lastX:0,lastZ:0,stuck:0};}
export function tacticalInput(p,r,time){
 const ai=p.ai??=makeBrain(p.botIndex||0),level=BOT_LEVELS[r.botDifficulty],boxes=MAPS[r.map].boxes;
 const foes=[...r.players.values()].filter(e=>enemies(p,e,r.mode)&&e.hp>0);const targets=foes.map(e=>{const dx=e.x-p.x,dz=e.z-p.z,dist=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(eye(e)-eye(p)-.2,dist);return {e,dist,yaw,pitch,visible:wallDistance({x:p.x,y:eye(p),z:p.z},direction(yaw,pitch),boxes)>dist-.3&&!smokeBlocks({x:p.x,y:eye(p),z:p.z},{x:e.x,y:eye(e),z:e.z},r.smokes,time)};}).sort((a,b)=>(a.visible?-100:0)+a.dist-((b.visible?-100:0)+b.dist));
 const target=targets[0];let yaw=p.yaw,pitch=0,fire=false,x=0,z=0,interact=false,sprint=false;
 let goal;
 if(r.mode==='bomb'&&r.bomb){const b=r.bomb;if(b.state==='planted'){goal={x:b.x+(p.team==='orange'?ai.lane*6:0),z:b.z+(p.team==='orange'?-6:0)};if(p.team==='blue'&&Math.hypot(p.x-b.x,p.z-b.z)<1.6)interact=true;}
 else if(b.carrier===p.id){goal=BOMB_SITES[ai.role%2];if(Math.hypot(p.x-goal.x,p.z-goal.z)<2.4)interact=true;}
 else if(p.team==='orange'&&b.state==='dropped')goal=b;
 else{const site=BOMB_SITES[ai.role%2];goal={x:site.x+ai.lane*2,z:site.z+(p.team==='blue'?-5:-9)};}}
 else if(r.mode==='ctf'){const own=r.flags[p.team],enemy=r.flags[p.team==='blue'?'orange':'blue'];goal=enemy.carrier===p.id?own:ai.role===4?own:enemy;}
 else if(time>ai.nextDecision){ai.nextDecision=time+3.5+(ai.phase%2);ai.patrol++;const sign=p.team==='blue'?1:-1;const lane=ai.role===1?-22:ai.role===2?22:ai.lane*14;
 ai.goal=ai.role===4?{x:lane,z:sign*(8+(ai.patrol%3)*6)}:ai.role===3?{x:lane,z:sign*(ai.patrol%2?6:-6)}:target?{x:ai.patrol%3===0?target.e.x:lane,z:ai.patrol%3===0?target.e.z:target.e.z*.55}:{x:lane,z:-sign*18};
 if(ai.role>=3)ai.holdUntil=time+.5+(ai.phase%1.5);
 }
 goal??=ai.goal||{x:ai.lane*20,z:0};
 if(interact){canBotFire(p,null,false,time,level);return{x:0,z:0,yaw,pitch,fire:false,interact:true,reload:false,weapon:p.primary||p.secondary};}
 if(target?.visible&&target.dist<level.range){
  fire=canBotFire(p,target.e.id,true,time,level);yaw=target.yaw+Math.sin(time*(1.3+ai.phase*.1)+ai.phase)*level.error;pitch=target.pitch+Math.cos(time+ai.phase)*level.error*.5;
  const stance=ai.role===3||ai.role===4;const preferred=stance?23:ai.role===0?10:16;
  x=Math.sin(time*(.5+ai.phase*.05)+ai.phase)*level.strafe*(stance?.35:1);z=target.dist>preferred+3?-.55:target.dist<preferred-4?.5:0;
 }else{
  canBotFire(p,null,false,time,level);
  if(time>=ai.nextPlan){ai.nextPlan=time+1.0+ai.phase*.2;ai.path=pathTo(r.map,p,goal,ai.lane);if(ai.path.length>1&&Math.hypot(ai.path[0].x-p.x,ai.path[0].z-p.z)<1.2)ai.path.shift();}
  while(ai.path.length>1&&Math.hypot(ai.path[0].x-p.x,ai.path[0].z-p.z)<.75)ai.path.shift();const next=ai.path[0]||goal;
  if(Math.hypot(next.x-p.x,next.z-p.z)>.5&&time>ai.holdUntil){yaw=Math.atan2(p.x-next.x,p.z-next.z);z=-1;sprint=ai.role<3;}else yaw=p.yaw+Math.sin(time*.6+ai.phase)*.008;
 }
 // Personal space prevents a squad from occupying the same route point.
 let repelX=0,repelZ=0;for(const other of r.players.values()){if(other.id===p.id||other.hp<=0)continue;const dx=p.x-other.x,dz=p.z-other.z,dist=Math.hypot(dx,dz);if(dist>.03&&dist<1.2){repelX+=dx/dist*(1.2-dist);repelZ+=dz/dist*(1.2-dist);}}
 x=clamp(x+Math.cos(yaw)*repelX-Math.sin(yaw)*repelZ,-1,1);z=clamp(z+Math.sin(yaw)*repelX+Math.cos(yaw)*repelZ,-1,1);
 return{x,z,yaw,pitch,fire:fire&&Math.sin(time*(1.1+ai.phase*.04)+ai.phase)>level.burst,jump:false,crouch:!!(fire&&ai.role===4),aim:!!target?.visible,sprint,reload:p.ammo===0,weapon:p.primary||p.secondary,grenade:!!(target?.visible&&p.grenades>0&&target.dist>9&&target.dist<18&&ai.role===0&&time>p.nextFire+1)};
}
