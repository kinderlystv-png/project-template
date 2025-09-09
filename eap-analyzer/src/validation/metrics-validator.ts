/**
 * Валидатор метрик для проверки корректности расчетов
 * Специализированная проверка числовых значений и их логической целостности
 */

export interface MetricValidationRule {
  metricName: string;
  dataType: 'number' | 'percentage' | 'ratio' | 'count';
  range: { min: number; max: number };
  dependencies?: string[]; // Метрики, от которых зависит данная
  validator?: (value: any, context: any) => boolean;
  errorMessage?: string;
}

export interface MetricValidationResult {
  metric: string;
  value: any;
  isValid: boolean;
  violations: string[];
  suggestions: string[];
}

export interface MetricsValidationReport {
  projectPath: string;
  timestamp: Date;
  totalMetrics: number;
  validMetrics: number;
  invalidMetrics: number;
  results: MetricValidationResult[];
  summary: {
    byCategory: { [category: string]: { valid: number; invalid: number } };
    criticalViolations: number;
    warningViolations: number;
  };
}

export class MetricsValidator {
  private rules: Map<string, MetricValidationRule> = new Map();

  constructor() {
    this.initializeStandardRules();
  }

  /**
   * Инициализирует стандартные правила валидации метрик
   */
  private initializeStandardRules(): void {
    // Правила для метрик дупликации
    this.addRule({
      metricName: 'duplication.percentage',
      dataType: 'percentage',
      range: { min: 0, max: 100 },
      errorMessage: 'Процент дупликации должен быть между 0% и 100%',
    });

    this.addRule({
      metricName: 'duplication.duplicatedBlocks',
      dataType: 'count',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      dependencies: ['duplication.totalBlocks'],
      validator: (value, context) => {
        const totalBlocks = context['duplication.totalBlocks'];
        return totalBlocks === undefined || value <= totalBlocks;
      },
      errorMessage: 'Количество дублированных блоков не может превышать общее количество блоков',
    });

    this.addRule({
      metricName: 'duplication.duplicatedLines',
      dataType: 'count',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      dependencies: ['duplication.totalLines'],
      validator: (value, context) => {
        const totalLines = context['duplication.totalLines'];
        return totalLines === undefined || value <= totalLines;
      },
      errorMessage: 'Количество дублированных строк не может превышать общее количество строк',
    });

    // Правила для метрик сложности
    this.addRule({
      metricName: 'complexity.cyclomatic',
      dataType: 'number',
      range: { min: 1, max: 1000 }, // Разумный верхний предел
      validator: (value, context) => {
        // Цикломатическая сложность должна быть положительной
        return value > 0;
      },
      errorMessage: 'Цикломатическая сложность должна быть положительным числом',
    });

    this.addRule({
      metricName: 'complexity.cognitive',
      dataType: 'number',
      range: { min: 0, max: 5000 }, // Когнитивная может быть 0
      validator: (value, context) => {
        const cyclomatic = context['complexity.cyclomatic'];
        // Когнитивная сложность обычно >= цикломатической
        return cyclomatic === undefined || value >= 0;
      },
      errorMessage: 'Когнитивная сложность должна быть неотрицательным числом',
    });

    this.addRule({
      metricName: 'complexity.maintainabilityIndex',
      dataType: 'percentage',
      range: { min: 0, max: 100 },
      errorMessage: 'Индекс сопровождаемости должен быть между 0 и 100',
    });

    this.addRule({
      metricName: 'complexity.halstead.volume',
      dataType: 'number',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      validator: (value, context) => {
        // Объем Холстеда не может быть отрицательным
        return value >= 0 && isFinite(value);
      },
      errorMessage: 'Объем Холстеда должен быть неотрицательным конечным числом',
    });

    this.addRule({
      metricName: 'complexity.halstead.difficulty',
      dataType: 'number',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      validator: (value, context) => {
        return value >= 0 && isFinite(value);
      },
      errorMessage: 'Сложность Холстеда должна быть неотрицательным конечным числом',
    });

    // Правила для метрик вложенности
    this.addRule({
      metricName: 'nesting.maximum',
      dataType: 'count',
      range: { min: 0, max: 50 }, // Разумный предел вложенности
      validator: (value, context) => {
        const average = context['nesting.average'];
        return average === undefined || value >= average;
      },
      errorMessage: 'Максимальная вложенность должна быть >= средней вложенности',
    });

    this.addRule({
      metricName: 'nesting.average',
      dataType: 'number',
      range: { min: 0, max: 50 },
      validator: value => value >= 0 && isFinite(value),
      errorMessage: 'Средняя вложенность должна быть неотрицательным конечным числом',
    });

    // Правила для классификации файлов
    this.addRule({
      metricName: 'classification.totalFiles',
      dataType: 'count',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      errorMessage: 'Общее количество файлов должно быть неотрицательным',
    });

    this.addRule({
      metricName: 'classification.classifiedFiles',
      dataType: 'count',
      range: { min: 0, max: Number.MAX_SAFE_INTEGER },
      dependencies: ['classification.totalFiles'],
      validator: (value, context) => {
        const totalFiles = context['classification.totalFiles'];
        return totalFiles === undefined || value <= totalFiles;
      },
      errorMessage: 'Количество классифицированных файлов не может превышать общее количество',
    });
  }

