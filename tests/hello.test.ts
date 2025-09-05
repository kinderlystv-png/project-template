import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Sample Test Suite', () => {
  beforeEach(() => {
    // Очистка моков перед каждым тестом
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return true for true', () => {
      expect(true).toBe(true);
    });

    it('should add numbers correctly', () => {
      expect(1 + 1).toBe(2);
    });

    it('should handle floating point operations', () => {
      const result = 0.1 + 0.2;
      expect(result).toBeCloseTo(0.3);
    });
  });

  describe('Calculator functionality', () => {
    const calculator = {
      add: (a: number, b: number) => a + b,
      subtract: (a: number, b: number) => a - b,
      multiply: (a: number, b: number) => a * b,
      divide: (a: number, b: number) => {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      },
    };

    it('should perform basic arithmetic operations', () => {
      expect(calculator.add(5, 3)).toBe(8);
      expect(calculator.subtract(5, 3)).toBe(2);
      expect(calculator.multiply(5, 3)).toBe(15);
      expect(calculator.divide(6, 3)).toBe(2);
    });

    it('should handle division by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Division by zero');
    });

    it('should work with negative numbers', () => {
      expect(calculator.add(-5, 3)).toBe(-2);
      expect(calculator.multiply(-2, -3)).toBe(6);
    });
  });

  describe('Async operations', () => {
    it('should handle async functions', async () => {
      const asyncFunction = async (value: number) => {
        return new Promise<number>(resolve => {
          setTimeout(() => resolve(value * 2), 100);
        });
      };

      const result = await asyncFunction(5);
      expect(result).toBe(10);
    });

    it('should handle promises', async () => {
      const promiseFunction = (success: boolean) => {
        return new Promise<string>((resolve, reject) => {
          if (success) {
            resolve('Success!');
          } else {
            reject(new Error('Failed!'));
          }
        });
      };

      await expect(promiseFunction(true)).resolves.toBe('Success!');
      await expect(promiseFunction(false)).rejects.toThrow('Failed!');
    });
  });

  describe('Mock functions', () => {
    it('should work with mocked functions', () => {
      const mockFn = vi.fn();
      const mockImplementation = vi.fn((x: number) => x * 2);

      mockFn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test');

      expect(mockImplementation(5)).toBe(10);
      expect(mockImplementation).toHaveBeenCalledWith(5);
    });
  });
});
