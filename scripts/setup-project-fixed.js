#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function question(prompt) {
  return new Promise(resolve => {
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
  const projectDescription = await question('📖 Project description: ');
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

function updatePackageJson(name, description, author, email, repo) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  packageJson.name = name.toLowerCase().replace(/\s+/g, '-');
  packageJson.description = description;
  packageJson.author = email ? `${author} <${email}>` : author;
  packageJson.version = '0.1.0';

  if (repo) {
    packageJson.repository = {
      type: 'git',
      url: repo,
    };
    packageJson.homepage = `${repo}#readme`;
    packageJson.bugs = {
      url: `${repo}/issues`,
    };
  }

  // Удаляем скрипт setup после использования
  delete packageJson.scripts['setup:project'];

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

function updateHtmlTitle(projectName) {
  const indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    indexHtml = indexHtml.replace(/<title>.*<\/title>/, `<title>${projectName}</title>`);
    fs.writeFileSync(indexPath, indexHtml);
  }
}

function updateStartPage(projectName) {
  const startPagePath = path.join(process.cwd(), 'src/StartPage.svelte');
  if (fs.existsSync(startPagePath)) {
    let startPage = fs.readFileSync(startPagePath, 'utf8');
    startPage = startPage.replace(/начнем проект/g, projectName);
    startPage = startPage.replace(
      /SHINOMONTAGKA готов к разработке/g,
      `${projectName} ready for development`
    );
    fs.writeFileSync(startPagePath, startPage);
  }

  // Также обновляем основной роут если он существует
  const mainRoutePath = path.join(process.cwd(), 'src/routes/+page.svelte');
  if (fs.existsSync(mainRoutePath)) {
    let mainRoute = fs.readFileSync(mainRoutePath, 'utf8');
    mainRoute = mainRoute.replace(/начнем проект/g, projectName);
    mainRoute = mainRoute.replace(
      /SHINOMONTAGKA готов к разработке/g,
      `${projectName} ready for development`
    );
    fs.writeFileSync(mainRoutePath, mainRoute);
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

## Project Structure

\`\`\`
src/
├── lib/           # Core infrastructure
├── routes/        # Application pages
├── stores/        # State management
└── components/    # UI components

tests/
├── unit/          # Unit tests
├── e2e/           # End-to-end tests
├── integration/   # Integration tests
└── performance/   # Performance tests
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

# Production (uncomment for production)
# VITE_LOG_LEVEL=error
# VITE_ENABLE_DEBUG=false
`;

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
}

function updateProjectConfig(projectName) {
  const configPath = path.join(process.cwd(), 'template.config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.projectName = projectName;
    config.createdAt = new Date().toISOString();
    config.status = 'configured';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

function cleanupTemplateFiles() {
  const filesToRemove = [
    'TEMPLATE_README.md',
    'PUBLICATION_GUIDE.md',
    'TEMPLATE_READY.md',
    'INFRASTRUCTURE_COMPLETE.md',
    'FINAL_STATUS_REPORT.md',
    'TESTING-STATUS.md',
  ];

  filesToRemove.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`📁 Removed template file: ${file}`);
    }
  });

  // Удаляем сам скрипт настройки после выполнения
  const setupScriptPath = path.join(process.cwd(), 'scripts/setup-project.js');
  if (fs.existsSync(setupScriptPath)) {
    fs.unlinkSync(setupScriptPath);
    console.log('🗑️ Removed setup script');
  }
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
  setupProject().catch(console.error);
}

module.exports = { setupProject };
