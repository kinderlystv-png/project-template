/**
 * 📊 Расширенные интерфейсы для системы точности анализа
 * Поддерживают детализированный расчёт точности для каждого типа анализатора
 */

// === БАЗОВЫЕ МЕТРИКИ ПРОЕКТА ===
export interface ProjectMetrics {
  // Файловая структура
  totalFiles: number;
  totalLines: number;
  averageFileSize: number;
  directoryDepth: number;
  fileTypeDistribution: Record<string, number>;

  // Сложность
  averageCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  complexityDistribution: { low: number; medium: number; high: number };

  // Качество кода
  duplicationPercentage: number;
  testCoverageEstimate: number;
  documentationCoverage: number;

  // Архитектурные метрики
  architecturalPatterns: string[];
  layerCompliance: number;
  separationOfConcerns: number;

  // Зависимости и безопасность
  dependencyCount: number;
  vulnerabilityCount: number;
  outdatedDependencies: number;

  // Производительность
  largeFileCount: number;
  performanceHotspots: number;

  // AI и технический долг
  antiPatternCount: number;
  goodPatternCount: number;
  technicalDebtIndex: number;
}

// === КОМПОНЕНТЫ ТОЧНОСТИ ===
export interface AccuracyComponents {
  dataQuality: {
    score: number;
    confidence: number;
    factors: string[];
  };
  analysisDepth: {
    score: number;
    coverage: number;
    factors: string[];
  };
  algorithmReliability: {
    score: number;
    stability: number;
    factors: string[];
  };
  historicalCorrectness?: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
  };
}

// === РЕЗУЛЬТАТ РАСЧЁТА ТОЧНОСТИ ===
export interface AccuracyResult {
  overall: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  components: AccuracyComponents;
  explanation: string;
  recommendations?: string[];
}

// === ПРОВАЙДЕР ТОЧНОСТИ ===
export interface AccuracyProvider {
  analyzerType:
    | 'structure'
    | 'security'
    | 'testing'
    | 'performance'
    | 'documentation'
    | 'ai-insights'
    | 'technical-debt';

  /**
   * Рассчитывает точность на основе метрик проекта
   */
  calculateAccuracy(metrics: ProjectMetrics, projectPath: string): Promise<AccuracyResult>;

  /**
   * Извлекает специфические метрики для данного типа анализатора
   */
  extractSpecificMetrics(
    metrics: ProjectMetrics,
    projectPath: string
  ): Promise<Record<string, unknown>>;

  /**
   * Получает весовые коэффициенты для разных факторов
   */
  getMetricWeights(): Record<string, number>;

  /**
   * Проверяет готовность к анализу
   */
  isReady(): boolean;
}

// === БАЗОВЫЙ ПРОВАЙДЕР ===
export abstract class BaseAccuracyProvider implements AccuracyProvider {
  abstract analyzerType: AccuracyProvider['analyzerType'];

  protected baseAccuracy = 75; // Базовая точность по умолчанию
  protected maxAccuracy = 98; // Максимальная достижимая точность
  protected minAccuracy = 45; // Минимальная точность

  abstract calculateAccuracy(metrics: ProjectMetrics, projectPath: string): Promise<AccuracyResult>;
  abstract extractSpecificMetrics(
    metrics: ProjectMetrics,
    projectPath: string
  ): Promise<Record<string, unknown>>;
  abstract getMetricWeights(): Record<string, number>;

  isReady(): boolean {
    return true;
  }

  /**
   * Защищённый метод для расчёта доверительного интервала
   */
  protected calculateConfidenceInterval(
    accuracy: number,
    uncertainty: number
  ): { lower: number; upper: number } {
    const margin = uncertainty * 0.01 * accuracy; // uncertainty в процентах
    return {
      lower: Math.max(this.minAccuracy, Math.round(accuracy - margin)),
      upper: Math.min(this.maxAccuracy, Math.round(accuracy + margin)),
    };
  }

  /**
   * Защищённый метод для нормализации оценки в диапазон
   */
  protected normalizeScore(score: number, min: number = 0, max: number = 100): number {
    return Math.max(
      this.minAccuracy,
      Math.min(
        this.maxAccuracy,
        this.baseAccuracy + ((score - min) / (max - min)) * (this.maxAccuracy - this.baseAccuracy)
      )
    );
  }
}

// === ФАБРИКА ПРОВАЙДЕРОВ ===
export interface AccuracyProviderFactory {
  /**
   * Создаёт провайдер точности для указанного типа анализатора
   */
  createProvider(analyzerType: AccuracyProvider['analyzerType']): AccuracyProvider;

  /**
   * Возвращает список поддерживаемых типов анализаторов
   */
  getSupportedTypes(): AccuracyProvider['analyzerType'][];
}

// === КАЛЬКУЛЯТОР ТОЧНОСТИ ===
export interface AccuracyCalculator {
  /**
   * Рассчитывает точность для всех анализаторов
   */
  calculateForAllAnalyzers(
    metrics: ProjectMetrics,
    projectPath: string
  ): Promise<Map<string, AccuracyResult>>;

  /**
   * Рассчитывает точность для конкретного анализатора
   */
  calculateForAnalyzer(
    analyzerType: AccuracyProvider['analyzerType'],
    metrics: ProjectMetrics,
    projectPath: string
  ): Promise<AccuracyResult>;

  /**
   * Получает статистику точности для проекта
   */
  getProjectAccuracyStats(results: Map<string, AccuracyResult>): {
    averageAccuracy: number;
    reliabilityIndex: number;
    mostReliableAnalyzer: string;
    leastReliableAnalyzer: string;
  };
}

// === ТИПЫ ДЛЯ РАСШИРЕНИЯ ===
export interface EnhancedAnalysisResult {
  // Базовые поля из AnalysisResult
  componentName: string;
  version: string;
  type: 'checker' | 'module';
  status: 'success' | 'error' | 'warning';
  accuracy: number;
  executionTime: number;
  overallScore: string;

  // Добавляем детализированную точность
  accuracyDetails?: AccuracyResult;
}
