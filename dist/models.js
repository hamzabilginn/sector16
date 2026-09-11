import * as THREE from 'three';
import {reloadPose} from '/shared/animation.mjs';
const palette=new Map();
function material(color,metalness=0,roughness=.85){return new THREE.MeshStandardMaterial({color,metalness,roughness})}
const metal=material(0x30383c,.75,.35),rubber=material(0x171d20),wood=material(0x64503a),glove=material(0x343b35),fabric=material(0x636954),brass=material(0xc1a25a,.7,.3),shellRed=material(0x9c3b2f);
function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(p,mat,w,h,d,x=0,y=0,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),mat,x,y,z)}
function oval(p,mat,w,h,d,x=0,y=0,z=0){const m=mesh(p,new THREE.SphereGeometry(1,12,8),mat,x,y,z);m.scale.set(w/2,h/2,d/2);return m}
function tube(p,mat,r,length,x,y,z){return mesh(p,new THREE.CylinderGeometry(r,r*.94,length,12),mat,x,y,z)}
function joint(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
function camo(team){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=team==='blue'?'#62717b':'#91836a';ctx.fillRect(0,0,128,128);
 const colors=team==='blue'?['#465760','#78858a','#37464e']:['#706d52','#afa080','#575e48'];
 for(let i=0;i<95;i++){ctx.fillStyle=colors[i%3];const x=(i*43)%128,y=(i*71)%128;ctx.beginPath();ctx.ellipse(x,y,7+i%9,3+i%4,i*.8,0,Math.PI*2);ctx.fill();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);return texture;
}
function operatorPalette(team){if(!palette.has(team)){const cloth=material(0xffffff);cloth.map=camo(team);palette.set(team,{cloth,vest:material(team==='blue'?0x303f47:0x55533f),strap:material(0x222b2b),skin:material(0xb59479),patch:material(team==='blue'?0x409dcc:0xd48842),lens:material(0x17252c,.35,.15)});}return palette.get(team)}
export function createOperator(team){
 const g=new THREE.Group(),m=operatorPalette(team);const torso=joint(g,0,.89,0);
 oval(torso,m.cloth,.48,.57,.30,0,.27,0);oval(torso,m.vest,.49,.44,.34,0,.29,-.015);
 box(torso,m.vest,.34,.29,.07,0,.30,-.19);box(torso,m.strap,.43,.06,.33,0,.02,0);
 for(const x of [-.16,.16]){box(torso,m.strap,.05,.44,.035,x,.32,-.217);box(torso,m.vest,.115,.16,.08,x*.85,.12,-.235);box(torso,m.strap,.10,.02,.012,x*.85,.18,-.282);}
 box(torso,m.patch,.11,.065,.012,.12,.39,-.231);box(torso,m.vest,.31,.36,.14,0,.26,.21);
 tube(torso,m.strap,.025,.19,-.23,.40,.14);tube(torso,m.strap,.004,.18,-.23,.56,.14);
 const head=joint(torso,0,.60,0);tube(head,m.skin,.065,.10,0,0,0);oval(head,m.skin,.275,.32,.275,0,.17,-.01);
 oval(head,m.skin,.07,.085,.08,0,.15,-.15);oval(head,m.skin,.048,.09,.04,-.14,.17,0);oval(head,m.skin,.048,.09,.04,.14,.17,0);
 const helmet=mesh(head,new THREE.SphereGeometry(.168,16,10,0,Math.PI*2,0,Math.PI*.63),m.vest,0,.235,.005);helmet.scale.z=1.12;
 box(head,m.strap,.24,.036,.045,0,.29,-.145);box(head,m.lens,.23,.073,.036,0,.20,-.153);box(head,m.strap,.019,.08,.02,0,.20,-.177);
 box(head,m.strap,.018,.16,.025,-.12,.08,-.045);box(head,m.strap,.018,.16,.025,.12,.08,-.045);
 const legs=[];
 for(const side of [-1,1]){
  const leg=joint(g,side*.135,.88,0);leg.name=side<0?'legL':'legR';oval(leg,m.cloth,.225,.43,.25,0,-.18,0);
  box(leg,m.vest,.13,.16,.05,side*.10,-.13,.01);const knee=joint(leg,0,-.39,0);oval(knee,m.cloth,.19,.37,.21,0,-.16,0);oval(knee,m.vest,.17,.15,.10,0,-.02,-.11);oval(knee,rubber,.21,.17,.32,0,-.36,-.065);box(knee,rubber,.20,.042,.30,0,-.415,-.065);legs.push({leg,knee});
 }
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=joint(torso,side*.285,.48,0);oval(shoulder,m.cloth,.21,.25,.22,0,-.06,0);oval(shoulder,m.cloth,.16,.29,.18,0,-.18,0);box(shoulder,m.patch,.023,.09,.10,side*.095,-.055,0);
  const elbow=joint(shoulder,0,-.28,0);oval(elbow,m.vest,.16,.13,.18,0,0,0);oval(elbow,m.cloth,.14,.27,.16,0,-.12,0);oval(elbow,glove,.14,.15,.16,0,-.28,-.01);
  shoulder.rotation.x=.6;shoulder.rotation.z=side<0?.58:-.18;elbow.rotation.x=1.0;arms.push({shoulder,elbow});
 }
 const weapon=joint(torso,.15,.25,-.38);box(weapon,metal,.09,.11,.40);box(weapon,wood,.085,.08,.23,0,0,-.28);const barrel=tube(weapon,metal,.016,.28,0,.015,-.50);barrel.rotation.x=Math.PI/2;box(weapon,rubber,.065,.17,.075,0,-.12,-.05).rotation.x=.15;box(weapon,rubber,.07,.10,.20,0,-.015,.29);
 g.userData.rig={torso,head,legs,arms,weapon};return g;
}
export function animateOperator(g,state,now,dt){
 const rig=g.userData.rig;if(!rig)return;const speed=Math.hypot(state.vx,state.vz),stride=Math.min(speed/7,1),phase=now*.011;
 for(let i=0;i<2;i++){const swing=Math.sin(phase+i*Math.PI)*stride;rig.legs[i].leg.position.y=state.crouch?.38:.88;rig.legs[i].leg.rotation.x=(state.crouch?-1.2:0)+swing*(state.crouch?.2:.6);rig.legs[i].knee.rotation.x=(state.crouch?2.1:0)+Math.max(0,-swing)*.8;}
 rig.torso.position.y=(state.crouch?.39:.89)+Math.abs(Math.sin(phase))*stride*.025+Math.sin(now*.0018)*.005;rig.torso.rotation.x=-stride*.07;
 rig.head.rotation.x=THREE.MathUtils.clamp(-state.pitch*.55,-.45,.45);
 rig.weapon.rotation.x=-state.pitch*.5;const reload=state.reload>0;
 rig.arms[0].shoulder.rotation.x=reload?.35+Math.sin(now*.008)*.2:.6;rig.arms[0].elbow.rotation.x=reload?1.5:1.0;
 rig.arms[1].shoulder.rotation.x=.6+state.pitch*.35;
}
function hand(parent,x,y,z){const g=joint(parent,x,y,z);oval(g,glove,.082,.077,.13);for(let i=0;i<4;i++)oval(g,glove,.017,.046,.071,-.03+i*.019,-.021,-.024);oval(g,glove,.035,.05,.065,.045,0,.018).rotation.z=-.55;return g}
function armBetween(parent,start,end){const arm=mesh(parent,new THREE.CapsuleGeometry(.041,1,4,10),fabric);positionArm(arm,start,end);return arm}
function positionArm(arm,start,end){const delta=end.clone().sub(start);arm.position.copy(start).add(end).multiplyScalar(.5);arm.scale.set(1,delta.length()/1.082,1);arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())}
export function buildViewWeapon(root,type){
 root.scale.set(1,1,1);const pistol=type==='pistol'||type==='deagle',shotgun=type==='shotgun';
 const slide=joint(root,0,.05,-.095);box(slide,metal,pistol?.081:.088,.07,pistol?.29:.35);for(let i=0;i<5;i++)box(slide,rubber,.085,.032,.008,0,0,.08-i*.017);
 box(root,rubber,.074,.085,pistol?.25:.35,0,-.012,-.06);box(root,rubber,.061,.16,.074,0,-.105,.035).rotation.x=-.20;
 const trigger=mesh(root,new THREE.TorusGeometry(.032,.005,5,12),metal,0,-.066,-.04);trigger.rotation.y=Math.PI/2;
 const muzzle=pistol?-.30:type==='awp'?-.79:type==='m4'?-.73:-.65;
 const barrel=tube(root,metal,pistol?.013:.017,pistol?.12:.30,0,.018,muzzle+.08);barrel.rotation.x=Math.PI/2;
 if(!pistol){box(root,type==='rifle'?wood:rubber,.079,.077,.24,0,0,-.34);for(let i=0;i<6;i++)box(root,metal,.084,.012,.01,0,.045,-.25-i*.028);box(root,rubber,.065,.061,.24,0,-.007,.20);box(root,rubber,.09,.13,.04,0,-.032,.32);}
 box(root,rubber,.023,.034,.025,0,.10,-.19);box(root,rubber,.018,.035,.012,0,.094,pistol?-.23:-.43);
 if(type==='awp'){const scope=tube(root,metal,.037,.28,0,.145,-.11);scope.rotation.x=Math.PI/2;box(root,metal,.033,.08,.05,0,.09,-.08);}
 if(type==='m4'){const suppressor=tube(root,metal,.025,.15,0,.018,muzzle);suppressor.rotation.x=Math.PI/2;}
 const magazine=joint(root,0,pistol?-.17:-.13,pistol?.039:-.12);
 if(!shotgun){box(magazine,type==='rifle'?wood:metal,pistol?.045:.054,pistol?.10:type==='awp'?.10:.19,pistol?.05:.075).rotation.x=pistol?-.20:.12;for(let i=0;i<4;i++)box(magazine,rubber,.056,.005,.08,0,-.065+i*.03,0);}
 else{magazine.visible=false;const tubeMag=tube(root,metal,.022,.34,0,-.034,-.35);tubeMag.rotation.x=Math.PI/2;}
 const right=hand(root,.022,-.11,.035);armBetween(root,new THREE.Vector3(.15,-.18,.34),right.position);
 const support=hand(root,-.06,-.073,pistol?-.09:-.30);const rest=support.position.clone(),elbow=new THREE.Vector3(-.20,-.18,.17);const arm=armBetween(root,elbow,support.position);
 const shell=tube(root,shellRed,.014,.053,0,0,0);shell.rotation.x=Math.PI/2;shell.visible=false;const shellBase=tube(shell,brass,.0145,.009,0,-.026,0);
 const bolt=box(root,metal,.027,.02,.065,.055,.045,-.07);
 root.userData={muzzle,rig:{magazine,magBase:magazine.position.clone(),support,rest,arm,elbow,slide,bolt,shell,lastProgress:null,lastPhase:-1}};
}
export function animateReload(root,type,progress,click=()=>{}){
 const rig=root.userData.rig;if(!rig)return;const active=progress!==null;const pose=reloadPose(type,active?progress:0);
 root.rotation.x+=pose.hold*.16;root.rotation.y-=pose.hold*.20;root.rotation.z-=pose.hold*.36;root.position.x-=pose.hold*.055;root.position.y+=pose.hold*.025;
 rig.magazine.position.copy(rig.magBase);rig.magazine.position.y-=pose.mag*.35;rig.magazine.position.x-=pose.mag*.075;rig.magazine.position.z+=pose.mag*.12;rig.magazine.rotation.z=-pose.mag*.16;
 const grip=rig.magazine.position.clone().add(new THREE.Vector3(-.045,-.015,.015));
 if(type==='shotgun')grip.set(-.035,-.11-pose.shellTravel*.09,-.10+pose.shellTravel*.07);
 rig.support.position.copy(rig.rest).lerp(grip,pose.reach);rig.support.rotation.x=pose.reach*.28;positionArm(rig.arm,rig.elbow,rig.support.position);
 rig.slide.position.z=-.095+((type==='pistol'||type==='deagle')?pose.bolt*.065:0);rig.bolt.position.z=-.07+pose.bolt*.07;
 rig.shell.visible=active&&!!pose.shell;rig.shell.position.copy(grip).add(new THREE.Vector3(.032,.027,-.025));
 if(active){if(rig.lastProgress===null||progress<rig.lastProgress)rig.lastPhase=-1;if(pose.phase!==rig.lastPhase){if(pose.phase>0)click();rig.lastPhase=pose.phase;}rig.lastProgress=progress;}else{rig.lastProgress=null;rig.lastPhase=-1;}
}

export function animateThrow(root,t){const rig=root.userData.rig;if(!rig||t<0||t>=1)return;const reach=Math.sin(t*Math.PI);root.position.y-=reach*.15;root.rotation.x-=reach*.18;rig.support.position.lerp(new THREE.Vector3(-.09,.02,-.57),reach);positionArm(rig.arm,rig.elbow,rig.support.position);}
