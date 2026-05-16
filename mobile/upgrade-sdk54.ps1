# Run once after pulling SDK 54 changes:
#   powershell -ExecutionPolicy Bypass -File upgrade-sdk54.ps1
Set-Location $PSScriptRoot
Write-Host "Removing old node_modules..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
Write-Host "npm install..."
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "expo install --fix..."
npx expo install --fix
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Typecheck..."
npx tsc --noEmit
Write-Host "Done. Run: npm start"
