/**
 * Утилиты для создания CheckResult в тестовых чекерах
 */

import { CheckResult } from '../../../types/CheckResult';
import { SeverityLevel } from '../../../types/SeverityLevel';

/**
 * Тип результата для удобства создания CheckResult
 */
export interface TestCheckInfo {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  message: string;
  severity?: SeverityLevel;
  score?: number;
  maxScore?: number;
  details?: Record<string, any>;
  recommendations?: string[];
}

/**
 * Создает CheckResult из упрощенной информации
 * @param info Информация о проверке
 * @returns Полноценный CheckResult
 */
export function createCheckResult(info: TestCheckInfo): CheckResult {
  return {
    id: info.id,
    name: info.name,
    description: info.description,
    passed: info.passed,
    severity: info.severity || (info.passed ? SeverityLevel.LOW : SeverityLevel.MEDIUM),
    score: info.score || (info.passed ? 1 : 0),
    maxScore: info.maxScore || 1,
    message: info.message,
    details: info.details || {},
    recommendations: info.recommendations || [],
    timestamp: new Date(),
  };
}

/**
 * Создает успешный CheckResult
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Сообщение об успехе
 * @param details Дополнительные детали
 * @returns CheckResult с passed = true
 */
export function createSuccessResult(
  id: string,
  name: string,
  message: string,
  details?: Record<string, any>
): CheckResult {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: true,
    message,
    severity: SeverityLevel.LOW,
    score: 1,
    maxScore: 1,
    details: details || {},
  });
}

/**
 * Создает предупреждающий CheckResult
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Сообщение о предупреждении
 * @param recommendations Рекомендации по исправлению
 * @param details Дополнительные детали
 * @returns CheckResult с passed = false и severity = MEDIUM
 */
export function createWarningResult(
  id: string,
  name: string,
  message: string,
  recommendations?: string[],
  details?: Record<string, any>
): CheckResult {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: false,
    message,
    severity: SeverityLevel.MEDIUM,
    score: 0,
    maxScore: 1,
    details: details || {},
    recommendations: recommendations || [],
  });
}

/**
 * Создает ошибочный CheckResult
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Сообщение об ошибке
 * @param recommendations Рекомендации по исправлению
 * @param details Дополнительные детали
 * @returns CheckResult с passed = false и severity = HIGH
 */
export function createErrorResult(
  id: string,
  name: string,
  message: string,
  recommendations?: string[],
  details?: Record<string, any>
): CheckResult {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: false,
    message,
    severity: SeverityLevel.HIGH,
    score: 0,
    maxScore: 1,
    details: details || {},
    recommendations: recommendations || [],
  });
}

/**
 * Создает информационный CheckResult
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Информационное сообщение
 * @param details Дополнительные детали
 * @returns CheckResult с passed = true и низким приоритетом
 */
export function createInfoResult(
  id: string,
  name: string,
  message: string,
  details?: Record<string, any>
): CheckResult {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: true,
    message,
    severity: SeverityLevel.LOW,
    score: 0.5,
    maxScore: 1,
    details: details || {},
  });
}

/**
 * Создает результат на основе числового значения и порога
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param value Текущее значение
 * @param threshold Пороговое значение
 * @param unit Единица измерения
 * @param higherIsBetter Больше - значит лучше (для покрытия кода true, для времени выполнения false)
 * @returns CheckResult в зависимости от соотношения value и threshold
 */
export function createThresholdResult(
  id: string,
  name: string,
  value: number,
  threshold: number,
  unit: string = '',
  higherIsBetter: boolean = true
): CheckResult {
  const passed = higherIsBetter ? value >= threshold : value <= threshold;
  const compareText = higherIsBetter ? 'выше' : 'ниже';
  const status = passed ? 'соответствует' : 'не соответствует';

  const message = `${name}: ${value}${unit} (${status} требованию ${threshold}${unit})`;

  const details = {
    currentValue: value,
    thresholdValue: threshold,
    unit,
    passed,
    difference: Math.abs(value - threshold),
  };

  if (passed) {
    return createSuccessResult(id, name, message, details);
  } else {
    const recommendations = [
      `Необходимо ${higherIsBetter ? 'увеличить' : 'уменьшить'} значение до ${threshold}${unit} или ${compareText}`,
    ];

    return createWarningResult(id, name, message, recommendations, details);
  }
}
