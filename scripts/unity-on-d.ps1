param(
    [ValidateSet('Check','Prepare','Windows','IOS','Editor')]
    [string]$Mode = 'Check',
    [string]$EditorPath = 'D:\unity\6000.6.2f1\Editor\Unity.exe',
    [string]$CacheRoot = 'D:\Codex\unity-cache',
    [string]$Version,
    [int]$BuildNumber
)
$ErrorActionPreference = 'Stop'
$taskRepository = Split-Path -Parent $PSScriptRoot
$taskProject = Join-Path $taskRepository 'unity-client'
$taskArtifacts = Join-Path $taskRepository 'artifacts'
if (!(Test-Path -LiteralPath $EditorPath)) { throw "Unity editor not found: $EditorPath" }
New-Item -ItemType Directory -Path $taskArtifacts, $CacheRoot -Force | Out-Null
$env:TEMP = Join-Path $CacheRoot 'Temp'
$env:TMP = $env:TEMP
$env:UPM_CACHE_ROOT = Join-Path $CacheRoot 'Packages'
New-Item -ItemType Directory -Path $env:TEMP, $env:UPM_CACHE_ROOT -Force | Out-Null
if ($Mode -in 'Windows','IOS') {
    if ([string]::IsNullOrWhiteSpace($Version) -or $BuildNumber -lt 1) {
        throw 'Builds require -Version and a positive -BuildNumber. For iOS, check the current App Store version and used build numbers first.'
    }
    $env:SECTOR16_VERSION = $Version
    $env:SECTOR16_BUILD_NUMBER = [string]$BuildNumber
}
$taskLog = Join-Path $taskArtifacts ("unity-{0}.log" -f $Mode.ToLowerInvariant())
$taskArguments = @('-projectPath', ('"{0}"' -f $taskProject), '-logFile', ('"{0}"' -f $taskLog))
if ($Mode -eq 'Editor') {
    Start-Process -FilePath $EditorPath -ArgumentList $taskArguments | Out-Null
    Write-Output "Unity project opened with temporary files and package cache on D:. Log: $taskLog"
    exit 0
}
$taskMethod = switch ($Mode) {
    'Check' { 'Sector16.Editor.NativeChecks.Run' }
    'Prepare' { 'Sector16.Editor.NativeBuild.Prepare' }
    'Windows' { 'Sector16.Editor.NativeBuild.Windows' }
    'IOS' { 'Sector16.Editor.NativeBuild.IOS' }
}
$taskArguments += @('-batchmode','-quit','-executeMethod',$taskMethod)
if ($Mode -eq 'IOS') { $taskArguments += @('-buildTarget','iOS') }
if ($Mode -eq 'Windows') { $taskArguments += @('-buildTarget','Win64') }
$taskProcess = Start-Process -FilePath $EditorPath -ArgumentList $taskArguments -WindowStyle Hidden -PassThru
$taskProcess.WaitForExit()
Write-Output "Unity $Mode exit: $($taskProcess.ExitCode). Log: $taskLog"
if ($null -eq $taskProcess.ExitCode -or $taskProcess.ExitCode -ne 0) { throw "Unity $Mode failed or did not return an exit code. Read $taskLog" }
