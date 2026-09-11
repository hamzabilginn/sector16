import test from 'node:test';
import assert from 'node:assert/strict';
import {BOT_LEVELS,botSettings,desiredBots,canBotFire} from '../shared/bots.mjs';
test('bot count validates integers, capacity and difficulty on server',()=>{
 for(const value of [-1,8,1.5,'3',null,NaN,Infinity])assert.throws(()=>botSettings({botCount:value},8));
 for(const value of ['extreme','__proto__',null])assert.throws(()=>botSettings({botDifficulty:value},8));
 assert.deepEqual(botSettings({},8),{botCount:3,botDifficulty:'medium'});
 assert.equal(botSettings({bots:false},8).botCount,0);
 assert.equal(botSettings({botCount:15,botDifficulty:'hard'},16).botCount,15);
 assert.equal(botSettings({},2).botCount,1);
});
test('bots leave space for humans and empty rooms have no bots',()=>{
 const room={maxPlayers:8,botCount:7};
 assert.equal(desiredBots(room,0),0);assert.equal(desiredBots(room,1),7);
 assert.equal(desiredBots(room,3),5);assert.equal(desiredBots(room,8),0);
 assert.equal(desiredBots({...room,botCount:0},1),0);
});
test('difficulty changes reaction and reacquiring targets resets reaction',()=>{
 for(const level of Object.values(BOT_LEVELS)){
  const p={};assert.equal(canBotFire(p,'enemy',true,0,level),false);
  assert.equal(canBotFire(p,'enemy',true,level.reaction-.001,level),false);
  assert.equal(canBotFire(p,'enemy',true,level.reaction+.001,level),true);
  assert.equal(canBotFire(p,'enemy',false,2,level),false);
  assert.equal(canBotFire(p,'enemy',true,3,level),false);
  assert.equal(canBotFire(p,'other',true,4,level),false);
 }
 assert.ok(BOT_LEVELS.easy.reaction>BOT_LEVELS.medium.reaction&&BOT_LEVELS.medium.reaction>BOT_LEVELS.hard.reaction);
 assert.ok(BOT_LEVELS.easy.error>BOT_LEVELS.medium.error&&BOT_LEVELS.medium.error>BOT_LEVELS.hard.error);
});
