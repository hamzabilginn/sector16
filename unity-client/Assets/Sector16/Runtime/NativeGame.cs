using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;

namespace Sector16
{
    public sealed partial class NativeGame : MonoBehaviour
    {
        public const string DefaultServer="https://sector16.18.185.7.35.sslip.io";
        public const string PresentationRevision="mobile-joystick-fix-20261005";
        GameSocket socket;
        WorldData data;
        WorldRenderer world;
        NativeControls controls;
        Camera view;
        RectTransform safeArea,lobby,pause,score,shop,roomList;
        InputField nickname,password;
        Text network,notice,crosshair;
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
        NativeHud gameHud;
        NativeAudio audio;
        NativeSettings settings;
        bool wasReloading;
#if UNITY_EDITOR
        public static bool VisualPreview;
#endif

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Bootstrap()
        {if(FindAnyObjectByType<NativeGame>()==null)new GameObject("Sector 16").AddComponent<NativeGame>();}
        void Awake()=>Initialize();
        public void Initialize()
        {
            if(view!=null)return;
            Application.targetFrameRate=60;QualitySettings.vSyncCount=0;
            Screen.autorotateToPortrait=false;Screen.autorotateToPortraitUpsideDown=false;Screen.autorotateToLandscapeLeft=true;Screen.autorotateToLandscapeRight=true;Screen.orientation=ScreenOrientation.AutoRotation;Screen.sleepTimeout=SleepTimeout.NeverSleep;
            var asset=Resources.Load<TextAsset>("world");
            if(asset==null)throw new InvalidOperationException("Export world data before building the native client.");
            data=JsonUtility.FromJson<WorldData>(asset.text);
            serverOrigin=DefaultServer;
            var args=Environment.GetCommandLineArgs();
            for(int i=0;i<args.Length-1;i++)if(args[i]=="--sector16-server")serverOrigin=args[i+1];
            GameSocket.Endpoint(serverOrigin);
            world=gameObject.AddComponent<WorldRenderer>();controls=gameObject.AddComponent<NativeControls>();audio=gameObject.AddComponent<NativeAudio>();audio.Initialize();
            view=new GameObject("Game camera",typeof(Camera),typeof(AudioListener)).GetComponent<Camera>();view.nearClipPlane=.05f;view.farClipPlane=220;view.fieldOfView=78;
            NativeSettings.ApplyQuality();
            var light=new GameObject("Sun",typeof(Light)).GetComponent<Light>();light.type=LightType.Directional;light.intensity=1.1f;light.transform.rotation=Quaternion.Euler(45,-25,0);light.shadows=LightShadows.Hard;light.shadowStrength=.65f;
            if(FindAnyObjectByType<EventSystem>()==null)new GameObject("Input",typeof(EventSystem),typeof(InputSystemUIInputModule));
            BuildUI();ApplySafeArea();ShowLobbyWorld();
#if UNITY_EDITOR
            if(VisualPreview)return;
#endif
            Connect();
        }
        RectTransform Modal(string title,Vector2 size)
        {var rect=NativeUI.Panel(safeArea,title,new Color(.035f,.065f,.08f,.98f));NativeUI.Rounded(rect);NativeUI.Border(rect,new Color(.65f,.75f,.77f,.24f));NativeUI.Place(rect,new Vector2(.5f,.5f),Vector2.zero,size);rect.GetComponent<Image>().raycastTarget=true;var text=NativeUI.Label(rect,title,25);text.font=NativeUI.Heading;NativeUI.Place((RectTransform)text.transform,new Vector2(.5f,1),new Vector2(0,-25),new Vector2(size.x-20,40));return rect;}
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
            rooms=list??Array.Empty<RoomInfo>();for(int n=roomList.childCount-1;n>=0;n--)WorldRenderer.Release(roomList.GetChild(n).gameObject);
            roomList.sizeDelta=new Vector2(0,Mathf.Max(167,rooms.Length*48));roomList.anchoredPosition=Vector2.zero;
            for(int n=0;n<rooms.Length;n++)
            {var r=rooms[n];var button=NativeUI.Button(roomList,"",()=>Join("join",r.id));NativeUI.Place((RectTransform)button.transform,new Vector2(.5f,1),new Vector2(0,-24-n*48),new Vector2(320,44));NativeUI.TextAt(button.transform,r.name,14,new Vector2(0,.5f),new Vector2(115,8),new Vector2(215,20),NativeUI.Paper,TextAnchor.MiddleLeft,true);NativeUI.TextAt(button.transform,(r.map??r.mapId)+"  /  "+r.mode,9,new Vector2(0,.5f),new Vector2(115,-10),new Vector2(215,14),NativeUI.Muted);NativeUI.TextAt(button.transform,r.players+"/"+r.maxPlayers+(r.locked?"  KİLİTLİ":"  GİR"),11,new Vector2(1,.5f),new Vector2(-44,0),new Vector2(80,32),NativeUI.Accent,TextAnchor.MiddleCenter,true);}
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
                case "shot":world.Shot(m);audio.Shot(m,m.id==id);if(m.id==id)Recoil();break;
                case "hit":gameHud.Hit(m.head,m.kill);audio.Hit();break;
                case "hurt":gameHud.Hurt();audio.Hurt();break;
                case "flash":gameHud.Flash((float)m.duration/1000);break;
                case "explosion":audio.Explosion(m.position);break;
                case "pong":Send(new Command{type="latency",ms=Math.Max(0,DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()-m.t)});break;
            }
        }
        void State(Envelope message)
        {
            if(room==null)return;var self=Array.Find(message.players??Array.Empty<PlayerState>(),p=>p.id==id);if(self==null)return;
            snapshot=message;own=self;lastSnapshot=Time.realtimeSinceStartup;
            if(self.reload>0&&!wasReloading)audio.Reload();wasReloading=self.reload>0;
            var next=data.maps.FirstOrDefault(m=>m.id==message.map);
            if(next==null){SetPaused(true);Notify("Bu harita istemci verisinde yok.");return;}
            if(map!=next){map=next;world.Map(map,view);pending.Clear();batch.Clear();}
            if(generation!=self.generation){generation=self.generation;pending.Clear();batch.Clear();selected=self.weapon;controls.Reset();controls.Yaw=self.yaw;controls.Pitch=self.pitch;recoilIndex=0;}
            pending.RemoveAll(i=>i.seq<=self.ack);predicted.Restore(self);
            if(CanMove())foreach(var i in pending)Movement.Simulate(predicted,i,map);
            controls.Context(self,message.mode=="bomb",self.hp<=0&&RoundMode());world.Players(message,id);
            if(!paused&&self.hp>0&&self.ammo==0&&self.reserve>0&&self.reload<=0&&self.weapon!="knife")controls.RequestReload();
        }
        bool RoundMode()=>snapshot!=null&&(snapshot.mode=="rounds"||snapshot.mode=="bomb"||snapshot.mode=="elimination");
        bool CanMove()=>own!=null&&own.hp>0&&snapshot.restart<=0&&(!RoundMode()||snapshot.phase=="live");
        void Recoil()
        {
            if(Time.realtimeSinceStartup-lastRecoil<.04f)return; // Shotgun pellets represent one trigger pull.
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
        void TogglePause(){if(room==null)return;settings.Show(false);score.gameObject.SetActive(false);shop.gameObject.SetActive(false);SetPaused(!paused);}
        void OpenScore()
        {
            if(room==null)return;shop.gameObject.SetActive(false);SetPaused(true);pause.gameObject.SetActive(false);score.gameObject.SetActive(true);
            var old=score.Find("Rows");if(old!=null)Destroy(old.gameObject);
            var rows=NativeUI.Panel(score,"Rows",Color.clear);NativeUI.Place(rows,new Vector2(.5f,1),new Vector2(0,-170),new Vector2(460,240));
            NativeUI.Label(rows,string.Join("\n",(snapshot?.players??Array.Empty<PlayerState>()).Select(p=>p.team+" · "+p.name+"    "+p.kills+" / "+p.deaths)),13);
        }
        void OpenShop()
        {if(own?.canBuy!=true){Notify("Satın almak için takımının üssüne dön.");return;}score.gameObject.SetActive(false);SetPaused(true);pause.gameObject.SetActive(false);shop.gameObject.SetActive(true);}
        void OpenSettings(){if(room==null)return;shop.gameObject.SetActive(false);score.gameObject.SetActive(false);SetPaused(true);pause.gameObject.SetActive(false);settings.Show(true);}
        void Leave()
        {room=null;own=null;snapshot=null;map=null;wasReloading=false;pending.Clear();batch.Clear();controls?.SetGameplay(false);world?.Clear();if(lobby!=null)lobby.gameObject.SetActive(true);if(pause!=null)pause.gameObject.SetActive(false);if(shop!=null)shop.gameObject.SetActive(false);if(score!=null)score.gameObject.SetActive(false);settings?.Show(false);Cursor.lockState=CursorLockMode.None;Cursor.visible=true;if(view!=null&&data!=null)ShowLobbyWorld();}
        void Notify(string text){notice.text=text;noticeUntil=Time.realtimeSinceStartup+4;}
        void ApplySafeArea()
        {var rect=Screen.safeArea;if(rect==lastSafe||rect.width<=0||Screen.width<=0||Screen.height<=0)return;lastSafe=rect;var scaler=safeArea.GetComponentInParent<CanvasScaler>();scaler.referenceResolution=new Vector2(844*Screen.width/rect.width,390);safeArea.anchorMin=new Vector2(rect.xMin/Screen.width,rect.yMin/Screen.height);safeArea.anchorMax=new Vector2(rect.xMax/Screen.width,rect.yMax/Screen.height);safeArea.offsetMin=safeArea.offsetMax=Vector2.zero;controls.Reset();}
        void Update()
        {
            ApplySafeArea();int received=0;
            while(socket!=null&&socket.TryReceive(out var json)&&received++<100)
            {try{Receive(JsonUtility.FromJson<Envelope>(json));}catch(Exception ex){SetPaused(true);Notify("Sunucu mesajı okunamadı.");Debug.LogException(ex);}}
            if(socket!=null&&!socket.IsOpen&&socket.Error!=null&&(connecting||hadConnection)){connecting=hadConnection=false;Leave();network.text="BAĞLANTI KESİLDİ";Notify("Yeniden bağlan düğmesine dokun.");}
            if(socket?.IsOpen==true&&Time.realtimeSinceStartup-lastPing>2){lastPing=Time.realtimeSinceStartup;Send(new Command{type="ping",t=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()});}
            if(Time.realtimeSinceStartup>noticeUntil)notice.text="";
            if(room==null||own==null||map==null){gameHud.Show(false);crosshair.gameObject.SetActive(false);return;}
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
            var fov=(float)(2*Math.Atan(Math.Tan(NativeSettings.FieldOfView*Math.PI/360)/magnification)*180/Math.PI);
            view.fieldOfView=Mathf.Lerp(view.fieldOfView,fov,1-Mathf.Exp(-Time.deltaTime*14));gunKick=Mathf.Max(0,gunKick-Time.deltaTime*7);var definition=data.weapons.FirstOrDefault(w=>w.id==selected);world.Gun(view,selected,own.hp>0&&!(selected=="awp"&&controls.Aim>0),gunKick,(float)Math.Sqrt(own.vx*own.vx+own.vz*own.vz),own.reload>0&&definition!=null?1-(float)(own.reload/definition.reload):0,controls.Aim>0);
            crosshair.gameObject.SetActive(!paused&&own.hp>0&&!(controls.Aim>0&&selected=="awp"));gameHud.Show(true);gameHud.State(snapshot,own,definition?.name??selected,controls.Aim>0&&selected=="awp",paused);
            audio.Step(own,!paused);
        }
        void OnApplicationPause(bool value){if(value&&room!=null)SetPaused(true);}
        void OnApplicationFocus(bool value){if(!value&&room!=null)SetPaused(true);}
        void OnDestroy(){socket?.Dispose();Cursor.lockState=CursorLockMode.None;}
    }
}
