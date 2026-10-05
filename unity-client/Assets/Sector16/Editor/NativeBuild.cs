using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Sector16.Editor
{
    public static class NativeBuild
    {
        [Serializable] class ExportInfo { public string bundleIdentifier,version,build,unity; public bool controlChecksPassed; }
        const string ScenePath="Assets/Scenes/Game.unity";
        [MenuItem("Sector 16/Prepare native project")]
        public static void Prepare()
        {
            PlayerSettings.companyName="Webdehasi";PlayerSettings.productName="Sector 16";
            var icon=AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/AppIcon.png");
            if(icon!=null)PlayerSettings.SetIconsForTargetGroup(BuildTargetGroup.Unknown,new[]{icon},IconKind.Any);
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.iOS,"com.webdehasi.sector16");
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Android,"com.webdehasi.sector16");
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait=false;PlayerSettings.allowedAutorotateToPortraitUpsideDown=false;
            PlayerSettings.allowedAutorotateToLandscapeLeft=true;PlayerSettings.allowedAutorotateToLandscapeRight=true;
            PlayerSettings.iOS.targetOSVersionString="15.0";
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.iOS,ScriptingImplementation.IL2CPP);
            var serialized=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
            var handler=serialized.FindProperty("activeInputHandler");if(handler!=null){handler.intValue=1;serialized.ApplyModifiedPropertiesWithoutUndo();}
            var standard=Resources.Load<Shader>("NativeSurface");
            var graphics=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset")[0]);
            var shaders=graphics.FindProperty("m_AlwaysIncludedShaders");
            bool exists=false;for(int n=0;n<shaders.arraySize;n++)if(shaders.GetArrayElementAtIndex(n).objectReferenceValue==standard)exists=true;
            if(!exists){shaders.InsertArrayElementAtIndex(shaders.arraySize);shaders.GetArrayElementAtIndex(shaders.arraySize-1).objectReferenceValue=standard;graphics.ApplyModifiedPropertiesWithoutUndo();}
            Directory.CreateDirectory("Assets/Scenes");
            var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);EditorSceneManager.SaveScene(scene,ScenePath);
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(ScenePath,true)};AssetDatabase.SaveAssets();AssetDatabase.Refresh();
        }
        static void Build(BuildTarget target,string location)
        {
            NativeChecks.Run();Prepare();
            var version=Environment.GetEnvironmentVariable("SECTOR16_VERSION");if(string.IsNullOrWhiteSpace(version))throw new InvalidOperationException("Set SECTOR16_VERSION to an App Store version newer than the released version.");
            var number=Environment.GetEnvironmentVariable("SECTOR16_BUILD_NUMBER");if(!int.TryParse(number,out var build)||build<1)throw new InvalidOperationException("Set SECTOR16_BUILD_NUMBER to an unused positive build number.");
            PlayerSettings.bundleVersion=version;PlayerSettings.iOS.buildNumber=number;PlayerSettings.Android.bundleVersionCode=build;
            var root=Path.GetFullPath(Path.Combine(Application.dataPath,"../.."));
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ScenePath},locationPathName=Path.Combine(root,location),target=target,options=BuildOptions.None});
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Native build failed: "+report.summary.result);
            if(target==BuildTarget.iOS)File.WriteAllText(Path.Combine(root,location,"sector16-export.json"),JsonUtility.ToJson(new ExportInfo{bundleIdentifier="com.webdehasi.sector16",version=version,build=number,unity=Application.unityVersion,controlChecksPassed=true}));
        }
        public static void Windows()=>Build(BuildTarget.StandaloneWindows64,"artifacts/unity-windows/Sector16.exe");
        public static void IOS()=>Build(BuildTarget.iOS,"build/unity-ios");
    }
}
