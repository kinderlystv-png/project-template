#!/usr/bin/env node

const readline = require('readline');
const path = require('path');
const {
  readJsonFile,
  writeJsonFile,
  updateFile,
  deleteFile,
  fileExists,
  executeTasks,
} = require('./utils/file-operations.cjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function promptConfiguration() {
  console.log('🚀 Universal SvelteKit Template Setup\n');
  console.log('This wizard will configure your new project with:');
  console.log('✅ Complete infrastructure (8 core systems)');
  console.log('✅ Full test suite');
  console.log('✅ TypeScript configuration');
  console.log('✅ Production-ready setup\n');

  const config = {
    projectName: await question('📝 Project name: '),
    projectDescription: await question('📖 Project description: '),
    authorName: await question('👤 Author name: '),
    authorEmail: await question('📧 Author email (optional): '),
    gitRepo: await question('🔗 Git repository URL (optional): '),
  };

  return config;
}

async function updatePackageJson(config) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = readJsonFile(packagePath);

  if (!packageJson) return false;

  packageJson.name = config.projectName.toLowerCase().replace(/\s+/g, '-');
  packageJson.description = config.projectDescription;
  packageJson.author = config.authorEmail
    ? `${config.authorName} <${config.authorEmail}>`
    : config.authorName;
  packageJson.version = '0.1.0';

  if (config.gitRepo) {
    packageJson.repository = {
      type: 'git',
      url: config.gitRepo,
    };
    packageJson.homepage = `${config.gitRepo}#readme`;
    packageJson.bugs = {
      url: `${config.gitRepo}/issues`,
    };
  }

  // Удаляем скрипт setup после использования
  delete packageJson.scripts['setup:project'];

  return writeJsonFile(packagePath, packageJson);
}

async function updateHtmlTitle(projectName) {
  const indexPath = path.join(process.cwd(), 'index.html');
  if (!fileExists(indexPath)) return true;

  return updateFile(indexPath, [['<title>.*<\/title>', `<title>${projectName}</title>`]]);
}

async function updateStartPage(projectName) {
  const startPagePath = path.join(process.cwd(), 'src/StartPage.svelte');
  const mainRoutePath = path.join(process.cwd(), 'src/routes/+page.svelte');

  const replacements = [
    ['начнем проект', projectName],
    ['SHINOMONTAGKA готов к разработке', `${projectName} ready for development`],
  ];

  let success = true;

  if (fileExists(startPagePath)) {
    success = success && updateFile(startPagePath, replacements);
  }

  if (fileExists(mainRoutePath)) {
    success = success && updateFile(mainRoutePath, replacements);
  }

  return success;
}

async function createProjectReadme(config) {
  const readmeContent = `# ${config.projectName}

${config.projectDescription}

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

${config.authorName}

## License

MIT
`;

  return writeJsonFile(path.join(process.cwd(), 'README.md'), readmeContent);
}

async function createEnvFile(config) {
  const envContent = `# ${config.projectName} Environment Variables

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

  return writeJsonFile(path.join(process.cwd(), '.env'), envContent);
}

async function updateProjectConfig(config) {
  const configPath = path.join(process.cwd(), 'template.config.json');
  if (!fileExists(configPath)) return true;

  const templateConfig = readJsonFile(configPath);
  if (!templateConfig) return false;

  templateConfig.projectName = config.projectName;
  templateConfig.createdAt = new Date().toISOString();
  templateConfig.status = 'configured';

  return writeJsonFile(configPath, templateConfig);
}

async function cleanupTemplateFiles() {
  const filesToRemove = [
    'TEMPLATE_README.md',
    'PUBLICATION_GUIDE.md',
    'TEMPLATE_READY.md',
    'INFRASTRUCTURE_COMPLETE.md',
    'FINAL_STATUS_REPORT.md',
    'TESTING-STATUS.md',
    'README_NEW.md',
  ];

  let success = true;
  filesToRemove.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    success = success && deleteFile(filePath);
  });

  // Удаляем сам скрипт настройки после выполнения
  const setupScriptPath = path.join(process.cwd(), 'scripts/setup-project.cjs');
  success = success && deleteFile(setupScriptPath);

  return success;
}

async function setupProject() {
  try {
    const config = await promptConfiguration();

    console.log('\n🔧 Configuring project...\n');

    const tasks = [
      { name: 'Updating package.json', fn: () => updatePackageJson(config) },
      { name: 'Updating HTML title', fn: () => updateHtmlTitle(config.projectName) },
      { name: 'Updating start page', fn: () => updateStartPage(config.projectName) },
      { name: 'Creating project README', fn: () => createProjectReadme(config) },
      { name: 'Setting up environment file', fn: () => createEnvFile(config) },
      { name: 'Updating project configuration', fn: () => updateProjectConfig(config) },
      { name: 'Cleaning up template files', fn: () => cleanupTemplateFiles() },
    ];

    const success = await executeTasks(tasks);

    if (success) {
      console.log(`\n🎉 ${config.projectName} is ready for development!\n`);
      console.log('Next steps:');
      console.log('1. git add .');
      console.log('2. git commit -m "Initial commit"');
      if (config.gitRepo) {
        console.log(`3. git remote add origin ${config.gitRepo}`);
        console.log('4. git push -u origin main');
      }
      console.log('5. npm run dev\n');
      console.log('Happy coding! 🚀');
    } else {
      console.error('\n❌ Setup failed. Please check errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }

  rl.close();
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
  setupProject().catch(console.error);
}

module.exports = { setupProject };
