import {damageAngle,accuracy} from '/shared/combat-feedback.mjs';
import {WEAPONS} from '/shared/world.mjs';

export function combatUI({send,active,pause,project,practice}){
 const $=id=>document.getElementById(id),markers=new Map();let damage=null,damageUntil=0;
 const root=document.createElement('div');root.id='combatFeedback';root.innerHTML='<div id="damageBearing" hidden><b>▲</b></div><div id="teamMarkers"></div>';document.body.append(root);
 const controls=document.createElement('div');controls.id='markerControls';controls.hidden=true;controls.innerHTML='<button id="markEnemy">Düşman · Z</button><button id="markRegroup">Toplan · X</button>';document.body.append(controls);
 const mark=kind=>{if(active())send({type:'marker',kind})};$('markEnemy').onclick=()=>mark('enemy');$('markRegroup').onclick=()=>mark('regroup');
 document.addEventListener('keydown',e=>{if(e.repeat||document.querySelector('dialog[open]'))return;if(e.code==='KeyZ')mark('enemy');if(e.code==='KeyX')mark('regroup')});
 if(navigator.maxTouchPoints>0||window.SECTOR16_CONFIG?.native){$('markEnemy').textContent='DÜŞMAN';$('markRegroup').textContent='TOPLAN';}
 const train=document.createElement('button');train.id='trainingButton';train.className='outline';train.textContent='ANTRENMAN ALANI';$('createButton').after(train);train.onclick=practice;
 const weapons=document.createElement('label');weapons.id='practiceWeapons';weapons.hidden=true;weapons.textContent='Antrenman silahı';const select=document.createElement('select');select.id='practiceWeapon';
 for(const [id,w] of Object.entries(WEAPONS)){const option=document.createElement('option');option.value=id;option.textContent=w.name;select.append(option)}weapons.append(select);$('gameSettings').before(weapons);select.onchange=()=>send({type:'trainingweapon',weapon:select.value});
 const result=document.createElement('dialog');result.id='matchResults';result.innerHTML='<h2>Maç istatistikleri</h2><p>İsabet: hedefe değen atış / toplam atış. Pompalı saçmaları tek atış sayılır.</p><div class="result-scroll"><table><thead><tr><th>Oyuncu</th><th>Skor</th><th>Ölüm</th><th>Atış</th><th>İsabet</th><th>Kafa</th><th>Hasar</th></tr></thead><tbody id="resultRows"></tbody></table></div><button id="closeResults" class="primary">DEVAM ET</button>';document.body.append(result);$('closeResults').onclick=()=>{result.close();$('resume').click()};
 return {
  hurt(direction){damage=direction;damageUntil=performance.now()+1800},
  marker(m){markers.get(m.id)?.element.remove();const element=document.createElement('div');element.className='team-marker '+m.kind;element.textContent=(m.kind==='enemy'?'⚠ Düşman':'◆ Toplan')+' · '+m.name;$('teamMarkers').append(element);markers.set(m.id,{...m,element,until:performance.now()+6000})},
  results(rows){if(!Array.isArray(rows))return;pause();$('resultRows').replaceChildren();for(const p of rows){const tr=document.createElement('tr');for(const text of [p.name,p.kills,p.deaths,p.shots||0,accuracy(p)+'%',p.headshots||0,p.damage||0]){const td=document.createElement('td');td.textContent=String(text);tr.append(td)}$('resultRows').append(tr)}if(!result.open)result.showModal()},
  update(now,yaw,training){controls.hidden=!active();weapons.hidden=!training;const angle=damageAngle(damage,yaw);$('damageBearing').hidden=now>=damageUntil||angle===null;if(angle!==null){$('damageBearing').style.transform='translate(-50%,-50%) rotate('+angle+'rad)';$('damageBearing').style.opacity=Math.max(0,(damageUntil-now)/1800)}for(const [id,m] of markers){if(now>m.until){m.element.remove();markers.delete(id);continue}const p=project(m.position);m.element.hidden=!p.visible;if(p.visible){m.element.style.left=p.x+'px';m.element.style.top=p.y+'px'}}},
  reset(){damage=null;damageUntil=0;$('damageBearing').hidden=true;controls.hidden=true;weapons.hidden=true;for(const m of markers.values())m.element.remove();markers.clear();if(result.open)result.close()}
 };
}
