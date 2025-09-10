#!/usr/bin/env node

/**
 * Демонстрация Task 2.2: RuntimeMetricsAnalyzer + интеграция
 * Тестирует новую функциональность runtime performance анализа
 */

import { createPerformanceChecker } from './eap-analyzer/src/checkers/performance/index.js';
import { RuntimeMetricsAnalyzer } from './eap-analyzer/src/checkers/performance/RuntimeMetricsAnalyzer.js';
import * as path from 'path';

async function testRuntimeMetricsAnalyzer(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🔍 TASK 2.2: Testing RuntimeMetricsAnalyzer Integration');
  // eslint-disable-next-line no-console
  console.log('================================================');

  const projectPath = process.cwd();
  // eslint-disable-next-line no-console
  console.log(`📁 Analyzing project: ${projectPath}`);

  try {
    // 1. Прямое тестирование RuntimeMetricsAnalyzer
    // eslint-disable-next-line no-console
    console.log('\n📊 1. Direct RuntimeMetricsAnalyzer Test:');
    const runtimeAnalyzer = new RuntimeMetricsAnalyzer();

    const startTime = Date.now();
    const result = await runtimeAnalyzer.analyze(projectPath);
    const analysisTime = Date.now() - startTime;

    // eslint-disable-next-line no-console
    console.log(`✅ Analysis completed in ${analysisTime}ms`);
    // eslint-disable-next-line no-console
    console.log(`📈 Performance Score: ${result.score}/100`);
    // eslint-disable-next-line no-console
    console.log(`🎯 Issues Found: ${result.issues.length}`);
    // eslint-disable-next-line no-console
    console.log(`💡 Recommendations: ${result.recommendations.length}`);

    // Подробности Core Web Vitals
    if (result.metrics.coreWebVitals) {
      const cwv = result.metrics.coreWebVitals as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.log('\n🌐 Core Web Vitals Analysis:');
      // eslint-disable-next-line no-console
      console.log(`   LCP Factors: ${JSON.stringify(cwv.lcpFactors, null, 2)}`);
      // eslint-disable-next-line no-console
      console.log(`   FID Factors: ${JSON.stringify(cwv.fidFactors, null, 2)}`);
      // eslint-disable-next-line no-console
      console.log(`   CLS Factors: ${JSON.stringify(cwv.clsFactors, null, 2)}`);
    }

    // Подробности JavaScript Performance
    if (result.metrics.jsPerformance) {
      const jsp = result.metrics.jsPerformance as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.log('\n⚡ JavaScript Performance:');
      // eslint-disable-next-line no-console
      console.log(`   Total JS Files: ${jsp.totalJSFiles}`);
      // eslint-disable-next-line no-console
      console.log(`   Complex Functions: ${jsp.complexFunctions}`);
      // eslint-disable-next-line no-console
      console.log(`   Large Files: ${jsp.largeFiles}`);
      // eslint-disable-next-line no-console
      console.log(`   Async/Await Usage: ${jsp.asyncAwaitUsage}`);
      // eslint-disable-next-line no-console
      console.log(`   Promise Usage: ${jsp.promiseUsage}`);
    }

    // Подробности DOM Operations
    if (result.metrics.domOperations) {
      const dom = result.metrics.domOperations as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.log('\n🏗️  DOM Operations Analysis:');
      // eslint-disable-next-line no-console
      console.log(`   Total DOM Queries: ${dom.totalDOMQueries}`);
      // eslint-disable-next-line no-console
      console.log(`   DOM Modifications: ${dom.domModifications}`);
      // eslint-disable-next-line no-console
      console.log(`   Event Listeners: ${dom.eventListeners}`);
      // eslint-disable-next-line no-console
      console.log(`   Inefficient Queries: ${dom.inefficientQueries}`);
    }

    // Подробности Memory Patterns
    if (result.metrics.memoryPatterns) {
      const mem = result.metrics.memoryPatterns as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.log('\n🧠 Memory Patterns:');
      // eslint-disable-next-line no-console
      console.log(`   Memory Leak Risks: ${mem.memoryLeakRisks}`);
      // eslint-disable-next-line no-console
      console.log(`   Large Data Structures: ${mem.largeDataStructures}`);
      // eslint-disable-next-line no-console
      console.log(`   Inefficient Loops: ${mem.inefficientLoops}`);
    }

    // Issues and Recommendations
    if (result.issues.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n⚠️  Issues Found:');
      result.issues.forEach((issue, index) => {
        // eslint-disable-next-line no-console
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    if (result.recommendations.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        // eslint-disable-next-line no-console
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // 2. Интеграционное тестирование с PerformanceChecker
    // eslint-disable-next-line no-console
    console.log('\n📊 2. Integrated PerformanceChecker Test:');
    const checker = createPerformanceChecker({
      enableRuntimeAnalysis: true,
      enableBundleAnalysis: true,
      enableDependencyAnalysis: true,
    });

    // eslint-disable-next-line no-console
    console.log(`🔧 Registered analyzers: ${checker.getAnalyzers().length}`);
    checker.getAnalyzers().forEach((analyzer, index) => {
      // eslint-disable-next-line no-console
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
        modified: new Date(),
      }),
      readFile: async () => '',
      hasFile: async () => false,
      exists: async () => true,
      resolvePath: (relativePath: string) => path.join(projectPath, relativePath),
    };

    const integratedResults = await checker.check(mockProject);

    // eslint-disable-next-line no-console
    console.log('\n📋 Integrated Analysis Results:');
    integratedResults.forEach((checkResult, index) => {
      // eslint-disable-next-line no-console
      console.log(
        `   ${index + 1}. ${checkResult.name}: ${checkResult.passed ? '✅' : '❌'} (${checkResult.score}/${checkResult.maxScore})`
      );
      if (checkResult.message) {
        // eslint-disable-next-line no-console
        console.log(`      ${checkResult.message}`);
      }
    });

    // 3. Сравнение с Task 2.1 (BundleSizeAnalyzer)
    // eslint-disable-next-line no-console
    console.log('\n📊 3. Task 2.1 vs Task 2.2 Comparison:');
    const bundleResults = integratedResults.filter(
      r => r.name.includes('Bundle') || r.name.includes('bundle')
    );
    const runtimeResults = integratedResults.filter(
      r => r.name.includes('Runtime') || r.name.includes('runtime')
    );

    // eslint-disable-next-line no-console
    console.log(`   Bundle Analysis (Task 2.1): ${bundleResults.length} checks`);
    // eslint-disable-next-line no-console
    console.log(`   Runtime Analysis (Task 2.2): ${runtimeResults.length} checks`);

    // Общий performance score
    const overviewResult = integratedResults.find(r => r.id === 'performance-overview');
    if (overviewResult) {
      // eslint-disable-next-line no-console
      console.log(`\n🎯 Overall Performance Score: ${overviewResult.score}/100`);
      // eslint-disable-next-line no-console
      console.log(`   Status: ${overviewResult.passed ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    }

    // eslint-disable-next-line no-console
    console.log('\n✅ Task 2.2 Integration Complete!');
    // eslint-disable-next-line no-console
    console.log(
      '🎉 RuntimeMetricsAnalyzer successfully integrated with modular PerformanceChecker'
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function demonstrateRuntimeFeatures(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('\n🎨 Demonstrating RuntimeMetricsAnalyzer Features:');
  // eslint-disable-next-line no-console
  console.log('================================================');

  const analyzer = new RuntimeMetricsAnalyzer();

  // eslint-disable-next-line no-console
  console.log('🔧 Analyzer Configuration:');
  // eslint-disable-next-line no-console
  console.log(`   Name: ${analyzer.name}`);
  // eslint-disable-next-line no-console
  console.log(`   Category: ${analyzer.category}`);

  // eslint-disable-next-line no-console
  console.log('\n🎯 Core Web Vitals Analysis:');
  // eslint-disable-next-line no-console
  console.log('   ✓ LCP (Largest Contentful Paint) - анализ больших изображений');
  // eslint-disable-next-line no-console
  console.log('   ✓ FID (First Input Delay) - анализ тяжелых JS блоков');
  // eslint-disable-next-line no-console
  console.log('   ✓ CLS (Cumulative Layout Shift) - анализ динамического контента');

  // eslint-disable-next-line no-console
  console.log('\n⚡ JavaScript Performance Analysis:');
  // eslint-disable-next-line no-console
  console.log('   ✓ Функциональная сложность (cyclomatic complexity)');
  // eslint-disable-next-line no-console
  console.log('   ✓ Размер файлов и оптимизация');
  // eslint-disable-next-line no-console
  console.log('   ✓ Async/await vs Promise patterns');
  // eslint-disable-next-line no-console
  console.log('   ✓ Блокирующие операции');

  // eslint-disable-next-line no-console
  console.log('\n🏗️  DOM Operations Analysis:');
  // eslint-disable-next-line no-console
  console.log('   ✓ querySelector usage patterns');
  // eslint-disable-next-line no-console
  console.log('   ✓ DOM modification efficiency');
  // eslint-disable-next-line no-console
  console.log('   ✓ Event listener management');
  // eslint-disable-next-line no-console
  console.log('   ✓ Layout thrashing detection');

  // eslint-disable-next-line no-console
  console.log('\n🧠 Memory Pattern Analysis:');
  // eslint-disable-next-line no-console
  console.log('   ✓ Memory leak risk detection');
  // eslint-disable-next-line no-console
  console.log('   ✓ Large data structure analysis');
  // eslint-disable-next-line no-console
  console.log('   ✓ Inefficient loop patterns');
  // eslint-disable-next-line no-console
  console.log('   ✓ Event listener cleanup');

  // eslint-disable-next-line no-console
  console.log('\n🎭 Framework-Specific Optimizations:');
  // eslint-disable-next-line no-console
  console.log('   ✓ React: useMemo, useCallback, keys');
  // eslint-disable-next-line no-console
  console.log('   ✓ Vue: Composition API recommendations');
  // eslint-disable-next-line no-console
  console.log('   ✓ Svelte: Built-in optimizations');
  // eslint-disable-next-line no-console
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
