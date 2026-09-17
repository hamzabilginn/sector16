import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'31825',HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try{
  await once(server.stdout,'data');
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.SECTOR16_CONFIG={native:true};localStorage.clear()});
  await page.goto('http://127.0.0.1:31825');
  await page.getByText('SUNUCU ÇEVRİMİÇİ',{exact:true}).waitFor({timeout:15000});
  assert.match(await page.locator('#nickname').inputValue(),/^Oyuncu \d{4}$/);
  await page.locator('#quickPlay').tap();
  await page.locator('#touchControls').waitFor({state:'visible',timeout:15000});
  await page.locator('#pause').waitFor({state:'hidden'});
  assert.equal(await page.locator('#hud').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('APP REVIEW PASS: clean iPad install enters a playable match with one tap.');
}finally{
  await browser?.close();
  server.kill();
}
