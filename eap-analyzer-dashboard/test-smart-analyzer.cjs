/**
 * Тест умного анализатора компонентов
 */

const { smartComponentAnalyzer } = require('./smart-analyzer.js');
const fs = require('fs');
const path = require('path');

// Тестируем на реальном файле vitest.performance.config.ts
const vitestConfigPath = '../vitest.performance.config.ts';
const fullPath = path.resolve(__dirname, vitestConfigPath);

console.log('🧪 ТЕСТИРОВАНИЕ УМНОГО АНАЛИЗАТОРА');
console.log('='.repeat(50));

try {
  const content = fs.readFileSync(fullPath, 'utf-8');
  const stat = fs.statSync(fullPath);

  console.log(`📁 Файл: ${path.basename(fullPath)}`);
  console.log(`📍 Путь: ${fullPath}`);
  console.log(`📊 Размер: ${stat.size} байт\n`);

  // Анализируем компонент
  const result = smartComponentAnalyzer(
    path.basename(fullPath),
    fullPath,
    content,
    stat
  );

  console.log('🎯 РЕЗУЛЬТАТЫ АНАЛИЗА:');
  console.log('-'.repeat(30));
  console.log(`🔍 Тип компонента: ${result.type}`);
  console.log(`📊 Логика: ${result.logicScore}%`);
  console.log(`⚡ Функциональность: ${result.functionalityScore}%`);
  console.log(`🚀 Обнаружено улучшений: ${result.detectedImprovements}`);

  console.log('\n✅ УЛУЧШЕНИЯ:');
  for (const [category, strength] of Object.entries(result.improvements)) {
    const percentage = Math.round(strength * 100);
    console.log(`  • ${category}: ${percentage}%`);
  }

  console.log('\n💡 РЕКОМЕНДАЦИИ:');
  result.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log('\n⚠️ ПРОБЛЕМЫ ЛОГИКИ:');
  result.logicIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });

  console.log('\n⚠️ ПРОБЛЕМЫ ФУНКЦИОНАЛЬНОСТИ:');
  result.functionalityIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ ТЕСТ ЗАВЕРШЕН УСПЕШНО!');

} catch (error) {
  console.error('❌ ОШИБКА:', error.message);
  console.error('Стек:', error.stack);
}
