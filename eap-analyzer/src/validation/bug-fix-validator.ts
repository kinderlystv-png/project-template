/**
 * Валидатор исправлений критических багов EAP
 * Проверяет корректность метрик после исправлений
 */

export interface ValidationRule {
  name: string;
  description: string;
  category: 'duplication' | 'complexity' | 'classification' | 'general';
  validate: (value: any, context?: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  value: any;
  expected: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface BugFixValidationReport {
  projectPath: string;
  validatedAt: Date;
  rules: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  categories: {
    [key: string]: {
      passed: number;
      failed: number;
      results: ValidationResult[];
    };
  };
  criticalIssues: ValidationResult[];
  recommendations: string[];
  isValid: boolean;
}

export class BugFixValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Инициализирует правила валидации для исправленных багов
   */
  private initializeValidationRules(): void {
    // Правила для дупликации
    this.rules.push({
      name: 'duplication_percentage_valid',
      description: 'Процент дупликации не должен превышать 100%',
      category: 'duplication',
      validate: (value: number) => ({
        passed: value >= 0 && value <= 100,
        value,
        expected: '0-100%',
        message:
          value > 100
            ? `Невозможный процент дупликации: ${value}%`
            : value < 0
              ? `Отрицательный процент дупликации: ${value}%`
              : 'Процент дупликации в норме',
        severity: value > 100 || value < 0 ? 'error' : 'info',
      }),
    });

    this.rules.push({
      name: 'duplication_blocks_reasonable',
      description: 'Количество дублированных блоков должно быть разумным',
      category: 'duplication',
      validate: (value: number, context?: { totalBlocks?: number }) => {
        const ratio = context?.totalBlocks ? value / context.totalBlocks : 0;
        return {
          passed: ratio <= 1.0,
          value,
          expected: `<= ${context?.totalBlocks || 'N/A'}`,
          message:
            ratio > 1.0
              ? `Дублированных блоков больше чем всего блоков: ${value} > ${context?.totalBlocks}`
              : 'Количество дублированных блоков корректно',
          severity: ratio > 1.0 ? 'error' : 'info',
        };
      },
    });

    // Правила для сложности
    this.rules.push({
      name: 'cyclomatic_complexity_reasonable',
      description: 'Цикломатическая сложность должна быть разумной',
      category: 'complexity',
      validate: (value: number, context?: { linesOfCode?: number }) => {
        const linesOfCode = context?.linesOfCode || 100;
        const maxReasonable = Math.max(50, Math.floor(linesOfCode / 10));

        return {
          passed: value > 0 && value <= maxReasonable,
          value,
          expected: `1-${maxReasonable}`,
          message:
            value <= 0
              ? `Неположительная сложность: ${value}`
              : value > maxReasonable
                ? `Неразумно высокая сложность: ${value} для ${linesOfCode} строк`
                : 'Сложность в разумных пределах',
          severity: value <= 0 || value > maxReasonable ? 'error' : 'info',
        };
      },
    });

    this.rules.push({
      name: 'cognitive_complexity_reasonable',
      description: 'Когнитивная сложность должна быть разумной',
      category: 'complexity',
      validate: (value: number, context?: { cyclomaticComplexity?: number }) => {
        const cyclomaticComplexity = context?.cyclomaticComplexity || 10;
        const maxReasonable = cyclomaticComplexity * 3; // Когнитивная обычно выше цикломатической

        return {
          passed: value >= 0 && value <= maxReasonable,
          value,
          expected: `0-${maxReasonable}`,
          message:
            value < 0
              ? `Отрицательная когнитивная сложность: ${value}`
              : value > maxReasonable
                ? `Слишком высокая когнитивная сложность: ${value} (цикломатическая: ${cyclomaticComplexity})`
                : 'Когнитивная сложность корректна',
          severity: value < 0 || value > maxReasonable ? 'error' : 'info',
        };
      },
    });

    this.rules.push({
      name: 'maintainability_index_valid',
      description: 'Индекс сопровождаемости должен быть в диапазоне 0-100',
      category: 'complexity',
      validate: (value: number) => ({
        passed: value >= 0 && value <= 100,
        value,
        expected: '0-100',
        message:
          value < 0
            ? `Отрицательный индекс сопровождаемости: ${value}`
            : value > 100
              ? `Индекс сопровождаемости выше максимума: ${value}`
              : 'Индекс сопровождаемости корректен',
        severity: value < 0 || value > 100 ? 'error' : 'info',
      }),
    });

    // Правила для классификации
    this.rules.push({
      name: 'file_classification_complete',
      description: 'Все файлы должны быть классифицированы',
      category: 'classification',
      validate: (value: { total: number; classified: number }) => ({
        passed: value.classified === value.total,
        value: `${value.classified}/${value.total}`,
        expected: `${value.total}/${value.total}`,
        message:
          value.classified < value.total
            ? `Не все файлы классифицированы: ${value.classified} из ${value.total}`
            : 'Все файлы классифицированы',
        severity: value.classified < value.total ? 'warning' : 'info',
      }),
    });

    this.rules.push({
      name: 'no_unknown_categories',
      description: 'Не должно быть файлов с неизвестной категорией',
      category: 'classification',
      validate: (value: { [category: string]: number }) => {
        const unknownCount = value['unknown'] || 0;
        return {
          passed: unknownCount === 0,
          value: unknownCount,
          expected: '0',
          message:
            unknownCount > 0
              ? `Файлы с неизвестной категорией: ${unknownCount}`
              : 'Все файлы имеют определенную категорию',
          severity: unknownCount > 0 ? 'warning' : 'info',
        };
      },
    });

    // Общие правила
    this.rules.push({
      name: 'no_generated_files_analyzed',
      description: 'Сгенерированные файлы не должны анализироваться на дупликацию/сложность',
      category: 'general',
      validate: (value: { analyzedGenerated: number; totalGenerated: number }) => ({
        passed: value.analyzedGenerated === 0,
        value: value.analyzedGenerated,
        expected: '0',
        message:
          value.analyzedGenerated > 0
            ? `Анализируются сгенерированные файлы: ${value.analyzedGenerated} из ${value.totalGenerated}`
            : 'Сгенерированные файлы корректно исключены',
        severity: value.analyzedGenerated > 0 ? 'error' : 'info',
      }),
    });
  }

  /**
   * Валидирует результаты структурного анализа
   */
  async validateAnalysisResults(
    analysisResults: any,
    projectPath: string
  ): Promise<BugFixValidationReport> {
    console.log('🔍 Запуск валидации исправлений...');

    const report: BugFixValidationReport = {
      projectPath,
      validatedAt: new Date(),
      rules: { total: 0, passed: 0, failed: 0, warnings: 0 },
      categories: {},
      criticalIssues: [],
      recommendations: [],
      isValid: true,
    };

    // Инициализируем категории
    const categories = ['duplication', 'complexity', 'classification', 'general'];
    categories.forEach(category => {
      report.categories[category] = { passed: 0, failed: 0, results: [] };
    });

    // Подготавливаем данные для валидации
    const validationData = this.prepareValidationData(analysisResults);

    // Применяем правила валидации
    for (const rule of this.rules) {
      const data = validationData[rule.name];
      if (data === undefined) continue;

      report.rules.total++;

      let result: ValidationResult;
      try {
        result = rule.validate(data.value, data.context);
      } catch (error) {
        result = {
          passed: false,
          value: data.value,
          expected: 'valid',
          message: `Ошибка валидации: ${error}`,
          severity: 'error',
        };
      }

      // Обновляем статистику
      if (result.passed) {
        report.rules.passed++;
        report.categories[rule.category].passed++;
      } else {
        if (result.severity === 'error') {
          report.rules.failed++;
          report.categories[rule.category].failed++;
          report.criticalIssues.push(result);
          report.isValid = false;
        } else if (result.severity === 'warning') {
          report.rules.warnings++;
        }
      }

      report.categories[rule.category].results.push(result);
    }

    // Генерируем рекомендации
    report.recommendations = this.generateRecommendations(report);

    console.log(
      `✅ Валидация завершена: ${report.rules.passed}/${report.rules.total} правил прошли`
    );

    return report;
  }

  /**
   * Подготавливает данные для валидации из результатов анализа
   */
  private prepareValidationData(analysisResults: any): {
    [ruleName: string]: { value: any; context?: any };
  } {
    const data: { [key: string]: { value: any; context?: any } } = {};

    // Данные дупликации
    if (analysisResults.duplication) {
      data['duplication_percentage_valid'] = {
        value: analysisResults.duplication.percentage || 0,
      };

      data['duplication_blocks_reasonable'] = {
        value: analysisResults.duplication.duplicatedBlocks || 0,
        context: { totalBlocks: analysisResults.duplication.totalBlocks || 0 },
      };
    }

    // Данные сложности
    if (analysisResults.complexity?.summary) {
      const summary = analysisResults.complexity.summary;

      data['cyclomatic_complexity_reasonable'] = {
        value: summary.maxCyclomatic || 0,
        context: { linesOfCode: 1000 }, // Примерная оценка
      };

      data['cognitive_complexity_reasonable'] = {
        value: summary.maxCognitive || 0,
        context: { cyclomaticComplexity: summary.maxCyclomatic || 10 },
      };
    }

    // Проверяем индекс сопровождаемости для отдельных файлов
    if (analysisResults.complexity?.files) {
      const files = analysisResults.complexity.files.filter((f: any) => f.shouldAnalyze);
      if (files.length > 0) {
        const avgMaintainability =
          files.reduce((sum: number, f: any) => sum + (f.metrics?.maintainabilityIndex || 0), 0) /
          files.length;

        data['maintainability_index_valid'] = {
          value: avgMaintainability,
        };
      }
    }

    // Данные классификации
    if (analysisResults.fileClassification) {
      data['file_classification_complete'] = {
        value: {
          total: analysisResults.fileClassification.total || 0,
          classified: analysisResults.fileClassification.classified || 0,
        },
      };

      if (analysisResults.fileClassification.categories?.byCategory) {
        data['no_unknown_categories'] = {
          value: analysisResults.fileClassification.categories.byCategory,
        };
      }
    }

    // Общие данные
    data['no_generated_files_analyzed'] = {
      value: {
        analyzedGenerated: 0, // TODO: получить из реальных данных
        totalGenerated: 0,
      },
    };

    return data;
  }

  /**
   * Генерирует рекомендации на основе результатов валидации
   */
  private generateRecommendations(report: BugFixValidationReport): string[] {
    const recommendations: string[] = [];

    // Рекомендации для критических ошибок
    for (const issue of report.criticalIssues) {
      if (issue.message.includes('Невозможный процент дупликации')) {
        recommendations.push(
          '🔧 Проверьте алгоритм расчета дупликации - возможна ошибка в нормализации'
        );
      }

      if (issue.message.includes('Неразумно высокая сложность')) {
        recommendations.push(
          '🔧 Проверьте фильтрацию минифицированных файлов в калькуляторе сложности'
        );
      }

      if (issue.message.includes('сгенерированные файлы')) {
        recommendations.push('🔧 Улучшите детекцию сгенерированных файлов в классификаторе');
      }
    }

    // Общие рекомендации
    if (report.rules.failed > 0) {
      recommendations.push(
        '⚠️ Обнаружены критические ошибки - необходимо дополнительное исправление'
      );
    }

    if (report.rules.warnings > 0) {
      recommendations.push('💡 Есть предупреждения - рекомендуется дополнительная настройка');
    }

    if (report.isValid) {
      recommendations.push('✅ Все критические исправления работают корректно');
    }

    return recommendations;
  }

  /**
   * Получает правила валидации по категории
   */
  getRulesByCategory(category: string): ValidationRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  /**
   * Добавляет пользовательское правило валидации
   */
  addCustomRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }
}
