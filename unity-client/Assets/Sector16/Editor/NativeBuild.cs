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
        [Serializable] class ExportInfo { public string bundleIdentifier,version,build,unity,presentationRevision,platform; public bool controlChecksPassed; public int minimumApi,targetApi; }
        const string ScenePath="Assets/Scenes/Game.unity";
        [MenuItem("Sector 16/Prepare native project")]
        public static void Prepare()
        {
            PlayerSettings.companyName="Webdehasi";PlayerSettings.productName="Sector 16";
            var iconImporter=AssetImporter.GetAtPath("Assets/AppIcon.png") as TextureImporter;
            if(iconImporter!=null&&(iconImporter.textureCompression!=TextureImporterCompression.Uncompressed||iconImporter.mipmapEnabled))
            {iconImporter.textureCompression=TextureImporterCompression.Uncompressed;iconImporter.mipmapEnabled=false;iconImporter.SaveAndReimport();}
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
            var version=Environment.GetEnvironmentVariable("SECTOR16_VERSION");if(string.IsNullOrWhiteSpace(version))throw new InvalidOperationException("Set SECTOR16_VERSION to a store version newer than the released version.");
            var number=Environment.GetEnvironmentVariable("SECTOR16_BUILD_NUMBER");if(!int.TryParse(number,out var build)||build<1)throw new InvalidOperationException("Set SECTOR16_BUILD_NUMBER to an unused positive build number.");
            var previousVersion=PlayerSettings.bundleVersion;
            var previousIOSBuild=PlayerSettings.iOS.buildNumber;
            var previousAndroidBuild=PlayerSettings.Android.bundleVersionCode;
            PlayerSettings.bundleVersion=version;
            if(target==BuildTarget.iOS)PlayerSettings.iOS.buildNumber=number;
            if(target==BuildTarget.Android)PlayerSettings.Android.bundleVersionCode=build;
            var root=Path.GetFullPath(Path.Combine(Application.dataPath,"../.."));
            try
            {
                var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ScenePath},locationPathName=Path.Combine(root,location),target=target,options=BuildOptions.None});
                if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Native build failed: "+report.summary.result);
                if(target==BuildTarget.iOS||target==BuildTarget.Android)
                {
                    var directory=target==BuildTarget.Android?Path.GetDirectoryName(Path.Combine(root,location)):Path.Combine(root,location);
                    File.WriteAllText(Path.Combine(directory,"sector16-export.json"),JsonUtility.ToJson(new ExportInfo{bundleIdentifier="com.webdehasi.sector16",version=version,build=number,unity=Application.unityVersion,presentationRevision=NativeGame.PresentationRevision,platform=target.ToString(),controlChecksPassed=true,minimumApi=target==BuildTarget.Android?26:0,targetApi=target==BuildTarget.Android?36:0}));
                }
            }
            finally
            {
                PlayerSettings.bundleVersion=previousVersion;PlayerSettings.iOS.buildNumber=previousIOSBuild;PlayerSettings.Android.bundleVersionCode=previousAndroidBuild;
                AssetDatabase.SaveAssets();
            }
        }
        public static void Windows()=>Build(BuildTarget.StandaloneWindows64,"artifacts/unity-windows/Sector16.exe");
        public static void IOS()=>Build(BuildTarget.iOS,"build/unity-ios");
        public static void Android()
        {
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARMv7|AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion=(AndroidSdkVersions)36;
            PlayerSettings.Android.forceInternetPermission=true;
            PlayerSettings.Android.useCustomKeystore=false;
            var previousExport=EditorUserBuildSettings.exportAsGoogleAndroidProject;
            var previousBundle=EditorUserBuildSettings.buildAppBundle;
            EditorUserBuildSettings.exportAsGoogleAndroidProject=false;
            EditorUserBuildSettings.buildAppBundle=true;
            EditorUserBuildSettings.androidBuildSubtarget=MobileTextureSubtarget.ETC2;
            try { Build(BuildTarget.Android,"artifacts/unity-android/Sector16.aab"); }
            finally { EditorUserBuildSettings.exportAsGoogleAndroidProject=previousExport;EditorUserBuildSettings.buildAppBundle=previousBundle; }
        }
    }
}
