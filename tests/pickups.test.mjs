import test from 'node:test';
import assert from 'node:assert/strict';
import {weaponPads,takeWeapon} from '../shared/pickups.mjs';
import {MAPS} from '../shared/world.mjs';
const player=()=>({team:'blue',hp:100,x:-12,y:0,z:30,money:800,primary:null,secondary:'pistol',inventory:{pistol:{ammo:20,reserve:120}},room:{mode:'tdm',phase:'live',restart:0}});
test('team pickups equip a full weapon without spending money and enforce cooldown',()=>{
 const p=player();takeWeapon(p,'blue-rifle',0);assert.equal(p.weapon,'rifle');assert.equal(p.money,800);assert.equal(p.ammo,30);p.x=-4;
 assert.throws(()=>takeWeapon(p,'blue-m4',1));assert.throws(()=>takeWeapon(p,'blue-m4',1.99));takeWeapon(p,'blue-m4',2);assert.equal(p.primary,'m4');assert.equal(p.inventory.rifle,undefined);assert.ok(p.inventory.pistol);
});
test('pickup rejects enemy base, distance, death, restricted mode and round end',()=>{
 for(const changes of [{team:'orange'},{x:0},{hp:0},{y:2},{room:{mode:'arms'}},{room:{mode:'tdm',phase:'roundEnd'}}])assert.throws(()=>takeWeapon(Object.assign(player(),changes),'blue-rifle',0));
});
test('supply pads are symmetric and accessible on every supported map',()=>{
 const pads=weaponPads('tdm');assert.equal(pads.length,12);
 for(const map of Object.values(MAPS).filter(x=>x.id!=='range'))for(const p of pads)assert.ok(!map.boxes.some(b=>Math.abs(p.x-b.x)<b.w/2+.9&&Math.abs(p.z-b.z)<b.d/2+.9),map.id+' '+p.id);
 for(const mode of ['arms','sniper','pistol','ffa','training'])assert.equal(weaponPads(mode).length,0);
});
