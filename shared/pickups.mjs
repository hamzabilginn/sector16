import {WEAPONS,inOwnBase} from './world.mjs';

const arsenal=['smg','rifle','m4','awp','shotgun','deagle'];
export function weaponPads(mode){
 if(['training','arms','sniper','pistol','ffa'].includes(mode))return [];
 return ['blue','orange'].flatMap(team=>arsenal.map((weapon,i)=>({id:team+'-'+weapon,team,weapon,x:-20+i*8,z:team==='blue'?30:-30,y:0})));
}
export function takeWeapon(p,id,now){
 const r=p.room,pad=weaponPads(r?.mode).find(x=>x.id===id);
 if(!r||!pad||pad.team!==p.team||p.hp<=0||!inOwnBase(p)||r.restart||['roundEnd','matchEnd'].includes(r.phase))throw Error('Silahı almak için kendi takımının alanında ve hayatta olmalısın.');
 if(Math.hypot(p.x-pad.x,p.z-pad.z)>2.2||p.y>1.2)throw Error('Silaha biraz daha yaklaş.');
 if(now<(p.pickupAt||0))throw Error('Tekrar silah almak için birkaç saniye bekle.');
 const w=WEAPONS[pad.weapon];
 if(p.inventory[pad.weapon])throw Error('Bu silah zaten sende.');
 if(p[w.slot])delete p.inventory[p[w.slot]];
 p[w.slot]=pad.weapon;p.inventory[pad.weapon]={ammo:w.mag,reserve:w.reserve};
 p.weapon=pad.weapon;p.ammo=w.mag;p.reserve=w.reserve;p.reloadAt=0;p.nextFire=Math.max(p.nextFire||0,now+.45);p.pickupAt=now+20;
 return pad;
}
