# Quick Coverage Viewer Script
# Run this to generate and view both backend and frontend coverage reports

Write-Output ""
Write-Output "🧪 Generating Test Coverage Reports..."
Write-Output ""

# Backend Coverage
Write-Output "📊 Backend Coverage (Server)..."
Set-Location "server"
npm test -- --coverage --watchAll=false
Set-Location ..

Write-Output ""
Write-Output "📊 Frontend Coverage (Client)..."
Set-Location "client"
npm test -- --coverage --watchAll=false
Set-Location ..

Write-Output ""
Write-Output "✅ Coverage reports generated!"
Write-Output ""
Write-Output "Opening reports in browser..."
Write-Output ""

# Open both reports
Start-Process "server/coverage/lcov-report/index.html"
Start-Sleep -Seconds 2
Start-Process "client/coverage/lcov-report/index.html"

Write-Output ""
Write-Output "📈 Coverage reports opened in your browser!"
Write-Output ""
Write-Output "Backend Report: server/coverage/lcov-report/index.html"
Write-Output "Frontend Report: client/coverage/lcov-report/index.html"
Write-Output ""
