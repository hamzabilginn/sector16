using System;
using System.Collections.Generic;
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
            var canvas=new GameObject("Control test",typeof(RectTransform),typeof(Canvas),typeof(GraphicRaycaster));
            // Render the canvas so Unity assigns graphic depths before hit testing in batch mode.
            var camera=new GameObject("Raycast camera",typeof(Camera)).GetComponent<Camera>();
            var target=new RenderTexture(844,390,16);target.Create();camera.targetTexture=target;
            var uiCanvas=canvas.GetComponent<Canvas>();uiCanvas.renderMode=RenderMode.ScreenSpaceCamera;uiCanvas.worldCamera=camera;uiCanvas.planeDistance=1;
            var eventSystem=new GameObject("Event test",typeof(EventSystem)).GetComponent<EventSystem>();
            var controls=canvas.AddComponent<NativeControls>();controls.Build((RectTransform)canvas.transform);controls.SetGameplay(true);
            var hud=canvas.AddComponent<NativeHud>();hud.Build((RectTransform)canvas.transform);hud.BindControls(controls);
            var surfaces=canvas.GetComponentsInChildren<TouchSurface>();
            var fire=Array.Find(surfaces,s=>s.Control=="fire");var look=Array.Find(surfaces,s=>s.Control=="look");var move=Array.Find(surfaces,s=>s.Control=="move");
            Canvas.ForceUpdateCanvases();camera.Render();
            var moveRect=(RectTransform)move.transform;
            var touch=new PointerEventData(eventSystem){pointerId=40,position=RectTransformUtility.WorldToScreenPoint(camera,moveRect.TransformPoint(Vector2.zero))};
            // Runtime raycasters are not registered with EventSystem in edit mode.
            var hits=new List<RaycastResult>();canvas.GetComponent<GraphicRaycaster>().Raycast(touch,hits);
            Check(hits.Count>0&&hits[0].gameObject.GetComponentInParent<TouchSurface>()==move,"Joystick must receive actual UI raycasts through the HUD");
            touch.pointerPressRaycast=hits[0];
            ExecuteEvents.Execute(hits[0].gameObject,touch,ExecuteEvents.pointerDownHandler);
            foreach(var direction in new[]{Vector2.up,Vector2.down,Vector2.left,Vector2.right})
            {
                touch.position=RectTransformUtility.WorldToScreenPoint(camera,moveRect.TransformPoint(direction*30));
                ExecuteEvents.Execute(move.gameObject,touch,ExecuteEvents.dragHandler);
                var sampled=controls.Sample(21,"rifle",true);
                Check(Math.Abs(sampled.x-direction.x*.7f)<.02&&Math.Abs(sampled.z+direction.y*.7f)<.02,"Joystick drag reaches movement input in all four directions");
            }
            touch.position=RectTransformUtility.WorldToScreenPoint(camera,moveRect.TransformPoint(Vector2.up*150));
            ExecuteEvents.Execute(move.gameObject,touch,ExecuteEvents.dragHandler);
            var sprint=controls.Sample(22,"rifle",true);Check(sprint.z==-1&&sprint.sprint,"Dragging outside the joystick keeps forward movement and sprint captured");
            touch.position=RectTransformUtility.WorldToScreenPoint(camera,moveRect.TransformPoint(Vector2.right*30));
            ExecuteEvents.Execute(move.gameObject,touch,ExecuteEvents.dragHandler);
            move.OnPointerUp(new PointerEventData(eventSystem){pointerId=41});Check(controls.Movement.x>.5f,"Another finger cannot release movement");
            ExecuteEvents.Execute(move.gameObject,touch,ExecuteEvents.pointerUpHandler);Check(controls.Movement==Vector2.zero&&!controls.Sprint,"Releasing joystick stops movement and sprint");
            fire.OnPointerDown(new PointerEventData(eventSystem){pointerId=10,position=new Vector2(500,100)});
            look.OnPointerDown(new PointerEventData(eventSystem){pointerId=20,position=new Vector2(400,100)});
            look.OnDrag(new PointerEventData(eventSystem){pointerId=20,position=new Vector2(450,120)});
            touch.position=RectTransformUtility.WorldToScreenPoint(camera,moveRect.TransformPoint(Vector2.up*30));move.OnPointerDown(touch);
            var combined=controls.Sample(23,"rifle",true);
            Check(combined.fire&&combined.z<-.5&&controls.Yaw<0&&controls.Pitch>0,"Independent fingers move, fire and look concurrently");
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
            UnityEngine.Object.DestroyImmediate(canvas);UnityEngine.Object.DestroyImmediate(eventSystem.gameObject);camera.targetTexture=null;target.Release();UnityEngine.Object.DestroyImmediate(target);UnityEngine.Object.DestroyImmediate(camera.gameObject);
            Debug.Log("NATIVE CHECKS PASS: world export, JSON input, coordinate/aim mapping, joystick UI raycast and four directions, multiple fingers, ownership, reset, death and pause.");
        }
    }
}
