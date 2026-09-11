import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1024,height:500}});
await page.setContent(`<style>body{margin:0;background:#101a1c;color:#eff5e8;font-family:Arial,sans-serif}.art{height:500px;box-sizing:border-box;padding:72px 66px;background:linear-gradient(110deg,#101a1c 55%,#23403a)}.tag{font-size:15px;letter-spacing:5px;color:#b4f287}.title{font-size:104px;font-weight:900;letter-spacing:-6px;line-height:1.15;margin:30px 0 14px}.title span{color:#b4f287}p{font-size:24px;color:#b4c5be;letter-spacing:2px}.frame{position:absolute;right:68px;top:150px;width:120px;height:120px;border:2px solid #6a9b72;transform:rotate(45deg)}.frame:before,.frame:after{content:'';position:absolute;background:#b4f287}.frame:before{width:160px;height:2px;top:59px;left:-20px}.frame:after{width:2px;height:160px;top:-20px;left:59px}</style><div class="art"><div class="tag">TAKIMINI SEÇ. ALANA GİR.</div><div class="title">SECTOR <span>16</span></div><p>ÇEVRİMİÇİ TAKTİK MÜCADELE</p><div class="frame"></div></div>`);
await page.screenshot({path:'store/feature-1024x500.png'});await browser.close();
let licenses='# Third-party licenses\n\n';
for(const pkg of ['three','@capacitor/core','@capacitor/android','@capacitor/ios','@capacitor/app','@capacitor/haptics','@capacitor/screen-orientation','ws']){for(const name of ['LICENSE','LICENSE.md','LICENSE.txt']){try{licenses+='\n## '+pkg+'\n\n'+await readFile('node_modules/'+pkg+'/'+name,'utf8')+'\n';break}catch{}}}
await writeFile('THIRD-PARTY-LICENSES.md',licenses);
