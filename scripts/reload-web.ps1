$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$prefix = Join-Path $root 'middleware\nginx'
$nginx = Join-Path $prefix 'nginx.exe'

Push-Location $prefix
try {
    & $nginx -p "$prefix\" -c 'conf/nginx.conf' -s reload
    if ($LASTEXITCODE -ne 0) { throw "nginx reload 失败，退出码 $LASTEXITCODE" }
} finally { Pop-Location }
Write-Host "管理端 Nginx 已重载"
