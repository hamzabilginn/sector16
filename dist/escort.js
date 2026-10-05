import * as THREE from 'three';
import {escortRoute} from '/shared/escort.mjs';
export function escortVisuals(scene){
 const root=new THREE.Group();scene.add(root);const cart=new THREE.Group();root.add(cart);
 const metal=new THREE.MeshStandardMaterial({color:0x536970,metalness:.62,roughness:.42}),dark=new THREE.MeshStandardMaterial({color:0x27343a,metalness:.6,roughness:.48}),orange=new THREE.MeshStandardMaterial({color:0xdb8748,metalness:.4,roughness:.45});
 const box=(parent,w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m};
 box(cart,2.1,.5,3.1,0,.65,0,metal);box(cart,1.5,.65,1.4,0,1.2,.12,orange);box(cart,1.2,.22,.85,0,1.6,.25,dark);
 for(const x of [-1.08,1.08])for(const z of [-1.05,1.05]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.22,12),dark);w.rotation.z=Math.PI/2;w.position.set(x,.38,z);cart.add(w)}
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:0xffbd65}));beacon.position.set(0,1.78,-.2);cart.add(beacon);
 const routeGroup=new THREE.Group();root.add(routeGroup);for(const point of escortRoute('depot')){const mark=new THREE.Mesh(new THREE.RingGeometry(.5,.6,20),new THREE.MeshBasicMaterial({color:0xeaa360,side:THREE.DoubleSide,transparent:true,opacity:.65}));mark.rotation.x=-Math.PI/2;mark.position.set(point.x,.035,point.z);routeGroup.add(mark)}
 let target=null;root.visible=false;
 return {update(s){root.visible=s?.mode==='escort'&&!!s.escort;if(!root.visible)return;target=s.escort;routeGroup.visible=target.progress<1;},animate(dt){if(!root.visible||!target)return;const a=1-Math.exp(-dt*15);cart.position.x+=(target.x-cart.position.x)*a;cart.position.z+=(target.z-cart.position.z)*a;cart.rotation.y+=(((target.yaw-cart.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI)*a;beacon.material.color.setHex(target.contested?0xff5544:target.attackers?0x8cf48f:0xffbd65);}};
}
