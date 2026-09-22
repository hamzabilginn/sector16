import * as THREE from 'three';
export function buildCity(root,map){
 const materials=new Map();const mat=(color)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.87}));return materials.get(color)};
 const cube=new THREE.BoxGeometry(1,1,1),groups=new Map();
 const add=(b,color=b.color||0x87949b)=>{if(!groups.has(color))groups.set(color,[]);groups.get(color).push(b)};
 for(const b of map.boxes)add(b);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(map.width+2,map.depth+2),mat(map.floor));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);
 // Sidewalks and lane markings do not introduce invisible collision.
 for(const x of [-44,-16,16,44])add({x,y:.018,z:0,w:2,h:.025,d:126},0x849097);
 for(const x of [-8,8])for(let z=-60;z<=60;z+=6)add({x,y:.04,z,w:.13,h:.025,d:2.8},0xd4c39c);
 for(const z of [-47,-19,9,37])for(const x of [-17,17])add({x,y:.035,z,w:13,h:.025,d:.22},0x9da8aa);
 for(const b of map.buildings){for(const side of [-1,1])for(const dx of [-7,7])add({x:b.x+dx,y:2.2,z:b.z+side*9.26,w:1.8,h:1.15,d:.015},0x31566c);}
 for(const x of [-60,60])for(let z=-57;z<=57;z+=19){add({x,y:3,z,w:.15,h:6,d:.15},0x34434f);add({x,y:5.8,z,w:1.6,h:.12,d:.45},0xffdc9b);}
 const matrix=new THREE.Matrix4();for(const [color,items] of groups){const mesh=new THREE.InstancedMesh(cube,mat(color),items.length);items.forEach((b,i)=>{matrix.makeScale(b.w,b.h,b.d);matrix.setPosition(b.x,b.y,b.z);mesh.setMatrixAt(i,matrix)});mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 function sign(text,x,y,z,color,rotation=0){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#182630';ctx.fillRect(0,0,768,128);ctx.fillStyle=color;ctx.font='bold 58px Arial';ctx.textAlign='center';ctx.fillText(text,384,83);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(9,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;root.add(mesh);}
 sign('MAVİ ÜS / İKMAL',0,4,71,'#73cfff',Math.PI);sign('TURUNCU ÜS / İKMAL',0,4,-71,'#ffb57d');
 sign('PAZAR / MERKEZ',0,4,-32,'#efdb9d');
 for(const b of map.buildings)sign((b.x<0?'BATI':'DOĞU')+' / '+(Math.round((b.z+38)/28)+1),b.x,2.8,b.z+9.3,'#d7e8ed');
 return root;
}
