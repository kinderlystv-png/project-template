#!/usr/bin/env node

import { AIEnhancedAnalyzer } from './dist/ai-integration/index.js';
import path from 'path';

async function testAIIntegration() {
  console.log('🧪 Тестирование AI интеграции...\n');

  try {
    const analyzer = new AIEnhancedAnalyzer();
    const testProjectPath = path.resolve('./src');

    console.log(`📁 Анализируем: ${testProjectPath}`);

    const result = await analyzer.analyzeProject(testProjectPath);

    console.log('\n📊 РЕЗУЛЬТАТ АНАЛИЗА:');
    console.log(`   Файлов проанализировано: ${result.fileCount}`);

    if (result.aiInsights) {
      console.log('\n🧠 AI АНАЛИТИКА:');
      console.log(`   Общая оценка качества: ${result.aiInsights.summary.overallQuality}/100`);
      console.log(
        `   Уверенность AI: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%`
      );

      if (result.aiInsights.summary.recommendations.length > 0) {
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        result.aiInsights.summary.recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(`   ${i + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
        });
      }

      if (result.aiInsights.summary.mainIssues.length > 0) {
        console.log('\n⚠️ ОСНОВНЫЕ ПРОБЛЕМЫ:');
        result.aiInsights.summary.mainIssues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      }

      if (result.aiInsights.summary.strengths.length > 0) {
        console.log('\n✅ СИЛЬНЫЕ СТОРОНЫ:');
        result.aiInsights.summary.strengths.forEach((strength, i) => {
          console.log(`   ${i + 1}. ${strength}`);
        });
      }
    }

    console.log('\n🎉 ИНТЕГРАЦИЯ РАБОТАЕТ УСПЕШНО!');

    // Генерируем краткий отчет
    const summary = analyzer.generateEnhancedSummary(result);
    console.log('\n' + summary);
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    process.exit(1);
  }
}

testAIIntegration();
