const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export function reloadPose(type,progress){
 const t=Math.max(0,Math.min(1,progress));
 const hold=ramp(t,0,.15)*(1-ramp(t,.86,1));
 if(type==='shotgun'){
  const cycle=((Math.max(.2,Math.min(.78,t))-.2)/.58*3)%1;
  return {hold,mag:0,reach:ramp(t,.06,.2)*(1-ramp(t,.8,.96)),shell:t>.2&&t<.78?1:0,shellTravel:1-smooth(cycle),bolt:ramp(t,.8,.88)*(1-ramp(t,.9,.97)),phase:t<.2?0:t<.78?1:t<.9?2:3};
 }
 return {hold,mag:ramp(t,.2,.4)*(1-ramp(t,.5,.72)),reach:ramp(t,.07,.2)*(1-ramp(t,.76,.96)),shell:0,shellTravel:0,bolt:ramp(t,.78,.87)*(1-ramp(t,.89,.97)),phase:t<.2?0:t<.5?1:t<.78?2:3};
}
