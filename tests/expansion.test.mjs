import test from 'node:test';import assert from 'node:assert/strict';
import {EXTRA_MODES,recoilStep,levelForXp,rankForRating,sanitizeText,SKINS} from '../shared/expansion.mjs';
test('expansion modes have bounded goals and loadouts',()=>{assert.deepEqual(Object.keys(EXTRA_MODES),['arms','sniper','pistol','ffa','elimination']);for(const m of Object.values(EXTRA_MODES))assert.ok((m.score||m.rounds)>0&&m.loadout)});
test('recoil patterns repeat deterministically per weapon',()=>{assert.deepEqual(recoilStep('rifle',0),[0,1]);assert.deepEqual(recoilStep('rifle',5),[0,1]);assert.notDeepEqual(recoilStep('rifle',1),recoilStep('rifle',2))});
test('profile levels, ranks, skins and moderation text are bounded',()=>{assert.equal(levelForXp(0),1);assert.equal(levelForXp(900),4);assert.equal(rankForRating(600),'Bronz');assert.equal(rankForRating(2200),'Usta');assert.ok(SKINS.every((s,i)=>!i||s.level>=SKINS[i-1].level));assert.equal(sanitizeText('<b> kötü\n',20),'b kötü')});
