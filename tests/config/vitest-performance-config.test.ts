import { describe, it, expect } from 'vitest';

describe('Vitest Performance Configuration', () => {
  it('should have basic vitest environment', () => {
    expect(expect).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
  });

  it('should handle simple operations', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should work with arrays', () => {
    const testArray = [1, 2, 3];
    expect(testArray).toHaveLength(3);
    expect(testArray[0]).toBe(1);
  });

  it('should work with objects', () => {
    const testObj = { name: 'test', value: 42 };
    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(42);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});
