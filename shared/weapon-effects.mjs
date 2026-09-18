export const SHOT_PROFILES={
 rifle:{volume:.18,duration:.20,cutoff:2500,boom:105,flash:2.4,kick:.085,tracer:.07},
 m4:{volume:.13,duration:.15,cutoff:1550,boom:125,flash:1.5,kick:.065,tracer:.06},
 shotgun:{volume:.24,duration:.34,cutoff:1250,boom:72,flash:3.2,kick:.14,tracer:.10},
 pistol:{volume:.15,duration:.16,cutoff:2350,boom:145,flash:2.0,kick:.075,tracer:.06},
 deagle:{volume:.22,duration:.27,cutoff:1850,boom:88,flash:3.0,kick:.12,tracer:.085},
 awp:{volume:.30,duration:.48,cutoff:1050,boom:58,flash:4.6,kick:.18,tracer:.15}
};

export function shotProfile(weapon){return SHOT_PROFILES[weapon]||SHOT_PROFILES.rifle}
export function nextZoomLevel(weapon,current=0){return weapon==='awp'?(Number(current)+1)%3:Number(current)>0?0:1}
export function zoomFov(base,weapon,level){if(!level)return base;if(weapon==='awp')return level===2?12:30;return base*.74}
export function zoomLabel(weapon,level){return weapon==='awp'&&level?`${level}. KADEME · ${level===2?'12°':'30°'}`:''}
