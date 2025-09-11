#!/usr/bin/env node

/**
 * 🧹 EAP Analyzer Deep Cleanup
 * Специальная очистка папки eap-analyzer от мусорных файлов
 */

const fs = require('fs');
const path = require('path');

class EAPAnalyzerCleaner {
  constructor(eapPath) {
    this.eapPath = eapPath;
    this.toDelete = [];
    this.issues = [];
  }

  analyzeForCleanup() {
    console.log('🔍 Глубокий анализ EAP Analyzer для очистки...\n');

    // 1. ДЕМО И ТЕСТОВЫЕ ФАЙЛЫ
    this.findDemoFiles();

    // 2. ДУБЛИРУЮЩИЕСЯ .js/.ts ПАРЫ
    this.findDuplicatePairs();

    // 3. СТАРЫЕ ОТЧЕТЫ
    this.findOldReports();

    // 4. COMPLETION REPORTS
    this.findCompletionReports();

    // 5. GENERATED FILES
    this.findGeneratedFiles();

    // 6. ЭКСПЕРИМЕНТАЛЬНЫЕ
    this.findExperimentalFiles();

    this.printResults();
  }

  findDemoFiles() {
    console.log('🎭 Поиск демо файлов...');

    const demoFiles = [
      'simple-demo.ts',
      'simple-demo.js',
      'advanced-demo.cjs',
      'src/simple-demo.ts',
      'demo-phase4-integration.cjs',
      'final-demo.mjs',
      'src/modules/structure-analyzer/demo.js',
      'src/reporters/templates/demo.ts',
      'src/reporters/template-demo.ts',
      'demo-report.json',
      'demo-report.md',
    ];

    for (const file of demoFiles) {
      this.checkAndAddForDeletion(file, 'Demo file');
    }
  }

  findDuplicatePairs() {
    console.log('🔄 Поиск дублирующихся .js/.ts пар...');

    // Ищем .js файлы которые имеют .ts версии
    const duplicates = [
      ['dist-cjs/utils/adaptive-thresholds.js', 'src/utils/adaptive-thresholds.ts'],
      ['dist-cjs/utils/file-utils.js', 'src/utils/file-utils.ts'],
      ['dist-cjs/utils/error-handler.js', 'src/utils/error-handler.ts'],
      ['dist-cjs/cli.js', 'src/cli.ts'],
      [
        'dist-cjs/modules/ai-insights/ai-insights-engine-simple.js',
        'src/modules/ai-insights/ai-insights-engine-simple.ts',
      ],
      ['dist-cjs/utils/detailed-roadmap-generator.js', 'src/utils/detailed-roadmap-generator.ts'],
      ['dist-cjs/utils/report-generator.js', 'src/utils/report-generator.ts'],
    ];

    for (const [jsFile, tsFile] of duplicates) {
      if (this.fileExists(jsFile) && this.fileExists(tsFile)) {
        this.checkAndAddForDeletion(jsFile, `Duplicate of ${tsFile}`);
      }
    }
  }

  findOldReports() {
    console.log('📊 Поиск старых отчетов...');

    const oldReports = [
      // Старые анализы с датами
      'reports/analysis_kinderly-events_2025-09-09_13-08-41.json',
      'reports/analysis_kinderly-events_2025-09-09_13-17-20.json',
      'reports/analysis_project-template_2025-09-09_13-14-22.json',
      'reports/analysis_src_2025-09-09_13-08-45.json',
      'reports/analysis___HEYS_2_2025-09-09_13-16-01.json',
      'reports/analysis___HEYS_2_2025-09-09_20-17-08.json',
      'reports/analysis___HEYS_2_2025-09-09_23-16-43.json',

      // Старые роадмапы
      'reports/ROADMAP_kinderly-events_2025-09-09_13-08-41.md',
      'reports/ROADMAP_kinderly-events_2025-09-09_13-17-20.md',
      'reports/ROADMAP_project-template_2025-09-09_13-14-22.md',
      'reports/ROADMAP_src_2025-09-09_13-08-45.md',
      'reports/ROADMAP___HEYS_2_2025-09-09_13-16-01.md',
      'reports/ROADMAP___HEYS_2_2025-09-09_20-17-08.md',

      // Устаревшие отчеты
      'eap-analysis-latest.json',
      'simple-analysis-report.json',
      'ai-analysis-report.json',
      'enhanced-ai-report.json',
      'self-analysis-report.json',
      'reports/validation-report.md',
      'reports/simple-analysis-report.json',
    ];

    for (const file of oldReports) {
      this.checkAndAddForDeletion(file, 'Old report');
    }
  }

