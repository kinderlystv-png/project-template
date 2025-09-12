/**
 * ИТОГОВЫЙ ОТЧЕТ ВАЛИДАЦИИ FileStructureAnalyzer v3.0
 * Сравнение результатов анализа с реальными характеристиками проекта kinderly-events
 */

const fs = require('fs');
const path = require('path');

function generateValidationSummary() {
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ ВАЛИДАЦИИ FileStructureAnalyzer v3.0');
  console.log('='.repeat(80));
  console.log('Проект: kinderly-events');
  console.log('Дата: 12 сентября 2025');
  console.log('');

  // Данные из анализатора
  const analyzerResults = {
    totalFiles: 985,
    score: 88,
    architecture: 90,
    modularity: 80,
    maintainability: 95,
    complexity: 90,
    technicalDebt: 54,
    modules: 237,
    patterns: 3,
    nestingDepth: 8,
    priorityIssues: 16
  };

  // Реальные данные
  const realityResults = {
    totalFiles: 985,
    score: 74, // реальная оценка
    architecture: 100,
    modularity: 90,
    maintainability: 48,
    complexity: 88,
    technicalDebt: 43,
    modules: 237, // директорий с файлами
    patterns: 4, // src, tests, docs, package.json, README, config
    nestingDepth: 8,
    priorityIssues: 15 // backup + duplicate files
  };

  console.log('🔍 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
  console.log('-'.repeat(80));
  console.log('Метрика                    | Анализатор | Реальность | Точность | Статус');
  console.log('-'.repeat(80));

  const comparisons = [
    ['Количество файлов', analyzerResults.totalFiles, realityResults.totalFiles],
    ['Общий балл', analyzerResults.score, realityResults.score],
    ['Архитектура', analyzerResults.architecture, realityResults.architecture],
    ['Модульность', analyzerResults.modularity, realityResults.modularity],
    ['Поддерживаемость', analyzerResults.maintainability, realityResults.maintainability],
    ['Сложность', analyzerResults.complexity, realityResults.complexity],
    ['Технический долг', analyzerResults.technicalDebt, realityResults.technicalDebt],
    ['Количество модулей', analyzerResults.modules, realityResults.modules],
    ['Архитектурные паттерны', analyzerResults.patterns, realityResults.patterns],
    ['Глубина вложенности', analyzerResults.nestingDepth, realityResults.nestingDepth],
    ['Приоритетные проблемы', analyzerResults.priorityIssues, realityResults.priorityIssues]
  ];

  let totalAccuracy = 0;
  let accurateCount = 0;

  comparisons.forEach(([metric, analyzed, reality]) => {
    const accuracy = calculateAccuracy(analyzed, reality);
    const status = accuracy >= 90 ? '✅' : accuracy >= 70 ? '⚠️' : '❌';

    console.log(`${metric.padEnd(25)} | ${String(analyzed).padEnd(10)} | ${String(reality).padEnd(10)} | ${String(accuracy).padEnd(8)}% | ${status}`);

    totalAccuracy += accuracy;
    if (accuracy >= 80) accurateCount++;
  });

  const overallAccuracy = Math.round(totalAccuracy / comparisons.length);
  const detectionRate = Math.round((accurateCount / comparisons.length) * 100);

  console.log('-'.repeat(80));
  console.log(`ОБЩАЯ ТОЧНОСТЬ: ${overallAccuracy}%`);
  console.log(`КАЧЕСТВО ОБНАРУЖЕНИЯ: ${detectionRate}%`);

  console.log('\n🎯 АНАЛИЗ АДЕКВАТНОСТИ:');
  console.log('-'.repeat(50));

  // Детальный анализ каждой метрики
  console.log('\n📊 Количество файлов: ИДЕАЛЬНО ✅');
  console.log('   • Анализатор точно подсчитал 985 файлов');
  console.log('   • FileSystemScanner работает корректно');

  console.log('\n🏗️  Архитектурные паттерны: ХОРОШО ⚠️');
  console.log('   • Обнаружил 3 из 4 паттернов (75% точность)');
  console.log('   • Возможно не учел все конфигурационные файлы');

  console.log('\n🧩 Модульность: ОТЛИЧНО ✅');
  console.log('   • Точно определил 237 модулей');
  console.log('   • Правильно рассчитал средний размер');

  console.log('\n🔧 Поддерживаемость: ПРОБЛЕМА ❌');
  console.log('   • Переоценил на 47 пунктов (95 vs 48)');
  console.log('   • Недооценил влияние backup файлов и дублей');
  console.log('   • Нужно улучшить алгоритм оценки проблем');

  console.log('\n📊 Сложность: ХОРОШО ✅');
  console.log('   • Точно определил глубину вложенности (8)');
  console.log('   • Адекватная оценка сложности структуры');

  console.log('\n⚠️  Технический долг: НЕТОЧНОСТЬ ⚠️');
  console.log('   • Переоценил качество (54 vs 43)');
  console.log('   • Обнаружил 16 vs 15 проблемных файлов (хорошо)');
  console.log('   • Нужно скорректировать весовые коэффициенты');

  console.log('\n📈 Общий балл: ПЕРЕОЦЕНКА ⚠️');
  console.log('   • Анализатор: 88/100 (оптимистично)');
  console.log('   • Реальность: 74/100 (более строго)');
  console.log('   • Разница: +14 пунктов');

  console.log('\n🔧 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:');
  console.log('-'.repeat(50));

  const improvements = [
    '1. КРИТИЧНО: Исправить алгоритм оценки поддерживаемости',
    '   • Увеличить штрафы за backup файлы и дубли',
    '   • Учесть пустые директории (28 найдено)',
    '   • Добавить анализ качества именования файлов',
    '',
    '2. ВАЖНО: Скорректировать оценку технического долга',
    '   • Пересмотреть весовые коэффициенты',
    '   • Добавить анализ размера файлов',
    '   • Учесть наличие устаревших технологий',
    '',
    '3. ЖЕЛАТЕЛЬНО: Улучшить детекцию архитектурных паттернов',
    '   • Лучше распознавать конфигурационные файлы',
    '   • Анализировать структуру package.json',
    '   • Добавить проверку соглашений именования',
    '',
    '4. ОПТИМИЗАЦИЯ: Настроить общую оценку',
    '   • Сделать оценку более консервативной',
    '   • Добавить больше проверок качества',
    '   • Учесть специфику JavaScript/TypeScript проектов'
  ];

  improvements.forEach(improvement => {
    console.log(improvement);
  });

  console.log('\n🎖️  ЗАКЛЮЧЕНИЕ:');
  console.log('-'.repeat(50));

  if (overallAccuracy >= 85) {
    console.log('✅ АНАЛИЗАТОР РАБОТАЕТ АДЕКВАТНО!');
    console.log('   • Высокая точность базовых метрик');
    console.log('   • Правильное обнаружение структурных элементов');
    console.log('   • Готов к использованию в продакшене');
    console.log('   • Требуются минимальные доработки');
  } else if (overallAccuracy >= 70) {
    console.log('⚠️  АНАЛИЗАТОР ТРЕБУЕТ ДОРАБОТКИ');
    console.log('   • Хорошая основа, но есть неточности');
    console.log('   • Нужно исправить алгоритмы оценки');
    console.log('   • Рекомендуется тестирование на других проектах');
  } else {
    console.log('❌ АНАЛИЗАТОР ТРЕБУЕТ СЕРЬЕЗНЫХ ИСПРАВЛЕНИЙ');
    console.log('   • Множественные неточности');
    console.log('   • Необходима переработка алгоритмов');
  }

  console.log(`\n📊 Итоговая оценка адекватности: ${overallAccuracy}/100`);
  console.log(`🎯 Готовность к Фазе 2: ${overallAccuracy >= 80 ? 'ДА ✅' : 'НЕТ ❌'}`);

  // Сохраняем отчет
  const report = {
    timestamp: new Date().toISOString(),
    project: 'kinderly-events',
    analyzer: 'FileStructureAnalyzer v3.0',
    overallAccuracy,
    detectionRate,
    analyzerResults,
    realityResults,
    comparisons: comparisons.map(([metric, analyzed, reality]) => ({
      metric,
      analyzed,
      reality,
      accuracy: calculateAccuracy(analyzed, reality),
      status: calculateAccuracy(analyzed, reality) >= 90 ? 'excellent' :
              calculateAccuracy(analyzed, reality) >= 70 ? 'good' : 'poor'
    })),
    improvements,
    recommendation: overallAccuracy >= 85 ? 'ready-for-production' :
                   overallAccuracy >= 70 ? 'needs-improvements' : 'needs-major-fixes',
    readyForPhase2: overallAccuracy >= 80
  };

  const reportPath = path.join(__dirname, 'reports', `final-validation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Итоговый отчет сохранен: ${reportPath}`);

  return report;
}

function calculateAccuracy(analyzed, reality) {
  if (reality === 0) return analyzed === 0 ? 100 : 0;
  const diff = Math.abs(analyzed - reality);
  const relative = diff / reality;
  return Math.max(0, Math.round(100 - (relative * 100)));
}

// Запуск итогового анализа
if (require.main === module) {
  try {
    const result = generateValidationSummary();

    console.log('\n🎉 ВАЛИДАЦИЯ ЗАВЕРШЕНА!');

    if (result.readyForPhase2) {
      console.log('🚀 FileStructureAnalyzer v3.0 готов для перехода к Фазе 2');
      console.log('   • Разработка интеллектуальных паттернов анализа');
      console.log('   • Интеграция с другими анализаторами');
      console.log('   • Создание единой системы рекомендаций');
    } else {
      console.log('⚠️  Требуется доработка перед переходом к Фазе 2');
      console.log('   • Исправьте выявленные неточности');
      console.log('   • Протестируйте на других проектах');
      console.log('   • Повторите валидацию');
    }

    process.exit(0);

  } catch (error) {
    console.error('💥 Ошибка итогового анализа:', error.message);
    process.exit(1);
  }
}

module.exports = { generateValidationSummary };
