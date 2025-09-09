/**
 * Типы для AI Insights модулей
 * Объединяет все существующие анализаторы в единую систему
 */

// Импорты существующих типов
export type { CodePattern } from './pattern-recognizer.js';

// Опции для анализа
export interface AnalysisOptions {
  bypassCache?: boolean;
  includeCodeSnippets?: boolean;
  confidenceThreshold?: number;
  verbosity?: 'minimal' | 'normal' | 'detailed';
}

// Экспорт типа дублирования из structure-analyzer
export interface DuplicationResult {
  percentage: number;
  duplicatedLines: number;
  totalLines: number;
  duplicateBlocks: Array<{
    hash: string;
    content: string;
    lines: number;
    startLine: number;
    endLine: number;
    files: Array<{
      path: string;
      startLine: number;
      endLine: number;
    }>;
  }>;
  uniqueLines: number;
  analyzedFiles?: number; // Добавляем для совместимости
  analysisMetadata: {
    analyzedFiles: number;
    skippedFiles: number;
    generatedFiles: number;
  };
}

// Паттерны анализа
export interface PatternAnalysisResult {
  detectedPatterns: Array<{
    type: string;
    confidence: number;
    location: {
      file: string;
      line: number;
    };
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  architecturalScore: number;
  designQuality: number;
  antipatternCount: number;
  antiPatterns: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    count: number;
    description: string;
    files: string[];
  }>;
  designPatterns: Array<{
    type: string;
    confidence: number;
    files: string[];
    description: string;
  }>;
  codeSmells: Array<{
    type: string;
    severity: 'minor' | 'major' | 'critical';
    count: number;
    affectedFiles: string[];
  }>;
  securityConcerns: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    file: string;
    line?: number;
    description: string;
  }>;
  performanceIssues: Array<{
    type: string;
    impact: 'low' | 'medium' | 'high';
    file: string;
    description: string;
  }>;
  recommendations: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
  summary: {
    goodPatterns: number;
    problematicPatterns: number;
    totalConfidence: number;
    predominantArchitecture: string;
  };
}

// Базовые типы для ML и качества
export interface CodeMetrics {
  duplication: DuplicationResult;
  patterns: PatternAnalysisResult;
  complexity?: ComplexityResult;
  fileCount: number;
  linesOfCode: number;
}

export interface ComplexityResult {
  average: number;
  maximum: number;
  files: Array<{
    path: string;
    complexity: number;
    functions: Array<{
      name: string;
      complexity: number;
      startLine: number;
      endLine: number;
    }>;
  }>;
}

// Извлеченные признаки для ML
export interface ExtractedFeatures {
  // Метрики дублирования
  duplicationRatio: number; // 0-1
  duplicateBlockCount: number; // абсолютное число
  avgDuplicateSize: number; // средний размер блока

  // Метрики паттернов
  goodPatternCount: number; // количество хороших паттернов
  antipatternCount: number; // количество антипаттернов
  securityIssueCount: number; // проблемы безопасности
  performanceIssueCount: number; // проблемы производительности
  patternConfidenceAvg: number; // средняя уверенность в паттернах

  // Метрики сложности
  avgComplexity: number; // средняя цикломатическая сложность
  maxComplexity: number; // максимальная сложность
  complexityVariance: number; // разброс сложности

  // Метрики размера
  fileCount: number; // количество файлов
  linesOfCode: number; // строки кода
  avgFileSize: number; // средний размер файла

  // Вычисляемые показатели
  codeSmellScore: number; // 0-100, общий показатель "запаха" кода
  maintainabilityIndex: number; // 0-100, индекс поддерживаемости
  technicalDebtRatio: number; // 0-1, отношение технического долга
}

// Предсказанное качество
export interface QualityScore {
  overall: number; // 0-100, общая оценка
  maintainability: number; // 0-100, поддерживаемость
  reliability: number; // 0-100, надежность
  security: number; // 0-100, безопасность
  performance: number; // 0-100, производительность
  confidence: number; // 0-100, уверенность в предсказании
}

