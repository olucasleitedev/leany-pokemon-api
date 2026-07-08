# Execute como Administrador
# Repara WSL corrompido (REGDB_E_CLASSNOTREG) e prepara Docker

$ErrorActionPreference = "Stop"
$wslMsiUrl = "https://github.com/microsoft/WSL/releases/download/2.7.10/wsl.2.7.10.0.x64.msi"
$wslMsiPath = "$env:TEMP\wsl.2.7.10.0.x64.msi"

Write-Host "=== 1/4 Baixando WSL 2.7.10 ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri $wslMsiUrl -OutFile $wslMsiPath -UseBasicParsing

Write-Host "=== 2/4 Instalando WSL (MSI manual) ===" -ForegroundColor Cyan
Start-Process msiexec.exe -ArgumentList "/i `"$wslMsiPath`" /quiet /norestart" -Wait

Write-Host "=== 3/4 Verificando WSL ===" -ForegroundColor Cyan
wsl --version
wsl --set-default-version 2

Write-Host "=== 4/4 Status ===" -ForegroundColor Cyan
$cpu = Get-CimInstance Win32_Processor
Write-Host "Virtualizacao na firmware: $($cpu.VirtualizationFirmwareEnabled)"

Write-Host ""
Write-Host "PRONTO! Agora:" -ForegroundColor Green
Write-Host "1. REINICIE o PC"
Write-Host "2. Abra o Docker Desktop (aguarde ficar verde)"
Write-Host "3. Rode no projeto:"
Write-Host "   cd C:\Users\wmora\Documents\leany-pokemon-api"
Write-Host "   docker compose up -d"
Write-Host "   npm run start:dev"
Write-Host ""
Write-Host "Postman: http://localhost:3000"
Write-Host "Swagger: http://localhost:3000/docs"
Write-Host "RabbitMQ: http://localhost:15672 (pokemon / pokemon)"
