import { SeverityLevel } from './SeverityLevel';

/**
 * Результат выполнения проверки
 */
export interface CheckResult {
  /**
   * Уникальный идентификатор проверки
   */
  id: string;

  /**
   * Название проверки
   */
  name: string;

  /**
   * Описание проверки
   */
  description: string;

  /**
   * Успешно ли прошла проверка
   */
  passed: boolean;

  /**
   * Уровень серьезности
   */
  severity: SeverityLevel;

  /**
   * Баллы, полученные за проверку
   */
  score: number;

  /**
   * Максимально возможные баллы
   */
  maxScore: number;

  /**
   * Сообщение с результатом проверки
   */
  message: string;

  /**
   * Подробные данные проверки (опционально)
   */
  details?: Record<string, any>;

  /**
   * Рекомендации по устранению проблем
   */
  recommendations?: string[];

  /**
   * Время выполнения проверки в миллисекундах
   */
  duration?: number;

  /**
   * Временная метка выполнения проверки
   */
  timestamp?: Date;

  /**
   * Статистика выполнения проверки
   */
  stats?: {
    duration: number;
    filesChecked: number;
    issuesFound: number;
  };
}

/**
 * Статистика результатов проверок
 */
export interface CheckResultStats {
  /**
   * Общее количество проверок
   */
  total: number;

  /**
   * Количество пройденных проверок
   */
  passed: number;

  /**
   * Количество проваленных проверок
   */
  failed: number;

  /**
   * Процент успешности
   */
  successRate: number;

  /**
   * Общий балл
   */
  totalScore: number;

  /**
   * Максимально возможный балл
   */
  maxScore: number;
}
