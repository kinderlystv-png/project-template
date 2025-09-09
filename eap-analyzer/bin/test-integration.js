#!/usr/bin/env node

/**
 * CLI для тестирования интеграции структурного анализа
 */

import { GoldenStandardAnalyzer } from '../src/analyzer.js';
import * as path from 'path';

async function testIntegration() {
  const projectPath = process.argv[2] || '.';
  const absolutePath = path.resolve(projectPath);

  console.log('🔬 ТЕСТИРОВАНИЕ ИНТЕГРАЦИИ СТРУКТУРНОГО АНАЛИЗА');
  console.log('='.repeat(60));
  console.log(`📂 Анализируемый проект: ${absolutePath}`);
  console.log('');

  try {
    const analyzer = new GoldenStandardAnalyzer();

    // Тестируем новый структурный анализ
    console.log('🧪 Запуск структурного анализа...');
    const result = await analyzer.performStructuralAnalysis(absolutePath);

    console.log('\n📊 РЕЗУЛЬТАТЫ СТРУКТУРНОГО АНАЛИЗА:');
    console.log('='.repeat(60));

    // Результаты дупликации
    console.log('\n🔄 ДУПЛИКАЦИЯ:');
    console.log(`   📋 Проанализировано файлов: ${result.duplication.analyzedFiles}`);
    console.log(`   📊 Дублированных блоков: ${result.duplication.duplicatedBlocks}`);
    console.log(`   📈 Процент дупликации: ${result.duplication.percentage}%`);
    console.log(`   ✅ Корректность: ${result.duplication.percentage <= 100 ? 'ОК' : 'ОШИБКА!'}`);

    // Результаты сложности
    console.log('\n📊 СЛОЖНОСТЬ:');
    console.log(`   📋 Проанализировано файлов: ${result.complexity.summary.totalFiles}`);
    console.log(`   📈 Средняя цикломатическая: ${result.complexity.summary.avgCyclomatic}`);
    console.log(`   📈 Средняя когнитивная: ${result.complexity.summary.avgCognitive}`);
    console.log(`   📊 Максимальная цикломатическая: ${result.complexity.summary.maxCyclomatic}`);
    console.log(
      `   ✅ Корректность: ${result.complexity.summary.maxCyclomatic < 500 ? 'ОК' : 'ОШИБКА!'}`
    );

    // Результаты классификации
    console.log('\n📁 КЛАССИФИКАЦИЯ ФАЙЛОВ:');
    console.log(`   📋 Всего файлов: ${result.fileClassification.total}`);
    console.log(`   📋 Классифицировано: ${result.fileClassification.classified}`);
    console.log('   📊 По категориям:', result.fileClassification.categories.byCategory);
    console.log('   🛠️ По фреймворкам:', result.fileClassification.categories.byFramework);

    // Детальная информация о файлах со сложностью
    console.log('\n📋 ДЕТАЛИ СЛОЖНОСТИ (топ-5):');
    const topComplexity = result.complexity.files
      .filter(f => f.shouldAnalyze && f.metrics.cyclomatic > 0)
      .sort((a, b) => b.metrics.cyclomatic - a.metrics.cyclomatic)
      .slice(0, 5);

    topComplexity.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.basename(file.file)}`);
      console.log(`      Цикломатическая: ${file.metrics.cyclomatic}`);
      console.log(`      Когнитивная: ${file.metrics.cognitive}`);
      console.log(`      Функций: ${file.metrics.functions.length}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!');

    // Проверка критических ошибок
    const hasIssues =
      result.duplication.percentage > 100 || result.complexity.summary.maxCyclomatic > 1000;

    if (hasIssues) {
      console.log('❌ ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ОШИБКИ В РАСЧЕТАХ!');
      process.exit(1);
    } else {
      console.log('🎉 Все метрики в пределах разумного. Исправления работают!');
    }
  } catch (error) {
    console.error('\n❌ ОШИБКА ПРИ ТЕСТИРОВАНИИ:', error);
    console.error('Стек ошибки:', error.stack);
    process.exit(1);
  }
}

// Справка
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔬 Test Integration - Тестирование интеграции структурного анализа

ИСПОЛЬЗОВАНИЕ:
  npm run test-integration [путь]

ПРИМЕРЫ:
  npm run test-integration                    # Текущая директория
  npm run test-integration ../my-project      # Указанный проект
  npm run test-integration ./src             # Папка с исходниками

ОПИСАНИЕ:
  Тестирует интеграцию улучшенных модулей структурного анализа:
  - Детектор дупликации (исправление >100% дупликации)
  - Калькулятор сложности (исправление невозможных значений)
  - Классификатор файлов (умная фильтрация)
`);
  process.exit(0);
}

testIntegration();
