$ErrorActionPreference = 'Stop'
$repoDir = $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
$proofRoot = Join-Path $env:USERPROFILE 'CLAPPA'
$state = Get-Content -LiteralPath (Join-Path $proofRoot 'obs-state.json') -Raw | ConvertFrom-Json
if (-not $state.closed -or -not $state.media_path) { throw 'The latest recording has not closed yet.' }
if ($state.session_id -notmatch '^[a-f0-9]{32}$') { throw 'Invalid session ID.' }
& $nodePath (Join-Path $repoDir 'verifier\cli.mjs') (Join-Path $proofRoot "sessions\$($state.session_id)\proof") $state.media_path
exit $LASTEXITCODE
