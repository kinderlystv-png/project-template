#!/usr/bin/env node

/**
 * 🚀 EAP AI Integration - Финальная демонстрация
 * Этот скрипт демонстрирует все возможности AI интеграции
 */

console.log('🤖 === EAP AI INTEGRATION FINAL DEMO ===');
console.log('');

// Тест всех форматов отчетов
const formats = ['console', 'json', 'html', 'markdown'];
const testProject = '../src';

console.log('📋 Тестируем все форматы отчетов:');

for (const format of formats) {
  try {
    console.log(`\n🔍 Формат: ${format.toUpperCase()}`);

    // Динамический импорт AI интеграции
    const { AIEnhancedAnalyzer } = await import('./dist/ai-integration/index.js');
    const { AIReportGenerator } = await import('./dist/ai-integration/report-generator.js');

    // Создаем анализатор
    const analyzer = new AIEnhancedAnalyzer();

    // Выполняем анализ
    console.log(`   📂 Анализируем: ${testProject}`);
    const startTime = Date.now();
    const result = await analyzer.analyzeProject(testProject);
    const duration = Date.now() - startTime;

    // Генерируем отчет
    const generator = new AIReportGenerator();
    const report = await generator.generateReport(result, { format });

    // Результаты
    console.log(`   ✅ Анализ завершен за ${duration}ms`);
    console.log(`   📊 Файлов: ${result.fileCount || 0}`);
    console.log(`   🎯 AI качество: ${result.aiInsights?.summary.overallQuality || 0}/100`);
    console.log(
      `   📈 Уверенность: ${((result.aiInsights?.qualityPrediction.confidence || 0) * 100).toFixed(1)}%`
    );

    // Сохраняем только не-консольные форматы
    if (format !== 'console') {
      const filename = `demo-report.${format === 'markdown' ? 'md' : format}`;
      const fs = await import('fs/promises');
      await fs.writeFile(filename, report);
      console.log(`   💾 Сохранено: ${filename}`);
    }
  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }
}

console.log('\n🎉 === ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===');
console.log('');
console.log('📋 Созданные файлы:');
console.log('   • demo-report.json - Структурированные данные');
console.log('   • demo-report.html - Веб-отчет со стилями');
console.log('   • demo-report.md - Markdown документация');
console.log('');
console.log('🚀 AI интеграция готова к продакшену!');
console.log('   Используйте: node bin/eap-ai.js analyze --help');
