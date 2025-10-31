# Simple Deployment Verification Script

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   COLAB CAMPUS - Deployment Config Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\ajydv\OneDrive\Desktop\COLAB CAMPUS"

# Test 1: Production Build
Write-Host "[1] Production Build Check..." -ForegroundColor Yellow
$buildPath = "$projectRoot\client\build"
if (Test-Path $buildPath) {
    Write-Host "    [OK] Build folder exists" -ForegroundColor Green
    if (Test-Path "$buildPath\index.html") {
        Write-Host "    [OK] index.html found" -ForegroundColor Green
    }
} else {
    Write-Host "    [FAIL] Build not found" -ForegroundColor Red
}

Write-Host ""

# Test 2: Environment Files
Write-Host "[2] Environment Files Check..." -ForegroundColor Yellow
$envFiles = @(
    "$projectRoot\server\.env.example",
    "$projectRoot\server\.env.production",
    "$projectRoot\client\.env.example",
    "$projectRoot\client\.env.production"
)

foreach ($file in $envFiles) {
    $fileName = Split-Path $file -Leaf
    if (Test-Path $file) {
        Write-Host "    [OK] $fileName" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL] $fileName missing" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Server Configuration
Write-Host "[3] Server Configuration Check..." -ForegroundColor Yellow
$serverJs = "$projectRoot\server\server.js"
if (Test-Path $serverJs) {
    $content = Get-Content $serverJs -Raw
    
    if ($content -match "corsOptions") {
        Write-Host "    [OK] CORS configured" -ForegroundColor Green
    }
    
    if ($content -match "/api/health") {
        Write-Host "    [OK] Health check endpoint" -ForegroundColor Green
    }
    
    if ($content -match "express\.static") {
        Write-Host "    [OK] Static file serving" -ForegroundColor Green
    }
    
    if ($content -match "fileURLToPath") {
        Write-Host "    [OK] ES Module __dirname" -ForegroundColor Green
    }
}

Write-Host ""

# Test 4: Package.json
Write-Host "[4] Package.json Scripts Check..." -ForegroundColor Yellow
$serverPkg = "$projectRoot\server\package.json"
if (Test-Path $serverPkg) {
    $pkg = Get-Content $serverPkg -Raw | ConvertFrom-Json
    
    if ($pkg.scripts.start) {
        Write-Host "    [OK] Start script: $($pkg.scripts.start)" -ForegroundColor Green
    }
    
    if ($pkg.type -eq "module") {
        Write-Host "    [OK] ES Module enabled" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Setup MongoDB Atlas" -ForegroundColor White
Write-Host "  2. Generate JWT Secret" -ForegroundColor White
Write-Host "  3. Deploy to Render + Vercel" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: BACKEND_DEPLOYMENT_CONFIG.md" -ForegroundColor Cyan
Write-Host ""
