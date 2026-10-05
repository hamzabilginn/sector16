using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Sector16
{
    // Native iOS/Android transport. No browser, AWS credentials or third-party relay.
    public sealed class GameSocket : IDisposable
    {
        const int MaxIncomingBytes=1024*1024,MaxQueuedMessages=512;
        readonly ClientWebSocket socket=new ClientWebSocket();
        readonly CancellationTokenSource cancel=new CancellationTokenSource();
        readonly ConcurrentQueue<string> outgoing=new ConcurrentQueue<string>();
        readonly ConcurrentQueue<string> incoming=new ConcurrentQueue<string>();
        readonly SemaphoreSlim wake=new SemaphoreSlim(0);
        Task completion;
        bool disposed;
        public bool IsOpen => socket.State==WebSocketState.Open&&!disposed;
        public string Error {get;private set;}
        public bool TryReceive(out string json)=>incoming.TryDequeue(out json);
        public static Uri Endpoint(string origin)
        {
            var uri=new Uri(origin);
            if(!string.IsNullOrEmpty(uri.UserInfo)||!string.IsNullOrEmpty(uri.Query)||!string.IsNullOrEmpty(uri.Fragment)||uri.AbsolutePath!="/")throw new ArgumentException("Use only a server origin without credentials, path or query.");
            bool local=uri.IsLoopback;
            if(uri.Scheme!="https"&&!(local&&uri.Scheme=="http"))throw new ArgumentException("HTTPS is required outside local development.");
            var result=new UriBuilder(uri){Scheme=uri.Scheme=="https"?"wss":"ws",Path="/ws"};
            if(uri.IsDefaultPort)result.Port=-1;
            return result.Uri;
        }
        public Task ConnectAsync(string origin)
        {
            if(completion!=null)throw new InvalidOperationException("Create a new socket to reconnect.");
            completion=RunAsync(Endpoint(origin));return completion;
        }
        public bool Send(string json)
        {
            if(!IsOpen||Encoding.UTF8.GetByteCount(json)>16384)return false;
            if(outgoing.Count>=MaxQueuedMessages){Fail("Network send queue is full.");return false;}
            outgoing.Enqueue(json);wake.Release();return true;
        }
        void Fail(string message){Error=message;cancel.Cancel();socket.Abort();}
        async Task RunAsync(Uri endpoint)
        {
            try
            {
                socket.Options.KeepAliveInterval=TimeSpan.FromSeconds(15);
                using(var timeout=CancellationTokenSource.CreateLinkedTokenSource(cancel.Token))
                {timeout.CancelAfter(TimeSpan.FromSeconds(12));await socket.ConnectAsync(endpoint,timeout.Token).ConfigureAwait(false);}
                var receive=ReceiveAsync();var send=SendAsync();
                await Task.WhenAny(receive,send).ConfigureAwait(false);
                cancel.Cancel();socket.Abort();
                await Task.WhenAll(receive,send).ConfigureAwait(false);
            }
            catch(OperationCanceledException){if(!disposed&&Error==null)Error="Connection timed out or closed.";}
            catch(Exception ex){if(!disposed)Error=ex.Message;}
            finally{if(!disposed&&Error==null)Error="Disconnected from server.";}
        }
        async Task SendAsync()
        {
            while(!cancel.IsCancellationRequested)
            {
                await wake.WaitAsync(cancel.Token).ConfigureAwait(false);
                while(outgoing.TryDequeue(out var text))
                {
                    var bytes=Encoding.UTF8.GetBytes(text);
                    await socket.SendAsync(new ArraySegment<byte>(bytes),WebSocketMessageType.Text,true,cancel.Token).ConfigureAwait(false);
                }
            }
        }
        async Task ReceiveAsync()
        {
            var bytes=new byte[16384];
            while(!cancel.IsCancellationRequested)
            {
                using(var message=new MemoryStream())
                {
                    WebSocketReceiveResult result;
                    do
                    {
                        result=await socket.ReceiveAsync(new ArraySegment<byte>(bytes),cancel.Token).ConfigureAwait(false);
                        if(result.MessageType==WebSocketMessageType.Close)return;
                        if(result.MessageType!=WebSocketMessageType.Text)throw new IOException("Unexpected binary game message.");
                        if(message.Length+result.Count>MaxIncomingBytes)throw new IOException("Game message too large.");
                        message.Write(bytes,0,result.Count);
                    }while(!result.EndOfMessage);
                    if(incoming.Count>=MaxQueuedMessages)throw new IOException("Network receive queue is full.");
                    incoming.Enqueue(Encoding.UTF8.GetString(message.ToArray()));
                }
            }
        }
        public void Dispose()
        {
            if(disposed)return;disposed=true;cancel.Cancel();socket.Abort();
            // The async loops own their synchronization resources until they stop.
            if(completion==null){socket.Dispose();cancel.Dispose();wake.Dispose();}
            else _=completion.ContinueWith(_=>{socket.Dispose();cancel.Dispose();wake.Dispose();},TaskScheduler.Default);
        }
    }
}
