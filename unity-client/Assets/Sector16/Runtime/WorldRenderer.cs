using System.Collections.Generic;
using UnityEngine;

namespace Sector16
{
    public sealed class WorldRenderer : MonoBehaviour
    {
        readonly Dictionary<int,Material> materials=new Dictionary<int,Material>();
        readonly Dictionary<string,GameObject> players=new Dictionary<string,GameObject>();
        readonly Dictionary<string,PlayerState> targets=new Dictionary<string,PlayerState>();
        readonly Dictionary<string,GameObject> effects=new Dictionary<string,GameObject>();
        GameObject mapRoot,gun;
        string mapId,weapon;
        public static Vector3 Position(double x,double y,double z)=>new Vector3((float)x,(float)y,(float)-z);
        public static Quaternion Rotation(double yaw,double pitch=0)=>Quaternion.Euler((float)(-pitch*Mathf.Rad2Deg),(float)(-yaw*Mathf.Rad2Deg),0);
        public Material Material(int rgb)
        {
            if(materials.TryGetValue(rgb,out var mat))return mat;
            mat=new Material(Shader.Find("Standard"));mat.color=Color(rgb);mat.SetFloat("_Glossiness",.05f);materials[rgb]=mat;return mat;
        }
        public static Color Color(int rgb)=>new Color(((rgb>>16)&255)/255f,((rgb>>8)&255)/255f,(rgb&255)/255f);
        GameObject Primitive(string name,PrimitiveType type,Transform parent,Vector3 position,Vector3 size,int color)
        {
            var obj=GameObject.CreatePrimitive(type);obj.name=name;obj.transform.SetParent(parent,false);obj.transform.localPosition=position;obj.transform.localScale=size;obj.GetComponent<Renderer>().sharedMaterial=Material(color);return obj;
        }
        public void Map(MapData map,Camera camera)
        {
            if(mapId==map.id)return;mapId=map.id;if(mapRoot!=null)Destroy(mapRoot);
            mapRoot=new GameObject(map.name);mapRoot.transform.SetParent(transform,false);
            camera.backgroundColor=Color(map.sky);RenderSettings.ambientLight=new Color(.65f,.7f,.74f);
            Primitive("Ground",PrimitiveType.Cube,mapRoot.transform,new Vector3(0,-.05f,0),new Vector3((float)map.width,.1f,(float)map.depth),map.floor);
            foreach(var b in map.boxes)
            {
                int color=b.color!=0?b.color:b.kind=="ice"?0xaacdd7:b.kind=="sand"?0xb5a47d:b.kind=="container"?0x436c74:b.kind=="crate"?0x907b59:0x586b72;
                Primitive(b.kind,PrimitiveType.Cube,mapRoot.transform,Position(b.x,b.y,b.z),new Vector3((float)b.w,(float)b.h,(float)b.d),color);
            }
            foreach(var team in new[]{"blue","orange"})
                Primitive(team+" base",PrimitiveType.Cube,mapRoot.transform,Position(0,.01,team=="blue"?map.baseZ:-map.baseZ),new Vector3((float)map.width-2,.02f,4),team=="blue"?0x326680:0xa76e40);
            foreach(var site in map.sites)
                Primitive("Site "+site.id,PrimitiveType.Cylinder,mapRoot.transform,Position(site.x,.035,site.z),new Vector3(6,.02f,6),0xa6ac58);
        }
        public void Players(Envelope state,string selfId)
        {
            var seen=new HashSet<string>();
            foreach(var p in state.players??System.Array.Empty<PlayerState>())
            {
                if(p.id==selfId)continue;seen.Add(p.id);targets[p.id]=p;
                if(!players.TryGetValue(p.id,out var actor))
                {
                    actor=new GameObject(p.name);actor.transform.SetParent(transform,false);int color=p.team=="blue"?0x3874a1:0xba7950;
                    Primitive("Body",PrimitiveType.Capsule,actor.transform,new Vector3(0,.82f,0),new Vector3(.55f,.65f,.5f),color);
                    Primitive("Head",PrimitiveType.Sphere,actor.transform,new Vector3(0,1.58f,0),Vector3.one*.34f,0xb5aa8b);
                    Primitive("Weapon",PrimitiveType.Cube,actor.transform,new Vector3(.25f,1.1f,.25f),new Vector3(.13f,.13f,.7f),0x202929);
                    players[p.id]=actor;actor.transform.position=Position(p.x,p.y,p.z);
                }
                actor.SetActive(p.hp>0);actor.transform.localScale=new Vector3(1,p.crouch?.63f:1,1);
            }
            foreach(var id in new List<string>(players.Keys))if(!seen.Contains(id)){Destroy(players[id]);players.Remove(id);targets.Remove(id);}
            var points=new Dictionary<string,PointState>();
            foreach(var g in state.grenades??System.Array.Empty<PointState>())points["grenade-"+g.id]=g;
            foreach(var g in state.smokes??System.Array.Empty<PointState>())points["smoke-"+g.id]=g;
            if(state.bomb!=null&&state.bomb.state!="carried")points["bomb"]=new PointState{x=state.bomb.x,y=state.bomb.y,z=state.bomb.z,kind="bomb"};
            foreach(var flag in new[]{state.flags?.blue,state.flags?.orange})if(flag!=null)points["flag-"+flag.team]=new PointState{x=flag.x,y=flag.y+.8,z=flag.z,kind="flag"};
            foreach(var pair in points)
            {
                if(!effects.TryGetValue(pair.Key,out var visual)){visual=Primitive(pair.Key,PrimitiveType.Sphere,transform,Vector3.zero,Vector3.one*.25f,pair.Value.kind=="smoke"?0x7c8585:0xb7cf69);effects[pair.Key]=visual;}
                visual.transform.position=Position(pair.Value.x,pair.Value.y+.2,pair.Value.z);
                if(pair.Value.kind=="smoke")visual.transform.localScale=new Vector3(6,4.5f,6);
            }
            foreach(var id in new List<string>(effects.Keys))if(!points.ContainsKey(id)){Destroy(effects[id]);effects.Remove(id);}
        }
        public void Gun(Camera camera,string selected,bool visible,float recoil)
        {
            if(weapon!=selected)
            {
                weapon=selected;if(gun!=null)Destroy(gun);gun=new GameObject(selected);gun.transform.SetParent(camera.transform,false);
                Primitive("Receiver",PrimitiveType.Cube,gun.transform,new Vector3(0,0,.03f),new Vector3(.13f,.12f,.42f),0x243030);
                Primitive("Barrel",PrimitiveType.Cube,gun.transform,new Vector3(0,.03f,.4f),new Vector3(.04f,.04f,.42f),0x161d20);
                Primitive("Grip",PrimitiveType.Cube,gun.transform,new Vector3(0,-.1f,-.04f),new Vector3(.075f,.2f,.1f),0x614e3a);
            }
            gun.SetActive(visible);gun.transform.localPosition=new Vector3(.22f,-.2f,.48f-recoil*.15f);gun.transform.localRotation=Quaternion.Euler(-recoil*12,0,0);
        }
        public void Shot(Envelope shot)
        {
            if(shot.from==null||shot.to==null)return;
            var obj=new GameObject("Shot tracer");var line=obj.AddComponent<LineRenderer>();line.sharedMaterial=Material(0xeec983);line.positionCount=2;line.startWidth=line.endWidth=.016f;
            line.SetPositions(new[]{Position(shot.from.x,shot.from.y,shot.from.z),Position(shot.to.x,shot.to.y,shot.to.z)});Destroy(obj,.075f);
        }
        void Update()
        {
            var t=1-Mathf.Exp(-Time.deltaTime*20);
            foreach(var pair in players)
            {
                var p=targets[pair.Key];pair.Value.transform.position=Vector3.Lerp(pair.Value.transform.position,Position(p.x,p.y,p.z),t);pair.Value.transform.rotation=Quaternion.Slerp(pair.Value.transform.rotation,Rotation(p.yaw),t);
            }
        }
        public void Clear()
        {
            foreach(var p in players.Values)Destroy(p);players.Clear();targets.Clear();
            foreach(var p in effects.Values)Destroy(p);effects.Clear();
        }
        void OnDestroy(){foreach(var material in materials.Values)Destroy(material);}
    }
}