  /**
   * Добавляет правило валидации
   */
  addRule(rule: MetricValidationRule): void {
    this.rules.set(rule.metricName, rule);
  }

  /**
   * Валидирует набор метрик
   */
  async validateMetrics(metrics: any, projectPath: string): Promise<MetricsValidationReport> {
    console.log('🔢 Запуск валидации метрик...');

    const report: MetricsValidationReport = {
      projectPath,
      timestamp: new Date(),
      totalMetrics: 0,
      validMetrics: 0,
      invalidMetrics: 0,
      results: [],
      summary: {
        byCategory: {},
        criticalViolations: 0,
        warningViolations: 0,
      },
    };

    // Извлекаем все метрики в плоскую структуру
    const flatMetrics = this.flattenMetrics(metrics);
    report.totalMetrics = Object.keys(flatMetrics).length;

    // Валидируем каждую метрику
    for (const [metricPath, value] of Object.entries(flatMetrics)) {
      const result = this.validateSingleMetric(metricPath, value, flatMetrics);
      report.results.push(result);

      if (result.isValid) {
        report.validMetrics++;
      } else {
        report.invalidMetrics++;

        // Классифицируем нарушения
        const isCritical = this.isCriticalViolation(result);
        if (isCritical) {
          report.summary.criticalViolations++;
        } else {
          report.summary.warningViolations++;
        }
      }

      // Группируем по категориям
      const category = this.getMetricCategory(metricPath);
      if (!report.summary.byCategory[category]) {
        report.summary.byCategory[category] = { valid: 0, invalid: 0 };
      }

      if (result.isValid) {
        report.summary.byCategory[category].valid++;
      } else {
        report.summary.byCategory[category].invalid++;
      }
    }

    console.log(
      `✅ Валидация метрик завершена: ${report.validMetrics}/${report.totalMetrics} корректных`
    );
    return report;
  }

  /**
   * Валидирует отдельную метрику
   */
  private validateSingleMetric(
    metricPath: string,
    value: any,
    context: any
  ): MetricValidationResult {
    const result: MetricValidationResult = {
      metric: metricPath,
      value,
      isValid: true,
      violations: [],
      suggestions: [],
    };

    const rule = this.rules.get(metricPath);
    if (!rule) {
      // Если нет специального правила, проводим базовую валидацию
      return this.performBasicValidation(metricPath, value);
    }

    // Проверка типа данных
    if (!this.validateDataType(value, rule.dataType)) {
      result.isValid = false;
      result.violations.push(
        `Неверный тип данных: ожидался ${rule.dataType}, получен ${typeof value}`
      );
    }

    // Проверка диапазона
    if (typeof value === 'number') {
      if (value < rule.range.min || value > rule.range.max) {
        result.isValid = false;
        result.violations.push(
          `Значение ${value} вне допустимого диапазона [${rule.range.min}, ${rule.range.max}]`
        );
      }
    }

    // Пользовательская валидация
    if (rule.validator && !rule.validator(value, context)) {
      result.isValid = false;
      result.violations.push(rule.errorMessage || 'Пользовательская валидация не пройдена');
    }

    // Проверка зависимостей
    if (rule.dependencies) {
      for (const dependency of rule.dependencies) {
        if (context[dependency] === undefined) {
          result.violations.push(`Отсутствует зависимая метрика: ${dependency}`);
        }
      }
    }

    // Генерируем предложения по улучшению
    if (!result.isValid) {
      result.suggestions = this.generateSuggestions(metricPath, value, rule);
    }

    return result;
  }

