import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile,writeFile,unlink,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const fixture='server/.escort-qa.mjs';let server,browser;
try{
 await writeFile(fixture,await readFile('server/index.mjs','utf8')+`
process.on('message',()=>{for(const r of rooms.values())if(r.mode==='escort'&&r.players.size){r.escort.progress=1;r.escort.completed=true}});`);
 server=spawn(process.execPath,[fixture],{env:{...process.env,PORT:'31830',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});await once(server.stdout,'data');
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('dist/app.js','utf8')+`
window.escortQA={state:()=>({map:lastState?.map,mode:lastState?.mode,cart:lastState?.escort,match:lastState?.matchId,body,visible:escortVisual?true:false,dpr:renderer.getPixelRatio()}),walk:(x,z)=>{yaw=0;keys.clear();if(x)keys.add(x>0?'KeyD':'KeyA');if(z)keys.add(z>0?'KeyS':'KeyW')},lower:()=>{resolutionScale=.66;updateQuality();return renderer.getPixelRatio()}};`}));
 await page.goto('http://127.0.0.1:31830');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();await page.locator('#nickname').fill('Escort QA');await page.locator('#preferredTeam').selectOption('orange');await page.locator('#createButton').tap();await page.locator('[name=name]').fill('Escort QA Room');await page.locator('[name=mode]').selectOption('escort');assert.equal(await page.locator('[name=map]').inputValue(),'depot');await page.locator('#botCount').fill('1');await page.locator('#createForm button[type=submit]').tap();await page.locator('#resume').tap();
 await page.waitForFunction(()=>escortQA.state().cart?.progress>=0);const first=await page.evaluate(()=>escortQA.state());assert.equal(first.map,'depot');assert.equal(first.mode,'escort');assert.equal(first.body.team,'orange');assert.ok(await page.locator('#objective').isVisible());
 for(let n=0;n<170;n++){const s=await page.evaluate(()=>escortQA.state());if(s.cart.progress>.003)break;const dx=s.cart.x-s.body.x,dz=s.cart.z-s.body.z;await page.evaluate(([x,z])=>escortQA.walk(Math.abs(x)>.3?Math.sign(x):0,Math.abs(z)>.3?Math.sign(z):0),[dx,dz]);await page.waitForTimeout(70)}await page.waitForFunction(()=>escortQA.state().cart.progress>.003);await page.evaluate(()=>escortQA.walk(0,0));
 const dpr=await page.evaluate(()=>escortQA.lower());assert.ok(dpr<1);await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/escort-mobile.png'});
 server.send('deliver');await page.locator('#matchResults').waitFor({state:'visible',timeout:10000});await page.waitForFunction(id=>escortQA.state().match>id,first.match,{timeout:20000});await page.waitForFunction(()=>escortQA.state().cart.progress===0);assert.equal((await page.evaluate(()=>escortQA.state())).map,'depot');assert.deepEqual(errors,[]);console.log('PASS: mobile escort, server-authoritative cart progress, mission HUD, adaptive pixel ratio, completed match and same-room reset');
}finally{await browser?.close();server?.kill();await unlink(fixture).catch(()=>{})}
