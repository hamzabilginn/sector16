using System;
using System.Collections.Generic;
using UnityEngine;
namespace Sector16
{
    // Small synthesized sounds: no external sound pack or runtime download is required.
    public sealed class NativeAudio : MonoBehaviour
    {
        readonly Dictionary<string,AudioClip> clips=new Dictionary<string,AudioClip>();
        readonly AudioSource[] voices=new AudioSource[12];
        int voice;
        float nextStep;
        readonly Dictionary<string,float> lastShots=new Dictionary<string,float>();
        public float Volume {get;set;}=1;
        public void Initialize()
        {
            Volume=PlayerPrefs.GetFloat("s16.native.volume",.8f);
            for(int i=0;i<voices.Length;i++){var obj=new GameObject("Game sound "+i);obj.transform.SetParent(transform,false);voices[i]=obj.AddComponent<AudioSource>();voices[i].playOnAwake=false;voices[i].minDistance=3;voices[i].maxDistance=55;voices[i].rolloffMode=AudioRolloffMode.Linear;}
            Add("rifle",.26f,110,22,.82f);Add("pistol",.19f,160,30,.7f);Add("heavy",.55f,70,13,.95f);Add("smg",.16f,180,32,.7f);
            Add("hit",.06f,1300,55,.13f);Add("hurt",.12f,95,20,.25f);Add("reload",.12f,730,35,.45f);Add("step",.085f,140,30,.23f);Add("knife",.15f,320,22,.5f);Add("explosion",.85f,55,8,1);
        }
        void Add(string id,float duration,float frequency,float decay,float noise)
        {
            const int rate=22050;var samples=new float[(int)(duration*rate)];var random=new System.Random(id.Length*31+(int)frequency);float smooth=0;
            for(int i=0;i<samples.Length;i++){float t=(float)i/rate;float n=(float)(random.NextDouble()*2-1);smooth=Mathf.Lerp(smooth,n,.15f);float envelope=Mathf.Exp(-t*decay)*Mathf.Min(t*2000,1);samples[i]=Mathf.Clamp((Mathf.Sin(t*frequency*Mathf.PI*2)*(1-noise)+n*noise*.65f+smooth*.45f)*envelope,-1,1);}
            var clip=AudioClip.Create("Sector16 "+id,samples.Length,1,rate,false);clip.SetData(samples,0);clips[id]=clip;
        }
        void Play(string id,float gain,bool spatial=false,Vector3 position=default)
        {
            if(Volume<=0||!clips.TryGetValue(id,out var clip))return;var source=voices[voice++%voices.Length];source.Stop();source.transform.position=position;source.spatialBlend=spatial?1:0;source.pitch=UnityEngine.Random.Range(.96f,1.04f);source.volume=Volume*gain;source.clip=clip;source.Play();
        }
        public void Shot(Envelope shot,bool own)
        {if(shot.id!=null){if(lastShots.TryGetValue(shot.id,out var last)&&Time.unscaledTime-last<.04f)return;lastShots[shot.id]=Time.unscaledTime;}var kind=shot.weapon=="awp"||shot.weapon=="shotgun"||shot.weapon=="deagle"?"heavy":shot.weapon=="pistol"?"pistol":shot.weapon=="smg"?"smg":shot.weapon=="knife"?"knife":"rifle";var p=shot.from;Play(kind,shot.suppressed?.18f:own?.6f:.8f,!own,p==null?Vector3.zero:WorldRenderer.Position(p.x,p.y,p.z));}
        public void Hit()=>Play("hit",.7f);
        public void Hurt()=>Play("hurt",.7f);
        public void Reload()=>Play("reload",.6f);
        public void Explosion(PointState point){if(point!=null)Play("explosion",.8f,true,WorldRenderer.Position(point.x,point.y,point.z));}
        public void Step(PlayerState own,bool active)
        {float speed=(float)Math.Sqrt(own.vx*own.vx+own.vz*own.vz);if(active&&own.hp>0&&own.ground&&speed>1&&Time.time>=nextStep){nextStep=Time.time+(speed>6?.28f:.4f);Play("step",own.crouch?.15f:.35f);}}
        void OnDestroy(){foreach(var clip in clips.Values)WorldRenderer.Release(clip);}
    }
}
