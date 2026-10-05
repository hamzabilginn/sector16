using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
namespace Sector16.Editor
{
    public static class NativePresentationChecks
    {
        public static void Capture()
        {
            NativeChecks.Run();
            var repo=Directory.GetParent(Application.dataPath).Parent.FullName;var destination=Path.Combine(repo,"artifacts","native-preview");Directory.CreateDirectory(destination);
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            NativeGame.VisualPreview=true;
            try
            {
                var game=new GameObject("Visual preview").AddComponent<NativeGame>();game.Initialize();
                var camera=GameObject.Find("Game camera").GetComponent<Camera>();var canvas=GameObject.Find("Native UI").GetComponent<Canvas>();
                canvas.renderMode=RenderMode.ScreenSpaceCamera;canvas.worldCamera=camera;canvas.planeDistance=.06f;
                foreach(var playing in new[]{false,true})
                {
                    game.PreviewStage(playing);Render(camera,canvas,1600,740,Path.Combine(destination,playing?"gameplay.png":"lobby.png"));
                }
                foreach(var playing in new[]{false,true}){game.PreviewStage(playing);Render(camera,canvas,1600,1200,Path.Combine(destination,playing?"ipad-gameplay.png":"ipad-lobby.png"));}
                foreach(var overlay in new[]{"equipment","shop","settings","aim","scope"}){game.PreviewStage(true);game.PreviewOverlay(overlay);Render(camera,canvas,1600,740,Path.Combine(destination,overlay+".png"));}
                // Confirm the actual geometry import creates detailed meshes instead of placeholders.
                var renderers=UnityEngine.Object.FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None);
                var weapon=GameObject.Find("Game camera").GetComponentsInChildren<MeshFilter>(true);
                if(weapon.Length<20||!Array.Exists(renderers,r=>r.sharedMaterial!=null&&r.sharedMaterial.mainTexture!=null))throw new Exception("Detailed textured environment and equipment meshes were not loaded.");
                var enabled=Array.FindAll(renderers,r=>r.enabled);Debug.Log("NATIVE PRESENTATION PASS: phone/tablet lobby, gameplay, equipment, shop and settings rendered; "+enabled.Length+" enabled mesh renderers, "+renderers.Length+" imported/combined.");
            }
            finally{NativeGame.VisualPreview=false;EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);}
        }
        static void Render(Camera camera,Canvas canvas,int width,int height,string path)
        {
            var target=new RenderTexture(width,height,24,RenderTextureFormat.ARGB32);target.antiAliasing=2;target.Create();camera.targetTexture=target;camera.aspect=(float)width/height;
            var scaler=canvas.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ConstantPixelSize;scaler.scaleFactor=width/844f;canvas.scaleFactor=width/844f;
            foreach(var label in canvas.GetComponentsInChildren<Text>())label.font.RequestCharactersInTexture(label.text,label.fontSize,label.fontStyle);
            for(int pass=0;pass<3;pass++){foreach(var graphic in canvas.GetComponentsInChildren<Graphic>())graphic.SetAllDirty();Canvas.ForceUpdateCanvases();foreach(var graphic in canvas.GetComponentsInChildren<Graphic>())graphic.Rebuild(CanvasUpdate.PreRender);camera.Render();}
            var old=RenderTexture.active;RenderTexture.active=target;var image=new Texture2D(width,height,TextureFormat.RGB24,false);image.ReadPixels(new Rect(0,0,width,height),0,0);image.Apply();File.WriteAllBytes(path,image.EncodeToPNG());RenderTexture.active=old;camera.targetTexture=null;target.Release();UnityEngine.Object.DestroyImmediate(target);UnityEngine.Object.DestroyImmediate(image);
        }
    }
}
