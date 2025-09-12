/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                 PERFORMANCE SETUP UTILITIES                  ║
 * ║         Настройка окружения для performance тестирования      ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// 🏗️ ГЛОБАЛЬНАЯ НАСТРОЙКА PERFORMANCE ОКРУЖЕНИЯ
// ═══════════════════════════════════════════════════════════════

interface PerformanceMetrics {
  startTime: number;
  startMemory: NodeJS.MemoryUsage;
  startCpu: NodeJS.CpuUsage;
  endTime?: number;
  duration?: number;
  endMemory?: NodeJS.MemoryUsage;
  endCpu?: NodeJS.CpuUsage;
  memoryDelta?: NodeJS.MemoryUsage;
}

/**
 * Глобальные переменные для отслеживания производительности
 */
declare global {
  // eslint-disable-next-line no-var
  var __PERFORMANCE_START_TIME__: number;
  // eslint-disable-next-line no-var
  var __PERFORMANCE_MEMORY_BASELINE__: NodeJS.MemoryUsage;
  // eslint-disable-next-line no-var
  var __PERFORMANCE_METRICS__: Map<string, PerformanceMetrics>;
}

// Инициализация глобальных переменных для performance трекинга
globalThis.__PERFORMANCE_START_TIME__ = Date.now();
globalThis.__PERFORMANCE_MEMORY_BASELINE__ = process.memoryUsage();
globalThis.__PERFORMANCE_METRICS__ = new Map();

// ═══════════════════════════════════════════════════════════════
// 🚀 SETUP И TEARDOWN ХУКИ
// ═══════════════════════════════════════════════════════════════

beforeAll(async () => {
  // Принудительная сборка мусора перед началом тестирования
  if (global.gc) {
    global.gc();
  }

  // Установка базовых метрик
  globalThis.__PERFORMANCE_START_TIME__ = Date.now();
  globalThis.__PERFORMANCE_MEMORY_BASELINE__ = process.memoryUsage();

  // Настройка environment-специфичных параметров
  process.env.NODE_ENV = 'test';
  process.env.PERFORMANCE_TESTING = 'true';
});

beforeEach(async () => {
  // Очистка метрик перед каждым тестом
  if (global.gc) {
    global.gc();
  }

  // Используем Date.now() для уникального ID теста
  const testId = `test-${Date.now()}-${Math.random()}`;
  globalThis.__PERFORMANCE_METRICS__.set(testId, {
    startTime: Date.now(),
    startMemory: process.memoryUsage(),
    startCpu: process.cpuUsage(),
  });
});

afterEach(async () => {
  // Финальная сборка мусора
  if (global.gc) {
    global.gc();
  }
});

afterAll(async () => {
  // Принудительная сборка мусора
  if (global.gc) {
    global.gc();
  }

  const totalDuration = Date.now() - globalThis.__PERFORMANCE_START_TIME__;
  const finalMemory = process.memoryUsage();
  const memoryDelta = {
    rss: finalMemory.rss - globalThis.__PERFORMANCE_MEMORY_BASELINE__.rss,
    heapUsed: finalMemory.heapUsed - globalThis.__PERFORMANCE_MEMORY_BASELINE__.heapUsed,
    heapTotal: finalMemory.heapTotal - globalThis.__PERFORMANCE_MEMORY_BASELINE__.heapTotal,
    external: finalMemory.external - globalThis.__PERFORMANCE_MEMORY_BASELINE__.external,
    arrayBuffers:
      finalMemory.arrayBuffers - globalThis.__PERFORMANCE_MEMORY_BASELINE__.arrayBuffers,
  };

  // Результаты доступны, но не выводим в консоль (ESLint)
  void totalDuration;
  void memoryDelta;
});

// ═══════════════════════════════════════════════════════════════
// 🛠️ УТИЛИТАРНЫЕ ФУНКЦИИ ДЛЯ PERFORMANCE ТЕСТОВ
// ═══════════════════════════════════════════════════════════════

/**
 * Утилита для измерения времени выполнения функции
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Утилита для измерения использования памяти функцией
 */
export async function measureMemory<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; memoryDelta: NodeJS.MemoryUsage }> {
  // Сборка мусора для точных измерений
  if (global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage();
  const result = await fn();

  if (global.gc) {
    global.gc();
  }

  const endMemory = process.memoryUsage();
  const memoryDelta = {
    rss: endMemory.rss - startMemory.rss,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
  };

  return { result, memoryDelta };
}

/**
 * Утилита для benchmark тестирования
 */
export async function benchmark<T>(
  name: string,
  fn: () => Promise<T> | T,
  iterations = 100
): Promise<{
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}> {
  const times: number[] = [];

  // Прогрев
  for (let i = 0; i < Math.min(10, iterations); i++) {
    await fn();
  }

  // Основной benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSecond = 1000 / avgTime;

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    opsPerSecond,
  };
}

/**
 * Ассерты для performance тестирования
 */
export const performanceAssert = {
  /**
   * Проверяет, что функция выполняется быстрее указанного времени
   */
  async executesWithin<T>(fn: () => Promise<T> | T, maxTimeMs: number): Promise<T> {
    const { result, duration } = await measureTime(fn);

    if (duration > maxTimeMs) {
      throw new Error(`Function took ${duration}ms, expected less than ${maxTimeMs}ms`);
    }

    return result;
  },

  /**
   * Проверяет, что функция не использует больше указанного количества памяти
   */
  async usesMemoryLessThan<T>(fn: () => Promise<T> | T, maxMemoryMB: number): Promise<T> {
    const { result, memoryDelta } = await measureMemory(fn);
    const memoryUsedMB = memoryDelta.heapUsed / 1024 / 1024;

    if (memoryUsedMB > maxMemoryMB) {
      throw new Error(`Function used ${memoryUsedMB}MB, expected less than ${maxMemoryMB}MB`);
    }

    return result;
  },
};
