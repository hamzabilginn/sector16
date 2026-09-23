import {clamp} from './world.mjs';
export function nextResolutionScale(scale,frameCount,elapsedSeconds,targetFps){
 if(!Number.isFinite(elapsedSeconds)||elapsedSeconds<1||!Number.isFinite(targetFps)||targetFps<=0)return scale;
 const fps=frameCount/elapsedSeconds;
 if(fps<targetFps*.76)return clamp(Math.round((scale-.12)*100)/100,.66,1);
 if(fps>targetFps*.94)return clamp(Math.round((scale+.04)*100)/100,.66,1);
 return scale;
}
