$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$prefix = Join-Path $root 'middleware\nginx'
$nginx = Join-Path $prefix 'nginx.exe'

New-Item -ItemType Directory -Force -Path (Join-Path $prefix 'logs'), (Join-Path $prefix 'temp') | Out-Null

$listener = Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "管理端 Nginx 已在运行：http://localhost:8090"
    exit 0
}

Start-Process -FilePath $nginx -ArgumentList @('-p', "$prefix\", '-c', 'conf/nginx.conf') -WorkingDirectory $prefix -WindowStyle Hidden
Start-Sleep -Milliseconds 800

Start-Sleep -Seconds 1
if (-not (Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue)) {
    throw "Nginx 未监听 8090，请查看 $prefix\logs\error.log"
}
Write-Host "管理端已启动：http://localhost:8090"
Write-Host "小程序 API 前缀：http://localhost:8090/client"
