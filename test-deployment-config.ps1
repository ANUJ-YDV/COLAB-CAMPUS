# 🧪 Quick Production Test Script
# Tests backend configuration before deployment

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   COLAB CAMPUS - Production Config Test" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$originalLocation = Get-Location
$projectRoot = "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS"

# Test 1: Check if build exists
Write-Host "Test 1: Checking production build..." -ForegroundColor Yellow
$buildPath = Join-Path $projectRoot "client\build"
if (Test-Path $buildPath) {
    $buildSize = (Get-ChildItem -Path $buildPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   [OK] Build folder exists" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Green
    
    # Check for index.html
    $indexPath = Join-Path $buildPath "index.html"
    if (Test-Path $indexPath) {
        Write-Host "   [OK] index.html found" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] index.html missing" -ForegroundColor Red
    }
} else {
    Write-Host "   [FAIL] Build folder not found!" -ForegroundColor Red
    Write-Host "   Run: cd client && npm run build" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Check environment files
Write-Host "🔐 Test 2: Checking environment files..." -ForegroundColor Yellow

$envFiles = @(
    @{Path = "server\.env.example"; Name = "Server Dev Template"; Required = $true},
    @{Path = "server\.env.production"; Name = "Server Prod Template"; Required = $true},
    @{Path = "client\.env.example"; Name = "Client Dev Template"; Required = $true},
    @{Path = "client\.env.production"; Name = "Client Prod Template"; Required = $true}
)

foreach ($env in $envFiles) {
    $fullPath = Join-Path $projectRoot $env.Path
    if (Test-Path $fullPath) {
        Write-Host "   ✅ $($env.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($env.Name) missing" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Check package.json scripts
Write-Host "📜 Test 3: Checking package.json scripts..." -ForegroundColor Yellow

$serverPackage = Join-Path $projectRoot "server\package.json"
if (Test-Path $serverPackage) {
    $packageContent = Get-Content $serverPackage -Raw | ConvertFrom-Json
    
    if ($packageContent.scripts.start) {
        Write-Host "   ✅ Server start script: $($packageContent.scripts.start)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Server start script missing" -ForegroundColor Red
    }
    
    if ($packageContent.type -eq "module") {
        Write-Host "   ✅ ES Module enabled (type: module)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CommonJS mode (consider using ES modules)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4: Check for port conflicts
Write-Host "🔌 Test 4: Checking port availability..." -ForegroundColor Yellow

$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "   ⚠️  Port 5000 is in use (PID: $($port5000.OwningProcess))" -ForegroundColor Yellow
    Write-Host "   💡 Stop existing server or use different port" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Port 5000 available" -ForegroundColor Green
}

$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Port 3000 is in use (PID: $($port3000.OwningProcess))" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Port 3000 available" -ForegroundColor Green
}

Write-Host ""

# Test 5: Check server.js modifications
Write-Host "🔧 Test 5: Verifying server configuration..." -ForegroundColor Yellow

$serverJs = Join-Path $projectRoot "server\server.js"
if (Test-Path $serverJs) {
    $serverContent = Get-Content $serverJs -Raw
    
    # Check for CORS configuration
    if ($serverContent -match "corsOptions") {
        Write-Host "   ✅ CORS configuration found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CORS configuration missing" -ForegroundColor Red
    }
    
    # Check for health endpoint
    if ($serverContent -match "/api/health") {
        Write-Host "   ✅ Health check endpoint added" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Health check endpoint missing" -ForegroundColor Yellow
    }
    
    # Check for static file serving
    if ($serverContent -match "express\.static") {
        Write-Host "   ✅ Static file serving configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Static file serving not configured" -ForegroundColor Yellow
    }
    
    # Check for __dirname setup
    if ($serverContent -match "fileURLToPath") {
        Write-Host "   ✅ ES Module __dirname configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ES Module __dirname missing" -ForegroundColor Red
    }
}

Write-Host ""

# Test 6: Dependencies check
Write-Host "📚 Test 6: Checking key dependencies..." -ForegroundColor Yellow

$serverPackage = Join-Path $projectRoot "server\package.json"
$clientPackage = Join-Path $projectRoot "client\package.json"

if (Test-Path $serverPackage) {
    $serverDeps = (Get-Content $serverPackage -Raw | ConvertFrom-Json).dependencies
    
    $requiredDeps = @("express", "mongoose", "socket.io", "cors", "dotenv", "jsonwebtoken")
    foreach ($dep in $requiredDeps) {
        if ($serverDeps.$dep) {
            Write-Host "   ✅ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $dep missing" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Setup MongoDB Atlas" -ForegroundColor White
Write-Host "      → https://cloud.mongodb.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Generate JWT Secret" -ForegroundColor White
Write-Host "      → node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Test Locally" -ForegroundColor White
Write-Host "      Terminal 1: cd server && npm start" -ForegroundColor Gray
Write-Host "      Terminal 2: cd client && npx serve -s build -p 3000" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Deploy Backend" -ForegroundColor White
Write-Host "      → Render.com (recommended)" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Deploy Frontend" -ForegroundColor White
Write-Host "      → Vercel (recommended)" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - BACKEND_DEPLOYMENT_CONFIG.md" -ForegroundColor Cyan
Write-Host "   - PRODUCTION_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

Set-Location $originalLocation
