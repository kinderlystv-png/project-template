#!/usr/bin/env node
/**
 * Тестирование CoverageAnalyzer на проекте kinderly-events
 */

import { CoverageAnalyzer } from './eap-analyzer/src/checkers/testing/checkers/CoverageAnalyzer';
import { Project } from './eap-analyzer/src/types/Project';

async function testCoverageAnalyzer() {
  console.log('🧪 Тестирование CoverageAnalyzer на проекте kinderly-events');
  console.log('='.repeat(60));

  try {
    // Инициализируем анализатор
    const analyzer = new CoverageAnalyzer();
    console.log(`📊 Анализатор: ${analyzer.name}`);
    console.log(`📝 Описание: ${analyzer.description}`);
    console.log(`🎯 Категория: ${analyzer.category}`);
    console.log();

    // Создаем проект kinderly
    const kindlerlyPath = 'C:\\kinderly-events';
    console.log(`📁 Анализируемый проект: ${kindlerlyPath}`);

    // Проверяем существование папки
    const fs = await import('fs/promises');
    try {
      await fs.access(kindlerlyPath);
      console.log('✅ Проект найден');
    } catch (error) {
      console.log('❌ Проект не найден, используем текущий проект для демонстрации');
      const currentPath = process.cwd();
      console.log(`📁 Используем: ${currentPath}`);
    }

    // Создаем объект Project
    const project: Project = {
      name: 'kinderly-events',
      path: kindlerlyPath,
      packageJsonPath: `${kindlerlyPath}/package.json`,
      dependencies: [], // Будет загружено автоматически
      devDependencies: [],
      scripts: {},
      files: [],
      testFiles: [],
      configFiles: [],
      version: '1.0.0',
      type: 'web',
    };

    console.log();
    console.log('🔍 Запуск анализа покрытия...');
    console.log('-'.repeat(40));

    // Выполняем анализ
    const startTime = Date.now();
    const results = await analyzer.check(project);
    const endTime = Date.now();

    console.log(`⏱️ Время выполнения: ${endTime - startTime}ms`);
    console.log(`📊 Результатов: ${results.length}`);
    console.log();

    // Выводим результаты
    results.forEach((result, index) => {
      console.log(`📋 Результат ${index + 1}:`);
      console.log(`   🎯 Имя: ${result.name}`);
      console.log(`   ⚠️ Серьезность: ${result.severity}`);
      console.log(`   📝 Сообщение: ${result.message}`);
      console.log(`   ✅ Пройден: ${result.passed ? 'Да' : 'Нет'}`);

      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   📋 Детали:`);
        Object.entries(result.details).forEach(([key, value]) => {
          if (typeof value === 'object') {
            console.log(`      ${key}: ${JSON.stringify(value, null, 2)}`);
          } else {
            console.log(`      ${key}: ${value}`);
          }
        });
      }

      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`   💡 Рекомендации:`);
        result.suggestions.forEach(suggestion => {
          console.log(`      - ${suggestion}`);
        });
      }

      if (result.files && result.files.length > 0) {
        console.log(`   📁 Файлы (${result.files.length}):`);
        result.files.slice(0, 5).forEach(file => {
          console.log(`      - ${file}`);
        });
        if (result.files.length > 5) {
          console.log(`      ... и еще ${result.files.length - 5} файлов`);
        }
      }

      console.log();
    });

    // Сводка
    const passedResults = results.filter(r => r.passed);
    const failedResults = results.filter(r => !r.passed);

    console.log('📊 СВОДКА АНАЛИЗА:');
    console.log('='.repeat(30));
    console.log(`✅ Успешно: ${passedResults.length}`);
    console.log(`❌ Проблемы: ${failedResults.length}`);
    console.log(`📊 Общий процент: ${Math.round((passedResults.length / results.length) * 100)}%`);

    if (failedResults.length > 0) {
      console.log();
      console.log('🚨 ОСНОВНЫЕ ПРОБЛЕМЫ:');
      failedResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}: ${result.message}`);
      });
    }

    console.log();
    console.log('🎯 КРИТЕРИИ ОЦЕНКИ:');
    console.log('-'.repeat(30));
    console.log('🟢 Хорошо (80%+): Высокое покрытие, настроена автоматизация');
    console.log('🟡 Средне (60-79%): Базовое покрытие, нужны улучшения');
    console.log('🔴 Плохо (<60%): Недостаточное покрытие, нужна серьезная работа');
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error);
    if (error instanceof Error) {
      console.error('📋 Детали:', error.message);
      console.error('🔍 Стек:', error.stack);
    }
  }
}

// Запуск
if (require.main === module) {
  testCoverageAnalyzer().catch(console.error);
}

export { testCoverageAnalyzer };
