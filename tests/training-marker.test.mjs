import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import net from 'node:net';
test('training targets move and team markers remain team-only',async()=>{
 const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const server=spawn(process.execPath,['server/index.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe'],windowsHide:true});const clients=[];
 const wait=(c,predicate,ms=12000)=>{const old=c.messages.find(predicate);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{c.ws.off('message',on);reject(Error('message timeout'))},ms);function on(data){const m=JSON.parse(data);if(predicate(m)){clearTimeout(timer);c.ws.off('message',on);resolve(m)}}c.ws.on('message',on)})};
 async function client(){const c={ws:new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages:[]};clients.push(c);c.ws.on('message',d=>c.messages.push(JSON.parse(d)));await wait(c,m=>m.type==='hello');return c}const send=(c,m)=>c.ws.send(JSON.stringify(m));
 try{
  await once(server.stdout,'data');const a=await client(),b=await client(),enemy=await client();send(a,{type:'create',name:'Marker test',nickname:'A',mode:'tdm',maxPlayers:8,botCount:0,team:'blue'});const joined=await wait(a,m=>m.type==='joined');send(b,{type:'join',room:joined.room.id,nickname:'B',team:'blue'});await wait(b,m=>m.type==='joined');send(enemy,{type:'join',room:joined.room.id,nickname:'C',team:'orange'});await wait(enemy,m=>m.type==='joined');a.messages=[];b.messages=[];enemy.messages=[];send(a,{type:'marker',kind:'enemy'});await wait(a,m=>m.type==='marker');await wait(b,m=>m.type==='marker');await new Promise(r=>setTimeout(r,150));assert.equal(enemy.messages.some(m=>m.type==='marker'),false);
  send(a,{type:'leave'});await wait(a,m=>m.type==='left');a.messages=[];send(a,{type:'training',nickname:'Practice'});const practice=await wait(a,m=>m.type==='joined'&&m.room.mode==='training');let state=await wait(a,m=>m.type==='state'&&m.players.filter(p=>p.bot).length===5);const start=state.players.filter(p=>p.bot).map(p=>p.x);await new Promise(r=>setTimeout(r,1200));a.messages=[];state=await wait(a,m=>m.type==='state');assert.ok(state.players.filter(p=>p.bot).some((p,i)=>Math.abs(p.x-start[i])>.1));const publicRooms=await fetch('http://127.0.0.1:'+port+'/api/rooms').then(r=>r.json());assert.equal(publicRooms.some(r=>r.id===practice.room.id),false);send(a,{type:'trainingweapon',weapon:'awp'});state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===practice.id)?.weapon==='awp');assert.equal(state.players.find(p=>p.id===practice.id).reserve,999);
 }finally{for(const c of clients)c.ws.close();server.kill();await once(server,'exit')}
});
