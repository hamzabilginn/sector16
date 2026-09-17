import WebSocket from 'ws';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base='https://sector16.18.185.7.35.sslip.io';
const h=await(await fetch(base+'/api/health')).json();assert.equal(h.version,'2.0.2');
for(const f of ['mobile.js','mobile.css','privacy.html']){const r=await fetch(base+'/'+f);assert.equal(r.status,200);assert.equal(await r.text(),await readFile('dist/'+f,'utf8'));}
for(const origin of ['https://localhost','capacitor://localhost'])await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('https:','wss:')+'/ws',{origin});const timer=setTimeout(()=>{ws.terminate();reject(new Error('Native start timeout for '+origin))},15000);let joined=false;ws.on('message',data=>{const message=JSON.parse(data);if(message.type==='hello')ws.send(JSON.stringify({type:'quick',nickname:'App Review QA',team:'auto'}));if(message.type==='joined')joined=true;if(joined&&message.type==='state'&&message.players.some(player=>player.id===message.id||player.name==='App Review QA')){clearTimeout(timer);ws.send(JSON.stringify({type:'leave'}));ws.close();resolve();}});ws.on('error',reject);});
await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('https:','wss:')+'/ws',{origin:'https://untrusted.example'});ws.on('open',()=>{ws.close();reject(new Error('Unexpected origin accepted'))});ws.on('error',()=>resolve());});
console.log('LIVE PASS: v2.0.2 health, exact mobile assets, native quick play reaches game state, unknown origin rejected');
