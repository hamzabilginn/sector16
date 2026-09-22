export function damageAngle(direction,yaw){
 if(!direction||!Number.isFinite(direction.x)||!Number.isFinite(direction.z)||Math.hypot(direction.x,direction.z)<.001)return null;
 return Math.atan2(-direction.x*Math.cos(yaw)+direction.z*Math.sin(yaw),direction.x*Math.sin(yaw)+direction.z*Math.cos(yaw));
}

export function accuracy(stats){
 return stats?.shots>0?Math.min(100,Math.round(100*stats.hits/stats.shots)):0;
}

// A server-confirmed surface and normal prevent decals floating in empty space.
export function surfaceImpact(origin,direction,distance,boxes){
 if(distance>=219.99)return null;
 const p={x:origin.x+direction.x*distance,y:origin.y+direction.y*distance,z:origin.z+direction.z*distance};
 if(Math.abs(p.y)<.006)return {normal:{x:0,y:1,z:0},metal:false};
 for(const b of boxes){if(Math.abs(p.x-b.x)>b.w/2+.006||Math.abs(p.y-b.y)>b.h/2+.006||Math.abs(p.z-b.z)>b.d/2+.006)continue;
  for(const [axis,size]of [['x','w'],['y','h'],['z','d']])for(const sign of [-1,1])if(Math.abs(p[axis]-b[axis]-sign*b[size]/2)<.006){const normal={x:0,y:0,z:0};normal[axis]=sign;return {normal,metal:['container','vent','rail','pole'].includes(b.kind)}}
 }return null;
}
