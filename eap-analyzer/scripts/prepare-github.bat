@echo off
echo 🚀 Ultimate EAP Analyzer v3.0 - Transfer to GitHub
echo ===================================================

REM Создаем папку для переноса
set TRANSFER_DIR=..\eap-analyzer-github-ready
if exist "%TRANSFER_DIR%" rmdir /s /q "%TRANSFER_DIR%"
mkdir "%TRANSFER_DIR%"

echo 📦 Копирую файлы для GitHub репозитория...

REM Копируем основные файлы
copy package.json "%TRANSFER_DIR%\"
copy README-GITHUB.md "%TRANSFER_DIR%\README.md"
copy .npmignore "%TRANSFER_DIR%\"
copy Dockerfile "%TRANSFER_DIR%\"
copy READY-TO-USE.md "%TRANSFER_DIR%\"
copy EAP-QUICK-START.md "%TRANSFER_DIR%\"
copy HOW-TO-USE-SIMPLE.md "%TRANSFER_DIR%\"

REM Копируем папки
xcopy /E /I /H /Y dist "%TRANSFER_DIR%\dist"
xcopy /E /I /H /Y dist-cjs "%TRANSFER_DIR%\dist-cjs"
xcopy /E /I /H /Y bin "%TRANSFER_DIR%\bin"
xcopy /E /I /H /Y templates "%TRANSFER_DIR%\templates"
xcopy /E /I /H /Y .github "%TRANSFER_DIR%\.github"

REM Создаем .gitignore
echo # Dependencies > "%TRANSFER_DIR%\.gitignore"
echo node_modules/ >> "%TRANSFER_DIR%\.gitignore"
echo npm-debug.log* >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # Build outputs >> "%TRANSFER_DIR%\.gitignore"
echo *.tsbuildinfo >> "%TRANSFER_DIR%\.gitignore"
echo .nyc_output >> "%TRANSFER_DIR%\.gitignore"
echo coverage/ >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # OS >> "%TRANSFER_DIR%\.gitignore"
echo .DS_Store >> "%TRANSFER_DIR%\.gitignore"
echo Thumbs.db >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # IDEs >> "%TRANSFER_DIR%\.gitignore"
echo .vscode/ >> "%TRANSFER_DIR%\.gitignore"
echo .idea/ >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # Logs >> "%TRANSFER_DIR%\.gitignore"
echo logs/ >> "%TRANSFER_DIR%\.gitignore"
echo *.log >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # Temporary files >> "%TRANSFER_DIR%\.gitignore"
echo tmp/ >> "%TRANSFER_DIR%\.gitignore"
echo temp/ >> "%TRANSFER_DIR%\.gitignore"
echo. >> "%TRANSFER_DIR%\.gitignore"
echo # Analysis reports >> "%TRANSFER_DIR%\.gitignore"
echo eap-analysis-*.json >> "%TRANSFER_DIR%\.gitignore"
echo optimization-status*.json >> "%TRANSFER_DIR%\.gitignore"
echo qa-report*.json >> "%TRANSFER_DIR%\.gitignore"

REM Создаем инструкцию
echo # 🚀 Инструкция по переносу в GitHub > "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo. >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo ## 📋 Команды для настройки: >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo. >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo ```bash >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo # 1. Перейти в папку >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo cd %TRANSFER_DIR% >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo. >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo # 2. Инициализировать git >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git init >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git add . >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git commit -m "🎉 Initial release Ultimate EAP Analyzer v3.0.0" >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo. >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo # 3. Подключить GitHub >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git remote add origin https://github.com/kinderlystv-png/eap-analyzer.git >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git branch -M main >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git push -u origin main >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo. >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo # 4. Создать релиз >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git tag v3.0.0 >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo git push origin v3.0.0 >> "%TRANSFER_DIR%\SETUP-GITHUB.md"
echo ``` >> "%TRANSFER_DIR%\SETUP-GITHUB.md"

echo.
echo 🎉 Готово! Пакет подготовлен для GitHub
echo 📁 Папка: %TRANSFER_DIR%
echo 📋 Инструкция: %TRANSFER_DIR%\SETUP-GITHUB.md
echo.
echo 📋 Следующие шаги:
echo 1. cd %TRANSFER_DIR%
echo 2. Выполните команды из SETUP-GITHUB.md
echo 3. Настройте Secrets в GitHub для NPM_TOKEN
