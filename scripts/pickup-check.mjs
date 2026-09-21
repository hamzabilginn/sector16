import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'31826',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try{
 await once(server.stdout,'data');browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1180,height:820},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('dist/app.js','utf8')+"\nwindow.pickupQA={body:()=>lastState.players.find(p=>p.id===myId),walk:(x,z)=>{yaw=0;keys.clear();if(x)keys.add(x>0?'KeyD':'KeyA');if(z)keys.add(z>0?'KeyS':'KeyW')}};"}));
 await page.goto('http://127.0.0.1:31826');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();
 await page.locator('#nickname').fill('Pickup QA');await page.locator('#preferredTeam').selectOption('blue');await page.locator('#createButton').tap();await page.locator('[name=name]').fill('Supply QA');await page.locator('[name=mode]').selectOption('tdm');await page.locator('#botCount').fill('0');await page.locator('#createForm button[type=submit]').tap();await page.locator('#resume').tap();await page.locator('#touchControls').waitFor({state:'visible'});
 const initial=await page.evaluate(()=>pickupQA.body());
 const pads=[[-20,'smg'],[-4,'m4'],[4,'awp'],[12,'shotgun'],[20,'deagle']].sort((a,b)=>Math.abs(initial.x-a[0])-Math.abs(initial.x-b[0])),target=process.env.QA_WEAPON==='m249'?[26,'m249']:pads[0];
 for(let n=0;n<200;n++){const p=await page.evaluate(()=>pickupQA.body()),dx=target[0]-p.x,dz=30-p.z;if(Math.hypot(dx,dz)<1.3)break;await page.evaluate(([x,z])=>pickupQA.walk(Math.abs(x)>.4?Math.sign(x):0,Math.abs(z)>.4?Math.sign(z):0),[dx,dz]);await page.waitForTimeout(70);}
 await page.evaluate(()=>pickupQA.walk(0,0));await page.locator('#pickupWeapon').waitFor({state:'visible'});await page.screenshot({path:'artifacts/team-supply.png'});await page.locator('#pickupWeapon').tap();
 await page.waitForFunction(w=>pickupQA.body().weapon===w,target[1]);const equipped=await page.evaluate(()=>pickupQA.body());assert.equal(equipped.money,initial.money);assert.equal(equipped.ammo,target[1]==='m249'?100:target[1]==='awp'?10:target[1]==='shotgun'?8:target[1]==='deagle'?7:30);
 await page.waitForTimeout(600);const fire=await page.locator('#touchFire').boundingBox();await page.mouse.move(fire.x+fire.width/2,fire.y+fire.height/2);await page.mouse.down();await page.waitForFunction(a=>pickupQA.body().ammo<a,equipped.ammo);await page.mouse.up();assert.deepEqual(errors,[]);console.log('PASS: iPad touch pickup, actual server movement, weapon equipped, money preserved, animated supply scene without runtime errors');
}finally{await browser?.close();server.kill()}
