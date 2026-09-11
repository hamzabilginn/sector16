import WebSocket from 'ws';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base='https://sector16.18.185.7.35.sslip.io';
const h=await(await fetch(base+'/api/health')).json();assert.equal(h.version,'1.5.0');
for(const f of ['mobile.js','mobile.css','privacy.html']){const r=await fetch(base+'/'+f);assert.equal(r.status,200);assert.equal(await r.text(),await readFile('dist/'+f,'utf8'));}
for(const origin of ['https://localhost','capacitor://localhost'])await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('https:','wss:')+'/ws',{origin});const timer=setTimeout(()=>{ws.terminate();reject(new Error('Native WSS timeout'))},10000);ws.on('message',data=>{if(JSON.parse(data).type==='hello'){clearTimeout(timer);ws.close();resolve();}});ws.on('error',reject);});
await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('https:','wss:')+'/ws',{origin:'https://untrusted.example'});ws.on('open',()=>{ws.close();reject(new Error('Unexpected origin accepted'))});ws.on('error',()=>resolve());});
console.log('LIVE PASS: v1.5 health, exact mobile assets, HTTPS Android / Capacitor iOS origins accepted, unknown origin rejected');
