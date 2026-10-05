param([string]$ExportPath='build/unity-ios',[string]$OutputPath='artifacts/sector16-unity-ios.zip')
$ErrorActionPreference='Stop'
$sector16Export=(Resolve-Path -LiteralPath $ExportPath).Path
if(-not (Test-Path -LiteralPath (Join-Path $sector16Export 'Unity-iPhone.xcodeproj'))) {throw 'A successful Unity iOS export is required.'}
$sector16Info=Get-Content -LiteralPath (Join-Path $sector16Export 'sector16-export.json') -Raw | ConvertFrom-Json
if($sector16Info.bundleIdentifier -ne 'com.webdehasi.sector16' -or !$sector16Info.controlChecksPassed){throw 'The export must match Sector 16 and pass native checks.'}
$sector16Plist=New-Object System.Xml.XmlDocument
$sector16Plist.XmlResolver=$null
$sector16Plist.Load((Join-Path $sector16Export 'Info.plist'))
$sector16Version=$sector16Plist.SelectSingleNode("/plist/dict/key[.='CFBundleShortVersionString']/following-sibling::*[1]").InnerText
$sector16Build=$sector16Plist.SelectSingleNode("/plist/dict/key[.='CFBundleVersion']/following-sibling::*[1]").InnerText
if($sector16Version -ne $sector16Info.version -or $sector16Build -ne $sector16Info.build){throw 'Export metadata and Info.plist version numbers do not match.'}
$sector16Archive=[IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($sector16Archive)) | Out-Null
# Windows tar preserves export file layout; Codemagic restores the archive on macOS.
& tar -a -c -f $sector16Archive -C $sector16Export .
if($LASTEXITCODE -ne 0){throw 'iOS export packaging failed.'}
Get-Item -LiteralPath $sector16Archive | Select-Object FullName,Length
Write-Output "Sector 16 iOS export: $sector16Version ($sector16Build)."