  findCompletionReports() {
    console.log('✅ Поиск completion отчетов...');

    const completionReports = [
      'AI-INTEGRATION-COMPLETE.md',
      'src/ai-integration/AI-INTEGRATION-COMPLETE.md',
      'PACKAGE-RENAME-COMPLETE.md',
      'ROADMAP-GENERATION-COMPLETE.md',
      'src/modules/structure-analyzer/INTEGRATION-COMPLETE.md',
      'PHASE-1-COMPLETION-REPORT.md',
      'PHASE-1-2-COMPLETION-REPORT.md',
      'PHASE-2-COMPLETION-REPORT.md',
      'PHASE-3-COMPLETION-REPORT.md',
      'PHASE-4.1-COMPLETION-REPORT.md',
      'PHASE-1.2-CI-CD-COMPLETE.md',
    ];

    for (const file of completionReports) {
      this.checkAndAddForDeletion(file, 'Completion report');
    }
  }

  findGeneratedFiles() {
    console.log('⚙️ Поиск generated файлов...');

    // .svelte-kit файлы вообще не должны анализироваться
    const generatedPatterns = ['.svelte-kit/generated/', '.svelte-kit/ambient.d.ts'];

    // Ищем файлы по паттернам
    this.walkDirectory(this.eapPath, filePath => {
      const relativePath = path.relative(this.eapPath, filePath);

      for (const pattern of generatedPatterns) {
        if (relativePath.includes(pattern)) {
          this.toDelete.push({
            file: relativePath,
            reason: 'Generated file (should not be analyzed)',
            fullPath: filePath,
          });
          break;
        }
      }
    });
  }

  findExperimentalFiles() {
    console.log('🧪 Поиск экспериментальных файлов...');

    const experimentalFiles = [
      'ai-report.md',
      'reports/ЭТАЛОН ОТЧЕТА — копия — копия (2).md',
      'reports/ЧЁТКИЙ РОАДМАП ДЛЯ АПГРЕЙДА до 4,0.md',
      'reports/ETALON_ANALIZ_ROADMAP.md',
      'как пользоваться .md',
      'HOW-TO-USE-SIMPLE.md',
    ];

    for (const file of experimentalFiles) {
      this.checkAndAddForDeletion(file, 'Experimental file');
    }
  }

  checkAndAddForDeletion(relativePath, reason) {
    const fullPath = path.join(this.eapPath, relativePath);

    if (this.fileExists(relativePath)) {
      this.toDelete.push({
        file: relativePath,
        reason: reason,
        fullPath: fullPath,
      });
    }
  }

  fileExists(relativePath) {
    const fullPath = path.join(this.eapPath, relativePath);
    return fs.existsSync(fullPath);
  }

  walkDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.walkDirectory(fullPath, callback);
      } else {
        callback(fullPath);
      }
    }
  }

  printResults() {
    console.log('\n📋 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log(`Найдено файлов для удаления: ${this.toDelete.length}\n`);

    // Группируем по причинам
    const grouped = {};
    for (const item of this.toDelete) {
      if (!grouped[item.reason]) {
        grouped[item.reason] = [];
      }
      grouped[item.reason].push(item.file);
    }

    for (const [reason, files] of Object.entries(grouped)) {
      console.log(`🗑️ ${reason} (${files.length} файлов):`);
      files.slice(0, 5).forEach(file => console.log(`   - ${file}`));
      if (files.length > 5) {
        console.log(`   ... и еще ${files.length - 5} файлов`);
      }
      console.log('');
    }

    console.log('❓ Хотите удалить эти файлы? (Запустите eap-cleaner-execute.js)');

    // Сохраняем список для исполнения
    const cleanupData = {
      timestamp: new Date().toISOString(),
      eapPath: this.eapPath,
      toDelete: this.toDelete,
    };

    fs.writeFileSync(
      path.join(__dirname, 'eap-cleanup-data.json'),
      JSON.stringify(cleanupData, null, 2)
    );
  }
}

// Запуск
const eapPath = process.argv[2] || path.resolve(__dirname, '../eap-analyzer');
const cleaner = new EAPAnalyzerCleaner(eapPath);
cleaner.analyzeForCleanup();
