import { IChecker, CheckerConfig, CheckInfo } from '../interfaces/IChecker';
import { Project } from '../../types/Project';
import { CheckResult } from '../../types/CheckResult';
import { AnalysisCategory } from '../../types/AnalysisCategory';
import { SeverityLevel } from '../../types/SeverityLevel';

/**
 * Базовый класс для всех проверщиков
 * Предоставляет общую функциональность и стандартную реализацию
 */
export abstract class BaseChecker implements IChecker {
  protected readonly name: string;
  protected readonly category: AnalysisCategory;
  protected readonly version: string;
  protected readonly description: string;
  protected readonly config: CheckerConfig;
  protected readonly standard: string;
  protected readonly severity: SeverityLevel;

  /**
   * @param name - Название проверщика
   * @param category - Категория анализа
   * @param description - Описание проверщика
   * @param standard - Стандарт проверки
   * @param severity - Уровень серьезности
   * @param version - Версия проверщика
   * @param config - Конфигурация проверщика
   */
  constructor(
    name: string,
    category: AnalysisCategory,
    description: string,
    standard: string,
    severity: SeverityLevel = SeverityLevel.MEDIUM,
    version: string = '1.0.0',
    config: CheckerConfig = { enabled: true, failOnError: false }
  ) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.standard = standard;
    this.severity = severity;
    this.version = version;
    this.config = config;
  }

  /**
   * @inheritdoc
   */
  abstract check(project: Project): Promise<CheckResult[]>;

  /**
   * @inheritdoc
   */
  getName(): string {
    return this.name;
  }

  /**
   * @inheritdoc
   */
  getStandard(): string {
    return this.standard;
  }

  /**
   * @inheritdoc
   */
  getSeverity(): SeverityLevel {
    return this.severity;
  }

  /**
   * @inheritdoc
   */
  getAvailableChecks(): CheckInfo[] {
    // Базовая реализация - возвращает информацию о самом чекере
    return [
      {
        id: this.name,
        name: this.name,
        description: this.description,
        severity: this.severity,
        maxScore: 1,
        tags: [this.category],
      },
    ];
  }

  /**
   * @inheritdoc
   */
  async isApplicable(project: Project): Promise<boolean> {
    // Базовая проверка - проект должен существовать
    return await project.exists('.');
  }

  /**
   * Получить категорию анализа
   */
  getCategory(): AnalysisCategory {
    return this.category;
  }

  /**
   * Получить версию
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Получить описание
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Получить конфигурацию проверщика
   */
  protected getConfig(): CheckerConfig {
    return this.config;
  }

  /**
   * Создать базовый результат проверки
   * @param id - Идентификатор проверки
   * @param name - Название проверки
   * @param description - Описание проверки
   * @param passed - Прошла ли проверка
   * @param message - Сообщение о результате
   * @param score - Полученные баллы
   * @param maxScore - Максимальные баллы
   * @param severity - Уровень серьезности
   * @param details - Дополнительные детали
   * @returns Результат проверки
   */
  protected createResult(
    id: string,
    name: string,
    description: string,
    passed: boolean,
    message: string,
    score: number,
    maxScore: number,
    severity: SeverityLevel = SeverityLevel.LOW,
    details: Record<string, any> = {}
  ): CheckResult {
    return {
      id,
      name,
      description,
      passed,
      message,
      severity: passed ? SeverityLevel.LOW : severity,
      score,
      maxScore,
      timestamp: new Date(),
      details,
      stats: {
        duration: 0,
        filesChecked: 0,
        issuesFound: passed ? 0 : 1,
      },
    };
  }

  /**
   * Логирование для проверщика
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
   * Безопасное выполнение проверки с обработкой ошибок
   * @param project - Проект для проверки
   * @returns Результат проверки
   */
  async safeCheck(project: Project): Promise<CheckResult[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.log('Проверщик отключен в конфигурации', 'info');
        return [
          this.createResult(
            `${this.name}-disabled`,
            this.name,
            this.description,
            true,
            'Проверщик отключен',
            1,
            1
          ),
        ];
      }

      if (!(await this.isApplicable(project))) {
        const message = 'Проверщик не может работать с данным проектом';
        this.log(message, 'warn');
        return [
          this.createResult(
            `${this.name}-not-applicable`,
            this.name,
            this.description,
            true,
            message,
            1,
            1
          ),
        ];
      }

      this.log('Начало проверки', 'info');

      const results = await this.check(project);

      const duration = Date.now() - startTime;

      // Обновляем статистику времени для всех результатов
      results.forEach(result => {
        if (result.stats) {
          result.stats.duration = duration;
        }
      });

      this.log(`Проверка завершена за ${duration}ms`, 'info');

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.log(`Ошибка при проверке: ${errorMessage}`, 'error');

      if (this.config.failOnError) {
        return [
          this.createResult(
            `${this.name}-error`,
            this.name,
            this.description,
            false,
            `Критическая ошибка: ${errorMessage}`,
            0,
            1,
            SeverityLevel.CRITICAL,
            { error: errorMessage, duration }
          ),
        ];
      }

      return [
        this.createResult(
          `${this.name}-error-skipped`,
          this.name,
          this.description,
          true,
          `Проверка пропущена из-за ошибки: ${errorMessage}`,
          0,
          1,
          SeverityLevel.MEDIUM,
          { error: errorMessage, duration }
        ),
      ];
    }
  }

  /**
   * Проверить существование файла с логированием
   * @param project - Проект
   * @param filePath - Путь к файлу
   * @param description - Описание файла для логирования
   * @returns true, если файл существует
   */
  protected async checkFileExists(
    project: Project,
    filePath: string,
    description: string = 'файл'
  ): Promise<boolean> {
    const exists = await project.exists(filePath);
    if (!exists) {
      this.log(`${description} не найден: ${filePath}`, 'info');
    }
    return exists;
  }

  /**
   * Прочитать и разобрать JSON файл безопасно
   * @param project - Проект
   * @param filePath - Путь к JSON файлу
   * @returns Объект или null в случае ошибки
   */
  protected async readJsonSafe(project: Project, filePath: string): Promise<any | null> {
    try {
      const content = await project.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      this.log(`Ошибка чтения JSON файла ${filePath}: ${error}`, 'warn');
      return null;
    }
  }
}
