$ErrorActionPreference='Stop'
$workspacePath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$obsExe=Join-Path $workspacePath '.tools/obs-test/bin/64bit/obs64.exe'
$pidPath=Join-Path $workspacePath 'output/obs-test.pid'
Get-Process obs64 -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq $obsExe} | ForEach-Object {Stop-Process -Id $_.Id;$_.WaitForExit(10000)|Out-Null}
for($attempt=0;$attempt -lt 20;$attempt++){
 try{Copy-Item -LiteralPath (Join-Path $workspacePath 'obs-plugin/build/Release/clappa.dll') -Destination (Join-Path $workspacePath '.tools/obs-test/obs-plugins/64bit/clappa.dll');break}catch{if($attempt -eq 19){throw};Start-Sleep -Milliseconds 200}
}
$env:CLAPPA_HOME=Join-Path $workspacePath 'output/native-test'
$env:CLAPPA_TEST_PORT='17444'
$testProc=Start-Process -FilePath $obsExe -WorkingDirectory (Split-Path $obsExe) -ArgumentList @('--portable','--multi','--minimize-to-tray','--disable-shutdown-check') -WindowStyle Hidden -PassThru
$testProc.Id | Set-Content -LiteralPath $pidPath
$deadline=(Get-Date).AddSeconds(20)
foreach($testPort in @(17444,17445)){
 while($true){
  $socket=New-Object System.Net.Sockets.TcpClient
  try{$socket.Connect('127.0.0.1',$testPort);break}catch{if((Get-Date) -gt $deadline){throw "Isolated OBS test port $testPort did not become ready"};Start-Sleep -Milliseconds 200}finally{$socket.Dispose()}
 }
}
Write-Output 'Isolated OBS test instance started.'
