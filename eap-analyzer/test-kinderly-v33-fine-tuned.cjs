/**
 * Тест FileStructureAnalyzer v3.3 FINE-TUNED
 * Тонкая настройка для максимального соответствия ручной валидации
 */

const { FileStructureAnalyzerV33 } = require('./FileStructureAnalyzerV33.cjs');
const fs = require('fs');

console.log('🔧 ТЕСТ FileStructureAnalyzer v3.3 FINE-TUNED');
console.log('='.repeat(60));
console.log('🎯 Цель: максимальное соответствие ручной валидации');
console.log('📊 Целевые показатели:');
console.log('   • Поддерживаемость: ~30/100');
console.log('   • Технический долг: ~40/100');
console.log('   • Модульность: ~72/100');
console.log('   • Сложность: ~55/100');
console.log('');

async function testAnalyzerV33() {
  const startTime = Date.now();
  const projectPath = 'C:\\kinderly-events';

  try {
    console.log(`📁 Анализируемый проект: ${projectPath}`);
    console.log('▶️  Запуск анализа...\n');

    const analyzer = new FileStructureAnalyzerV33();
    const result = await analyzer.analyzeProject(projectPath);

    const duration = Date.now() - startTime;

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА v3.3:');
    console.log('='.repeat(50));

    console.log(`🔧 ПОДДЕРЖИВАЕМОСТЬ: ${result.metrics.maintainability.score}/100`);
    if (result.metrics.maintainability.details) {
      const d = result.metrics.maintainability.details;
      console.log(`   • Покрытие тестами: ${d.testCoverage || 'N/A'}%`);
      if (d.testPenalty) console.log(`   • Штраф за тесты: ${d.testPenalty}`);
      if (d.docPenalty) console.log(`   • Штраф за документацию: ${d.docPenalty}`);
      if (d.backupPenalty) console.log(`   • Штраф за backup файлы: ${d.backupPenalty}`);
      if (d.readmeBonus) console.log(`   • Бонус за README: ${d.readmeBonus}`);
      if (d.duplicationPenalty) console.log(`   • Штраф за дублирование: ${d.duplicationPenalty}`);
    }

    console.log(`\n💳 ТЕХНИЧЕСКИЙ ДОЛГ: ${result.metrics.technicalDebt.score}/100`);
    if (result.metrics.technicalDebt.details) {
      const d = result.metrics.technicalDebt.details;
      console.log(`   • Больших файлов: ${d.largeFilePercent || 'N/A'}%`);
      if (d.largeFilesPenalty) console.log(`   • Штраф за большие файлы: ${d.largeFilesPenalty}`);
      console.log(`   • Максимальная глубина: ${d.maxDepth}`);
      console.log(`   • Средняя глубина: ${d.avgDepth}`);
      if (d.depthPenalty) console.log(`   • Штраф за глубину: ${d.depthPenalty}`);
      if (d.structurePenalty) console.log(`   • Штраф за структуру: ${d.structurePenalty}`);
      console.log(`   • Время поддержки: ${d.maintenanceHours || 'N/A'} часов`);
    }

    console.log(`\n📦 МОДУЛЬНОСТЬ: ${result.metrics.modularity.score}/100`);
    if (result.metrics.modularity.details) {
      const d = result.metrics.modularity.details;
      console.log(`   • Модулей: ${d.moduleCount}`);
      console.log(`   • Средний размер модуля: ${d.avgModuleSize} файлов`);
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
      if (d.namingBonus) console.log(`   • Бонус за именование: ${d.namingBonus}`);
    }

    console.log(`\n🏆 ОБЩИЙ БАЛЛ: ${result.metrics.overallScore}/100`);
    console.log(`⏱️  Время анализа: ${duration} мс`);

    // Статистика файлов
    console.log('\n📁 СТАТИСТИКА ФАЙЛОВ:');
    console.log('-'.repeat(30));
    console.log(`Всего файлов: ${result.metrics.fileStats.total}`);
    console.log(`JS/TS файлов: ${result.metrics.fileStats.js}`);
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

    const analyzer_v33 = {
      maintainability: result.metrics.maintainability.score,
      technicalDebt: result.metrics.technicalDebt.score,
      modularity: result.metrics.modularity.score,
      complexity: result.metrics.complexity.score,
    };

    const comparison = {};
    Object.keys(manual).forEach(key => {
      const diff = Math.abs(manual[key] - analyzer_v33[key]);
      const accuracy = 100 - diff;
      comparison[key] = { manual: manual[key], analyzer: analyzer_v33[key], diff, accuracy };
    });

    Object.entries(comparison).forEach(([metric, data]) => {
      const status =
        data.accuracy >= 95
          ? '🟢 ОТЛИЧНО'
          : data.accuracy >= 90
            ? '🟡 ОЧЕНЬ ХОРОШО'
            : data.accuracy >= 85
              ? '🟠 ХОРОШО'
              : '🔴 ТРЕБУЕТ УЛУЧШЕНИЯ';

      console.log(`${metric.toUpperCase()}:`);
      console.log(
        `  Ручная: ${data.manual}/100 | v3.3: ${data.analyzer}/100 | Разница: ${data.diff} | Точность: ${data.accuracy.toFixed(1)}% ${status}`
      );
    });

    const overallAccuracy =
      Object.values(comparison).reduce((sum, data) => sum + data.accuracy, 0) /
      Object.values(comparison).length;

    console.log(`\n🎯 ОБЩАЯ ТОЧНОСТЬ v3.3: ${overallAccuracy.toFixed(1)}%`);

    const improvementStatus =
      overallAccuracy >= 95
        ? '🟢 ОТЛИЧНАЯ НАСТРОЙКА'
        : overallAccuracy >= 90
          ? '🟡 ОЧЕНЬ ХОРОШАЯ НАСТРОЙКА'
          : overallAccuracy >= 85
            ? '🟠 ХОРОШАЯ НАСТРОЙКА'
            : '🔴 НУЖНА ДОПОЛНИТЕЛЬНАЯ НАСТРОЙКА';

    console.log(`Статус: ${improvementStatus}`);

    // Сравнение с предыдущими версиями
    console.log('\n📈 СРАВНЕНИЕ ВЕРСИЙ:');
    console.log('-'.repeat(30));
    console.log('v3.0: ~40% точность (переоценка)');
    console.log('v3.2: 88.3% точность (сбалансировано)');
    console.log(`v3.3: ${overallAccuracy.toFixed(1)}% точность (тонкая настройка)`);

    // Сохраняем результаты
    const reportPath = `./reports/fine-tuned-test-${Date.now()}.json`;
    try {
      if (!fs.existsSync('./reports')) {
        fs.mkdirSync('./reports');
      }

      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            version: '3.3 FINE-TUNED',
            timestamp: new Date().toISOString(),
            projectPath,
            duration,
            metrics: result.metrics,
            comparison,
            overallAccuracy,
            improvements: {
              'v3.2_to_v3.3': overallAccuracy - 88.3,
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
    console.log('🎉 Тест FileStructureAnalyzer v3.3 завершен!');
    console.log(`✅ Анализ ${result.metrics.fileStats.total} файлов за ${duration} мс`);
    console.log(`🎯 Общая точность: ${overallAccuracy.toFixed(1)}%`);

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
    console.log('\n✨ Тест выполнен успешно!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Тест провален:', error.message);
    process.exit(1);
  });

async function runTest() {
  return await testAnalyzerV33();
}
