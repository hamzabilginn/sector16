export function chooseTeam(room, requested='auto', excludeId=null) {
 if(!['auto','blue','orange'].includes(requested))throw Error('Geçersiz takım seçimi.');
 const counts={blue:0,orange:0};
 for(const p of room.players.values())if(!p.bot&&p.id!==excludeId)counts[p.team]++;
 const team=requested==='auto'?(counts.blue<=counts.orange?'blue':'orange'):requested;
 if(counts[team]>=Math.ceil(room.maxPlayers/2))throw Error('Bu takım dolu. Diğer takımı seç.');
 return team;
}
