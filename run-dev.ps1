# Run H-Staff Backend and Frontend concurrently on Windows PowerShell
Write-Host "Starting H-Staff Full Stack..." -ForegroundColor Cyan

# Check if .env exists in backend
if (-not (Test-Path "backend\.env")) {
    Write-Host "backend\.env not found, creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

# Start backend in a new PowerShell window or job
Write-Host "Starting backend API (http://localhost:4000)..." -ForegroundColor Green
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm.cmd run dev" -PassThru

# Start frontend in a new PowerShell window
Write-Host "Starting frontend App (http://localhost:5173)..." -ForegroundColor Green
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm.cmd run dev" -PassThru

Write-Host "`nH-Staff Services Launched:" -ForegroundColor Cyan
Write-Host "- Backend:  http://localhost:4000" -ForegroundColor White
Write-Host "- Swagger:  http://localhost:4000/docs" -ForegroundColor White
Write-Host "- Frontend: http://localhost:5173" -ForegroundColor White
