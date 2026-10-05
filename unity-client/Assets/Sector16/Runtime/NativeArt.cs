using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace Sector16
{
    // Procedural meshes and textures exported from the same builders used by the web client.
    public sealed class NativeArt : MonoBehaviour
    {
        [Serializable] public class Geometry { public float[] positions,normals,uv; public int[] indices; }
        [Serializable] public class Surface { public float[] color,repeat; public string texture; public float metal,rough; public bool unlit,doubleSided,transparent; }
        [Serializable] public class Node { public string name; public int parent,mesh,material; public float[] position,rotation,scale; public bool visible; }
        [Serializable] public class RigRef { public string key; public int node; }
        [Serializable] public class Asset { public string id; public Node[] nodes; public RigRef[] rig; }
        [Serializable] public class Library { public Geometry[] geometries; public Surface[] materials; public Asset[] assets; }
        public sealed class Instance
        {
            public GameObject root;
            public Transform[] nodes;
            public Vector3[] positions;
            public Quaternion[] rotations;
            public readonly Dictionary<string,int> rig=new Dictionary<string,int>();
            public Transform Joint(string key)=>rig.TryGetValue(key,out var index)?nodes[index]:null;
            public void Restore(){for(int i=0;i<nodes.Length;i++){nodes[i].localPosition=positions[i];nodes[i].localRotation=rotations[i];}}
        }
        Library library;
        readonly Dictionary<string,Asset> assets=new Dictionary<string,Asset>();
        readonly Dictionary<string,Mesh> combined=new Dictionary<string,Mesh>();
        Mesh[] meshes;
        Material[] materials;
        public void Load()
        {
            if(library!=null)return;
            var text=Resources.Load<TextAsset>("NativeArt/library");if(text==null)throw new InvalidOperationException("Run node scripts/export-unity-art.mjs before building.");
            library=JsonUtility.FromJson<Library>(text.text);meshes=new Mesh[library.geometries.Length];materials=new Material[library.materials.Length];
            foreach(var asset in library.assets)assets.Add(asset.id,asset);
        }
        static Vector3 Vector(float[] a)=>new Vector3(a[0],a[1],-a[2]);
        static Quaternion Quaternion(float[] a)=>new Quaternion(-a[0],-a[1],a[2],a[3]);
        Mesh Mesh(int index)
        {
            if(meshes[index]!=null)return meshes[index];var g=library.geometries[index];var mesh=new Mesh{name="Sector16 art "+index};
            int count=g.positions.Length/3;if(count>65535)mesh.indexFormat=IndexFormat.UInt32;
            var vertices=new Vector3[count];var normals=new Vector3[count];var uv=new Vector2[count];
            for(int i=0;i<count;i++){vertices[i]=new Vector3(g.positions[i*3],g.positions[i*3+1],-g.positions[i*3+2]);if(g.normals.Length>0)normals[i]=new Vector3(g.normals[i*3],g.normals[i*3+1],-g.normals[i*3+2]);if(g.uv.Length>0)uv[i]=new Vector2(g.uv[i*2],g.uv[i*2+1]);}
            var triangles=(int[])g.indices.Clone();for(int i=0;i<triangles.Length;i+=3){int v=triangles[i+1];triangles[i+1]=triangles[i+2];triangles[i+2]=v;}
            mesh.vertices=vertices;mesh.triangles=triangles;mesh.uv=uv;if(g.normals.Length>0)mesh.normals=normals;else mesh.RecalculateNormals();mesh.RecalculateBounds();meshes[index]=mesh;return mesh;
        }
        Material Material(int index)
        {
            if(materials[index]!=null)return materials[index];var s=library.materials[index];
            var m=new Material(Resources.Load<Shader>("NativeSurface")){name="Sector16 surface "+index};
            m.color=new Color(s.color[0],s.color[1],s.color[2],s.color[3]);m.SetFloat("_Gloss",1-s.rough);m.SetFloat("_Metallic",s.metal);m.SetFloat("_Unlit",s.unlit?1:0);m.SetInt("_Cull",s.doubleSided?0:2);
            if(!string.IsNullOrEmpty(s.texture)){m.mainTexture=Resources.Load<Texture2D>("NativeArt/"+s.texture);m.mainTextureScale=new Vector2(s.repeat[0],s.repeat[1]);}
            if(s.transparent){m.SetInt("_ZWrite",0);m.renderQueue=3000;}
            materials[index]=m;return m;
        }
        public Instance Create(string id,Transform parent,bool batch=false)
        {
            Load();if(!assets.TryGetValue(id,out var asset))throw new InvalidOperationException("Missing native art: "+id);
            var result=new Instance{nodes=new Transform[asset.nodes.Length],positions=new Vector3[asset.nodes.Length],rotations=new Quaternion[asset.nodes.Length]};
            for(int i=0;i<asset.nodes.Length;i++)
            {
                var node=asset.nodes[i];var obj=new GameObject(node.name);var t=obj.transform;t.SetParent(node.parent<0?parent:result.nodes[node.parent],false);t.localPosition=Vector(node.position);t.localRotation=Quaternion(node.rotation);t.localScale=new Vector3(node.scale[0],node.scale[1],node.scale[2]);
                result.nodes[i]=t;result.positions[i]=t.localPosition;result.rotations[i]=t.localRotation;obj.SetActive(node.visible);
                if(node.mesh>=0){obj.AddComponent<MeshFilter>().sharedMesh=Mesh(node.mesh);var renderer=obj.AddComponent<MeshRenderer>();renderer.sharedMaterial=Material(node.material);renderer.shadowCastingMode=ShadowCastingMode.On;renderer.receiveShadows=true;}
            }
            result.root=result.nodes[0].gameObject;foreach(var joint in asset.rig)result.rig[joint.key]=joint.node;
            if(batch)StaticBatchingUtility.Combine(result.root);else CombineArt(asset,result);return result;
        }
        void CombineArt(Asset asset,Instance instance)
        {
            // Merge only parts that move together, so reload and character joints remain independent.
            var joints=new HashSet<int>();foreach(var joint in asset.rig)joints.Add(joint.node);
            var groups=new Dictionary<string,List<CombineInstance>>();var pivots=new Dictionary<string,int>();var surfaces=new Dictionary<string,int>();
            for(int i=0;i<asset.nodes.Length;i++)
            {
                var node=asset.nodes[i];if(node.mesh<0||!instance.nodes[i].gameObject.activeInHierarchy)continue;
                int pivot=i;while(pivot>0&&!joints.Contains(pivot))pivot=asset.nodes[pivot].parent;
                string key=asset.id+":"+pivot+":"+node.material;
                if(!groups.TryGetValue(key,out var group)){group=new List<CombineInstance>();groups.Add(key,group);pivots[key]=pivot;surfaces[key]=node.material;}
                group.Add(new CombineInstance{mesh=Mesh(node.mesh),transform=instance.nodes[pivot].worldToLocalMatrix*instance.nodes[i].localToWorldMatrix});instance.nodes[i].GetComponent<MeshRenderer>().enabled=false;
            }
            foreach(var pair in groups)
            {
                if(!combined.TryGetValue(pair.Key,out var mesh)){mesh=new Mesh{name=pair.Key,indexFormat=IndexFormat.UInt32};mesh.CombineMeshes(pair.Value.ToArray(),true,true);combined[pair.Key]=mesh;}
                var obj=new GameObject("Batched art");obj.transform.SetParent(instance.nodes[pivots[pair.Key]],false);obj.AddComponent<MeshFilter>().sharedMesh=mesh;obj.AddComponent<MeshRenderer>().sharedMaterial=Material(surfaces[pair.Key]);
            }
        }
        public static void AnimateOperator(Instance actor,PlayerState state,float time)
        {
            float stride=Mathf.Min((float)Math.Sqrt(state.vx*state.vx+state.vz*state.vz)/7,1),phase=time*11;
            for(int i=0;i<2;i++){float swing=Mathf.Sin(phase+i*Mathf.PI)*stride;var leg=actor.Joint("leg"+i);var knee=actor.Joint("knee"+i);if(leg!=null){var p=leg.localPosition;p.y=state.crouch?.38f:.88f;leg.localPosition=p;leg.localRotation=UnityEngine.Quaternion.Euler(-(state.crouch?-1.2f:0)*Mathf.Rad2Deg-swing*(state.crouch?.2f:.6f)*Mathf.Rad2Deg,0,0);}if(knee!=null)knee.localRotation=UnityEngine.Quaternion.Euler(-((state.crouch?2.1f:0)+Mathf.Max(0,-swing)*.8f)*Mathf.Rad2Deg,0,0);}
            var torso=actor.Joint("torso");if(torso!=null){var p=torso.localPosition;p.y=(state.crouch?.39f:.89f)+Mathf.Abs(Mathf.Sin(phase))*stride*.025f+Mathf.Sin(time*1.8f)*.005f;torso.localPosition=p;torso.localRotation=UnityEngine.Quaternion.Euler(stride*.07f*Mathf.Rad2Deg,0,0);}
            var head=actor.Joint("head");if(head!=null)head.localRotation=UnityEngine.Quaternion.Euler(Mathf.Clamp((float)state.pitch*.55f,-.45f,.45f)*Mathf.Rad2Deg,0,0);
            var weapon=actor.Joint("weapon");if(weapon!=null)weapon.localRotation=UnityEngine.Quaternion.Euler((float)state.pitch*.5f*Mathf.Rad2Deg,0,0);
        }
        void OnDestroy(){foreach(var m in combined.Values)WorldRenderer.Release(m);if(meshes!=null)foreach(var m in meshes)WorldRenderer.Release(m);if(materials!=null)foreach(var m in materials)WorldRenderer.Release(m);}
    }
}
