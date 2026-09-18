export function useMedkit(p){
 const r=p.room;
 if(!r||p.hp<=0||r.restart||['roundEnd','matchEnd'].includes(r.phase))throw Error('Sağlık kitini yalnızca hayattayken kullanabilirsin.');
 if(p.hp>=100)throw Error('Sağlığın zaten tam.');
 if(!(p.medkits>0))throw Error('Sağlık kitin kalmadı. Yeniden doğduğunda yenilenir.');
 const healed=Math.min(50,100-p.hp);p.hp+=healed;p.medkits--;return healed;
}
