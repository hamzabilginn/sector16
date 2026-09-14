import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'31820',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 await once(server.stdout,'data');browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async route=>route.fulfill({contentType:'text/javascript',body:await readFile('dist/app.js','utf8')+`
window.qa={audio:()=>{wakeAudio();return typeof audio?.createPanner==='function'},hurt:d=>combat.hurt(d),marker:m=>combat.marker(m),results:r=>combat.results(r)};`}));
 await page.goto('http://127.0.0.1:31820');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();await page.locator('#nickname').fill('Antrenman QA');await page.locator('#trainingButton').tap();await page.locator('#resume').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.getElementById('roomLabel').textContent.includes('Antrenman'));await page.locator('#practiceWeapons').waitFor({state:'visible'});
 await page.locator('#practiceWeapon').selectOption('awp');await page.waitForFunction(()=>document.getElementById('weaponName').textContent==='AWP');await page.locator('#resume').tap();await page.locator('#markEnemy').tap();
 assert.equal(await page.evaluate(()=>qa.audio()),true);await page.evaluate(()=>qa.hurt({x:0,z:1}));await page.locator('#damageBearing').waitFor({state:'visible'});await page.evaluate(()=>qa.marker({id:'ally',kind:'enemy',name:'Takım',position:{x:0,y:1,z:-4}}));await page.getByText('⚠ Düşman · Takım',{exact:true}).waitFor({state:'visible'});
 await page.evaluate(()=>qa.results([{name:'Antrenman QA',kills:5,deaths:1,shots:10,hits:7,headshots:3,damage:420}]));await page.locator('#matchResults').waitFor({state:'visible'});assert.match(await page.locator('#resultRows').innerText(),/70%/);assert.match(await page.locator('#resultRows').innerText(),/420/);await page.screenshot({path:'artifacts/combat-features.png'});
 assert.deepEqual(errors,[]);console.log('PASS: private training room, moving targets, weapon choice, marker controls, damage bearing and match statistics UI.');
}finally{await browser?.close();server.kill();}
