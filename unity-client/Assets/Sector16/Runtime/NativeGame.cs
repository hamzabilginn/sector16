using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;

namespace Sector16
{
    public sealed class NativeGame : MonoBehaviour
    {
        public const string DefaultServer="https://sector16.18.185.7.35.sslip.io";
        GameSocket socket;
        WorldData data;
        WorldRenderer world;
        NativeControls controls;
        Camera view;
        RectTransform safeArea,lobby,pause,score,shop,roomList;
        InputField nickname,password;
        Text network,hud,notice,crosshair;
        PlayerState own;
        RoomInfo room;
        RoomInfo[] rooms=Array.Empty<RoomInfo>();
        Envelope snapshot;
        MapData map;
        readonly Body predicted=new Body();
        readonly List<InputFrame> pending=new List<InputFrame>(),batch=new List<InputFrame>();
        string id,selected="rifle",serverOrigin;
        long sequence;
        int generation=-1;
        bool paused=true,connecting,hadConnection;
        double accumulator;
        float lastSnapshot,lastPing,noticeUntil,lastRecoil;
        int recoilIndex;
        float gunKick;
        Rect lastSafe;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Bootstrap()
        {if(FindFirstObjectByType<NativeGame>()==null)new GameObject("Sector 16").AddComponent<NativeGame>();}
        void Awake()
        {
            Application.targetFrameRate=60;QualitySettings.vSyncCount=0;
            Screen.orientation=ScreenOrientation.LandscapeLeft;Screen.sleepTimeout=SleepTimeout.NeverSleep;
            var asset=Resources.Load<TextAsset>("world");
            if(asset==null)throw new InvalidOperationException("Export world data before building the native client.");
            data=JsonUtility.FromJson<WorldData>(asset.text);
            serverOrigin=DefaultServer;
            var args=Environment.GetCommandLineArgs();
            for(int i=0;i<args.Length-1;i++)if(args[i]=="--sector16-server")serverOrigin=args[i+1];
            GameSocket.Endpoint(serverOrigin);
            world=gameObject.AddComponent<WorldRenderer>();controls=gameObject.AddComponent<NativeControls>();
            view=new GameObject("Game camera",typeof(Camera),typeof(AudioListener)).GetComponent<Camera>();view.nearClipPlane=.05f;view.farClipPlane=220;view.fieldOfView=78;
            var light=new GameObject("Sun",typeof(Light)).GetComponent<Light>();light.type=LightType.Directional;light.intensity=1.1f;light.transform.rotation=Quaternion.Euler(45,-25,0);light.shadows=LightShadows.None;
            if(FindFirstObjectByType<EventSystem>()==null)new GameObject("Input",typeof(EventSystem),typeof(InputSystemUIInputModule));
            BuildUI();ApplySafeArea();Connect();
        }
        void BuildUI()
        {
            var canvas=new GameObject("Native UI",typeof(RectTransform),typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster));canvas.GetComponent<Canvas>().renderMode=RenderMode.ScreenSpaceOverlay;
            var scaler=canvas.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(844,390);scaler.matchWidthOrHeight=.5f;
            safeArea=NativeUI.Panel(canvas.transform,"Safe area",Color.clear);
            controls.Pause=()=>SetPaused(true);controls.Score=OpenScore;controls.Shop=OpenShop;controls.Weapon=CycleWeapon;controls.Grenade=()=>Send(new Command{type="grenade",kind="he"});controls.Medkit=()=>Send(new Command{type="medkit"});
            controls.Sensitivity=PlayerPrefs.GetFloat("s16.native.sensitivity",1);controls.Build(safeArea);
            var hp=NativeUI.Panel(safeArea,"HUD",Color.clear);NativeUI.Place(hp,new Vector2(.5f,0),new Vector2(0,32),new Vector2(280,54));hud=NativeUI.Label(hp,"",14);
            var aim=NativeUI.Panel(safeArea,"Crosshair",Color.clear);NativeUI.Place(aim,new Vector2(.5f,.5f),Vector2.zero,new Vector2(44,44));crosshair=NativeUI.Label(aim,"+",24);
            var info=NativeUI.Panel(safeArea,"Status",Color.clear);NativeUI.Place(info,new Vector2(.5f,1),new Vector2(0,-28),new Vector2(260,50));network=NativeUI.Label(info,"Sunucuya bağlanılıyor…",13);
            var toast=NativeUI.Panel(safeArea,"Notice",Color.clear);NativeUI.Place(toast,new Vector2(.5f,.7f),Vector2.zero,new Vector2(450,48));notice=NativeUI.Label(toast,"",16);
            lobby=Modal("SECTOR 16",new Vector2(510,350));
            nickname=NativeUI.Field(lobby,PlayerPrefs.GetString("s16.native.nickname","Oyuncu"),new Vector2(-60,-60));((RectTransform)nickname.transform).sizeDelta=new Vector2(245,42);
            var training=NativeUI.Button(lobby,"ANTRENMAN",()=>Join("training"));NativeUI.Place((RectTransform)training.transform,new Vector2(.5f,1),new Vector2(155,-60),new Vector2(140,42));
            password=NativeUI.Field(lobby,"",new Vector2(-60,-108),64);((RectTransform)password.transform).sizeDelta=new Vector2(245,36);password.contentType=InputField.ContentType.Password;
            var placeholder=NativeUI.Label(password.transform,"Şifreli oda için oda şifresi",12);placeholder.alignment=TextAnchor.MiddleLeft;password.placeholder=placeholder;
            var quick=NativeUI.Button(lobby,"HIZLI OYNA",()=>Join("quick"));NativeUI.Place((RectTransform)quick.transform,new Vector2(.5f,1),new Vector2(155,-108),new Vector2(140,36));
            var viewport=NativeUI.Panel(lobby,"Rooms",new Color(.04f,.08f,.1f,.6f));NativeUI.Place(viewport,new Vector2(.5f,1),new Vector2(0,-218),new Vector2(475,167));viewport.GetComponent<Image>().raycastTarget=true;viewport.gameObject.AddComponent<RectMask2D>();
            roomList=NativeUI.Panel(viewport,"Content",Color.clear);roomList.anchorMin=new Vector2(0,1);roomList.anchorMax=new Vector2(1,1);roomList.pivot=new Vector2(.5f,1);
            var scroll=viewport.gameObject.AddComponent<ScrollRect>();scroll.viewport=viewport;scroll.content=roomList;scroll.horizontal=false;scroll.movementType=ScrollRect.MovementType.Clamped;
            var connect=NativeUI.Button(lobby,"YENİDEN BAĞLAN",Connect);NativeUI.Place((RectTransform)connect.transform,new Vector2(.5f,0),new Vector2(-125,25),new Vector2(200,36));
            var create=NativeUI.Button(lobby,"BOTSIZ ODA KUR",()=>Join("create"));NativeUI.Place((RectTransform)create.transform,new Vector2(.5f,0),new Vector2(125,25),new Vector2(200,36));
            pause=Modal("OYUN DURAKLATILDI",new Vector2(380,315));
            MenuButton(pause,"OYUNA DÖN",65,()=>SetPaused(false));MenuButton(pause,"SİLAH SATIN AL",112,OpenShop);MenuButton(pause,"SKOR TABLOSU",159,OpenScore);
            MenuButton(pause,"HASSASİYET: "+controls.Sensitivity.ToString("0.0"),206,()=>{controls.Sensitivity=controls.Sensitivity>=2? .5f:controls.Sensitivity+.25f;PlayerPrefs.SetFloat("s16.native.sensitivity",controls.Sensitivity);Notify("Dokunma hassasiyeti: "+controls.Sensitivity.ToString("0.00"));});
            MenuButton(pause,"ODADAN AYRIL",253,()=>{Send(new Command{type="leave"});Leave();});pause.gameObject.SetActive(false);
            score=Modal("SKOR TABLOSU",new Vector2(490,350));MenuButton(score,"KAPAT",310,()=>{score.gameObject.SetActive(false);SetPaused(false);});score.gameObject.SetActive(false);
            shop=Modal("SİLAH SATIN AL",new Vector2(490,350));int n=0;
            foreach(var w in data.weapons.Where(w=>w.price>0))
            {var captured=w.id;var b=NativeUI.Button(shop,w.name+" · $"+w.price,()=>Send(new Command{type="buy",item=captured}));NativeUI.Place((RectTransform)b.transform,new Vector2(.5f,1),new Vector2(n%2==0?-115:115,-65-(n/2)*49),new Vector2(218,42));n++;}
            var armor=NativeUI.Button(shop,"ZIRH · $650",()=>Send(new Command{type="buy",item="armor"}));NativeUI.Place((RectTransform)armor.transform,new Vector2(.5f,1),new Vector2(115,-212),new Vector2(218,42));
            MenuButton(shop,"KAPAT",302,()=>{shop.gameObject.SetActive(false);SetPaused(false);});shop.gameObject.SetActive(false);
        }
        RectTransform Modal(string title,Vector2 size)
        {var rect=NativeUI.Panel(safeArea,title,new Color(.035f,.065f,.08f,.97f));NativeUI.Place(rect,new Vector2(.5f,.5f),Vector2.zero,size);rect.GetComponent<Image>().raycastTarget=true;var text=NativeUI.Label(rect,title,22);NativeUI.Place((RectTransform)text.transform,new Vector2(.5f,1),new Vector2(0,-25),new Vector2(size.x-20,40));return rect;}
        void MenuButton(RectTransform parent,string text,float y,Action action)
        {var button=NativeUI.Button(parent,text,action);NativeUI.Place((RectTransform)button.transform,new Vector2(.5f,1),new Vector2(0,-y),new Vector2(300,40));}
        void Connect()
        {
            socket?.Dispose();Leave();socket=new GameSocket();connecting=true;hadConnection=false;network.text="Sunucuya bağlanılıyor…";
            _=socket.ConnectAsync(serverOrigin);
        }
        bool Send(Command command)=>socket?.Send(JsonUtility.ToJson(command))==true;
        void Join(string type,string target=null)
        {
            if(socket?.IsOpen!=true){Notify("Önce sunucu bağlantısını bekle.");return;}
            var name=nickname.text.Trim();if(name.Length<2){Notify("En az 2 harfli oyuncu adı gir.");return;}PlayerPrefs.SetString("s16.native.nickname",name);
            Send(new Command{type=type,nickname=name,room=target,password=password.text,name=name+" · Mobil oda",team="auto",map="docks",mode="tdm"});
        }
        void Rooms(RoomInfo[] list)
        {
            rooms=list??Array.Empty<RoomInfo>();foreach(Transform child in roomList)Destroy(child.gameObject);
            roomList.sizeDelta=new Vector2(0,Mathf.Max(167,rooms.Length*48));roomList.anchoredPosition=Vector2.zero;
            for(int n=0;n<rooms.Length;n++)
            {var r=rooms[n];var button=NativeUI.Button(roomList,(r.locked?"[ŞİFRELİ] ":"")+r.name+" · "+r.players+"/"+r.maxPlayers+" · "+r.mode,()=>Join("join",r.id));NativeUI.Place((RectTransform)button.transform,new Vector2(.5f,1),new Vector2(0,-24-n*48),new Vector2(460,42));}
        }
        void Receive(Envelope m)
        {
            switch(m.type)
            {
                case "hello":id=m.id;connecting=false;hadConnection=true;network.text="SUNUCU ÇEVRİMİÇİ";Rooms(m.rooms);break;
                case "rooms":Rooms(m.rooms);break;
                case "joined":id=m.id;room=m.room;generation=-1;sequence=0;accumulator=0;pending.Clear();batch.Clear();lobby.gameObject.SetActive(false);score.gameObject.SetActive(false);shop.gameObject.SetActive(false);SetPaused(false);break;
                case "state":State(m);break;
                case "left":Leave();break;
                case "error":Notify(m.message);break;
                case "purchased":if(!string.IsNullOrEmpty(m.weapon))selected=m.weapon;break;
                case "kill":Notify(m.killer+" → "+m.victim);break;
                case "end":Notify("Maç tamamlandı: "+m.winner);break;
                case "shot":world.Shot(m);if(m.id==id)Recoil();break;
                case "pong":Send(new Command{type="latency",ms=Math.Max(0,DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()-m.t)});break;
            }
        }
        void State(Envelope message)
        {
            if(room==null)return;var self=Array.Find(message.players??Array.Empty<PlayerState>(),p=>p.id==id);if(self==null)return;
            snapshot=message;own=self;lastSnapshot=Time.realtimeSinceStartup;
            var next=data.maps.FirstOrDefault(m=>m.id==message.map);
            if(next==null){SetPaused(true);Notify("Bu harita istemci verisinde yok.");return;}
            if(map!=next){map=next;world.Map(map,view);pending.Clear();batch.Clear();}
            if(generation!=self.generation){generation=self.generation;pending.Clear();batch.Clear();selected=self.weapon;controls.Reset();controls.Yaw=self.yaw;controls.Pitch=self.pitch;recoilIndex=0;}
            pending.RemoveAll(i=>i.seq<=self.ack);predicted.Restore(self);
            if(CanMove())foreach(var i in pending)Movement.Simulate(predicted,i,map);
            controls.Context(self,message.mode=="bomb",self.hp<=0&&RoundMode());world.Players(message,id);
        }
        bool RoundMode()=>snapshot!=null&&(snapshot.mode=="rounds"||snapshot.mode=="bomb"||snapshot.mode=="elimination");
        bool CanMove()=>own!=null&&own.hp>0&&snapshot.restart<=0&&(!RoundMode()||snapshot.phase=="live");
        void Recoil()
        {
            var w=data.weapons.FirstOrDefault(x=>x.id==selected);if(w==null||w.melee)return;
            if(Time.realtimeSinceStartup-lastRecoil>.45f)recoilIndex=0;lastRecoil=Time.realtimeSinceStartup;
            if(w.pattern!=null&&w.pattern.Length>0){var p=w.pattern[recoilIndex++%w.pattern.Length];controls.Yaw+=p.x*w.kick;controls.Pitch=Movement.Clamp(controls.Pitch+p.y*w.kick,-1.45,1.45);}gunKick=1;
        }
        void CycleWeapon()
        {if(own==null||own.hp<=0)return;var choices=new[]{own.primary,own.secondary,"knife"}.Where(x=>!string.IsNullOrEmpty(x)).Distinct().ToArray();selected=choices[(Math.Max(0,Array.IndexOf(choices,selected))+1)%choices.Length];controls.Aim=0;}
        void SetPaused(bool value)
        {
            if(!value&&room!=null&&own!=null&&Time.realtimeSinceStartup-lastSnapshot>2){Notify("Güncel sunucu verisi bekleniyor.");return;}
            paused=value;controls.SetGameplay(room!=null&&!value);pause.gameObject.SetActive(room!=null&&value&&!score.gameObject.activeSelf&&!shop.gameObject.activeSelf);
            Cursor.lockState=!Application.isMobilePlatform&&room!=null&&!value?CursorLockMode.Locked:CursorLockMode.None;Cursor.visible=Cursor.lockState!=CursorLockMode.Locked;
        }
        void OpenScore()
        {
            if(room==null)return;shop.gameObject.SetActive(false);SetPaused(true);pause.gameObject.SetActive(false);score.gameObject.SetActive(true);
            var old=score.Find("Rows");if(old!=null)Destroy(old.gameObject);
            var rows=NativeUI.Panel(score,"Rows",Color.clear);NativeUI.Place(rows,new Vector2(.5f,1),new Vector2(0,-170),new Vector2(460,240));
            NativeUI.Label(rows,string.Join("\n",(snapshot?.players??Array.Empty<PlayerState>()).Select(p=>p.team+" · "+p.name+"    "+p.kills+" / "+p.deaths)),13);
        }
        void OpenShop()
        {if(own?.canBuy!=true){Notify("Satın almak için takımının üssüne dön.");return;}score.gameObject.SetActive(false);SetPaused(true);pause.gameObject.SetActive(false);shop.gameObject.SetActive(true);}
        void Leave()
        {room=null;own=null;snapshot=null;pending.Clear();batch.Clear();controls?.SetGameplay(false);world?.Clear();if(lobby!=null)lobby.gameObject.SetActive(true);if(pause!=null)pause.gameObject.SetActive(false);if(shop!=null)shop.gameObject.SetActive(false);if(score!=null)score.gameObject.SetActive(false);Cursor.lockState=CursorLockMode.None;Cursor.visible=true;}
        void Notify(string text){notice.text=text;noticeUntil=Time.realtimeSinceStartup+4;}
        void ApplySafeArea()
        {var rect=Screen.safeArea;if(rect==lastSafe)return;lastSafe=rect;safeArea.anchorMin=new Vector2(rect.xMin/Screen.width,rect.yMin/Screen.height);safeArea.anchorMax=new Vector2(rect.xMax/Screen.width,rect.yMax/Screen.height);safeArea.offsetMin=safeArea.offsetMax=Vector2.zero;controls.Reset();}
        void Update()
        {
            ApplySafeArea();int received=0;
            while(socket!=null&&socket.TryReceive(out var json)&&received++<100)
            {try{Receive(JsonUtility.FromJson<Envelope>(json));}catch(Exception ex){SetPaused(true);Notify("Sunucu mesajı okunamadı.");Debug.LogException(ex);}}
            if(socket!=null&&!socket.IsOpen&&socket.Error!=null&&(connecting||hadConnection)){connecting=hadConnection=false;Leave();network.text="BAĞLANTI KESİLDİ";Notify("Yeniden bağlan düğmesine dokun.");}
            if(socket?.IsOpen==true&&Time.realtimeSinceStartup-lastPing>2){lastPing=Time.realtimeSinceStartup;Send(new Command{type="ping",t=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()});}
            if(Time.realtimeSinceStartup>noticeUntil)notice.text="";
            if(room==null||own==null||map==null){hud.text="";crosshair.gameObject.SetActive(false);return;}
            if(!paused&&Time.realtimeSinceStartup-lastSnapshot>2){SetPaused(true);Notify("Bağlantı gecikti; sunucu verisi bekleniyor.");}
            accumulator+=Math.Min(Time.unscaledDeltaTime,.1f);int ticks=0;
            while(accumulator>=Movement.Tick&&ticks++<6)
            {
                var i=controls.Sample(++sequence,selected,!paused&&CanMove());
                if(CanMove()){Movement.Simulate(predicted,i,map);pending.Add(i);}batch.Add(i);accumulator-=Movement.Tick;
                if(batch.Count>=2){if(socket?.Send(JsonUtility.ToJson(new InputMessage{inputs=batch.ToArray()}))!=true)SetPaused(true);batch.Clear();}
                if(pending.Count>120){pending.Clear();SetPaused(true);Notify("Bağlantı gecikti.");}
            }
            view.transform.SetPositionAndRotation(WorldRenderer.Position(predicted.x,own.hp>0?Movement.Eye(predicted):predicted.y+.35,predicted.z),WorldRenderer.Rotation(controls.Yaw,controls.Pitch));
            if(own.hp<=0&&RoundMode())
            {var ally=snapshot.players.FirstOrDefault(p=>p.id!=id&&p.team==own.team&&p.hp>0);if(ally!=null)view.transform.SetPositionAndRotation(WorldRenderer.Position(ally.x,Movement.Eye(ally),ally.z),WorldRenderer.Rotation(ally.yaw,ally.pitch));}
            var magnification=controls.Aim==0?1:selected=="awp"?(controls.Aim==2?8:4):own.attachments?.Get(selected)?.scope==true?2:1/.74;
            var fov=(float)(2*Math.Atan(Math.Tan(78*Math.PI/360)/magnification)*180/Math.PI);
            view.fieldOfView=Mathf.Lerp(view.fieldOfView,fov,1-Mathf.Exp(-Time.deltaTime*14));gunKick=Mathf.Max(0,gunKick-Time.deltaTime*7);world.Gun(view,selected,own.hp>0&&controls.Aim==0,gunKick);
            crosshair.gameObject.SetActive(!paused&&own.hp>0);hud.text=$"SAĞLIK {own.hp}  •  ZIRH {own.armor}\n{selected}  {own.ammo}/{own.reserve}";
            network.text=$"MAVİ {snapshot.scores?.blue}  •  {Math.Floor(snapshot.remaining/60):00}:{Math.Floor(snapshot.remaining%60):00}  •  TURUNCU {snapshot.scores?.orange}";
        }
        void OnApplicationPause(bool value){if(value&&room!=null)SetPaused(true);}
        void OnApplicationFocus(bool value){if(!value&&room!=null)SetPaused(true);}
        void OnDestroy(){socket?.Dispose();Cursor.lockState=CursorLockMode.None;}
    }
}
