# 🚀 PowerShell Copy Script for GitHub Transfer
# Создает готовую структуру для GitHub репозитория

$githubPath = "C:\alphacore\eap-analyzer-github-ready"

Write-Host "🎯 Copying Ultimate EAP Analyzer v3.0 to GitHub structure..." -ForegroundColor Green

# Создаем папку
if (Test-Path $githubPath) {
    Remove-Item $githubPath -Recurse -Force
}
New-Item -ItemType Directory -Path $githubPath | Out-Null

# Копируем основные файлы
Copy-Item "package.json" $githubPath
Copy-Item "README-GITHUB.md" "$githubPath\README.md"
Copy-Item ".npmignore" $githubPath
Copy-Item "Dockerfile" $githubPath

# Копируем документацию
Copy-Item "READY-TO-USE.md" $githubPath
Copy-Item "EAP-QUICK-START.md" $githubPath
Copy-Item "HOW-TO-USE-SIMPLE.md" $githubPath

# Копируем папки
Copy-Item "dist" $githubPath -Recurse
Copy-Item "dist-cjs" $githubPath -Recurse
Copy-Item "bin" $githubPath -Recurse
Copy-Item ".github" $githubPath -Recurse

# Создаем .gitignore
@"
# Dependencies
node_modules/
npm-debug.log*

# Build outputs
*.tsbuildinfo
coverage/

# OS files
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/

# Logs
*.log

# Temporary
tmp/
temp/

# Analysis reports
eap-analysis-*.json
"@ | Out-File "$githubPath\.gitignore"

# Создаем инструкцию
@"
# 🚀 GitHub Setup Instructions

## Commands to run:

```bash
cd $githubPath
git init
git add .
git commit -m "🎉 Initial release Ultimate EAP Analyzer v3.0.0"
git remote add origin https://github.com/kinderlystv-png/eap-analyzer.git
git branch -M main
git push -u origin main
git tag v3.0.0
git push origin v3.0.0
```

## GitHub Secrets needed:
- NPM_TOKEN (get: npm token create)
- DOCKER_USERNAME
- DOCKER_PASSWORD

## Ready! 🎉
"@ | Out-File "$githubPath\GITHUB-SETUP.md"

Write-Host "✅ GitHub package ready at: $githubPath" -ForegroundColor Green
Write-Host "📋 Next: Follow instructions in GITHUB-SETUP.md" -ForegroundColor Yellow
