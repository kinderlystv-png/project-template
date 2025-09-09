import { Project } from '../../types/Project';
import { CheckResult } from '../../types/CheckResult';
import { SeverityLevel } from '../../types/SeverityLevel';

/**
 * Базовый интерфейс для всех чекеров
 * Чекеры отвечают за проверку соответствия проекта стандартам и best practices
 */
export interface IChecker {
  /**
   * Проверяет проект на соответствие стандартам
   * @param project - Проект для проверки
   * @returns Промис с результатами проверки
   */
  check(project: Project): Promise<CheckResult[]>;

  /**
   * Возвращает название стандарта, по которому проверяется проект
   */
  getStandard(): string;

  /**
   * Возвращает уровень важности проверки
   */
  getSeverity(): SeverityLevel;

  /**
   * Возвращает название чекера
   */
  getName(): string;

  /**
   * Возвращает описание проверок
   */
  getDescription(): string;

  /**
   * Возвращает список всех доступных проверок
   */
  getAvailableChecks(): CheckInfo[];

  /**
   * Проверяет, применим ли чекер к данному проекту
   * @param project - Проект для проверки
   * @returns Промис с булевым значением
   */
  isApplicable(project: Project): Promise<boolean>;
}

/**
 * Информация о проверке
 */
export interface CheckInfo {
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
   * Уровень серьезности
   */
  severity: SeverityLevel;

  /**
   * Максимальный балл за проверку
   */
  maxScore: number;

  /**
   * Теги для категоризации
   */
  tags: string[];
}

/**
 * Конфигурация для чекера
 */
export interface CheckerConfig {
  /**
   * Включен ли чекер
   */
  enabled: boolean;

  /**
   * Прерывать ли выполнение при ошибке
   */
  failOnError?: boolean;

  /**
   * Список включенных проверок (если не указан - все)
   */
  enabledChecks?: string[];

  /**
   * Список отключенных проверок
   */
  disabledChecks?: string[];

  /**
   * Пользовательские пороги для проверок
   */
  thresholds?: Record<string, number>;
}
