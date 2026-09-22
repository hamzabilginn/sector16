// Collision geometry for the large, walkable city. Shared by browser and server.
const boxes=[];
const box=(x,y,z,w,h,d,kind='citywall',color=0x929b9b)=>boxes.push({x,y,z,w,h,d,kind,color});
for(const x of [-65,65])box(x,7,0,2,14,146,'boundary');
for(const z of [-73,73])box(0,7,z,128,14,2,'boundary');
const buildings=[];
for(const x of [-30,30])for(const z of [-38,-10,18,46]){
 const color=z<0?0x8c9caa:0xb2a28b;buildings.push({x,z,color});
 // Two wide ground-level doors, interior partition, roof and an exterior staircase.
 for(const side of [-1,1]){
  box(x+side*10,1.875,z,.5,3.75,18,'citywall',color);
  for(const dx of [-6.2,6.2])box(x+dx,1.875,z+side*9,7.6,3.75,.5,'citywall',color);
  box(x,3.25,z+side*9,4.8,1,.5,'citywall',color);
 }
 box(x-3,1.4,z,10,2.8,.4,'citywall',color);
 box(x,3.875,z,20.5,.25,18.5,'roof',0x56636c);
 for(let i=0;i<16;i++){const h=(i+1)*.25;box(x+11.7,h/2,z-8.75+i*.5,2.8,h,.5,'stair',0x9da7ad);}
 box(x+10.8,3.875,z,4.5,.25,2,'roof');
 for(const dx of [-10,10]){if(dx===10){for(const dz of [-5,5])box(x+dx,4.45,z+dz,.3,.9,6,'rail',0x66747c);}else box(x+dx,4.45,z,.3,.9,18,'rail',0x66747c);}
 for(const dz of [-9,9])box(x,4.45,z+dz,20,.9,.3,'rail',0x66747c);
 box(x-5,4.55,z-4,3,1.1,2,'vent',0x596b72);
 box(x+4,.7,z+4,2,1.4,2,'crate',0x9d8055);
}
// Two roof bridges; the road beneath remains open.
for(const x of [-30,30])for(const z of [-24,32]){
 box(x,3.875,z,3,.25,10,'roof');
 // Openings in roof parapets at bridge entrances.
 for(const end of [-5,5]){const wall=boxes.find(b=>b.kind==='rail'&&b.x===x&&b.z===z+end&&b.w===20);if(wall){boxes.splice(boxes.indexOf(wall),1);for(const dx of [-5.9,5.9])box(x+dx,4.45,z+end,8.2,.9,.3,'rail',0x66747c);}}
 for(const dx of [-1.5,1.5])box(x+dx,4.45,z,.18,.9,10,'rail',0x66747c);
}
// High east-west skywalks tie opposite roof lines together above open streets.
for(const buildingZ of [-38,18]){
 const z=buildingZ+5;
 const east=boxes.find(b=>b.kind==='rail'&&b.x===-20&&b.z===buildingZ+5&&b.d===6);
 if(east)boxes.splice(boxes.indexOf(east),1);
 const west=boxes.find(b=>b.kind==='rail'&&b.x===20&&b.z===buildingZ&&b.d===18);
 if(west){boxes.splice(boxes.indexOf(west),1);box(20,4.45,buildingZ-3.5,.3,.9,11,'rail',0x66747c);box(20,4.45,buildingZ+8.5,.3,.9,1,'rail',0x66747c);}
 box(0,3.875,z,40,.25,3,'roof',0x52636c);
 for(const dz of [-1.5,1.5])box(0,4.45,z+dz,40,.9,.18,'rail',0x66747c);
}
// Off-centre checkpoints and service lanes break long sight lines.
for(const [x,z,w,d] of [[-14,-47,3,10],[14,-47,3,10],[-12,-3,3,9],[12,4,3,9],[-14,46,3,8],[14,45,3,8]]){
 box(x,1.15,z,w,2.3,d,'barrier',0x677c83);
 box(x+Math.sign(x)*2,.45,z+Math.sign(z)*4,2,.9,2,'crate',0xa38559);
}
box(-8,1.4,-20,5,2.8,5,'kiosk',0x587983);
box(10,1.4,23,5,2.8,5,'kiosk',0xa88362);
for(const [x,z] of [[-17,-55],[18,-28],[-19,2],[16,39],[-14,57]])box(x,.65,z,3,1.3,5,'truck',0x575f59);
// Central market arcades, divided lanes and side service yards.
for(const z of [-32,-12,12,32]){
 for(const x of [-7,7]){box(x,.6,z,5,1.2,2.5,'crate',0xa08761);box(x,3.15,z,6,.25,4,'awning',z<0?0x46798c:0xb27350);for(const dx of [-2.8,2.8])box(x+dx,1.5,z+.9,.13,3,.13,'pole');}
}
for(const x of [-53,53])for(const z of [-48,-20,8,36]){
 box(x,1.25,z,5,2.5,8,'container',x<0?0x44727d:0x9c744d);
 box(x-4,.55,z+7,3,1.1,2,'barrier');
}
for(const z of [-56,58])for(const x of [-12,12])box(x,.7,z,6,1.4,1.5,'barrier');
box(0,.55,0,8,1.1,8,'fountain',0x819fa6);
export const CITY={id:'city',name:'Karmaşa Şehri',description:'128 × 144 m · 8 iç mekân · 6 çatı köprüsü, geçitler, pazar ve arka sokaklar',width:128,depth:144,baseZ:66,baseHalfWidth:60,baseDepth:10,boxes,buildings,spawns:{blue:[[-48,66],[-24,66],[0,66],[24,66],[48,66]],orange:[[48,-66],[24,-66],[0,-66],[-24,-66],[-48,-66]]},bombSites:[{id:'A',x:-51,z:23,radius:4},{id:'B',x:9,z:46,radius:4}],floor:0x505c63,sky:0x9bb2c2};
