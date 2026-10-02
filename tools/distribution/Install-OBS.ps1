$ErrorActionPreference = 'Stop'
$targetDir = Join-Path $env:ProgramFiles 'obs-studio\obs-plugins\64bit'
if (-not (Test-Path -LiteralPath $targetDir)) { throw 'OBS was not found in Program Files. See TESTING.md for manual installation.' }
if (Get-Process obs64 -ErrorAction SilentlyContinue) { throw 'Close OBS before installing the plugin, then run this installer again.' }
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
    Start-Process powershell.exe -WindowStyle Hidden -Verb RunAs -Wait -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"')
    exit
}
$targetFile = Join-Path $targetDir 'clappa.dll'
if (Test-Path -LiteralPath $targetFile) { Copy-Item -LiteralPath $targetFile -Destination ($targetFile + '.backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'clappa.dll') -Destination $targetFile -Force
$obsProgram = Join-Path $env:ProgramFiles 'obs-studio\bin\64bit\obs64.exe'
$ruleName = 'CLAPPA-OBS-Local-Pairing-17443'
Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -Name $ruleName -DisplayName 'CLAPPA OBS local phone pairing' -Direction Inbound -Action Allow -Program $obsProgram -Protocol TCP -LocalPort 17443 -RemoteAddress LocalSubnet -Profile Private,Public | Out-Null
Write-Host 'CLAPPA installed. No companion program is needed. Open OBS, then Docks > CLAPPA.'
