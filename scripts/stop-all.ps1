# 停止本项目启动的全部服务（不会动其它项目进程）
# 用法：powershell -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1
$root = Split-Path -Parent $PSScriptRoot
$modules = @(
    'emp-service', 'ctgy-serivce', 'dish-service', 'setmeal-service', 'order-service',
    'user-service', 'report-service', 'shop-service', 'common-service', 'ordpf-gateway', 'docs-service'
)

$stopped = 0
Get-CimInstance Win32_Process -Filter "Name='java.exe'" | ForEach-Object {
    $cmd = $_.CommandLine
    if ($cmd -and $cmd -like ("*" + $root + "*")) {
        foreach ($module in $modules) {
            if ($cmd -like ("*" + $module + "*")) {
                Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                Write-Output ("已停止 {0} pid={1}" -f $module, $_.ProcessId)
                $script:stopped++
                break
            }
        }
    }
}
Write-Output ("共停止 {0} 个进程" -f $stopped)

# 同时停止本项目 8090 管理端 Nginx（不会影响其它项目 Nginx）
$webScript = Join-Path $PSScriptRoot 'stop-web.ps1'
if (Test-Path $webScript) {
    try { & $webScript } catch { Write-Output ("管理端停止失败：{0}" -f $_.Exception.Message) }
}
