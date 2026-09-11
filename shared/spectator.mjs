import {clamp} from './world.mjs';
export function moveSpectator(position,input,dt){
 const speed=input.fast?13:6;
 let x=input.x||0,z=input.z||0;
 const length=Math.max(1,Math.hypot(x,z));x/=length;z/=length;
 const pitch=input.pitch||0,cy=Math.cos(input.yaw),sy=Math.sin(input.yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 // Forward follows the camera; strafing stays horizontal.
 position.x=clamp(position.x+(cy*x+sy*cp*z)*speed*dt,-27,27);
 position.z=clamp(position.z+(-sy*x+cy*cp*z)*speed*dt,-31,31);
 position.y=clamp(position.y-sp*z*speed*dt,.4,18);
 return position;
}
