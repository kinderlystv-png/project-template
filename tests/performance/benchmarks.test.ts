/**
 * Тесты производительности для критических функций
 */

import { beforeEach, describe, expect, it } from 'vitest';

// Интерфейсы для тестирования производительности
interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  iterations: number;
}

interface BenchmarkResult {
  average: number;
  min: number;
  max: number;
  standardDeviation: number;
}

// Утилиты для измерения производительности
class PerformanceTester {
  static async measureExecutionTime<T>(
    fn: () => T | Promise<T>,
    iterations = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Прогрев
    for (let i = 0; i < 10; i++) {
      await fn();
    }

    // Основные измерения
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return { average, min, max, standardDeviation };
  }

  static measureMemoryUsage<T>(fn: () => T): { result: T; memoryDelta: number } {
    // Принудительная сборка мусора если доступна
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    const result = fn();
    const finalMemory = process.memoryUsage().heapUsed;

    return {
      result,
      memoryDelta: finalMemory - initialMemory,
    };
  }

  static async runBenchmark<T>(
    name: string,
    fn: () => T | Promise<T>,
    options: {
      iterations?: number;
      maxExecutionTime?: number;
      maxMemoryUsage?: number;
    } = {}
  ): Promise<PerformanceMetrics> {
    const { iterations = 100, maxExecutionTime = 100, maxMemoryUsage = 5 * 1024 * 1024 } = options;

    const performanceResult = await this.measureExecutionTime(fn, iterations);
    const memoryResult = this.measureMemoryUsage(fn);

    // Проверяем лимиты
    if (performanceResult.average > maxExecutionTime) {
      throw new Error(
        `Performance test "${name}" failed: average execution time ${performanceResult.average}ms exceeds limit ${maxExecutionTime}ms`
      );
    }

    if (memoryResult.memoryDelta > maxMemoryUsage) {
      throw new Error(
        `Performance test "${name}" failed: memory usage ${memoryResult.memoryDelta} bytes exceeds limit ${maxMemoryUsage} bytes`
      );
    }

    return {
      executionTime: performanceResult.average,
      memoryUsage: memoryResult.memoryDelta,
      iterations,
    };
  }
}

// Моки функций для тестирования производительности
class CalculatorPerformance {
  static calculate(operation: string, a: number, b: number): number {
    switch (operation) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return a / b;
      default:
        throw new Error('Unknown operation');
    }
  }

  static calculateComplex(numbers: number[]): number {
    return numbers.reduce((acc, num, index) => {
      if (index % 2 === 0) {
        return acc + num * Math.sin(num);
      } else {
        return acc - num * Math.cos(num);
      }
    }, 0);
  }

  static factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}

class DataProcessing {
  static sortLargeArray(size: number): number[] {
    const array = Array.from({ length: size }, () => Math.random() * 1000);
    return array.sort((a, b) => a - b);
  }

  static filterAndMap(data: any[]): any[] {
    return data
      .filter(item => item.value > 50)
      .map(item => ({ ...item, processed: true, timestamp: Date.now() }));
  }

  static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }
}

class DOM_Operations {
  static createElements(count: number): HTMLElement[] {
    const elements: HTMLElement[] = [];

    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.className = `test-element-${i}`;
      div.textContent = `Element ${i}`;
      div.style.width = '100px';
      div.style.height = '100px';
      div.style.backgroundColor = `hsl(${i % 360}, 50%, 50%)`;
      elements.push(div);
    }

    return elements;
  }

  static appendToDocument(elements: HTMLElement[]): void {
    const container = document.createElement('div');
    container.id = 'performance-test-container';

    elements.forEach(element => {
      container.appendChild(element);
    });

    document.body.appendChild(container);
  }

  static removeFromDocument(): void {
    const container = document.getElementById('performance-test-container');
    if (container) {
      container.remove();
    }
  }
}

