// Server-owned training settings. Counts reserve a seat for the room creator.
export const BOT_LEVELS = Object.freeze({
 easy: Object.freeze({label:'Kolay', reaction:.9, error:.10, range:28, strafe:.2, burst:.65}),
 medium: Object.freeze({label:'Orta', reaction:.45, error:.035, range:40, strafe:.5, burst:0}),
 hard: Object.freeze({label:'Zor', reaction:.18, error:.009, range:52, strafe:.8, burst:-.6})
});
export function botSettings(input, maxPlayers) {
 const botCount=input.botCount===undefined?(input.bots===false?0:Math.min(3,maxPlayers-1)):input.botCount;
 const botDifficulty=input.botDifficulty===undefined?'medium':input.botDifficulty;
 if(!Number.isInteger(botCount)||botCount<0||botCount>maxPlayers-1)throw Error(`Bot sayısı 0–${maxPlayers-1} arasında tam sayı olmalı.`);
 if(!Object.hasOwn(BOT_LEVELS,botDifficulty))throw Error('Geçersiz bot zorluğu.');
 return {botCount,botDifficulty};
}
export function desiredBots(room, humans) {
 return humans>0?Math.max(0,Math.min(room.botCount,room.maxPlayers-humans)):0;
}
export function canBotFire(p, targetId, visible, clock, level) {
 if(!visible){p.botTarget=null;p.botSeenAt=0;return false;}
 if(p.botTarget!==targetId){p.botTarget=targetId;p.botSeenAt=clock;}
 return clock-p.botSeenAt>=level.reaction;
}
