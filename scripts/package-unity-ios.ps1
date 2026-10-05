param([string]$ExportPath='build/unity-ios',[string]$OutputPath='artifacts/sector16-unity-ios.zip')
$ErrorActionPreference='Stop'
$sector16Export=(Resolve-Path -LiteralPath $ExportPath).Path
if(-not (Test-Path -LiteralPath (Join-Path $sector16Export 'Unity-iPhone.xcodeproj'))) {throw 'A successful Unity iOS export is required.'}
$sector16Archive=[IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($sector16Archive)) | Out-Null
# Windows tar preserves export file layout; Codemagic restores the archive on macOS.
& tar -a -c -f $sector16Archive -C $sector16Export .
if($LASTEXITCODE -ne 0){throw 'iOS export packaging failed.'}
Get-Item -LiteralPath $sector16Archive | Select-Object FullName,Length
