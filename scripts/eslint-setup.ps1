# ESLint Setup Script - Phase 1: Dependency Check and Installation

Write-Host "🔍 ESLint Setup - Phase 1: Checking Dependencies" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from project root." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Current ESLint-related dependencies:" -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json

# Check devDependencies for ESLint packages
$eslintPackages = @(
    "eslint",
    "@eslint/js",
    "typescript-eslint",
    "@typescript-eslint/parser",
    "@typescript-eslint/eslint-plugin",
    "eslint-config-prettier",
    "eslint-plugin-svelte",
    "globals"
)

$missingPackages = @()

foreach ($package in $eslintPackages) {
    if ($packageJson.devDependencies.$package) {
        Write-Host "✅ $package : $($packageJson.devDependencies.$package)" -ForegroundColor Green
    } else {
        Write-Host "❌ $package : NOT FOUND" -ForegroundColor Red
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "🔧 Installing missing packages..." -ForegroundColor Yellow
    $installCommand = "pnpm add -D " + ($missingPackages -join " ")
    Write-Host "Command: $installCommand" -ForegroundColor Cyan
    Invoke-Expression $installCommand
} else {
    Write-Host "🎉 All ESLint dependencies are already installed!" -ForegroundColor Green
}

# Test ESLint configuration
Write-Host "🧪 Testing ESLint configuration..." -ForegroundColor Yellow
try {
    $eslintTest = & pnpm eslint --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ESLint version: $eslintTest" -ForegroundColor Green
    } else {
        Write-Host "❌ ESLint test failed: $eslintTest" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ESLint not accessible: $_" -ForegroundColor Red
}

Write-Host "✅ Phase 1 Complete: Dependency check finished" -ForegroundColor Green
