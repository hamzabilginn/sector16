import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseTeam} from '../shared/teams.mjs';
import {reloadPose} from '../shared/animation.mjs';
test('team selection enforces human capacity while bots can make room',()=>{
 const room={maxPlayers:2,players:new Map([['a',{id:'a',team:'blue',bot:false}],['b',{id:'b',team:'orange',bot:true}]])};
 assert.equal(chooseTeam(room,'orange'),'orange');assert.equal(chooseTeam(room),'orange');assert.throws(()=>chooseTeam(room,'blue'));
 assert.equal(chooseTeam(room,'blue','a'),'blue');assert.throws(()=>chooseTeam(room,'__proto__'));assert.throws(()=>chooseTeam(room,null));
});
test('reload timeline extracts then inserts magazine before operating bolt and returns to rest',()=>{
 for(const weapon of ['pistol','deagle','rifle','m4','smg','awp']){
  assert.equal(reloadPose(weapon,0).mag,0);assert.equal(reloadPose(weapon,.45).mag,1);assert.equal(reloadPose(weapon,.76).mag,0);
  assert.ok(reloadPose(weapon,.87).bolt>.9);assert.equal(reloadPose(weapon,1).bolt,0);assert.equal(reloadPose(weapon,1).hold,0);assert.equal(reloadPose(weapon,1).reach,0);
 }
 assert.equal(reloadPose('shotgun',.4).shell,1);assert.equal(reloadPose('shotgun',.4).mag,0);assert.equal(reloadPose('shotgun',1).shell,0);
});
