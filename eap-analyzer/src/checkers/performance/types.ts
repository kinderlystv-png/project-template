/**
 * Типы для модульной системы анализа производительности
 * Поддерживает Task 2.1 (BundleSizeAnalyzer) и Task 2.2 (RuntimeMetricsAnalyzer)
 */

// === CORE INTERFACES ===

/**
 * Базовый интерфейс для всех анализаторов производительности
 */
export interface IPerformanceAnalyzer {
  readonly name: string;
  readonly category: string;
  analyze(projectPath: string): Promise<PerformanceResult>;
}

/**
 * Результат анализа производительности
 */
export interface PerformanceResult {
  score: number;
  metrics: Record<string, unknown>;
  issues: Array<{ severity: string; message: string }>;
  recommendations: string[];
  analysisTime: number;
  details?: Record<string, unknown>;
}

/**
 * Конфигурация анализа производительности
 */
export interface PerformanceConfig {
  bundleSizeThreshold: number;
  loadTimeThreshold: number;
  memoryThreshold: number;
  enableRuntimeAnalysis: boolean;
  enableBundleAnalysis: boolean;
  enableDependencyAnalysis: boolean;
}

// === BUNDLE SIZE ANALYSIS TYPES (Task 2.1) ===

/**
 * Результат анализа размера бандла
 */
export interface BundleSizeAnalysisResult {
  totalSize: number;
  dependencies: DependencyInfo[];
  buildOutputs: BuildOutputInfo[];
  staticAssets: AssetInfo[];
  configOptimizations: ConfigOptimization[];
}

/**
 * Информация о зависимости
 */
export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  type: 'production' | 'development' | 'peer' | 'optional';
  issues: string[];
  recommendations: string[];
}

/**
 * Информация о build output
 */
export interface BuildOutputInfo {
  fileName: string;
  size: number;
  type: 'js' | 'css' | 'html' | 'asset';
  compressed?: number;
  analysis: {
    chunkSize: number;
    optimized: boolean;
    issues: string[];
  };
}

/**
 * Информация об ассетах
 */
export interface AssetInfo {
  fileName: string;
  size: number;
  type: 'image' | 'font' | 'video' | 'audio' | 'other';
  optimized: boolean;
  recommendations: string[];
}

/**
 * Оптимизация конфигурации
 */
export interface ConfigOptimization {
  file: string;
  type: 'webpack' | 'vite' | 'rollup' | 'babel' | 'typescript';
  optimizations: string[];
  issues: string[];
}

// === RUNTIME METRICS ANALYSIS TYPES (Task 2.2) ===

/**
 * Результат анализа runtime производительности
 */
export interface RuntimeMetricsResult {
  coreWebVitals: CoreWebVitalsMetrics;
  jsPerformance: JavaScriptPerformanceMetrics;
  domOperations: DOMOperationsMetrics;
  memoryPatterns: MemoryPatternMetrics;
  frameworkOptimizations: FrameworkOptimizationMetrics;
}

/**
 * Метрики Core Web Vitals
 */
export interface CoreWebVitalsMetrics {
  lcpFactors: {
    largeImages: number;
    unoptimizedImages: number;
  };
  fidFactors: {
    heavyJSBlocks: number;
    longTasks: number;
  };
  clsFactors: {
    dynamicContent: number;
    layoutShiftRisks: number;
  };
}

/**
 * Метрики производительности JavaScript
 */
export interface JavaScriptPerformanceMetrics {
  totalJSFiles: number;
  totalLinesOfCode: number;
  averageFileSize: number;
  complexFunctions: number;
  largeFiles: number;
  asyncAwaitUsage: number;
  promiseUsage: number;
  blockingOperations: number;
}

/**
 * Метрики DOM операций
 */
export interface DOMOperationsMetrics {
  totalDOMQueries: number;
  domModifications: number;
  eventListeners: number;
  inefficientQueries: number;
  layoutThrashingRisks: number;
}

/**
 * Метрики паттернов использования памяти
 */
export interface MemoryPatternMetrics {
  memoryLeakRisks: number;
  largeDataStructures: number;
  inefficientLoops: number;
  eventListenerLeaks: number;
}

/**
 * Метрики фреймворк-специфичных оптимизаций
 */
export interface FrameworkOptimizationMetrics {
  detectedFramework: string;
  unnecessaryRerenders?: number; // React
  missingMemoization?: number; // React
  vueFiles?: number; // Vue
  svelteFiles?: number; // Svelte
  changeDetectionIssues?: number; // Angular
}

// === THRESHOLDS AND CONFIGURATIONS ===

/**
 * Пороговые значения для анализа производительности
 */
export interface PerformanceThresholds {
  // Core Web Vitals
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;

  // Runtime thresholds
  domOperationsPerSecond: number;
  memoryUsageMB: number;
  jsExecutionTime: number;

  // Code analysis thresholds
  maxFunctionComplexity: number;
  maxFileSize: number;
  maxDOMQueries: number;

  // Bundle size thresholds
  maxBundleSize: number;
  maxDependencies: number;
  maxAssetSize: number;
}

/**
 * Детальная конфигурация анализа
 */
export interface AnalysisConfiguration {
  thresholds: PerformanceThresholds;
  enabledAnalyzers: {
    bundleSize: boolean;
    runtimeMetrics: boolean;
    dependencyAnalysis: boolean;
    frameworkOptimizations: boolean;
  };
  outputFormat: 'json' | 'html' | 'console';
  includeRecommendations: boolean;
}

// === UTILITY TYPES ===

/**
 * Тип для severity levels
 */
export type SeverityType = 'low' | 'medium' | 'high' | 'critical';

/**
 * Тип для категорий анализаторов
 */
export type AnalyzerCategory = 'bundle' | 'runtime' | 'dependency' | 'framework' | 'security';

/**
 * Тип для результатов с оценкой
 */
export interface ScoredResult {
  score: number;
  maxScore: number;
  passed: boolean;
  category: AnalyzerCategory;
}

/**
 * Тип для рекомендаций
 */
export interface Recommendation {
  title: string;
  description: string;
  priority: SeverityType;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: AnalyzerCategory;
}
