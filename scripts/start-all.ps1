# 启动全部服务（已启动的会跳过）
# 用法：powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root 'logs'
$java = 'D:\Jobs\App\java\bin\java.exe'
$javaArgs = @('-Xms128m', '-Xmx512m')

if (-not (Test-Path $java)) {
    throw "找不到 Java：$java"
}
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$services = @(
    @{ Name = 'emp';     Module = 'emp-service';     Port = 8081 },
    @{ Name = 'ctgy';    Module = 'ctgy-serivce';    Port = 8082 },
    @{ Name = 'dish';    Module = 'dish-service';    Port = 8083 },
    @{ Name = 'setmeal'; Module = 'setmeal-service'; Port = 8084 },
    @{ Name = 'order';   Module = 'order-service';   Port = 8091 },
    @{ Name = 'user';    Module = 'user-service';    Port = 8086 },
    @{ Name = 'report';  Module = 'report-service';  Port = 8087 },
    @{ Name = 'common';  Module = 'common-service';  Port = 8089 },
    @{ Name = 'shop';    Module = 'shop-service';    Port = 8100 },
    @{ Name = 'gateway'; Module = 'ordpf-gateway';   Port = 8080 },
    @{ Name = 'docs';    Module = 'docs-service';    Port = 8092 }
)

foreach ($svc in $services) {
    $listening = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Output ("[{0}] 端口 {1} 已监听，跳过" -f $svc.Name, $svc.Port)
        continue
    }
    $jar = Join-Path $root ("{0}\target\{0}-0.0.1-SNAPSHOT.jar" -f $svc.Module)
    if (-not (Test-Path $jar)) {
        Write-Output ("[{0}] 缺少 jar：{1}，请先执行 mvn clean package -DskipTests" -f $svc.Name, $jar)
        continue
    }
    $proc = Start-Process -FilePath $java `
        -ArgumentList ($javaArgs + @('-jar', $jar)) `
        -WorkingDirectory $root `
        -RedirectStandardOutput (Join-Path $logs ("{0}.out.log" -f $svc.Name)) `
        -RedirectStandardError  (Join-Path $logs ("{0}.err.log" -f $svc.Name)) `
        -WindowStyle Hidden -PassThru
    Write-Output ("[{0}] 已启动 pid={1} port={2}" -f $svc.Name, $proc.Id, $svc.Port)
}

Write-Output '提示：约 30 秒后执行 Get-NetTCPConnection 检查 8080/8081/8082/8083/8084/8086/8087/8089/8091/8100。'

# 管理端 Nginx（失败不影响微服务启动）
$webScript = Join-Path $PSScriptRoot 'start-web.ps1'
if (Test-Path $webScript) {
    try { & $webScript } catch { Write-Output ("管理端未启动：{0}" -f $_.Exception.Message) }
}
