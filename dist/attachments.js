import * as THREE from 'three';
import {attachmentPads,ATTACHMENTS,compatible} from '/shared/attachments.mjs';
export function attachmentVisuals(scene,{send,touchDevice}){
 const root=new THREE.Group();scene.add(root);const button=document.createElement('button');button.id='pickupAttachment';button.className='pickup-weapon attachment-pickup';button.hidden=true;document.body.append(button);
 const status=document.createElement('div');status.id='attachmentStatus';status.hidden=true;document.getElementById('hud').append(status);
 let signature='',pads=[],nearest=null,lastRequest=0;
 button.onclick=()=>{if(nearest&&performance.now()-lastRequest>700){send({type:'attachment',id:nearest.id});lastRequest=performance.now()}};
 document.addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat&&!button.hidden&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();button.click()}});
 function clear(){root.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose()});root.clear();pads=[];button.hidden=true;}
 function build(state){clear();pads=attachmentPads(state.mode,state.map).map(p=>{
  const g=new THREE.Group();g.position.set(p.x,0,p.z);root.add(g);const def=ATTACHMENTS[p.kind];
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.16,.8),new THREE.MeshStandardMaterial({color:0x26333f,metalness:.5,roughness:.5}));base.position.y=.08;g.add(base);
  const model=new THREE.Group();g.add(model);const material=new THREE.MeshStandardMaterial({color:def.color,metalness:.65,roughness:.3});
  const part=new THREE.Mesh(p.kind==='extended'?new THREE.BoxGeometry(.18,.4,.16):new THREE.CylinderGeometry(p.kind==='scope'?.10:.07,p.kind==='scope'?.10:.07,.45,12),material);part.rotation.x=p.kind==='extended'?0:Math.PI/2;model.add(part);
  if(p.kind==='scope'){const glass=new THREE.Mesh(new THREE.CircleGeometry(.086,16),new THREE.MeshBasicMaterial({color:0x45beff}));glass.position.z=.23;model.add(glass);}
  const c=document.createElement('canvas');c.width=384;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#12212ee8';ctx.fillRect(0,0,384,80);ctx.fillStyle='#'+def.color.toString(16);ctx.font='bold 30px Arial';ctx.textAlign='center';ctx.fillText(def.name,192,48);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false}));label.position.y=1.4;label.scale.set(2.4,.5,1);g.add(label);return {...p,g,model,label};
 });}
 return {update(state,body,active,now){const next=state?state.map+':'+state.mode:'';if(next!==signature){signature=next;if(state)build(state);else clear()}root.visible=!!state;nearest=null;let distance=2.2;for(const p of pads){p.model.position.y=.65+Math.sin(now*.002+p.x)*.08;p.model.rotation.y=now*.0007;p.label.visible=!!body&&Math.hypot(body.x-p.x,body.z-p.z)<13;const d=body?Math.hypot(body.x-p.x,body.z-p.z):Infinity;if(active&&body?.hp>0&&body.y<1.2&&p.team===body.team&&compatible(body.weapon,p.kind)&&!body.attachments?.[body.weapon]?.[p.kind]&&d<distance&&!state.restart&&!['roundEnd','matchEnd'].includes(state.phase)){nearest=p;distance=d;}}
 button.hidden=!nearest;if(nearest)button.textContent=(touchDevice?'TAK':'T · TAK')+' — '+ATTACHMENTS[nearest.kind].name;
 const equipped=Object.keys(body?.attachments?.[body.weapon]||{}).filter(k=>ATTACHMENTS[k]);status.hidden=!state||!equipped.length;status.textContent=equipped.map(k=>ATTACHMENTS[k].short).join(' · ');
 }};
}
export function addWeaponAttachments(root,type,a={}){
 if(type==='knife')return;const group=new THREE.Group();root.add(group);const metal=new THREE.MeshStandardMaterial({color:0x27353a,metalness:.8,roughness:.3});
 if(a.suppressor&&compatible(type,'suppressor')){const m=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.22,12),metal);m.rotation.x=Math.PI/2;m.position.set(0,.018,root.userData.muzzle-.10);group.add(m);root.userData.muzzle-=.22;}
 if(a.scope&&compatible(type,'scope')){const m=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.23,16),metal);m.rotation.x=Math.PI/2;m.position.set(0,.16,-.13);group.add(m);const lens=new THREE.Mesh(new THREE.CircleGeometry(.04,16),new THREE.MeshBasicMaterial({color:0x329fcb}));lens.position.set(0,.16,-.013);group.add(lens);}
 if(a.extended&&root.userData.rig){root.userData.rig.magazine.scale.y=1.5;}
 if(!group.children.length)metal.dispose();group.userData.attachment=true;
}
