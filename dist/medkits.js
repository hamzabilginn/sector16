export function medkitUI({send,touchDevice}){
 const button=document.createElement('button');button.id='useMedkit';button.className='medkit-button';button.hidden=true;document.body.append(button);
 const effect=document.createElement('div');effect.className='heal-effect';effect.hidden=true;effect.setAttribute('aria-hidden','true');document.body.append(effect);
 let allowed=false,pending=false,timer;
 button.onclick=()=>{if(!allowed||pending)return;pending=true;send({type:'medkit'});clearTimeout(timer);timer=setTimeout(()=>pending=false,1500)};
 document.addEventListener('keydown',e=>{if(e.code==='KeyQ'&&!e.repeat&&allowed&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();button.click()}});
 return {
  update(p,active,state){const visible=active&&p?.hp>0;button.hidden=!visible;allowed=visible&&p.hp<100&&p.medkits>0&&!state?.restart&&!['roundEnd','matchEnd'].includes(state?.phase);button.disabled=!allowed||pending;button.textContent=(touchDevice?'':'Q · ')+'SAĞLIK KİTİ ('+(p?.medkits||0)+')';button.title=p?.hp>=100?'Sağlığın tam':'50 can yeniler';},
  healed(){pending=false;clearTimeout(timer);effect.hidden=false;effect.getAnimations().forEach(a=>a.cancel());effect.animate([{opacity:0},{opacity:1,offset:.2},{opacity:0}],{duration:800}).onfinish=()=>effect.hidden=true;}
 };
}
