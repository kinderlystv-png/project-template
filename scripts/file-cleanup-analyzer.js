#!/usr/bin/env node

/**
 * 🧹 EAP Project File Cleanup Analyzer
 * Анализирует файлы проекта для выявления кандидатов на удаление
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FileCleanupAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.analysisResults = {
      duplicates: [],
      oldReports: [],
      generatedFiles: [],
      experimentalFiles: [],
      unusedFiles: [],
      safeToDelete: [],
      requiresReview: [],
    };
  }

  async analyzeProject() {
    console.log('🔍 Начинаю анализ файлов проекта...\n');

    try {
      await this.findDuplicateFiles();
      await this.findOldReports();
      await this.findGeneratedFiles();
      await this.findExperimentalFiles();
      await this.checkFileUsage();

      this.categorizeResults();
      this.generateReport();
    } catch (error) {
      console.error('❌ Ошибка анализа:', error.message);
    }
  }

  async findDuplicateFiles() {
    console.log('📂 Поиск дублирующихся файлов (.js/.ts пары)...');

    const allFiles = this.getAllFiles(this.projectRoot);
    const duplicatePairs = new Map();

    for (const file of allFiles) {
      const ext = path.extname(file);
      const baseName = file.slice(0, -ext.length);

      if (ext === '.js') {
        const tsVersion = baseName + '.ts';
        if (allFiles.includes(tsVersion)) {
          duplicatePairs.set(file, tsVersion);
        }
      }
    }

    this.analysisResults.duplicates = Array.from(duplicatePairs.entries());
    console.log(`   Найдено ${this.analysisResults.duplicates.length} дублирующихся пар\n`);
  }

  async findOldReports() {
    console.log('📊 Поиск старых отчетов и временных файлов...');

    const reportPatterns = [
      /analysis_.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      /ROADMAP_.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md$/,
      /PHASE-\d+.*REPORT.*\.md$/,
      /.*demo.*report.*\.(json|md)$/i,
      /.*-COMPLETE\.md$/,
      /.*SUMMARY\.md$/,
    ];

    const allFiles = this.getAllFiles(this.projectRoot);

    for (const file of allFiles) {
      const fileName = path.basename(file);
      const stats = fs.statSync(file);
      const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      // Проверяем паттерны старых отчетов
      for (const pattern of reportPatterns) {
        if (pattern.test(fileName)) {
          this.analysisResults.oldReports.push({
            file,
            reason: `Matches pattern: ${pattern.source}`,
            age: Math.floor(daysSinceModified),
            size: stats.size,
          });
          break;
        }
      }

      // Файлы старше 30 дней в папке reports
      if (file.includes('/reports/') && daysSinceModified > 30) {
        this.analysisResults.oldReports.push({
          file,
          reason: 'Old report file (>30 days)',
          age: Math.floor(daysSinceModified),
          size: stats.size,
        });
      }
    }

    console.log(`   Найдено ${this.analysisResults.oldReports.length} старых отчетов\n`);
  }

  async findGeneratedFiles() {
    console.log('⚙️ Поиск сгенерированных файлов...');

    const generatedPatterns = [
      /\.svelte-kit\//,
      /dist-cjs\//,
      /node_modules\//,
      /\.map$/,
      /\.d\.ts$/,
      /generated/,
    ];

    const allFiles = this.getAllFiles(this.projectRoot);

    for (const file of allFiles) {
      for (const pattern of generatedPatterns) {
        if (pattern.test(file)) {
          this.analysisResults.generatedFiles.push({
            file,
            reason: `Generated file: ${pattern.source}`,
          });
          break;
        }
      }
    }

    console.log(
      `   Найдено ${this.analysisResults.generatedFiles.length} сгенерированных файлов\n`
    );
  }

  async findExperimentalFiles() {
    console.log('🧪 Поиск экспериментальных файлов...');

    const experimentalPatterns = [
      /demo(?!.*test)/i,
      /test.*demo/i,
      /simple.*demo/i,
      /example/i,
      /temp/i,
      /tmp/i,
      /-copy/i,
      /копия/i,
      /backup/i,
    ];

    const allFiles = this.getAllFiles(this.projectRoot);

    for (const file of allFiles) {
      const fileName = path.basename(file);

      for (const pattern of experimentalPatterns) {
        if (pattern.test(fileName)) {
          this.analysisResults.experimentalFiles.push({
            file,
            reason: `Experimental: ${pattern.source}`,
          });
          break;
        }
      }
    }

    console.log(
      `   Найдено ${this.analysisResults.experimentalFiles.length} экспериментальных файлов\n`
    );
  }

  async checkFileUsage() {
    console.log('🔗 Проверка использования файлов в коде...');

    try {
      // Используем git grep для поиска упоминаний файлов
      const jsFiles = this.getAllFiles(this.projectRoot).filter(
        f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.json')
      );

      for (const file of jsFiles.slice(0, 50)) {
        // Ограничиваем для производительности
        const fileName = path.basename(file, path.extname(file));

        try {
          const grepResult = execSync(
            `git grep -l "${fileName}" -- "*.js" "*.ts" "*.json" "*.md"`,
            { cwd: this.projectRoot, encoding: 'utf8' }
          );

          if (!grepResult.trim()) {
            this.analysisResults.unusedFiles.push({
              file,
              reason: 'No references found in codebase',
            });
          }
        } catch (e) {
          // Файл не найден в коде
          if (e.status === 1) {
            this.analysisResults.unusedFiles.push({
              file,
              reason: 'No references found in codebase',
            });
          }
        }
      }
    } catch (error) {
      console.log('   ⚠️ Git grep недоступен, пропускаем проверку использования');
    }

    console.log(`   Найдено ${this.analysisResults.unusedFiles.length} неиспользуемых файлов\n`);
  }

  categorizeResults() {
    console.log('📋 Категоризация результатов...');

    // Файлы безопасные для удаления
    const safePatterns = [
      /\.md$/, // Большинство markdown файлов
      /reports\/.*\.json$/, // Старые отчеты
      /PHASE-.*\.md$/, // Фазовые отчеты
      /demo.*\.(js|ts)$/, // Демо файлы
    ];

    // Объединяем все найденные файлы
    const allCandidates = [
      ...this.analysisResults.duplicates.map(([js, ts]) => ({
        file: js,
        reason: 'Duplicate JS file',
      })),
      ...this.analysisResults.oldReports,
      ...this.analysisResults.experimentalFiles,
      ...this.analysisResults.unusedFiles,
    ];

    for (const candidate of allCandidates) {
      const file = candidate.file;
      let isSafe = false;

      // Проверяем безопасные паттерны
      for (const pattern of safePatterns) {
        if (pattern.test(file)) {
          isSafe = true;
          break;
        }
      }

      // Исключаем важные конфигурационные файлы
      const criticalFiles = [
        'package.json',
        'tsconfig.json',
        'vite.config',
        'eslint.config',
        '.gitignore',
        'README.md',
      ];

      const isCritical = criticalFiles.some(critical => path.basename(file).includes(critical));

      if (isCritical) {
        continue; // Не трогаем критические файлы
      }

      if (isSafe) {
        this.analysisResults.safeToDelete.push(candidate);
      } else {
        this.analysisResults.requiresReview.push(candidate);
      }
    }

    console.log(`   Безопасно удалить: ${this.analysisResults.safeToDelete.length}`);
    console.log(`   Требует проверки: ${this.analysisResults.requiresReview.length}\n`);
  }

  generateReport() {
    console.log('📄 Генерация отчета...\n');

    const reportPath = path.join(this.projectRoot, 'cleanup-analysis-report.md');

    let report = `# 🧹 Отчет по анализу файлов для очистки проекта

Дата анализа: ${new Date().toLocaleString('ru-RU')}

## 📊 Сводка

- **Дублирующиеся файлы**: ${this.analysisResults.duplicates.length}
- **Старые отчеты**: ${this.analysisResults.oldReports.length}
- **Сгенерированные файлы**: ${this.analysisResults.generatedFiles.length}
- **Экспериментальные файлы**: ${this.analysisResults.experimentalFiles.length}
- **Неиспользуемые файлы**: ${this.analysisResults.unusedFiles.length}

### 🎯 Рекомендации
- **Безопасно удалить**: ${this.analysisResults.safeToDelete.length} файлов
- **Требует проверки**: ${this.analysisResults.requiresReview.length} файлов

## 🟢 Файлы безопасные для удаления

`;

    for (const item of this.analysisResults.safeToDelete) {
      report += `- \`${item.file}\` - ${item.reason}\n`;
    }

    report += `\n## 🟡 Файлы требующие проверки

`;

    for (const item of this.analysisResults.requiresReview.slice(0, 20)) {
      report += `- \`${item.file}\` - ${item.reason}\n`;
    }

    if (this.analysisResults.requiresReview.length > 20) {
      report += `\n... и еще ${this.analysisResults.requiresReview.length - 20} файлов\n`;
    }

    report += `\n## 📋 Дублирующиеся файлы (.js/.ts пары)

`;

    for (const [js, ts] of this.analysisResults.duplicates) {
      report += `- JS: \`${js}\`\n- TS: \`${ts}\`\n\n`;
    }

    fs.writeFileSync(reportPath, report);

    console.log(`✅ Отчет сохранен: ${reportPath}`);
    console.log('\n🎯 Следующие шаги:');
    console.log('1. Просмотрите отчет');
    console.log('2. Подтвердите файлы для удаления');
    console.log('3. Запустите скрипт удаления');
  }

  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Пропускаем служебные папки
        if (!['node_modules', '.git', '.svelte-kit', 'dist'].includes(file)) {
          this.getAllFiles(filePath, fileList);
        }
      } else {
        fileList.push(filePath.replace(this.projectRoot + path.sep, '').replace(/\\/g, '/'));
      }
    }

    return fileList;
  }
}

// Запуск анализа
const projectRoot = process.argv[2] || process.cwd();
const analyzer = new FileCleanupAnalyzer(projectRoot);
analyzer.analyzeProject().catch(console.error);
