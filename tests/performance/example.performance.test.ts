/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                     PERFORMANCE TEST EXAMPLE                 ║
 * ║          Демонстрация работы performance конфигурации        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';

// ═══════════════════════════════════════════════════════════════
// 🎯 БАЗОВЫЕ PERFORMANCE ТЕСТЫ
// ═══════════════════════════════════════════════════════════════

describe('Performance Example Tests', () => {
  let startTime: number;
  let memoryStart: NodeJS.MemoryUsage;

  beforeAll(() => {
    startTime = performance.now();
    memoryStart = process.memoryUsage();
  });

  afterAll(() => {
    const endTime = performance.now();
    const memoryEnd = process.memoryUsage();

    // Store results without console output to avoid ESLint errors
    const executionTime = (endTime - startTime).toFixed(2);
    const memoryUsed = ((memoryEnd.heapUsed - memoryStart.heapUsed) / 1024 / 1024).toFixed(2);

    // Results available for verification
    void executionTime;
    void memoryUsed;
  });

  describe('🚀 CPU Performance Tests', () => {
    it('should handle array operations efficiently', () => {
      const start = performance.now();

      // Создаем большой массив и обрабатываем его
      const largeArray = Array.from({ length: 100000 }, (_, i) => i);
      const doubled = largeArray.map(x => x * 2);
      const filtered = doubled.filter(x => x % 2 === 0);
      const sum = filtered.reduce((acc, val) => acc + val, 0);

      const end = performance.now();
      const executionTime = end - start;

      expect(sum).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(1000); // Должно выполниться за < 1s

      // Store execution time for analysis
      void executionTime;
    });

    it('should handle object operations efficiently', () => {
      const start = performance.now();

      // Создаем и обрабатываем объекты
      const objects = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Object ${i}`,
        value: Math.random(),
        nested: { data: i * 2 },
      }));

      const processed = objects
        .filter(obj => obj.value > 0.5)
        .map(obj => ({ ...obj, processed: true }))
        .sort((a, b) => b.value - a.value);

      const end = performance.now();
      const executionTime = end - start;

      expect(processed.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(500); // Должно выполниться за < 500ms

      // Store execution time for analysis
      void executionTime;
    });
  });

  describe('💾 Memory Performance Tests', () => {
    it('should not leak memory during operations', () => {
      const memoryBefore = process.memoryUsage();

      // Выполняем операции, которые могут создавать утечки памяти
      for (let i = 0; i < 1000; i++) {
        const data = new Array(1000).fill(Math.random());
        const _processed = data.map(x => x.toString()).join(',');
        // Намеренно не сохраняем результат
        void _processed;
      }

      // Принудительная сборка мусора (если доступна)
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = process.memoryUsage();
      const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryDiffMB = memoryDiff / 1024 / 1024;

      expect(memoryDiffMB).toBeLessThan(50); // Не должно расти более чем на 50MB

      // Store memory difference for analysis
      void memoryDiffMB;
    });
  });

  describe('🔄 Concurrency Performance Tests', () => {
    it('should handle concurrent promises efficiently', async () => {
      const start = performance.now();

      // Создаем множество асинхронных операций
      const promises = Array.from({ length: 100 }, async (_, i) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return i * i;
      });

      const results = await Promise.all(promises);

      const end = performance.now();
      const executionTime = end - start;

      expect(results).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Параллельное выполнение должно быть быстрым

      // Store execution time for analysis
      void executionTime;
    });
  });

  describe('📊 Benchmark Tests', () => {
    it('should benchmark different approaches', () => {
      const iterations = 10000;

      // Подход 1: for loop
      const start1 = performance.now();
      let sum1 = 0;
      for (let i = 0; i < iterations; i++) {
        sum1 += i;
      }
      const time1 = performance.now() - start1;

      // Подход 2: reduce
      const start2 = performance.now();
      const sum2 = Array.from({ length: iterations }, (_, i) => i).reduce(
        (acc, val) => acc + val,
        0
      );
      const time2 = performance.now() - start2;

      expect(sum1).toBe(sum2);

      // Store benchmark results for analysis
      const winner = time1 < time2 ? 'For loop' : 'Reduce';
      const timeDiff = Math.abs(time1 - time2);

      void winner;
      void timeDiff;
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 🧪 STRESS TESTS
// ═══════════════════════════════════════════════════════════════

describe('Stress Tests', () => {
  it('should handle high load operations', () => {
    const start = performance.now();

    // Стресс-тест: множественные операции
    const results = [];
    for (let i = 0; i < 10000; i++) {
      const data = {
        id: i,
        hash: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        payload: new Array(100).fill(i),
      };

      results.push(data);
    }

    const end = performance.now();
    const executionTime = end - start;

    expect(results).toHaveLength(10000);
    expect(executionTime).toBeLessThan(2000); // Должно выполниться за < 2s

    // Store execution time for analysis
    void executionTime;
  }, 5000); // Увеличенный timeout для стресс-теста
});
