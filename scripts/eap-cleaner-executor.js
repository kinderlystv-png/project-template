#!/usr/bin/env node

/**
 * 🧹 EAP Analyzer Cleanup Executor
 * Исполняет удаление файлов найденных анализатором
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EAPCleanupExecutor {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.deleted = [];
    this.errors = [];
  }

  async execute() {
    console.log('🗑️ EAP Analyzer Cleanup Executor\n');

    try {
      // Загружаем данные для очистки
      const dataPath = path.join(__dirname, 'eap-cleanup-data.json');

      if (!fs.existsSync(dataPath)) {
        console.log('❌ Файл данных не найден. Сначала запустите eap-cleaner-analyzer.js');
        return;
      }

      const cleanupData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      console.log(`📁 EAP путь: ${cleanupData.eapPath}`);
      console.log(`📅 Анализ от: ${new Date(cleanupData.timestamp).toLocaleString('ru-RU')}`);
      console.log(`🗑️ Файлов к удалению: ${cleanupData.toDelete.length}\n`);

      // Показываем превью
      this.showPreview(cleanupData.toDelete);

      // Спрашиваем подтверждение
      const confirmed = await this.askConfirmation(
        `Удалить ${cleanupData.toDelete.length} файлов из EAP Analyzer?`
      );

      if (!confirmed) {
        console.log('❌ Отменено пользователем');
        return;
      }

      // Выполняем удаление
      await this.performCleanup(cleanupData.toDelete);

      // Генерируем отчет
      this.generateReport();
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    } finally {
      this.rl.close();
    }
  }

  showPreview(toDelete) {
    console.log('📋 ПРЕВЬЮ УДАЛЕНИЯ:\n');

    // Группируем по типам
    const grouped = {};
    for (const item of toDelete) {
      if (!grouped[item.reason]) {
        grouped[item.reason] = [];
      }
      grouped[item.reason].push(item.file);
    }

    for (const [reason, files] of Object.entries(grouped)) {
      console.log(`🗂️ ${reason}: ${files.length} файлов`);
      files.slice(0, 3).forEach(file => console.log(`   • ${file}`));
      if (files.length > 3) {
        console.log(`   ... и еще ${files.length - 3}`);
      }
      console.log('');
    }
  }

  async askConfirmation(question) {
    return new Promise(resolve => {
      this.rl.question(`${question} (y/N): `, answer => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async performCleanup(toDelete) {
    console.log('🗑️ Начинаю удаление файлов...\n');

    for (const item of toDelete) {
      try {
        if (fs.existsSync(item.fullPath)) {
          fs.unlinkSync(item.fullPath);
          console.log(`✅ Удален: ${item.file}`);
          this.deleted.push(item);
        } else {
          console.log(`⚠️ Файл не найден: ${item.file}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка удаления ${item.file}:`, error.message);
        this.errors.push({
          file: item.file,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Удалено: ${this.deleted.length} файлов`);
    console.log(`❌ Ошибок: ${this.errors.length}`);
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../eap-cleanup-execution-report.md');

    let report = `# 🧹 Отчет по очистке EAP Analyzer

Дата выполнения: ${new Date().toLocaleString('ru-RU')}

## 📊 Сводка

- **Удалено файлов**: ${this.deleted.length}
- **Ошибок**: ${this.errors.length}

## ✅ Удаленные файлы

`;

    for (const item of this.deleted) {
      report += `- \`${item.file}\` - ${item.reason}\n`;
    }

    if (this.errors.length > 0) {
      report += `\n## ❌ Ошибки

`;
      for (const error of this.errors) {
        report += `- \`${error.file}\` - ${error.error}\n`;
      }
    }

    report += `\n## 🎯 Результат

EAP Analyzer очищен от ${this.deleted.length} ненужных файлов.
Рекомендуется перегенерировать отчет командой: \`node live-generator.cjs\`
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Отчет сохранен: ${reportPath}`);
  }
}

// Запуск
const executor = new EAPCleanupExecutor();
executor.execute().catch(console.error);
