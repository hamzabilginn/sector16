import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
const mark='<path d="M32 35h10v38H31V46h-7V36z M51 35h25v10H61v5h15v23H50V36z M61 59v5h5v-5z" fill="#b4f287"/>';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#111b1b"/><path d="M18 27V18h18M64 18h18v9M82 73v9H64M36 82H18v-9" fill="none" stroke="#4e7860" stroke-width="2"/>${mark}</svg>`;
await mkdir('store',{recursive:true});await writeFile('store/icon.svg',svg);
async function render(file,size,content=svg){await page.setViewportSize({width:size,height:size});await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{width:100%;height:100%}</style>${content}`);await page.screenshot({path:file});}
await render('store/icon-512.png',512);await render('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',1024);
for(const [density,size]of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){for(const name of ['ic_launcher','ic_launcher_round'])await render(`android/app/src/main/res/mipmap-${density}/${name}.png`,size);}
await writeFile('android/app/src/main/res/drawable/sector16_foreground.xml',`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="100" android:viewportHeight="100"><path android:fillColor="#b4f287" android:pathData="M32,35h10v38H31V46h-7V36z M51,35h25v10H61v5h15v23H50V36z M61,59v5h5v-5z"/></vector>`);
for(const name of ['ic_launcher','ic_launcher_round'])await writeFile(`android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`,'<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@drawable/sector16_foreground"/><monochrome android:drawable="@drawable/sector16_foreground"/></adaptive-icon>');
await writeFile('android/app/src/main/res/values/ic_launcher_background.xml','<resources><color name="ic_launcher_background">#111b1b</color></resources>');
for(const n of ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png'])await render('ios/App/App/Assets.xcassets/Splash.imageset/'+n,2732,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#111b1b"/><g transform="translate(35 35) scale(.3)">${mark}</g></svg>`);
await browser.close();console.log('Original Sector16 icons generated');
