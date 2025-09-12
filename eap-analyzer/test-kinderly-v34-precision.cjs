/**
 * Тест FileStructureAnalyzer v3.4 PRECISION
 * Точная калибровка для идеального соответствия ручной валидации
 */

const { FileStructureAnalyzerV34 } = require('./FileStructureAnalyzerV34.cjs');
const fs = require('fs');

console.log('🎯 ТЕСТ FileStructureAnalyzer v3.4 PRECISION');
console.log('='.repeat(60));
console.log('🔧 Цель: максимальная точность соответствия');
console.log('📊 Целевые показатели:');
console.log('   • Поддерживаемость: 30/100 (критично низкие тесты)');
console.log('   • Технический долг: 40/100 (умеренные проблемы)');
console.log('   • Модульность: 72/100 (хорошая структура)');
console.log('   • Сложность: 55/100 (средняя сложность)');
console.log('');

async function testAnalyzerV34() {
  const startTime = Date.now();
  const projectPath = 'C:\\kinderly-events';

  try {
    console.log(`📁 Анализируемый проект: ${projectPath}`);
    console.log('▶️  Запуск анализа v3.4...\n');

    const analyzer = new FileStructureAnalyzerV34();
    const result = await analyzer.analyzeProject(projectPath);

    const duration = Date.now() - startTime;

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА v3.4:');
    console.log('='.repeat(50));

    console.log(`🔧 ПОДДЕРЖИВАЕМОСТЬ: ${result.metrics.maintainability.score}/100`);
    if (result.metrics.maintainability.details) {
      const d = result.metrics.maintainability.details;
      console.log(`   • Исходные файлы: ${d.sourceFiles}`);
      console.log(`   • Тестовые файлы: ${d.testFiles}`);
      console.log(`   • Покрытие тестами: ${d.testCoverage}%`);
      if (d.testPenalty) console.log(`   • Штраф за тесты: ${d.testPenalty}`);
      if (d.docPenalty) console.log(`   • Штраф за документацию: ${d.docPenalty}`);
      if (d.backupPenalty) console.log(`   • Штраф за backup: ${d.backupPenalty}`);
      if (d.readmeBonus) console.log(`   • Бонус за README: ${d.readmeBonus}`);
    }

    console.log(`\n💳 ТЕХНИЧЕСКИЙ ДОЛГ: ${result.metrics.technicalDebt.score}/100`);
    if (result.metrics.technicalDebt.details) {
      const d = result.metrics.technicalDebt.details;
      console.log(`   • Больших файлов: ${d.largeFilePercent}%`);
      console.log(`   • Максимальная глубина: ${d.maxDepth}`);
      console.log(`   • Средняя глубина: ${d.avgDepth}`);
      if (d.largeFilesPenalty) console.log(`   • Штраф за файлы: ${d.largeFilesPenalty}`);
      if (d.depthPenalty) console.log(`   • Штраф за глубину: ${d.depthPenalty}`);
      if (d.structurePenalty) console.log(`   • Штраф за структуру: ${d.structurePenalty}`);
    }

    console.log(`\n📦 МОДУЛЬНОСТЬ: ${result.metrics.modularity.score}/100`);
    if (result.metrics.modularity.details) {
      const d = result.metrics.modularity.details;
      console.log(`   • Модулей в src/: ${d.moduleCount}`);
      console.log(`   • Средний размер: ${d.avgModuleSize} файлов`);
      if (d.moduleBonus) console.log(`   • Бонус за модули: ${d.moduleBonus}`);
      if (d.sizeBonus) console.log(`   • Бонус за размер: ${d.sizeBonus}`);
      if (d.patternBonus) console.log(`   • Бонус за паттерны: ${d.patternBonus}`);
    }

    console.log(`\n🔄 СЛОЖНОСТЬ: ${result.metrics.complexity.score}/100`);
    if (result.metrics.complexity.details) {
      const d = result.metrics.complexity.details;
      console.log(`   • Средняя глубина: ${d.avgDepth}`);
      console.log(`   • Максимальная глубина: ${d.maxDepth}`);
      console.log(`   • Консистентность именования: ${d.namingConsistency}%`);
      if (d.avgDepthPenalty) console.log(`   • Штраф за среднюю глубину: ${d.avgDepthPenalty}`);
      if (d.maxDepthPenalty) console.log(`   • Штраф за макс глубину: ${d.maxDepthPenalty}`);
      if (d.namingPenalty) console.log(`   • Штраф за именование: ${d.namingPenalty}`);
    }

    console.log(`\n🏆 ОБЩИЙ БАЛЛ: ${result.metrics.overallScore}/100`);
    console.log(`⏱️  Время анализа: ${duration} мс`);

    // Статистика файлов
    console.log('\n📁 СТАТИСТИКА ФАЙЛОВ:');
    console.log('-'.repeat(30));
    console.log(`Всего файлов: ${result.metrics.fileStats.total}`);
    console.log(`Исходных файлов (src/): ${result.metrics.fileStats.source}`);
    console.log(`Тестовых файлов: ${result.metrics.fileStats.tests}`);
    console.log(`Файлов документации: ${result.metrics.fileStats.docs}`);
    console.log(`Backup файлов: ${result.metrics.fileStats.backup}`);
    console.log(`Больших файлов: ${result.metrics.fileStats.large}`);

    // Сравнение с ручной валидацией
    console.log('\n📊 СРАВНЕНИЕ С РУЧНОЙ ВАЛИДАЦИЕЙ:');
    console.log('='.repeat(50));

    const manual = {
      maintainability: 30,
      technicalDebt: 40,
      modularity: 72,
      complexity: 55,
    };

    const analyzer_v34 = {
      maintainability: result.metrics.maintainability.score,
      technicalDebt: result.metrics.technicalDebt.score,
      modularity: result.metrics.modularity.score,
      complexity: result.metrics.complexity.score,
    };

    const comparison = {};
    Object.keys(manual).forEach(key => {
      const diff = Math.abs(manual[key] - analyzer_v34[key]);
      const accuracy = Math.max(0, 100 - diff);
      comparison[key] = { manual: manual[key], analyzer: analyzer_v34[key], diff, accuracy };
    });

    Object.entries(comparison).forEach(([metric, data]) => {
      const status =
        data.accuracy >= 95
          ? '🟢 ОТЛИЧНО'
          : data.accuracy >= 90
            ? '🟡 ОЧЕНЬ ХОРОШО'
            : data.accuracy >= 85
              ? '🟠 ХОРОШО'
              : data.accuracy >= 75
                ? '🟨 ПРИЕМЛЕМО'
                : '🔴 ТРЕБУЕТ УЛУЧШЕНИЯ';

      console.log(`${metric.toUpperCase()}:`);
      console.log(
        `  Ручная: ${data.manual}/100 | v3.4: ${data.analyzer}/100 | Разница: ${data.diff} | Точность: ${data.accuracy.toFixed(1)}% ${status}`
      );
    });

    const overallAccuracy =
      Object.values(comparison).reduce((sum, data) => sum + data.accuracy, 0) /
      Object.values(comparison).length;

    console.log(`\n🎯 ОБЩАЯ ТОЧНОСТЬ v3.4: ${overallAccuracy.toFixed(1)}%`);

    const improvementStatus =
      overallAccuracy >= 95
        ? '🟢 ОТЛИЧНАЯ КАЛИБРОВКА'
        : overallAccuracy >= 90
          ? '🟡 ОЧЕНЬ ХОРОШАЯ КАЛИБРОВКА'
          : overallAccuracy >= 85
            ? '🟠 ХОРОШАЯ КАЛИБРОВКА'
            : overallAccuracy >= 75
              ? '🟨 ПРИЕМЛЕМАЯ КАЛИБРОВКА'
              : '🔴 НУЖНА ДОПОЛНИТЕЛЬНАЯ РАБОТА';

    console.log(`Статус: ${improvementStatus}`);

    // Эволюция версий
    console.log('\n📈 ЭВОЛЮЦИЯ ТОЧНОСТИ:');
    console.log('-'.repeat(35));
    console.log('v3.0: ~40% (переоценка)');
    console.log('v3.2: 88.3% (сбалансировано)');
    console.log('v3.3: 80.3% (ухудшение)');
    console.log(`v3.4: ${overallAccuracy.toFixed(1)}% (точная калибровка)`);

    const improvement = overallAccuracy - 88.3;
    if (improvement > 0) {
      console.log(`🚀 Улучшение: +${improvement.toFixed(1)}% от v3.2`);
    } else {
      console.log(`📉 Отклонение: ${improvement.toFixed(1)}% от v3.2`);
    }

    // Анализ качества настройки
    console.log('\n🔍 АНАЛИЗ КАЧЕСТВА НАСТРОЙКИ:');
    console.log('-'.repeat(40));

    const excellentMetrics = Object.values(comparison).filter(d => d.accuracy >= 95).length;
    const goodMetrics = Object.values(comparison).filter(d => d.accuracy >= 85).length;

    console.log(`Отличные метрики (≥95%): ${excellentMetrics}/4`);
    console.log(`Хорошие метрики (≥85%): ${goodMetrics}/4`);

    if (excellentMetrics >= 3) {
      console.log('✨ Калибровка близка к идеальной!');
    } else if (goodMetrics >= 3) {
      console.log('✅ Калибровка качественная');
    } else {
      console.log('⚠️  Калибровка требует доработки');
    }

    // Сохраняем результаты
    const reportPath = `./reports/precision-test-${Date.now()}.json`;
    try {
      if (!fs.existsSync('./reports')) {
        fs.mkdirSync('./reports');
      }

      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            version: '3.4 PRECISION',
            timestamp: new Date().toISOString(),
            projectPath,
            duration,
            metrics: result.metrics,
            comparison,
            overallAccuracy,
            improvements: {
              'v3.2_to_v3.4': improvement,
              'v3.3_to_v3.4': overallAccuracy - 80.3,
            },
            qualityMetrics: {
              excellentMetrics,
              goodMetrics,
              totalMetrics: 4,
            },
          },
          null,
          2
        )
      );

      console.log(`\n💾 Отчет сохранен: ${reportPath}`);
    } catch (error) {
      console.log('\n⚠️  Не удалось сохранить отчет');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Тест FileStructureAnalyzer v3.4 завершен!');
    console.log(`✅ Анализ ${result.metrics.fileStats.total} файлов за ${duration} мс`);
    console.log(`🎯 Общая точность: ${overallAccuracy.toFixed(1)}%`);
    console.log(`📊 Финальный балл проекта: ${result.metrics.overallScore}/100`);

    return result;
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Детали ошибки:');
    console.error(error.stack || error);
    throw error;
  }
}

// Запускаем тест
runTest()
  .then(() => {
    console.log('\n✨ Точная калибровка завершена!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Тест провален:', error.message);
    process.exit(1);
  });

async function runTest() {
  return await testAnalyzerV34();
}
