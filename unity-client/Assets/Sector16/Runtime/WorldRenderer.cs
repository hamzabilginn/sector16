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
        readonly Dictionary<string,NativeArt.Instance> operators=new Dictionary<string,NativeArt.Instance>();
        NativeArt art;
        NativeArt.Instance gunArt;
        GameObject mapRoot,gun;
        string mapId,weapon;
        float aimBlend;
        public static Vector3 Position(double x,double y,double z)=>new Vector3((float)x,(float)y,(float)-z);
        public static Quaternion Rotation(double yaw,double pitch=0)=>Quaternion.Euler((float)(-pitch*Mathf.Rad2Deg),(float)(-yaw*Mathf.Rad2Deg),0);
        public Material Material(int rgb)
        {
            if(materials.TryGetValue(rgb,out var mat))return mat;
            var shader=Resources.Load<Shader>("NativeSurface");if(shader==null)throw new System.InvalidOperationException("NativeSurface shader is missing.");
            mat=new Material(shader);mat.color=Color(rgb);materials[rgb]=mat;return mat;
        }
        public static Color Color(int rgb)=>new Color(((rgb>>16)&255)/255f,((rgb>>8)&255)/255f,(rgb&255)/255f);
        public static void Release(Object value){if(value==null)return;if(Application.isPlaying)Object.Destroy(value);else Object.DestroyImmediate(value);}
        GameObject Primitive(string name,PrimitiveType type,Transform parent,Vector3 position,Vector3 size,int color)
        {
            var obj=GameObject.CreatePrimitive(type);obj.name=name;obj.transform.SetParent(parent,false);obj.transform.localPosition=position;obj.transform.localScale=size;obj.GetComponent<Renderer>().sharedMaterial=Material(color);Release(obj.GetComponent<Collider>());return obj;
        }
        public void Map(MapData map,Camera camera)
        {
            if(mapId==map.id)return;mapId=map.id;if(mapRoot!=null)Release(mapRoot);
            if(art==null)art=gameObject.AddComponent<NativeArt>();
            mapRoot=art.Create("map-"+map.id,transform,true).root;
            camera.backgroundColor=Color(map.sky);RenderSettings.ambientLight=new Color(.65f,.7f,.74f);
            RenderSettings.fog=true;RenderSettings.fogColor=Color(map.sky);RenderSettings.fogMode=FogMode.ExponentialSquared;RenderSettings.fogDensity=map.id=="city"?.003f:.009f;
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
                    if(art==null)art=gameObject.AddComponent<NativeArt>();
                    var model=art.Create("operator-"+(p.team=="blue"?"blue":"orange"),transform);actor=model.root;actor.name=p.name;operators[p.id]=model;
                    players[p.id]=actor;actor.transform.position=Position(p.x,p.y,p.z);
                }
                actor.SetActive(p.hp>0);
            }
            foreach(var id in new List<string>(players.Keys))if(!seen.Contains(id)){Release(players[id]);players.Remove(id);targets.Remove(id);operators.Remove(id);}
            var points=new Dictionary<string,PointState>();
            foreach(var g in state.grenades??System.Array.Empty<PointState>())points["grenade-"+g.id]=g;
            foreach(var g in state.smokes??System.Array.Empty<PointState>())points["smoke-"+g.id]=g;
            if(state.bomb!=null&&state.bomb.state!="carried")points["bomb"]=new PointState{x=state.bomb.x,y=state.bomb.y,z=state.bomb.z,kind="bomb"};
            if(state.escort!=null)points["escort"]=new PointState{x=state.escort.x,y=.5,z=state.escort.z,kind="escort"};
            foreach(var flag in new[]{state.flags?.blue,state.flags?.orange})if(flag!=null)points["flag-"+flag.team]=new PointState{x=flag.x,y=flag.y+.8,z=flag.z,kind="flag"};
            foreach(var pair in points)
            {
                bool smokeCloud=pair.Key.StartsWith("smoke-");
                if(!effects.TryGetValue(pair.Key,out var visual)){visual=Primitive(pair.Key,pair.Value.kind=="escort"?PrimitiveType.Cube:PrimitiveType.Sphere,transform,Vector3.zero,pair.Value.kind=="escort"?new Vector3(2,1.1f,3):Vector3.one*.25f,smokeCloud?0x7c8585:0xb7cf69);effects[pair.Key]=visual;}
                visual.transform.position=Position(pair.Value.x,pair.Value.y+.2,pair.Value.z);
                if(pair.Value.kind=="escort")visual.transform.rotation=Rotation(state.escort.yaw);
                if(smokeCloud){visual.transform.localScale=new Vector3(6,4.5f,6);var smoke=Material(0x7c8585);smoke.color=new Color(.49f,.52f,.52f,.65f);smoke.SetInt("_ZWrite",0);smoke.SetInt("_Cull",0);smoke.renderQueue=3000;visual.GetComponent<MeshRenderer>().shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off;}
            }
            foreach(var id in new List<string>(effects.Keys))if(!points.ContainsKey(id)){Release(effects[id]);effects.Remove(id);}
        }
        public void Gun(Camera camera,string selected,bool visible,float recoil,float speed=0,float reload=0,bool aimed=false)
        {
            if(weapon!=selected)
            {
                weapon=selected;if(gun!=null)Release(gun);if(art==null)art=gameObject.AddComponent<NativeArt>();gunArt=art.Create("gun-"+selected,camera.transform);gun=gunArt.root;
                foreach(var renderer in gun.GetComponentsInChildren<MeshRenderer>()){renderer.shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off;renderer.receiveShadows=false;}
            }
            gun.SetActive(visible);gunArt.Restore();float bob=Mathf.Sin(Time.time*9)*Mathf.Min(speed/7,1)*.006f;
            aimBlend=Application.isPlaying?Mathf.Lerp(aimBlend,aimed?1:0,1-Mathf.Exp(-Time.deltaTime*14)):aimed?1:0;
            gun.transform.localScale=Vector3.one*.88f;gun.transform.localPosition=Vector3.Lerp(new Vector3(.25f,-.28f,.64f),new Vector3(0,-.085f,.40f),aimBlend)+new Vector3(bob*(1-aimBlend),-Mathf.Abs(bob),-recoil*.09f);gun.transform.localRotation=Quaternion.Euler(-recoil*8,0,bob*80*(1-aimBlend));
            if(reload>0){float reach=Mathf.Sin(Mathf.Clamp01(reload)*Mathf.PI);gun.transform.localRotation*=Quaternion.Euler(-reach*12,reach*14,-reach*22);var mag=gunArt.Joint("magazine");if(mag!=null)mag.localPosition+=new Vector3(-reach*.05f,-reach*.3f,-reach*.08f);var hand=gunArt.Joint("support");if(hand!=null)hand.localPosition+=new Vector3(0,-reach*.12f,reach*.14f);}
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
                NativeArt.AnimateOperator(operators[pair.Key],p,Time.time);
            }
        }
        public void Clear()
        {
            foreach(var p in players.Values)Release(p);players.Clear();targets.Clear();operators.Clear();if(gun!=null)gun.SetActive(false);
            foreach(var p in effects.Values)Release(p);effects.Clear();
        }
        void OnDestroy(){foreach(var material in materials.Values)Release(material);}
    }
}
