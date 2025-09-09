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
    it('должен форматировать положительные числа как рубли', () => {
      expect(formatCurrency(1000)).toBe('1 000 ₽');
      expect(formatCurrency(1234567)).toBe('1 234 567 ₽');
    });

    it('должен форматировать ноль', () => {
      expect(formatCurrency(0)).toBe('0 ₽');
    });

    it('должен форматировать отрицательные числа', () => {
      expect(formatCurrency(-1000)).toBe('-1 000 ₽');
    });

    it('должен округлять дробные числа', () => {
      expect(formatCurrency(1000.67)).toBe('1 001 ₽');
      expect(formatCurrency(1000.23)).toBe('1 000 ₽');
    });
  });

  describe('formatNumber', () => {
    it('должен форматировать числа без дробных частей по умолчанию', () => {
      expect(formatNumber(1000)).toBe('1 000');
      expect(formatNumber(1234567)).toBe('1 234 567');
    });

    it('должен форматировать числа с заданным количеством дробных знаков', () => {
      expect(formatNumber(1000.123, 2)).toBe('1 000,12');
      expect(formatNumber(1000.789, 1)).toBe('1 000,8');
    });

    it('должен добавлять нули если дробная часть меньше заданной', () => {
      expect(formatNumber(1000, 2)).toBe('1 000,00');
      expect(formatNumber(1000.5, 2)).toBe('1 000,50');
    });
  });

  describe('formatMeters', () => {
    it('должен форматировать метры с двумя знаками после запятой по умолчанию', () => {
      expect(formatMeters(5.123)).toBe('5,12 м');
      expect(formatMeters(10)).toBe('10,00 м');
    });

    it('должен форматировать метры с заданной точностью', () => {
      expect(formatMeters(5.123, 0)).toBe('5 м');
      expect(formatMeters(5.123, 1)).toBe('5,1 м');
      expect(formatMeters(5.123, 3)).toBe('5,123 м');
    });
  });

  describe('formatCentimeters', () => {
    it('должен форматировать сантиметры без дробной части', () => {
      expect(formatCentimeters(100)).toBe('100 см');
      expect(formatCentimeters(150.7)).toBe('151 см');
    });
  });

  describe('formatWeight', () => {
    it('должен форматировать вес с одним знаком после запятой по умолчанию', () => {
      expect(formatWeight(5.123)).toBe('5,1 кг');
      expect(formatWeight(10)).toBe('10,0 кг');
    });

    it('должен форматировать вес с заданной точностью', () => {
      expect(formatWeight(5.123, 0)).toBe('5 кг');
      expect(formatWeight(5.123, 2)).toBe('5,12 кг');
    });
  });

  describe('formatVolume', () => {
    it('должен форматировать объем с двумя знаками после запятой по умолчанию', () => {
      expect(formatVolume(5.123)).toBe('5,12 м³');
      expect(formatVolume(10)).toBe('10,00 м³');
    });

    it('должен форматировать объем с заданной точностью', () => {
      expect(formatVolume(5.123, 0)).toBe('5 м³');
      expect(formatVolume(5.123, 1)).toBe('5,1 м³');
    });
  });

  describe('formatArea', () => {
    it('должен форматировать площадь с двумя знаками после запятой по умолчанию', () => {
      expect(formatArea(5.123)).toBe('5,12 м²');
      expect(formatArea(10)).toBe('10,00 м²');
    });

    it('должен форматировать площадь с заданной точностью', () => {
      expect(formatArea(5.123, 0)).toBe('5 м²');
      expect(formatArea(5.123, 1)).toBe('5,1 м²');
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
