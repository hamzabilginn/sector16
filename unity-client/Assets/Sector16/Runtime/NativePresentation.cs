using System;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
namespace Sector16
{
    public sealed partial class NativeGame
    {
        void BuildUI()
        {
            var canvas=new GameObject("Native UI",typeof(RectTransform),typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster));canvas.GetComponent<Canvas>().renderMode=RenderMode.ScreenSpaceOverlay;
            var scaler=canvas.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(844,390);scaler.matchWidthOrHeight=0;
            safeArea=NativeUI.Panel(canvas.transform,"Safe area",Color.clear);
            gameHud=canvas.AddComponent<NativeHud>();gameHud.Build(safeArea);gameHud.Show(false);
            controls.Pause=TogglePause;controls.Score=OpenScore;controls.Shop=OpenShop;controls.Weapon=CycleWeapon;controls.Grenade=kind=>Send(new Command{type="grenade",kind=kind});controls.Medkit=()=>Send(new Command{type="medkit"});
            controls.Sensitivity=PlayerPrefs.GetFloat("s16.native.sensitivity",1);controls.Build(safeArea);gameHud.BindControls(controls);
            var aim=NativeUI.Panel(safeArea,"Crosshair",Color.clear);NativeUI.Place(aim,Vector2.one*.5f,Vector2.zero,new Vector2(28,28));crosshair=NativeUI.Label(aim,"",1);var reticle=NativeUI.Glyph(crosshair.transform,"crosshair",NativeUI.Accent);reticle.rectTransform.anchoredPosition=Vector2.zero;
            var toast=NativeUI.Panel(safeArea,"Notice",Color.clear);NativeUI.Place(toast,new Vector2(.5f,.68f),Vector2.zero,new Vector2(420,35));notice=NativeUI.Label(toast,"",15);notice.font=NativeUI.Heading;notice.color=NativeUI.Accent;
            // Full-screen lobby with the live map rendered behind the menu.
            lobby=NativeUI.Panel(safeArea,"Lobby",new Color(.025f,.045f,.055f,.90f));lobby.GetComponent<Image>().raycastTarget=true;
            var top=NativeUI.Panel(lobby,"Header",new Color(.03f,.055f,.065f,.8f));top.anchorMin=new Vector2(0,1);top.anchorMax=Vector2.one;top.pivot=new Vector2(.5f,1);top.sizeDelta=new Vector2(0,57);top.anchoredPosition=Vector2.zero;
            NativeUI.TextAt(top,"SECTOR <color=#D9F65B>16</color>",29,new Vector2(0,.5f),new Vector2(120,7),new Vector2(185,34),NativeUI.Paper,TextAnchor.MiddleLeft,true);
            NativeUI.TextAt(top,"TACTICAL MULTIPLAYER",8,new Vector2(0,.5f),new Vector2(120,-15),new Vector2(185,15),NativeUI.Muted);
            network=NativeUI.TextAt(top,"SUNUCUYA BAĞLANILIYOR",9,new Vector2(1,.5f),new Vector2(-245,0),new Vector2(170,24),NativeUI.Accent,TextAnchor.MiddleRight);
            var retry=NativeUI.Button(top,"YENİDEN BAĞLAN",Connect);NativeUI.Place((RectTransform)retry.transform,new Vector2(1,.5f),new Vector2(-89,0),new Vector2(126,30));
            NativeUI.TextAt(lobby,"TAKIMINI TOPLA. ALANA GİR.",10,new Vector2(0,1),new Vector2(193,-79),new Vector2(330,18),NativeUI.Accent);
            NativeUI.TextAt(lobby,"HER AÇININ\nBİR BEDELİ VAR<color=#D9F65B>.</color>",47,new Vector2(0,1),new Vector2(200,-130),new Vector2(344,94),NativeUI.Paper,TextAnchor.MiddleLeft,true);
            NativeUI.TextAt(lobby,"Takımını kur. Sahaya gir. Mücadeleye katıl.",11,new Vector2(0,1),new Vector2(198,-192),new Vector2(340,23),NativeUI.Muted);
            NativeUI.TextAt(lobby,"OYUNCU ADIN",8,new Vector2(0,1),new Vector2(197,-214),new Vector2(340,15),NativeUI.Muted);
            nickname=NativeUI.Field(lobby,PlayerPrefs.GetString("s16.native.nickname","Oyuncu"),Vector2.zero);NativeUI.Place((RectTransform)nickname.transform,new Vector2(0,1),new Vector2(185,-241),new Vector2(314,34));nickname.textComponent.fontSize=15;
            var quick=NativeUI.Primary(lobby,"HIZLI OYNA                         →",()=>Join("quick"));NativeUI.Place((RectTransform)quick.transform,new Vector2(0,1),new Vector2(185,-286),new Vector2(314,40));
            var create=NativeUI.Button(lobby,"+ ÖZEL ODA KUR",()=>Join("create"));NativeUI.Place((RectTransform)create.transform,new Vector2(0,1),new Vector2(105,-327),new Vector2(154,33));
            var training=NativeUI.Button(lobby,"ANTRENMAN",()=>Join("training"));NativeUI.Place((RectTransform)training.transform,new Vector2(0,1),new Vector2(265,-327),new Vector2(154,33));
            var roomsPanel=NativeUI.Panel(lobby,"Room panel",new Color(.055f,.085f,.1f,.93f));NativeUI.Rounded(roomsPanel);NativeUI.Border(roomsPanel,new Color(.6f,.75f,.78f,.22f));NativeUI.Place(roomsPanel,new Vector2(1,1),new Vector2(-205,-207),new Vector2(350,280));
            NativeUI.TextAt(roomsPanel,"LOBİ  /  CANLI",9,new Vector2(0,1),new Vector2(146,-19),new Vector2(265,16),NativeUI.Accent);
            NativeUI.TextAt(roomsPanel,"Açık odalar",25,new Vector2(0,1),new Vector2(151,-45),new Vector2(275,32),NativeUI.Paper,TextAnchor.MiddleLeft,true);
            NativeUI.TextAt(roomsPanel,"ODA / HARİTA                                    OYUNCU",8,new Vector2(.5f,1),new Vector2(0,-71),new Vector2(324,18),NativeUI.Muted);
            var viewport=NativeUI.Panel(roomsPanel,"Rooms",Color.clear);NativeUI.Place(viewport,new Vector2(.5f,1),new Vector2(0,-155),new Vector2(324,150));viewport.GetComponent<Image>().raycastTarget=true;viewport.gameObject.AddComponent<RectMask2D>();
            roomList=NativeUI.Panel(viewport,"Content",Color.clear);roomList.anchorMin=new Vector2(0,1);roomList.anchorMax=new Vector2(1,1);roomList.pivot=new Vector2(.5f,1);
            var scroll=viewport.gameObject.AddComponent<ScrollRect>();scroll.viewport=viewport;scroll.content=roomList;scroll.horizontal=false;scroll.movementType=ScrollRect.MovementType.Clamped;
            password=NativeUI.Field(roomsPanel,"",new Vector2(0,-249),64);((RectTransform)password.transform).sizeDelta=new Vector2(318,30);password.contentType=InputField.ContentType.Password;password.textComponent.fontSize=13;
            var placeholder=NativeUI.Label(password.transform,"Şifreli oda için şifre · Diğer odalarda boş bırak",10);placeholder.alignment=TextAnchor.MiddleLeft;placeholder.color=NativeUI.Muted;password.placeholder=placeholder;
            NativeUI.TextAt(lobby,"7 HARİTA  /  9 SİLAH     •     TAKIM SAVAŞI / RAUND",8,new Vector2(0,0),new Vector2(250,15),new Vector2(440,18),NativeUI.Muted);
            var privacy=NativeUI.Button(lobby,"GİZLİLİK / DESTEK",()=>Application.OpenURL(DefaultServer+"/privacy.html"));NativeUI.Place((RectTransform)privacy.transform,new Vector2(1,0),new Vector2(-100,16),new Vector2(150,24));
            pause=Modal("MAÇA GERİ DÖN",new Vector2(360,315));
            MenuButton(pause,"OYUNA DÖN",65,()=>SetPaused(false));MenuButton(pause,"SİLAH SATIN AL",112,OpenShop);MenuButton(pause,"SKOR TABLOSU",159,OpenScore);
            MenuButton(pause,"OYUN AYARLARI",206,OpenSettings);
            MenuButton(pause,"ODADAN AYRIL",253,()=>{Send(new Command{type="leave"});Leave();});pause.gameObject.SetActive(false);
            score=Modal("CANLI SKOR",new Vector2(490,350));MenuButton(score,"OYUNA DÖN",310,()=>{score.gameObject.SetActive(false);SetPaused(false);});score.gameObject.SetActive(false);
            shop=Modal("ÜS / TEÇHİZAT",new Vector2(490,350));int n=0;
            foreach(var w in data.weapons.Where(w=>w.price>0)){var captured=w.id;var b=NativeUI.Button(shop,w.name+" · $"+w.price,()=>Send(new Command{type="buy",item=captured}));NativeUI.Place((RectTransform)b.transform,new Vector2(.5f,1),new Vector2(n%2==0?-115:115,-65-(n/2)*49),new Vector2(218,42));n++;}
            var armor=NativeUI.Button(shop,"ZIRH · $650",()=>Send(new Command{type="buy",item="armor"}));NativeUI.Place((RectTransform)armor.transform,new Vector2(.5f,1),new Vector2(115,-212),new Vector2(218,42));MenuButton(shop,"OYUNA DÖN",302,()=>{shop.gameObject.SetActive(false);SetPaused(false);});shop.gameObject.SetActive(false);
            settings=canvas.AddComponent<NativeSettings>();settings.Build(safeArea,controls,audio,()=>SetPaused(false));notice.transform.parent.SetAsLastSibling();
        }
        void ShowLobbyWorld()
        {var backdrop=data.maps.First(m=>m.id=="docks");world.Map(backdrop,view);view.fieldOfView=65;view.transform.position=WorldRenderer.Position(17,9,23);view.transform.LookAt(WorldRenderer.Position(0,2,0));}
#if UNITY_EDITOR
        public void PreviewStage(bool playing)
        {
            lobby.gameObject.SetActive(!playing);gameHud.Show(playing);controls.SetGameplay(playing);settings.Show(false);pause.gameObject.SetActive(false);score.gameObject.SetActive(false);shop.gameObject.SetActive(false);
            Rooms(new[]{new RoomInfo{id="demo-a",name="Doklar / Akşam Mücadelesi",map="docks",mode="tdm",players=6,maxPlayers=8},new RoomInfo{id="demo-b",name="Çöl Geçidi / Rekabetçi",map="dust2",mode="rounds",players=8,maxPlayers=12},new RoomInfo{id="demo-c",name="Takım Antrenmanı",map="city",mode="bomb",players=4,maxPlayers=8,locked=true}});
            network.text="● SUNUCU ÇEVRİMİÇİ";nickname.text="Oyuncu";
            if(!playing){world.Clear();crosshair.gameObject.SetActive(false);ShowLobbyWorld();return;}
            lobby.gameObject.SetActive(false);notice.text="";id="preview";selected="rifle";map=data.maps.First(m=>m.id=="docks");room=new RoomInfo{id="visual-only",name="Doklar",mode="tdm"};
            own=new PlayerState{id=id,name="Oyuncu",x=8,y=0,z=22,yaw=.31,hp=85,armor=78,ammo=23,reserve=90,money=2300,weapon="rifle",primary="rifle",secondary="pistol",grenades=3,medkits=1,utility=new UtilityState{he=1,smoke=1,flash=1},team="blue"};
            snapshot=new Envelope{map="docks",mode="tdm",remaining=387,scores=new Scores{blue=12,orange=9},players=new[]{own,new PlayerState{id="ally",name="Takım arkadaşı",x=5,y=0,z=10,yaw=0,hp=100,team="blue",weapon="rifle"},new PlayerState{id="enemy",name="Rakip",x=15,y=0,z=-6,yaw=Math.PI,hp=100,team="orange",weapon="rifle"}}};
            world.Map(map,view);world.Players(snapshot,id);controls.SetGameplay(true);controls.Context(own,false,false);crosshair.gameObject.SetActive(true);gameHud.Show(true);gameHud.State(snapshot,own,"AK-47",false,false);
            view.fieldOfView=NativeSettings.FieldOfView;view.transform.SetPositionAndRotation(WorldRenderer.Position(own.x,Movement.Eye(own),own.z),WorldRenderer.Rotation(own.yaw,own.pitch));world.Gun(view,"rifle",true,0);
        }
        public void PreviewOverlay(string name)
        {
            if(name=="settings"){settings.Show(true);controls.SetGameplay(false);}
            if(name=="shop"){own.canBuy=true;OpenShop();}
            if(name=="equipment"){safeArea.Find("Touch controls/Equipment tray").gameObject.SetActive(true);}
            if(name=="aim"){controls.Aim=1;controls.Context(own,false,false);view.fieldOfView=(float)(2*Math.Atan(Math.Tan(NativeSettings.FieldOfView*Math.PI/360)*.74)*180/Math.PI);world.Gun(view,"rifle",true,0,0,0,true);}
            if(name=="scope"){selected=own.weapon="awp";own.ammo=10;own.reserve=30;controls.Context(own,false,false);controls.Aim=2;controls.Context(own,false,false);gameHud.State(snapshot,own,"AWP",true,false);crosshair.gameObject.SetActive(false);view.fieldOfView=(float)(2*Math.Atan(Math.Tan(NativeSettings.FieldOfView*Math.PI/360)/8)*180/Math.PI);world.Gun(view,"awp",false,0);}
        }
#endif
    }
}
