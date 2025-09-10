/**
 * Простой тест Task 2.2: RuntimeMetricsAnalyzer
 * Тестирует новую функциональность runtime performance анализа
 */

const {
  RuntimeMetricsAnalyzer,
} = require('./eap-analyzer/src/checkers/performance/RuntimeMetricsAnalyzer.ts');

async function testRuntimeMetricsAnalyzer() {
  console.log('🔍 TASK 2.2: Testing RuntimeMetricsAnalyzer');
  console.log('===========================================');

  const projectPath = process.cwd();
  console.log(`📁 Analyzing project: ${projectPath}`);

  try {
    const runtimeAnalyzer = new RuntimeMetricsAnalyzer();

    console.log(`🔧 Analyzer Name: ${runtimeAnalyzer.name}`);
    console.log(`📂 Category: ${runtimeAnalyzer.category}`);

    const startTime = Date.now();
    const result = await runtimeAnalyzer.analyze(projectPath);
    const analysisTime = Date.now() - startTime;

    console.log(`\n✅ Analysis completed in ${analysisTime}ms`);
    console.log(`📈 Performance Score: ${result.score}/100`);
    console.log(`🎯 Issues Found: ${result.issues.length}`);
    console.log(`💡 Recommendations: ${result.recommendations.length}`);

    // Основные метрики
    console.log('\n📊 Metrics Summary:');
    for (const [key, value] of Object.entries(result.metrics)) {
      console.log(`   ${key}: ${JSON.stringify(value, null, 2).slice(0, 100)}...`);
    }

    // Issues
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      result.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
      if (result.issues.length > 5) {
        console.log(`   ... and ${result.issues.length - 5} more issues`);
      }
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      if (result.recommendations.length > 3) {
        console.log(`   ... and ${result.recommendations.length - 3} more recommendations`);
      }
    }

    console.log('\n✅ Task 2.2 Runtime Analysis Complete!');
    console.log('🎉 RuntimeMetricsAnalyzer successfully tested');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Демонстрация функций
function demonstrateFeatures() {
  console.log('\n🎨 RuntimeMetricsAnalyzer Features:');
  console.log('===================================');

  console.log('🎯 Core Web Vitals Analysis:');
  console.log('   ✓ LCP (Largest Contentful Paint) - image optimization');
  console.log('   ✓ FID (First Input Delay) - JS blocking operations');
  console.log('   ✓ CLS (Cumulative Layout Shift) - layout stability');

  console.log('\n⚡ JavaScript Performance:');
  console.log('   ✓ Function complexity analysis');
  console.log('   ✓ File size optimization');
  console.log('   ✓ Async/await patterns');
  console.log('   ✓ Blocking operations detection');

  console.log('\n🏗️  DOM Operations:');
  console.log('   ✓ Query selector efficiency');
  console.log('   ✓ DOM modification patterns');
  console.log('   ✓ Event listener management');
  console.log('   ✓ Layout thrashing detection');

  console.log('\n🧠 Memory Analysis:');
  console.log('   ✓ Memory leak detection');
  console.log('   ✓ Large data structures');
  console.log('   ✓ Inefficient loops');
  console.log('   ✓ Resource cleanup');

  console.log('\n🎭 Framework Optimizations:');
  console.log('   ✓ React performance patterns');
  console.log('   ✓ Vue.js optimizations');
  console.log('   ✓ Svelte best practices');
  console.log('   ✓ Angular change detection');
}

// Main execution
async function main() {
  demonstrateFeatures();
  await testRuntimeMetricsAnalyzer();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRuntimeMetricsAnalyzer, demonstrateFeatures };