// Рекомендации по улучшению
export interface QualityRecommendation {
  id: string;
  category: 'critical' | 'important' | 'suggestion';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10

  // Связанные проблемы
  relatedPatterns?: string[]; // ID связанных паттернов
  affectedFiles?: string[]; // затронутые файлы

  // Дополнительные технические детали
  technicalDetails?: {
    affectedFiles: string[];
    complexity?: number;
    [key: string]: any;
  };

  // Конкретные действия
  actions?: Array<{
    type: 'refactor' | 'test' | 'documentation' | 'security' | 'performance';
    description: string;
    estimatedTime?: string; // "2 hours", "1 day"
  }>;
}

// Результат AI анализа
export interface AIAnalysisResult {
  // Базовые метрики
  metrics: CodeMetrics;
  features: ExtractedFeatures;

  // Предсказания качества
  qualityScore: QualityScore;
  qualityTrend?: 'improving' | 'stable' | 'degrading';

  // Инсайты и рекомендации
  recommendations: QualityRecommendation[];
  insights: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    details?: string;
  }>;

  // Метаинформация
  analysisMetadata: {
    timestamp: Date;
    version: string;
    modelVersion?: string;
    processingTime: number; // в миллисекундах
    confidenceLevel: 'high' | 'medium' | 'low';
    analysisDepth?: string; // Добавляем для совместимости

    // Покрытие анализа
    coverage: {
      filesAnalyzed: number;
      filesSkipped: number;
      modulesUsed: string[]; // список использованных анализаторов
    };
  };
}

// Конфигурация для AI анализа
export interface AIAnalysisConfig {
  // Включенные модули
  enabledAnalyzers: {
    patterns: boolean;
    duplication: boolean;
    complexity: boolean;
    performance: boolean;
  };

  // Пороги для классификации
  thresholds: {
    duplication: number; // порог дублирования (%)
    complexity: number; // порог сложности
    qualityScore: number; // минимальный приемлемый счет
  };

  // Настройки ML модели
  ml: {
    enabled: boolean;
    modelPath?: string;
    retrainThreshold?: number; // когда переобучать модель
    confidenceThreshold: number; // минимальная уверенность
  };

  // Настройки вывода
  output: {
    format: 'json' | 'html' | 'console';
    verbosity: 'minimal' | 'normal' | 'detailed';
    includeRecommendations: boolean;
    includeCodeSnippets: boolean;
  };
}

// Данные для обучения модели
export interface TrainingData {
  projectId: string;
  projectName: string;
  features: ExtractedFeatures;

  // Целевые переменные (ground truth)
  actualQuality: {
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
  };

  // Контекстная информация
  context: {
    projectType: string; // 'web', 'mobile', 'library', etc.
    teamSize: number;
    developmentTime: number; // в месяцах
    linesOfCode: number;
    technologies: string[];
  };

  // Метаинформация
  metadata: {
    timestamp: Date;
    source: 'manual' | 'automated' | 'survey';
    reviewer?: string;
    notes?: string;
  };
}

// Состояние ML модели
export interface ModelState {
  version: string;
  trainedAt: Date;
  trainingDataCount: number;
  accuracy: number; // 0-1

  // Метрики производительности модели
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
    meanAbsoluteError: number;
  };

  // Информация о признаках
  featureImportance: Record<keyof ExtractedFeatures, number>;

  // Настройки модели
  hyperparameters: Record<string, any>;
}

// Кеш для ускорения анализа
export interface AnalysisCache {
  projectHash: string;
  features: ExtractedFeatures;
  qualityScore: QualityScore;
  timestamp: Date;
  expiresAt: Date;
}

// Событие для логирования и мониторинга
export interface AnalysisEvent {
  type: 'analysis_started' | 'analysis_completed' | 'model_trained' | 'error';
  timestamp: Date;
  projectId?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}
