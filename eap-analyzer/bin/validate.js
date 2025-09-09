#!/usr/bin/env node

/**
 * CLI для запуска валидации исправлений EAP
 */

import { GoldenStandardAnalyzer } from '../dist/analyzer.js';
import { IntegrationTester } from '../dist/testing/integration-tests.js';
import { BugFixValidator } from '../dist/validation/bug-fix-validator.js';
import { MetricsValidator } from '../dist/validation/metrics-validator.js';
import { ValidationReporter } from '../dist/validation/validation-reporter.js';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'validate':
    case 'v':
      await runValidation(args.slice(1));
      break;

    case 'integration':
    case 'int':
      await runIntegrationTests();
      break;

    case 'full':
      await runFullValidationSuite(args.slice(1));
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    default:
      console.log('❌ Неизвестная команда. Используйте --help для справки.');
      process.exit(1);
  }
}

/**
 * Запускает валидацию для конкретного проекта
 */
async function runValidation(args) {
  const projectPath = args[0] || '.';
  const reportFormat = args[1] || 'markdown';
  const outputPath = args[2] || './reports';

  console.log('🔍 ЗАПУСК ВАЛИДАЦИИ ИСПРАВЛЕНИЙ EAP');
  console.log('='.repeat(50));
  console.log(`📂 Проект: ${path.resolve(projectPath)}`);
  console.log(`📄 Формат отчета: ${reportFormat}`);
  console.log(`📁 Путь для отчетов: ${outputPath}`);
  console.log('');

  try {
    const analyzer = new GoldenStandardAnalyzer();

    // Выполняем структурный анализ
    console.log('🔬 Выполняем структурный анализ...');
    const analysisResults = await analyzer.performStructuralAnalysis(projectPath);

    // Выполняем валидацию с генерацией отчета
    console.log('🔍 Выполняем валидацию...');
    const validationResults = await analyzer.validateAnalysisResults(analysisResults, projectPath, {
      generateReport: true,
      reportFormat,
      outputPath,
    });

    // Выводим итоги
    console.log('\n' + '='.repeat(50));
    console.log('🎯 ИТОГИ ВАЛИДАЦИИ:');
    console.log(
      `   ${validationResults.isValid ? '✅ ВАЛИДАЦИЯ ПРОШЛА' : '❌ ВАЛИДАЦИЯ НЕ ПРОШЛА'}`
    );
    console.log(`   🎯 Уровень доверия: ${validationResults.confidence.toFixed(1)}%`);
    console.log(`   🚨 Критические проблемы: ${validationResults.criticalIssues}`);

    if (validationResults.reportPath) {
      console.log(`   📄 Отчет сохранен: ${validationResults.reportPath}`);
    }

    if (!validationResults.isValid) {
      console.log('\n⚠️  ТРЕБУЮТСЯ ДОПОЛНИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ!');
      process.exit(1);
    } else {
      console.log('\n🎉 ВСЕ ИСПРАВЛЕНИЯ РАБОТАЮТ КОРРЕКТНО!');
    }
  } catch (error) {
    console.error('\n❌ ОШИБКА ПРИ ВАЛИДАЦИИ:', error);
    process.exit(1);
  }
}

/**
 * Запускает интеграционные тесты
 */
async function runIntegrationTests() {
  console.log('🧪 ЗАПУСК ИНТЕГРАЦИОННЫХ ТЕСТОВ');
  console.log('='.repeat(50));

  try {
    const tester = new IntegrationTester();
    const results = await tester.runIntegrationTests();

    if (results.failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ОШИБКА ПРИ ТЕСТИРОВАНИИ:', error);
    process.exit(1);
  }
}

/**
 * Запускает полный набор валидации
 */
async function runFullValidationSuite(args) {
  const projectPath = args[0] || '.';

  console.log('🚀 ПОЛНЫЙ НАБОР ВАЛИДАЦИИ EAP');
  console.log('='.repeat(50));

  try {
    // 1. Интеграционные тесты
    console.log('\n1️⃣ Запуск интеграционных тестов...');
    await runIntegrationTests();

    // 2. Валидация проекта
    console.log('\n2️⃣ Валидация проекта...');
    await runValidation([projectPath, 'html', './reports']);

    console.log('\n🎉 ПОЛНАЯ ВАЛИДАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
  } catch (error) {
    console.error('\n❌ ПОЛНАЯ ВАЛИДАЦИЯ ПРОВАЛЕНА:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🔍 EAP Validation CLI - Валидация исправлений критических багов

ИСПОЛЬЗОВАНИЕ:
  npm run validate [команда] [параметры]

КОМАНДЫ:
  validate, v [проект] [формат] [путь]    # Валидация конкретного проекта
  integration, int                        # Интеграционные тесты
  full [проект]                          # Полный набор валидации
  help, --help, -h                       # Показать справку

ПАРАМЕТРЫ:
  проект    - Путь к проекту (по умолчанию: текущая директория)
  формат    - Формат отчета: console, json, html, markdown (по умолчанию: markdown)
  путь      - Путь для сохранения отчетов (по умолчанию: ./reports)

ПРИМЕРЫ:
  npm run validate                                    # Валидация текущего проекта
  npm run validate ../my-project                      # Валидация указанного проекта
  npm run validate . html ./my-reports               # С HTML отчетом
  npm run validate integration                        # Только интеграционные тесты
  npm run validate full ../problematic-project       # Полная валидация

ОПИСАНИЕ:
  Этот инструмент проверяет корректность работы исправлений критических багов EAP:

  ✅ Проверка метрик дупликации (не более 100%)
  ✅ Валидация расчетов сложности
  ✅ Контроль классификации файлов
  ✅ Интеграционные тесты всех компонентов
  ✅ Генерация детальных отчетов

  Если валидация проходит успешно - исправления работают корректно.
  Если есть критические ошибки - требуется дополнительная отладка.
`);
}

main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
