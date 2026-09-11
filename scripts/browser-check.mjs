import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'31816',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 await once(server.stdout,'data');
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Instrument only the served test copy; no QA hooks are shipped in app.js.
 await page.route('**/app.js?*',async route=>{const source=await readFile('dist/app.js','utf8');await route.fulfill({contentType:'text/javascript',body:source+`\nwindow.__qa={impactEffect,deathEffect,clearEffects,getRemote:()=>[...remote.values()].map(v=>v.state),getEffects:()=>effects.length,getBody:()=>body,getCamera:()=>({x:camera.position.x,y:camera.position.y,z:camera.position.z}),fixture:()=>{window.__freezeQA=true;lastState.mode='bomb';lastState.phase='live';lastState.bomb={state:'planted',x:body.x,y:0,z:body.z-4,detonateAt:lastState.time+40,defuseBy:null};body.hp=0;locked=true;tactical.update(lastState);}};const realReceive=receiveState;receiveState=s=>{if(!window.__freezeQA)realReceive(s)};`});});
 await page.goto('http://127.0.0.1:31816');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();
 await page.locator('#nickname').fill('Kontrol');await page.locator('#preferredTeam').selectOption('orange');await page.locator('#createButton').click();
 await page.locator('[name=maxPlayers]').selectOption('16');await page.locator('#botCount').fill('15');await page.locator('#botDifficulty').selectOption('hard');
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/bot-settings.png'});
 await page.locator('[name=maxPlayers]').selectOption('2');assert.equal(await page.locator('#botCount').inputValue(),'1');
 await page.locator('[name=maxPlayers]').selectOption('8');await page.locator('#botCount').fill('3');await page.locator('[name=name]').fill('Efekt Testi');await page.locator('[name=mode]').selectOption('tdm');
 await page.locator('#createForm button[type=submit]').click();await page.locator('#hud').waitFor({state:'visible'});await page.waitForFunction(()=>window.__qa?.getRemote().length===3);
 assert.equal(await page.evaluate(()=>window.__qa.getBody().team),'orange');
 await page.locator('#teamButton').click();await page.screenshot({path:'artifacts/team-selection.png'});await page.locator('#chooseBlue').click();await page.waitForFunction(()=>window.__qa.getBody().team==='blue');

 await page.evaluate(()=>{document.getElementById('pause').hidden=true;const v=window.__qa.getRemote()[0];window.__qa.impactEffect({victimId:v.id,position:{x:v.x,y:v.y+1,z:v.z},direction:{x:0,y:0,z:1},head:false});});
 assert.ok(await page.evaluate(()=>window.__qa.getEffects()>0));
 await page.evaluate(()=>{const v=window.__qa.getRemote()[0];window.__qa.deathEffect({victimId:v.id,generation:v.generation,position:v,yaw:v.yaw,crouch:v.crouch,direction:{x:0,y:0,z:1}});});
 await page.waitForTimeout(450);await page.screenshot({path:'artifacts/game.png'});
 await page.evaluate(()=>window.__qa.clearEffects());
 await page.evaluate(()=>window.__qa.fixture());await page.waitForTimeout(100);const before=await page.evaluate(()=>({camera:window.__qa.getCamera(),body:{x:window.__qa.getBody().x,z:window.__qa.getBody().z}}));
 await page.keyboard.down('KeyW');await page.keyboard.down('Space');await page.waitForTimeout(400);await page.keyboard.up('KeyW');await page.keyboard.up('Space');
 const after=await page.evaluate(()=>({camera:window.__qa.getCamera(),body:{x:window.__qa.getBody().x,z:window.__qa.getBody().z}}));assert.notEqual(after.camera.y,before.camera.y);assert.deepEqual(after.body,before.body);await page.locator('#spectatorHelp').waitFor({state:'visible'});await page.locator('#objective').waitFor({state:'visible'});await page.screenshot({path:'artifacts/spectator-bomb-v14.png'});
 await page.evaluate(()=>{window.__freezeQA=false;});assert.equal(await page.evaluate(()=>{window.__qa.clearEffects();return window.__qa.getEffects()}),0);
 await page.evaluate(()=>{document.getElementById('pause').hidden=false;});await page.locator('#leave').click();await page.locator('#lobby').waitFor({state:'visible'});assert.equal(await page.locator('#game').evaluate(e=>e.classList.contains('is-dead')),false);
 const gallery=await browser.newPage({viewport:{width:1200,height:900}});gallery.on('pageerror',e=>errors.push(e.message));
 await gallery.route('**/qa-gallery',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><script type="importmap">{"imports":{"three":"/vendor/three.module.js"}}</script></head><body style="margin:0;background:#202b31"><script type="module">
 import * as THREE from 'three';import {createOperator,buildViewWeapon,animateReload} from '/models.js';
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1200,900);document.body.append(renderer.domElement);renderer.setClearColor(0x27333b);
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xd9eaff,0x766452,3));const key=new THREE.DirectionalLight(0xffe7ce,3);key.position.set(-3,5,4);scene.add(key);
 const a=createOperator('blue'),b=createOperator('orange');a.position.x=-.6;b.position.x=.6;b.rotation.y=-.45;scene.add(a,b);
 const camera=new THREE.PerspectiveCamera(36,1200/900,.05,50);camera.position.set(.3,1.4,-4.7);camera.lookAt(0,1.0,0);renderer.render(scene,camera);
 window.qa={renderer,scene,camera,buildViewWeapon,animateReload,THREE};window.ready=true;
 </script></body></html>`}));
 await gallery.goto('http://127.0.0.1:31816/qa-gallery');await gallery.waitForFunction(()=>window.ready);await gallery.screenshot({path:'artifacts/operators-v13.png'});
 const animationChecks=await gallery.evaluate(()=>{const {THREE,buildViewWeapon,animateReload}=window.qa;const results=[];for(const id of ['pistol','deagle','rifle','m4','awp','smg','shotgun']){const root=new THREE.Group();buildViewWeapon(root,id);const rest=root.userData.rig.magazine.position.clone();animateReload(root,id,.45);const moved=root.userData.rig.magazine.position.distanceTo(rest);animateReload(root,id,null);results.push({id,moved,reset:root.userData.rig.magazine.position.distanceTo(rest)});}return results;});
 for(const r of animationChecks){assert.equal(r.reset,0);if(r.id!=='shotgun')assert.ok(r.moved>.3);}
 await gallery.evaluate(()=>{const {THREE,renderer,scene,camera,buildViewWeapon,animateReload}=window.qa;for(const c of [...scene.children])if(c.isGroup)scene.remove(c);const root=new THREE.Group();scene.add(root);buildViewWeapon(root,'rifle');animateReload(root,'rifle',.45);camera.position.set(.5,.22,.75);camera.lookAt(0,-.10,-.13);renderer.render(scene,camera);});await gallery.screenshot({path:'artifacts/reload-v13.png'});
 assert.deepEqual(errors,[]);console.log('Browser PASS: teams, 7 reload rigs, articulated models, death FX, bomb HUD, free spectator camera without body movement, cleanup, no page errors.');
}finally{await browser?.close();server.kill();await once(server,'exit');}
