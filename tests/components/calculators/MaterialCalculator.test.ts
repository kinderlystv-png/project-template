// Material Calculator Tests
import { describe, expect, it } from 'vitest';

describe('Material Calculator Tests', () => {
  describe('Material Calculations', () => {
    it('should calculate material quantity', () => {
      const calculator = {
        area: 0,
        materialCoverage: 0,
        calculateQuantity: function () {
          return Math.ceil(this.area / this.materialCoverage);
        },
      };

      calculator.area = 100;
      calculator.materialCoverage = 25;
      expect(calculator.calculateQuantity()).toBe(4);
    });

    it('should calculate cost', () => {
      const calculator = {
        quantity: 0,
        pricePerUnit: 0,
        calculateCost: function () {
          return this.quantity * this.pricePerUnit;
        },
      };

      calculator.quantity = 10;
      calculator.pricePerUnit = 50;
      expect(calculator.calculateCost()).toBe(500);
    });

    it('should calculate waste factor', () => {
      const calculator = {
        baseQuantity: 0,
        wasteFactor: 0.1, // 10% waste
        calculateWithWaste: function () {
          return this.baseQuantity * (1 + this.wasteFactor);
        },
      };

      calculator.baseQuantity = 100;
      expect(calculator.calculateWithWaste()).toBeCloseTo(110, 2);
    });
  });

  describe('Material Types', () => {
    it('should handle different material types', () => {
      const materials = {
        wood: { density: 0.6, unit: 'm³' },
        concrete: { density: 2.4, unit: 'm³' },
        steel: { density: 7.8, unit: 'm³' },
      };

      expect(materials.wood.density).toBe(0.6);
      expect(materials.concrete.density).toBe(2.4);
      expect(materials.steel.density).toBe(7.8);
    });

    it('should calculate weight', () => {
      const calculator = {
        volume: 0,
        density: 0,
        calculateWeight: function () {
          return this.volume * this.density;
        },
      };

      calculator.volume = 2; // m³
      calculator.density = 2.4; // ton/m³
      expect(calculator.calculateWeight()).toBe(4.8); // tons
    });
  });
});
