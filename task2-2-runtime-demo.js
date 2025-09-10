#!/usr/bin/env node

/**
 * Демонстрация Task 2.2: RuntimeMetricsAnalyzer + интеграция
 * Тестирует новую функциональность runtime performance анализа
 */

import { createPerformanceChecker } from '../eap-analyzer/src/checkers/performance/index';
import { RuntimeMetricsAnalyzer } from '../eap-analyzer/src/checkers/performance/RuntimeMetricsAnalyzer';
import * as path from 'path';

async function testRuntimeMetricsAnalyzer() {
  console.log('🔍 TASK 2.2: Testing RuntimeMetricsAnalyzer Integration');
  console.log('================================================');

  const projectPath = process.cwd();
  console.log(`📁 Analyzing project: ${projectPath}`);

  try {
    // 1. Прямое тестирование RuntimeMetricsAnalyzer
    console.log('\n📊 1. Direct RuntimeMetricsAnalyzer Test:');
    const runtimeAnalyzer = new RuntimeMetricsAnalyzer();

    const startTime = Date.now();
    const result = await runtimeAnalyzer.analyze(projectPath);
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Analysis completed in ${analysisTime}ms`);
    console.log(`📈 Performance Score: ${result.score}/100`);
    console.log(`🎯 Issues Found: ${result.issues.length}`);
    console.log(`💡 Recommendations: ${result.recommendations.length}`);

    // Подробности Core Web Vitals
    if (result.metrics.coreWebVitals) {
      const cwv = result.metrics.coreWebVitals as any;
      console.log('\n🌐 Core Web Vitals Analysis:');
      console.log(`   LCP Factors: ${JSON.stringify(cwv.lcpFactors, null, 2)}`);
      console.log(`   FID Factors: ${JSON.stringify(cwv.fidFactors, null, 2)}`);
      console.log(`   CLS Factors: ${JSON.stringify(cwv.clsFactors, null, 2)}`);
    }

    // Подробности JavaScript Performance
    if (result.metrics.jsPerformance) {
      const jsp = result.metrics.jsPerformance as any;
      console.log('\n⚡ JavaScript Performance:');
      console.log(`   Total JS Files: ${jsp.totalJSFiles}`);
      console.log(`   Complex Functions: ${jsp.complexFunctions}`);
      console.log(`   Large Files: ${jsp.largeFiles}`);
      console.log(`   Async/Await Usage: ${jsp.asyncAwaitUsage}`);
      console.log(`   Promise Usage: ${jsp.promiseUsage}`);
    }

    // Подробности DOM Operations
    if (result.metrics.domOperations) {
      const dom = result.metrics.domOperations as any;
      console.log('\n🏗️  DOM Operations Analysis:');
      console.log(`   Total DOM Queries: ${dom.totalDOMQueries}`);
      console.log(`   DOM Modifications: ${dom.domModifications}`);
      console.log(`   Event Listeners: ${dom.eventListeners}`);
      console.log(`   Inefficient Queries: ${dom.inefficientQueries}`);
    }

    // Подробности Memory Patterns
    if (result.metrics.memoryPatterns) {
      const mem = result.metrics.memoryPatterns as any;
      console.log('\n🧠 Memory Patterns:');
      console.log(`   Memory Leak Risks: ${mem.memoryLeakRisks}`);
      console.log(`   Large Data Structures: ${mem.largeDataStructures}`);
      console.log(`   Inefficient Loops: ${mem.inefficientLoops}`);
    }

    // Issues and Recommendations
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // 2. Интеграционное тестирование с PerformanceChecker
    console.log('\n📊 2. Integrated PerformanceChecker Test:');
    const checker = createPerformanceChecker({
      enableRuntimeAnalysis: true,
      enableBundleAnalysis: true,
      enableDependencyAnalysis: true
    });

    console.log(`🔧 Registered analyzers: ${checker.getAnalyzers().length}`);
    checker.getAnalyzers().forEach((analyzer, index) => {
      console.log(`   ${index + 1}. ${analyzer.name} (${analyzer.category})`);
    });

    // Создаем mock project для тестирования
    const mockProject = {
      path: projectPath,
      name: 'runtime-metrics-test',
      getFileList: async () => [],
      getFileStats: async () => ({
        size: 0,
        isFile: false,
        isDirectory: true,
        created: new Date(),
        modified: new Date()
      }),
      readFile: async () => '',
      hasFile: async () => false,
      exists: async () => true,
      resolvePath: (relativePath: string) => path.join(projectPath, relativePath)
    };

    const integratedResults = await checker.check(mockProject);

    console.log('\n📋 Integrated Analysis Results:');
    integratedResults.forEach((checkResult, index) => {
      console.log(`   ${index + 1}. ${checkResult.name}: ${checkResult.passed ? '✅' : '❌'} (${checkResult.score}/${checkResult.maxScore})`);
      if (checkResult.message) {
        console.log(`      ${checkResult.message}`);
      }
    });

    // 3. Сравнение с Task 2.1 (BundleSizeAnalyzer)
    console.log('\n📊 3. Task 2.1 vs Task 2.2 Comparison:');
    const bundleResults = integratedResults.filter(r => r.name.includes('Bundle') || r.name.includes('bundle'));
    const runtimeResults = integratedResults.filter(r => r.name.includes('Runtime') || r.name.includes('runtime'));

    console.log(`   Bundle Analysis (Task 2.1): ${bundleResults.length} checks`);
    console.log(`   Runtime Analysis (Task 2.2): ${runtimeResults.length} checks`);

    // Общий performance score
    const overviewResult = integratedResults.find(r => r.id === 'performance-overview');
    if (overviewResult) {
      console.log(`\n🎯 Overall Performance Score: ${overviewResult.score}/100`);
      console.log(`   Status: ${overviewResult.passed ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    }

    console.log('\n✅ Task 2.2 Integration Complete!');
    console.log('🎉 RuntimeMetricsAnalyzer successfully integrated with modular PerformanceChecker');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function demonstrateRuntimeFeatures() {
  console.log('\n🎨 Demonstrating RuntimeMetricsAnalyzer Features:');
  console.log('================================================');

  const analyzer = new RuntimeMetricsAnalyzer();

  console.log('🔧 Analyzer Configuration:');
  console.log(`   Name: ${analyzer.name}`);
  console.log(`   Category: ${analyzer.category}`);

  console.log('\n🎯 Core Web Vitals Analysis:');
  console.log('   ✓ LCP (Largest Contentful Paint) - анализ больших изображений');
  console.log('   ✓ FID (First Input Delay) - анализ тяжелых JS блоков');
  console.log('   ✓ CLS (Cumulative Layout Shift) - анализ динамического контента');

  console.log('\n⚡ JavaScript Performance Analysis:');
  console.log('   ✓ Функциональная сложность (cyclomatic complexity)');
  console.log('   ✓ Размер файлов и оптимизация');
  console.log('   ✓ Async/await vs Promise patterns');
  console.log('   ✓ Блокирующие операции');

  console.log('\n🏗️  DOM Operations Analysis:');
  console.log('   ✓ querySelector usage patterns');
  console.log('   ✓ DOM modification efficiency');
  console.log('   ✓ Event listener management');
  console.log('   ✓ Layout thrashing detection');

  console.log('\n🧠 Memory Pattern Analysis:');
  console.log('   ✓ Memory leak risk detection');
  console.log('   ✓ Large data structure analysis');
  console.log('   ✓ Inefficient loop patterns');
  console.log('   ✓ Event listener cleanup');

  console.log('\n🎭 Framework-Specific Optimizations:');
  console.log('   ✓ React: useMemo, useCallback, keys');
  console.log('   ✓ Vue: Composition API recommendations');
  console.log('   ✓ Svelte: Built-in optimizations');
  console.log('   ✓ Angular: Change detection strategies');
}

// Main execution
if (require.main === module) {
  (async () => {
    await demonstrateRuntimeFeatures();
    await testRuntimeMetricsAnalyzer();
  })();
}

export { testRuntimeMetricsAnalyzer, demonstrateRuntimeFeatures };
