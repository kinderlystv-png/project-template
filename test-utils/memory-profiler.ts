/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                    MEMORY PROFILER                           ║
 * ║        Профилирование памяти для performance тестов          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

import { beforeAll, afterAll } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// 🔍 MEMORY PROFILING УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

interface MemorySnapshot {
  timestamp: number;
  memory: NodeJS.MemoryUsage;
  context: string;
}

class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private isEnabled: boolean = process.env.MEMORY_PROFILING === 'true';

  /**
   * Снимок памяти в определённый момент
   */
  snapshot(context: string = 'unnamed'): MemorySnapshot {
    if (!this.isEnabled) return {} as MemorySnapshot;

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      context,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Анализ изменений памяти между снимками
   */
  analyze(): {
    totalSnapshots: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    peakMemory: number;
    averageMemory: number;
    potentialLeaks: string[];
    detailedAnalysis: any[];
  } {
    if (this.snapshots.length < 2) {
      return {
        totalSnapshots: this.snapshots.length,
        memoryTrend: 'stable',
        peakMemory: 0,
        averageMemory: 0,
        potentialLeaks: [],
        detailedAnalysis: [],
      };
    }

    const heapUsages = this.snapshots.map(s => s.memory.heapUsed);
    const peakMemory = Math.max(...heapUsages);
    const averageMemory = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;

    // Определение тренда памяти
    const firstHalf = heapUsages.slice(0, Math.floor(heapUsages.length / 2));
    const secondHalf = heapUsages.slice(Math.floor(heapUsages.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let memoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const difference = secondAvg - firstAvg;
    const threshold = 10 * 1024 * 1024; // 10MB threshold

    if (difference > threshold) {
      memoryTrend = 'increasing';
    } else if (difference < -threshold) {
      memoryTrend = 'decreasing';
    }

    // Поиск потенциальных утечек
    const potentialLeaks: string[] = [];
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];
      const delta = curr.memory.heapUsed - prev.memory.heapUsed;

      if (delta > 20 * 1024 * 1024) {
        // 20MB jump
        potentialLeaks.push(
          `Large memory increase at ${curr.context}: +${Math.round(delta / 1024 / 1024)}MB`
        );
      }
    }

    // Детальный анализ по контекстам
    const detailedAnalysis = this.snapshots.map((snapshot, index) => ({
      index,
      context: snapshot.context,
      heapUsedMB: Math.round(snapshot.memory.heapUsed / 1024 / 1024),
      rssMB: Math.round(snapshot.memory.rss / 1024 / 1024),
      deltaSincePrevious:
        index > 0
          ? Math.round(
              (snapshot.memory.heapUsed - this.snapshots[index - 1].memory.heapUsed) / 1024 / 1024
            )
          : 0,
    }));

    return {
      totalSnapshots: this.snapshots.length,
      memoryTrend,
      peakMemory,
      averageMemory,
      potentialLeaks,
      detailedAnalysis,
    };
  }

  /**
   * Генерация отчёта о памяти
   */
  generateReport(): string {
    const analysis = this.analyze();

    let report = '\n📊 MEMORY PROFILING REPORT\n';
    report += '═'.repeat(50) + '\n';
    report += `Total Snapshots: ${analysis.totalSnapshots}\n`;
    report += `Memory Trend: ${analysis.memoryTrend}\n`;
    report += `Peak Memory: ${Math.round(analysis.peakMemory / 1024 / 1024)}MB\n`;
    report += `Average Memory: ${Math.round(analysis.averageMemory / 1024 / 1024)}MB\n`;

    if (analysis.potentialLeaks.length > 0) {
      report += '\n⚠️ POTENTIAL MEMORY LEAKS:\n';
      analysis.potentialLeaks.forEach(leak => {
        report += `  - ${leak}\n`;
      });
    }

    report += '\n📈 DETAILED ANALYSIS:\n';
    analysis.detailedAnalysis.forEach(detail => {
      const deltaStr =
        detail.deltaSincePrevious !== 0
          ? ` (${detail.deltaSincePrevious > 0 ? '+' : ''}${detail.deltaSincePrevious}MB)`
          : '';
      report += `  ${detail.index}: ${detail.context} - ${detail.heapUsedMB}MB${deltaStr}\n`;
    });

    report += '═'.repeat(50);

    return report;
  }

  /**
   * Очистка собранных данных
   */
  reset(): void {
    this.snapshots = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 🌍 ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР PROFILER
// ═══════════════════════════════════════════════════════════════

const memoryProfiler = new MemoryProfiler();

// Экспорт для использования в тестах
export { memoryProfiler };

// ═══════════════════════════════════════════════════════════════
// 🎯 АВТОМАТИЧЕСКИЕ ХУКИ ДЛЯ ПРОФИЛИРОВАНИЯ
// ═══════════════════════════════════════════════════════════════

beforeAll(() => {
  if (process.env.MEMORY_PROFILING === 'true') {
    memoryProfiler.snapshot('test-suite-start');
    // eslint-disable-next-line no-console
    console.info('🔍 Memory profiling enabled');
  }
});

afterAll(() => {
  if (process.env.MEMORY_PROFILING === 'true') {
    memoryProfiler.snapshot('test-suite-end');

    const report = memoryProfiler.generateReport();
    // eslint-disable-next-line no-console
    console.info(report);

    // Сохранение отчёта в файл
    const fs = require('fs');
    const path = require('path');

    const reportsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'memory-profile.txt');
    fs.writeFileSync(reportPath, report);

    // eslint-disable-next-line no-console
    console.info(`💾 Memory profile saved to: ${reportPath}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 🛠️ УТИЛИТАРНЫЕ ФУНКЦИИ ДЛЯ ТЕСТОВ
// ═══════════════════════════════════════════════════════════════

/**
 * Принудительная сборка мусора (если доступна)
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Ожидание с возможностью сборки мусора
 */
export function waitWithGC(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (global.gc) {
        global.gc();
      }
      resolve();
    }, ms);
  });
}

/**
 * Обёртка для тестирования функций с контролем памяти
 */
export async function withMemoryControl<T>(
  testName: string,
  fn: () => Promise<T> | T,
  options: {
    gcBefore?: boolean;
    gcAfter?: boolean;
    snapshot?: boolean;
  } = {}
): Promise<T> {
  const { gcBefore = true, gcAfter = true, snapshot = true } = options;

  if (gcBefore && global.gc) {
    global.gc();
  }

  if (snapshot) {
    memoryProfiler.snapshot(`${testName}-start`);
  }

  const result = await fn();

  if (snapshot) {
    memoryProfiler.snapshot(`${testName}-end`);
  }

  if (gcAfter && global.gc) {
    global.gc();
  }

  return result;
}
