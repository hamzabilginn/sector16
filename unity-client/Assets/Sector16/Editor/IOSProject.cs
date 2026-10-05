#if UNITY_IOS
using System.IO;
using UnityEditor;
using UnityEditor.Callbacks;
using UnityEditor.iOS.Xcode;

namespace Sector16.Editor
{
    public static class IOSProject
    {
        [PostProcessBuild(10)]
        public static void Configure(BuildTarget target,string path)
        {
            if(target!=BuildTarget.iOS)return;
            var file=Path.Combine(path,"Info.plist");var plist=new PlistDocument();plist.ReadFromFile(file);
            // Only OS-provided TLS is used by ClientWebSocket; no custom encryption.
            plist.root.SetBoolean("ITSAppUsesNonExemptEncryption",false);plist.WriteToFile(file);
        }
    }
}
#endif
