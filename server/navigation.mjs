import {MAPS,mapBounds} from '../shared/world.mjs';
const cache=new Map(),STEP=2;
export function navigation(map){if(cache.has(map))return cache.get(map);const boxes=MAPS[map].boxes,nodes=[],bounds=mapBounds(map);
 for(let z=-bounds.z+2;z<=bounds.z-2;z+=STEP)for(let x=-bounds.x+2;x<=bounds.x-2;x+=STEP){if(!boxes.some(b=>b.y-b.h/2<1.7&&Math.abs(x-b.x)<b.w/2+.50&&Math.abs(z-b.z)<b.d/2+.50))nodes.push({x,z});}
 const lookup=new Map(nodes.map((p,i)=>[p.x+','+p.z,i]));const neighbors=nodes.map(p=>{const list=[];for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[2,-2],[-2,2],[-2,-2]]){const next=lookup.get((p.x+dx)+','+(p.z+dz));if(next===undefined)continue;if(dx&&dz&&(!lookup.has((p.x+dx)+','+p.z)||!lookup.has(p.x+','+(p.z+dz))))continue;list.push(next);}return list;});const nav={nodes,neighbors};cache.set(map,nav);return nav;}
export function pathTo(map,start,goal,lane=0){const {nodes,neighbors}=navigation(map);const nearest=p=>nodes.reduce((best,n,i)=>Math.hypot(n.x-p.x,n.z-p.z)<Math.hypot(nodes[best].x-p.x,nodes[best].z-p.z)?i:best,0);const from=nearest(start),to=nearest(goal),open=new Set([from]),came=new Map(),cost=new Map([[from,0]]),score=new Map([[from,0]]);
 for(let iterations=0;open.size&&iterations<nodes.length;iterations++){
  let current=[...open].reduce((a,b)=>score.get(a)<score.get(b)?a:b);if(current===to){const path=[nodes[current]];while(came.has(current)){current=came.get(current);path.unshift(nodes[current]);}return path;}
  open.delete(current);for(const next of neighbors[current]){const n=nodes[next],base=nodes[current],value=cost.get(current)+Math.hypot(n.x-base.x,n.z-base.z)+(lane&&Math.sign(n.x)!==lane?.30:0);if(value<(cost.get(next)??Infinity)){came.set(next,current);cost.set(next,value);score.set(next,value+Math.hypot(n.x-nodes[to].x,n.z-nodes[to].z));open.add(next);}}
 }return [nodes[from]];
}
