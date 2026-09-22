import {WEAPONS,baseZone} from './world.mjs';
export const ATTACHMENTS={suppressor:{name:'Susturucu',short:'SUS',color:0x7ed9c3},scope:{name:'2× Dürbün',short:'2×',color:0x8ecaff},extended:{name:'Geniş Şarjör',short:'ŞARJÖR+',color:0xffca7b}};
export function compatible(weapon,kind){return Object.hasOwn(ATTACHMENTS,kind)&&!!WEAPONS[weapon]&&!WEAPONS[weapon].melee&&(kind!=='scope'||['rifle','m4','smg','m249'].includes(weapon))&&(kind!=='suppressor'||weapon!=='shotgun')}
export function weaponStats(weapon,attachments={}){const w=WEAPONS[weapon];if(!w)return WEAPONS.pistol;const a=attachments[weapon]||{};return {...w,mag:a.extended&&compatible(weapon,'extended')?Math.ceil(w.mag*1.5):w.mag,suppressed:!!a.suppressor&&compatible(weapon,'suppressor'),scoped:!!a.scope&&compatible(weapon,'scope')};}
export function attachmentPads(mode,map='docks'){
 if(['arms','pistol','ffa','training'].includes(mode))return [];
 const base=baseZone(map);return ['blue','orange'].flatMap(team=>Object.keys(ATTACHMENTS).map((kind,i)=>({id:team+'-'+kind,kind,team,x:-16+i*16,y:0,z:(team==='blue'?1:-1)*(base.z-.8)})));
}
export function takeAttachment(p,id,now){
 const r=p.room,pad=attachmentPads(r?.mode,r?.map).find(p=>p.id===id);
 if(!r||!pad||p.hp<=0||pad.team!==p.team||r.restart||['roundEnd','matchEnd'].includes(r.phase))throw Error('Eklentiyi kendi takımının alanından al.');
 if(!Number.isFinite(p.y)||p.y>1.2||Math.hypot(p.x-pad.x,p.z-pad.z)>2.2)throw Error('Eklentiye biraz daha yaklaş.');
 if(!compatible(p.weapon,pad.kind))throw Error('Bu eklenti elindeki silaha uygun değil.');
 if(p.reloadAt)throw Error('Önce şarjör değiştirmeyi bitir.');
 if(now<(p.attachmentAt||0))throw Error('Eklenti almak için 2 saniye bekle.');
 p.attachments??={};const a=p.attachments[p.weapon]??={};if(a[pad.kind])throw Error('Bu eklenti zaten takılı.');
 a[pad.kind]=true;p.attachmentAt=now+2;
 return {...pad,weapon:p.weapon};
}
