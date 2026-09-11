import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Haptics,ImpactStyle} from '@capacitor/haptics';
import {ScreenOrientation} from '@capacitor/screen-orientation';
window.SECTOR16_CONFIG={native:Capacitor.isNativePlatform(),serverUrl:__SERVER_URL__};
let lastHaptic=0;
window.SECTOR16_NATIVE={haptic(){const now=performance.now();if(now-lastHaptic<120||localStorage.getItem('s16.haptics')==='false')return;lastHaptic=now;Haptics.impact({style:ImpactStyle.Light}).catch(()=>{});}};
if(Capacitor.isNativePlatform()){
  App.addListener('appStateChange',({isActive})=>{if(!isActive)window.dispatchEvent(new Event('sector16-pause'));});
  App.addListener('backButton',()=>{const e=new Event('sector16-back',{cancelable:true});if(window.dispatchEvent(e))App.exitApp();});
  ScreenOrientation.lock({orientation:'landscape'}).catch(()=>{});
}
await import('../dist/app.js');
