using System;
using UnityEngine;
using UnityEngine.UI;
namespace Sector16
{
    public sealed class NativeSettings : MonoBehaviour
    {
        RectTransform root;
        public static float FieldOfView=>PlayerPrefs.GetFloat("s16.native.fov",82);
        public bool Visible=>root!=null&&root.gameObject.activeSelf;
        public static void ApplyQuality()
        {bool light=PlayerPrefs.GetInt("s16.native.performance",0)==1;QualitySettings.shadows=light?ShadowQuality.Disable:ShadowQuality.All;QualitySettings.shadowResolution=ShadowResolution.Medium;QualitySettings.shadowDistance=40;QualitySettings.shadowCascades=2;QualitySettings.antiAliasing=light?0:2;}
        public void Build(RectTransform parent,NativeControls controls,NativeAudio audio,Action close)
        {
            root=NativeUI.Panel(parent,"Settings",new Color(.035f,.065f,.08f,.98f));NativeUI.Rounded(root);NativeUI.Place(root,Vector2.one*.5f,Vector2.zero,new Vector2(430,320));root.GetComponent<Image>().raycastTarget=true;
            NativeUI.TextAt(root,"OYUN AYARLARI",25,new Vector2(.5f,1),new Vector2(0,-28),new Vector2(390,40),NativeUI.Paper,TextAnchor.MiddleCenter,true);
            Row("DOKUNMA HASSASİYETİ",75,.4f,2,controls.Sensitivity,value=>{controls.Sensitivity=value;PlayerPrefs.SetFloat("s16.native.sensitivity",value);},"0.00");
            Row("SES SEVİYESİ",126,0,1,audio.Volume,value=>{audio.Volume=value;PlayerPrefs.SetFloat("s16.native.volume",value);},"0%");
            Row("GÖRÜŞ AÇISI",177,65,95,FieldOfView,value=>PlayerPrefs.SetFloat("s16.native.fov",value),"0°");
            Button quality=null;Action refresh=()=>quality.GetComponentInChildren<Text>().text="GRAFİK: "+(PlayerPrefs.GetInt("s16.native.performance",0)==1?"PERFORMANS":"DENGELİ");
            quality=NativeUI.Button(root,"",()=>{PlayerPrefs.SetInt("s16.native.performance",1-PlayerPrefs.GetInt("s16.native.performance",0));ApplyQuality();refresh();});NativeUI.Place((RectTransform)quality.transform,new Vector2(.5f,1),new Vector2(0,-232),new Vector2(380,36));refresh();
            var back=NativeUI.Primary(root,"OYUNA DÖN",()=>{Show(false);PlayerPrefs.Save();close();});NativeUI.Place((RectTransform)back.transform,new Vector2(.5f,1),new Vector2(0,-282),new Vector2(380,38));Show(false);
        }
        void Row(string name,float y,float min,float max,float initial,Action<float> changed,string format)
        {
            NativeUI.TextAt(root,name,10,new Vector2(0,1),new Vector2(148,-y),new Vector2(240,20),NativeUI.Paper);
            var valueText=NativeUI.TextAt(root,initial.ToString(format),11,new Vector2(1,1),new Vector2(-44,-y),new Vector2(60,20),NativeUI.Accent,TextAnchor.MiddleRight);
            var track=NativeUI.Panel(root,name+" slider",new Color(1,1,1,.16f));NativeUI.Place(track,new Vector2(.5f,1),new Vector2(0,-y-18),new Vector2(366,9));track.GetComponent<Image>().raycastTarget=true;
            var fill=NativeUI.Panel(track,"Fill",NativeUI.Accent);var handle=NativeUI.Panel(track,"Handle",NativeUI.Paper);NativeUI.Rounded(handle,true);NativeUI.Place(handle,new Vector2(0,.5f),Vector2.zero,new Vector2(22,13));
            var slider=track.gameObject.AddComponent<Slider>();slider.direction=Slider.Direction.LeftToRight;slider.fillRect=fill;slider.handleRect=handle;slider.targetGraphic=handle.GetComponent<Image>();slider.minValue=min;slider.maxValue=max;slider.value=initial;
            slider.onValueChanged.AddListener(value=>{valueText.text=value.ToString(format);changed(value);});
        }
        public void Show(bool show){root.gameObject.SetActive(show);}
    }
}
