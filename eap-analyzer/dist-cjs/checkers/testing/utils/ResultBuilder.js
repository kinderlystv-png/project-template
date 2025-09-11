'use strict';
/**
 * ResultBuilder - расширенный билдер для создания CheckResult
 * Предоставляет Fluent API и автоматическую оптимизацию результатов
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResultBuilder = void 0;
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const constants_1 = require('../constants');
/**
 * Билдер результатов с Fluent API и интеллектуальной оптимизацией
 */
class ResultBuilder {
  result;
  context;
  constructor(id, name) {
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
  static success(id, name) {
    return new ResultBuilder(id, name)
      .passed(true)
      .severity(SeverityLevel_1.SeverityLevel.LOW)
      .score(1, 1);
  }
  /**
   * Создает новый билдер для предупреждения
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static warning(id, name) {
    return new ResultBuilder(id, name)
      .passed(false)
      .severity(SeverityLevel_1.SeverityLevel.MEDIUM)
      .score(0, 1);
  }
  /**
   * Создает новый билдер для ошибки
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static error(id, name) {
    return new ResultBuilder(id, name)
      .passed(false)
      .severity(SeverityLevel_1.SeverityLevel.HIGH)
      .score(0, 1);
  }
  /**
   * Создает новый билдер для критической ошибки
   * @param id Идентификатор проверки
   * @param name Название проверки
   * @returns ResultBuilder
   */
  static critical(id, name) {
    return new ResultBuilder(id, name)
      .passed(false)
      .severity(SeverityLevel_1.SeverityLevel.CRITICAL)
      .score(0, 1);
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
  static threshold(id, name, value, threshold, higherIsBetter = true) {
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
  description(desc) {
    this.result.description = desc;
    return this;
  }
  /**
   * Устанавливает результат прохождения
   */
  passed(value) {
    this.result.passed = value;
    if (this.result.stats) {
      this.result.stats.issuesFound = value ? 0 : 1;
    }
    return this;
  }
  /**
   * Устанавливает сообщение
   */
  message(msg) {
    this.result.message = msg;
    return this;
  }
  /**
   * Устанавливает уровень серьезности
   */
  severity(level) {
    this.result.severity = level;
    return this;
  }
  /**
   * Устанавливает оценку
   */
  score(current, max = 1) {
    this.result.score = current;
    this.result.maxScore = max;
    return this;
  }
  /**
   * Добавляет детали
   */
  details(data) {
    this.result.details = { ...this.result.details, ...data };
    return this;
  }
  /**
   * Добавляет рекомендации
   */
  recommendations(recs) {
    this.result.recommendations = recs;
    return this;
  }
  /**
   * Устанавливает статистику
   */
  stats(stats) {
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
  withContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }
  /**
   * Устанавливает фреймворк для контекста
   */
  framework(name) {
    this.context.framework = name;
    return this.details({ framework: name });
  }
  /**
   * Добавляет информацию о покрытии для автоматической оценки
   */
  coverage(percentage) {
    this.context.coveragePercentage = percentage;
    // Автоматически определяем результат на основе покрытия
    const threshold = constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD;
    const passed = percentage >= threshold;
    return this.passed(passed)
      .severity(passed ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM)
      .score(passed ? 1 : Math.max(0, percentage / threshold), 1)
      .details({ coveragePercentage: percentage, threshold });
  }
  /**
   * Добавляет информацию о количестве тестов для автоматической оценки
   */
  testCount(count, expectedMin) {
    const threshold = expectedMin || constants_1.TESTING_THRESHOLDS.MIN_UNIT_TESTS;
    const passed = count >= threshold;
    return this.passed(passed)
      .severity(passed ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM)
      .score(passed ? 1 : Math.max(0, count / threshold), 1)
      .details({ testCount: count, expectedMin: threshold });
  }
  /**
   * Применяет автоматическую оптимизацию на основе контекста
   */
  applyAutoOptimization() {
    // Автоматическая настройка severity на основе контекста
    if (this.context.framework === 'vitest' && !this.context.hasConfig) {
      this.result.severity = SeverityLevel_1.SeverityLevel.MEDIUM;
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
  generateRecommendations() {
    const recommendations = [];
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
        this.context.coveragePercentage < constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD
      ) {
        recommendations.push(
          `Увеличьте покрытие кода до ${constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD}% или выше`
        );
      }
    }
    return recommendations;
  }
  /**
   * Создает финальный CheckResult с применением всех оптимизаций
   */
  build() {
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
      this.result.severity = this.result.passed
        ? SeverityLevel_1.SeverityLevel.LOW
        : SeverityLevel_1.SeverityLevel.MEDIUM;
    }
    if (this.result.score === undefined) {
      this.result.score = this.result.passed ? 1 : 0;
      this.result.maxScore = 1;
    }
    return this.result;
  }
  /**
   * Создает массив результатов из массива данных
   */
  static buildMultiple(data, builderFunction) {
    return data.map((item, index) => builderFunction(item, index).build());
  }
  /**
   * Объединяет несколько результатов в сводный результат
   */
  static summarize(results, summaryId, summaryName) {
    const passed = results.every(r => r.passed);
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const issuesCount = results.filter(r => !r.passed).length;
    const severity =
      issuesCount === 0
        ? SeverityLevel_1.SeverityLevel.LOW
        : issuesCount <= 2
          ? SeverityLevel_1.SeverityLevel.MEDIUM
          : SeverityLevel_1.SeverityLevel.HIGH;
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
exports.ResultBuilder = ResultBuilder;
//# sourceMappingURL=ResultBuilder.js.map
