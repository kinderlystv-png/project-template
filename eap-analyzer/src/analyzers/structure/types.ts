/**
 * Типы для интеграции FileStructureAnalyzer с основной системой анализа
 */

// Основные интерфейсы для интеграции с AnalysisOrchestrator
export interface CheckContext {
  projectPath: string;
  timeLimit?: number;
  skipCache?: boolean;
  reportingLevel?: 'minimal' | 'standard' | 'detailed';
}

export interface Check {
  id: string;
  name: string;
  description: string;
  category: string;
  score: number;
  critical: boolean;
  level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface CheckResult {
  check: Check;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  recommendations: string[];
  warnings?: string[];
  metrics?: Record<string, number>;
}

export interface Component {
  name: string;
  description: string;
  weight: number;
  checks: Check[];
  critical: boolean;
}

export interface ComponentResult {
  component: Component;
  score: number;
  maxScore: number;
  percentage: number;
  passed: CheckResult[];
  failed: CheckResult[];
  warnings: string[];
  recommendations: string[];
  duration: number;
  metadata?: Record<string, unknown>;
}

// Расширенные типы для структурного анализа
export interface StructureAnalysisResult extends ComponentResult {
  detailedMetrics?: {
    fileDistribution: Record<string, number>;
    architecturalPatterns: ArchitecturalPattern[];
    moduleAnalysis: ModuleAnalysis[];
    refactoringOpportunities: RefactoringOpportunity[];
  };
}

export interface ArchitecturalPattern {
  name: string;
  confidence: number;
  description: string;
  files: string[];
  quality: 'excellent' | 'good' | 'poor' | 'critical';
  benefits?: string[];
  improvements?: string[];
}

export interface ModuleAnalysis {
  name: string;
  path: string;
  fileCount: number;
  totalSize: number;
  averageComplexity: number;
  dependencies: string[];
  cohesion: number; // 0-100
  coupling: number; // 0-100
  testCoverage: number; // 0-100 (estimated)
  maintainabilityIndex: number; // 0-100
}

export interface RefactoringOpportunity {
  type: 'extract-module' | 'split-file' | 'merge-files' | 'reorganize-structure' | 'add-layer';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFiles: string[];
  estimatedEffort: 'small' | 'medium' | 'large' | 'extra-large';
  expectedBenefit: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Конфигурация анализатора
export interface StructureAnalyzerConfig {
  // Критерии для архитектурного анализа
  architecture: {
    minimumPatternConfidence: number; // 0-100
    requireLayerSeparation: boolean;
    enforceNamingConventions: boolean;
    maxModuleSize: number; // в файлах
    maxFileSize: number; // в байтах
  };

  // Критерии качества
  quality: {
    minimumTestCoverage: number; // 0-100
    minimumDocumentationRatio: number; // 0-100
    maxCyclomaticComplexity: number;
    maxNestingDepth: number;
  };

  // Пороги для оценок
  thresholds: {
    excellent: number; // 90+
    good: number; // 70-89
    acceptable: number; // 50-69
    poor: number; // 30-49
    critical: number; // <30
  };

  // Весовые коэффициенты для итоговой оценки
  weights: {
    architecture: number; // 0-1
    modularity: number; // 0-1
    maintainability: number; // 0-1
    complexity: number; // 0-1
    technicalDebt: number; // 0-1
  };
}

// Результат детального анализа архитектуры
export interface DetailedArchitectureAnalysis {
  summary: {
    totalScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    primaryConcerns: string[];
    strengths: string[];
  };

  codebase: {
    totalFiles: number;
    totalSize: number;
    languages: Record<string, number>;
    fileTypes: Record<string, number>;
  };

  structure: {
    depth: {
      average: number;
      maximum: number;
      distribution: Record<number, number>;
    };
    modules: {
      count: number;
      averageSize: number;
      sizeVariance: number;
      coupling: number;
    };
    patterns: ArchitecturalPattern[];
  };

  quality: {
    maintainability: {
      score: number;
      testCoverageEstimate: number;
      documentationRatio: number;
      codeSmells: CodeSmell[];
    };
    complexity: {
      score: number;
      hotspots: ComplexityHotspot[];
      trends: ComplexityTrend[];
    };
    debt: {
      score: number;
      estimatedHours: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      topIssues: TechnicalDebtIssue[];
    };
  };

