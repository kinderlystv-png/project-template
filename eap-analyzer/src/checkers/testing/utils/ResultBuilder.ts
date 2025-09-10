/**
 * ResultBuilder - расширенный билдер для создания CheckResult
 * Предоставляет Fluent API и автоматическую оптимизацию результатов
 */

import { CheckResult } from '../../../types/CheckResult';
import { SeverityLevel } from '../../../types/SeverityLevel';
import { TESTING_THRESHOLDS } from '../constants';

/**
 * Контекст для автоматического определения severity и score
 */
interface ResultContext {
  category: string;
  framework?: string;
  hasConfig: boolean;
  hasTests: boolean;
  coveragePercentage?: number;
}

/**
 * Билдер результатов с Fluent API и интеллектуальной оптимизацией
 */
export class ResultBuilder {
  private result: Partial<CheckResult>;
  private context: Partial<ResultContext>;

  constructor(id: string, name: string) {
    this.result = {
      id,
      name,
      description: name,
      timestamp: new Date(),
      details: {},
      stats: {
        duration: 0,
        filesChecked: 0,
        issuesFound: 0,
      },
    };
    this.context = {
      category: 'testing',
    };
  }

  /**
   * Создает новый билдер для успешного результата
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static success(id: string, name: string): ResultBuilder {
    return new ResultBuilder(id, name).passed(true).severity(SeverityLevel.LOW).score(1, 1);
  }

  /**
   * Создает новый билдер для предупреждения
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static warning(id: string, name: string): ResultBuilder {
    return new ResultBuilder(id, name).passed(false).severity(SeverityLevel.MEDIUM).score(0, 1);
  }

  /**
   * Создает новый билдер для ошибки
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static error(id: string, name: string): ResultBuilder {
    return new ResultBuilder(id, name).passed(false).severity(SeverityLevel.HIGH).score(0, 1);
  }

  /**
   * Создает новый билдер для критической ошибки
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static critical(id: string, name: string): ResultBuilder {
    return new ResultBuilder(id, name).passed(false).severity(SeverityLevel.CRITICAL).score(0, 1);
  }

  /**
   * Создает билдер на основе порогового значения
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @param value Текущее значение
   * @param threshold Пороговое значение
   * @param higherIsBetter Больше - значит лучше
   * @returns ResultBuilder
   */
  static threshold(
    id: string,
    name: string,
    value: number,
    threshold: number,
    higherIsBetter: boolean = true
  ): ResultBuilder {
    const passed = higherIsBetter ? value >= threshold : value <= threshold;
    const builder = passed ? this.success(id, name) : this.warning(id, name);

    return builder.details({
      currentValue: value,
      thresholdValue: threshold,
      passed,
      difference: Math.abs(value - threshold),
    });
  }

  /**
   * Устанавливает описание
   */
  description(desc: string): ResultBuilder {
    this.result.description = desc;
    return this;
  }

  /**
   * Устанавливает результат прохождения
   */
  passed(value: boolean): ResultBuilder {
    this.result.passed = value;
    if (this.result.stats) {
      this.result.stats.issuesFound = value ? 0 : 1;
    }
    return this;
  }

  /**
   * Устанавливает сообщение
   */
  message(msg: string): ResultBuilder {
    this.result.message = msg;
    return this;
  }

  /**
   * Устанавливает уровень серьезности
   */
  severity(level: SeverityLevel): ResultBuilder {
    this.result.severity = level;
    return this;
  }

  /**
   * Устанавливает оценку
   */
  score(current: number, max: number = 1): ResultBuilder {
    this.result.score = current;
    this.result.maxScore = max;
    return this;
  }

  /**
   * Добавляет детали
   */
  details(data: Record<string, any>): ResultBuilder {
    this.result.details = { ...this.result.details, ...data };
    return this;
  }

  /**
   * Добавляет рекомендации
   */
  recommendations(recs: string[]): ResultBuilder {
    this.result.recommendations = recs;
    return this;
  }

  /**
   * Устанавливает статистику
   */
  stats(
    stats: Partial<{ duration: number; filesChecked: number; issuesFound: number }>
  ): ResultBuilder {
    if (this.result.stats) {
      this.result.stats = {
        duration: stats.duration ?? this.result.stats.duration,
        filesChecked: stats.filesChecked ?? this.result.stats.filesChecked,
        issuesFound: stats.issuesFound ?? this.result.stats.issuesFound,
      };
    }
    return this;
  }

