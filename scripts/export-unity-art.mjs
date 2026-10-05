import {mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {createCanvas} from '@napi-rs/canvas';
import * as THREE from 'three';
import {MAPS,WEAPONS} from '../shared/world.mjs';

// Execute the game's own procedural visual builders, including their canvas textures.
// Collision and gameplay data remain in world.json, independent of these visual meshes.
const repo=fileURLToPath(new URL('..',import.meta.url));
const output=join(repo,'unity-client/Assets/Resources/NativeArt');
await mkdir(output,{recursive:true});await mkdir(join(repo,'artifacts'),{recursive:true});
globalThis.document={createElement(tag){if(tag!=='canvas')throw Error(`Unexpected DOM dependency: ${tag}`);return createCanvas(1,1);}};
// Keep generated textures and small decorative variations stable between builds.
let randomState=0x5162026;Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
const bundle=join(repo,'artifacts/native-art-builders.mjs');
await build({stdin:{contents:"export {buildArena} from './dist/arena.js'; export {createOperator,buildViewWeapon} from './dist/models.js';",resolveDir:repo},bundle:true,platform:'node',format:'esm',outfile:bundle,external:['three'],plugins:[{name:'web-root',setup(b){b.onResolve({filter:/^\//},args=>({path:join(repo,args.path.startsWith('/shared/')?args.path.slice(1):'dist'+args.path)}));}}]});
const {buildArena,createOperator,buildViewWeapon}=await import(pathToFileURL(bundle));
const library={geometries:[],materials:[],assets:[]};const geometries=new Map(),materials=new Map();
const pendingTextures=new Map();
const round=v=>Math.round(v*1e6)/1e6;
const hash=o=>createHash('sha256').update(typeof o==='string'?o:JSON.stringify(o)).digest('hex').slice(0,20);
function geometry(g){
 const dto={positions:Array.from(g.attributes.position.array,round),normals:g.attributes.normal?Array.from(g.attributes.normal.array,round):[],uv:g.attributes.uv?Array.from(g.attributes.uv.array,round):[],indices:g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i)};
 const key=hash(dto);if(!geometries.has(key)){geometries.set(key,library.geometries.length);library.geometries.push(dto);}return geometries.get(key);
}
function material(m){
 let texture='';if(m.map?.image){const bytes=m.map.image.toBuffer('image/png');texture=hash(bytes.toString('base64'));pendingTextures.set(texture,bytes);}
 const color=(m.color||new THREE.Color(0xffffff)).clone().convertLinearToSRGB();
 const dto={color:[round(color.r),round(color.g),round(color.b),m.opacity??1],texture,repeat:[m.map?.repeat.x??1,m.map?.repeat.y??1],metal:m.metalness??0,rough:m.roughness??1,unlit:!!m.isMeshBasicMaterial,doubleSided:m.side===THREE.DoubleSide,transparent:!!m.transparent};
 const key=hash(dto);if(!materials.has(key)){materials.set(key,library.materials.length);library.materials.push(dto);}return materials.get(key);
}
function asset(id,root){
 const nodes=[],refs=new Map();
 function add(object,parent,matrix=null){
  if(object.isLine||object.isLight||object.isCamera)return;
  const index=nodes.length;refs.set(object,index);let p=object.position,q=object.quaternion,s=object.scale;
  if(matrix){p=new THREE.Vector3();q=new THREE.Quaternion();s=new THREE.Vector3();matrix.decompose(p,q,s);}
  const node={name:object.name||`part-${index}`,parent,position:p.toArray().map(round),rotation:q.toArray().map(round),scale:s.toArray().map(round),visible:object.visible,mesh:-1,material:-1};nodes.push(node);
  if(object.isMesh){if(Array.isArray(object.material))throw Error('Multi-material mesh needs explicit groups');node.mesh=geometry(object.geometry);node.material=material(object.material);}
  if(object.isInstancedMesh){node.mesh=-1;for(let i=0;i<object.count;i++){const transform=new THREE.Matrix4();object.getMatrixAt(i,transform);const clone=new THREE.Mesh(object.geometry,object.material);add(clone,index,transform);}}
  for(const child of object.children)add(child,index);
 }
 add(root,-1);
 const rig=[];const source=root.userData.rig;
 function ref(key,value){if(refs.has(value))rig.push({key,node:refs.get(value)});}
 if(source){for(const key of ['torso','head','weapon','magazine','support','arm','slide','bolt','shell'])ref(key,source[key]);source.legs?.forEach((v,i)=>{ref(`leg${i}`,v.leg);ref(`knee${i}`,v.knee);});source.arms?.forEach((v,i)=>{ref(`shoulder${i}`,v.shoulder);ref(`elbow${i}`,v.elbow);});}
 library.assets.push({id,nodes,rig});
}
for(const id of Object.keys(MAPS)){const scene=new THREE.Scene();buildArena(scene,id);asset('map-'+id,scene.children[0]);}
for(const team of ['blue','orange'])asset('operator-'+team,createOperator(team));
for(const weapon of Object.keys(WEAPONS)){const root=new THREE.Group();buildViewWeapon(root,weapon);asset('gun-'+weapon,root);}
await writeFile(join(output,'library.json'),JSON.stringify(library));
for(const [id,bytes]of pendingTextures)await writeFile(join(output,id+'.png'),bytes);
// Prune only this exporter's hash-named textures, inside its fixed output directory.
for(const name of await readdir(output)){const match=/^([a-f0-9]{20})\.png(?:\.meta)?$/.exec(name);if(match&&!pendingTextures.has(match[1])){const path=resolve(output,name);if(!path.startsWith(resolve(output)+sep))throw Error('Texture cleanup escaped its output directory');await unlink(path);}}
console.log(`Native art: ${library.assets.length} assets, ${library.geometries.length} geometries, ${library.materials.length} materials, ${pendingTextures.size} textures.`);
