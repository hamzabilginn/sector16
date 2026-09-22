import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import net from 'node:net';
test('live server: bot counts, difficulty, joins, leaves, validation, modes',async()=>{
 const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const server=spawn(process.execPath,['server/index.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 const clients=[];
 function wait(c,predicate){const old=c.messages.find(predicate);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{c.ws.off('message',on);reject(Error('Timed out waiting for server message: '+JSON.stringify(c.messages.slice(-5))));},5000);function on(data){const m=JSON.parse(data);if(predicate(m)){clearTimeout(timer);c.ws.off('message',on);resolve(m)}}c.ws.on('message',on);});}
 async function client(){const c={ws:new WebSocket(`ws://127.0.0.1:${port}/ws`),messages:[]};clients.push(c);c.ws.on('message',data=>c.messages.push(JSON.parse(data)));await wait(c,m=>m.type==='hello');return c;}
 const send=(c,m)=>c.ws.send(JSON.stringify(m));
 try{
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),5000).unref())]);
  const health=await fetch(`http://127.0.0.1:${port}/api/health`).then(r=>r.json());assert.equal(health.version,'2.1.0');
  const a=await client();send(a,{type:'create',name:'Test Arena',nickname:'Tester',maxPlayers:8,botCount:7,botDifficulty:'hard',mode:'tdm',team:'orange'});
  const joined=await wait(a,m=>m.type==='joined');assert.equal(joined.team,'orange');let state=await wait(a,m=>m.type==='state'&&m.players.length===8);
  assert.equal(state.players.filter(p=>p.bot).length,7);assert.equal(new Set(state.players.map(p=>p.name)).size,8);
  await new Promise(r=>setTimeout(r,600));let seq=0;
  const input=extra=>send(a,{type:'input',inputs:[{seq:++seq,x:0,z:0,yaw:0,pitch:0,weapon:'rifle',...extra}]});
  a.messages=[];input({fire:true});state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===joined.id)?.ammo<30);
  const used=state.players.find(p=>p.id===joined.id).ammo;
  a.messages=[];input({reload:true});state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===joined.id)?.reload>0);
  assert.ok(state.players.find(p=>p.id===joined.id).ammo<=used);assert.ok(state.players.find(p=>p.id===joined.id).reloadEnd>state.time);
  a.messages=[];state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===joined.id)?.ammo===30&&m.players.find(p=>p.id===joined.id)?.reload===0);
  a.messages=[];input({weapon:'knife'});state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===joined.id)?.weapon==='knife');assert.equal(state.players.find(p=>p.id===joined.id).ammo,1);assert.equal(state.players.find(p=>p.id===joined.id).reserve,0);

  const rooms=await fetch(`http://127.0.0.1:${port}/api/rooms`).then(r=>r.json());assert.equal(rooms.find(r=>r.id===joined.room.id).botDifficulty,'hard');
  const b=await client();send(b,{type:'join',room:joined.room.id,nickname:'Second'});await wait(b,m=>m.type==='joined');
  state=await wait(b,m=>m.type==='state'&&m.players.filter(p=>!p.bot).length===2);assert.equal(state.players.length,8);assert.equal(state.players.filter(p=>p.bot).length,6);
  a.messages=[];send(b,{type:'leave'});await wait(b,m=>m.type==='left');state=await wait(a,m=>m.type==='state'&&m.players.filter(p=>p.bot).length===7);assert.equal(state.players.length,8);
  a.messages=[];send(a,{type:'team',team:'blue'});await wait(a,m=>m.type==='teamchanged'&&m.team==='blue');state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===joined.id)?.team==='blue');assert.equal(state.players.filter(p=>p.team==='blue').length,4);assert.equal(state.players.find(p=>p.id===joined.id).hp,0);
  a.messages=[];send(a,{type:'team',team:'orange'});await wait(a,m=>m.type==='error'&&m.message.includes('30 saniye'));

  send(a,{type:'leave'});await wait(a,m=>m.type==='left');
  const empty=await fetch(`http://127.0.0.1:${port}/api/rooms`).then(r=>r.json());assert.equal(empty.find(r=>r.id===joined.room.id).bots,0);
  for(const invalid of [{botCount:-1},{botCount:8},{botDifficulty:'invalid'}]){a.messages=[];send(a,{type:'create',name:'Invalid Room',maxPlayers:8,...invalid});await wait(a,m=>m.type==='error');assert.ok(!a.messages.some(m=>m.type==='joined'));}
  a.messages=[];send(a,{type:'create',name:'No bots',nickname:'Tester',mode:'ctf',botCount:0,botDifficulty:'easy'});await wait(a,m=>m.type==='joined');state=await wait(a,m=>m.type==='state');assert.equal(state.players.length,1);assert.equal(state.mode,'ctf');
  a.messages=[];send(a,{type:'leave'});await wait(a,m=>m.type==='left');
  a.messages=[];send(a,{type:'create',name:'Duel',nickname:'Tester',mode:'rounds',maxPlayers:2,botCount:1,botDifficulty:'medium'});await wait(a,m=>m.type==='joined');state=await wait(a,m=>m.type==='state'&&m.phase==='live');assert.equal(state.players.length,2);
  a.messages=[];send(a,{type:'team',team:state.players.find(p=>!p.bot).team==='blue'?'orange':'blue'});await wait(a,m=>m.type==='error'&&m.message.includes('hazırlık'));
  a.messages=[];send(a,{type:'leave'});await wait(a,m=>m.type==='left');
  const bombRoom=(await fetch(`http://127.0.0.1:${port}/api/rooms`).then(r=>r.json())).find(r=>r.mode==='bomb');assert.ok(bombRoom);
  a.messages=[];send(a,{type:'join',room:bombRoom.id,nickname:'Bomb test',team:'orange'});const bombJoined=await wait(a,m=>m.type==='joined');state=await wait(a,m=>m.type==='state'&&m.mode==='bomb'&&m.phase==='live');assert.equal(state.bomb.carrier,bombJoined.id);
  a.messages=[];send(a,{type:'grenade',kind:'he'});send(a,{type:'grenade',kind:'flash'});send(a,{type:'grenade',kind:'smoke'});state=await wait(a,m=>m.type==='state'&&m.players.find(p=>p.id===bombJoined.id)?.grenades===0);assert.equal(state.grenades.length,3);await wait(a,m=>m.type==='explosion'&&m.kind==='grenade');await wait(a,m=>m.type==='explosion'&&m.kind==='flash');await wait(a,m=>m.type==='explosion'&&m.kind==='smoke');


 }finally{for(const c of clients)c.ws.terminate();server.kill();await once(server,'exit');}
});