  /**
   * Устанавливает контекст для автоматической оптимизации
   */
  withContext(context: Partial<ResultContext>): ResultBuilder {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Устанавливает фреймворк для контекста
   */
  framework(name: string): ResultBuilder {
    this.context.framework = name;
    return this.details({ framework: name });
  }

  /**
   * Добавляет информацию о покрытии для автоматической оценки
   */
  coverage(percentage: number): ResultBuilder {
    this.context.coveragePercentage = percentage;

    // Автоматически определяем результат на основе покрытия
    const threshold = TESTING_THRESHOLDS.COVERAGE_THRESHOLD;
    const passed = percentage >= threshold;

    return this.passed(passed)
      .severity(passed ? SeverityLevel.LOW : SeverityLevel.MEDIUM)
      .score(passed ? 1 : Math.max(0, percentage / threshold), 1)
      .details({ coveragePercentage: percentage, threshold });
  }

  /**
   * Добавляет информацию о количестве тестов для автоматической оценки
   */
  testCount(count: number, expectedMin?: number): ResultBuilder {
    const threshold = expectedMin || TESTING_THRESHOLDS.MIN_UNIT_TESTS;
    const passed = count >= threshold;

    return this.passed(passed)
      .severity(passed ? SeverityLevel.LOW : SeverityLevel.MEDIUM)
      .score(passed ? 1 : Math.max(0, count / threshold), 1)
      .details({ testCount: count, expectedMin: threshold });
  }

  /**
   * Применяет автоматическую оптимизацию на основе контекста
   */
  private applyAutoOptimization(): void {
    // Автоматическая настройка severity на основе контекста
    if (this.context.framework === 'vitest' && !this.context.hasConfig) {
      this.result.severity = SeverityLevel.MEDIUM;
    }

    // Автоматическая настройка рекомендаций
    if (!this.result.recommendations) {
      this.result.recommendations = this.generateRecommendations();
    }

    // Оптимизация сообщений
    if (this.result.message && this.context.framework) {
      this.result.message = this.result.message.replace(/фреймворк/g, this.context.framework);
    }
  }

  /**
   * Генерирует рекомендации на основе контекста
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.result.passed) {
      if (this.context.framework === 'vitest' && !this.context.hasConfig) {
        recommendations.push('Создайте vitest.config.ts для настройки тестовой среды');
      }

      if (this.context.framework === 'jest' && !this.context.hasConfig) {
        recommendations.push('Создайте jest.config.js для настройки Jest');
      }

      if (!this.context.hasTests) {
        recommendations.push('Создайте тестовые файлы с расширением .test.ts или .spec.ts');
      }

      if (
        this.context.coveragePercentage &&
        this.context.coveragePercentage < TESTING_THRESHOLDS.COVERAGE_THRESHOLD
      ) {
        recommendations.push(
          `Увеличьте покрытие кода до ${TESTING_THRESHOLDS.COVERAGE_THRESHOLD}% или выше`
        );
      }
    }

    return recommendations;
  }

  /**
   * Создает финальный CheckResult с применением всех оптимизаций
   */
  build(): CheckResult {
    // Применяем автоматические оптимизации
    this.applyAutoOptimization();

    // Валидируем обязательные поля
    if (!this.result.id || !this.result.name) {
      throw new Error('ResultBuilder: id и name являются обязательными полями');
    }

    if (this.result.passed === undefined) {
      throw new Error('ResultBuilder: необходимо установить статус passed');
    }

    if (!this.result.message) {
      this.result.message = this.result.passed
        ? `${this.result.name}: успешно`
        : `${this.result.name}: требует внимания`;
    }

    if (this.result.severity === undefined) {
      this.result.severity = this.result.passed ? SeverityLevel.LOW : SeverityLevel.MEDIUM;
    }

    if (this.result.score === undefined) {
      this.result.score = this.result.passed ? 1 : 0;
      this.result.maxScore = 1;
    }

    return this.result as CheckResult;
  }

  /**
   * Создает массив результатов из массива данных
   */
  static buildMultiple<T>(
    data: T[],
    builderFunction: (item: T, index: number) => ResultBuilder
  ): CheckResult[] {
    return data.map((item, index) => builderFunction(item, index).build());
  }

  /**
   * Объединяет несколько результатов в сводный результат
   */
  static summarize(results: CheckResult[], summaryId: string, summaryName: string): CheckResult {
    const passed = results.every(r => r.passed);
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const issuesCount = results.filter(r => !r.passed).length;

    const severity =
      issuesCount === 0
        ? SeverityLevel.LOW
        : issuesCount <= 2
          ? SeverityLevel.MEDIUM
          : SeverityLevel.HIGH;

    return new ResultBuilder(summaryId, summaryName)
      .passed(passed)
      .severity(severity)
      .score(totalScore, maxScore)
      .message(`Проверено ${results.length} компонентов, найдено ${issuesCount} проблем`)
      .details({
        totalChecks: results.length,
        passedChecks: results.filter(r => r.passed).length,
        failedChecks: issuesCount,
        detailedResults: results.map(r => ({
          id: r.id,
          name: r.name,
          passed: r.passed,
          score: r.score,
        })),
      })
      .stats({
        duration: results.reduce((sum, r) => sum + (r.stats?.duration || 0), 0),
        filesChecked: results.reduce((sum, r) => sum + (r.stats?.filesChecked || 0), 0),
        issuesFound: issuesCount,
      })
      .build();
  }
}
