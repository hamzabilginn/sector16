// Compact depot: 88 × 100 metres, with three clear escort lanes.
const boxes=[];const add=(x,y,z,w,h,d,kind='depotwall',color=0x798994)=>boxes.push({x,y,z,w,h,d,kind,color});
for(const x of [-45,45])add(x,4,0,2,8,102,'boundary');
for(const z of [-51,51])add(0,4,z,88,8,2,'boundary');
for(const x of [-27,27])for(const z of [-22,22]){
 const color=x<0?0x728698:0xa48a6d;
 add(x,3.2,z,14,6.4,14,'warehouse',color);
 add(x,6.55,z,14.5,.3,14.5,'roof',0x46545c);
}
for(const [x,z,w,d] of [[-31,0,5,8],[31,1,5,8],[-35,37,6,6],[35,-36,6,6],[-15,-31,5,3],[17,31,5,3],[-18,10,4,7],[20,-9,4,7]])add(x,1.2,z,w,2.4,d,'container',x<0?0x477180:0x9b674c);
for(const [x,z,w,d] of [[-11,-18,2,7],[12,-5,2,8],[-12,15,2,7],[10,30,2,6]])add(x,.65,z,w,1.3,d,'barrier',0xb19f7f);
for(const z of [-35,-1,34])for(const x of [-37,37])add(x,.55,z,4,1.1,1.5,'crate',0x7c684d);
export const DEPOT={id:'depot',name:'Ray Hattı',description:'88 × 100 m · Depolar, yük hatları ve üç geçiş koridoru',width:88,depth:100,baseZ:44,baseHalfWidth:40,baseDepth:9,boxes,spawns:{blue:[[-32,44],[-18,44],[0,45],[18,44],[32,44]],orange:[[32,-44],[18,-44],[0,-45],[-18,-44],[-32,-44]]},bombSites:[{id:'A',x:-12,z:20,radius:3},{id:'B',x:12,z:20,radius:3}],escortRoute:[{x:0,z:-39},{x:0,z:-25},{x:-6,z:-12},{x:0,z:0},{x:7,z:13},{x:0,z:27},{x:0,z:39}],floor:0x555c5b,sky:0xa4afb2};
