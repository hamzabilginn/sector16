import * as THREE from 'three';
import {weaponPads} from '/shared/pickups.mjs';
import {WEAPONS} from '/shared/world.mjs';

export function pickupVisuals(scene,{send,touchDevice}){
 const root=new THREE.Group();scene.add(root);
 const button=document.createElement('button');button.id='pickupWeapon';button.hidden=true;button.className='pickup-weapon';document.body.append(button);
 let signature='',pads=[],nearest=null,flash=0,lastRequest=0;
 button.onclick=()=>{if(nearest&&performance.now()-lastRequest>700){lastRequest=performance.now();send({type:'pickup',id:nearest.id})}};
 document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!button.hidden&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();button.click()}});
 function clear(){root.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose()}});root.clear();pads=[];nearest=null;button.hidden=true}
 function build(mode,map){
  clear();pads=weaponPads(mode,map).map(p=>{
   const group=new THREE.Group();group.position.set(p.x,0,p.z);root.add(group);
   const color=p.team==='blue'?0x59caff:0xffab64;
   const metal=new THREE.MeshStandardMaterial({color:0x28323b,metalness:.8,roughness:.28});
   const accent=new THREE.MeshStandardMaterial({color,metalness:.55,roughness:.3});
   const piece=(parent,w,h,d,x,y,z,mat=metal)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat.clone());m.position.set(x,y,z);parent.add(m);return m};
   piece(group,1.7,.10,1.7,0,.05,0);
   const ring=new THREE.Mesh(new THREE.RingGeometry(.79,.87,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.11;group.add(ring);
   const gun=new THREE.Group();group.add(gun);
   const pistol=p.weapon==='deagle',sniper=p.weapon==='awp',short=p.weapon==='smg';
   piece(gun,.13,.16,pistol?.42:.65,0,0,0);
   piece(gun,.09,.30,.12,0,-.20,.16).rotation.x=-.2;
   piece(gun,.10,.30,.15,0,-.20,-.12,accent).rotation.x=.18;
   piece(gun,.05,.05,sniper?.75:pistol?.18:.42,0,.02,sniper?-.66:pistol?-.27:-.48);
   if(!pistol){piece(gun,.12,.15,short?.22:.38,0,0,.46,accent);piece(gun,.13,.11,.28,0,0,-.38,accent);for(let i=0;i<5;i++)piece(gun,.15,.03,.025,0,.09,-.28-i*.045);}
   if(sniper){piece(gun,.08,.08,.10,0,.15,0);const scope=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.38,12),metal.clone());scope.rotation.x=Math.PI/2;scope.position.set(0,.22,-.12);gun.add(scope);}
   if(p.weapon==='m249'){piece(gun,.26,.26,.24,-.04,-.18,-.08,accent);piece(gun,.18,.06,.50,0,.14,-.12);}
   if(p.weapon==='m4')piece(gun,.075,.075,.23,0,.02,-.76);
   if(p.weapon==='shotgun')piece(gun,.06,.06,.5,0,-.07,-.44,accent);
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#0b141de6';ctx.fillRect(0,0,512,96);ctx.fillStyle=p.team==='blue'?'#59caff':'#ffab64';ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.fillText(WEAPONS[p.weapon].name,256,40);ctx.font='20px Arial';ctx.fillStyle='#fff';ctx.fillText('TAKIM İKMALİ · ÜCRETSİZ',256,76);
   const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));label.position.y=1.65;label.scale.set(2.5,.47,1);group.add(label);
   metal.dispose();accent.dispose();return {...p,group,gun,ring,label};
  });
 }
 return {
  update(state,body,active,now){
   const next=state?state.map+':'+state.mode:'';if(next!==signature){signature=next;if(state)build(state.mode,state.map);else clear()}
   root.visible=!!state;nearest=null;let distance=2.2;
   for(const p of pads){p.gun.position.y=.65+Math.sin(now*.002+p.x)*.10;p.gun.rotation.set(.08,now*.0005,Math.sin(now*.0015)*.07);p.ring.material.opacity=.55+Math.sin(now*.004)*.2;p.label.visible=!!body&&Math.hypot(body.x-p.x,body.z-p.z)<13;
    const d=body?Math.hypot(body.x-p.x,body.z-p.z):Infinity;
    if(active&&body?.hp>0&&body.y<=1.2&&body.team===p.team&&body.primary!==p.weapon&&body.secondary!==p.weapon&&d<distance&&!state.restart&&!['roundEnd','matchEnd'].includes(state.phase)){nearest=p;distance=d;}
   }
   button.hidden=!nearest;if(nearest)button.textContent=(touchDevice?'SİLAHI AL':'F · SİLAHI AL')+' — '+WEAPONS[nearest.weapon].name;
  },
  received(){flash=performance.now()},
  animateEquip(gun,now){const t=(now-flash)/450;if(flash&&t>=0&&t<1){const a=1-t;gun.position.y-=a*.32;gun.rotation.z-=Math.sin(t*Math.PI)*.35;gun.rotation.x+=a*.4}}
 };
}
