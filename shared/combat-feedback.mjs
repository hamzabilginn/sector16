export function damageAngle(direction,yaw){
 if(!direction||!Number.isFinite(direction.x)||!Number.isFinite(direction.z)||Math.hypot(direction.x,direction.z)<.001)return null;
 return Math.atan2(-direction.x*Math.cos(yaw)+direction.z*Math.sin(yaw),direction.x*Math.sin(yaw)+direction.z*Math.cos(yaw));
}

export function accuracy(stats){
 return stats?.shots>0?Math.min(100,Math.round(100*stats.hits/stats.shots)):0;
}
