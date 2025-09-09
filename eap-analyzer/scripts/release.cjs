#!/usr/bin/env node

/**
 * 🚀 EAP Analyzer Release Script
 * Подготовка и выпуск новой версии пакета
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Ultimate EAP Analyzer v3.0 - Release Script');
console.log('='.repeat(50));

// Функция выполнения команд
function run(command, options = {}) {
  console.log(`📝 Выполняю: ${command}`);
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options,
    });
    return result;
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Проверка готовности к релизу
function checkReadiness() {
  console.log('\n🔍 Проверка готовности к релизу...');

  // Проверяем что мы в правильной папке
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json не найден! Запустите скрипт из корня пакета.');
    process.exit(1);
  }

  // Проверяем сборку
  if (!fs.existsSync('dist') || !fs.existsSync('bin/quick-analyze.cjs')) {
    console.error('❌ Сборка не найдена! Запустите npm run build');
    process.exit(1);
  }

  // Проверяем основную функциональность
  console.log('🧪 Тестируем анализатор...');
  run('node bin/quick-analyze.cjs .', { stdio: 'pipe' });

  console.log('✅ Проверки пройдены!');
}

// Создание архива для переноса
function createTransferPackage() {
  console.log('\n📦 Создаю пакет для переноса в GitHub...');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;

  // Создаем папку для переноса
  const transferDir = `../eap-analyzer-transfer-v${version}`;

  if (fs.existsSync(transferDir)) {
    run(`rmdir /s /q "${transferDir}"`);
  }

  run(`mkdir "${transferDir}"`);

  // Копируем необходимые файлы (Windows совместимые команды)
  const filesToCopy = [
    'package.json',
    'README-GITHUB.md',
    '.npmignore',
    'Dockerfile',
    'dist',
    'dist-cjs',
    'bin',
    'templates',
    '.github',
    'READY-TO-USE.md',
    'EAP-QUICK-START.md',
    'HOW-TO-USE-SIMPLE.md',
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      if (fs.statSync(file).isDirectory()) {
        run(`xcopy /E /I /H /Y "${file}" "${transferDir}\\${file}"`);
      } else {
        run(`copy "${file}" "${transferDir}\\"`);
      }
      console.log(`✅ Скопирован: ${file}`);
    } else {
      console.log(`⚠️  Пропущен: ${file} (не найден)`);
    }
  });

  // Переименовываем README для GitHub
  if (fs.existsSync(`${transferDir}\\README-GITHUB.md`)) {
    run(`move "${transferDir}\\README-GITHUB.md" "${transferDir}\\README.md"`);
  }

  // Создаем .gitignore
  const gitignore = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
*.tsbuildinfo
.nyc_output
coverage/

# OS
.DS_Store
.DS_Store?
._*
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Temporary files
tmp/
temp/
.tmp

# Analysis reports (examples)
eap-analysis-*.json
optimization-status*.json
qa-report*.json
`;

  fs.writeFileSync(`${transferDir}/.gitignore`, gitignore.trim());

  console.log(`\n🎉 Пакет для переноса создан: ${transferDir}`);
  console.log('\n📋 Следующие шаги:');
  console.log(`1. cd ${transferDir}`);
  console.log('2. git init');
  console.log('3. git add .');
  console.log('4. git commit -m "Initial release v' + version + '"');
  console.log('5. git remote add origin https://github.com/kinderlystv-png/eap-analyzer.git');
  console.log('6. git push -u origin main');
  console.log('7. git tag v' + version);
  console.log('8. git push origin v' + version);

  return transferDir;
}

// Создание инструкции по переносу
function createTransferInstructions(transferDir) {
  const instructions = `# 🚀 Инструкция по переносу EAP Analyzer в GitHub

## 📦 Что подготовлено:
- ✅ Все необходимые файлы скопированы
- ✅ README.md для GitHub создан
- ✅ .npmignore для NPM публикации
- ✅ GitHub Actions для CI/CD
- ✅ Dockerfile для контейнеризации
- ✅ .gitignore настроен

## 🎯 Команды для переноса:

\`\`\`bash
# 1. Перейти в папку переноса
cd ${path.basename(transferDir)}

# 2. Инициализировать git репозиторий
git init

# 3. Добавить все файлы
git add .

# 4. Первый коммит
git commit -m "🎉 Initial release Ultimate EAP Analyzer v3.0.0"

# 5. Подключить GitHub репозиторий
git remote add origin https://github.com/kinderlystv-png/eap-analyzer.git

# 6. Отправить в GitHub
git branch -M main
git push -u origin main

# 7. Создать тег для релиза
git tag v3.0.0
git push origin v3.0.0
\`\`\`

## 🔧 Настройка GitHub репозитория:

### 1. Secrets для GitHub Actions:
- \`NPM_TOKEN\` - токен для публикации в NPM
- \`DOCKER_USERNAME\` - логин Docker Hub
- \`DOCKER_PASSWORD\` - пароль Docker Hub

### 2. Получение NPM токена:
\`\`\`bash
npm login
npm token create --read-only
\`\`\`

### 3. Настройка в GitHub:
1. Перейти в Settings → Secrets and variables → Actions
2. Добавить все необходимые secrets
3. GitHub Actions автоматически запустятся при push тега

## 🚀 После переноса:

### Тестирование:
\`\`\`bash
# Установка из GitHub
npm install -g https://github.com/kinderlystv-png/eap-analyzer.git

# Тестирование
eap analyze /path/to/test/project
\`\`\`

### Публикация в NPM:
- Автоматически через GitHub Actions при создании тега
- Или вручную: \`npm publish --access public\`

## 🎉 Готово!

После переноса пакет будет доступен:
- 📦 NPM: \`npm install -g @kinderlystv-png/eap-analyzer\`
- 🐳 Docker: \`docker pull kinderlystvpng/eap-analyzer\`
- 📁 GitHub: \`git clone https://github.com/kinderlystv-png/eap-analyzer.git\`
`;

  fs.writeFileSync(`${transferDir}/TRANSFER-INSTRUCTIONS.md`, instructions);
  console.log('\n📋 Создана инструкция: TRANSFER-INSTRUCTIONS.md');
}

// Основная функция
function main() {
  checkReadiness();
  const transferDir = createTransferPackage();
  createTransferInstructions(transferDir);

  console.log('\n🎉 Релиз готов!');
  console.log(`📁 Папка для переноса: ${transferDir}`);
  console.log('📋 Следуйте инструкциям в TRANSFER-INSTRUCTIONS.md');
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { checkReadiness, createTransferPackage, createTransferInstructions };
