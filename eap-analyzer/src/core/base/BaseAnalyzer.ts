import { IAnalyzer, AnalyzerConfig } from '../interfaces/IAnalyzer';
import { Project } from '../../types/Project';
import { AnalysisCategory } from '../../types/AnalysisCategory';

/**
 * Базовый класс для всех анализаторов
 * Предоставляет общую функциональность и стандартную реализацию
 * @typeParam T - Тип данных, возвращаемый анализатором
 */
export abstract class BaseAnalyzer<T> implements IAnalyzer<T> {
  protected readonly name: string;
  protected readonly category: AnalysisCategory;
  protected readonly version: string;
  protected readonly description: string;
  protected readonly config: AnalyzerConfig;

  /**
   * @param name - Название анализатора
   * @param category - Категория анализа
   * @param description - Описание анализатора
   * @param version - Версия анализатора
   * @param config - Конфигурация анализатора
   */
  constructor(
    name: string,
    category: AnalysisCategory,
    description: string,
    version: string = '1.0.0',
    config: AnalyzerConfig = { enabled: true }
  ) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.version = version;
    this.config = config;
  }

  /**
   * @inheritdoc
   */
  abstract analyze(project: Project): Promise<T>;

  /**
   * @inheritdoc
   */
  getName(): string {
    return this.name;
  }

  /**
   * @inheritdoc
   */
  getCategory(): AnalysisCategory {
    return this.category;
  }

  /**
   * @inheritdoc
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * @inheritdoc
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * @inheritdoc
   */
  async canAnalyze(project: Project): Promise<boolean> {
    // Базовая проверка - проект должен существовать
    return await project.exists('.');
  }

  /**
   * Получить конфигурацию анализатора
   */
  protected getConfig(): AnalyzerConfig {
    return this.config;
  }

  /**
   * Логирование для анализатора
   * @param message - Сообщение для логирования
   * @param level - Уровень логирования
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name}]`;

    switch (level) {
      case 'warn':
        console.warn(`${prefix} WARN: ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ERROR: ${message}`);
        break;
      default:
        console.log(`${prefix} INFO: ${message}`);
    }
  }

  /**
   * Безопасное выполнение анализа с обработкой ошибок
   * @param project - Проект для анализа
   * @returns Результат анализа или null в случае ошибки
   */
  async safeAnalyze(project: Project): Promise<T | null> {
    try {
      if (!this.config.enabled) {
        this.log('Анализатор отключен в конфигурации', 'info');
        return null;
      }

      if (!(await this.canAnalyze(project))) {
        this.log('Анализатор не может работать с данным проектом', 'warn');
        return null;
      }

      const startTime = Date.now();
      this.log('Начало анализа', 'info');

      const result = await this.analyze(project);

      const duration = Date.now() - startTime;
      this.log(`Анализ завершен за ${duration}ms`, 'info');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Ошибка при анализе: ${errorMessage}`, 'error');
      return null;
    }
  }
}
