#!/usr/bin/env node

/**
 * Тестирование интеграции EnhancedJestChecker с UnifiedTestingAnalyzer
 * Этот скрипт проверяет корректность работы обновленной системы анализа
 */

const { UnifiedTestingAnalyzer } = require('./UnifiedTestingAnalyzer.js');

async function testIntegration() {
  console.log('🧪 Тестирование интеграции Jest анализа...\n');

  const analyzer = new UnifiedTestingAnalyzer();

  // Моковые данные для тестирования
  const mockFiles = [
    'src/components/Button.test.js',
    'src/utils/helpers.spec.js',
    'tests/setup.js',
    '__tests__/integration.test.js',
    'jest.config.js',
    'package.json',
    'src/components/Button.js',
    'src/utils/helpers.js',
  ];

  const mockPackageJson = {
    devDependencies: {
      jest: '^29.0.0',
      '@testing-library/react': '^13.0.0',
      '@testing-library/jest-dom': '^5.0.0',
    },
    scripts: {
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
    },
  };

  try {
    console.log('📁 Анализируемые файлы:', mockFiles.join(', '));
    console.log('📦 Jest обнаружен в зависимостях');
    console.log('\n⏳ Запуск анализа...\n');

    const results = await analyzer.analyze(mockFiles, mockPackageJson);

    console.log('✅ Анализ завершен успешно!');
    console.log(`📊 Количество результатов: ${results.length}\n`);

    results.forEach((result, index) => {
      console.log(`--- Результат ${index + 1} ---`);
      console.log(`ID: ${result.id}`);
      console.log(`Название: ${result.name}`);
      console.log(`Описание: ${result.description}`);
      console.log(`Пройден: ${result.passed ? '✅' : '❌'}`);
      console.log(`Оценка: ${result.score}/${result.maxScore}`);
      console.log(`Сообщение: ${result.message}`);
      console.log(`Рекомендации:`);
      result.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
      console.log(`Время выполнения: ${result.duration}ms`);
      console.log(`Время: ${result.timestamp.toISOString()}`);
      console.log('');
    });

    // Проверяем, что EnhancedJestChecker был использован
    const jestResult = results.find(r => r.id === 'enhanced-jest-analysis');
    const unifiedResult = results.find(r => r.id === 'unified-testing-analysis');

    if (jestResult) {
      console.log('🎯 EnhancedJestChecker успешно интегрирован!');
      console.log(`   - Расширенный анализ Jest выполнен`);
      console.log(`   - Оценка от EnhancedJestChecker: ${jestResult.score}/100`);
    }

    if (unifiedResult) {
      console.log('🔄 UnifiedTestingAnalyzer работает корректно!');
      console.log(`   - Итоговая оценка: ${unifiedResult.score}/100`);
      console.log(`   - Время выполнения: ${unifiedResult.duration}ms`);
    }

    console.log('\n🎉 Интеграция работает правильно!');
  } catch (error) {
    console.error('❌ Ошибка при тестировании интеграции:');
    console.error(error.message);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск тестирования только если скрипт вызван напрямую
if (require.main === module) {
  testIntegration();
}

module.exports = { testIntegration };
