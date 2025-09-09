import { Project } from '../../types/Project';
import { AnalysisCategory } from '../../types/AnalysisCategory';

/**
 * Базовый интерфейс для всех анализаторов
 * Анализаторы отвечают за сбор сырых данных из проекта
 * @typeParam T - Тип данных, возвращаемый анализатором
 */
export interface IAnalyzer<T> {
  /**
   * Анализирует проект и возвращает данные анализа
   * @param project - Проект для анализа
   * @returns Промис с результатами анализа
   */
  analyze(project: Project): Promise<T>;

  /**
   * Возвращает название анализатора
   */
  getName(): string;

  /**
   * Возвращает категорию анализа
   */
  getCategory(): AnalysisCategory;

  /**
   * Возвращает версию анализатора для совместимости
   */
  getVersion(): string;

  /**
   * Возвращает описание того, что анализирует данный компонент
   */
  getDescription(): string;

  /**
   * Проверяет, может ли анализатор работать с данным проектом
   * @param project - Проект для проверки
   * @returns Промис с булевым значением
   */
  canAnalyze(project: Project): Promise<boolean>;
}

/**
 * Конфигурация для анализатора
 */
export interface AnalyzerConfig {
  /**
   * Включен ли анализатор
   */
  enabled: boolean;

  /**
   * Дополнительные настройки
   */
  options?: Record<string, any>;

  /**
   * Тайм-аут выполнения в миллисекундах
   */
  timeout?: number;
}
