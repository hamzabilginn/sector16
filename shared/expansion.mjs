export const EXTRA_MODES=Object.freeze({
 arms:{label:'Silah Yarışı',score:18,loadout:'progressive'},
 sniper:{label:'Keskin Nişancı',score:30,loadout:'awp'},
 pistol:{label:'Tabanca',score:30,loadout:'pistol'},
 ffa:{label:'Herkes Tek',score:25,loadout:'rifle'},
 elimination:{label:'Eleme Turnuvası',rounds:7,loadout:'rifle'}
});

export const RECOIL_PATTERNS=Object.freeze({
 m249:[[0,1],[-.3,1.15],[.35,1.2],[-.4,1.25],[.45,1.3]],
 pistol:[[0,1],[.15,1]],deagle:[[0,1],[.28,1.2]],rifle:[[0,1],[-.22,1.08],[.18,1.15],[-.35,1.2],[.38,1.25]],
 m4:[[0,1],[-.14,1.05],[.12,1.1],[-.2,1.14],[.24,1.18]],awp:[[0,1.4]],smg:[[0,1],[-.1,.85],[.12,.9]],shotgun:[[0,1.2]]
});
export function recoilStep(weapon,shot){const p=RECOIL_PATTERNS[weapon]||RECOIL_PATTERNS.pistol;return p[shot%p.length]}

export const RANKS=['Bronz','Gümüş','Altın','Platin','Elmas','Usta'];
export function levelForXp(xp){return Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/100))+1)}
export function rankForRating(rating){return RANKS[Math.max(0,Math.min(RANKS.length-1,Math.floor((Math.max(0,rating)-600)/300)))]}
export const DAILY_MISSIONS=Object.freeze([
 {id:'kills',label:'5 rakip etkisiz hale getir',target:5,reward:120},
 {id:'damage',label:'1000 hasar ver',target:1000,reward:150},
 {id:'headshots',label:'3 kafa vuruşu yap',target:3,reward:140}
]);
export const SKINS=Object.freeze([
 {id:'standard',label:'Standart',level:1,color:0x30353a},{id:'forest',label:'Orman',level:2,color:0x3f5d43},
 {id:'desert',label:'Çöl',level:3,color:0x8d7048},{id:'neon',label:'Neon',level:5,color:0x5c49a8}
]);
export function sanitizeText(value,max=80){return String(value??'').replace(/[\x00-\x1f<>]/g,'').trim().slice(0,max)}
