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
        public Action Pause,Score,Shop,Weapon,Grenade,Medkit;
        bool dead;
        string weapon="rifle";
        readonly List<TouchSurface> surfaces=new List<TouchSurface>();
        readonly Dictionary<string,Button> buttons=new Dictionary<string,Button>();
        RectTransform root,knob;
        Vector2 screen;
        Rect safe;
        public void Build(RectTransform parent)
        {
            root=NativeUI.Panel(parent,"Touch controls",Color.clear);
            var zone=NativeUI.Panel(root,"Look",Color.clear);zone.anchorMin=new Vector2(.35f,0);zone.anchorMax=Vector2.one;zone.offsetMin=zone.offsetMax=Vector2.zero;
            zone.GetComponent<Image>().raycastTarget=true;Surface(zone,"look");
            var stick=NativeUI.Panel(root,"Move",new Color(.08f,.18f,.2f,.5f));NativeUI.Place(stick,new Vector2(0,0),new Vector2(84,82),new Vector2(122,122));Surface(stick,"move");
            knob=NativeUI.Panel(stick,"Knob",new Color(.75f,.9f,.3f,.6f));NativeUI.Place(knob,new Vector2(.5f,.5f),Vector2.zero,new Vector2(44,44));knob.GetComponent<Image>().raycastTarget=false;
            Add("fire","ATEŞ",new Vector2(-66,130),new Vector2(82,82),null,true);
            Add("aim","NİŞAN",new Vector2(-66,220),new Vector2(65,54),()=>{if(!dead&&weapon!="knife")Aim=weapon=="awp"?(Aim+1)%3:Aim==0?1:0;});
            Add("jump","ZIPLA",new Vector2(-145,134),new Vector2(62,58),null,true);
            Add("crouch","EĞİL",new Vector2(-60,50),new Vector2(62,54),null,true);
            Add("reload","DOLDUR",new Vector2(-135,50),new Vector2(62,54),()=>Reload=true);
            Add("weapon","SİLAH",new Vector2(-210,50),new Vector2(62,54),()=>Weapon?.Invoke());
            Add("grenade","BOMBA",new Vector2(-285,50),new Vector2(62,54),()=>Grenade?.Invoke());
            Add("interact","KUR / İMHA",new Vector2(-224,134),new Vector2(82,58),null,true);
            var menu=NativeUI.Button(root,"MENÜ",()=>Pause?.Invoke());NativeUI.Place((RectTransform)menu.transform,new Vector2(1,1),new Vector2(-42,-26),new Vector2(68,42));
            var score=NativeUI.Button(root,"SKOR",()=>Score?.Invoke());NativeUI.Place((RectTransform)score.transform,new Vector2(1,1),new Vector2(-118,-26),new Vector2(68,42));
            var shop=NativeUI.Button(root,"SATIN AL",()=>Shop?.Invoke());NativeUI.Place((RectTransform)shop.transform,new Vector2(1,1),new Vector2(-194,-26),new Vector2(76,42));
            var medkit=NativeUI.Button(root,"SAĞLIK KİTİ",()=>Medkit?.Invoke());NativeUI.Place((RectTransform)medkit.transform,new Vector2(0,0),new Vector2(78,182),new Vector2(114,42));buttons["medkit"]=medkit;
            screen=new Vector2(Screen.width,Screen.height);safe=Screen.safeArea;
            SetGameplay(false);
        }
        void Surface(RectTransform target,string control)
        {var surface=target.gameObject.AddComponent<TouchSurface>();surface.Owner=this;surface.Control=control;surfaces.Add(surface);}
        void Add(string id,string label,Vector2 position,Vector2 size,Action action,bool held=false)
        {
            var button=NativeUI.Button(root,label,()=>{if(Gameplay&&Allowed(id))action?.Invoke();});
            NativeUI.Place((RectTransform)button.transform,new Vector2(1,0),position,size);buttons[id]=button;
            if(held)Surface((RectTransform)button.transform,id);
        }
        public bool Allowed(string id)=>!dead||id=="look"||id=="move";
        public void Move(Vector2 value)
        {Movement=value.magnitude<.12f?Vector2.zero:Vector2.ClampMagnitude(value,1);Sprint=value.magnitude>.88f;knob.anchoredPosition=Movement*42;}
        public void Hold(string id,bool pressed)
        {
            switch(id){case "move":if(!pressed)Move(Vector2.zero);break;case "fire":Fire=pressed;break;case "jump":Jump=pressed;break;case "crouch":Crouch=pressed;break;case "interact":Interact=pressed;break;}
        }
        public void Look(Vector2 delta)
        {
            double scale=.004*Sensitivity*390/Math.Max(1,Screen.height);
            if(Aim>0)scale*=weapon=="awp"?(Aim==2?.125:.25):.74;
            Yaw-=delta.x*scale;Pitch=MovementCoreClamp(Pitch+delta.y*scale);
        }
        static double MovementCoreClamp(double value)=>Sector16.Movement.Clamp(value,-1.45,1.45);
        public void Reset()
        {
            Movement=Vector2.zero;Fire=Jump=Crouch=Interact=Sprint=Reload=false;Aim=0;
            if(knob!=null)knob.anchoredPosition=Vector2.zero;
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
            buttons["aim"].interactable=!dead&&weapon!="knife";buttons["reload"].interactable=!dead&&weapon!="knife";
            buttons["grenade"].interactable=!dead&&own.grenades>0;
            buttons["medkit"].interactable=!dead&&own.medkits>0&&own.hp<100;
            buttons["interact"].gameObject.SetActive(bomb&&!dead);
            buttons["jump"].gameObject.SetActive(!spectating);buttons["crouch"].gameObject.SetActive(!spectating);
            if(!bomb||dead)Interact=false;
            if(spectating)Jump=Crouch=false;
            buttons["aim"].GetComponentInChildren<Text>().text=Aim==0?"NİŞAN":weapon=="awp"?(Aim==2?"NİŞAN 8×":"NİŞAN 4×"):"NİŞAN •";
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
            i.fire=live&&(Fire||(Gameplay&&Mouse.current?.leftButton.isPressed==true));
            i.aim=live&&Aim>0;i.crouch=live&&(Crouch||(Gameplay&&keyboard?.cKey.isPressed==true));
            i.jump=live&&(Jump||(Gameplay&&keyboard?.spaceKey.isPressed==true));
            i.sprint=live&&(Sprint||(Gameplay&&keyboard?.leftShiftKey.isPressed==true));
            i.interact=live&&(Interact||(Gameplay&&keyboard?.eKey.isPressed==true));i.reload=live&&Reload;Reload=false;return i;
        }
        void Update()
        {
            var now=new Vector2(Screen.width,Screen.height);
            if(now!=screen||safe!=Screen.safeArea){screen=now;safe=Screen.safeArea;Reset();}
            if(!Gameplay)return;
            if(Keyboard.current?.escapeKey.wasPressedThisFrame==true)Pause?.Invoke();
            if(!dead&&Mouse.current?.rightButton.wasPressedThisFrame==true&&weapon!="knife")Aim=weapon=="awp"?(Aim+1)%3:Aim==0?1:0;
            if(!dead&&Keyboard.current?.qKey.wasPressedThisFrame==true)Weapon?.Invoke();
            if(!dead&&Keyboard.current?.gKey.wasPressedThisFrame==true)Grenade?.Invoke();
            if(!Application.isMobilePlatform&&Cursor.lockState==CursorLockMode.Locked&&Mouse.current!=null)Look(Mouse.current.delta.ReadValue());
        }
        void OnApplicationFocus(bool focused){if(!focused)Reset();}
        void OnApplicationPause(bool paused){if(paused)Reset();}
    }
}
