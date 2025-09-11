'use strict';
/**
 * Утилиты для создания CheckResult в тестовых чекерах
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.createCheckResult = createCheckResult;
exports.createSuccessResult = createSuccessResult;
exports.createWarningResult = createWarningResult;
exports.createErrorResult = createErrorResult;
exports.createFailureResult = createFailureResult;
exports.createInfoResult = createInfoResult;
exports.createThresholdResult = createThresholdResult;
const SeverityLevel_1 = require('../../../types/SeverityLevel');
/**
 * Создает CheckResult из упрощенной информации
 * @param info Информация о проверке
 * @returns Полноценный CheckResult
 */
function createCheckResult(info) {
  return {
    id: info.id,
    name: info.name,
    description: info.description,
    passed: info.passed,
    severity:
      info.severity ||
      (info.passed ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM),
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
function createSuccessResult(id, name, message, details) {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: true,
    message,
    severity: SeverityLevel_1.SeverityLevel.LOW,
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
function createWarningResult(id, name, message, recommendations, details) {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: false,
    message,
    severity: SeverityLevel_1.SeverityLevel.MEDIUM,
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
function createErrorResult(id, name, message, recommendations, details) {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: false,
    message,
    severity: SeverityLevel_1.SeverityLevel.HIGH,
    score: 0,
    maxScore: 1,
    details: details || {},
    recommendations: recommendations || [],
  });
}
/**
 * Создает неудачный CheckResult (alias для createErrorResult)
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Сообщение об ошибке
 * @param recommendations Рекомендации по исправлению
 * @param details Дополнительные детали
 * @returns CheckResult с passed = false и severity = HIGH
 */
function createFailureResult(id, name, message, recommendations, details) {
  return createErrorResult(id, name, message, recommendations, details);
}
/**
 * Создает информационный CheckResult
 * @param id Идентификатор проверки
 * @param name Название проверки
 * @param message Информационное сообщение
 * @param details Дополнительные детали
 * @returns CheckResult с passed = true и низким приоритетом
 */
function createInfoResult(id, name, message, details) {
  return createCheckResult({
    id,
    name,
    description: name,
    passed: true,
    message,
    severity: SeverityLevel_1.SeverityLevel.LOW,
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
function createThresholdResult(id, name, value, threshold, unit = '', higherIsBetter = true) {
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
//# sourceMappingURL=CheckResultUtils.js.map
