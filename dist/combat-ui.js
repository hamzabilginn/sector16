import {damageAngle,accuracy} from '/shared/combat-feedback.mjs';
import {WEAPONS} from '/shared/world.mjs';

export function combatUI({send,pause,practice}){
 const $=id=>document.getElementById(id);let damage=null,damageUntil=0;
 const root=document.createElement('div');root.id='combatFeedback';root.innerHTML='<div id="damageBearing" hidden><b>▲</b></div>';document.body.append(root);




 const train=document.createElement('button');train.id='trainingButton';train.className='outline';train.textContent='ANTRENMAN ALANI';$('createButton').after(train);train.onclick=practice;
 const weapons=document.createElement('label');weapons.id='practiceWeapons';weapons.hidden=true;weapons.textContent='Antrenman silahı';const select=document.createElement('select');select.id='practiceWeapon';
 for(const [id,w] of Object.entries(WEAPONS)){const option=document.createElement('option');option.value=id;option.textContent=w.name;select.append(option)}weapons.append(select);$('gameSettings').before(weapons);select.onchange=()=>send({type:'trainingweapon',weapon:select.value});
 const result=document.createElement('dialog');result.id='matchResults';result.innerHTML='<h2>Maç istatistikleri</h2><p>İsabet: hedefe değen atış / toplam atış. Pompalı saçmaları tek atış sayılır.</p><div class="result-scroll"><table><thead><tr><th>Oyuncu</th><th>Skor</th><th>Ölüm</th><th>Atış</th><th>İsabet</th><th>Kafa</th><th>Hasar</th></tr></thead><tbody id="resultRows"></tbody></table></div><button id="closeResults" class="primary">DEVAM ET</button>';document.body.append(result);$('closeResults').onclick=()=>{result.close();$('resume').click()};
 return {
  hurt(direction){damage=direction;damageUntil=performance.now()+1800},

  results(rows){if(!Array.isArray(rows))return;pause();$('resultRows').replaceChildren();for(const p of rows){const tr=document.createElement('tr');for(const text of [p.name,p.kills,p.deaths,p.shots||0,accuracy(p)+'%',p.headshots||0,p.damage||0]){const td=document.createElement('td');td.textContent=String(text);tr.append(td)}$('resultRows').append(tr)}if(!result.open)result.showModal()},
  update(now,yaw,training){weapons.hidden=!training;const angle=damageAngle(damage,yaw);$('damageBearing').hidden=now>=damageUntil||angle===null;if(angle!==null){$('damageBearing').style.transform='translate(-50%,-50%) rotate('+angle+'rad)';$('damageBearing').style.opacity=Math.max(0,(damageUntil-now)/1800)}},
  reset(){damage=null;damageUntil=0;$('damageBearing').hidden=true;weapons.hidden=true;if(result.open)result.close()}
 };
}
