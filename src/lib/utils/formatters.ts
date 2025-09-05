/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирует число как валюту в рублях
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Форматирует размер в метрах
 */
export function formatMeters(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)} м`;
}

/**
 * Форматирует размер в сантиметрах
 */
export function formatCentimeters(value: number): string {
  return `${formatNumber(value)} см`;
}

/**
 * Форматирует вес в килограммах
 */
export function formatWeight(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)} кг`;
}

/**
 * Форматирует объем в кубических метрах
 */
export function formatVolume(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)} м³`;
}

/**
 * Форматирует площадь в квадратных метрах
 */
export function formatArea(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)} м²`;
}

/**
 * Форматирует склонение слов в зависимости от числа
 */
export function formatPlural(count: number, singular: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }

  if (mod10 === 1) {
    return singular;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
}

/**
 * Форматирует дни доставки с правильным склонением
 */
export function formatDeliveryDays(days: number): string {
  const dayWord = formatPlural(days, 'день', 'дня', 'дней');
  return `${days} ${dayWord}`;
}
