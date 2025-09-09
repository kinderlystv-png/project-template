Write-Host "Copying Ultimate EAP Analyzer v3.0 to GitHub structure..." -ForegroundColor Green

$githubPath = "C:\alphacore\eap-analyzer-github-ready"

if (Test-Path $githubPath) {
    Remove-Item $githubPath -Recurse -Force
}
New-Item -ItemType Directory -Path $githubPath | Out-Null

Copy-Item "package.json" $githubPath
Copy-Item "README-GITHUB.md" "$githubPath\README.md"
Copy-Item ".npmignore" $githubPath -ErrorAction SilentlyContinue
Copy-Item "Dockerfile" $githubPath
Copy-Item "READY-TO-USE.md" $githubPath
Copy-Item "EAP-QUICK-START.md" $githubPath
Copy-Item "HOW-TO-USE-SIMPLE.md" $githubPath
Copy-Item "dist" $githubPath -Recurse
Copy-Item "dist-cjs" $githubPath -Recurse
Copy-Item "bin" $githubPath -Recurse
Copy-Item ".github" $githubPath -Recurse -ErrorAction SilentlyContinue

"node_modules/`nnpm-debug.log*`n*.tsbuildinfo`ncoverage/`n.DS_Store`nThumbs.db`n.vscode/`n.idea/`n*.log`ntmp/`ntemp/`neap-analysis-*.json" | Out-File "$githubPath\.gitignore"

Write-Host "GitHub package ready at: $githubPath" -ForegroundColor Green
