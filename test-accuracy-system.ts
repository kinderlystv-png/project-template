/* eslint-disable no-console */
import { AccuracyCalculator } from './src/metrics/accuracy-calculator.ts';

/**
 * Тестирование новой системы точности анализа
 */
async function testAccuracySystem() {
  console.log('🧪 Тестирование новой системы точности анализа...\n');

  const calculator = new AccuracyCalculator();
  const projectPath = process.cwd(); // Текущий проект

  try {
    // 1. Проверяем готовность системы
    console.log('1. Проверка готовности системы:');
    const readiness = calculator.checkReadiness();
    console.log(`   Готовность: ${readiness.ready}`);
    if (readiness.issues.length > 0) {
      console.log(`   Проблемы: ${readiness.issues.join(', ')}`);
    }
    console.log(`   Доступные анализаторы: ${calculator.getAvailableAnalyzers().join(', ')}\n`);

    // 2. Извлекаем метрики проекта
    console.log('2. Извлечение метрик проекта:');
    const metrics = await calculator.extractProjectMetrics(projectPath);
    console.log(`   Файлов: ${metrics.totalFiles}`);
    console.log(`   Строк кода: ${metrics.totalLines}`);
    console.log(`   Средний размер файла: ${metrics.averageFileSize.toFixed(1)} строк`);
    console.log(`   Сложность: ${metrics.averageCyclomaticComplexity.toFixed(2)}`);
    console.log(
      `   Архитектурные паттерны: ${metrics.architecturalPatterns.join(', ') || 'Не найдены'}`
    );
    console.log(`   Дублирование: ${metrics.duplicationPercentage.toFixed(1)}%\n`);

    // 3. Тестируем структурный анализатор
    console.log('3. Тестирование структурного анализатора:');
    const structureAccuracy = await calculator.calculateAccuracyForAnalyzer(
      'structure',
      projectPath
    );
    console.log(`   Общая точность: ${structureAccuracy.overall}%`);
    console.log(
      `   Доверительный интервал: ${structureAccuracy.confidenceInterval.lower}% - ${structureAccuracy.confidenceInterval.upper}%`
    );
    console.log(`   Объяснение: ${structureAccuracy.explanation}`);

    console.log('   Компоненты точности:');
    console.log(
      `     - Качество данных: ${structureAccuracy.components.dataQuality.score.toFixed(1)}% (доверие: ${structureAccuracy.components.dataQuality.confidence.toFixed(1)}%)`
    );
    console.log(
      `     - Глубина анализа: ${structureAccuracy.components.analysisDepth.score.toFixed(1)}% (покрытие: ${structureAccuracy.components.analysisDepth.coverage.toFixed(1)}%)`
    );
    console.log(
      `     - Надёжность алгоритмов: ${structureAccuracy.components.algorithmReliability.score.toFixed(1)}% (стабильность: ${structureAccuracy.components.algorithmReliability.stability.toFixed(1)}%)`
    );

    if (structureAccuracy.components.historicalCorrectness) {
      console.log(
        `     - Историческая корректность: ${structureAccuracy.components.historicalCorrectness.score.toFixed(1)}% (тренд: ${structureAccuracy.components.historicalCorrectness.trend})`
      );
    }

    // 4. Показываем рекомендации
    if (structureAccuracy.recommendations && structureAccuracy.recommendations.length > 0) {
      console.log('\n   Рекомендации:');
      structureAccuracy.recommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
    }

    // 5. Тестируем общую точность системы
    console.log('\n4. Общая точность системы анализа:');
    const overallResult = await calculator.calculateOverallAccuracy(projectPath);
    console.log(`   Общая точность: ${overallResult.overall}%`);
    console.log(`   Объяснение: ${overallResult.explanation}`);

    console.log('\n   Результаты по анализаторам:');
    for (const [analyzer, result] of overallResult.byAnalyzer) {
      console.log(
        `     ${analyzer}: ${result.overall}% (${result.confidenceInterval.lower}%-${result.confidenceInterval.upper}%)`
      );
    }

    // 6. Специфические метрики структурного анализатора
    console.log('\n5. Специфические метрики структурного анализатора:');
    const specificMetrics = await calculator.getAnalyzerSpecificMetrics('structure', projectPath);
    console.log(`   Структура файлов: ${specificMetrics.fileStructureScore}%`);
    console.log(`   Сложность: ${specificMetrics.complexityScore}%`);
    console.log(`   Архитектура: ${specificMetrics.architectureScore}%`);
    console.log(`   Качество: ${specificMetrics.qualityScore}%`);

    console.log('\n✅ Тестирование завершено успешно!');
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    if (error instanceof Error) {
      console.error('   Детали:', error.message);
    }
  }
}

// Запускаем тест
testAccuracySystem().catch(console.error);

export { testAccuracySystem };
