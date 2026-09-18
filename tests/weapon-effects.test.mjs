import test from 'node:test';
import assert from 'node:assert/strict';
import {nextZoomLevel,shotProfile,zoomFov,zoomLabel} from '../shared/weapon-effects.mjs';

test('AWP dürbünü iki kademeden sonra normal görüşe döner',()=>{
 let level=0;level=nextZoomLevel('awp',level);assert.equal(level,1);
 level=nextZoomLevel('awp',level);assert.equal(level,2);
 level=nextZoomLevel('awp',level);assert.equal(level,0);
});

test('AWP ikinci kademe daha dar görüş açısı kullanır',()=>{
 assert.equal(zoomFov(85,'awp',0),85);
 assert.ok(Math.abs(Math.tan(85*Math.PI/360)/Math.tan(zoomFov(85,'awp',1)*Math.PI/360)-4)<1e-10);
 assert.ok(Math.abs(Math.tan(85*Math.PI/360)/Math.tan(zoomFov(85,'awp',2)*Math.PI/360)-8)<1e-10);
 assert.match(zoomLabel('awp',2),/8×/);
});

test('silahların atış karakterleri ayrıdır',()=>{
 assert.ok(shotProfile('awp').volume>shotProfile('m4').volume);
 assert.ok(shotProfile('shotgun').duration>shotProfile('pistol').duration);
 assert.ok(shotProfile('awp').kick>shotProfile('rifle').kick);
});
