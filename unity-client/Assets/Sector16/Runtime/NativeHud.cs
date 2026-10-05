using System;
using UnityEngine;
using UnityEngine.UI;
namespace Sector16
{
    public sealed class NativeHud : MonoBehaviour
    {
        RectTransform root,healthFill,scope;
        Text blue,orange,timer,mode,hp,armor,ammo,reserve,weapon,cash;
        Button weaponButton,reloadButton,shopButton;
        NativeGlyph hit;
        Image damage,flash;
        float hitUntil,damageUntil,flashUntil,flashDuration;
        public void Build(RectTransform parent)
        {
            root=NativeUI.Panel(parent,"Match HUD",Color.clear);
            var match=NativeUI.Panel(root,"Score",new Color(.035f,.06f,.075f,.9f));NativeUI.Rounded(match);NativeUI.Place(match,new Vector2(.5f,1),new Vector2(0,-28),new Vector2(264,46));
            blue=NativeUI.TextAt(match,"0",28,new Vector2(0,.5f),new Vector2(44,0),new Vector2(68,38),WorldRenderer.Color(0x60bbef),TextAnchor.MiddleCenter,true);
            orange=NativeUI.TextAt(match,"0",28,new Vector2(1,.5f),new Vector2(-44,0),new Vector2(68,38),WorldRenderer.Color(0xf39b63),TextAnchor.MiddleCenter,true);
            timer=NativeUI.TextAt(match,"08:00",22,Vector2.one*.5f,new Vector2(0,5),new Vector2(105,28),NativeUI.Paper,TextAnchor.MiddleCenter,true);
            mode=NativeUI.TextAt(match,"TAKIM SAVAŞI",8,Vector2.one*.5f,new Vector2(0,-14),new Vector2(110,14),NativeUI.Muted,TextAnchor.MiddleCenter);
            var health=NativeUI.Panel(root,"Health",new Color(.035f,.065f,.08f,.8f));NativeUI.Rounded(health);NativeUI.Place(health,new Vector2(.5f,0),new Vector2(-85,33),new Vector2(150,46));
            hp=NativeUI.TextAt(health,"100",26,new Vector2(0,.5f),new Vector2(28,5),new Vector2(50,30),NativeUI.Paper,TextAnchor.MiddleCenter,true);
            armor=NativeUI.TextAt(health,"ZIRH 0",9,new Vector2(1,.5f),new Vector2(-39,5),new Vector2(68,20),NativeUI.Muted,TextAnchor.MiddleRight);
            var track=NativeUI.Panel(health,"Health track",new Color(1,1,1,.15f));NativeUI.Place(track,new Vector2(.5f,0),new Vector2(0,8),new Vector2(132,3));healthFill=NativeUI.Panel(track,"Health fill",NativeUI.Accent);
            var ammoPanel=NativeUI.Panel(root,"Equipment",new Color(.035f,.065f,.08f,.8f));NativeUI.Rounded(ammoPanel);NativeUI.Place(ammoPanel,new Vector2(.5f,0),new Vector2(101,33),new Vector2(182,46));
            weaponButton=NativeUI.Button(ammoPanel,"",null);NativeUI.Place((RectTransform)weaponButton.transform,new Vector2(0,.5f),new Vector2(43,0),new Vector2(80,42));weaponButton.GetComponent<Image>().color=Color.clear;
            reloadButton=NativeUI.Button(ammoPanel,"",null);NativeUI.Place((RectTransform)reloadButton.transform,new Vector2(1,.5f),new Vector2(-46,0),new Vector2(88,42));reloadButton.GetComponent<Image>().color=Color.clear;
            weapon=NativeUI.TextAt(weaponButton.transform,"AR-16",12,Vector2.one*.5f,new Vector2(0,7),new Vector2(68,22),NativeUI.Paper,TextAnchor.MiddleCenter,true);
            NativeUI.TextAt(weaponButton.transform,"DEĞİŞTİR",7,Vector2.one*.5f,new Vector2(0,-12),new Vector2(68,13),NativeUI.Muted,TextAnchor.MiddleCenter);
            ammo=NativeUI.TextAt(reloadButton.transform,"30",25,Vector2.one*.5f,new Vector2(-13,7),new Vector2(40,31),NativeUI.Paper,TextAnchor.MiddleRight,true);
            reserve=NativeUI.TextAt(reloadButton.transform,"/ 120",11,Vector2.one*.5f,new Vector2(21,6),new Vector2(44,25),NativeUI.Muted,TextAnchor.MiddleCenter);
            NativeUI.TextAt(reloadButton.transform,"DOLDUR",7,Vector2.one*.5f,new Vector2(0,-12),new Vector2(68,13),NativeUI.Muted,TextAnchor.MiddleCenter);
            shopButton=NativeUI.Button(root,"",null);NativeUI.Place((RectTransform)shopButton.transform,new Vector2(0,1),new Vector2(56,-34),new Vector2(88,44));shopButton.GetComponent<Image>().color=new Color(.035f,.065f,.08f,.6f);
            cash=NativeUI.TextAt(shopButton.transform,"$800",16,Vector2.one*.5f,new Vector2(0,7),new Vector2(72,22),NativeUI.Accent,TextAnchor.MiddleLeft,true);
            NativeUI.TextAt(shopButton.transform,"SATIN AL",8,Vector2.one*.5f,new Vector2(0,-13),new Vector2(72,13),NativeUI.Muted);
            damage=NativeUI.Panel(root,"Damage feedback",Color.clear).GetComponent<Image>();damage.rectTransform.anchorMin=new Vector2(0,.96f);
            hit=NativeUI.Glyph(root,"hit",NativeUI.Paper);NativeUI.Place(hit.rectTransform,Vector2.one*.5f,Vector2.zero,new Vector2(28,28));hit.gameObject.SetActive(false);
            flash=NativeUI.Panel(root,"Flash feedback",Color.clear).GetComponent<Image>();
            scope=NativeUI.Panel(root,"Scope",Color.clear);var scopeGraphic=new GameObject("Scope mask",typeof(RectTransform),typeof(NativeScope));scopeGraphic.transform.SetParent(scope,false);var scopeRect=(RectTransform)scopeGraphic.transform;scopeRect.anchorMin=Vector2.zero;scopeRect.anchorMax=Vector2.one;scopeRect.offsetMin=scopeRect.offsetMax=Vector2.zero;scopeGraphic.GetComponent<NativeScope>().raycastTarget=false;scope.SetAsFirstSibling();scope.gameObject.SetActive(false);
        }
        public void Show(bool value){root.gameObject.SetActive(value);if(!value)scope.gameObject.SetActive(false);}
        public void BindControls(NativeControls controls){weaponButton.onClick.AddListener(controls.RequestWeapon);reloadButton.onClick.AddListener(controls.RequestReload);shopButton.onClick.AddListener(()=>controls.Shop?.Invoke());scope.SetParent(root.parent,false);scope.SetAsFirstSibling();root.SetAsLastSibling();}
        public void Hit(bool head,bool kill){hit.color=kill?new Color(1,.55f,.25f):head?NativeUI.Accent:NativeUI.Paper;hitUntil=Time.unscaledTime+.2f;hit.gameObject.SetActive(true);}
        public void Hurt(){damageUntil=Time.unscaledTime+.45f;}
        public void Flash(float seconds){flashDuration=Mathf.Clamp(seconds,0,3);flashUntil=Time.unscaledTime+flashDuration;}
        void Update(){if(hit!=null)hit.gameObject.SetActive(Time.unscaledTime<hitUntil);if(damage!=null)damage.color=new Color(.95f,.15f,.09f,Mathf.Clamp01((damageUntil-Time.unscaledTime)/.45f)*.7f);if(flash!=null)flash.color=new Color(1,1,1,Mathf.Clamp01((flashUntil-Time.unscaledTime)/Mathf.Max(.1f,flashDuration)));}
        public void State(Envelope state,PlayerState own,string name,bool scoped,bool paused)
        {
            blue.text=(state.scores?.blue??0).ToString();orange.text=(state.scores?.orange??0).ToString();double remaining=Math.Max(0,state.remaining);timer.text=$"{Math.Floor(remaining/60):00}:{Math.Floor(remaining%60):00}";
            mode.text=state.mode=="training"?"ANTRENMAN":state.mode=="bomb"?"BOMBA KURMA":state.mode=="ctf"?"BAYRAK KAPMACA":state.mode=="escort"?"ESKORT %"+Math.Round((state.escort?.progress??0)*100)+(state.escort?.contested==true?" · ÇATIŞMA":""):state.mode=="rounds"?"RAUND "+state.round:"TAKIM SAVAŞI";
            hp.text=own.hp.ToString();armor.text="ZIRH "+own.armor;weapon.text=name;ammo.text=own.ammo.ToString();reserve.text="/ "+own.reserve;cash.text="$"+own.money;
            weaponButton.interactable=own.hp>0&&!paused;reloadButton.interactable=own.hp>0&&!paused&&own.weapon!="knife";
            shopButton.interactable=own.hp>0&&!paused;
            healthFill.anchorMax=new Vector2(Mathf.Clamp01(own.hp/100f),1);healthFill.GetComponent<Image>().color=own.hp<30?new Color(.98f,.38f,.28f):NativeUI.Accent;scope.gameObject.SetActive(scoped&&!paused&&own.hp>0);
        }
    }
    [ExecuteAlways,RequireComponent(typeof(CanvasRenderer))]
    public sealed class NativeScope : MaskableGraphic
    {
        protected override void OnPopulateMesh(VertexHelper mesh)
        {
            mesh.Clear();var rect=rectTransform.rect;float radius=rect.height*.43f,outer=Mathf.Max(rect.width,rect.height);var dark=new Color(.006f,.009f,.012f,.96f);
            for(int i=0;i<96;i++){float a=i*Mathf.PI/48,b=(i+1)*Mathf.PI/48;int n=mesh.currentVertCount;Vector2 from=new Vector2(Mathf.Cos(a),Mathf.Sin(a)),to=new Vector2(Mathf.Cos(b),Mathf.Sin(b));mesh.AddVert(from*radius,dark,Vector2.zero);mesh.AddVert(from*outer,dark,Vector2.zero);mesh.AddVert(to*outer,dark,Vector2.zero);mesh.AddVert(to*radius,dark,Vector2.zero);mesh.AddTriangle(n,n+1,n+2);mesh.AddTriangle(n,n+2,n+3);}
            Quad(mesh,new Rect(-radius,-.6f,radius*2,1.2f),Color.black);Quad(mesh,new Rect(-.6f,-radius,1.2f,radius*2),Color.black);
            for(int i=-4;i<=4;i++)if(i!=0){Quad(mesh,new Rect(i*radius/6,-3,1,6),Color.black);Quad(mesh,new Rect(-3,i*radius/6,6,1),Color.black);}
        }
        static void Quad(VertexHelper mesh,Rect r,Color c){int i=mesh.currentVertCount;mesh.AddVert(new Vector2(r.xMin,r.yMin),c,Vector2.zero);mesh.AddVert(new Vector2(r.xMin,r.yMax),c,Vector2.zero);mesh.AddVert(new Vector2(r.xMax,r.yMax),c,Vector2.zero);mesh.AddVert(new Vector2(r.xMax,r.yMin),c,Vector2.zero);mesh.AddTriangle(i,i+1,i+2);mesh.AddTriangle(i,i+2,i+3);}
    }
}
