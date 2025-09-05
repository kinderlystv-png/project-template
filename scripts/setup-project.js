#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupProject() {
  console.log('🚀 Настройка нового проекта из шаблона\n');

  try {
    // Запрашиваем данные
    const projectName = await question('📝 Название проекта: ');
    #!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProject() {
  console.log('🚀 Universal SvelteKit Template Setup\n');
  console.log('This wizard will configure your new project with:');
  console.log('✅ Complete infrastructure (8 core systems)');
  console.log('✅ Full test suite');
  console.log('✅ TypeScript configuration');
  console.log('✅ Production-ready setup\n');
  
  // Запрашиваем данные проекта
  const projectName = await question('📝 Project name: ');
  const projectDescription = await question('📄 Project description: ');
  const authorName = await question('👤 Author name: ');
  const authorEmail = await question('📧 Author email (optional): ');
  const gitRepo = await question('🔗 Git repository URL (optional): ');
  
  console.log('\n🔧 Configuring project...\n');
  
  try {
    // Обновляем package.json
    updatePackageJson(projectName, projectDescription, authorName, authorEmail, gitRepo);
    
    // Обновляем HTML title
    updateHtmlTitle(projectName);
    
    // Обновляем стартовую страницу
    updateStartPage(projectName);
    
    // Создаем проектный README
    createProjectReadme(projectName, projectDescription, authorName);
    
    // Создаем .env файл
    createEnvFile(projectName);
    
    // Обновляем конфигурацию
    updateProjectConfig(projectName);
    
    // Очищаем шаблонные файлы
    cleanupTemplateFiles();
    
    console.log('✅ Project configuration completed!\n');
    console.log(`🎉 ${projectName} is ready for development!\n`);
    console.log('Next steps:');
    console.log('1. git add .');
    console.log('2. git commit -m "Initial commit"');
    if (gitRepo) {
      console.log(`3. git remote add origin ${gitRepo}`);
      console.log('4. git push -u origin main');
    }
    console.log('5. npm run dev\n');
    console.log('Happy coding! 🚀');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
  
  rl.close();
}

    const authorName = await question('👤 Автор: ');
    const gitRepo = await question('🔗 Git репозиторий (опционально): ');

    console.log('\n⚙️ Настраиваю проект...\n');

    // Обновляем package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    packageJson.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    packageJson.description = projectDescription;
    packageJson.author = authorName;
    packageJson.version = '0.1.0';

    if (gitRepo) {
      packageJson.repository = {
        type: 'git',
        url: gitRepo,
      };
      packageJson.homepage = gitRepo.replace('.git', '#readme');
      packageJson.bugs = {
        url: gitRepo.replace('.git', '/issues'),
      };
    }

    // Удаляем скрипты шаблона
    delete packageJson.scripts['setup:project'];
    delete packageJson.scripts['template:update'];
    delete packageJson.scripts['template:test'];

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Обновлен package.json');

    // Обновляем index.html
    const indexPath = path.join(process.cwd(), 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    indexHtml = indexHtml.replace(/<title>.*<\/title>/, `<title>${projectName}</title>`);
    indexHtml = indexHtml.replace(/SHINOMONTAGKA/g, projectName);
    fs.writeFileSync(indexPath, indexHtml);
    console.log('✅ Обновлен index.html');

    // Обновляем стартовую страницу
    const startPagePath = path.join(process.cwd(), 'src/StartPage.svelte');
    if (fs.existsSync(startPagePath)) {
      let startPage = fs.readFileSync(startPagePath, 'utf8');
      startPage = startPage.replace(/начнем проект/g, projectName);
      startPage = startPage.replace(/SHINOMONTAGKA/g, projectName);
      fs.writeFileSync(startPagePath, startPage);
      console.log('✅ Обновлена стартовая страница');
    }

    // Создаем новый README для проекта
    const readmeContent = `# ${projectName}

${projectDescription}

## 🚀 Быстрый старт

\`\`\`bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
\`\`\`

## 🧪 Тестирование

\`\`\`bash
# Все тесты
npm run test

# Unit тесты
npm run test:unit

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:coverage
\`\`\`

## 🏗️ Структура проекта

\`\`\`
src/
├── lib/           # Основная инфраструктура
├── components/    # UI компоненты
├── routes/        # Страницы приложения
└── stores/        # Управление состоянием

tests/
├── unit/          # Юнит тесты
├── integration/   # Интеграционные тесты
├── e2e/           # End-to-End тесты
└── performance/   # Тесты производительности
\`\`\`

## 🛠️ Включенная инфраструктура

- **📝 Логирование** - Многоуровневая система с 5 транспортами
- **🔄 API клиент** - С retry, кэшированием и CSRF защитой
- **💾 Кэширование** - LRU кэш с TTL и тегами
- **🛡️ Безопасность** - XSS/CSRF защита, шифрование
- **📊 Мониторинг** - Web Vitals и метрики производительности
- **⚠️ Обработка ошибок** - Централизованная с типизацией
- **⚙️ Конфигурация** - Типизированная система настроек
- **🔄 Миграции** - Система версионирования данных

## 📦 Технологии

- **SvelteKit** - Фреймворк
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **Vitest** - Тестирование
- **Playwright** - E2E тесты

## 👨‍💻 Автор

${authorName}

${gitRepo ? `## 🔗 Ссылки\n\n- [Репозиторий](${gitRepo})\n` : ''}

---

*Создано с использованием [Universal Project Template](https://github.com/alphacore/project-template)*
`;

    fs.writeFileSync(path.join(process.cwd(), 'README.md'), readmeContent);
    console.log('✅ Создан README.md');

    // Создаем .env файл
    const envContent = `# ${projectName} Environment Variables

# API Configuration
VITE_API_URL=/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY=3

# Application
VITE_APP_NAME="${projectName}"
VITE_APP_VERSION="0.1.0"

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_PWA=false

# Development
VITE_DEBUG=true
VITE_LOG_LEVEL=info

# Sentry (if enabled)
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_RATE=0.1

# Analytics (if enabled)
VITE_GA_ID=
VITE_GTM_ID=
`;

    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    fs.writeFileSync(path.join(process.cwd(), '.env.example'), envContent);
    console.log('✅ Созданы .env и .env.example');

    // Удаляем файлы шаблона
    const filesToRemove = [
      'TEMPLATE_README.md',
      'template.config.json',
      'scripts/setup-project.js', // Удаляем самого себя
      'scripts/update-template.js',
      'scripts/cli.js',
    ];

    filesToRemove.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Удаляем папку scripts если она пустая
    const scriptsDir = path.join(process.cwd(), 'scripts');
    if (fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length === 0) {
      fs.rmdirSync(scriptsDir);
    }

    console.log('✅ Удалены файлы шаблона');

    console.log(`
🎉 Проект ${projectName} успешно настроен!

📋 Следующие шаги:

1. 🔄 Инициализируйте Git:
   git add .
   git commit -m "Initial commit: ${projectName}"

2. 🌐 Добавьте удаленный репозиторий (если есть):
   git remote add origin ${gitRepo || '<your-git-repo>'}
   git push -u origin main

3. 🚀 Начните разработку:
   npm run dev

4. 🧪 Запустите тесты:
   npm run test

Удачной разработки! 🚀
`);
  } catch (error) {
    console.error('❌ Ошибка при настройке проекта:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function updatePackageJson(name, description, author, email, repo) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.name = name.toLowerCase().replace(/\s+/g, '-');
  packageJson.description = description;
  packageJson.author = email ? `${author} <${email}>` : author;
  
  if (repo) {
    packageJson.repository = {
      type: 'git',
      url: repo
    };
    packageJson.homepage = `${repo}#readme`;
    packageJson.bugs = {
      url: `${repo}/issues`
    };
  }
  
  // Удаляем скрипт setup после использования
  delete packageJson.scripts['setup:project'];
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

function updateHtmlTitle(projectName) {
  const indexPath = path.join(process.cwd(), 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  indexHtml = indexHtml.replace(/<title>.*<\/title>/, `<title>${projectName}</title>`);
  fs.writeFileSync(indexPath, indexHtml);
}

function updateStartPage(projectName) {
  const startPagePath = path.join(process.cwd(), 'src/StartPage.svelte');
  if (fs.existsSync(startPagePath)) {
    let startPage = fs.readFileSync(startPagePath, 'utf8');
    startPage = startPage.replace(/начнем проект/g, projectName);
    startPage = startPage.replace(/SHINOMONTAGKA готов к разработке/g, `${projectName} ready for development`);
    fs.writeFileSync(startPagePath, startPage);
  }
}

function createProjectReadme(projectName, description, author) {
  const readmeContent = `# ${projectName}

${description}

## 🚀 Built with Universal SvelteKit Template

This project was created using the [Universal SvelteKit Template](https://github.com/kinderlystv-png/project-template) and includes:

- 📝 **Complete logging system** (5 transports)
- 🔄 **API client** with retry and caching
- 🛡️ **Security** (XSS, CSRF protection)
- 📊 **Monitoring** and Web Vitals
- 🧪 **Full test suite** (unit, e2e, visual, performance)
- ⚙️ **TypeScript** strict configuration

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
\`\`\`

## Author

${author}

## License

MIT
`;
  
  fs.writeFileSync(path.join(process.cwd(), 'README.md'), readmeContent);
}

function createEnvFile(projectName) {
  const envContent = `# ${projectName} Environment Variables

# API Configuration
VITE_API_URL=/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY=3

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_PWA=false

# Development
VITE_LOG_LEVEL=info
VITE_ENABLE_DEBUG=true
`;
  
  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
}

function updateProjectConfig(projectName) {
  const configPath = path.join(process.cwd(), 'template.config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.projectName = projectName;
    config.createdAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

function cleanupTemplateFiles() {
  const filesToRemove = [
    'TEMPLATE_README.md',
    'PUBLICATION_GUIDE.md',
    'TEMPLATE_READY.md',
    'scripts/setup-project.js'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
  setupProject();
}
