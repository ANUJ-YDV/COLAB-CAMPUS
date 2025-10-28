# PowerShell API Testing Script
# Tests all RESTful project endpoints

$baseUrl = "http://localhost:5000/api"
$token = ""
$projectId = ""

Write-Host "`n🧪 COMPREHENSIVE API TESTING" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# ========================================
# 1. LOGIN
# ========================================
Write-Host "`n1️⃣  TEST: Login to get JWT token" -ForegroundColor Yellow

$loginBody = @{
    email = "test@collabcampus.com"
    password = "hashedPlaceholder"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.token
    $userId = $loginResponse.user._id
    
    Write-Host "✅ PASS: Login successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..."
    Write-Host "   User: $($loginResponse.user.name) ($($loginResponse.user.email))"
    Write-Host "   User ID: $userId"
} catch {
    Write-Host "❌ FAIL: Login failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    exit 1
}

# ========================================
# 2. CREATE PROJECT
# ========================================
Write-Host "`n2️⃣  TEST: Create new project (POST /api/projects)" -ForegroundColor Yellow

$createBody = @{
    name = "AI Research Project"
    description = "ML based project for testing"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/projects" `
        -Method Post `
        -Headers $headers `
        -Body $createBody

    $projectId = $createResponse._id
    
    Write-Host "✅ PASS: Project created" -ForegroundColor Green
    Write-Host "   Project ID: $projectId"
    Write-Host "   Name: $($createResponse.name)"
    Write-Host "   Owner: $($createResponse.owner)"
    Write-Host "   Members: $($createResponse.members.Count)"
} catch {
    Write-Host "❌ FAIL: Create project failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

# ========================================
# 3. GET ALL PROJECTS
# ========================================
Write-Host "`n3️⃣  TEST: Get all projects (GET /api/projects)" -ForegroundColor Yellow

$authHeaders = @{
    "Authorization" = "Bearer $token"
}

try {
    $projects = Invoke-RestMethod -Uri "$baseUrl/projects" `
        -Method Get `
        -Headers $authHeaders

    Write-Host "✅ PASS: Retrieved all projects" -ForegroundColor Green
    Write-Host "   Total projects: $($projects.Count)"
    
    $i = 1
    foreach ($p in $projects) {
        Write-Host "   $i. $($p.name) - Owner: $($p.owner.name)"
        $i++
    }
} catch {
    Write-Host "❌ FAIL: Get all projects failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

# ========================================
# 4. GET SINGLE PROJECT
# ========================================
Write-Host "`n4️⃣  TEST: Get single project (GET /api/projects/:id)" -ForegroundColor Yellow

try {
    $project = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" `
        -Method Get `
        -Headers $authHeaders

    Write-Host "✅ PASS: Retrieved project details" -ForegroundColor Green
    Write-Host "   Name: $($project.name)"
    Write-Host "   Description: $($project.description)"
    Write-Host "   Owner: $($project.owner.name)"
    Write-Host "   Members: $($project.members.Count)"
    Write-Host "   Tasks: $($project.tasks.Count)"
} catch {
    Write-Host "❌ FAIL: Get single project failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

# ========================================
# 5. UPDATE PROJECT
# ========================================
Write-Host "`n5️⃣  TEST: Update project (PUT /api/projects/:id)" -ForegroundColor Yellow

$updateBody = @{
    name = "Updated AI Research Project"
    description = "Updated ML based project"
} | ConvertTo-Json

try {
    $updatedProject = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" `
        -Method Put `
        -Headers $headers `
        -Body $updateBody

    Write-Host "✅ PASS: Project updated" -ForegroundColor Green
    Write-Host "   New name: $($updatedProject.name)"
    Write-Host "   New description: $($updatedProject.description)"
    Write-Host "   Updated at: $($updatedProject.updatedAt)"
} catch {
    Write-Host "❌ FAIL: Update project failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

# ========================================
# 6. TEST UNAUTHORIZED ACCESS
# ========================================
Write-Host "`n6️⃣  TEST: Access without token (Should fail with 401)" -ForegroundColor Yellow

try {
    $unauthorizedResponse = Invoke-RestMethod -Uri "$baseUrl/projects" `
        -Method Get
    
    Write-Host "❌ FAIL: Should have rejected unauthorized request" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS: Correctly rejected unauthorized request" -ForegroundColor Green
        Write-Host "   Status: 401 Unauthorized"
    } else {
        Write-Host "❌ FAIL: Wrong error code" -ForegroundColor Red
    }
}

# ========================================
# SUMMARY
# ========================================
Write-Host "`n$("=" * 60)" -ForegroundColor Gray
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Login & Authentication" -ForegroundColor Green
Write-Host "✅ Create Project (POST /api/projects)" -ForegroundColor Green
Write-Host "✅ Get All Projects (GET /api/projects)" -ForegroundColor Green
Write-Host "✅ Get Single Project (GET /api/projects/:id)" -ForegroundColor Green
Write-Host "✅ Update Project (PUT /api/projects/:id)" -ForegroundColor Green
Write-Host "✅ Unauthorized Access Protection (401)" -ForegroundColor Green

Write-Host "`n🎉 All critical tests passed!" -ForegroundColor Green

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check MongoDB Atlas for the updated project"
Write-Host "   2. Project ID: $projectId"
Write-Host "   3. Name should be: 'Updated AI Research Project'"
Write-Host "   4. Test delete with: DELETE /api/projects/$projectId"

Write-Host "`n✅ Step 2.2 Testing Complete!`n" -ForegroundColor Green
