import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,freshBody,simulate,inOwnBase,eye,wallDistance,direction} from '../shared/world.mjs';
import {attachmentPads,takeAttachment,weaponStats} from '../shared/attachments.mjs';
import {weaponPads,takeWeapon} from '../shared/pickups.mjs';
import {pathTo} from '../server/navigation.mjs';
import {bombSites,freshBomb,updateBomb} from '../shared/bomb.mjs';
import {initialFlags,updateFlags} from '../shared/flags.mjs';
import {surfaceImpact} from '../shared/combat-feedback.mjs';
const actor=()=>({...freshBody(-16,65.2),id:'a',hp:100,team:'blue',weapon:'rifle',primary:'rifle',inventory:{rifle:{ammo:30,reserve:90}},ammo:30,reserve:90,money:800,room:{map:'city',mode:'tdm',phase:'live'}});
test('attachments validate range, ownership, life, mode and compatibility; extended magazine adds no free ammunition',()=>{
 const p=actor();takeAttachment(p,'blue-suppressor',0);assert.ok(weaponStats('rifle',p.attachments).suppressed);assert.equal(p.money,800);assert.throws(()=>takeAttachment(p,'blue-suppressor',3));
 p.x=0;assert.throws(()=>takeAttachment(p,'blue-scope',1));takeAttachment(p,'blue-scope',2);assert.ok(weaponStats('rifle',p.attachments).scoped);
 p.x=16;takeAttachment(p,'blue-extended',4);assert.equal(weaponStats('rifle',p.attachments).mag,45);assert.equal(p.ammo,30);assert.equal(p.reserve,90);
 for(const change of [{hp:0},{team:'orange'},{x:40},{weapon:'knife'},{reloadAt:5},{room:{map:'city',mode:'arms'}},{room:{map:'city',mode:'tdm',phase:'matchEnd'}}])assert.throws(()=>takeAttachment(Object.assign(actor(),change),'blue-suppressor',0));
 const sniper=actor();sniper.weapon='awp';sniper.x=0;assert.throws(()=>takeAttachment(sniper,'blue-scope',0));
});
test('city bases, weapon and attachment pads are clear, authoritative and reachable',()=>{
 const map=MAPS.city;
 for(const p of [...weaponPads('tdm','city'),...attachmentPads('tdm','city')]){assert.ok(inOwnBase({...p,hp:100,room:{map:'city'}}));assert.ok(!map.boxes.some(b=>Math.abs(p.x-b.x)<b.w/2+1&&Math.abs(p.z-b.z)<b.d/2+1),p.id);}
 const p=actor();p.x=26;p.z=68;takeWeapon(p,'blue-m249',0);assert.equal(p.ammo,100);
 for(const team of ['blue','orange'])for(const start of map.spawns[team])for(const goal of [...bombSites('city'),{x:0,z:6},{x:30,z:49},{x:-30,z:-41}]){const path=pathTo('city',{x:start[0],z:start[1]},goal);assert.ok(Math.hypot(path.at(-1).x-goal.x,path.at(-1).z-goal.z)<2.5,JSON.stringify({start,goal}));}
});
test('city movement exceeds old bounds, enters rooms, climbs every staircase and crosses roof bridge',()=>{
 const boxes=MAPS.city.boxes,p=freshBody(0,66);for(let i=0;i<60;i++)simulate(p,{x:1,z:0,yaw:0},1/60,boxes);assert.ok(p.z>60);
 for(const building of MAPS.city.buildings){const a=freshBody(building.x+11.7,building.z-10);for(let i=0;i<140;i++)simulate(a,{x:0,z:1,yaw:0},1/60,boxes);assert.ok(a.y>=3.99,JSON.stringify(a));assert.ok(a.z>building.z-.5);}
 const a={...freshBody(-30,-31),y:4};for(let i=0;i<130;i++)simulate(a,{x:0,z:1,yaw:0},1/60,boxes);assert.ok(a.y>=3.99);assert.ok(a.z>-21);
 const cross={...freshBody(-19,23),y:4};for(let i=0;i<470;i++)simulate(cross,{x:1,z:0,yaw:0},1/60,boxes);assert.ok(cross.x>18&&cross.y>=3.99);
 const inside=freshBody(30,59);for(let i=0;i<80;i++)simulate(inside,{x:0,z:-1,yaw:0},1/60,boxes);assert.ok(inside.z<55);assert.equal(inside.y,0);
});
test('city bomb sites and flag returns use city coordinates',()=>{
 const a={...actor(),team:'orange',x:-51,z:23,input:{interact:true},ground:true},room={map:'city',mode:'bomb',phase:'live',players:new Map([['a',a]])};room.bomb=freshBomb(room.players);updateBomb(room,1);updateBomb(room,4);assert.equal(room.bomb.state,'planted');assert.equal(room.bomb.site,'A');
 const flags=initialFlags('city');assert.equal(flags.blue.z,68);flags.orange.carrier='a';a.team='blue';a.x=0;a.z=68;const ctf={map:'city',flags,players:new Map([['a',a]]),scores:{blue:0,orange:0}};updateFlags(ctf,2,()=>{});assert.equal(ctf.scores.blue,1);assert.equal(flags.orange.z,-68);
});
test('wall hits report correct normal and material, empty shots have no decal',()=>{
 const o={x:0,y:1,z:0},d=direction(0,0),b={x:0,y:1,z:-5,w:4,h:2,d:1,kind:'container'},distance=wallDistance(o,d,[b]);const impact=surfaceImpact(o,d,distance,[b]);assert.deepEqual(impact,{normal:{x:0,y:0,z:1},metal:true});assert.equal(surfaceImpact(o,d,220,[]),null);
});
