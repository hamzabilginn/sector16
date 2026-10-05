import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {MAPS,WEAPONS,freshBody,simulate} from '../shared/world.mjs';
import {bombSites} from '../shared/bomb.mjs';
import {RECOIL_PATTERNS} from '../shared/expansion.mjs';

const directory='unity-client/Assets/Resources';
const data={maps:Object.values(MAPS).map(m=>({id:m.id,name:m.name,width:m.width||56,depth:m.depth||64,baseZ:m.baseZ||28,floor:m.floor,sky:m.sky,boxes:m.boxes,sites:bombSites(m.id)})),weapons:Object.entries(WEAPONS).map(([id,w])=>({id,...w,pattern:(RECOIL_PATTERNS[id]||[]).map(([x,y])=>({x,y}))}))};
await mkdir(directory,{recursive:true});
const text=JSON.stringify(data);
if(process.argv.includes('--check')){
 if(await readFile(directory+'/world.json','utf8')!==text)throw Error('Unity world data is out of date; run npm run export:unity');
}else await writeFile(directory+'/world.json',text);
// Server-generated reference trajectories exercise collisions, jumping, aiming and city stairs.
const fixtures=[];
for(const m of Object.values(MAPS))for(const scenario of ['run','jump','diagonal','crouch','stairs']){
 const initial=freshBody(scenario==='stairs'&&m.id==='city'?-18.3:0,scenario==='stairs'&&m.id==='city'?-47.5:25,scenario==='stairs'&&m.id==='city'?Math.PI:0),p={...initial},frames=[],checkpoints=[];
 for(let n=0;n<240;n++){
  const i={seq:n+1,x:scenario==='diagonal'?1:0,z:-1,yaw:initial.yaw+(scenario==='run'&&n>160?.8:0),pitch:.1,aim:n>180,crouch:scenario==='crouch'&&n<120,sprint:n<90,fire:n>200,jump:scenario==='jump'&&(n%75<12),weapon:'rifle'};
  frames.push(i);simulate(p,i,1/60,m.boxes);if(n%30===29)checkpoints.push({step:n+1,body:{...p}});
 }
 fixtures.push({map:m.id,scenario,initial,frames,checkpoints});
}
await mkdir('unity-client/Tests',{recursive:true});await writeFile('unity-client/Tests/movement-fixtures.json',JSON.stringify(fixtures));
console.log(`Unity data: ${data.maps.length} maps, ${data.maps.reduce((n,m)=>n+m.boxes.length,0)} boxes, ${data.weapons.length} weapons; ${fixtures.length} server movement fixtures.`);
