/**
 * Evaluation Results Types
 * Типы данных для результатов оценки различных аспектов проекта
 */

export interface DebtEvaluation {
  /** Общий технический долг в часах */
  totalHours: number;

  /** Общая стоимость технического долга в условных единицах */
  totalCost: number;

  /** Приоритетные проблемы для устранения */
  priorityIssues: Array<{
    issue: string;
    category: 'code-quality' | 'performance' | 'security' | 'maintainability';
    effort: number; // часы на устранение
    impact: number; // влияние на проект (1-10)
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;

  /** ROI при устранении долга */
  roi: number;

  /** Процент долга от общего объема кода */
  debtRatio: number;

  /** Категории долга с их весом */
  debtByCategory: Record<
    string,
    {
      hours: number;
      cost: number;
      issuesCount: number;
    }
  >;

  /** Тренд изменения долга */
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number; // процент изменения за период
  };
}

export interface QualityEvaluation {
  /** Общий индекс качества (0-100) */
  overallQuality: number;

  /** Оценка по категориям */
  categoryScores: {
    codeQuality: number;
    testCoverage: number;
    documentation: number;
    performance: number;
    security: number;
    maintainability: number;
  };

  /** Весовые коэффициенты категорий */
  categoryWeights: Record<string, number>;

  /** Детальные метрики */
  detailedMetrics: {
    complexity: number;
    duplication: number;
    testCoverage: number;
    documentationCoverage: number;
    vulnerabilities: number;
    performance: number;
  };

  /** Рекомендации по улучшению */
  improvements: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    currentScore: number;
    targetScore: number;
    actions: string[];
    estimatedEffort: number;
    expectedImpact: number;
  }>;

  /** Сравнение с отраслевыми стандартами */
  benchmarking: {
    industry: string;
    percentile: number; // в каком процентиле находится проект
    betterThan: number; // процент проектов, которые хуже
  };
}

export interface PerformanceEvaluation {
  /** Общая оценка производительности (0-100) */
  overallScore: number;

  /** Метрики производительности */
  metrics: {
    buildTime: number; // время сборки в секундах
    bundleSize: number; // размер бандла в КБ
    loadTime: number; // время загрузки в мс
    memoryUsage: number; // использование памяти в МБ
    cpuUsage: number; // использование CPU в процентах
  };

  /** Проблемы производительности */
  issues: Array<{
    type: 'bundle-size' | 'load-time' | 'memory-leak' | 'cpu-intensive' | 'network';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    solution: string;
    estimatedImprovement: number;
  }>;

  /** Рекомендации по оптимизации */
  optimizations: Array<{
    category: 'code' | 'dependencies' | 'configuration' | 'architecture';
    action: string;
    expectedGain: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;

  /** Сравнение с пороговыми значениями */
  thresholds: {
    buildTime: { current: number; threshold: number; status: 'pass' | 'warning' | 'fail' };
    bundleSize: { current: number; threshold: number; status: 'pass' | 'warning' | 'fail' };
    loadTime: { current: number; threshold: number; status: 'pass' | 'warning' | 'fail' };
  };
}

export interface SecurityEvaluation {
  /** Общий уровень безопасности (0-100) */
  securityScore: number;

  /** Критические уязвимости */
  criticalVulnerabilities: number;

  /** Высокоприоритетные уязвимости */
  highVulnerabilities: number;

  /** Средние уязвимости */
  mediumVulnerabilities: number;

  /** Низкоприоритетные уязвимости */
  lowVulnerabilities: number;

  /** Детальный список уязвимостей */
  vulnerabilities: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    version?: string;
    description: string;
    solution: string;
    cveId?: string;
    cvssScore?: number;
  }>;

  /** Оценка по категориям безопасности */
  securityCategories: {
    dependencies: number;
    codeQuality: number;
    configuration: number;
    secrets: number;
    authentication: number;
    authorization: number;
  };

  /** Рекомендации по безопасности */
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    reasoning: string;
    resources: string[];
  }>;

  /** Соответствие стандартам безопасности */
  compliance: {
    owasp: number; // соответствие OWASP Top 10
    nist: number; // соответствие NIST Framework
    iso27001: number; // соответствие ISO 27001
  };
}

/** Объединенный результат всех оценок */
export interface ComprehensiveEvaluation {
  /** Временная метка оценки */
  timestamp: Date;

  /** Версия проекта */
  projectVersion?: string;

  /** Результаты по категориям */
  evaluations: {
    debt: DebtEvaluation;
    quality: QualityEvaluation;
    performance: PerformanceEvaluation;
    security: SecurityEvaluation;
  };

  /** Общий индекс здоровья проекта */
  projectHealthIndex: number;

  /** Приоритетные действия */
  actionPlan: Array<{
    priority: number;
    category: string;
    action: string;
    effort: number;
    impact: number;
    deadline?: Date;
  }>;

  /** Прогноз развития */
  forecast: {
    quality: {
      trend: 'improving' | 'declining' | 'stable';
      projection: number; // ожидаемое значение через 3 месяца
    };
    debt: {
      trend: 'increasing' | 'decreasing' | 'stable';
      projection: number; // ожидаемое значение через 3 месяца
    };
  };
}
