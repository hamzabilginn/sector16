using System;
using System.IO;
using System.Linq;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using Sector16;

class Fixture
{ public string map,scenario;public Body initial;public InputFrame[] frames;public Checkpoint[] checkpoints; }
class Checkpoint { public int step;public Body body; }
static class CoreChecks
{
    static readonly JsonSerializerOptions Options=new JsonSerializerOptions{IncludeFields=true};
    static void Check(bool value,string message){if(!value)throw new Exception(message);}
    static string Json(object value)=>JsonSerializer.Serialize(value,value.GetType(),Options);
    static async Task<Envelope> Wait(GameSocket socket,Func<Envelope,bool> predicate)
    {
        var until=DateTime.UtcNow.AddSeconds(12);
        while(DateTime.UtcNow<until)
        {
            while(socket.TryReceive(out var json)){var m=JsonSerializer.Deserialize<Envelope>(json,Options);if(predicate(m))return m;}
            if(socket.Error!=null)throw new Exception(socket.Error);
            await Task.Delay(10);
        }
        throw new TimeoutException("Native socket response timeout.");
    }
    static async Task Main()
    {
        var world=JsonSerializer.Deserialize<WorldData>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"world.json")),Options);
        var fixtures=JsonSerializer.Deserialize<Fixture[]>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"movement-fixtures.json")),Options);
        int compared=0;
        foreach(var fixture in fixtures)
        {
            var body=fixture.initial.Copy();var map=world.maps.Single(m=>m.id==fixture.map);
            for(int n=0;n<fixture.frames.Length;n++)
            {
                Movement.Simulate(body,fixture.frames[n],map);
                var c=fixture.checkpoints.FirstOrDefault(x=>x.step==n+1);if(c==null)continue;
                foreach(var field in typeof(Body).GetFields())
                {
                    if(field.FieldType==typeof(double))Check(Math.Abs((double)field.GetValue(body)-(double)field.GetValue(c.body))<1e-8,$"{fixture.map}/{fixture.scenario} step {n+1} {field.Name}");
                    else Check(field.GetValue(body).Equals(field.GetValue(c.body)),fixture.scenario+" "+field.Name);
                }
                compared++;
            }
        }
        Console.WriteLine($"PASS: {fixtures.Length} C#/server trajectories, {compared} checkpoints, all body fields within 1e-8.");
        Check(GameSocket.Endpoint("https://example.com").AbsoluteUri=="wss://example.com/ws","WSS origin");
        Check(GameSocket.Endpoint("http://127.0.0.1:31819").AbsoluteUri=="ws://127.0.0.1:31819/ws","Local origin");
        foreach(var url in new[]{"http://example.com","https://u:p@example.com","https://example.com/path","https://example.com?x=1"})
        {bool rejected=false;try{GameSocket.Endpoint(url);}catch(ArgumentException){rejected=true;}Check(rejected,"Insecure/invalid origin accepted");}

        // Start an isolated local instance of the unchanged production server.
        string root=Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,"../../../../../"));
        var start=new ProcessStartInfo("node","server/index.mjs"){WorkingDirectory=root,UseShellExecute=false,RedirectStandardOutput=true,RedirectStandardError=true,CreateNoWindow=true};
        start.Environment["HOST"]="127.0.0.1";start.Environment["PORT"]="31819";
        using(var server=Process.Start(start))
        {
            try
            {
                var ready=await server.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(12));Check(ready?.Contains("ready")==true,"Server failed to start");
                using(var native=new GameSocket())using(var web=new GameSocket())
                {
                    _=native.ConnectAsync("http://127.0.0.1:31819");_=web.ConnectAsync("http://127.0.0.1:31819");
                    var hello=await Wait(native,m=>m.type=="hello");var webHello=await Wait(web,m=>m.type=="hello");
                    native.Send(Json(new Command{type="create",nickname="Native QA",name="Native crossplay QA",team="blue",map="docks",mode="tdm"}));
                    var joined=await Wait(native,m=>m.type=="joined");
                    web.Send(Json(new Command{type="join",nickname="Web protocol QA",room=joined.room.id,team="orange"}));
                    var peer=await Wait(web,m=>m.type=="joined");Check(joined.room.id==peer.room.id,"Same room");
                    var state=await Wait(native,m=>m.type=="state"&&m.players?.Length==2);
                    Check(state.players.Any(p=>p.id==webHello.id),"Native sees web player");
                    state=await Wait(web,m=>m.type=="state"&&m.players?.Any(p=>p.id==hello.id)==true);
                    var initial=state.players.Single(p=>p.id==hello.id);long seq=0;
                    for(int n=0;n<30;n++)
                    {
                        native.Send(Json(new InputMessage{inputs=new[]{new InputFrame{seq=++seq,x=0,z=-1,yaw=initial.yaw,pitch=0,sprint=true},new InputFrame{seq=++seq,x=0,z=-1,yaw=initial.yaw,pitch=0,sprint=true}}}));
                        await Task.Delay(34);
                    }
                    var moved=await Wait(web,m=>m.type=="state"&&m.players.Any(p=>p.id==hello.id&&p.ack>=58));
                    var p=moved.players.Single(p=>p.id==hello.id);Check(Math.Abs(p.z-initial.z)>.5,"Native input changes authoritative position seen by web peer");
                    Check(Math.Abs(p.pitch)<1e-9,"Pitch wire format");
                    native.Send(Json(new InputMessage{inputs=new[]{new InputFrame{seq=++seq,yaw=initial.yaw,pitch=0,fire=true},new InputFrame{seq=++seq,yaw=initial.yaw,pitch=0,fire=true}}}));
                    await Wait(web,m=>m.type=="shot"&&m.id==hello.id);
                    native.Send(Json(new InputMessage{inputs=new[]{new InputFrame{seq=++seq,yaw=initial.yaw,pitch=0}}}));
                    native.Send(Json(new Command{type="leave"}));await Wait(native,m=>m.type=="left");
                    await Wait(web,m=>m.type=="state"&&m.players.Length==1);
                    Console.WriteLine("PASS: two native C# sockets use existing web protocol: create/join same room, shared snapshots, authoritative movement/ack, shot, leave.");
                }
            }
            finally{if(!server.HasExited){server.Kill(true);await server.WaitForExitAsync();}}
        }
    }
}
