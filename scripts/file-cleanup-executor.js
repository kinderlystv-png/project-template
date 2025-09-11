#!/usr/bin/env node

/**
 * 🧹 EAP Project File Cleanup Tool
 * Безопасное удаление файлов на основе анализа
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class FileCleanupExecutor {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.deletedFiles = [];
    this.skippedFiles = [];
    this.errors = [];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async executeCleanup() {
    console.log('🧹 Начинаю процесс очистки проекта...\n');

    try {
      // Создаем резервную ветку
      await this.createBackupBranch();

      // Фаза 1: Удаляем безопасные файлы
      await this.phase1_SafeFiles();

      // Фаза 2: Удаляем дублирующиеся .js файлы (оставляем .ts)
      await this.phase2_DuplicateJS();

      // Фаза 3: Интерактивная проверка сомнительных файлов
      await this.phase3_InteractiveReview();

      // Финальный отчет
      this.generateFinalReport();
    } catch (error) {
      console.error('❌ Ошибка процесса очистки:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async createBackupBranch() {
    console.log('🔒 Создание резервной ветки...');

    try {
      const currentBranch = execSync('git branch --show-current', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();

      const backupBranchName = `backup-before-cleanup-${new Date().getTime()}`;

      execSync(`git checkout -b ${backupBranchName}`, { cwd: this.projectRoot });
      execSync(`git checkout ${currentBranch}`, { cwd: this.projectRoot });

      console.log(`✅ Создана резервная ветка: ${backupBranchName}\n`);
    } catch (error) {
      console.log('⚠️ Не удалось создать резервную ветку (возможно, не git репозиторий)\n');
    }
  }

  async phase1_SafeFiles() {
    console.log('🟢 ФАЗА 1: Удаление безопасных файлов');
    console.log('=======================================\n');

    const safeFiles = [
      // Старые отчеты
      'DOCKER-IMPLEMENTATION-COMPLETE.md',
      'EAP-IMPLEMENTATION-COMPLETE.md',
      'ENVIRONMENT_SETUP_COMPLETE.md',
      'INFRASTRUCTURE_COMPLETE.md',
      'JEST-TESTING-FINAL-STATUS.md',
      'IMPLEMENTATION-V3-COMPLETE.md',

      // Фазовые отчеты
      'PHASE-1-COMPLETE.md',
      'PHASE-1.1-COMPLETION-REPORT.md',
      'PHASE-1.1-JEST-COMPLETION-REPORT.md',
      'PHASE-1.1-SUMMARY.md',
      'PHASE-2-COMPLETION-REPORT.md',
      'PHASE-2-PROGRESS.md',
      'PHASE-2-STAGE-1-COMPLETE.md',
      'PHASE-2-STAGE-1-SUCCESS-REPORT.md',
      'PHASE-2.1-COMPLETION-REPORT-CLEAN.md',
      'PHASE-2.1-COMPLETION-REPORT.md',
      'PHASE-2.2-COMPLETION-REPORT.md',
      'PHASE-3-COMPLETION-REPORT.md',
      'PHASE-4-COMPLETION-REPORT.md',
      'PHASE-4-SUCCESS.md',
      'PHASE-4.2-COMPLETE-FINAL.md',
      'PHASE-4.2-COMPLETION-REPORT.md',
      'PHASE-4.2-FINAL-TEST-REPORT.md',
      'PHASE-4.2-SUCCESS-REPORT.md',
      'PHASE-5-TECHNICAL-PLAN.md',
      'PHASE-5.1.1-COMPLETION-REPORT.md',
      'PHASE-5.1.1-PROGRESS.md',
      'PHASE-5.2-5.3-TECHNICAL-PLAN.md',
      'PHASE-5.2.1-COMPLETION-REPORT.md',
      'PHASE-5.2.1-PROGRESS.md',
      'PHASE-5.2.2-CRITICAL-ASSESSMENT.md',
      'PHASE-5.2.2-INTEGRATION-PLAN.md',
      'PHASE-5.2.2-TASK-1.1-COMPLETE.md',
      'PHASE-5.2.2-TASK-1.2-COMPLETE.md',
      'PHASE-5.2.2-TASK-1.3-COMPLETE.md',
      'PHASE-5.2.2-TECHNICAL-PLAN.md',
      'PHASE-6-COMPLETION-REPORT.md',

      // Демо файлы
      'phase1-demo.cjs',
      'task2-2-runtime-demo.js',

      // Старые анализы
      'advanced-analysis-report.md',
      'eap-analysis-latest.json',
      'eap-analysis-report.json',
      'EAP-ANALYZER-FINAL-STATUS-REPORT.md',
      'EAP-ANALYZER-FINAL-STATUS.md',
      'EAP-ANALYZER-FULL-COMPONENT-CATALOG.md',
      'eap-analyzer-real-status.json',
      'eap-analyzer-v5-metrics.json',
      'EAP-ANALYZER-v6-TECHNICAL-PLAN.md',
      'EAP-ANALYZER-ИТОГОВАЯ-ОЦЕНКА-v5.0.md',
      'EAP-CATEGORIES-STATUS-ANALYSIS.md',
      'EAP-CATEGORIES-SUMMARY.md',
      'EXTENDED-ARCHITECTURE-v3.md',
      'FINAL_STATUS_REPORT.md',
      'GITHUB-ISSUES-TECHNICAL-DEBT.md',
      'optimization-status-final.json',
      'optimization-status.json',

      // Бекапы
      'index.html.backup',
    ];

    console.log(`Буду удалять ${safeFiles.length} файлов...\n`);

    for (const file of safeFiles) {
      await this.deleteFile(file, 'Safe file cleanup');
    }

    console.log(`✅ Фаза 1 завершена. Удалено ${this.deletedFiles.length} файлов\n`);
  }

  async phase2_DuplicateJS() {
    console.log('🟡 ФАЗА 2: Удаление дублирующихся .js файлов');
    console.log('==========================================\n');

    const duplicatePairs = [
      ['task2-2-runtime-demo.js', 'task2-2-runtime-demo.ts'],
      [
        'eap-analyzer/src/checkers/testing/UnifiedTestingAnalyzer.js',
        'eap-analyzer/src/checkers/testing/UnifiedTestingAnalyzer.ts',
      ],
      [
        'eap-analyzer/src/utils/adaptive-thresholds.js',
        'eap-analyzer/src/utils/adaptive-thresholds.ts',
      ],
      ['eap-analyzer/src/utils/error-handler.js', 'eap-analyzer/src/utils/error-handler.ts'],
      ['eap-analyzer/src/utils/file-utils.js', 'eap-analyzer/src/utils/file-utils.ts'],
      ['src/constants/test-ids.js', 'src/constants/test-ids.ts'],
      ['test-security-checker.js', 'test-security-checker.ts'],
      ['tests/fixtures/factories.js', 'tests/fixtures/factories.ts'],
    ];

    console.log('Удаляю .js версии (оставляю .ts версии)...\n');

    for (const [jsFile, tsFile] of duplicatePairs) {
      const jsPath = path.join(this.projectRoot, jsFile);
      const tsPath = path.join(this.projectRoot, tsFile);

      // Проверяем что .ts файл существует
      if (fs.existsSync(tsPath)) {
        await this.deleteFile(jsFile, `Duplicate of ${tsFile}`);
      } else {
        console.log(`⚠️ Пропускаю ${jsFile} - .ts версия не найдена`);
        this.skippedFiles.push({
          file: jsFile,
          reason: '.ts version not found',
        });
      }
    }

    console.log(`✅ Фаза 2 завершена. Удалено дублирующихся файлов: ${duplicatePairs.length}\n`);
  }

  async phase3_InteractiveReview() {
    console.log('🔍 ФАЗА 3: Интерактивная проверка сомнительных файлов');
    console.log('=====================================================\n');

    const reviewFiles = [
      'vite.config.js', // Есть .ts версия
      'vitest.config.js', // Есть .ts версия
      'commitlint.config.cjs', // Дублируется с .js
      'commitlint.config.js',
    ];

    for (const file of reviewFiles) {
      const shouldDelete = await this.askUserConfirmation(
        `Удалить файл "${file}"?`,
        'Этот файл может быть дублирующимся или устаревшим'
      );

      if (shouldDelete) {
        await this.deleteFile(file, 'User confirmed deletion');
      } else {
        this.skippedFiles.push({
          file,
          reason: 'User chose to keep',
        });
      }
    }

    console.log(`✅ Фаза 3 завершена.\n`);
  }

  async deleteFile(relativePath, reason) {
    const fullPath = path.join(this.projectRoot, relativePath);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Удален: ${relativePath}`);
        this.deletedFiles.push({
          file: relativePath,
          reason: reason,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`⚠️ Файл не найден: ${relativePath}`);
        this.skippedFiles.push({
          file: relativePath,
          reason: 'File not found',
        });
      }
    } catch (error) {
      console.error(`❌ Ошибка удаления ${relativePath}:`, error.message);
      this.errors.push({
        file: relativePath,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async askUserConfirmation(question, details) {
    console.log(`\n${details}`);
    return new Promise(resolve => {
      this.rl.question(`${question} (y/N): `, answer => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  generateFinalReport() {
    console.log('\n📊 ФИНАЛЬНЫЙ ОТЧЕТ');
    console.log('==================\n');

    console.log(`✅ Удалено файлов: ${this.deletedFiles.length}`);
    console.log(`⚠️ Пропущено файлов: ${this.skippedFiles.length}`);
    console.log(`❌ Ошибок: ${this.errors.length}\n`);

    // Сохраняем детальный отчет
    const reportPath = path.join(this.projectRoot, 'cleanup-execution-report.md');

    let report = `# 🧹 Отчет по выполнению очистки проекта

Дата выполнения: ${new Date().toLocaleString('ru-RU')}

## 📊 Сводка

- **Удалено файлов**: ${this.deletedFiles.length}
- **Пропущено файлов**: ${this.skippedFiles.length}
- **Ошибок**: ${this.errors.length}

## ✅ Удаленные файлы

`;

    for (const item of this.deletedFiles) {
      report += `- \`${item.file}\` - ${item.reason}\n`;
    }

    if (this.skippedFiles.length > 0) {
      report += `\n## ⚠️ Пропущенные файлы

`;
      for (const item of this.skippedFiles) {
        report += `- \`${item.file}\` - ${item.reason}\n`;
      }
    }

    if (this.errors.length > 0) {
      report += `\n## ❌ Ошибки

`;
      for (const item of this.errors) {
        report += `- \`${item.file}\` - ${item.error}\n`;
      }
    }

    fs.writeFileSync(reportPath, report);

    console.log(`📄 Детальный отчет сохранен: ${reportPath}`);
    console.log('\n🎯 Рекомендации:');
    console.log('1. Проверьте работу проекта');
    console.log('2. Запустите тесты');
    console.log('3. Сделайте коммит изменений');
    console.log('4. При проблемах используйте резервную ветку для восстановления');
  }
}

// Запуск очистки
const projectRoot = process.argv[2] || process.cwd();
console.log(`🎯 Очистка проекта: ${projectRoot}\n`);

const executor = new FileCleanupExecutor(projectRoot);
executor.executeCleanup().catch(console.error);
