import {buildCity} from '/city.js';
import * as THREE from 'three';
import {MAPS} from '/shared/world.mjs';
export function buildArena(scene,id){const map=MAPS[id]||MAPS.docks;const BOXES=map.boxes;const root=new THREE.Group();scene.add(root);paintBases(root,map);scene.background=new THREE.Color(map.sky);scene.fog=new THREE.FogExp2(map.sky,id==='city'?.003:.009);if(id==='city')return buildCity(root,map);if(id!=='docks'){buildThemed(root,map);return root}
function noiseTexture(base,line=false){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,256);let seed=37;for(let i=0;i<10000;i++){seed=(seed*16807)%2147483647;const x=seed%256;seed=(seed*16807)%2147483647;const y=seed%256;ctx.fillStyle=i%2?'#0000000b':'#ffffff0b';ctx.fillRect(x,y,2,2)}if(line){ctx.strokeStyle='#00000025';ctx.lineWidth=2;ctx.strokeRect(2,2,252,252)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const concrete=noiseTexture('#9b9a8d'),asphalt=noiseTexture('#696f6a',true);asphalt.repeat.set(24,26);const steelMat=new THREE.MeshStandardMaterial({color:0x323e42,roughness:.64,metalness:.65});const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,100),new THREE.MeshStandardMaterial({map:asphalt,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);
function box(w,h,d,x,y,z,material,parent=root){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function mat(color,roughness=.85,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function label(text,color='#ecdec0',bg='#263235',width=512){const c=document.createElement('canvas');c.width=width;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,128);ctx.fillStyle=color;ctx.font='bold 64px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,67);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:texture})}
for(const b of BOXES){const m=b.kind==='container'?mat(b.color,.68,.35):b.kind==='crate'?mat(0x8e7953):b.kind==='barrier'?mat(0xb5ac88):new THREE.MeshStandardMaterial({map:concrete,color:b.kind==='building'?0xc3c4b5:0x8f9e98,roughness:1});box(b.w,b.h,b.d,b.x,b.y,b.z,m);if(b.kind==='container'){const rib=mat(b.color,.68,.4);if(b.w>b.d){for(let x=-b.w/2+.3;x<b.w/2;x+=.5){box(.09,b.h-.18,.08,b.x+x,b.y,b.z-b.d/2-.03,rib);box(.09,b.h-.18,.08,b.x+x,b.y,b.z+b.d/2+.03,rib)}}else{for(let z=-b.d/2+.3;z<b.d/2;z+=.5){box(.08,b.h-.18,.09,b.x-b.w/2-.03,b.y,b.z+z,rib);box(.08,b.h-.18,.09,b.x+b.w/2+.03,b.y,b.z+z,rib)}}box(b.w+.04,.12,b.d+.04,b.x,b.y+b.h/2,b.z,steelMat);box(b.w+.04,.12,b.d+.04,b.x,b.y-b.h/2+.1,b.z,steelMat);}
if(b.kind==='crate'){for(const dx of [-b.w*.38,b.w*.38])box(.14,b.h+.03,b.d+.04,b.x+dx,b.y,b.z,mat(0x3d4540));for(const dy of [-b.h*.36,b.h*.36])box(b.w+.04,.13,b.d+.04,b.x,b.y+dy,b.z,mat(0x64593e));}
if(b.kind==='barrier'){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(b.w,.18),mat(0xc4a650));stripe.position.set(b.x,b.y+.2,b.z+b.d/2+.006);root.add(stripe)}}
// Central utility building and readable route signage.
box(8.5,.22,10.5,0,4.1,0,mat(0x435a58));box(2,.7,2,1.8,4.55,1,steelMat);box(1.2,1,2,-2,4.7,-2,steelMat);
for(const side of [-1,1]){box(1.8,2.6,.05,0,1.3,side*5.03,mat(0x344c4d));for(const x of [-2.7,2.7])box(1.3,.7,.08,x,2.7,side*5.07,mat(0x223f49,.25,.7));const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),label(side===1?'SECTOR 16':'DOCK / 04'));sign.position.set(0,3.35,side*5.075);if(side===-1)sign.rotation.y=Math.PI;root.add(sign)}
for(const [z,color,text]of [[31.92,'#77ceff','BLUE / 01'],[-31.92,'#ffa674','ORANGE / 02']]){const sign=new THREE.Mesh(new THREE.PlaneGeometry(9,2.25),label(text,color,'#253336'));sign.position.set(0,3.7,z);if(z>0)sign.rotation.y=Math.PI;root.add(sign)}
// Painted lanes and spawn pads are flat: collision remains identical on both sides.
const paint=mat(0xc6b764);for(const x of [-10.8,10.8])for(let z=-28;z<30;z+=4){const strip=new THREE.Mesh(new THREE.PlaneGeometry(.12,2),paint);strip.rotation.x=-Math.PI/2;strip.position.set(x,.012,z);root.add(strip)}
for(const [z,color]of [[28,0x368cba],[-28,0xc47745]]){const pad=new THREE.Mesh(new THREE.RingGeometry(2.2,2.3,48),mat(color));pad.rotation.x=-Math.PI/2;pad.position.set(15*(z>0?1:-1),.014,z);root.add(pad)}
// Industrial skyline beyond the playable boundary.
const distant=mat(0x4b6568);for(let n=0;n<12;n++){const h=5+(n*7%11);box(6,h,8,-43+n*8,h/2,-46,distant)}
const craneMat=mat(0xb4914d,.6,.4);for(const x of [-24,24]){box(.8,22,.8,x,11,-37,craneMat);box(.8,22,.8,x,11,-41,craneMat)}box(51,1.1,5,0,22,-39,craneMat);box(.2,11,.2,7,16,-38,steelMat);box(2,.5,1.4,7,10.5,-38,steelMat);
for(const [x,z]of [[-27,23],[27,-23],[-27,-23],[27,23]]){box(.14,7,.14,x,3.5,z,steelMat);box(1.4,.16,.4,x,7,z,steelMat);const lightMesh=box(.9,.06,.3,x,6.88,z,new THREE.MeshBasicMaterial({color:0xffeac0}));lightMesh.castShadow=false;}

return root}
function buildThemed(root,map){
 const ice=map.id==='iceworld';
 function material(color,roughness=.9,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
 function block(b,m){const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.w,b.h,b.d),m);mesh.position.set(b.x,b.y,b.z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh}
 const snow=material(0xe7f4f6,.68),stone=material(ice?0x91c5d7:0xc8ad7b,ice?.30:.96),trim=material(ice?0x537f96:0x8d734d),wood=material(0x826442),metal=material(0x443f33,.7,.3);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,100),material(map.floor,ice?.46:.98));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);
 for(const b of map.boxes){const m=b.kind==='crate'||b.kind==='door'?wood:stone;block(b,m);
 if(b.kind==='crate'||b.kind==='door'){for(const dx of [-b.w*.38,b.w*.38])block({...b,x:b.x+dx,w:.1,d:b.d+.03},metal);for(const dy of [-b.h*.35,b.h*.35])block({...b,y:b.y+dy,h:.12,w:b.w+.03,d:b.d+.03},metal)}
 else{block({...b,y:b.y+b.h/2+.05,h:.1,w:b.w+.12,d:b.d+.12},ice?snow:trim);
 if(ice){for(let y=.8;y<b.h;y+=.9){block({...b,y,h:.025,w:b.w+.016,d:b.d+.016},trim)}}
 else if(b.kind==='sand'){for(let x=-b.w/2+1;x<b.w/2;x+=2.2){const window=new THREE.Mesh(new THREE.PlaneGeometry(.65,.95),material(0x4b655e));window.position.set(b.x+x,Math.min(2.8,b.h-.6),b.z+b.d/2+.012);root.add(window);const back=window.clone();back.rotation.y=Math.PI;back.position.z=b.z-b.d/2-.012;root.add(back)}}}}
 function sign(text,x,y,z,rotation,color){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=ice?'#294658':'#e1c997';ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='bold 54px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.375),new THREE.MeshBasicMaterial({map:texture}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;root.add(mesh)}
 sign(ice?'FROST / 01':'UZUN / A',0,3.3,31.94,Math.PI,ice?'#b1edff':'#8e3d24');
 sign(ice?'FROST / 02':'ORTA / B',0,3.3,-31.94,0,ice?'#ffcdab':'#36584f');
 if(!ice){sign('A  →',14,3,15.02,0,'#a14b29');sign('←  B',-13,3,-20.02,Math.PI,'#38594e');
 // Domed skyline sits outside the playable space.
 for(const x of [-38,38]){block({x,y:5,z:-38,w:6,h:10,d:6},stone);const dome=new THREE.Mesh(new THREE.SphereGeometry(3.2,20,12,0,Math.PI*2,0,Math.PI/2),material(0x577b76));dome.position.set(x,10,-38);root.add(dome)}
 }else{
 for(let n=0;n<11;n++){const mountain=new THREE.Mesh(new THREE.ConeGeometry(7+(n%3),12+n%4*3,5),snow);mountain.position.set(-45+n*9,3,-49);root.add(mountain)}
 }
 // A low-contrast tile grid provides scale and readable movement cues.
 const grid=new THREE.GridHelper(64,32,ice?0x9ec6d4:0xaa9066,ice?0xb8d6df:0xb59b71);grid.position.y=.005;root.add(grid);
}

function paintBases(root,map){const center=map.baseZ||28,width=(map.baseHalfWidth||27.5)*2,depth=map.baseDepth||8;for(const [z,color]of [[center,0x60bbef],[-center,0xf39b63]]){const zone=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.set(0,.018,z);root.add(zone);const edge=new THREE.Mesh(new THREE.PlaneGeometry(width,.1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));edge.rotation.x=-Math.PI/2;edge.position.set(0,.021,z>0?center-depth/2:-center+depth/2);root.add(edge)}}
