import {weaponStats} from '../shared/attachments.mjs';
import {surfaceImpact} from '../shared/combat-feedback.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {isRoundMode} from '../shared/bomb.mjs';
import {readFile} from 'node:fs/promises';
import {WEAPONS,freshBody,eye,height,direction,wallDistance,playerHit} from '../shared/world.mjs';
import {enemies,smokeBlocks,modeLoadout} from '../shared/live-expansion.mjs';
const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
const fireSource=source.slice(source.indexOf('function dealDamage('),source.indexOf('function tick(){'));
function setup(hp=100,team='orange',invuln=0,distance=5,weapon='pistol',boxes=[]){
 const shots=[],messages=[],w=WEAPONS[weapon];
 const shooter={...freshBody(0,0,0),id:'shooter',team:'blue',weapon,ammo:w.mag,inventory:{[weapon]:{ammo:w.mag,reserve:w.reserve}},input:{aim:true},kills:0,money:800,bot:true};
 const target={...freshBody(0,-distance,0),id:'victim',name:'Target',team,hp,armor:0,invuln,generation:1,deaths:0};
 const room={map:'test',mode:'tdm',players:new Map([[shooter.id,shooter],[target.id,target]]),scores:{blue:0,orange:0}};
 const context=vm.createContext({weaponStats,surfaceImpact,WEAPONS,eye,height,direction,wallDistance,playerHit,enemies,smokeBlocks,modeLoadout,recordCombat:()=>{},publicProfile:()=>null,enemies,smokeBlocks,modeLoadout,recordCombat:()=>{},publicProfile:()=>null,MAPS:{test:{boxes}},clock:5,Math:Object.assign(Object.create(Math),{random:()=>.5}),send:(p,m)=>messages.push({id:p.id,...m}),broadcast:(r,m)=>shots.push(m),isRoundMode,dropObjectives:()=>{}});
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
test('knife is server-authoritative, keeps its charge and only reaches nearby enemies',()=>{
 const close=setup(100,'orange',0,1.5,'knife');close.fire();assert.equal(close.target.hp,45);assert.equal(close.shooter.ammo,1);assert.ok(close.shots.some(m=>m.type==='melee'));
 const swept=setup(100,'orange',0,1.5,'knife');swept.target.x=.65;swept.fire();assert.equal(swept.target.hp,45);
 const covered=setup(100,'orange',0,1.5,'knife',[{x:0,y:1,z:-.75,w:2,h:2,d:.2}]);covered.fire();assert.equal(covered.target.hp,100);
 const far=setup(100,'orange',0,3,'knife');far.fire();assert.equal(far.target.hp,100);assert.ok(!far.shots.some(m=>m.type==='impact'));
});
test('moving targets use snapshot and network delay compensation',()=>{
 const s=setup();s.shooter.bot=false;s.shooter.ping=100;s.target.x=1;s.room.history=[{time:4.875,players:{victim:{...s.target,x:0}}}];s.fire();assert.ok(s.target.hp<100);assert.ok(s.shots.some(m=>m.type==='impact'));
});
test('visible character edges register inside the server hitbox',()=>{const s=setup();s.target.x=.25;s.fire();assert.ok(s.target.hp<100);});
test('nonlethal impacts preserve health; teammates and protected players receive no impacts',()=>{
 const normal=setup();normal.fire();assert.ok(normal.target.hp>0&&normal.target.hp<100);assert.ok(normal.shots.some(m=>m.type==='impact'));assert.ok(!normal.shots.some(m=>m.type==='kill'));
 for(const s of [setup(100,'blue'),setup(100,'orange',10)]){s.fire();assert.equal(s.target.hp,100);assert.ok(!s.shots.some(m=>m.type==='impact'));}
});

test('xda suffix reduces damage but still allows death',()=>{
 const s=setup();s.target.name='Player-xda';s.fire();assert.equal(s.target.hp,99);
 const awp=setup(100,'orange',0,5,'awp');awp.target.name='Player-XDA';awp.fire();assert.equal(awp.target.hp,97);
 const knife=setup(100,'orange',0,1.5,'knife');knife.target.name='Player-xda';knife.fire();assert.equal(knife.target.hp,99);
 const normal=setup();normal.target.name='Player-xda-other';normal.fire();assert.ok(normal.target.hp<99);
 s.target.hp=1;s.fire();assert.equal(s.target.hp,0);assert.equal(s.shooter.kills,1);
});
