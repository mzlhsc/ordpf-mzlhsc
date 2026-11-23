$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$prefix = Join-Path $root 'middleware\nginx'
$nginx = Join-Path $prefix 'nginx.exe'

if (Test-Path $nginx) {
    Push-Location $prefix
    try { & $nginx -p "$prefix\" -c 'conf/nginx.conf' -s quit 2>$null | Out-Null } finally { Pop-Location }
}

Start-Sleep -Seconds 1
$listener = Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "已强制停止管理端 Nginx（pid $($listener.OwningProcess)）"
} else {
    Write-Host "管理端 Nginx 已停止"
}
