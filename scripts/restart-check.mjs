import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const fixture='server/.restart-qa.mjs';let server,browser;
try{
 await writeFile(fixture,await readFile('server/index.mjs','utf8')+`\nprocess.on('message',()=>{for(const r of rooms.values())if(r.players.size){if(isRoundMode(r.mode)){r.scores.blue=ROUND_TARGET-1;endRound(r,'blue')}else r.end=clock-.1}});`);
 server=spawn(process.execPath,[fixture],{env:{...process.env,PORT:'31823',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});await once(server.stdout,'data');
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js?*',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('dist/app.js','utf8')+`\nwindow.restartQA={state:()=>({match:lastState?.matchId,map:lastState?.map,ammo:body?.ammo,generation:body?.generation,locked,phase:lastState?.phase}),send};`}));
 await page.goto('http://127.0.0.1:31823');await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor();assert.equal(await page.locator('#profileXp,#profileRank,#missions,#mapVote').count(),0);
 await page.locator('#nickname').fill('Restart QA');await page.locator('#createButton').tap();await page.locator('[name=name]').fill('Restart test');await page.locator('#botCount').fill(process.env.QA_MODE?'1':'0');await page.locator('[name=mode]').selectOption(process.env.QA_MODE||'tdm');await page.locator('#createForm button[type=submit]').tap();await page.locator('#resume').tap();await page.locator('#touchControls').waitFor({state:'visible'});
 const original=await page.evaluate(()=>restartQA.state());
 for(let n=0;n<3;n++){
  if(process.env.QA_MODE)await page.waitForFunction(()=>restartQA.state().phase==='live');await page.waitForTimeout(650);const before=await page.evaluate(()=>restartQA.state());console.log('Match',n,before);const rect=await page.locator('#touchFire').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.waitForFunction(a=>restartQA.state().ammo<a,before.ammo);await page.mouse.up();
  if(n===2)break;
  server.send('end');await page.locator('#matchResults').waitFor({state:'visible'});await page.waitForFunction(m=>restartQA.state().match>m,before.match,{timeout:20000});await page.locator('#matchResults').waitFor({state:'hidden'});await page.locator('#resume').tap();await page.locator('#touchControls').waitFor({state:'visible'});assert.equal((await page.evaluate(()=>restartQA.state())).map,original.map);
 }
 for(const size of [{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);
  for(const id of ['touchFire','touchAim','touchJump','touchCrouch','touchReload','touchWeapon','touchGrenade']){const rect=await page.locator('#'+id).boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=size.width+1&&rect.y+rect.height<=size.height+1,id+' stays on screen');}
  const aim=await page.locator('#touchAim').boundingBox();assert.ok(size.width-aim.x-aim.width<20,'Aim is on edge');
  await page.mouse.dblclick(size.width*.55,size.height*.45);assert.equal(await page.evaluate(()=>visualViewport.scale),1);assert.equal(await page.locator('#lookZone').evaluate(e=>getComputedStyle(e).touchAction),'none');
 }
 assert.deepEqual(errors,[]);console.log('PASS: 3 consecutive matches fire correctly, same map, no progression or voting UI, edge controls and double-tap scale 1');
}finally{await browser?.close();server?.kill();await unlink(fixture).catch(()=>{});}
