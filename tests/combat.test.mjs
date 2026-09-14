import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {isRoundMode} from '../shared/bomb.mjs';
import {readFile} from 'node:fs/promises';
import {WEAPONS,freshBody,eye,direction,wallDistance,playerHit} from '../shared/world.mjs';
const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
const fireSource=source.slice(source.indexOf('function dealDamage('),source.indexOf('function tick(){'));
function setup(hp=100,team='orange',invuln=0){
 const shots=[],messages=[];
 const shooter={...freshBody(0,0,0),id:'shooter',team:'blue',weapon:'pistol',ammo:20,inventory:{pistol:{ammo:20}},input:{aim:true},kills:0,money:800,bot:true};
 const target={...freshBody(0,-5,0),id:'victim',name:'Target',team,hp,armor:0,invuln,generation:1,deaths:0};
 const room={map:'test',mode:'tdm',players:new Map([[shooter.id,shooter],[target.id,target]]),scores:{blue:0,orange:0}};
 const context=vm.createContext({WEAPONS,eye,direction,wallDistance,playerHit,MAPS:{test:{boxes:[]}},clock:5,Math:Object.assign(Object.create(Math),{random:()=>.5}),send:(p,m)=>messages.push({id:p.id,...m}),broadcast:(r,m)=>shots.push(m),isRoundMode,dropObjectives:()=>{}});
 vm.runInContext(fireSource+'\nthis.fire=fire;',context);
 return {shooter,target,room,shots,messages,fire:()=>context.fire(shooter,room)};
}
test('authoritative damage emits impact and lethal hit emits one death event with victim pose',()=>{
 const s=setup(1);s.fire();assert.equal(s.target.hp,0);assert.equal(s.shooter.kills,1);assert.equal(s.room.scores.blue,1);
 const impact=s.shots.find(m=>m.type==='impact'),kill=s.shots.find(m=>m.type==='kill');
 assert.equal(impact.victimId,'victim');assert.equal(kill.victimId,'victim');assert.equal(kill.generation,1);assert.equal(kill.position.z,-5);assert.ok(Number.isFinite(kill.direction.z));
 assert.equal(s.shooter.stats.shots,1);assert.equal(s.shooter.stats.hits,1);assert.equal(s.shooter.stats.headshots,1);assert.equal(s.shooter.stats.damage,1);
 assert.ok(s.messages.some(m=>m.type==='hit'&&m.kill));assert.ok(s.messages.some(m=>m.type==='hurt'&&m.direction?.z===-1));s.fire();assert.equal(s.shots.filter(m=>m.type==='kill').length,1);
});
test('nonlethal impacts preserve health; teammates and protected players receive no impacts',()=>{
 const normal=setup();normal.fire();assert.ok(normal.target.hp>0&&normal.target.hp<100);assert.ok(normal.shots.some(m=>m.type==='impact'));assert.ok(!normal.shots.some(m=>m.type==='kill'));
 for(const s of [setup(100,'blue'),setup(100,'orange',10)]){s.fire();assert.equal(s.target.hp,100);assert.ok(!s.shots.some(m=>m.type==='impact'));}
});
