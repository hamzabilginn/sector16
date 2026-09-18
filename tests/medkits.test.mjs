import test from 'node:test';
import assert from 'node:assert/strict';
import {useMedkit} from '../shared/medkits.mjs';
const player=()=>({hp:25,medkits:1,money:800,room:{phase:'live'}});
test('medkit restores 50 health, consumes once and leaves money unchanged',()=>{const p=player();assert.equal(useMedkit(p),50);assert.equal(p.hp,75);assert.equal(p.medkits,0);assert.equal(p.money,800);assert.throws(()=>useMedkit(p));assert.equal(p.hp,75)});
test('healing caps at 100 and full-health attempts do not consume a kit',()=>{const p=player();p.hp=90;assert.equal(useMedkit(p),10);assert.equal(p.hp,100);p.medkits=1;assert.throws(()=>useMedkit(p));assert.equal(p.medkits,1)});
test('dead players, lobby and finished rounds cannot use a kit',()=>{for(const changes of [{hp:0},{room:null},{room:{phase:'roundEnd'}},{room:{restart:5}}]){const p=Object.assign(player(),changes);assert.throws(()=>useMedkit(p));assert.equal(p.medkits,1)}});
