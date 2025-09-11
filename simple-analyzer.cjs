/**
 * Простой анализатор проекта для тестирования
 */
const fs = require('fs').promises;
const path = require('path');

class SimpleProjectAnalyzer {
  constructor() {
    this.results = [];
  }

  async analyzeProject(projectPath) {
    console.log(`🔍 Анализ проекта: ${projectPath}`);

    try {
      const startTime = Date.now();

      // Проверяем существование директории
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error('Указанный путь не является директорией');
      }

      // Основные проверки
      await this.checkProjectStructure(projectPath);
      await this.checkPackageJson(projectPath);
      await this.checkGitRepository(projectPath);
      await this.analyzeCodeFiles(projectPath);

      const executionTime = Date.now() - startTime;

      // Формируем итоговый отчет
      const report = this.generateReport(projectPath, executionTime);

      console.log('\n' + '='.repeat(60));
      console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА');
      console.log('='.repeat(60));
      console.log(report);

      return {
        success: true,
        projectPath,
        executionTime,
        results: this.results,
        score: this.calculateScore(),
        report,
      };
    } catch (error) {
      console.error('❌ Ошибка анализа:', error.message);
      return {
        success: false,
        error: error.message,
        projectPath,
        results: this.results,
      };
    }
  }

  async checkProjectStructure(projectPath) {
    console.log('📁 Проверка структуры проекта...');

    try {
      const files = await fs.readdir(projectPath);
      const directories = [];
      const codeFiles = [];
      const configFiles = [];

      for (const file of files) {
        const filePath = path.join(projectPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          directories.push(file);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'].includes(ext)) {
            codeFiles.push(file);
          } else if (
            ['.json', '.yml', '.yaml', '.toml', '.config.js'].includes(ext) ||
            file.startsWith('.') ||
            file.includes('config')
          ) {
            configFiles.push(file);
          }
        }
      }

      this.results.push({
        category: 'Структура проекта',
        status: 'success',
        details: {
          totalFiles: files.length,
          directories: directories.length,
          codeFiles: codeFiles.length,
          configFiles: configFiles.length,
          directoryList: directories.slice(0, 10), // Первые 10 папок
          codeFileTypes: this.getFileExtensions(codeFiles),
        },
        score: 100,
        message: `Найдено ${files.length} файлов и папок`,
      });

      console.log(`   ✅ Файлов: ${files.length}`);
      console.log(`   📂 Папок: ${directories.length}`);
      console.log(`   💻 Код файлов: ${codeFiles.length}`);
    } catch (error) {
      this.results.push({
        category: 'Структура проекта',
        status: 'error',
        details: { error: error.message },
        score: 0,
        message: 'Ошибка чтения структуры проекта',
      });
    }
  }

  async checkPackageJson(projectPath) {
    console.log('📦 Проверка package.json...');

    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      const analysis = {
        hasName: !!packageJson.name,
        hasVersion: !!packageJson.version,
        hasDescription: !!packageJson.description,
        hasDependencies: !!packageJson.dependencies,
        hasDevDependencies: !!packageJson.devDependencies,
        hasScripts: !!packageJson.scripts,
        dependencyCount: Object.keys(packageJson.dependencies || {}).length,
        devDependencyCount: Object.keys(packageJson.devDependencies || {}).length,
        scriptCount: Object.keys(packageJson.scripts || {}).length,
      };

      const score = this.calculatePackageScore(analysis);

      this.results.push({
        category: 'Package.json',
        status: 'success',
        details: {
          name: packageJson.name,
          version: packageJson.version,
          ...analysis,
          mainDependencies: Object.keys(packageJson.dependencies || {}).slice(0, 5),
        },
        score,
        message: `Package.json корректен (оценка: ${score}/100)`,
      });

      console.log(`   ✅ Название: ${packageJson.name || 'отсутствует'}`);
      console.log(`   📋 Зависимостей: ${analysis.dependencyCount}`);
      console.log(`   🔧 Dev зависимостей: ${analysis.devDependencyCount}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.results.push({
          category: 'Package.json',
          status: 'warning',
          details: { error: 'Файл не найден' },
          score: 50,
          message: 'package.json не найден',
        });
        console.log('   ⚠️  package.json не найден');
      } else {
        this.results.push({
          category: 'Package.json',
          status: 'error',
          details: { error: error.message },
          score: 0,
          message: 'Ошибка парсинга package.json',
        });
        console.log('   ❌ Ошибка чтения package.json');
      }
    }
  }

  async checkGitRepository(projectPath) {
    console.log('🗂️  Проверка Git репозитория...');

    try {
      const gitPath = path.join(projectPath, '.git');
      await fs.access(gitPath);

      // Дополнительные проверки Git
      const checks = {
        hasGitignore: await this.fileExists(path.join(projectPath, '.gitignore')),
        hasReadme:
          (await this.fileExists(path.join(projectPath, 'README.md'))) ||
          (await this.fileExists(path.join(projectPath, 'readme.md'))),
      };

      const score = 70 + (checks.hasGitignore ? 15 : 0) + (checks.hasReadme ? 15 : 0);

      this.results.push({
        category: 'Git репозиторий',
        status: 'success',
        details: checks,
        score,
        message: `Git репозиторий инициализирован (оценка: ${score}/100)`,
      });

      console.log('   ✅ Git репозиторий найден');
      console.log(`   ${checks.hasGitignore ? '✅' : '⚠️'} .gitignore`);
      console.log(`   ${checks.hasReadme ? '✅' : '⚠️'} README.md`);
    } catch (error) {
      this.results.push({
        category: 'Git репозиторий',
        status: 'warning',
        details: { error: 'Git не инициализирован' },
        score: 30,
        message: 'Git репозиторий не найден',
      });
      console.log('   ⚠️  Git репозиторий не инициализирован');
    }
  }

  async analyzeCodeFiles(projectPath) {
    console.log('💻 Анализ кода...');

    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      const codeStats = {
        totalFiles: codeFiles.length,
        totalLines: 0,
        fileTypes: {},
        largestFiles: [],
      };

      // Анализируем первые 20 файлов для производительности
      const filesToAnalyze = codeFiles.slice(0, 20);

      for (const filePath of filesToAnalyze) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n').length;
          codeStats.totalLines += lines;

          const ext = path.extname(filePath);
          codeStats.fileTypes[ext] = (codeStats.fileTypes[ext] || 0) + 1;

          codeStats.largestFiles.push({
            file: path.relative(projectPath, filePath),
            lines,
          });
        } catch (error) {
          // Пропускаем файлы, которые не удается прочитать
        }
      }

      // Сортируем файлы по размеру
      codeStats.largestFiles.sort((a, b) => b.lines - a.lines);
      codeStats.largestFiles = codeStats.largestFiles.slice(0, 5);

      const score = Math.min(100, Math.max(20, 50 + codeStats.totalFiles * 2));

      this.results.push({
        category: 'Анализ кода',
        status: 'success',
        details: codeStats,
        score,
        message: `Проанализировано ${codeStats.totalFiles} файлов кода`,
      });

      console.log(`   ✅ Файлов кода: ${codeStats.totalFiles}`);
      console.log(`   📝 Строк кода: ${codeStats.totalLines.toLocaleString()}`);
      console.log(`   🔧 Типы файлов: ${Object.keys(codeStats.fileTypes).join(', ')}`);
    } catch (error) {
      this.results.push({
        category: 'Анализ кода',
        status: 'error',
        details: { error: error.message },
        score: 0,
        message: 'Ошибка анализа кода',
      });
    }
  }

  async findCodeFiles(projectPath, maxDepth = 3) {
    const codeFiles = [];
    const codeExtensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.vue',
      '.svelte',
      '.py',
      '.php',
      '.rb',
      '.go',
      '.java',
      '.c',
      '.cpp',
      '.cs',
    ];

    async function scanDirectory(dirPath, currentDepth = 0) {
      if (currentDepth >= maxDepth) return;

      try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          // Пропускаем скрытые папки и node_modules
          if (
            item.startsWith('.') ||
            item === 'node_modules' ||
            item === 'dist' ||
            item === 'build'
          ) {
            continue;
          }

          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            await scanDirectory(itemPath, currentDepth + 1);
          } else if (codeExtensions.includes(path.extname(item).toLowerCase())) {
            codeFiles.push(itemPath);
          }
        }
      } catch (error) {
        // Пропускаем папки, к которым нет доступа
      }
    }

    await scanDirectory(projectPath);
    return codeFiles;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getFileExtensions(files) {
    const extensions = {};
    files.forEach(file => {
      const ext = path.extname(file);
      extensions[ext] = (extensions[ext] || 0) + 1;
    });
    return extensions;
  }

  calculatePackageScore(analysis) {
    let score = 0;

    if (analysis.hasName) score += 20;
    if (analysis.hasVersion) score += 15;
    if (analysis.hasDescription) score += 10;
    if (analysis.hasDependencies) score += 15;
    if (analysis.hasDevDependencies) score += 10;
    if (analysis.hasScripts) score += 15;

    // Бонусы за количество
    if (analysis.dependencyCount > 0) score += Math.min(10, analysis.dependencyCount);
    if (analysis.scriptCount > 0) score += Math.min(5, analysis.scriptCount);

    return Math.min(100, score);
  }

  calculateScore() {
    if (this.results.length === 0) return 0;

    const totalScore = this.results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.results.length);
  }

  generateReport(projectPath, executionTime) {
    const overallScore = this.calculateScore();
    const successfulChecks = this.results.filter(r => r.status === 'success').length;
    const warningChecks = this.results.filter(r => r.status === 'warning').length;
    const errorChecks = this.results.filter(r => r.status === 'error').length;

    let report = `
🎯 Проект: ${path.basename(projectPath)}
📁 Путь: ${projectPath}
⏱️  Время анализа: ${executionTime}ms
📊 Общая оценка: ${overallScore}/100

📈 Статистика проверок:
   ✅ Успешно: ${successfulChecks}
   ⚠️  Предупреждения: ${warningChecks}
   ❌ Ошибки: ${errorChecks}

📋 Детальные результаты:
`;

    this.results.forEach((result, index) => {
      const statusIcon =
        result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';

      report += `\n${index + 1}. ${statusIcon} ${result.category} (${result.score}/100)
   ${result.message}\n`;
    });

    // Рекомендации
    report += '\n💡 Рекомендации:\n';

    if (overallScore >= 80) {
      report += '   🎉 Отличный проект! Продолжайте поддерживать качество.\n';
    } else if (overallScore >= 60) {
      report += '   👍 Хороший проект с возможностями для улучшения.\n';
    } else {
      report += '   🔧 Проект требует доработки и улучшений.\n';
    }

    if (errorChecks > 0) {
      report += '   ⚠️  Устраните критические ошибки в первую очередь.\n';
    }

    if (warningChecks > 0) {
      report += '   📝 Рассмотрите устранение предупреждений.\n';
    }

    return report;
  }
}

// Экспорт для использования в Node.js
module.exports = SimpleProjectAnalyzer;

// Запуск анализатора если файл вызван напрямую
if (require.main === module) {
  const analyzer = new SimpleProjectAnalyzer();

  // Получаем путь из аргументов командной строки
  const projectPath = process.argv[2] || 'C:\\kinderly-events';

  analyzer
    .analyzeProject(projectPath)
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Анализ завершен успешно!');
        process.exit(0);
      } else {
        console.log('\n❌ Анализ завершен с ошибками.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Критическая ошибка:', error);
      process.exit(1);
    });
}
