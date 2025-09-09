/**
 * Тесты для Execution Timer
 * Проверяет корректность измерения времени выполнения и обнаружения узких мест
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExecutionTimer } from '../../src/modules/performance-analyzer/execution-timer.js';

describe('ExecutionTimer', () => {
  let timer: ExecutionTimer;

  beforeEach(() => {
    timer = new ExecutionTimer();
  });

  afterEach(() => {
    timer.stopProfiling();
  });

  describe('Basic Timer Operations', () => {
    it('should start and stop profiling correctly', () => {
      expect(timer.analyzeProfile().measurements).toHaveLength(0);

      timer.startProfiling();
      timer.startTimer('test-operation');
      timer.endTimer('test-operation');
      timer.stopProfiling();

      const result = timer.analyzeProfile();
      expect(result.measurements).toHaveLength(1);
    });

    it('should measure operation duration correctly', async () => {
      timer.startProfiling();

      timer.startTimer('test-delay');
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      const duration = timer.endTimer('test-delay');

      expect(duration).toBeGreaterThan(90); // Allowing for small timing variations
      expect(duration).toBeLessThan(150);

      const result = timer.analyzeProfile();
      expect(result.measurements[0].duration).toBeCloseTo(duration, 1);
    });

    it('should handle timer measurement structure correctly', () => {
      timer.startProfiling();

      timer.startTimer('structured-test', 'test-phase', { meta: 'data' });
      timer.endTimer('structured-test');

      const result = timer.analyzeProfile();
      const measurement = result.measurements[0];

      expect(measurement).toHaveProperty('name', 'structured-test');
      expect(measurement).toHaveProperty('startTime');
      expect(measurement).toHaveProperty('endTime');
      expect(measurement).toHaveProperty('duration');
      expect(measurement).toHaveProperty('phase', 'test-phase');
      expect(measurement).toHaveProperty('metadata');
      expect(measurement.metadata).toEqual({ meta: 'data' });

      expect(measurement.endTime).toBeGreaterThan(measurement.startTime);
      expect(measurement.duration).toEqual(measurement.endTime - measurement.startTime);
    });

    it('should handle non-existent timer gracefully', () => {
      timer.startProfiling();

      const duration = timer.endTimer('non-existent');
      expect(duration).toBe(0);

      const result = timer.analyzeProfile();
      expect(result.measurements).toHaveLength(0);
    });
  });

  describe('Phase Management', () => {
    it('should manage phases correctly', () => {
      timer.startProfiling();

      timer.enterPhase('phase1');
      timer.startTimer('op1');
      timer.endTimer('op1');

      timer.enterPhase('phase2');
      timer.startTimer('op2');
      timer.endTimer('op2');

      const phase = timer.exitPhase();
      expect(phase).toBe('phase2');

      timer.exitPhase();
      timer.stopProfiling();

      const result = timer.analyzeProfile();

      expect(result.phases).toHaveLength(2);
      expect(result.phases.some(p => p.phase === 'phase1')).toBe(true);
      expect(result.phases.some(p => p.phase === 'phase2')).toBe(true);
    });

    it('should track operations within phases', () => {
      timer.startProfiling();

      timer.enterPhase('analysis');
      timer.startTimer('file-read');
      timer.endTimer('file-read');
      timer.startTimer('parsing');
      timer.endTimer('parsing');
      timer.exitPhase();

      timer.stopProfiling();

      const result = timer.analyzeProfile();
      const analysisPhase = result.phases.find(p => p.phase === 'analysis');

      expect(analysisPhase).toBeDefined();
      expect(analysisPhase!.operationCount).toBe(3); // 2 operations + 1 phase timer
    });
  });

  describe('Function Measurement', () => {
    it('should measure async function execution', async () => {
      timer.startProfiling();

      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      };

      const result = await timer.measureFunction('async-test', testFunction, 'test-phase');

      expect(result).toBe('result');

      const profile = timer.analyzeProfile();
      expect(profile.measurements).toHaveLength(1);
      expect(profile.measurements[0].name).toBe('async-test');
      expect(profile.measurements[0].duration).toBeGreaterThan(40);
    });

    it('should measure sync function execution', () => {
      timer.startProfiling();

      const testFunction = () => {
        // Симулируем вычислительную нагрузку
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
          sum += Math.sqrt(i);
        }
        return sum;
      };

      const result = timer.measureSync('sync-test', testFunction, 'computation');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);

      const profile = timer.analyzeProfile();
      expect(profile.measurements).toHaveLength(1);
      expect(profile.measurements[0].name).toBe('sync-test');
      expect(profile.measurements[0].phase).toBe('computation');
    });

    it('should handle function errors correctly', async () => {
      timer.startProfiling();

      const errorFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Test error');
      };

      await expect(timer.measureFunction('error-test', errorFunction)).rejects.toThrow(
        'Test error'
      );

      const profile = timer.analyzeProfile();
      expect(profile.measurements).toHaveLength(1);
      expect(profile.measurements[0].name).toBe('error-test');
    });
  });

  describe('Performance Analysis', () => {
    it('should detect bottlenecks correctly', async () => {
      timer.startProfiling();

      // Быстрая операция
      timer.startTimer('fast-op');
      await new Promise(resolve => setTimeout(resolve, 10));
      timer.endTimer('fast-op');

      // Медленная операция (bottleneck)
      timer.startTimer('slow-op');
      await new Promise(resolve => setTimeout(resolve, 200));
      timer.endTimer('slow-op');

      // Еще одна быстрая операция
      timer.startTimer('fast-op-2');
      await new Promise(resolve => setTimeout(resolve, 15));
      timer.endTimer('fast-op-2');

      timer.stopProfiling();

      const result = timer.analyzeProfile();

      expect(result.bottlenecks.length).toBeGreaterThan(0);

      const slowBottleneck = result.bottlenecks.find(b => b.operation === 'slow-op');
      expect(slowBottleneck).toBeDefined();
      expect(slowBottleneck!.percentage).toBeGreaterThan(50); // Должна занимать большую часть времени
      expect(['medium', 'high', 'critical']).toContain(slowBottleneck!.severity);
    });

    it('should calculate total duration correctly', async () => {
      timer.startProfiling();

      timer.enterPhase('test-phase');

      timer.startTimer('op1');
      await new Promise(resolve => setTimeout(resolve, 50));
      timer.endTimer('op1');

      timer.startTimer('op2');
      await new Promise(resolve => setTimeout(resolve, 30));
      timer.endTimer('op2');

      timer.exitPhase();
      timer.stopProfiling();

      const result = timer.analyzeProfile();

      // Общее время должно быть примерно равно времени фазы
      expect(result.totalDuration).toBeGreaterThan(70); // 50 + 30 - overhead
      expect(result.totalDuration).toBeLessThan(120); // С учетом погрешности
    });

    it('should calculate efficiency score', () => {
      timer.startProfiling();

      // Симулируем сбалансированное выполнение
      timer.startTimer('balanced-op-1');
      timer.endTimer('balanced-op-1');

      timer.startTimer('balanced-op-2');
      timer.endTimer('balanced-op-2');

      timer.stopProfiling();

      const result = timer.analyzeProfile();

      expect(result.efficiency).toHaveProperty('score');
      expect(result.efficiency).toHaveProperty('grade');
      expect(result.efficiency).toHaveProperty('description');

      expect(result.efficiency.score).toBeGreaterThanOrEqual(0);
      expect(result.efficiency.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.efficiency.grade);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty profiling session', () => {
      const result = timer.analyzeProfile();

      expect(result.measurements).toHaveLength(0);
      expect(result.totalDuration).toBe(0);
      expect(result.phases).toHaveLength(0);
      expect(result.bottlenecks).toHaveLength(0);
      expect(result.efficiency.score).toBe(0);
      expect(result.efficiency.grade).toBe('F');
    });

    it('should handle active timers on stop', () => {
      timer.startProfiling();

      timer.startTimer('active-timer-1');
      timer.startTimer('active-timer-2');

      // Останавливаем без завершения таймеров
      timer.stopProfiling();

      const result = timer.analyzeProfile();

      // Активные таймеры должны быть автоматически завершены
      expect(result.measurements).toHaveLength(2);
    });

    it('should track active timers stats', () => {
      timer.startProfiling();

      timer.enterPhase('test-phase');
      timer.startTimer('timer1', 'phase1');
      timer.startTimer('timer2', 'phase2');

      const stats = timer.getActiveTimersStats();

      expect(stats.count).toBe(3); // 2 timers + 1 phase timer
      expect(stats.names).toContain('timer1');
      expect(stats.names).toContain('timer2');
      expect(stats.phases).toContain('phase1');
      expect(stats.phases).toContain('phase2');
    });

    it('should reset profiler state correctly', () => {
      timer.startProfiling();

      timer.enterPhase('test');
      timer.startTimer('test-timer');
      timer.endTimer('test-timer');

      timer.reset();

      const result = timer.analyzeProfile();
      const stats = timer.getActiveTimersStats();

      expect(result.measurements).toHaveLength(0);
      expect(stats.count).toBe(0);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should profile complex analysis workflow', async () => {
      timer.startProfiling();

      // Симулируем реальный workflow анализа
      timer.enterPhase('initialization');
      await timer.measureFunction('config-load', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      timer.exitPhase();

      timer.enterPhase('file-processing');
      for (let i = 0; i < 5; i++) {
        await timer.measureFunction(
          `file-${i}`,
          async () => {
            await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
          },
          'file-processing'
        );
      }
      timer.exitPhase();

      timer.enterPhase('analysis');
      await timer.measureFunction('complexity-calc', async () => {
        await new Promise(resolve => setTimeout(resolve, 80));
      });

      await timer.measureFunction('duplication-detect', async () => {
        await new Promise(resolve => setTimeout(resolve, 120));
      });
      timer.exitPhase();

      timer.enterPhase('report-generation');
      await timer.measureFunction('report-gen', async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
      });
      timer.exitPhase();

      timer.stopProfiling();

      const result = timer.analyzeProfile();

      expect(result.phases).toHaveLength(4);
      expect(result.measurements.length).toBeGreaterThan(8);

      // Проверяем что дублирование - самая медленная операция
      const dupDetect = result.measurements.find(m => m.name === 'duplication-detect');
      expect(dupDetect).toBeDefined();
      expect(dupDetect!.duration).toBeGreaterThan(100);

      // Должен быть обнаружен как bottleneck
      const dupBottleneck = result.bottlenecks.find(b => b.operation === 'duplication-detect');
      expect(dupBottleneck).toBeDefined();
    });
  });
});
