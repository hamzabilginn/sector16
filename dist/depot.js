import * as THREE from 'three';
export function buildDepot(root,map){
 const palette=new Map(),groups=new Map(),cube=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();
 const mat=color=>{if(!palette.has(color))palette.set(color,new THREE.MeshStandardMaterial({color,roughness:.85,metalness:color===0x477180?.32:0}));return palette.get(color)};
 const add=(b,color=b.color||0x788792)=>{if(!groups.has(color))groups.set(color,[]);groups.get(color).push(b)};
 for(const b of map.boxes)add(b);
 for(const x of [-3.2,3.2])add({x,y:.022,z:0,w:.16,h:.04,d:78},0xb1a787);
 for(let z=-38;z<=38;z+=2)add({x:0,y:.018,z,w:8,h:.035,d:.17},0x777c72);
 for(const z of [-38,-12,13,38])for(const x of [-40,40]){add({x,y:2.7,z,w:.15,h:5.4,d:.15},0x35444c);add({x,y:5.4,z,w:1.5,h:.12,d:.45},0xf4dfa7)}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,102),mat(map.floor));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);
 for(const [color,items] of groups){const mesh=new THREE.InstancedMesh(cube,mat(color),items.length);items.forEach((b,i)=>{matrix.makeScale(b.w,b.h,b.d);matrix.setPosition(b.x,b.y,b.z);mesh.setMatrixAt(i,matrix)});mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh)}
 return root;
}