  recommendations: {
    immediate: RefactoringOpportunity[];
    shortTerm: RefactoringOpportunity[];
    longTerm: RefactoringOpportunity[];
  };
}

export interface CodeSmell {
  type: 'large-file' | 'deep-nesting' | 'duplicate-structure' | 'god-object' | 'feature-envy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  files: string[];
  suggestion: string;
}

export interface ComplexityHotspot {
  file: string;
  complexity: number;
  issues: string[];
  refactoringStrategy: string;
}

export interface ComplexityTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  confidence: number;
  projection: string;
}

export interface TechnicalDebtIssue {
  category: 'architecture' | 'design' | 'implementation' | 'testing' | 'documentation';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'trivial' | 'easy' | 'medium' | 'hard' | 'expert';
  affectedComponents: string[];
}

// Конфигурация по умолчанию
export const DEFAULT_STRUCTURE_ANALYZER_CONFIG: StructureAnalyzerConfig = {
  architecture: {
    minimumPatternConfidence: 60,
    requireLayerSeparation: false,
    enforceNamingConventions: true,
    maxModuleSize: 50,
    maxFileSize: 20000, // 20KB
  },
  quality: {
    minimumTestCoverage: 70,
    minimumDocumentationRatio: 10,
    maxCyclomaticComplexity: 10,
    maxNestingDepth: 6,
  },
  thresholds: {
    excellent: 90,
    good: 70,
    acceptable: 50,
    poor: 30,
    critical: 0,
  },
  weights: {
    architecture: 0.25,
    modularity: 0.2,
    maintainability: 0.25,
    complexity: 0.15,
    technicalDebt: 0.15,
  },
};

// Утилиты для работы с результатами
export class StructureAnalysisUtils {
  /**
   * Определяет итоговую оценку на основе числового значения
   */
  static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  /**
   * Определяет цветовую схему для оценки
   */
  static getScoreColor(score: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score >= 30) return 'orange';
    return 'red';
  }

  /**
   * Форматирует размер файла в человекочитаемый формат
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Генерирует краткое резюме анализа
   */
  static generateSummary(analysis: DetailedArchitectureAnalysis): string {
    const { summary, codebase, quality } = analysis;

    return `
Проект содержит ${codebase.totalFiles} файлов (${StructureAnalysisUtils.formatFileSize(codebase.totalSize)}).
Архитектурная оценка: ${summary.grade} (${summary.totalScore}/100).
Основные проблемы: ${summary.primaryConcerns.join(', ')}.
Поддерживаемость: ${quality.maintainability.score}/100.
Техническй долг: ${quality.debt.estimatedHours} часов (приоритет: ${quality.debt.priority}).
    `.trim();
  }

  /**
   * Приоритизирует рекомендации по рефакторингу
   */
  static prioritizeRecommendations(
    opportunities: RefactoringOpportunity[]
  ): RefactoringOpportunity[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const effortOrder = { small: 1, medium: 2, large: 3, 'extra-large': 4 };

    return opportunities.sort((a, b) => {
      // Сначала по приоритету
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Затем по усилиям (меньше усилий = выше в списке)
      return effortOrder[a.estimatedEffort] - effortOrder[b.estimatedEffort];
    });
  }
}

/**
 * Типы для метрик архитектуры
 */
export interface ArchitectureMetrics {
  score: number;
  patterns_detected: number;
  separation_of_concerns: number;
  dependency_management: number;
  layer_compliance: number;
  cohesion_score: number;
}

/**
 * Типы для метрик модульности
 */
export interface ModularityMetrics {
  score: number;
  module_count: number;
  average_module_size: number;
  size_variance: number;
  coupling_factor: number;
  reusability_score: number;
}

/**
 * Типы для метрик поддерживаемости
 */
export interface MaintainabilityMetrics {
  score: number;
  test_coverage_indicator: number;
  documentation_ratio: number;
  code_duplication_risk: number;
  file_size_distribution: number;
  complexity_distribution: number;
}

/**
 * Типы для метрик сложности
 */
export interface ComplexityMetrics {
  score: number;
  average_depth: number;
  max_depth: number;
  directory_spread: number;
  file_count_complexity: number;
  naming_consistency: number;
}

/**
 * Типы для метрик технического долга
 */
export interface TechnicalDebtMetrics {
  score: number;
  refactoring_priority: 'low' | 'medium' | 'high' | 'critical';
  large_files_penalty: number;
  deep_nesting_penalty: number;
  poor_structure_penalty: number;
  maintenance_hours_estimate: number;
}
