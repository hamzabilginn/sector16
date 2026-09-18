import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'31821',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 await once(server.stdout,'data');browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});await mkdir('artifacts',{recursive:true});
 for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:{width:mobile?844:1280,height:mobile?390:720},hasTouch:mobile,isMobile:mobile});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('dist/app.js','utf8')+`\nwindow.scopeQA={send,start:()=>{locked=true;$('pause').hidden=true;wakeAudio()},state:()=>({selected,locked,mouseAim:mouse.aim,hp:body.hp,reload:body.reload,zoomLevel,effectiveZoom,fov:camera.fov,base:prefs.fov,projection:camera.projectionMatrix.elements[5],ammo:body.ammo,lastShot})};`}));
 await page.goto('http://127.0.0.1:31821');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();
 await page.evaluate(()=>scopeQA.send({type:'training',nickname:'Scope QA'}));await page.locator('#hud').waitFor({state:'visible'});
 await page.evaluate(()=>scopeQA.send({type:'trainingweapon',weapon:'awp'}));await page.waitForFunction(()=>scopeQA.state().selected==='awp');await page.waitForTimeout(250);await page.evaluate(()=>scopeQA.start());await page.waitForTimeout(150);
 const initial=await page.evaluate(()=>scopeQA.state());
 for(const level of [1,2,0]){
 if(mobile)await page.locator('#touchAim').tap();else await page.mouse.click(640,360,{button:'right'});
 await page.waitForFunction(l=>scopeQA.state().zoomLevel===l,level);await page.waitForFunction(l=>{const s=scopeQA.state(),r=s.projection/(1/Math.tan(s.base*Math.PI/360));return Math.abs(r-(l===1?4:l===2?8:1))<.03},level,{timeout:30000});const state=await page.evaluate(()=>scopeQA.state());
 const ratio=state.projection/(1/Math.tan(state.base*Math.PI/360));assert.ok(Math.abs(ratio-(level===1?4:level===2?8:1))<.03,JSON.stringify(state));
 if(level){const rect=await page.locator('#scope').boundingBox();assert.ok(Math.abs(rect.x+rect.width/2-(mobile?422:640))<2,'Scope must be centered horizontally');assert.ok(Math.abs(rect.y+rect.height/2-(mobile?195:360))<2,'Scope must be centered vertically');assert.ok(Math.abs(rect.width-rect.height)<2,'Scope must be circular');await page.screenshot({path:`artifacts/awp-${mobile?'mobile':'desktop'}-${level}.png`});}
 if(level===2){const before=state.lastShot;if(mobile){const rect=await page.locator('#touchFire').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);}else await page.mouse.move(640,360);await page.mouse.down();await page.waitForFunction(t=>scopeQA.state().lastShot>t,before);await page.mouse.up();assert.equal(await page.evaluate(()=>scopeQA.state().effectiveZoom),2,'Shot must retain zoom');await page.locator('#scope').waitFor({state:'visible'});}
 }
 assert.deepEqual(errors,[]);await context.close();console.log(`AWP PASS: ${mobile?'mobile':'desktop'} 4x/8x/off, centered circular scope, shot retains zoom, no runtime errors`);
 }
}finally{await browser?.close();server.kill();}
