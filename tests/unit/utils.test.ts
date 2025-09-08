import { describe, it, expect } from 'vitest';

// Простые утилитарные функции для тестирования
const utils = {
  isString: (value: any): value is string => typeof value === 'string',
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  isObject: (value: any): value is object => value !== null && typeof value === 'object',
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },
  formatString: (template: string, ...args: any[]): string => {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return args[index] !== undefined ? String(args[index]) : match;
    });
  },
  capitalizeFirst: (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  },
};

describe('Utils Unit Tests', () => {
  describe('Type Checking Utils', () => {
    it('should correctly identify strings', () => {
      expect(utils.isString('hello')).toBe(true);
      expect(utils.isString('')).toBe(true);
      expect(utils.isString(123)).toBe(false);
      expect(utils.isString(null)).toBe(false);
      expect(utils.isString(undefined)).toBe(false);
      expect(utils.isString({})).toBe(false);
    });

    it('should correctly identify numbers', () => {
      expect(utils.isNumber(123)).toBe(true);
      expect(utils.isNumber(0)).toBe(true);
      expect(utils.isNumber(-123)).toBe(true);
      expect(utils.isNumber(3.14)).toBe(true);
      expect(utils.isNumber('123')).toBe(false);
      expect(utils.isNumber(NaN)).toBe(false);
      expect(utils.isNumber(null)).toBe(false);
      expect(utils.isNumber(undefined)).toBe(false);
    });

    it('should correctly identify objects', () => {
      expect(utils.isObject({})).toBe(true);
      expect(utils.isObject([])).toBe(true);
      expect(utils.isObject(new Date())).toBe(true);
      expect(utils.isObject(null)).toBe(false);
      expect(utils.isObject(undefined)).toBe(false);
      expect(utils.isObject('string')).toBe(false);
      expect(utils.isObject(123)).toBe(false);
    });
  });

  describe('Emptiness Checking', () => {
    it('should correctly identify empty values', () => {
      expect(utils.isEmpty(null)).toBe(true);
      expect(utils.isEmpty(undefined)).toBe(true);
      expect(utils.isEmpty('')).toBe(true);
      expect(utils.isEmpty([])).toBe(true);
      expect(utils.isEmpty({})).toBe(true);
    });

    it('should correctly identify non-empty values', () => {
      expect(utils.isEmpty('hello')).toBe(false);
      expect(utils.isEmpty([1, 2, 3])).toBe(false);
      expect(utils.isEmpty({ a: 1 })).toBe(false);
      expect(utils.isEmpty(0)).toBe(false);
      expect(utils.isEmpty(false)).toBe(false);
    });
  });

  describe('String Formatting', () => {
    it('should format strings with placeholders', () => {
      expect(utils.formatString('Hello {0}!', 'World')).toBe('Hello World!');
      expect(utils.formatString('{0} + {1} = {2}', 2, 3, 5)).toBe('2 + 3 = 5');
      expect(utils.formatString('User: {0}, Age: {1}', 'John', 25)).toBe('User: John, Age: 25');
    });

    it('should handle missing arguments', () => {
      expect(utils.formatString('Hello {0}!')).toBe('Hello {0}!');
      expect(utils.formatString('{0} {1} {2}', 'one')).toBe('one {1} {2}');
    });

    it('should handle extra arguments', () => {
      expect(utils.formatString('Hello {0}!', 'World', 'Extra')).toBe('Hello World!');
    });

    it('should capitalize first letter', () => {
      expect(utils.capitalizeFirst('hello')).toBe('Hello');
      expect(utils.capitalizeFirst('world')).toBe('World');
      expect(utils.capitalizeFirst('CAPS')).toBe('CAPS');
      expect(utils.capitalizeFirst('')).toBe('');
      expect(utils.capitalizeFirst('a')).toBe('A');
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2, d: [3, 4] } };
      const cloned = utils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });

    it('should handle primitive values in deep clone', () => {
      expect(utils.deepClone('string')).toBe('string');
      expect(utils.deepClone(123)).toBe(123);
      expect(utils.deepClone(true)).toBe(true);
      expect(utils.deepClone(null)).toBe(null);
      expect(utils.deepClone(undefined)).toBe(undefined);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = utils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      expect(() => utils.isString(null)).not.toThrow();
      expect(() => utils.isNumber(undefined)).not.toThrow();
      expect(() => utils.isEmpty(null)).not.toThrow();
    });

    it('should handle empty inputs', () => {
      expect(utils.formatString('')).toBe('');
      expect(utils.capitalizeFirst('')).toBe('');
      expect(utils.deepClone({})).toEqual({});
    });
  });
});
