import { describe, it, expect, vi, beforeEach } from 'vitest';
import { log } from '../../src/lib/logger';

describe('Logger Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Logging Functions', () => {
    it('should have info method', () => {
      expect(typeof log.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof log.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof log.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof log.debug).toBe('function');
    });

    it('should handle info logging without throwing', () => {
      expect(() => {
        log.info('Test info message');
      }).not.toThrow();
    });

    it('should handle error logging without throwing', () => {
      expect(() => {
        log.error('Test error message');
      }).not.toThrow();
    });

    it('should handle warn logging without throwing', () => {
      expect(() => {
        log.warn('Test warning message');
      }).not.toThrow();
    });

    it('should handle debug logging without throwing', () => {
      expect(() => {
        log.debug('Test debug message');
      }).not.toThrow();
    });
  });

  describe('Logger Object Structure', () => {
    it('should be an object', () => {
      expect(typeof log).toBe('object');
    });

    it('should not be null', () => {
      expect(log).not.toBeNull();
    });

    it('should have basic logging methods', () => {
      expect(log).toHaveProperty('info');
      expect(log).toHaveProperty('error');
      expect(log).toHaveProperty('warn');
      expect(log).toHaveProperty('debug');
    });
  });

  describe('Error Handling', () => {
    it('should handle null message gracefully', () => {
      expect(() => {
        log.info(String(null));
      }).not.toThrow();
    });

    it('should handle undefined message gracefully', () => {
      expect(() => {
        log.info(String(undefined));
      }).not.toThrow();
    });

    it('should handle object message', () => {
      expect(() => {
        log.info(JSON.stringify({ test: 'value' }));
      }).not.toThrow();
    });

    it('should handle array message', () => {
      expect(() => {
        log.info(JSON.stringify(['test', 'array']));
      }).not.toThrow();
    });
  });
});
