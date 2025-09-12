/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║               GLOBAL PERFORMANCE SETUP                       ║
 * ║      Глобальная настройка для performance тестирования        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ═══════════════════════════════════════════════════════════════
// 🏗️ ГЛОБАЛЬНЫЙ SETUP
// ═══════════════════════════════════════════════════════════════

export async function setup(): Promise<void> {
  // eslint-disable-next-line no-console
  console.info('🚀 Starting global performance setup...');

  // Создание директории для результатов
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Очистка предыдущих результатов
  const existingFiles = fs
    .readdirSync(resultsDir)
    .filter(file => file.includes('performance') || file.includes('benchmark'));

  existingFiles.forEach(file => {
    fs.unlinkSync(path.join(resultsDir, file));
  });

  // Настройка Node.js для performance тестирования
  setupNodeEnvironment();

  // Сбор информации о системе
  const systemInfo = await collectSystemInfo();

  // Сохранение системной информации
  fs.writeFileSync(path.join(resultsDir, 'system-info.json'), JSON.stringify(systemInfo, null, 2));

  // eslint-disable-next-line no-console
  console.info('✅ Global performance setup completed');
}

// ═══════════════════════════════════════════════════════════════
// 🏁 ГЛОБАЛЬНЫЙ TEARDOWN
// ═══════════════════════════════════════════════════════════════

export async function teardown(): Promise<void> {
  // eslint-disable-next-line no-console
  console.info('🏁 Starting global performance teardown...');

  // Принудительная сборка мусора
  if (global.gc) {
    global.gc();
  }

  // Генерация сводного отчёта
  await generateSummaryReport();

  // eslint-disable-next-line no-console
  console.info('✅ Global performance teardown completed');
}

// ═══════════════════════════════════════════════════════════════
// 🛠️ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════════════════

/**
 * Настройка Node.js окружения для оптимальной производительности
 */
function setupNodeEnvironment(): void {
  // Увеличение лимита памяти для V8 (если не установлен)
  if (!process.execArgv.includes('--max-old-space-size')) {
    // eslint-disable-next-line no-console
    console.info('💡 Consider setting --max-old-space-size for better performance');
  }

  // Включение оптимизаций
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'test';
  }

  // Настройка timezone для консистентности
  process.env.TZ = 'UTC';

  // Настройки для лучшей производительности
  if (process.platform === 'linux') {
    // Linux-specific optimizations
    process.env.UV_THREADPOOL_SIZE = String(require('os').cpus().length);
  }
}

/**
 * Сбор информации о системе для анализа результатов
 */
async function collectSystemInfo(): Promise<Record<string, any>> {
  const os = require('os');

  const systemInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,

    cpu: {
      model: os.cpus()[0]?.model || 'unknown',
      cores: os.cpus().length,
      speed: os.cpus()[0]?.speed || 0,
    },

    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    },

    process: {
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },

    environment: {
      nodeEnv: process.env.NODE_ENV,
      ci: process.env.CI,
      vitestWorkers: process.env.VITEST_WORKERS,
      memoryProfiling: process.env.MEMORY_PROFILING,
    },
  };

  // Добавление Git информации если доступна
  try {
    systemInfo.git = {
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      commit: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
      dirty: execSync('git status --porcelain', { encoding: 'utf8' }).trim() !== '',
    };
  } catch {
    // Git информация недоступна
  }

  return systemInfo;
}

/**
 * Генерация сводного отчёта по результатам тестирования
 */
async function generateSummaryReport(): Promise<void> {
  const resultsDir = path.join(process.cwd(), 'test-results');
  const summaryPath = path.join(resultsDir, 'performance-summary.json');

  try {
    // Сбор всех результатов
    const results: Record<string, any> = {};

    // Чтение performance-metrics.json если существует
    const metricsPath = path.join(resultsDir, 'performance-metrics.json');
    if (fs.existsSync(metricsPath)) {
      results.performanceMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    }

    // Чтение benchmark результатов если существуют
    const benchmarkPath = path.join(resultsDir, 'benchmark-results.json');
    if (fs.existsSync(benchmarkPath)) {
      results.benchmarkResults = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
    }

    // Чтение системной информации
    const systemInfoPath = path.join(resultsDir, 'system-info.json');
    if (fs.existsSync(systemInfoPath)) {
      results.systemInfo = JSON.parse(fs.readFileSync(systemInfoPath, 'utf8'));
    }

    // Генерация сводки
    const summary = {
      generatedAt: new Date().toISOString(),
      testingSummary: generateTestingSummary(results),
      systemInfo: results.systemInfo,
      recommendations: generateRecommendations(results),
      rawResults: results,
    };

    // Сохранение сводного отчёта
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // eslint-disable-next-line no-console
    console.info(`📋 Performance summary saved to: ${summaryPath}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to generate summary report:', error);
  }
}

/**
 * Генерация краткой сводки по тестированию
 */
function generateTestingSummary(results: Record<string, any>): Record<string, any> {
  const summary: Record<string, any> = {};

  if (results.performanceMetrics?.summary) {
    const metrics = results.performanceMetrics.summary;
    summary.performance = {
      totalTests: metrics.totalTests,
      passedTests: metrics.passedTests,
      failedTests: metrics.failedTests,
      avgDuration: Math.round(metrics.avgTestDuration),
      maxDuration: Math.round(metrics.maxTestDuration),
      peakMemoryMB: Math.round(metrics.peakMemory / 1024 / 1024),
    };
  }

  if (results.benchmarkResults) {
    summary.benchmarks = {
      totalBenchmarks: results.benchmarkResults.length || 0,
    };
  }

  return summary;
}

/**
 * Генерация рекомендаций на основе результатов
 */
function generateRecommendations(results: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (results.performanceMetrics?.recommendations) {
    results.performanceMetrics.recommendations.forEach((rec: any) => {
      recommendations.push(`${rec.type}: ${rec.message}`);
    });
  }

  // Системные рекомендации
  if (results.systemInfo?.memory) {
    const memoryUsagePercent =
      (results.systemInfo.memory.used / results.systemInfo.memory.total) * 100;
    if (memoryUsagePercent > 80) {
      recommendations.push(
        'system: High memory usage detected. Consider closing other applications.'
      );
    }
  }

  return recommendations;
}
