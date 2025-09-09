/**
 * Уровни серьезности проблем и проверок
 */
export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Человекочитаемые названия уровней серьезности
 */
export const SEVERITY_LEVEL_LABELS: Record<SeverityLevel, string> = {
  [SeverityLevel.LOW]: 'Низкий',
  [SeverityLevel.MEDIUM]: 'Средний',
  [SeverityLevel.HIGH]: 'Высокий',
  [SeverityLevel.CRITICAL]: 'Критический',
};

/**
 * Числовые веса для сортировки по важности
 */
export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  [SeverityLevel.LOW]: 1,
  [SeverityLevel.MEDIUM]: 2,
  [SeverityLevel.HIGH]: 3,
  [SeverityLevel.CRITICAL]: 4,
};
