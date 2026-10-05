export const touchDevice=!!(navigator.maxTouchPoints>0||window.SECTOR16_CONFIG?.native);
export function mobileControls({look,action,pause,score,shop}){
 const root=document.getElementById('touchControls'),knob=document.getElementById('moveKnob'),stick=document.getElementById('moveStick');
 const state={x:0,z:0,fire:false,aim:0,jump:false,crouch:false,interact:false,reload:false,sprint:false};const resets=[];let enabled=false,moveId=null,lookId=null,last=null,currentWeapon='rifle';
 document.body.classList.toggle('touch-device',touchDevice);
 function release(element,id){if(id!==null&&element.hasPointerCapture(id))element.releasePointerCapture(id);}
 function reset(){for(const fn of resets)fn();release(stick,moveId);release(zone,lookId);Object.assign(state,{x:0,z:0,fire:false,aim:0,jump:false,crouch:false,interact:false,reload:false,sprint:false});moveId=null;lookId=null;last=null;knob.style.transform='translate(-50%,-50%)';for(const e of root.querySelectorAll('[aria-pressed]'))e.setAttribute('aria-pressed','false');document.getElementById('touchAim').textContent='NİŞAN';}
 function updateStick(e){const rect=stick.getBoundingClientRect(),radius=rect.width*.35,dx=e.clientX-rect.left-rect.width/2,dz=e.clientY-rect.top-rect.height/2,length=Math.hypot(dx,dz),scale=Math.min(1,radius/(length||1));state.x=length<radius*.12?0:dx*scale/radius;state.z=length<radius*.12?0:dz*scale/radius;state.sprint=length>radius*.88;knob.style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dz*scale}px))`;}
 stick.addEventListener('pointerdown',e=>{if(!enabled||moveId!==null)return;e.preventDefault();moveId=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e)});
 stick.addEventListener('pointermove',e=>{if(e.pointerId===moveId){e.preventDefault();updateStick(e)}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId!==moveId)return;moveId=null;state.x=state.z=0;state.sprint=false;knob.style.transform='translate(-50%,-50%)';});
 const zone=document.getElementById('lookZone');zone.addEventListener('pointerdown',e=>{if(!enabled||lookId!==null)return;e.preventDefault();lookId=e.pointerId;last={x:e.clientX,y:e.clientY};zone.setPointerCapture(e.pointerId)});
 zone.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||!last)return;e.preventDefault();look(e.clientX-last.x,e.clientY-last.y);last={x:e.clientX,y:e.clientY};});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(type,e=>{if(e.pointerId===lookId){lookId=null;last=null;}});
 const heldControls=[];
 function hold(id,key,drag=false){const button=document.getElementById(id);let idHeld=null,point=null;
  const clear=()=>{const previous=idHeld;idHeld=null;point=null;state[key]=false;button.setAttribute('aria-pressed','false');release(button,previous);};
  resets.push(clear);heldControls.push({button,clear});
  button.addEventListener('pointerdown',e=>{if(!enabled||button.disabled||button.hidden||idHeld!==null)return;e.preventDefault();e.stopPropagation();idHeld=e.pointerId;point={x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);state[key]=true;button.setAttribute('aria-pressed','true');});
  button.addEventListener('pointermove',e=>{if(e.pointerId!==idHeld||!drag||!point)return;e.preventDefault();look(e.clientX-point.x,e.clientY-point.y);point={x:e.clientX,y:e.clientY};});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{if(e.pointerId===idHeld)clear();});}
 hold('touchFire','fire',true);hold('touchJump','jump');hold('touchInteract','interact');hold('touchCrouch','crouch');
 document.getElementById('touchAim').onclick=()=>{state.aim=currentWeapon==='awp'?(Number(state.aim)+1)%3:(state.aim?0:1);const button=document.getElementById('touchAim');button.setAttribute('aria-pressed',String(state.aim>0));button.textContent=currentWeapon==='awp'&&state.aim?`NİŞAN ${state.aim===2?'8×':'4×'}`:'NİŞAN';};
 document.getElementById('touchReload').onclick=()=>state.reload=true;
 document.getElementById('touchGrenade').onclick=()=>action('grenade');document.getElementById('touchWeapon').onclick=()=>action('weapon');
 document.getElementById('touchPause').onclick=pause;document.getElementById('touchScore').onclick=score;document.getElementById('touchShop').onclick=shop;
 window.addEventListener('blur',reset);window.addEventListener('pagehide',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 // Cancel gestures across the whole game surface, including HUD controls outside root.
 // Menus keep normal scrolling and pinch zoom when gameplay is paused.
 for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])document.addEventListener(type,e=>{if(enabled)e.preventDefault();},{passive:false});
 root.addEventListener('click',e=>{if(!enabled||e.target.closest('button')?.disabled){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 root.addEventListener('contextmenu',e=>e.preventDefault());root.addEventListener('dblclick',e=>e.preventDefault());
 return {state,reset,takeReload(){const value=state.reload;state.reload=false;return value;},setActive(value){value=!!value&&touchDevice;if(value!==enabled){reset();enabled=value;}document.documentElement.classList.toggle('touch-playing',enabled);root.hidden=!enabled;},context({bomb,dead,spectating=false,grenades,weapon}){if(weapon!==currentWeapon||dead){currentWeapon=weapon;state.aim=0;const aim=document.getElementById('touchAim');aim.textContent='NİŞAN';aim.setAttribute('aria-pressed','false');}for(const id of ['touchFire','touchAim','touchReload','touchWeapon'])document.getElementById(id).disabled=dead;document.getElementById('touchAim').disabled=dead||weapon==='knife';document.getElementById('touchReload').disabled=dead||weapon==='knife';if(weapon==='knife'||dead)state.reload=false;if(weapon==='knife')state.aim=0;document.getElementById('touchInteract').hidden=!bomb||dead;document.getElementById('touchGrenade').disabled=dead||!grenades;document.getElementById('touchJump').hidden=spectating;document.getElementById('touchCrouch').hidden=spectating;for(const {button,clear} of heldControls)if(button.hidden||button.disabled)clear();}};
}
