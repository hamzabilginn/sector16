import test from 'node:test';
import assert from 'node:assert/strict';
import {freshBomb,dropBomb,updateBomb,bombRoundWinner,BOMB_SITES} from '../shared/bomb.mjs';
import {createGrenade,stepGrenade,blastDamage} from '../shared/grenades.mjs';
import {freshBody,MAPS,simulate} from '../shared/world.mjs';
import {pathTo,navigation} from '../server/navigation.mjs';
import {tacticalInput,makeBrain} from '../server/bot-ai.mjs';
import {moveSpectator} from '../shared/spectator.mjs';
const actor=(id,team,x=-21,z=20)=>({...freshBody(x,z),id,name:id,team,hp:100,armor:0,input:{interact:true},reloadAt:0});
function arena(){const a=actor('a','orange'),d=actor('d','blue');const r={mode:'bomb',map:'docks',phase:'live',phaseEnd:90,players:new Map([[a.id,a],[d.id,d]])};r.bomb=freshBomb(r.players);return {a,d,r};}
test('plant requires carrier, stationary hold and correct site; release cancels progress',()=>{
 const {a,r}=arena();updateBomb(r,1);assert.equal(r.bomb.plantBy,a.id);a.input.interact=false;updateBomb(r,3);assert.equal(r.bomb.plantBy,null);a.input.interact=true;updateBomb(r,4);updateBomb(r,6.9);assert.equal(r.bomb.state,'carried');updateBomb(r,7);assert.equal(r.bomb.state,'planted');assert.equal(r.bomb.site,'A');assert.equal(r.bomb.detonateAt,47);
 const other=arena();other.a.x=0;other.a.z=0;updateBomb(other.r,1);updateBomb(other.r,10);assert.equal(other.r.bomb.state,'carried');
});
test('defuse cancels on release, needs seven seconds, and cannot beat expired fuse',()=>{
 const {a,d,r}=arena();d.input.interact=false;updateBomb(r,1);updateBomb(r,4);d.input.interact=true;updateBomb(r,5);d.input.interact=false;updateBomb(r,8);assert.equal(r.bomb.defuseBy,null);d.input.interact=true;updateBomb(r,9);assert.equal(updateBomb(r,15.9),null);assert.equal(updateBomb(r,16),'blue');assert.equal(r.bomb.state,'defused');
 const s=arena();s.d.input.interact=false;updateBomb(s.r,1);updateBomb(s.r,4);s.d.input.interact=true;updateBomb(s.r,40);assert.equal(updateBomb(s.r,47),'orange');
});
test('dead/disconnected carrier drops bomb and another attacker can pick up; planted round continues after attackers die',()=>{
 const {a,r}=arena();dropBomb(r,a);a.hp=0;const second=actor('b','orange');r.players.set('b',second);updateBomb(r,1);assert.equal(r.bomb.carrier,'b');second.input.interact=true;updateBomb(r,4);assert.equal(r.bomb.state,'planted');second.hp=0;assert.equal(bombRoundWinner(r,100),null);r.bomb.state='dropped';assert.equal(bombRoundWinner(r,100),'blue');
});
test('grenade bounces off ground/walls and blast respects distance and cover',()=>{
 const p=actor('a','orange',0,0);p.yaw=0;p.pitch=-.3;const g=createGrenade(p,0,'g');const wall={x:0,y:2,z:-2,w:8,h:4,d:.5};for(let i=0;i<180;i++)stepGrenade(g,1/60,[wall]);assert.ok(g.y>=.1);assert.ok(g.z> -1.7);assert.equal(g.explodeAt,2.2);
 const blast={x:0,y:1,z:0};assert.ok(blastDamage(blast,actor('b','blue',1,0),[])>70);assert.equal(blastDamage(blast,actor('b','blue',10,0),[]),0);assert.equal(blastDamage(blast,actor('b','blue',0,-4),[wall]),0);
});
test('A/B navigation is reachable on all maps without cutting blocked corners',()=>{
 for(const map of Object.keys(MAPS)){const nav=navigation(map);assert.ok(nav.nodes.length>100);for(const site of BOMB_SITES){const path=pathTo(map,{x:20,z:-27},site,Math.sign(site.x));assert.ok(path.length>10);assert.ok(Math.hypot(path.at(-1).x-site.x,path.at(-1).z-site.z)<2);}}
});
test('bot roles choose distinct routes and their spawn positions spread during simulation',()=>{
 const bots=Array.from({length:5},(_,i)=>({...actor('bot'+i,'orange',-20+i*10,-27),bot:true,botIndex:i,ai:makeBrain(i),yaw:Math.PI,ammo:20,primary:null,secondary:'pistol',grenades:0,nextFire:0}));const enemy=actor('human','blue',0,28);const r={map:'docks',mode:'tdm',botDifficulty:'medium',players:new Map([...bots,enemy].map(p=>[p.id,p]))};
 for(let i=1;i<=360;i++)for(const p of bots){const input=tacticalInput(p,r,i/60);simulate(p,input,1/60,MAPS.docks.boxes);}
 assert.equal(new Set(bots.map(p=>p.ai.role)).size,5);assert.ok(new Set(bots.map(p=>Math.round(p.x/4)+','+Math.round(p.z/4))).size>=4);assert.ok(bots.some(p=>p.z>-20));
});
test('free spectator movement changes only camera position and remains within map bounds',()=>{
 const pos={x:0,y:2,z:0};moveSpectator(pos,{x:0,z:-1,y:1,yaw:0},1);assert.ok(pos.z<0&&pos.y>2);for(let i=0;i<100;i++)moveSpectator(pos,{x:1,z:1,y:1,yaw:0,fast:true},1);assert.deepEqual(pos,{x:27,y:18,z:31});
});
