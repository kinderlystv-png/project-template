/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              PERFORMANCE METRICS REPORTER                    ║
 * ║     Кастомный reporter для детального анализа производительности
 * ╚═══════════════════════════════════════════════════════════════╝
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const fs = require('fs');
const path = require('path');

/**
 * Кастомный reporter для сбора и анализа метрик производительности
 */
class PerformanceReporter {
  constructor() {
    this.startTime = Date.now();
    this.testMetrics = new Map();
    this.systemMetrics = {
      memoryUsage: [],
      cpuUsage: [],
      workerStats: {},
    };

    // Интервал сбора системных метрик (каждые 100ms)
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 100);
  }

  /**
   * Собираем системные метрики во время выполнения тестов
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.systemMetrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    });

    this.systemMetrics.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system,
    });
  }

  /**
   * Начало выполнения suite тестов
   */
  onCollected(files) {
    const workerCount = process.env.VITEST_WORKERS || 'auto';
    console.log(`\n🚀 Performance Testing Started with ${workerCount} workers`);
    console.log(`📊 Monitoring ${files.length} test files\n`);
  }

  /**
   * Начало выполнения отдельного теста
   */
  onTestBegin(test) {
    this.testMetrics.set(test.id, {
      name: test.name,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
    });
  }

  /**
   * Завершение выполнения отдельного теста
   */
  onTestFinished(test) {
    const metrics = this.testMetrics.get(test.id);
    if (metrics) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      metrics.endTime = endTime;
      metrics.duration = endTime - metrics.startTime;
      metrics.endMemory = endMemory;
      metrics.memoryDelta = {
        rss: endMemory.rss - metrics.startMemory.rss,
        heapUsed: endMemory.heapUsed - metrics.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - metrics.startMemory.heapTotal,
      };
      metrics.result = test.result;

      this.testMetrics.set(test.id, metrics);
    }
  }

  /**
   * Завершение всех тестов - генерация отчёта
   */
  onFinished(files, errors) {
    clearInterval(this.metricsInterval);

    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    // Анализ результатов
    const analysis = this.analyzePerformance();

    // Генерация JSON отчёта
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration,
        totalTests: this.testMetrics.size,
        passedTests: analysis.passedTests,
        failedTests: analysis.failedTests,
        avgTestDuration: analysis.avgTestDuration,
        maxTestDuration: analysis.maxTestDuration,
        minTestDuration: analysis.minTestDuration,
      },
      performance: {
        memoryUsage: {
          peak: analysis.peakMemory,
          average: analysis.avgMemory,
          memoryLeaks: analysis.memoryLeaks,
        },
        cpuUsage: analysis.cpuStats,
        slowestTests: analysis.slowestTests,
        memoryHeavyTests: analysis.memoryHeavyTests,
      },
      systemMetrics: this.systemMetrics,
      recommendations: this.generateRecommendations(analysis),
    };

    // Сохранение отчёта
    this.saveReport(report);

    // Вывод краткой сводки в консоль
    this.printSummary(analysis, totalDuration);
  }

  /**
   * Анализ собранных метрик производительности
   */
  analyzePerformance() {
    const tests = Array.from(this.testMetrics.values());
    const durations = tests.map(t => t.duration).filter(d => d);
    const memoryDeltas = tests.map(t => t.memoryDelta?.heapUsed || 0);

    return {
      passedTests: tests.filter(t => t.result?.state === 'pass').length,
      failedTests: tests.filter(t => t.result?.state === 'fail').length,
      avgTestDuration: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
      maxTestDuration: Math.max(...durations) || 0,
      minTestDuration: Math.min(...durations) || 0,
      peakMemory: Math.max(...this.systemMetrics.memoryUsage.map(m => m.heapUsed)),
      avgMemory:
        this.systemMetrics.memoryUsage.reduce((a, b) => a + b.heapUsed, 0) /
        this.systemMetrics.memoryUsage.length,
      memoryLeaks: this.detectMemoryLeaks(),
      cpuStats: this.analyzeCpuUsage(),
      slowestTests: tests
        .filter(t => t.duration)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
      memoryHeavyTests: tests
        .filter(t => t.memoryDelta?.heapUsed)
        .sort((a, b) => b.memoryDelta.heapUsed - a.memoryDelta.heapUsed)
        .slice(0, 5),
    };
  }

  /**
   * Детектирование утечек памяти
   */
  detectMemoryLeaks() {
    const memUsage = this.systemMetrics.memoryUsage;
    if (memUsage.length < 10) return [];

    const recent = memUsage.slice(-10);
    const trend = recent[recent.length - 1].heapUsed - recent[0].heapUsed;

    return trend > 50 * 1024 * 1024 ? ['Potential memory leak detected'] : [];
  }

  /**
   * Анализ использования CPU
   */
  analyzeCpuUsage() {
    const cpuUsage = this.systemMetrics.cpuUsage;
    if (cpuUsage.length === 0) return {};

    const totalUser = cpuUsage.reduce((sum, cpu) => sum + cpu.user, 0);
    const totalSystem = cpuUsage.reduce((sum, cpu) => sum + cpu.system, 0);

    return {
      avgUserTime: totalUser / cpuUsage.length,
      avgSystemTime: totalSystem / cpuUsage.length,
      totalCpuTime: totalUser + totalSystem,
    };
  }

  /**
   * Генерация рекомендаций по оптимизации
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.avgTestDuration > 1000) {
      recommendations.push({
        type: 'performance',
        severity: 'warning',
        message:
          'Средняя длительность тестов превышает 1 секунду. Рассмотрите оптимизацию или разделение тестов.',
      });
    }

    if (analysis.memoryLeaks.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'critical',
        message: 'Обнаружены потенциальные утечки памяти. Проверьте очистку ресурсов в тестах.',
      });
    }

    if (analysis.failedTests > analysis.passedTests * 0.1) {
      recommendations.push({
        type: 'stability',
        severity: 'warning',
        message:
          'Высокий процент падающих тестов. Рассмотрите увеличение retry или стабилизацию тестов.',
      });
    }

    return recommendations;
  }

  /**
   * Сохранение подробного отчёта
   */
  saveReport(report) {
    const reportsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'performance-metrics.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Detailed performance report saved to: ${reportPath}`);
  }

  /**
   * Вывод краткой сводки в консоль
   */
  printSummary(analysis, totalDuration) {
    console.log('\n' + '═'.repeat(60));
    console.log('🎯 PERFORMANCE TESTING SUMMARY');
    console.log('═'.repeat(60));
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Passed Tests: ${analysis.passedTests}`);
    console.log(`❌ Failed Tests: ${analysis.failedTests}`);
    console.log(`📈 Avg Test Duration: ${Math.round(analysis.avgTestDuration)}ms`);
    console.log(`🐌 Slowest Test: ${Math.round(analysis.maxTestDuration)}ms`);
    console.log(`💾 Peak Memory: ${Math.round(analysis.peakMemory / 1024 / 1024)}MB`);

    if (analysis.memoryLeaks.length > 0) {
      console.log(`⚠️  Memory Leaks: ${analysis.memoryLeaks.length}`);
    }

    console.log('═'.repeat(60) + '\n');
  }
}

module.exports = PerformanceReporter;
