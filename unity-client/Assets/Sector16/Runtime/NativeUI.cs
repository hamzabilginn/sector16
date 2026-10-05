using System;
using UnityEngine;
using UnityEngine.UI;

namespace Sector16
{
    public static class NativeUI
    {
        public static readonly Color Accent=new Color(.85f,.965f,.357f),Muted=new Color(.57f,.65f,.68f),Ink=new Color(.055f,.08f,.065f),Paper=new Color(.93f,.955f,.93f);
        static Font Font=>Resources.Load<Font>("Fonts/barlow-Barlow-Regular")??Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        public static Font Heading=>Resources.Load<Font>("Fonts/barlowcondensed-BarlowCondensed-Bold")??Font;
        static Sprite rounded,circle;
        static Sprite Shape(bool round)
        {
            var cached=round?circle:rounded;if(cached!=null)return cached;
            var texture=new Texture2D(64,64,TextureFormat.RGBA32,false){name=round?"Circle UI":"Rounded UI"};
            for(int y=0;y<64;y++)for(int x=0;x<64;x++){float radius=round?31:10;float dx=Mathf.Max(Mathf.Abs(x-31.5f)-(31.5f-radius),0),dy=Mathf.Max(Mathf.Abs(y-31.5f)-(31.5f-radius),0);float a=Mathf.Clamp01(radius-Mathf.Sqrt(dx*dx+dy*dy));texture.SetPixel(x,y,new Color(1,1,1,a));}
            texture.Apply();var sprite=Sprite.Create(texture,new Rect(0,0,64,64),Vector2.one*.5f,100,0,SpriteMeshType.FullRect,round?Vector4.zero:Vector4.one*12);if(round)circle=sprite;else rounded=sprite;return sprite;
        }
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
        public static Text TextAt(Transform parent,string text,int size,Vector2 anchor,Vector2 position,Vector2 dimensions,Color color,TextAnchor alignment=TextAnchor.MiddleLeft,bool heading=false)
        {var label=Label(parent,text,size);Place((RectTransform)label.transform,anchor,position,dimensions);label.color=color;label.alignment=alignment;label.font=heading?Heading:Font;label.horizontalOverflow=HorizontalWrapMode.Overflow;label.verticalOverflow=VerticalWrapMode.Overflow;return label;}
        public static void Rounded(RectTransform rect,bool round=false)
        {var image=rect.GetComponent<Image>();image.sprite=Shape(round);image.type=round?Image.Type.Simple:Image.Type.Sliced;}
        public static void Border(RectTransform rect,Color color)
        {var outline=rect.gameObject.AddComponent<Outline>();outline.effectColor=color;outline.effectDistance=new Vector2(1,-1);}
        public static Button Primary(Transform parent,string text,Action pressed)
        {var button=Button(parent,text,pressed);button.GetComponent<Image>().color=Accent;button.GetComponentInChildren<Text>().color=Ink;button.GetComponentInChildren<Text>().font=Heading;button.GetComponentInChildren<Text>().fontSize=17;return button;}
        public static NativeGlyph Glyph(Transform parent,string kind,Color color)
        {var obj=new GameObject(kind,typeof(RectTransform),typeof(NativeGlyph));obj.transform.SetParent(parent,false);var glyph=obj.GetComponent<NativeGlyph>();glyph.Kind=kind;glyph.color=color;glyph.raycastTarget=false;Place((RectTransform)obj.transform,Vector2.one*.5f,new Vector2(0,5),new Vector2(30,30));return glyph;}
        public static Button Button(Transform parent,string text,Action pressed)
        {
            var rect=Panel(parent,text,new Color(.07f,.115f,.135f,.91f));rect.GetComponent<Image>().raycastTarget=true;Rounded(rect);Border(rect,new Color(.63f,.73f,.76f,.18f));
            var button=rect.gameObject.AddComponent<Button>();button.targetGraphic=rect.GetComponent<Image>();button.onClick.AddListener(()=>pressed?.Invoke());
            var colors=button.colors;colors.highlightedColor=Color.white;colors.pressedColor=new Color(.78f,.87f,.72f);colors.disabledColor=new Color(.5f,.5f,.5f,.3f);button.colors=colors;var label=Label(rect,text,12);label.font=Heading;return button;
        }
        public static InputField Field(Transform parent,string value,Vector2 position,int limit=20)
        {
            var rect=Panel(parent,"Input",new Color(.045f,.075f,.09f));Rounded(rect);Border(rect,new Color(.6f,.7f,.7f,.22f));Place(rect,new Vector2(.5f,1),position,new Vector2(380,42));rect.GetComponent<Image>().raycastTarget=true;
            var field=rect.gameObject.AddComponent<InputField>();field.textComponent=Label(rect,value,18);field.textComponent.alignment=TextAnchor.MiddleLeft;field.characterLimit=limit;field.text=value;return field;
        }
    }
}
