# Learning Portal Setup Script for Windows PowerShell

Write-Host "🚀 Setting up Learning Portal..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Initialize Database
Write-Host "🗄️  Initializing database..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to initialize database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database initialized" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Visit: http://localhost:3000" -ForegroundColor White
Write-Host "3. Sign up at: http://localhost:3000/auth/signup" -ForegroundColor White
Write-Host "4. Run: npm run create-admin raihan.muhamad@gmail.com raihan98" -ForegroundColor White
Write-Host ""
Write-Host "Happy learning! 📚" -ForegroundColor Cyan

