import {baseZone} from './world.mjs';
export const FLAG_BASES={blue:{x:0,y:0,z:30},orange:{x:0,y:0,z:-30}};
export function initialFlags(map){return Object.fromEntries(Object.entries(FLAG_BASES).map(([team,pos])=>[team,{team,...pos,z:(team==='blue'?1:-1)*(baseZone(map).z+2),homeZ:(team==='blue'?1:-1)*(baseZone(map).z+2),carrier:null,returnAt:0}]))}
export function resetFlag(flag){Object.assign(flag,{...FLAG_BASES[flag.team],z:flag.homeZ??FLAG_BASES[flag.team].z},{carrier:null,returnAt:0})}
export function dropFlags(room,player,time){if(!room.flags)return;for(const flag of Object.values(room.flags))if(flag.carrier===player.id)Object.assign(flag,{carrier:null,x:player.x,y:player.y,z:player.z,returnAt:time+20})}
export function updateFlags(room,time,emit){if(room.restart)return;const flags=room.flags;if(!flags)return;
 for(const flag of Object.values(flags)){if(flag.returnAt&&time>=flag.returnAt){resetFlag(flag);emit({type:'flag',kind:'return',team:flag.team})}if(flag.carrier){const p=room.players.get(flag.carrier);if(!p||p.hp<=0){if(p)dropFlags(room,p,time);else resetFlag(flag)}else{flag.x=p.x;flag.y=p.y;flag.z=p.z}}}
 for(const p of room.players.values()){if(p.hp<=0)continue;const own=flags[p.team],enemy=flags[p.team==='blue'?'orange':'blue'];const near=f=>Math.hypot(p.x-f.x,p.z-f.z)<1.7;
 if(!own.carrier&&own.returnAt&&near(own)){resetFlag(own);emit({type:'flag',kind:'return',team:p.team,name:p.name})}
 if(!enemy.carrier&&near(enemy)){enemy.carrier=p.id;enemy.returnAt=0;emit({type:'flag',kind:'taken',team:enemy.team,name:p.name})}
 if(enemy.carrier===p.id&&!own.carrier&&!own.returnAt&&near({...FLAG_BASES[p.team],z:own.homeZ??FLAG_BASES[p.team].z})){room.scores[p.team]++;p.captures=(p.captures||0)+1;resetFlag(enemy);emit({type:'flag',kind:'capture',team:p.team,name:p.name})}
 }
}