describe('Performance Tests', () => {
  beforeEach(() => {
    // Очистка DOM после каждого теста
    DOM_Operations.removeFromDocument();
  });

  describe('Calculator Performance', () => {
    it('should perform basic calculations quickly', async () => {
      const metrics = await PerformanceTester.runBenchmark(
        'basic calculation',
        () => CalculatorPerformance.calculate('+', 123.456, 789.123),
        { maxExecutionTime: 1, iterations: 1000 }
      );

      expect(metrics.executionTime).toBeLessThan(1);
    });

    it('should handle complex calculations efficiently', async () => {
      const largeNumberArray = Array.from({ length: 1000 }, (_, i) => i + 1);

      const metrics = await PerformanceTester.runBenchmark(
        'complex calculation',
        () => CalculatorPerformance.calculateComplex(largeNumberArray),
        { maxExecutionTime: 50, iterations: 100 }
      );

      expect(metrics.executionTime).toBeLessThan(50);
    });

    it('should compute factorial with reasonable performance', async () => {
      const metrics = await PerformanceTester.runBenchmark(
        'factorial calculation',
        () => CalculatorPerformance.factorial(10),
        { maxExecutionTime: 5, iterations: 1000 }
      );

      expect(metrics.executionTime).toBeLessThan(5);
    });

    it('should not cause memory leaks in repeated calculations', () => {
      const iterations = 1000;
      const results: number[] = [];

      const { memoryDelta } = PerformanceTester.measureMemoryUsage(() => {
        for (let i = 0; i < iterations; i++) {
          results.push(CalculatorPerformance.calculate('*', i, i + 1));
        }
      });

      // Память не должна расти значительно для простых вычислений
      expect(memoryDelta).toBeLessThan(1024 * 100); // 100KB лимит
    });
  });

  describe('Data Processing Performance', () => {
    it('should sort large arrays efficiently', async () => {
      const metrics = await PerformanceTester.runBenchmark(
        'large array sorting',
        () => DataProcessing.sortLargeArray(10000),
        { maxExecutionTime: 100, iterations: 10 }
      );

      expect(metrics.executionTime).toBeLessThan(100);
    });

    it('should filter and map data quickly', async () => {
      const testData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        name: `Item ${i}`,
      }));

      const metrics = await PerformanceTester.runBenchmark(
        'filter and map',
        () => DataProcessing.filterAndMap(testData),
        { maxExecutionTime: 50, iterations: 100 }
      );

      expect(metrics.executionTime).toBeLessThan(50);
    });

    it('should group data efficiently', async () => {
      const testData = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        category: `category-${i % 10}`,
        value: Math.random() * 100,
      }));

      const metrics = await PerformanceTester.runBenchmark(
        'group by operation',
        () => DataProcessing.groupBy(testData, item => item.category),
        { maxExecutionTime: 30, iterations: 100 }
      );

      expect(metrics.executionTime).toBeLessThan(30);
    });
  });

  describe('DOM Operations Performance', () => {
    it('should create DOM elements efficiently', async () => {
      const metrics = await PerformanceTester.runBenchmark(
        'DOM element creation',
        () => DOM_Operations.createElements(1000),
        { maxExecutionTime: 100, iterations: 10, maxMemoryUsage: 15 * 1024 * 1024 }
      );

      expect(metrics.executionTime).toBeLessThan(100);
    });

    it('should append elements to DOM quickly', async () => {
      const elements = DOM_Operations.createElements(1000);

      const metrics = await PerformanceTester.runBenchmark(
        'DOM element appending',
        () => DOM_Operations.appendToDocument(elements),
        { maxExecutionTime: 100, iterations: 5, maxMemoryUsage: 10 * 1024 * 1024 }
      );

      expect(metrics.executionTime).toBeLessThan(100);
    });

    it('should clean up DOM efficiently', async () => {
      // Создаем элементы для удаления
      const elements = DOM_Operations.createElements(1000);
      DOM_Operations.appendToDocument(elements);

      const metrics = await PerformanceTester.runBenchmark(
        'DOM cleanup',
        () => DOM_Operations.removeFromDocument(),
        { maxExecutionTime: 20, iterations: 10 }
      );

      expect(metrics.executionTime).toBeLessThan(20);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not leak memory during array operations', () => {
      const iterations = 100;

      const { memoryDelta } = PerformanceTester.measureMemoryUsage(() => {
        for (let i = 0; i < iterations; i++) {
          const arr = new Array(1000).fill(i);
          arr.sort();
          arr.filter(x => x > 500);
          // Массив должен быть освобожден после выхода из области видимости
        }
      });

      // Проверяем что память не растет значительно
      expect(memoryDelta).toBeLessThan(5 * 1024 * 1024); // 5MB лимит
    });

    it('should handle large object creation without excessive memory use', () => {
      const { memoryDelta } = PerformanceTester.measureMemoryUsage(() => {
        const objects: any[] = [];
        for (let i = 0; i < 1000; i++) {
          objects.push({
            id: i,
            data: new Array(100).fill(`data-${i}`),
            metadata: { created: Date.now(), index: i },
          });
        }
        // Очищаем ссылки
        objects.length = 0;
      });

      expect(memoryDelta).toBeLessThan(1024 * 1024 * 10); // 10MB лимит
    });
  });

  describe('Async Operations Performance', () => {
    it('should handle multiple async operations efficiently', async () => {
      const asyncOperation = () =>
        new Promise(resolve => {
          setTimeout(() => resolve(Math.random()), 1);
        });

      const metrics = await PerformanceTester.runBenchmark(
        'async operations',
        async () => {
          const promises = Array.from({ length: 10 }, () => asyncOperation());
          return Promise.all(promises);
        },
        { maxExecutionTime: 50, iterations: 10 }
      );

      expect(metrics.executionTime).toBeLessThan(50);
    });

    it('should handle promise chains without memory leaks', async () => {
      const chainLength = 100;

      const { memoryDelta } = PerformanceTester.measureMemoryUsage(() => {
        let promise = Promise.resolve(0);

        for (let i = 0; i < chainLength; i++) {
          promise = promise.then(val => val + 1);
        }

        return promise;
      });

      expect(memoryDelta).toBeLessThan(1024 * 50); // 50KB лимит
    });
  });

  describe('Edge Cases Performance', () => {
    it('should handle empty data efficiently', async () => {
      const metrics = await PerformanceTester.runBenchmark(
        'empty data processing',
        () => {
          DataProcessing.filterAndMap([]);
          DataProcessing.groupBy([] as any[], (item: any) => item.toString());
          return true;
        },
        { maxExecutionTime: 1, iterations: 1000 }
      );

      expect(metrics.executionTime).toBeLessThan(1);
    });

    it('should handle very large numbers', async () => {
      const largeNumbers = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1, 1e15, 1e16];

      const metrics = await PerformanceTester.runBenchmark(
        'large number calculations',
        () => {
          return largeNumbers.reduce((sum, num) => sum + num, 0);
        },
        { maxExecutionTime: 5, iterations: 1000 }
      );

      expect(metrics.executionTime).toBeLessThan(5);
    });

    it('should handle string operations efficiently', async () => {
      const longString = 'a'.repeat(10000);

      const metrics = await PerformanceTester.runBenchmark(
        'string operations',
        () => {
          return longString.toUpperCase().split('').reverse().join('').toLowerCase();
        },
        { maxExecutionTime: 10, iterations: 100 }
      );

      expect(metrics.executionTime).toBeLessThan(10);
    });
  });
});
