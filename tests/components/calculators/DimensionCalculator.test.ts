// Dimension Calculator Tests
import { describe, it, expect } from 'vitest';

describe('Dimension Calculator Tests', () => {
  describe('Basic Calculations', () => {
    it('should calculate area', () => {
      const calculator = {
        width: 0,
        height: 0,
        calculateArea: function() {
          return this.width * this.height;
        }
      };
      
      calculator.width = 10;
      calculator.height = 5;
      expect(calculator.calculateArea()).toBe(50);
    });

    it('should calculate volume', () => {
      const calculator = {
        width: 0,
        height: 0,
        depth: 0,
        calculateVolume: function() {
          return this.width * this.height * this.depth;
        }
      };
      
      calculator.width = 10;
      calculator.height = 5;
      calculator.depth = 2;
      expect(calculator.calculateVolume()).toBe(100);
    });

    it('should calculate perimeter', () => {
      const calculator = {
        width: 0,
        height: 0,
        calculatePerimeter: function() {
          return 2 * (this.width + this.height);
        }
      };
      
      calculator.width = 10;
      calculator.height = 5;
      expect(calculator.calculatePerimeter()).toBe(30);
    });
  });

  describe('Unit Conversion', () => {
    it('should convert between units', () => {
      const converter = {
        mmToM: (mm: number) => mm / 1000,
        mToMm: (m: number) => m * 1000,
        cmToM: (cm: number) => cm / 100,
        mToCm: (m: number) => m * 100
      };
      
      expect(converter.mmToM(1000)).toBe(1);
      expect(converter.mToMm(1)).toBe(1000);
      expect(converter.cmToM(100)).toBe(1);
      expect(converter.mToCm(1)).toBe(100);
    });

    it('should handle precision', () => {
      const calculator = {
        round: (value: number, decimals: number = 2) => {
          return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }
      };
      
      expect(calculator.round(3.14159, 2)).toBe(3.14);
      expect(calculator.round(3.14159, 3)).toBe(3.142);
    });
  });
});
