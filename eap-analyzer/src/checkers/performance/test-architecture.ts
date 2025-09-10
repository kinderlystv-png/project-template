#!/usr/bin/env node

/**
 * Тестовый скрипт для модульной архитектуры PerformanceChecker
 * Демонстрирует работу нового модульного подхода
 */

import { PerformanceChecker } from './PerformanceChecker';
import { BundleSizeAnalyzer } from './BundleSizeAnalyzer';

async function testPerformanceArchitecture() {
  console.log('🚀 Тестирование модульной архитектуры PerformanceChecker v2.0\n');

  // Создаем основной чекер
  const performanceChecker = new PerformanceChecker({
    bundleSizeThreshold: 3 * 1024 * 1024, // 3MB
    enableBundleAnalysis: true,
    enableRuntimeAnalysis: false, // Пока не реализован
    enableDependencyAnalysis: true,
  });

  console.log('📦 Регистрируем анализатор Bundle Size...');
  performanceChecker.registerAnalyzer(new BundleSizeAnalyzer());

  console.log(`✅ Зарегистрировано анализаторов: ${performanceChecker.getAnalyzers().length}`);
  console.log(
    `📋 Конфигурация: ${JSON.stringify(performanceChecker.getPerformanceConfig(), null, 2)}\n`
  );

  // Тестируем на текущем проекте
  const projectPath = process.cwd();
  console.log(`🔍 Анализируем проект: ${projectPath}\n`);

  try {
    // Создаем mock Project объект
    const project = {
      path: projectPath,
      name: 'test-project',
      getFileList: async () => [],
      getFileStats: async () => ({
        size: 0,
        isFile: false,
        isDirectory: true,
        created: new Date(),
        modified: new Date(),
      }),
      readFile: async () => '',
      hasFile: async () => false,
      exists: async () => true,
      resolvePath: (relativePath: string) => `${projectPath}/${relativePath}`,
    };
    const startTime = Date.now();

    const results = await performanceChecker.check(project);

    const analysisTime = Date.now() - startTime;
    console.log(`⏱️  Время анализа: ${analysisTime}ms\n`);

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА ПРОИЗВОДИТЕЛЬНОСТИ:\n');

    results.forEach((result, index) => {
      const statusIcon = result.passed ? '✅' : '❌';
      const scoreColor = result.score >= 70 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';

      console.log(`${index + 1}. ${statusIcon} ${result.name}`);
      console.log(`   ${scoreColor} Балл: ${result.score}/100`);
      console.log(`   📝 ${result.message}`);
      console.log(`   📊 Уровень: ${result.severity}`);

      if (result.details) {
        console.log(`   📋 Детали: ${Object.keys(result.details).length} полей`);
      }
      console.log('');
    });

    // Общая статистика
    const overview = results.find(r => r.id === 'performance-overview');
    if (overview) {
      console.log('🎯 ОБЩАЯ ОЦЕНКА:');
      console.log(`   Общий балл: ${overview.score}/100`);
      console.log(`   Статус: ${overview.passed ? 'ПРОШЕЛ' : 'НЕ ПРОШЕЛ'}`);
      console.log(`   Анализаторов активно: ${overview.details?.analyzersCount || 0}`);
    }

    // Рекомендации
    const allRecommendations = results
      .flatMap(r => r.details?.recommendations || [])
      .filter(Boolean);

    if (allRecommendations.length > 0) {
      console.log('\n💡 РЕКОМЕНДАЦИИ:');
      allRecommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    console.log('\n✨ Тестирование модульной архитектуры завершено успешно!');

    return {
      success: true,
      overallScore: overview?.score || 0,
      totalChecks: results.length,
      passedChecks: results.filter(r => r.passed).length,
    };
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Запускаем тест если файл выполняется напрямую
if (require.main === module) {
  testPerformanceArchitecture()
    .then(result => {
      console.log('\n📋 Итоговый результат:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

export { testPerformanceArchitecture };
