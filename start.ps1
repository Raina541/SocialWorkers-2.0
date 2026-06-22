Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$nodeDir = 'C:\Program Files\nodejs'
$env:PATH = "$nodeDir;$env:PATH"
Write-Host "Starting Expo Metro Bundler..." -ForegroundColor Green
npx expo start
