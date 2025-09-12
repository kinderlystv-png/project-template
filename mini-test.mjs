/**
 * Мини-тест FileStructureAnalyzer v3.0
 * Проверяет, что это реальный анализатор, а не демо
 */

import { FileStructureAnalyzer } from './eap-analyzer/src/analyzers/structure/FileStructureAnalyzer.js';

// Тестируем с минимальным каталогом
const testResult = await FileStructureAnalyzer.checkComponent({
  projectPath: 'C:\\alphacore\\project-template\\docs', // Небольшая папка
});

// Проверяем что это НЕ демо
const isRealAnalyzer =
  testResult.percentage > 0 &&
  testResult.component.name.includes('v3.0') &&
  testResult.recommendations.length > 0;

const summary = {
  analyzer: 'FileStructureAnalyzer v3.0',
  realAnalysis: isRealAnalyzer,
  percentage: testResult.percentage,
  filesAnalyzed: testResult.metadata?.filesAnalyzed || 0,
  duration: testResult.duration,
  recommendations: testResult.recommendations.length,
  checksCount: testResult.passed.length + testResult.failed.length,
  status: isRealAnalyzer ? 'SUCCESS: Real analyzer works!' : 'FAILED: Still demo-like',
};

console.log(JSON.stringify(summary, null, 2));
