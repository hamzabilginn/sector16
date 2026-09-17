import http from 'node:http';
import {takeWeapon} from '../shared/pickups.mjs';
import {isRoundMode,freshBomb,dropBomb,updateBomb,bombRoundWinner} from '../shared/bomb.mjs';
import {createGrenade,stepGrenade,blastDamage} from '../shared/grenades.mjs';
import {tacticalInput,makeBrain,BOT_ROLES} from './bot-ai.mjs';
import {chooseTeam} from '../shared/teams.mjs';
import {BOT_LEVELS,botSettings,desiredBots,canBotFire} from '../shared/bots.mjs';
import {initialFlags,dropFlags,updateFlags} from '../shared/flags.mjs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {WebSocketServer,WebSocket} from 'ws';
import {LIVE_MODES,modeLoadout,modeLimit,enemies,smokeBlocks,mapWinner} from '../shared/live-expansion.mjs';
import {profileFor,publicProfile,selectSkin,recordCombat} from './profiles.mjs';
import {BOXES,SPAWNS,MAPS,WEAPONS,inOwnBase,clamp,direction,freshBody,eye,height,simulate,wallDistance,playerHit} from '../shared/world.mjs';
const scrypt=promisify(crypto.scrypt),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const APP_ORIGINS=new Set(['https://localhost','capacitor://localhost']);
const rooms=new Map(),peers=new Set(),limits=new Map(),sessions=new Map();let clock=0;
const importMapHash=crypto.createHash('sha256').update('{"imports":{"three":"/vendor/three.module.js"}}').digest('base64');
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(APP_ORIGINS.has(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','SAMEORIGIN');
 res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'sha256-${importMapHash}'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`);
 if(url.pathname==='/api/health')return json(res,200,{ok:true,game:'Sector 16',version:'2.0.2',rooms:rooms.size,players:[...peers].filter(p=>p.room).length,tickRate:60});
 if(url.pathname==='/api/rooms')return json(res,200,roomList());
 if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 const relative=url.pathname==='/'?'dist/index.html':url.pathname.startsWith('/shared/')?url.pathname.slice(1):'dist/'+decodeURIComponent(url.pathname.slice(1));
 const full=path.resolve(root,relative);if(!full.startsWith(root+path.sep)||(!full.startsWith(path.join(root,'dist')+path.sep)&&!full.startsWith(path.join(root,'shared')+path.sep)))return json(res,403,{error:'Forbidden'});
 const buf=await readFile(full),mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png'}[path.extname(full)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime,'Cache-Control':url.pathname.startsWith('/vendor/')?'public,max-age=86400':'no-cache'});res.end(req.method==='HEAD'?undefined:buf);
 }catch{json(res,404,{error:'Not found'})}});
const wss=new WebSocketServer({noServer:true,maxPayload:16384,perMessageDeflate:false});
function clientIp(req){const remote=req.socket.remoteAddress;if(['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)&&req.headers['x-forwarded-for'])return String(req.headers['x-forwarded-for']).split(',').at(-1).trim();return remote}
server.on('upgrade',(req,socket,head)=>{try{const url=new URL(req.url,'http://localhost');const origin=req.headers.origin;if(url.pathname!=='/ws'||(origin&&new URL(origin).host!==req.headers.host&&!APP_ORIGINS.has(origin))){socket.destroy();return}const ip=clientIp(req);if([...peers].filter(p=>p.ip===ip).length>=32||peers.size>=240){socket.destroy();return}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));}catch{socket.destroy()}});
function send(p,m){if(p.ws?.readyState===WebSocket.OPEN&&p.ws.bufferedAmount<256*1024)p.ws.send(JSON.stringify(m))}
function broadcast(room,m){if(m.type==='end')m.results=[...room.players.values()].map(p=>({id:p.id,name:p.name,kills:p.kills,deaths:p.deaths,...(p.stats||{shots:0,hits:0,headshots:0,damage:0})}));for(const p of room.players.values())if(!p.bot)send(p,m)}
function roomList(){return [...rooms.values()].filter(r=>r.mode!=='training').map(r=>({id:r.id,name:r.name,locked:!!r.password,players:[...r.players.values()].filter(p=>!p.bot).length,bots:[...r.players.values()].filter(p=>p.bot).length,maxPlayers:r.maxPlayers,botCount:r.botCount,botDifficulty:r.botDifficulty,map:MAPS[r.map].name,mapId:r.map,mode:r.mode,minutes:r.minutes}));}
function sendMapVote(r){const counts={};for(const id of r.votes.values())counts[id]=(counts[id]||0)+1;broadcast(r,{type:'mapvote',options:Object.values(MAPS).filter(x=>x.id!=='range').map(x=>({id:x.id,name:x.name})),counts})}
function lobby(){const update={type:'rooms',rooms:roomList()};for(const p of peers)send(p,update)}
function makeRoom({name='DOKLAR / Hızlı maç',maxPlayers=12,minutes=8,bots=true,botCount,botDifficulty,password=null,permanent=false,map='docks',mode='tdm'}={}){const r={...botSettings({bots,botCount,botDifficulty},maxPlayers),map:Object.hasOwn(MAPS,map)?map:'docks',mode:LIVE_MODES.includes(mode)?mode:'tdm',flags:initialFlags(),bomb:null,grenades:[],smokes:[],votes:new Map(),phase:'buy',round:0,phaseEnd:0,loss:{blue:0,orange:0},id:crypto.randomBytes(5).toString('hex'),name,maxPlayers,minutes,bots,password,permanent,players:new Map(),scores:{blue:0,orange:0},end:clock+minutes*60,restart:0,emptySince:clock};rooms.set(r.id,r);return r}
function spawn(p,r,preserve=false){
 const choices=MAPS[r.map].spawns[p.team],enemies=[...r.players.values()].filter(v=>v.team!==p.team&&v.hp>0);
 const allies=[...r.players.values()].filter(v=>v.id!==p.id&&v.team===p.team&&v.hp>0);const scored=choices.map(pos=>({pos,score:Math.min(40,...enemies.map(e=>Math.hypot(pos[0]-e.x,pos[1]-e.z)))-allies.filter(a=>Math.hypot(pos[0]-a.x,pos[1]-a.z)<3).length*30+Math.random()*4}));scored.sort((a,b)=>b.score-a.score);const pos=[...scored[0].pos];
 if(r.mode==='training'&&p.bot){pos[0]=MAPS.range.spawns.orange[p.botIndex][0];pos[1]=-8;}
 const retained=preserve&&p.hp>0;const owned=[...new Set([...(retained?Object.keys(p.inventory):isRoundMode(r.mode)?['pistol']:modeLoadout(r.mode,p.kills)),'knife'])];
 const inventory=Object.fromEntries(owned.map(id=>[id,{ammo:WEAPONS[id].mag,reserve:WEAPONS[id].reserve}]));
 const primary=owned.find(id=>WEAPONS[id].slot==='primary')||null,secondary=owned.find(id=>WEAPONS[id].slot==='secondary')||'pistol',weapon=primary||secondary;
 Object.assign(p,freshBody(pos[0]+(Math.random()-.5),pos[1],p.team==='blue'?0:Math.PI),{ai:p.bot?makeBrain(p.botIndex||0):undefined,grenades:3,utility:{he:1,flash:1,smoke:1},botTarget:null,botSeenAt:0,hp:100,armor:retained?p.armor:0,money:p.money??800,primary,secondary,weapon,inventory,ammo:inventory[weapon].ammo,reserve:inventory[weapon].reserve,reloadAt:0,nextFire:clock+.5,invuln:clock+2,respawn:0,queue:[],input:{},generation:(p.generation||0)+1});
}
const BUY_SECONDS=Number(process.env.BUY_SECONDS)||2,ROUND_SECONDS=Number(process.env.ROUND_SECONDS)||90,ROUND_BREAK=Number(process.env.ROUND_BREAK)||2,ROUND_TARGET=Number(process.env.ROUND_TARGET)||7;
function purchase(p,item){const r=p.room;if(!r||p.hp<=0||!inOwnBase(p)||r.restart||(isRoundMode(r.mode)&&r.phase==='matchEnd'))throw Error('Silah almak için hayatta ve kendi üssünde olmalısın.');
 const w=Object.hasOwn(WEAPONS,item)?WEAPONS[item]:null;const price=item==='armor'?650:w?.price;
 if(price===undefined)throw Error('Geçersiz ürün.');if(item==='armor'&&p.armor>=100)throw Error('Zırhın zaten tam.');if(w&&p.inventory[item])throw Error('Bu silah zaten sende.');if(p.money<price)throw Error('Yeterli paran yok.');
 p.money-=price;if(item==='armor'){p.armor=100;return}
 const slot=w.slot==='primary'?'primary':'secondary';if(p[slot])delete p.inventory[p[slot]];p[slot]=item;p.inventory[item]={ammo:w.mag,reserve:w.reserve};p.weapon=item;p.ammo=w.mag;p.reserve=w.reserve;p.reloadAt=0;p.nextFire=clock+.3;
}
function beginRound(r,fresh=false){if(fresh){r.round=0;r.scores={blue:0,orange:0};r.loss={blue:0,orange:0};for(const p of r.players.values()){p.money=800;p.hp=0;p.kills=0;p.deaths=0;p.stats={shots:0,hits:0,headshots:0,damage:0}}}
 r.grenades=[];r.round++;r.phase='buy';r.phaseEnd=clock+BUY_SECONDS;r.history=[];r.restart=0;
 for(const p of r.players.values()){spawn(p,r,!fresh);if(p.bot){try{if(p.money>=2700)purchase(p,'rifle');else if(p.money>=1500)purchase(p,'smg');else if(p.money>=700)purchase(p,'deagle');if(p.money>=650)purchase(p,'armor')}catch{}}}
 if(r.mode==='bomb')r.bomb=freshBomb(r.players);
 broadcast(r,{type:'event',kind:'roundstart',round:r.round});
}
function endRound(r,winner){r.phase='roundEnd';r.phaseEnd=clock+ROUND_BREAK;if(winner!=='draw')r.scores[winner]++;
 for(const team of ['blue','orange'])r.loss[team]=winner===team?0:r.loss[team]+1;
 for(const p of r.players.values()){const reward=winner==='draw'?1900:p.team===winner?3250:Math.min(3400,1400+(r.loss[p.team]-1)*500);p.money=Math.min(16000,p.money+reward)}
 broadcast(r,{type:'roundend',winner,round:r.round});
 if(r.scores.blue>=ROUND_TARGET||r.scores.orange>=ROUND_TARGET){r.phase='matchEnd';r.phaseEnd=clock+2;broadcast(r,{type:'end',winner})}
}
function advanceRounds(r){if(r.phase==='buy'){if(clock>=r.phaseEnd&&['blue','orange'].every(t=>[...r.players.values()].some(p=>p.team===t&&p.hp>0))){r.phase='live';r.phaseEnd=clock+ROUND_SECONDS;for(const p of r.players.values())p.invuln=clock;broadcast(r,{type:'event',kind:'roundlive'})}}
 else if(r.phase==='live'){if(r.mode==='bomb'){const winner=bombRoundWinner(r,clock);if(winner)endRound(r,winner);return;}const alive=t=>[...r.players.values()].filter(p=>p.team===t&&p.hp>0).length;const blue=alive('blue'),orange=alive('orange');if(blue===0||orange===0||clock>=r.phaseEnd)endRound(r,blue===orange?'draw':blue>orange?'blue':'orange')}
 else if(clock>=r.phaseEnd)beginRound(r,r.phase==='matchEnd');
}
function teamFor(r){let blue=0,orange=0;for(const p of r.players.values())p.team==='blue'?blue++:orange++;return blue<=orange?'blue':'orange'}
function syncBots(r){if(r.mode==='training'){if(![...r.players.values()].some(p=>!p.bot)){for(const p of [...r.players.values()])if(p.bot)r.players.delete(p.id);return;}for(let n=0;n<5;n++){const id='target-'+n;if(r.players.has(id))continue;const p={id,name:'Hedef '+(n+1),bot:true,botIndex:n,team:'orange',kills:0,deaths:0,ping:0,ack:0,room:r};spawn(p,r);r.players.set(id,p)}return;}let humans=[...r.players.values()].filter(p=>!p.bot).length;let desired=desiredBots(r,humans);let bots=[...r.players.values()].filter(p=>p.bot);while(bots.length>desired){const removed=bots.pop();dropObjectives(r,removed,clock);r.players.delete(removed.id)}while(bots.length<desired){const bot={id:'bot-'+crypto.randomBytes(3).toString('hex'),name:['Kuzgun','Çelik','Sis','Kobra'][bots.length%4]+' '+(bots.length+1)+' [BOT]',bot:true,botIndex:bots.length,team:teamFor(r),kills:0,deaths:0,ping:0,ack:0,room:r,turn:Math.random()*Math.PI*2};spawn(bot,r);if(isRoundMode(r.mode)&&r.phase==='live')bot.hp=0;r.players.set(bot.id,bot);bots.push(bot)}rebalanceBots(r)}
function rebalanceBots(r){
 for(let i=0;i<r.maxPlayers;i++){
  const counts={blue:0,orange:0};for(const p of r.players.values())counts[p.team]++;
  if(Math.abs(counts.blue-counts.orange)<=1)break;
  const from=counts.blue>counts.orange?'blue':'orange';const bot=[...r.players.values()].find(p=>p.bot&&p.team===from);if(!bot)break;
  dropObjectives(r,bot,clock);bot.team=from==='blue'?'orange':'blue';spawn(bot,r);if(isRoundMode(r.mode)&&r.phase!=='buy')bot.hp=0;
 }
}
function changeTeam(p,requested){
 const r=p.room;if(!r)throw Error('Önce bir odaya katıl.');if(r.mode==='training')throw Error('Antrenmanda takım değişmez.');
 const team=chooseTeam(r,requested,p.id);if(team===p.team){send(p,{type:'teamchanged',team});return;}
 if(isRoundMode(r.mode)&&r.phase!=='buy')throw Error('Rekabetçide takım hazırlık aşamasında değiştirilebilir.');
 if(clock<(p.teamChangeAt||0))throw Error('Tekrar takım değiştirmek için 30 saniye bekle.');
 dropObjectives(r,p,clock);if(p.hp>0&&!isRoundMode(r.mode))p.deaths++;
 p.team=team;p.hp=0;p.input={};p.queue=[];p.reloadAt=0;p.teamChangeAt=clock+30;p.money=800;
 if(isRoundMode(r.mode))spawn(p,r);else p.respawn=clock+2;
 rebalanceBots(r);send(p,{type:'teamchanged',team});broadcast(r,{type:'event',kind:'teamchange',name:p.name,team});lobby();
}
function dropObjectives(r,p,time){dropFlags(r,p,time);dropBomb(r,p);}
function leave(p){if(!p.room)return;const r=p.room;dropObjectives(r,p,clock);r.players.delete(p.id);p.room=null;syncBots(r);if(![...r.players.values()].some(x=>!x.bot))r.emptySince=clock;broadcast(r,{type:'event',kind:'leave',name:p.name});lobby()}
function enter(p,r,name,requestedTeam){const chosen=chooseTeam(r,requestedTeam,p.id);if(p.room)throw Error('Önce bulunduğun odadan ayrıl.');if([...r.players.values()].filter(x=>!x.bot).length>=r.maxPlayers)throw Error('Bu oda dolu.');const bot=[...r.players.values()].find(x=>x.bot);if(bot&&r.players.size>=r.maxPlayers){dropObjectives(r,bot,clock);r.players.delete(bot.id);}p.name=String(name||'Oyuncu').trim().slice(0,20).replace(/[\x00-\x1f]/g,'')||'Oyuncu';p.team=chosen;p.kills=0;p.deaths=0;p.captures=0;p.money=undefined;p.stats={shots:0,hits:0,headshots:0,damage:0};p.room=r;p.ack=0;p.lastSeq=0;spawn(p,r);r.players.set(p.id,p);if([...r.players.values()].filter(v=>!v.bot).length===1){r.end=clock+r.minutes*60;r.restart=0;r.scores={blue:0,orange:0};r.flags=initialFlags()}syncBots(r);if(isRoundMode(r.mode)){if([...r.players.values()].filter(v=>!v.bot).length===1)beginRound(r,true);else if(r.phase!=='buy'){p.hp=0;p.respawn=0}}send(p,{type:'joined',id:p.id,room:{id:r.id,name:r.name,maxPlayers:r.maxPlayers,map:r.map,mode:r.mode},team:p.team});broadcast(r,{type:'event',kind:'join',name:p.name});lobby()}
function consume(p,kind,max,seconds){const key=p.ip+':'+kind;let state=limits.get(key);if(!state||Date.now()>state.until){state={n:0,until:Date.now()+seconds*1000};limits.set(key,state)}if(++state.n>max)throw Error('Çok hızlı işlem yapıyorsun. Biraz bekleyip tekrar dene.')}
wss.on('connection',(ws,req)=>{const p={id:crypto.randomBytes(8).toString('hex'),ws,ip:clientIp(req),room:null,alive:true,ping:0,queue:[],input:{},ack:0,lastSeq:0,busy:false};peers.add(p);ws.on('pong',()=>p.alive=true);send(p,{type:'hello',id:p.id,rooms:roomList()});ws.on('message',async data=>{let m;try{m=JSON.parse(data);if(!m||typeof m.type!=='string')return;
 if(m.type==='input'){if(!p.room||!Array.isArray(m.inputs))return;if(m.inputs.length>8)throw Error('Geçersiz girdi.');for(const i of m.inputs){if(!i||!Number.isSafeInteger(i.seq)||i.seq<=p.lastSeq||i.seq>p.lastSeq+1000)continue;if(![i.x,i.z,i.yaw,i.pitch].every(Number.isFinite))continue;p.lastSeq=i.seq;if(p.queue.length<12)p.queue.push({seq:i.seq,x:clamp(i.x,-1,1),z:clamp(i.z,-1,1),yaw:i.yaw%(Math.PI*2),pitch:clamp(i.pitch,-1.45,1.45),interact:!!i.interact,jump:!!i.jump,crouch:!!i.crouch,sprint:!!i.sprint,aim:!!i.aim,fire:!!i.fire,reload:!!i.reload,weapon:Object.hasOwn(WEAPONS,i.weapon)?i.weapon:p.weapon});}return}
 if(m.type==='ping'){send(p,{type:'pong',t:m.t});return}if(m.type==='latency'){p.ping=clamp(Number(m.ms)||0,0,1000);return}
 consume(p,'messages',60,10);if(m.type==='trainingweapon'){if(p.room?.mode!=='training'||!Object.hasOwn(WEAPONS,m.weapon))return;const w=WEAPONS[m.weapon];p.inventory[m.weapon]={ammo:w.mag,reserve:999};if(w.slot==='primary')p.primary=m.weapon;else if(w.slot==='secondary')p.secondary=m.weapon;p.weapon=m.weapon;p.ammo=w.mag;p.reserve=999;p.reloadAt=0;send(p,{type:'purchased',weapon:p.weapon,money:p.money});return;}if(m.type==='identify'){p.profileId=String(m.profileId||'');p.profile=profileFor(p.profileId);const old=sessions.get(p.profileId);if(old&&old.until>Date.now()&&old.player.room){const ws=p.ws,ip=p.ip,alive=p.alive;Object.assign(p,old.player,{ws,ip,alive});p.room.players.delete(old.player.id);p.room.players.set(p.id,p);sessions.delete(p.profileId);send(p,{type:'joined',id:p.id,resumed:true,room:{id:p.room.id,name:p.room.name,maxPlayers:p.room.maxPlayers,map:p.room.map,mode:p.room.mode},team:p.team});}send(p,{type:'profile',profile:publicProfile(p.profile)});return}if(m.type==='skin'){if(p.profile&&selectSkin(p.profile,String(m.skin)))send(p,{type:'profile',profile:publicProfile(p.profile)});return}if(m.type==='mapvote'){if(p.room&&Object.hasOwn(MAPS,m.map)){p.room.votes.set(p.id,m.map);sendMapVote(p.room)}return}if(m.type==='rooms'){send(p,{type:'rooms',rooms:roomList()});return}if(m.type==='leave'){leave(p);send(p,{type:'left'});return}if(m.type==='grenade'){throwGrenade(p,p.room,m.kind);return}if(m.type==='team'){changeTeam(p,m.team);return}if(m.type==='buy'){purchase(p,String(m.item));send(p,{type:'purchased',item:m.item,money:p.money,weapon:p.weapon});return}
 if(m.type==='pickup'){const pad=takeWeapon(p,String(m.id),clock);send(p,{type:'pickedup',weapon:pad.weapon});return;}
 if(p.busy)throw Error('İşlem sürüyor.');p.busy=true;
 try{if(m.type==='training'){consume(p,'create',6,60);if(p.room)throw Error('Önce odadan ayrıl.');if(rooms.size>=40)throw Error('Sunucu dolu.');const r=makeRoom({name:'Antrenman · 2 dakika',mode:'training',map:'range',maxPlayers:8,botCount:0,minutes:2});enter(p,r,m.nickname,'blue');}else if(m.type==='create'){consume(p,'create',6,60);if(p.room)throw Error('Zaten bir odadasın.');if(m.mode==='training')throw Error('Antrenman düğmesini kullan.');if(rooms.size>=40)throw Error('Sunucu oda sınırına ulaştı.');chooseTeam({players:new Map(),maxPlayers:2},m.team);const name=String(m.name||'').trim();if(name.length<2||name.length>36)throw Error('Oda adı 2–36 karakter olmalı.');const raw=String(m.password||'');if(raw.length>64)throw Error('Şifre en fazla 64 karakter olmalı.');let password=null;if(raw){const salt=crypto.randomBytes(16).toString('hex');password={salt,hash:Buffer.from(await scrypt(raw,salt,32)).toString('hex')}}if(ws.readyState!==WebSocket.OPEN)return;const r=makeRoom({name,maxPlayers:[2,8,12,16].includes(Number(m.maxPlayers))?Number(m.maxPlayers):8,minutes:[5,8,15].includes(Number(m.minutes))?Number(m.minutes):8,bots:m.bots!==false,botCount:m.botCount,botDifficulty:m.botDifficulty,password,map:m.map,mode:m.mode});enter(p,r,m.nickname,m.team)}
 else if(m.type==='join'){consume(p,'join',20,60);const r=rooms.get(String(m.room));if(!r)throw Error('Oda artık mevcut değil.');if(r.mode==='training')throw Error('Antrenman alanı kişiye özeldir.');if(r.password){const raw=String(m.password||'');if(raw.length>64)throw Error('Şifre hatalı.');const hash=await scrypt(raw,r.password.salt,32);if(!crypto.timingSafeEqual(Buffer.from(r.password.hash,'hex'),hash))throw Error('Şifre hatalı.')}if(ws.readyState===WebSocket.OPEN)enter(p,r,m.nickname,m.team)}
 else if(m.type==='quick'){let r=[...rooms.values()].find(r=>r.mode!=='training'&&!r.password&&[...r.players.values()].filter(p=>!p.bot).length<r.maxPlayers);if(!r){if(rooms.size>=40)throw Error('Sunucu dolu.');r=makeRoom()}enter(p,r,m.nickname,m.team)}}finally{p.busy=false}
 }catch(e){send(p,{type:'error',message:e.message||'İşlem tamamlanamadı.'})}});ws.on('error',()=>{});ws.on('close',()=>{if(p.profileId&&p.room){sessions.set(p.profileId,{player:p,until:Date.now()+45000});setTimeout(()=>{const s=sessions.get(p.profileId);if(s?.player===p&&s.until<=Date.now()){sessions.delete(p.profileId);leave(p)}},45100).unref()}else leave(p);peers.delete(p)});});
function botInput(p,r){if(r.mode==='training')return {x:Math.cos(clock*.8+p.botIndex)>.0?1:-1,z:0,yaw:0,pitch:0};return tacticalInput(p,r,clock)}
function throwGrenade(p,r,kind='he'){kind=['he','flash','smoke'].includes(kind)?kind:'he';if(!r||p.hp<=0||p.reloadAt||!p.utility?.[kind]||r.restart||(isRoundMode(r.mode)&&r.phase!=='live'))return;p.utility[kind]--;p.grenades=Math.max(0,p.grenades-1);if(p.input)p.input.interact=false;p.invuln=Math.min(p.invuln,clock);r.grenades.push(createGrenade(p,clock,crypto.randomBytes(5).toString('hex'),kind));p.nextFire=Math.max(p.nextFire,clock+.55);broadcast(r,{type:'grenadethrown',id:p.id,kind});}
function tickGrenades(r){for(let i=r.grenades.length-1;i>=0;i--){const g=r.grenades[i];stepGrenade(g,1/60,MAPS[r.map].boxes);if(clock<g.explodeAt)continue;r.grenades.splice(i,1);if(g.kind==='smoke'){r.smokes.push({id:g.id,x:g.x,y:g.y,z:g.z,until:clock+16});broadcast(r,{type:'explosion',position:{x:g.x,y:g.y,z:g.z},kind:'smoke'});continue}if(g.kind==='flash'){broadcast(r,{type:'explosion',position:{x:g.x,y:g.y,z:g.z},kind:'flash'});for(const v of r.players.values()){if(v.hp<=0)continue;const dist=Math.hypot(v.x-g.x,eye(v)-g.y,v.z-g.z);if(dist<22&&wallDistance({x:g.x,y:g.y,z:g.z},direction(Math.atan2(-(v.x-g.x),-(v.z-g.z)),Math.atan2(eye(v)-g.y,Math.hypot(v.x-g.x,v.z-g.z))),MAPS[r.map].boxes)>dist-.2)send(v,{type:'flash',duration:Math.round(2400*(1-dist/22))})}continue}broadcast(r,{type:'explosion',position:{x:g.x,y:g.y,z:g.z},kind:'grenade'});const owner=r.players.get(g.owner)||{id:g.owner,name:g.name,team:g.team,kills:0,money:0};for(const v of r.players.values()){if(v.hp<=0||v.invuln>clock||(!enemies(owner,v,r.mode)&&v.id!==g.owner))continue;const damage=blastDamage(g,v,MAPS[r.map].boxes);if(damage)dealDamage(owner,v,r,damage,false,'grenade',{x:v.x-g.x,y:.3,z:v.z-g.z});}}r.smokes=r.smokes.filter(x=>x.until>clock)}
function dealDamage(attacker,victim,r,damage,head,weapon,d){
 if(victim.hp<=0)return;
 if(victim.armor>0){const blocked=Math.min(victim.armor,Math.ceil(damage*.35));victim.armor-=blocked;damage-=blocked;}
 if(attacker&&enemies(attacker,victim,r.mode)){attacker.stats??={shots:0,hits:0,headshots:0,damage:0};attacker.stats.damage+=Math.min(victim.hp,damage);recordCombat(attacker.profile,{damage:Math.min(victim.hp,damage)});}
 victim.hp=Math.max(0,victim.hp-damage);if(attacker&&attacker.id!==victim.id)send(attacker,{type:'hit',head,kill:victim.hp===0});send(victim,{type:'hurt',damage,by:attacker?.id,direction:d});
 if(victim.hp===0){const enemy=attacker&&enemies(attacker,victim,r.mode);if(enemy){attacker.kills++;attacker.money=Math.min(16000,attacker.money+300);recordCombat(attacker.profile,{kill:1,headshot:Number(head)});send(attacker,{type:'profile',profile:publicProfile(attacker.profile)});if(!isRoundMode(r.mode)&&r.mode!=='ctf'&&r.mode!=='training')r.scores[attacker.team]++;if(r.mode==='arms'){const ids=modeLoadout('arms',attacker.kills),id=ids[0],w=WEAPONS[id];attacker.inventory={[id]:{ammo:w.mag,reserve:w.reserve},pistol:{ammo:WEAPONS.pistol.mag,reserve:WEAPONS.pistol.reserve},knife:{ammo:1,reserve:0}};attacker.primary=w.slot==='primary'?id:null;attacker.secondary=w.slot==='secondary'?id:'pistol';attacker.weapon=id;attacker.ammo=w.mag;attacker.reserve=w.reserve;}}victim.deaths++;dropObjectives(r,victim,clock);victim.respawn=isRoundMode(r.mode)?0:clock+2;victim.queue=[];victim.input={};broadcast(r,{type:'kill',killer:attacker?.name||'Bomba',victim:victim.name,victimId:victim.id,generation:victim.generation,victimTeam:victim.team,position:{x:victim.x,y:victim.y,z:victim.z},yaw:victim.yaw,crouch:victim.crouch,direction:d,team:attacker?.team||'orange',head,weapon});}
}
function rewoundTarget(p,r,v){
 if(p.bot||!r.history?.length)return v;const when=clock-Math.min((p.ping||0)/2000+.075,.25);let best=null,error=Infinity;
 for(const frame of r.history){const next=Math.abs(frame.time-when);if(next<error){best=frame;error=next}}
 return best?.players[v.id]||v;
}
function melee(p,r){
 const w=WEAPONS[p.weapon],o={x:p.x,y:eye(p),z:p.z},d=direction(p.yaw,p.pitch);p.stats??={shots:0,hits:0,headshots:0,damage:0};p.stats.shots++;p.nextFire=clock+w.interval;
 let nearest=w.range+.4,victim=null,to={x:o.x+d.x*w.range,y:o.y+d.y*w.range,z:o.z+d.z*w.range};
 for(const v of r.players.values()){if(!enemies(p,v,r.mode)||v.hp<=0||v.invuln>clock)continue;const tested=rewoundTarget(p,r,v),center={x:tested.x,y:tested.y+height(tested)*.55,z:tested.z},dx=center.x-o.x,dy=center.y-o.y,dz=center.z-o.z,dist=Math.hypot(dx,dy,dz);if(!dist||dist>nearest)continue;const toward={x:dx/dist,y:dy/dist,z:dz/dist};if(toward.x*d.x+toward.y*d.y+toward.z*d.z<.78||wallDistance(o,toward,MAPS[r.map].boxes)<dist-.3)continue;nearest=dist;victim=v;to=center}
 broadcast(r,{type:'melee',id:p.id,weapon:p.weapon,from:o,to});
 if(victim){p.stats.hits++;broadcast(r,{type:'impact',victimId:victim.id,head:false,position:to,direction:d});dealDamage(p,victim,r,w.damage,false,p.weapon,d);}
}
function fire(p,r){const w=WEAPONS[p.weapon];if(w.melee)return melee(p,r);p.stats??={shots:0,hits:0,headshots:0,damage:0};p.stats.shots++;let countedHit=false,countedHead=false;p.ammo--;p.inventory[p.weapon].ammo=p.ammo;p.nextFire=clock+w.interval;const spread=w.spread*(p.input?.aim?.65:1)+(Math.hypot(p.vx,p.vz)>1?.014:0)+(p.ground?0:.018);for(let pellet=0;pellet<(w.pellets||1);pellet++){const yaw=p.yaw+(Math.random()-.5)*spread,pitch=p.pitch+(Math.random()-.5)*spread;const o={x:p.x,y:eye(p),z:p.z},d=direction(yaw,pitch);let nearest=wallDistance(o,d,MAPS[r.map].boxes),victim=null,head=false;for(const v of r.players.values()){if(!enemies(p,v,r.mode)||v.hp<=0||v.invuln>clock)continue;const tested=rewoundTarget(p,r,v);if(smokeBlocks(o,{x:tested.x,y:eye(tested),z:tested.z},r.smokes,clock))continue;const hit=playerHit(o,d,tested,.12);if(hit.distance<nearest){nearest=hit.distance;victim=v;head=hit.head}}
 broadcast(r,{type:'shot',id:p.id,weapon:p.weapon,from:o,to:{x:o.x+d.x*nearest,y:o.y+d.y*nearest,z:o.z+d.z*nearest}});
 if(victim){if(!countedHit){p.stats.hits++;countedHit=true}if(head&&!countedHead){p.stats.headshots++;countedHead=true}broadcast(r,{type:'impact',victimId:victim.id,head,position:{x:o.x+d.x*nearest,y:o.y+d.y*nearest,z:o.z+d.z*nearest},direction:d});dealDamage(p,victim,r,head?w.head:w.damage,head,p.weapon,d);}

}}

function tick(){clock+=1/60;for(const r of rooms.values()){
 const humanCount=[...r.players.values()].filter(p=>!p.bot).length;if(!humanCount){if(!r.permanent&&clock-r.emptySince>120){rooms.delete(r.id);lobby()}continue}
 if(isRoundMode(r.mode))advanceRounds(r);
 if(!isRoundMode(r.mode)&&r.restart&&clock>=r.restart){r.map=mapWinner(r.votes,r.map,Object.keys(MAPS).filter(x=>x!=='range'));r.votes.clear();r.scores={blue:0,orange:0};r.flags=initialFlags();r.end=clock+r.minutes*60;r.restart=0;for(const p of r.players.values()){p.kills=0;p.deaths=0;p.captures=0;p.stats={shots:0,hits:0,headshots:0,damage:0};spawn(p,r)}broadcast(r,{type:'event',kind:'newmatch'})}
 if(!isRoundMode(r.mode)&&!r.restart&&(clock>=r.end||r.scores.blue>=modeLimit(r.mode)||r.scores.orange>=modeLimit(r.mode))){r.restart=clock+8;sendMapVote(r);broadcast(r,{type:'end',winner:r.scores.blue===r.scores.orange?'draw':r.scores.blue>r.scores.orange?'blue':'orange'})}
 for(const p of r.players.values()){
 let i=p.bot?botInput(p,r):p.queue.shift();if(i){p.input=i;p.lastInputAt=clock;if(!p.bot)p.ack=i.seq}else i=clock-(p.lastInputAt||0)>.2?{}:p.input;
 if(p.hp<=0){if(!isRoundMode(r.mode)&&clock>=p.respawn&&!r.restart)spawn(p,r);continue}if(r.restart)continue;
 if(isRoundMode(r.mode)&&r.phase!=='live')continue;
 if(r.mode==='training'){if(!p.bot){p.reserve=999;p.inventory[p.weapon].reserve=999;}else{i.x=Math.sign((-16+p.botIndex*8+Math.sin(clock*.8+p.botIndex)*2)-p.x);}}if(p.bot&&i.grenade)throwGrenade(p,r);simulate(p,i,1/60,MAPS[r.map].boxes);if(i.weapon&&p.inventory[i.weapon]&&i.weapon!==p.weapon){p.inventory[p.weapon]={ammo:p.ammo,reserve:p.reserve};p.weapon=i.weapon;Object.assign(p,p.inventory[p.weapon]);p.reloadAt=0;p.nextFire=Math.max(p.nextFire,clock+.3)}
 const w=WEAPONS[p.weapon];if(p.reloadAt&&clock>=p.reloadAt){const n=Math.min(w.mag-p.ammo,p.reserve);p.ammo+=n;p.reserve-=n;p.inventory[p.weapon]={ammo:p.ammo,reserve:p.reserve};p.reloadAt=0}
 if((i.reload||i.fire&&p.ammo===0)&&!p.reloadAt&&p.ammo<w.mag&&p.reserve>0)p.reloadAt=clock+w.reload;
 if(i.fire&&p.ammo>0&&!p.reloadAt&&clock>=p.nextFire){p.invuln=Math.min(p.invuln,clock);fire(p,r)}
 }
 if(!isRoundMode(r.mode)||r.phase==='live')tickGrenades(r);
 if(r.mode==='bomb'){const winner=updateBomb(r,clock,event=>{broadcast(r,event);if(event.kind==='exploded'){for(const v of r.players.values()){if(v.hp<=0)continue;const damage=blastDamage(event.position,v,MAPS[r.map].boxes,30,400);if(damage)dealDamage(null,v,r,damage,false,'bomb',{x:0,y:1,z:0});}}});if(winner&&r.phase==='live')endRound(r,winner);}
 if(r.mode==='ctf')updateFlags(r,clock,event=>broadcast(r,event));
 r.history??=[];r.history.push({time:clock,players:Object.fromEntries([...r.players.values()].map(p=>[p.id,{x:p.x,y:p.y,z:p.z,crouch:p.crouch}]))});if(r.history.length>15)r.history.shift();
 }}
let previousTick=performance.now(),tickAccumulator=0;
const timer=setInterval(()=>{const now=performance.now();tickAccumulator+=Math.min((now-previousTick)/1000,.1);previousTick=now;while(tickAccumulator>=1/60){tick();tickAccumulator-=1/60}},8);
const snapshots=setInterval(()=>{for(const r of rooms.values()){if(!r.players.size)continue;const players=[...r.players.values()].map(p=>({id:p.id,name:p.name,team:p.team,bot:!!p.bot,role:p.bot?BOT_ROLES[(p.botIndex||0)%BOT_ROLES.length]:null,grenades:p.grenades,utility:p.utility,skin:p.profile?.skin||'standard',x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch,vx:p.vx,vy:p.vy,vz:p.vz,ground:p.ground,jumpHeld:p.jumpHeld,crouch:p.crouch,hp:p.hp,inBase:inOwnBase(p),canBuy:p.hp>0&&inOwnBase(p)&&!r.restart&&(!isRoundMode(r.mode)||r.phase!=='matchEnd'),armor:p.armor,money:p.money,captures:p.captures||0,primary:p.primary,secondary:p.secondary,weapon:p.weapon,ammo:p.ammo,reserve:p.reserve,reload:Math.max(0,p.reloadAt-clock),reloadEnd:p.reloadAt,kills:p.kills,deaths:p.deaths,ping:Math.round(p.ping),ack:p.ack,invuln:p.invuln>clock,respawn:Math.max(0,p.respawn-clock),generation:p.generation}));broadcast(r,{type:'state',time:clock,map:r.map,mode:r.mode,flags:r.mode==='ctf'?r.flags:undefined,bomb:r.mode==='bomb'?r.bomb:undefined,grenades:r.grenades.map(g=>({id:g.id,kind:g.kind,x:g.x,y:g.y,z:g.z})),smokes:r.smokes.filter(x=>x.until>clock),phase:r.phase,round:r.round,roundTarget:ROUND_TARGET,remaining:Math.max(0,(r.mode==='bomb'&&r.bomb?.state==='planted'?r.bomb.detonateAt:isRoundMode(r.mode)?r.phaseEnd:r.end)-clock),restart:Math.max(0,r.restart-clock),scores:r.scores,players})}},1000/20);
const cleanup=setInterval(()=>{for(const p of peers){if(!p.alive){p.ws.terminate();continue}p.alive=false;p.ws.ping()}for(const [k,v] of limits)if(Date.now()>v.until)limits.delete(k)},15000);
makeRoom({name:'Çöl Geçidi / Bomba Kurma',permanent:true,mode:'bomb',map:'dust2',maxPlayers:12,botCount:7});
makeRoom({name:'Doklar / Herkese açık',permanent:true,mode:'rounds'});
makeRoom({name:'Buz Arenası / Rekabetçi',permanent:true,mode:'rounds',map:'iceworld'});
makeRoom({name:'Çöl Geçidi / Rekabetçi',permanent:true,mode:'rounds',map:'dust2'});
makeRoom({name:'Buz Arenası / Bayrak Kapmaca',permanent:true,mode:'ctf',map:'iceworld'});
makeRoom({name:'Rafineri / Silah Yarışı',permanent:true,mode:'arms',map:'refinery',maxPlayers:12,botCount:7});
makeRoom({name:'Doklar / Herkes Tek',permanent:true,mode:'ffa',map:'docks',maxPlayers:12,botCount:7});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Sector 16 ready at http://'+(process.env.HOST||'127.0.0.1')+':'+(process.env.PORT||3000)));
function stop(){clearInterval(timer);clearInterval(snapshots);clearInterval(cleanup);for(const p of peers)p.ws.close(1001,'Server restarting');wss.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref()}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
