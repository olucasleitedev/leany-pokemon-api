# Execute este script como Administrador (clique direito > Executar como administrador)
# Corrige WSL + virtualizacao para o Docker Desktop funcionar

Write-Host "=== Habilitando recursos do Windows ===" -ForegroundColor Cyan

dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism.exe /online /enable-feature /featurename:HypervisorPlatform /all /norestart

Write-Host "`n=== Instalando WSL2 ===" -ForegroundColor Cyan
wsl --install --no-distribution

Write-Host "`n=== Definindo WSL2 como padrao ===" -ForegroundColor Cyan
wsl --set-default-version 2

Write-Host "`n=== Verificando virtualizacao na BIOS ===" -ForegroundColor Cyan
$cpu = Get-CimInstance Win32_Processor
Write-Host "CPU: $($cpu.Name)"
Write-Host "Virtualizacao na firmware: $($cpu.VirtualizationFirmwareEnabled)"

if ($cpu.VirtualizationFirmwareEnabled -eq $false) {
    Write-Host "`nATENCAO: Virtualizacao DESABILITADA na BIOS!" -ForegroundColor Red
    Write-Host "Reinicie o PC e entre na BIOS (F2, F10, Del ou Esc na inicializacao)"
    Write-Host "Ative: Intel VT-x / AMD-V / SVM Mode / Virtualization Technology"
}

Write-Host "`n=== PRÓXIMO PASSO ===" -ForegroundColor Green
Write-Host "1. REINICIE o computador"
Write-Host "2. Abra o Docker Desktop e aguarde iniciar"
Write-Host "3. No terminal, rode:"
Write-Host "   cd C:\Users\wmora\Documents\leany-pokemon-api"
Write-Host "   docker compose up -d"
Write-Host "   npm run start:dev"
Write-Host ""
Write-Host "RabbitMQ UI: http://localhost:15672 (pokemon / pokemon)"
Write-Host "API Swagger: http://localhost:3000/docs"

Read-Host "Pressione Enter para reiniciar agora (ou Ctrl+C para reiniciar depois)"
Restart-Computer -Force
