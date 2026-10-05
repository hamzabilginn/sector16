using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;

namespace Sector16
{
    public sealed class NativeControls : MonoBehaviour
    {
        public bool Gameplay {get;private set;}
        public Vector2 Movement {get;private set;}
        public bool Fire,Jump,Crouch,Interact,Sprint;
        public int Aim;
        public bool Reload;
        public double Yaw,Pitch;
        public float Sensitivity=1,Size=1;
        public Action Pause,Score,Shop,Weapon,Medkit;
        public Action<string> Grenade;
        bool dead;
        string weapon="rifle";
        readonly List<TouchSurface> surfaces=new List<TouchSurface>();
        readonly Dictionary<string,Button> buttons=new Dictionary<string,Button>();
        RectTransform root,knob,equipment;
        Vector2 screen;
        Rect safe;
        public void Build(RectTransform parent)
        {
            root=NativeUI.Panel(parent,"Touch controls",Color.clear);
            var zone=NativeUI.Panel(root,"Look",Color.clear);zone.anchorMin=new Vector2(.35f,0);zone.anchorMax=Vector2.one;zone.offsetMin=zone.offsetMax=Vector2.zero;
            zone.GetComponent<Image>().raycastTarget=true;Surface(zone,"look");
            var stick=NativeUI.Panel(root,"Move",new Color(.06f,.1f,.12f,.42f));NativeUI.Rounded(stick,true);NativeUI.Border(stick,new Color(.82f,.9f,.94f,.36f));NativeUI.Place(stick,new Vector2(0,0),new Vector2(88,90),new Vector2(122,122));Surface(stick,"move");
            NativeUI.TextAt(root,"İLERİ İT · KOŞ",9,new Vector2(0,0),new Vector2(88,17),new Vector2(120,16),new Color(.85f,.92f,.94f,.65f),TextAnchor.MiddleCenter);
            knob=NativeUI.Panel(stick,"Knob",new Color(.8f,.89f,.91f,.55f));NativeUI.Rounded(knob,true);NativeUI.Place(knob,new Vector2(.5f,.5f),Vector2.zero,new Vector2(46,46));knob.GetComponent<Image>().raycastTarget=false;NativeUI.Glyph(knob,"move",new Color(.9f,.97f,1,.8f));
            Add("fire","ATEŞ",new Vector2(-66,130),new Vector2(82,82),null,true);
            Add("aim","NİŞAN",new Vector2(-66,220),new Vector2(65,54),()=>{if(!dead&&weapon!="knife")Aim=weapon=="awp"?(Aim+1)%3:Aim==0?1:0;});
            Add("interact","KUR / İMHA",new Vector2(-224,134),new Vector2(82,58),null,true);
            var menu=NativeUI.Button(root,"MENÜ",()=>Pause?.Invoke());NativeUI.Place((RectTransform)menu.transform,new Vector2(1,1),new Vector2(-38,-25),new Vector2(56,32));
            var toggle=NativeUI.Button(root,"TEÇHİZAT",()=>equipment.gameObject.SetActive(!equipment.gameObject.activeSelf));NativeUI.Place((RectTransform)toggle.transform,new Vector2(0,0),new Vector2(202,29),new Vector2(94,29));
            equipment=NativeUI.Panel(root,"Equipment tray",new Color(.025f,.045f,.055f,.94f));NativeUI.Rounded(equipment);NativeUI.Border(equipment,new Color(.6f,.7f,.7f,.4f));NativeUI.Place(equipment,new Vector2(0,0),new Vector2(244,106),new Vector2(264,110));equipment.GetComponent<Image>().raycastTarget=true;
            Tray("grenade","BOMBA",new Vector2(-83,25),()=>Grenade?.Invoke("he"));Tray("smoke","SİS",new Vector2(0,25),()=>Grenade?.Invoke("smoke"));Tray("flash","FLAŞ",new Vector2(83,25),()=>Grenade?.Invoke("flash"));
            Tray("medkit","SAĞLIK",new Vector2(-83,-25),()=>Medkit?.Invoke());Tray("shop","SATIN AL",new Vector2(0,-25),()=>Shop?.Invoke());Tray("score","SKOR",new Vector2(83,-25),()=>Score?.Invoke());equipment.gameObject.SetActive(false);
            screen=new Vector2(Screen.width,Screen.height);safe=Screen.safeArea;
            SetGameplay(false);
        }
        void Surface(RectTransform target,string control)
        {
            // Decorative panels ignore raycasts; every input surface must receive them.
            target.GetComponent<Graphic>().raycastTarget=true;
            var surface=target.gameObject.AddComponent<TouchSurface>();surface.Owner=this;surface.Control=control;surfaces.Add(surface);
        }
        void Add(string id,string label,Vector2 position,Vector2 size,Action action,bool held=false)
        {
            var button=NativeUI.Button(root,label,()=>{if(Gameplay&&Allowed(id))action?.Invoke();});
            NativeUI.Place((RectTransform)button.transform,new Vector2(1,0),position,size);buttons[id]=button;
            NativeUI.Rounded((RectTransform)button.transform,true);button.GetComponent<Image>().color=id=="fire"?new Color(.86f,.95f,.7f,.24f):new Color(.045f,.075f,.085f,.36f);
            var labelText=button.GetComponentInChildren<Text>();labelText.fontSize=9;NativeUI.Place((RectTransform)labelText.transform,Vector2.one*.5f,new Vector2(0,-size.y*.27f),new Vector2(size.x,15));
            var glyph=NativeUI.Glyph(button.transform,id,id=="fire"?NativeUI.Accent:NativeUI.Paper);NativeUI.Place((RectTransform)glyph.transform,Vector2.one*.5f,new Vector2(0,7),new Vector2(id=="fire"?38:26,id=="fire"?38:26));
            if(held)Surface((RectTransform)button.transform,id);
        }
        void Tray(string id,string label,Vector2 position,Action action)
        {var button=NativeUI.Button(equipment,label,()=>{equipment.gameObject.SetActive(false);if(Gameplay&&Allowed(id))action?.Invoke();});NativeUI.Place((RectTransform)button.transform,Vector2.one*.5f,position,new Vector2(77,40));buttons[id]=button;}
        public void RequestReload(){if(Gameplay&&!dead&&weapon!="knife")Reload=true;}
        public void RequestWeapon(){if(Gameplay&&!dead)Weapon?.Invoke();}
        public bool Allowed(string id)=>!dead||id=="look"||id=="move";
        public void Move(Vector2 value)
        {Movement=value.magnitude<.12f?Vector2.zero:Vector2.ClampMagnitude(value,1);Sprint=value.magnitude>.88f;knob.anchoredPosition=Movement*42;}
        public void Hold(string id,bool pressed)
        {
            switch(id){case "move":if(!pressed)Move(Vector2.zero);break;case "fire":Fire=pressed;break;case "jump":Jump=pressed;break;case "crouch":Crouch=pressed;break;case "interact":Interact=pressed;break;}
        }
        public void Look(Vector2 delta)
        {
            double scale=.0032*Sensitivity*390/Math.Max(1,Screen.height);
            if(Aim>0)scale*=weapon=="awp"?(Aim==2?.125:.25):.74;
            Yaw-=delta.x*scale;Pitch=MovementCoreClamp(Pitch+delta.y*scale);
        }
        static double MovementCoreClamp(double value)=>Sector16.Movement.Clamp(value,-1.45,1.45);
        public void Reset()
        {
            Movement=Vector2.zero;Fire=Jump=Crouch=Interact=Sprint=Reload=false;Aim=0;
            if(knob!=null)knob.anchoredPosition=Vector2.zero;
            if(equipment!=null)equipment.gameObject.SetActive(false);
            foreach(var surface in surfaces)surface.Clear();
        }
        public void SetGameplay(bool active)
        {if(active!=Gameplay)Reset();Gameplay=active;if(root!=null)root.gameObject.SetActive(active);}
        public void Context(PlayerState own,bool bomb,bool spectating)
        {
            if(own==null)return;
            bool becameDead=own.hp<=0&&!dead;dead=own.hp<=0;
            if(weapon!=own.weapon){weapon=own.weapon;Aim=0;}
            if(becameDead)Reset();
            foreach(var pair in buttons)pair.Value.interactable=!dead;
            buttons["aim"].interactable=!dead&&weapon!="knife";
            int he=own.utility?.he??own.grenades,smoke=own.utility?.smoke??0,flash=own.utility?.flash??0;
            buttons["grenade"].interactable=!dead&&he>0;buttons["smoke"].interactable=!dead&&smoke>0;buttons["flash"].interactable=!dead&&flash>0;
            buttons["medkit"].interactable=!dead&&own.medkits>0&&own.hp<100;
            buttons["interact"].gameObject.SetActive(bomb&&!dead);
            if(!bomb||dead)Interact=false;
            if(spectating)Jump=Crouch=false;
            buttons["aim"].GetComponentInChildren<Text>().text=Aim==0?"NİŞAN":weapon=="awp"?(Aim==2?"NİŞAN 8×":"NİŞAN 4×"):"NİŞAN •";
            buttons["grenade"].GetComponentInChildren<Text>().text="BOMBA · "+he;buttons["smoke"].GetComponentInChildren<Text>().text="SİS · "+smoke;buttons["flash"].GetComponentInChildren<Text>().text="FLAŞ · "+flash;
            buttons["medkit"].GetComponentInChildren<Text>().text="SAĞLIK · "+own.medkits;
        }
        public InputFrame Sample(long seq,string selected,bool live)
        {
            var move=Movement;var keyboard=Keyboard.current;
            if(Gameplay&&keyboard!=null)
            {
                move+=new Vector2((keyboard.dKey.isPressed?1:0)-(keyboard.aKey.isPressed?1:0),(keyboard.sKey.isPressed?1:0)-(keyboard.wKey.isPressed?1:0));
                if(keyboard.rKey.wasPressedThisFrame)Reload=true;
            }
            var i=new InputFrame{seq=seq,x=live?move.x:0,z=live?-Movement.y:0,yaw=Yaw,pitch=Pitch,weapon=selected};
            // Canvas joystick positive Y is forward; keyboard W already uses server -Z.
            if(live&&keyboard!=null)i.z=-Movement.y+(keyboard.sKey.isPressed?1:0)-(keyboard.wKey.isPressed?1:0);
            i.fire=live&&(Fire||(Gameplay&&Cursor.lockState==CursorLockMode.Locked&&Mouse.current?.leftButton.isPressed==true));
            i.aim=live&&Aim>0;i.crouch=live&&(Crouch||(Gameplay&&keyboard?.cKey.isPressed==true));
            i.jump=live&&(Jump||(Gameplay&&keyboard?.spaceKey.isPressed==true));
            i.sprint=live&&(Sprint||(Gameplay&&keyboard?.leftShiftKey.isPressed==true));
            i.interact=live&&(Interact||(Gameplay&&keyboard?.eKey.isPressed==true));i.reload=live&&Reload;Reload=false;return i;
        }
        void Update()
        {
            var now=new Vector2(Screen.width,Screen.height);
            if(now!=screen||safe!=Screen.safeArea){screen=now;safe=Screen.safeArea;Reset();}
            if(Keyboard.current?.escapeKey.wasPressedThisFrame==true){Pause?.Invoke();return;}
            if(!Gameplay)return;
            if(!dead&&Mouse.current?.rightButton.wasPressedThisFrame==true&&weapon!="knife")Aim=weapon=="awp"?(Aim+1)%3:Aim==0?1:0;
            if(!dead&&Keyboard.current?.qKey.wasPressedThisFrame==true)Weapon?.Invoke();
            if(!dead&&Keyboard.current?.gKey.wasPressedThisFrame==true)Grenade?.Invoke("he");
            if(!Application.isMobilePlatform&&Cursor.lockState==CursorLockMode.Locked&&Mouse.current!=null)Look(Mouse.current.delta.ReadValue());
        }
        void OnApplicationFocus(bool focused){if(!focused)Reset();}
        void OnApplicationPause(bool paused){if(paused)Reset();}
    }
}
