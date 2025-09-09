/**
 * Базовый интерфейс для всех эвалюаторов
 * Эвалюаторы отвечают за оценку и расчет метрик на основе собранных данных
 * @typeParam T - Тип входных данных для оценки
 * @typeParam R - Тип результата оценки
 */
export interface IEvaluator<T, R> {
  /**
   * Оценивает данные и возвращает метрики
   * @param data - Данные для оценки
   * @returns Результат оценки
   */
  evaluate(data: T): R;

  /**
   * Возвращает название метрики
   */
  getMetricName(): string;

  /**
   * Возвращает пороги для оценки
   */
  getThresholds(): Record<string, number>;

  /**
   * Возвращает описание того, что оценивает эвалюатор
   */
  getDescription(): string;

  /**
   * Возвращает единицы измерения метрики
   */
  getUnit(): string;

  /**
   * Проверяет, может ли эвалюатор работать с данными
   * @param data - Данные для проверки
   * @returns Булево значение
   */
  canEvaluate(data: T): boolean;
}

/**
 * Результат оценки с дополнительными метаданными
 */
export interface EvaluationResult<T> {
  /**
   * Значение метрики
   */
  value: T;

  /**
   * Оценка качества (обычно от 0 до 100)
   */
  score: number;

  /**
   * Уровень (например: excellent, good, fair, poor)
   */
  level: string;

  /**
   * Рекомендации по улучшению
   */
  recommendations: string[];

  /**
   * Дополнительные детали
   */
  details?: Record<string, any>;
}

/**
 * Конфигурация для эвалюатора
 */
export interface EvaluatorConfig {
  /**
   * Пороги для оценки
   */
  thresholds: Record<string, number>;

  /**
   * Веса для различных компонентов оценки
   */
  weights?: Record<string, number>;

  /**
   * Дополнительные настройки
   */
  options?: Record<string, any>;
}
