export const isRoundMode=mode=>mode==='rounds'||mode==='bomb'||mode==='elimination';
export const BOMB_SITES=[{id:'A',x:-21,z:20,radius:3},{id:'B',x:21,z:20,radius:3}];
export const PLANT_SECONDS=3,DEFUSE_SECONDS=7,BOMB_SECONDS=40;
export function freshBomb(players){const attackers=[...players.values()].filter(p=>p.team==='orange'&&p.hp>0).sort((a,b)=>Number(a.bot)-Number(b.bot));const carrier=attackers[0];return {state:carrier?'carried':'dropped',carrier:carrier?.id||null,x:carrier?.x||0,y:0,z:carrier?.z??-28,site:null,plantBy:null,plantStart:0,defuseBy:null,defuseStart:0,detonateAt:0};}
export function dropBomb(room,p){const b=room.bomb;if(b?.carrier===p.id&&b.state==='carried'){Object.assign(b,{state:'dropped',carrier:null,x:p.x,y:p.y,z:p.z,plantBy:null,plantStart:0});}if(b?.defuseBy===p.id){b.defuseBy=null;b.defuseStart=0;}}
export function updateBomb(room,time,emit=()=>{}){
 const b=room.bomb;if(room.mode!=='bomb'||room.phase!=='live'||!b)return null;
 if(b.state==='planted'&&time>=b.detonateAt){b.state='exploded';b.defuseBy=null;emit({type:'bomb',kind:'exploded',position:{x:b.x,y:b.y,z:b.z}});return 'orange';}
 if(b.state==='carried'){const carrier=room.players.get(b.carrier);if(!carrier||carrier.hp<=0){if(carrier)dropBomb(room,carrier);else{b.carrier=null;b.state='dropped';b.plantBy=null;}}else{b.x=carrier.x;b.y=carrier.y;b.z=carrier.z;}}
 if(b.state==='dropped'){const p=[...room.players.values()].find(p=>p.team==='orange'&&p.hp>0&&Math.hypot(p.x-b.x,p.z-b.z)<1.5&&Math.abs(p.y-b.y)<1.5);if(p){b.carrier=p.id;b.state='carried';emit({type:'bomb',kind:'pickup',name:p.name});}}
 const still=p=>p&&p.hp>0&&p.input?.interact&&!p.input.fire&&!p.reloadAt&&Math.hypot(p.vx||0,p.vz||0)<.5&&p.ground;
 if(b.state==='carried'){
  const p=room.players.get(b.carrier),site=p&&BOMB_SITES.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<=s.radius&&p.y<.4);
  if(p?.team==='orange'&&site&&still(p)){
   if(b.plantBy!==p.id){b.plantBy=p.id;b.plantStart=time;}
   if(time-b.plantStart>=PLANT_SECONDS){Object.assign(b,{state:'planted',carrier:null,site:site.id,x:p.x,y:p.y,z:p.z,detonateAt:time+BOMB_SECONDS,plantBy:null});emit({type:'bomb',kind:'planted',site:site.id,position:{x:b.x,y:b.y,z:b.z}});}
  }else{b.plantBy=null;b.plantStart=0;}
 }
 if(b.state==='planted'){
  const valid=p=>p?.team==='blue'&&still(p)&&Math.hypot(p.x-b.x,p.z-b.z)<2&&Math.abs(p.y-b.y)<1.5;
  let p=room.players.get(b.defuseBy);if(!valid(p)){p=[...room.players.values()].find(valid);b.defuseBy=p?.id||null;b.defuseStart=p?time:0;}
  if(p&&time-b.defuseStart>=DEFUSE_SECONDS){b.state='defused';b.defuseBy=null;emit({type:'bomb',kind:'defused'});return 'blue';}
 }
 return null;
}
export function bombRoundWinner(room,time){const alive=t=>[...room.players.values()].some(p=>p.team===t&&p.hp>0);if(!alive('blue'))return 'orange';if(room.bomb?.state!=='planted'&&(!alive('orange')||time>=room.phaseEnd))return 'blue';return null;}
