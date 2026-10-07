param([string]$BuildPath='artifacts/unity-android',[string]$OutputPath='artifacts/sector16-unity-android.zip')
$ErrorActionPreference='Stop'
$taskBuild=(Resolve-Path -LiteralPath $BuildPath).Path
$taskInfo=Get-Content -LiteralPath (Join-Path $taskBuild 'sector16-export.json') -Raw | ConvertFrom-Json
if($taskInfo.platform -ne 'Android' -or $taskInfo.bundleIdentifier -ne 'com.webdehasi.sector16' -or !$taskInfo.controlChecksPassed){throw 'A successful Sector 16 native Android build is required.'}
if($taskInfo.presentationRevision -ne 'mobile-joystick-fix-20261005' -or $taskInfo.targetApi -ne 36){throw 'The Android build must include the joystick fix and target API 36.'}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskBundle=Join-Path $taskBuild 'Sector16.aab'
$taskUnsigned=Join-Path $taskBuild 'sector16-unsigned.aab'
$taskSource=[IO.Compression.ZipFile]::OpenRead($taskBundle)
try {
    if(!$taskSource.GetEntry('base/manifest/AndroidManifest.xml') -or !$taskSource.GetEntry('base/lib/arm64-v8a/libil2cpp.so')){throw 'Android App Bundle is missing its manifest or native IL2CPP player.'}
    $taskStream=[IO.File]::Open($taskUnsigned,[IO.FileMode]::Create)
    $taskTarget=New-Object IO.Compression.ZipArchive($taskStream,[IO.Compression.ZipArchiveMode]::Create,$false)
    try {
        foreach($taskEntry in $taskSource.Entries){
            # Unity's local build may carry a debug JAR signature. Codemagic signs
            # the unchanged release payload with the existing Play upload key.
            if($taskEntry.FullName -match '(?i)^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC)|SIG-[^/]+)$'){continue}
            $taskCopy=$taskTarget.CreateEntry($taskEntry.FullName,[IO.Compression.CompressionLevel]::Optimal)
            $taskInput=$taskEntry.Open(); $taskOutput=$taskCopy.Open()
            try {$taskInput.CopyTo($taskOutput)} finally {$taskInput.Dispose();$taskOutput.Dispose()}
        }
    } finally {$taskTarget.Dispose();$taskStream.Dispose()}
} finally {$taskSource.Dispose()}
$taskHash=(Get-FileHash -LiteralPath $taskUnsigned -Algorithm SHA256).Hash.ToLowerInvariant()
$taskInfo | Add-Member -NotePropertyName sha256 -NotePropertyValue $taskHash -Force
$taskMetadata=$taskInfo | ConvertTo-Json -Compress
$taskArchive=[IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($taskArchive)) -Force | Out-Null
$taskStream=[IO.File]::Open($taskArchive,[IO.FileMode]::Create)
$taskZip=New-Object IO.Compression.ZipArchive($taskStream,[IO.Compression.ZipArchiveMode]::Create,$false)
try {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskZip,$taskUnsigned,'sector16-unsigned.aab',[IO.Compression.CompressionLevel]::NoCompression) | Out-Null
    $taskEntry=$taskZip.CreateEntry('sector16-export.json')
    $taskWriter=New-Object IO.StreamWriter($taskEntry.Open(),(New-Object Text.UTF8Encoding($false)))
    try {$taskWriter.Write($taskMetadata)} finally {$taskWriter.Dispose()}
} finally {$taskZip.Dispose();$taskStream.Dispose()}
Write-Output "Sector 16 native Android export: $($taskInfo.version) ($($taskInfo.build))."
Get-Item -LiteralPath $taskArchive | Select-Object FullName,Length
