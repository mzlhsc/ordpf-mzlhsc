# 启动 Sentinel Dashboard（端口 8088，默认账号 sentinel/sentinel）
# 用法：pwsh -File .\scripts\start-sentinel-dashboard.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$jar = Join-Path $root 'middleware\sentinel\sentinel-dashboard.jar'
$logs = Join-Path $root 'logs'
$java = 'D:\Jobs\App\java\bin\java.exe'

if (-not (Test-Path $jar)) {
    throw "缺少 Sentinel Dashboard jar：$jar"
}
if (-not (Test-Path $java)) {
    throw "找不到 Java：$java"
}
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$listening = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Output 'Sentinel Dashboard 已在 8088 运行，跳过'
    exit 0
}

$proc = Start-Process -FilePath $java `
    -ArgumentList @('-Xms128m', '-Xmx512m', '-Dserver.port=8088',
        '-Dcsp.sentinel.dashboard.server=127.0.0.1:8088',
        '-Dproject.name=sentinel-dashboard', '-jar', $jar) `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logs 'sentinel-dashboard.out.log') `
    -RedirectStandardError (Join-Path $logs 'sentinel-dashboard.err.log') `
    -WindowStyle Hidden -PassThru

Write-Output ("Sentinel Dashboard 已启动 pid={0}，地址 http://127.0.0.1:8088 ，账号 sentinel/sentinel" -f $proc.Id)
