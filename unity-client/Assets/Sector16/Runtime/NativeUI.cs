using System;
using UnityEngine;
using UnityEngine.UI;

namespace Sector16
{
    public static class NativeUI
    {
        static Font Font=>Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        public static RectTransform Panel(Transform parent,string name,Color color)
        {
            var obj=new GameObject(name,typeof(RectTransform),typeof(Image));obj.transform.SetParent(parent,false);
            var rect=(RectTransform)obj.transform;rect.anchorMin=Vector2.zero;rect.anchorMax=Vector2.one;rect.offsetMin=rect.offsetMax=Vector2.zero;
            var image=obj.GetComponent<Image>();image.color=color;image.raycastTarget=false;return rect;
        }
        public static void Place(RectTransform rect,Vector2 anchor,Vector2 position,Vector2 size)
        {rect.anchorMin=rect.anchorMax=anchor;rect.pivot=new Vector2(.5f,.5f);rect.sizeDelta=size;rect.anchoredPosition=position;}
        public static Text Label(Transform parent,string text,int size=16)
        {
            var obj=new GameObject("Label",typeof(RectTransform),typeof(Text));obj.transform.SetParent(parent,false);
            var label=obj.GetComponent<Text>();label.font=Font;label.fontSize=size;label.text=text;label.color=new Color(.91f,.95f,.88f);label.alignment=TextAnchor.MiddleCenter;label.raycastTarget=false;
            var rect=(RectTransform)obj.transform;rect.anchorMin=Vector2.zero;rect.anchorMax=Vector2.one;rect.offsetMin=new Vector2(6,3);rect.offsetMax=new Vector2(-6,-3);return label;
        }
        public static Button Button(Transform parent,string text,Action pressed)
        {
            var rect=Panel(parent,text,new Color(.08f,.17f,.2f,.88f));rect.GetComponent<Image>().raycastTarget=true;
            var button=rect.gameObject.AddComponent<Button>();button.targetGraphic=rect.GetComponent<Image>();button.onClick.AddListener(()=>pressed?.Invoke());
            var colors=button.colors;colors.highlightedColor=new Color(.7f,.85f,.35f);colors.pressedColor=new Color(.8f,.95f,.4f);colors.disabledColor=new Color(.5f,.5f,.5f,.3f);button.colors=colors;Label(rect,text,12);return button;
        }
        public static InputField Field(Transform parent,string value,Vector2 position,int limit=20)
        {
            var rect=Panel(parent,"Input",new Color(.07f,.11f,.14f));Place(rect,new Vector2(.5f,1),position,new Vector2(380,42));rect.GetComponent<Image>().raycastTarget=true;
            var field=rect.gameObject.AddComponent<InputField>();field.textComponent=Label(rect,value,18);field.textComponent.alignment=TextAnchor.MiddleLeft;field.characterLimit=limit;field.text=value;return field;
        }
    }
}
