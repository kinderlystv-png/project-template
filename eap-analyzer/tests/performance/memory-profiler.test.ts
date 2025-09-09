/**
 * Тесты для Memory Profiler
 * Проверяет корректность профилирования памяти и обнаружения утечек
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryProfiler } from '../../src/modules/performance-analyzer/memory-profiler.js';

describe('MemoryProfiler', () => {
  let profiler: MemoryProfiler;

  beforeEach(() => {
    profiler = new MemoryProfiler();
  });

  afterEach(() => {
    profiler.stopProfiling();
  });

  describe('Basic Profiling', () => {
    it('should start and stop profiling correctly', () => {
      expect(profiler.analyzeProfile().snapshots).toHaveLength(0);

      profiler.startProfiling();
      profiler.takeSnapshot('test');
      profiler.stopProfiling();

      const result = profiler.analyzeProfile();
      expect(result.snapshots.length).toBeGreaterThan(0);
    });

    it('should take memory snapshots with correct structure', () => {
      profiler.startProfiling();
      profiler.takeSnapshot('test-phase');

      const result = profiler.analyzeProfile();
      const snapshot = result.snapshots[0];

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('heapUsed');
      expect(snapshot).toHaveProperty('heapTotal');
      expect(snapshot).toHaveProperty('external');
      expect(snapshot).toHaveProperty('rss');
      expect(snapshot).toHaveProperty('arrayBuffers');
      expect(snapshot.phase).toBe('test-phase');

      expect(typeof snapshot.heapUsed).toBe('number');
      expect(snapshot.heapUsed).toBeGreaterThan(0);
    });

    it('should calculate peak and average memory correctly', () => {
      profiler.startProfiling();

      // Создаем искусственную нагрузку на память
      const bigArray: number[][] = [];
      for (let i = 0; i < 100; i++) {
        profiler.takeSnapshot(`load-${i}`);
        bigArray.push(new Array(1000).fill(Math.random()));
      }

      profiler.stopProfiling();

      const result = profiler.analyzeProfile();
      expect(result.peakMemory).toBeGreaterThan(result.averageMemory);
      expect(result.peakMemory).toBeGreaterThan(0);
      expect(result.averageMemory).toBeGreaterThan(0);

      // Очищаем память
      bigArray.length = 0;
    });

    it('should detect memory leaks', async () => {
      profiler.startProfiling();

      // Симулируем утечку памяти
      const leak: any[] = [];

      profiler.takeSnapshot('start');

      for (let i = 0; i < 50; i++) {
        // Добавляем объекты без очистки
        leak.push(new Array(1000).fill({ data: Math.random() }));

        if (i % 10 === 0) {
          profiler.takeSnapshot('leak-phase');
          await new Promise(resolve => setTimeout(resolve, 10)); // Небольшая задержка
        }
      }

      profiler.takeSnapshot('end');
      profiler.stopProfiling();

      const result = profiler.analyzeProfile();

      // Проверяем что утечка обнаружена
      expect(result.memoryLeaks.length).toBeGreaterThan(0);

      const leakPhases = result.memoryLeaks.filter(l => l.phase === 'leak-phase');
      if (leakPhases.length > 0) {
        expect(leakPhases[0].growthRate).toBeGreaterThan(0);
      }

      // Очищаем утечку
      leak.length = 0;
    });
  });

  describe('Memory Efficiency Analysis', () => {
    it('should calculate efficiency score correctly', () => {
      profiler.startProfiling();

      // Симулируем нормальное использование памяти
      profiler.takeSnapshot('normal-1');
      profiler.takeSnapshot('normal-2');
      profiler.takeSnapshot('normal-3');

      profiler.stopProfiling();

      const result = profiler.analyzeProfile();

      expect(result.efficiency).toHaveProperty('score');
      expect(result.efficiency).toHaveProperty('grade');
      expect(result.efficiency).toHaveProperty('description');

      expect(result.efficiency.score).toBeGreaterThanOrEqual(0);
      expect(result.efficiency.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.efficiency.grade);
    });

    it('should generate appropriate recommendations', () => {
      profiler.startProfiling();
      profiler.takeSnapshot('test');
      profiler.stopProfiling();

      const result = profiler.analyzeProfile();

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(typeof result.recommendations[0]).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty profiling session', () => {
      const result = profiler.analyzeProfile();

      expect(result.snapshots).toHaveLength(0);
      expect(result.peakMemory).toBe(0);
      expect(result.averageMemory).toBe(0);
      expect(result.memoryLeaks).toHaveLength(0);
      expect(result.efficiency.score).toBe(0);
      expect(result.efficiency.grade).toBe('F');
    });

    it('should handle single snapshot', () => {
      profiler.startProfiling();
      profiler.takeSnapshot('single');
      profiler.stopProfiling();

      const result = profiler.analyzeProfile();

      expect(result.snapshots).toHaveLength(1);
      expect(result.peakMemory).toEqual(result.averageMemory);
      expect(result.memoryLeaks).toHaveLength(0); // Нельзя детектировать утечки с одним снимком
    });

    it('should handle multiple start/stop cycles', () => {
      // Первый цикл
      profiler.startProfiling();
      profiler.takeSnapshot('cycle1');
      profiler.stopProfiling();

      const result1 = profiler.analyzeProfile();

      // Второй цикл
      profiler.startProfiling();
      profiler.takeSnapshot('cycle2');
      profiler.stopProfiling();

      const result2 = profiler.analyzeProfile();

      // Второй результат должен заменить первый
      expect(result2.snapshots).toHaveLength(1);
      expect(result2.snapshots[0].phase).toBe('cycle2');
    });
  });

  describe('Memory Management', () => {
    it('should force garbage collection when available', () => {
      const result = profiler.forceGC();

      // Результат зависит от наличия флага --expose-gc
      expect(typeof result).toBe('boolean');
    });

    it('should get current memory usage', () => {
      const snapshot = profiler.getCurrentMemoryUsage();

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('heapUsed');
      expect(snapshot).toHaveProperty('phase');
      expect(snapshot.phase).toBe('current');
      expect(snapshot.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should profile file processing simulation', async () => {
      profiler.startProfiling();
      profiler.takeSnapshot('start');

      // Симулируем обработку файлов
      const processedData: string[] = [];

      for (let i = 0; i < 20; i++) {
        // Симулируем чтение файла
        const fileContent = 'x'.repeat(1000 * (i + 1)); // Растущий размер
        processedData.push(fileContent);

        profiler.takeSnapshot('file-processing');

        await new Promise(resolve => setTimeout(resolve, 5));
      }

      profiler.takeSnapshot('end');
      profiler.stopProfiling();

      const result = profiler.analyzeProfile();

      expect(result.snapshots.length).toBeGreaterThan(10);
      expect(result.peakMemory).toBeGreaterThan(result.averageMemory);

      // Проверяем что система может обнаружить рост памяти
      const growthPhases = result.memoryLeaks.filter(l => l.phase === 'file-processing');
      if (growthPhases.length > 0) {
        expect(growthPhases[0].growthRate).toBeGreaterThan(0);
      }

      // Очищаем данные
      processedData.length = 0;
    });
  });
});
