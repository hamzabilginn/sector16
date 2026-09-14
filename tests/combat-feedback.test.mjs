import test from 'node:test';
import assert from 'node:assert/strict';
import {damageAngle,accuracy} from '../shared/combat-feedback.mjs';
test('damage indicator points toward the source relative to view yaw',()=>{assert.ok(Math.abs(damageAngle({x:0,z:1},0))<1e-9);assert.ok(Math.abs(Math.abs(damageAngle({x:0,z:-1},0))-Math.PI)<1e-9);assert.ok(Math.abs(Math.abs(damageAngle({x:-1,z:0},Math.PI/2))-Math.PI)<1e-9);assert.equal(damageAngle(null,0),null)});
test('accuracy handles empty, normal and shotgun-style shot counts',()=>{assert.equal(accuracy({shots:0,hits:0}),0);assert.equal(accuracy({shots:4,hits:3}),75);assert.equal(accuracy({shots:1,hits:1}),100)});
