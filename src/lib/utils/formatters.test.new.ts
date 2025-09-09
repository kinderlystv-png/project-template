/**
 * Тесты для утилит форматирования
 * @file src/lib/utils/formatters.test.ts
 */

import { describe, expect, it } from 'vitest';
import {
  formatArea,
  formatCentimeters,
  formatCurrency,
  formatDeliveryDays,
  formatMeters,
  formatNumber,
  formatPlural,
  formatVolume,
  formatWeight,
} from './formatters.js';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('должен содержать рублевый символ', () => {
      expect(formatCurrency(1000)).toContain('₽');
      expect(formatCurrency(0)).toContain('₽');
      expect(formatCurrency(-1000)).toContain('₽');
    });

    it('должен правильно форматировать числа', () => {
      expect(formatCurrency(1000)).toContain('1');
      expect(formatCurrency(1000)).toContain('000');
      expect(formatCurrency(1234567)).toContain('1');
      expect(formatCurrency(1234567)).toContain('234');
      expect(formatCurrency(1234567)).toContain('567');
    });

    it('должен показывать отрицательные числа', () => {
      expect(formatCurrency(-1000)).toContain('-');
    });
  });

  describe('formatNumber', () => {
    it('должен форматировать большие числа с разделителями', () => {
      const result = formatNumber(1234567);
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('567');
    });

    it('должен поддерживать дробные числа', () => {
      const result = formatNumber(1000.123, 2);
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('12');
    });
  });

  describe('formatMeters', () => {
    it('должен добавлять единицу измерения "м"', () => {
      expect(formatMeters(5.123)).toContain('м');
      expect(formatMeters(10)).toContain('м');
    });

    it('должен форматировать число', () => {
      expect(formatMeters(5.123)).toContain('5');
      expect(formatMeters(10)).toContain('10');
    });
  });

  describe('formatCentimeters', () => {
    it('должен добавлять единицу измерения "см"', () => {
      expect(formatCentimeters(100)).toContain('см');
      expect(formatCentimeters(150)).toContain('см');
    });

    it('должен форматировать число', () => {
      expect(formatCentimeters(100)).toContain('100');
      expect(formatCentimeters(150)).toContain('151'); // округление
    });
  });

  describe('formatWeight', () => {
    it('должен добавлять единицу измерения "кг"', () => {
      expect(formatWeight(5.123)).toContain('кг');
      expect(formatWeight(10)).toContain('кг');
    });

    it('должен форматировать число', () => {
      expect(formatWeight(5.123)).toContain('5');
      expect(formatWeight(10)).toContain('10');
    });
  });

  describe('formatVolume', () => {
    it('должен добавлять единицу измерения "м³"', () => {
      expect(formatVolume(5.123)).toContain('м³');
      expect(formatVolume(10)).toContain('м³');
    });

    it('должен форматировать число', () => {
      expect(formatVolume(5.123)).toContain('5');
      expect(formatVolume(10)).toContain('10');
    });
  });

  describe('formatArea', () => {
    it('должен добавлять единицу измерения "м²"', () => {
      expect(formatArea(5.123)).toContain('м²');
      expect(formatArea(10)).toContain('м²');
    });

    it('должен форматировать число', () => {
      expect(formatArea(5.123)).toContain('5');
      expect(formatArea(10)).toContain('10');
    });
  });

  describe('formatPlural', () => {
    it('должен правильно склонять для единственного числа (1, 21, 31, ...)', () => {
      expect(formatPlural(1, 'день', 'дня', 'дней')).toBe('день');
      expect(formatPlural(21, 'день', 'дня', 'дней')).toBe('день');
      expect(formatPlural(31, 'день', 'дня', 'дней')).toBe('день');
      expect(formatPlural(101, 'день', 'дня', 'дней')).toBe('день');
    });

    it('должен правильно склонять для 2-4 (2, 3, 4, 22, 23, 24, ...)', () => {
      expect(formatPlural(2, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(3, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(4, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(22, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(23, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(24, 'день', 'дня', 'дней')).toBe('дня');
      expect(formatPlural(102, 'день', 'дня', 'дней')).toBe('дня');
    });

    it('должен правильно склонять для 11-14 (особый случай)', () => {
      expect(formatPlural(11, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(12, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(13, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(14, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(111, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(112, 'день', 'дня', 'дней')).toBe('дней');
    });

    it('должен правильно склонять для остальных чисел (0, 5-10, 15-20, ...)', () => {
      expect(formatPlural(0, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(5, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(6, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(10, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(15, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(20, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(25, 'день', 'дня', 'дней')).toBe('дней');
      expect(formatPlural(100, 'день', 'дня', 'дней')).toBe('дней');
    });
  });

  describe('formatDeliveryDays', () => {
    it('должен форматировать дни доставки с правильным склонением', () => {
      expect(formatDeliveryDays(1)).toBe('1 день');
      expect(formatDeliveryDays(2)).toBe('2 дня');
      expect(formatDeliveryDays(5)).toBe('5 дней');
      expect(formatDeliveryDays(11)).toBe('11 дней');
      expect(formatDeliveryDays(21)).toBe('21 день');
      expect(formatDeliveryDays(22)).toBe('22 дня');
      expect(formatDeliveryDays(25)).toBe('25 дней');
    });
  });
});
