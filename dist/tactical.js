import * as THREE from 'three';
import {BOMB_SITES,bombSites} from '/shared/bomb.mjs';
export function tacticalVisuals(scene){
 const root=new THREE.Group();scene.add(root);const sites=new THREE.Group();root.add(sites);
 for(const site of BOMB_SITES){const g=new THREE.Group();g.position.set(site.x,.025,site.z);const ring=new THREE.Mesh(new THREE.RingGeometry(site.radius-.08,site.radius,64),new THREE.MeshBasicMaterial({color:0xffce69,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;g.add(ring);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffcd70';ctx.font='bold 100px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(site.id,64,67);const label=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,side:THREE.DoubleSide}));label.rotation.x=-Math.PI/2;label.position.y=.01;g.add(label);sites.add(g);}
 const bomb=new THREE.Group();const caseMesh=new THREE.Mesh(new THREE.BoxGeometry(.36,.16,.25),new THREE.MeshStandardMaterial({color:0x494b38,roughness:.65}));caseMesh.position.y=.12;caseMesh.castShadow=true;bomb.add(caseMesh);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(.13,.02,.085),new THREE.MeshBasicMaterial({color:0x8de682}));screen.position.set(0,.21,0);bomb.add(screen);
 for(const x of [-.13,.13]){const charge=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,.30,10),new THREE.MeshStandardMaterial({color:0x95805d}));charge.rotation.z=Math.PI/2;charge.position.set(0,.10,x);bomb.add(charge);}
 const led=new THREE.PointLight(0xff4230,.6,3);led.position.y=.28;bomb.add(led);root.add(bomb);
 const grenades=new Map(),geo=new THREE.SphereGeometry(.095,10,8),mat=new THREE.MeshStandardMaterial({color:0x485036,roughness:.6,metalness:.3});let state=null;
 function update(s){state=s;const positions=bombSites(s?.map);sites.children.forEach((g,i)=>{g.position.x=positions[i].x;g.position.z=positions[i].z;g.scale.setScalar(positions[i].radius/BOMB_SITES[i].radius)});sites.visible=s?.mode==='bomb';bomb.visible=sites.visible&&['dropped','planted'].includes(s?.bomb?.state);if(bomb.visible)bomb.position.set(s.bomb.x,s.bomb.y,s.bomb.z);const ids=new Set();for(const g of s?.grenades||[]){ids.add(g.id);let mesh=grenades.get(g.id);if(!mesh){mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;root.add(mesh);grenades.set(g.id,mesh);}mesh.position.set(g.x,g.y,g.z);mesh.rotation.x+=.4;}for(const [id,g] of grenades)if(!ids.has(id)){root.remove(g);grenades.delete(id);}}
 function animate(now){if(bomb.visible&&state?.bomb?.state==='planted'){led.intensity=Math.sin(now*.012)>0?1.3:.05;screen.material.color.setHex(Math.sin(now*.012)>0?0xff6c45:0x37180e);}else{led.intensity=0;screen.material.color.setHex(0x8de682);}}
 update(null);return{update,animate};
}
