using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

namespace Sector16.Editor
{
    public static class NativeChecks
    {
        static void Check(bool value,string message){if(!value)throw new Exception(message);}
        public static void Run()
        {
            var world=JsonUtility.FromJson<WorldData>(Resources.Load<TextAsset>("world").text);
            Check(world.maps.Length==7,"Seven exported maps including depot");Check(world.weapons.Length==9,"Nine exported weapons");
            var input=new InputFrame{seq=17,x=.5,z=-1,yaw=1.2,pitch=-.3,fire=true,weapon="awp"};
            var json=JsonUtility.ToJson(new InputMessage{inputs=new[]{input}});
            var roundTrip=JsonUtility.FromJson<InputMessage>(json);Check(roundTrip.inputs[0].seq==17&&roundTrip.inputs[0].fire,"Input wire roundtrip");
            var position=WorldRenderer.Position(1,2,-3);Check(position==new Vector3(1,2,3),"Server to Unity coordinate conversion");
            foreach(var yaw in new[]{0.0,Math.PI/2,-Math.PI/2,Math.PI})
            {
                var forward=WorldRenderer.Rotation(yaw,.2)*Vector3.forward;
                var expected=new Vector3((float)(-Math.Sin(yaw)*Math.Cos(.2)),(float)Math.Sin(.2),(float)(Math.Cos(yaw)*Math.Cos(.2)));
                Check(Vector3.Distance(forward,expected)<.00001f,"Camera aims in same direction as server fire");
            }
            var canvas=new GameObject("Control test",typeof(RectTransform),typeof(Canvas));canvas.GetComponent<Canvas>().renderMode=RenderMode.ScreenSpaceOverlay;
            var eventSystem=new GameObject("Event test",typeof(EventSystem)).GetComponent<EventSystem>();
            var controls=canvas.AddComponent<NativeControls>();controls.Build((RectTransform)canvas.transform);controls.SetGameplay(true);
            var surfaces=canvas.GetComponentsInChildren<TouchSurface>();
            var fire=Array.Find(surfaces,s=>s.Control=="fire");var look=Array.Find(surfaces,s=>s.Control=="look");
            fire.OnPointerDown(new PointerEventData(eventSystem){pointerId=10,position=new Vector2(500,100)});
            look.OnPointerDown(new PointerEventData(eventSystem){pointerId=20,position=new Vector2(400,100)});
            look.OnDrag(new PointerEventData(eventSystem){pointerId=20,position=new Vector2(450,120)});
            Check(controls.Fire&&controls.Yaw<0&&controls.Pitch>0,"Independent fingers fire and look concurrently");
            fire.OnPointerUp(new PointerEventData(eventSystem){pointerId=20});Check(controls.Fire,"Another finger cannot release fire");
            controls.Move(new Vector2(.5f,1));controls.Reset();Check(!controls.Fire&&controls.Movement==Vector2.zero,"Touch reset");
            fire.OnDrag(new PointerEventData(eventSystem){pointerId=10,position=new Vector2(600,100)});Check(!controls.Fire,"Stale drag after reset");
            controls.Context(new PlayerState{hp=100,weapon="rifle"},false,false);controls.RequestReload();Check(controls.Sample(18,"rifle",true).reload&&!controls.Sample(19,"rifle",true).reload,"HUD reload is a single input, not held fire");
            int changes=0;controls.Weapon=()=>changes++;controls.RequestWeapon();Check(changes==1,"HUD weapon action");
            controls.Context(new PlayerState{hp=100,weapon="knife"},false,false);controls.RequestReload();Check(!controls.Sample(20,"knife",true).reload,"Knife cannot reload");
            controls.Aim=2;controls.Context(new PlayerState{hp=0,weapon="awp"},false,true);Check(!controls.Fire&&controls.Aim==0,"Death resets fire and scope");
            controls.SetGameplay(false);fire.OnPointerDown(new PointerEventData(eventSystem){pointerId=30});Check(!controls.Fire,"Paused touches are ignored");
            controls.RequestReload();controls.RequestWeapon();Check(!controls.Reload&&changes==1,"Paused HUD actions are ignored");
            var effects=new GameObject("Effect test").AddComponent<WorldRenderer>();effects.Players(new Envelope{grenades=new[]{new PointState{id="flying-smoke",kind="smoke",y=2}},smokes=new[]{new PointState{id="cloud",y=0}}},"none");
            Check(GameObject.Find("grenade-flying-smoke").transform.localScale==Vector3.one*.25f,"Flying smoke grenade remains small");
            Check(GameObject.Find("smoke-cloud").transform.localScale==new Vector3(6,4.5f,6),"Server smoke without a kind field creates a cloud");UnityEngine.Object.DestroyImmediate(effects.gameObject);
            UnityEngine.Object.DestroyImmediate(canvas);UnityEngine.Object.DestroyImmediate(eventSystem.gameObject);
            Debug.Log("NATIVE CHECKS PASS: world export, JSON input, coordinate/aim mapping, multiple fingers, ownership, reset, death and pause.");
        }
    }
}
