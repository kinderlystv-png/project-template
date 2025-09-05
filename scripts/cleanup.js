/**
 * Project Cleanup Script
 * Очистка проекта от временных файлов и оптимизация зависимостей
 */

const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');

const CLEANUP_PATTERNS = [
  // Временные файлы
  'node_modules/.cache',
  'dist',
  'build',
  '.svelte-kit',

  // Логи и отчеты
  'coverage',
  'test-results',
  'logs',
  '*.log',

  // IDE файлы
  '.vscode/settings.json',
  '.idea',

  // OS файлы
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',

  // Backup файлы
  '*.bak',
  '*.backup',
  '*.tmp',

  // Lock файлы (кроме package-lock.json)
  'yarn.lock',
  'pnpm-lock.yaml',
];

async function cleanupFiles() {
  console.log('🧹 Starting project cleanup...');

  let cleanedCount = 0;
  let totalSize = 0;

  for (const pattern of CLEANUP_PATTERNS) {
    try {
      const files = await findFiles(pattern);

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;

          if (stats.isDirectory()) {
            await fs.rm(file, { recursive: true, force: true });
          } else {
            await fs.unlink(file);
          }

          cleanedCount++;
          console.log(`  ✅ Removed: ${file}`);
        } catch (error) {
          console.warn(`  ⚠️  Could not remove ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      // Файл/паттерн не найден - это нормально
    }
  }

  console.log(`\n📊 Cleanup completed:`);
  console.log(`  Files/directories removed: ${cleanedCount}`);
  console.log(`  Space freed: ${formatBytes(totalSize)}`);
}

async function findFiles(pattern) {
  const files = [];

  if (pattern.includes('*')) {
    // Glob pattern - упрощенная реализация
    const dir = pattern.includes('/') ? path.dirname(pattern) : '.';
    const fileName = path.basename(pattern);

    try {
      const dirFiles = await fs.readdir(dir);
      for (const file of dirFiles) {
        if (matchesPattern(file, fileName)) {
          files.push(path.join(dir, file));
        }
      }
    } catch {
      // Директория не найдена
    }
  } else {
    // Точное имя файла/директории
    try {
      await fs.access(pattern);
      files.push(pattern);
    } catch {
      // Файл не найден
    }
  }

  return files;
}

function matchesPattern(fileName, pattern) {
  if (pattern === '*') return true;
  if (pattern.startsWith('*.')) {
    return fileName.endsWith(pattern.slice(1));
  }
  return fileName === pattern;
}

async function analyzePackages() {
  console.log('\n📦 Analyzing package dependencies...');

  try {
    // Проверяем outdated пакеты
    console.log('  🔍 Checking for outdated packages...');
    const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedPackages = JSON.parse(outdated || '{}');

    if (Object.keys(outdatedPackages).length > 0) {
      console.log('  📊 Outdated packages found:');
      for (const [pkg, info] of Object.entries(outdatedPackages)) {
        console.log(`    ${pkg}: ${info.current} → ${info.latest}`);
      }
      console.log('  💡 Run "npm update" to update packages');
    } else {
      console.log('  ✅ All packages are up to date');
    }
  } catch (error) {
    console.log('  ℹ️  No outdated packages found');
  }

  try {
    // Проверяем неиспользуемые зависимости
    console.log('\n  🔍 Checking for unused dependencies...');
    execSync('npx depcheck --json > depcheck-report.json', { stdio: 'ignore' });

    const depcheckReport = JSON.parse(await fs.readFile('depcheck-report.json', 'utf8'));

    if (depcheckReport.dependencies && depcheckReport.dependencies.length > 0) {
      console.log('  📊 Unused dependencies found:');
      depcheckReport.dependencies.forEach(dep => {
        console.log(`    ${dep}`);
      });
      console.log('  💡 Consider removing unused dependencies');
    } else {
      console.log('  ✅ No unused dependencies found');
    }

    // Удаляем временный файл
    await fs.unlink('depcheck-report.json').catch(() => {});
  } catch (error) {
    console.log('  ℹ️  Could not check unused dependencies (depcheck not available)');
  }
}

async function optimizeNodeModules() {
  console.log('\n🔧 Optimizing node_modules...');

  try {
    // Очищаем npm cache
    console.log('  🧹 Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });

    // Проверяем и исправляем зависимости
    console.log('  🔧 Running npm audit fix...');
    try {
      execSync('npm audit fix --force', { stdio: 'inherit' });
      console.log('  ✅ Security issues fixed');
    } catch (error) {
      console.log('  ℹ️  No security issues found or could not be auto-fixed');
    }

    // Переустанавливаем зависимости
    console.log('  📦 Reinstalling dependencies...');
    await fs.rm('node_modules', { recursive: true, force: true });
    execSync('npm install', { stdio: 'inherit' });

    console.log('  ✅ Dependencies optimized');
  } catch (error) {
    console.error('  ❌ Error optimizing dependencies:', error.message);
  }
}

async function generateCleanupReport() {
  console.log('\n📋 Generating cleanup report...');

  const report = {
    timestamp: new Date().toISOString(),
    cleanupPatterns: CLEANUP_PATTERNS,
    projectSize: await getDirectorySize('.'),
    nodeModulesSize: await getDirectorySize('node_modules'),
    recommendations: [],
  };

  // Добавляем рекомендации
  if (report.nodeModulesSize > 500 * 1024 * 1024) {
    // 500MB
    report.recommendations.push('Consider using npm ci for faster installs');
    report.recommendations.push('Review dependencies for unused packages');
  }

  if (
    await fs
      .access('.git')
      .then(() => true)
      .catch(() => false)
  ) {
    report.recommendations.push('Use .gitignore to exclude temporary files');
  }

  await fs.writeFile('cleanup-report.json', JSON.stringify(report, null, 2));
  console.log('  ✅ Report saved to cleanup-report.json');

  console.log(`\n📊 Project Statistics:`);
  console.log(`  Total project size: ${formatBytes(report.projectSize)}`);
  console.log(`  node_modules size: ${formatBytes(report.nodeModulesSize)}`);
  console.log(`  Recommendations: ${report.recommendations.length}`);
}

async function getDirectorySize(dirPath) {
  try {
    let totalSize = 0;
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    full: args.includes('--full'),
    analyze: args.includes('--analyze'),
    optimize: args.includes('--optimize'),
    report: args.includes('--report'),
  };

  console.log('🚀 Project Cleanup Utility v1.0\n');

  if (args.includes('--help')) {
    console.log('Usage: node scripts/cleanup.js [options]');
    console.log('\nOptions:');
    console.log('  --full      Full cleanup including node_modules reinstall');
    console.log('  --analyze   Analyze dependencies for optimization');
    console.log('  --optimize  Optimize node_modules');
    console.log('  --report    Generate cleanup report');
    console.log('  --help      Show this help message');
    return;
  }

  // Базовая очистка файлов
  await cleanupFiles();

  if (options.analyze || options.full) {
    await analyzePackages();
  }

  if (options.optimize || options.full) {
    await optimizeNodeModules();
  }

  if (options.report || options.full) {
    await generateCleanupReport();
  }

  console.log('\n🎉 Cleanup completed successfully!');

  if (!options.full && !options.analyze && !options.optimize && !options.report) {
    console.log('\n💡 For more options, run: node scripts/cleanup.js --help');
  }
}

main().catch(console.error);