  /**
   * Выполняет базовую валидацию для метрик без специальных правил
   */
  private performBasicValidation(metricPath: string, value: any): MetricValidationResult {
    const result: MetricValidationResult = {
      metric: metricPath,
      value,
      isValid: true,
      violations: [],
      suggestions: [],
    };

    // Базовые проверки
    if (value === null || value === undefined) {
      result.isValid = false;
      result.violations.push('Значение не определено');
    } else if (typeof value === 'number') {
      if (!isFinite(value)) {
        result.isValid = false;
        result.violations.push('Значение не является конечным числом');
      }
      if (isNaN(value)) {
        result.isValid = false;
        result.violations.push('Значение не является числом (NaN)');
      }
    }

    return result;
  }

  /**
   * Проверяет тип данных
   */
  private validateDataType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'number':
        return typeof value === 'number' && isFinite(value);
      case 'percentage':
        return typeof value === 'number' && value >= 0 && value <= 100;
      case 'ratio':
        return typeof value === 'number' && value >= 0 && value <= 1;
      case 'count':
        return typeof value === 'number' && value >= 0 && Number.isInteger(value);
      default:
        return true;
    }
  }

  /**
   * Определяет критичность нарушения
   */
  private isCriticalViolation(result: MetricValidationResult): boolean {
    const criticalKeywords = ['невозможный', 'отрицательный', 'превышает', 'NaN', 'infinite'];
    return result.violations.some(violation =>
      criticalKeywords.some(keyword => violation.toLowerCase().includes(keyword.toLowerCase()))
    );
  }

  /**
   * Получает категорию метрики
   */
  private getMetricCategory(metricPath: string): string {
    const parts = metricPath.split('.');
    return parts[0] || 'unknown';
  }

  /**
   * Преобразует вложенную структуру метрик в плоскую
   */
  private flattenMetrics(obj: any, prefix = ''): { [key: string]: any } {
    const flattened: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(obj || {})) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenMetrics(value, newKey));
      } else if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'string'
      ) {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Генерирует предложения по исправлению
   */
  private generateSuggestions(
    metricPath: string,
    value: any,
    rule: MetricValidationRule
  ): string[] {
    const suggestions: string[] = [];

    if (metricPath.includes('duplication.percentage') && typeof value === 'number' && value > 100) {
      suggestions.push(
        'Проверьте алгоритм расчета процента дупликации - возможна ошибка в нормализации'
      );
      suggestions.push('Убедитесь, что дублированные линии не считаются несколько раз');
    }

    if (metricPath.includes('complexity') && typeof value === 'number' && value > 1000) {
      suggestions.push('Проверьте, не анализируются ли минифицированные или сгенерированные файлы');
      suggestions.push('Убедитесь в корректности парсинга AST');
    }

    if (metricPath.includes('halstead') && (!isFinite(value) || isNaN(value))) {
      suggestions.push('Проверьте расчет метрик Холстеда на деление на ноль');
      suggestions.push('Убедитесь в корректности подсчета операторов и операндов');
    }

    return suggestions;
  }

  /**
   * Получает статистику валидации
   */
  getValidationStatistics(report: MetricsValidationReport): any {
    return {
      accuracy: report.totalMetrics > 0 ? (report.validMetrics / report.totalMetrics) * 100 : 0,
      criticalIssues: report.summary.criticalViolations,
      warningIssues: report.summary.warningViolations,
      categoriesWithIssues: Object.keys(report.summary.byCategory).filter(
        category => report.summary.byCategory[category].invalid > 0
      ),
    };
  }
}
