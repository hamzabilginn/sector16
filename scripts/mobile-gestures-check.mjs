import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const html=(await readFile('dist/index.html','utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')+`
<script type="module">
import {mobileControls} from '/mobile.js';
document.getElementById('lobby').hidden=true;
window.turns=0;
window.controls=mobileControls({look:()=>window.turns++,action:()=>{},pause:()=>{},score:()=>{},shop:()=>{}});
window.alive={bomb:true,dead:false,spectating:false,grenades:1,weapon:'rifle'};
controls.context(alive);controls.setActive(true);
</script>`;
const files=new Map(await Promise.all(['mobile.js','mobile.css','style.css','rounds.css'].map(async name=>['/'+name,await readFile('dist/'+name)])));
const server=createServer((req,res)=>{
 const data=req.url==='/'?html:files.get(req.url);
 res.writeHead(data?200:404,{'Content-Type':req.url==='/'?'text/html':req.url.endsWith('.js')?'text/javascript':'text/css'});res.end(data||'');
});
server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.controls);
 const cdp=await context.newCDPSession(page);
 const point=async(id,selector)=>{const b=await page.locator(selector).boundingBox();return {id,x:b.x+b.width/2,y:b.y+b.height/2};};
 const send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 const state=()=>page.evaluate(()=>({...controls.state}));
 const fire=await point(1,'#touchFire'),stick=await point(2,'#moveStick');stick.y-=30;
 await send('touchStart',[fire,stick]);assert.equal((await state()).fire,true);assert((await state()).z<0);
 await send('touchMove',[{...fire,x:fire.x-25},stick]);assert((await page.evaluate(()=>turns))>0);
 await send('touchCancel',[]);assert.equal((await state()).fire,false);assert.equal((await state()).z,0);

 // A held control can disappear without a pointerup (death, spectating, bomb mode).
 for(const [selector,key,patch] of [['#touchFire','fire',{dead:true}],['#touchJump','jump',{spectating:true}],['#touchInteract','interact',{bomb:false}]]){
  await page.evaluate(()=>controls.context(alive));
  await send('touchStart',[await point(1,selector)]);assert.equal((await state())[key],true);
  await page.evaluate(patch=>controls.context({...alive,...patch}),patch);
  assert.equal((await state())[key],false,`${key} must clear when unavailable`);
  assert.equal(await page.locator(selector).getAttribute('aria-pressed'),'false');
  await send('touchEnd',[]);
 }
 await page.evaluate(()=>controls.context(alive));
 for(const event of ['blur','resize','pagehide']){
  await send('touchStart',[fire,stick]);
  await page.evaluate(type=>window.dispatchEvent(new Event(type)),event);
  assert.equal((await state()).fire,false);assert.equal((await state()).z,0);
  await send('touchEnd',[]);
 }
 await page.locator('#touchAim').tap();assert.equal((await state()).aim,1);
 await page.evaluate(()=>controls.context({...alive,dead:true}));assert.equal((await state()).aim,0);
 await page.evaluate(()=>controls.context(alive));
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).touchAction),'none');
 // These gestures originate outside the touch-controls element, over the HUD.
 for(const type of ['dblclick','gesturestart','gesturechange'])assert.equal(await page.evaluate(type=>document.body.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),false);
 const scale=await page.evaluate(()=>visualViewport.scale);
 await send('touchStart',[{id:1,x:380,y:200},{id:2,x:440,y:200}]);
 await send('touchMove',[{id:1,x:290,y:200},{id:2,x:530,y:200}]);await send('touchEnd',[]);
 assert.equal(await page.evaluate(()=>visualViewport.scale),scale,'Pinch must not zoom gameplay');
 await page.evaluate(()=>controls.setActive(false));
 assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).touchAction),'none');
 assert.equal(await page.evaluate(()=>document.body.dispatchEvent(new Event('gesturestart',{bubbles:true,cancelable:true}))),true,'Paused menus retain browser gestures');
 await page.evaluate(()=>document.getElementById('touchAim').click());assert.equal((await state()).aim,0);
 await page.evaluate(()=>controls.setActive(true));await page.locator('#touchAim').tap();assert.equal((await state()).aim,1,'Controls work again after resume');
 assert.deepEqual(errors,[]);
 console.log('PASS: multi-touch, cancellation, unavailable buttons, lifecycle reset, death aim reset, gameplay pinch protection, paused gestures, resume.');
}finally{await browser?.close();server.close();}
