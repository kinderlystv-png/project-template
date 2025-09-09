/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Типы и интерфейсы для анализа проектов
 */

export interface GoldenStandardConfig {
  name: string;
  version: string;
  standards: StandardComponent[];
  weights: ComponentWeights;
  thresholds: QualityThresholds;
}

export interface StandardComponent {
  name: string;
  description: string;
  weight: number; // 1-10, важность компонента
  checks: Check[];
  critical?: boolean; // критически важный компонент
}

export interface Check {
  id: string;
  name: string;
  description: string;
  category: CheckCategory;
  score: number; // баллы за выполнение
  critical?: boolean; // критически важная проверка
  level: CheckLevel;
  tags: string[];
}

export interface CheckResult {
  check: Check;
  passed: boolean;
  score: number;
  maxScore: number;
  details?: string;
  recommendations?: string[];
  duration?: number; // время выполнения в мс
}

export interface ComponentResult {
  component: StandardComponent;
  score: number;
  maxScore: number;
  percentage: number;
  passed: CheckResult[];
  failed: CheckResult[];
  warnings: CheckResult[];
  recommendations: string[];
  duration: number;
}

export interface ComprehensiveReport {
  basicAnalysis?: AnalysisResult;
  ultimateAnalysis?: any; // Добавляем для совместимости
  aiInsights?: any;
  technicalDebtAnalysis?: any;
  refactoringRecommendations?: any;
  [key: string]: any;
}

export interface DebtCategory {
  name: string;
  debt: number;
  impact: string;
  items: any[];
}

export interface DebtMetrics {
  totalHours: number;
  totalCost: number;
  categories: DebtCategory[];
}

export interface DebtHeatmap {
  files: HeatmapEntry[];
  modules: HeatmapEntry[];
}

export interface HeatmapEntry {
  name: string;
  debt: number;
  severity: string;
}

export interface DebtTimeline {
  history: DebtSnapshot[];
  projection: DebtProjection;
}

export interface DebtSnapshot {
  date: string;
  totalDebt: number;
  trend: string;
}

export interface DebtProjection {
  sixMonths: number;
  oneYear: number;
  trend: string;
}

export interface PayoffStrategy {
  quickWins: RefactoringPhase[];
  riskMitigation: RefactoringPhase[];
  highImpact: RefactoringPhase[];
}

export interface RefactoringPhase {
  description: string;
  effort: number;
  impact: string;
}

export interface TechnicalDebtAssessment {
  totalDebt: number;
  categories: DebtCategory[];
  payoffPlan: PayoffStrategy;
  [key: string]: any;
}

export interface AnalysisResult {
  timestamp: string;
  projectPath: string;
  projectName: string;
  standard: {
    name: string;
    version: string;
  };
  overall: {
    score: number;
    maxScore: number;
    percentage: number;
    grade: Grade;
    weightedScore: number;
  };
  components: ComponentResult[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    criticalIssues: number;
    duration: number;
  };
  metadata: {
    analyzer: string;
    version: string;
    environment: EnvironmentInfo;
  };
  recommendations: PriorityRecommendation[];
}

export interface PriorityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  issue: string;
  description: string;
  solution: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: number; // влияние на общий рейтинг (1-10)
}

export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  os: string;
  arch: string;
  analyzerVersion: string;
  timestamp: string;
}

export interface ComponentWeights {
  emt: number; // Эталонный Модуль Тестирования
  docker: number;
  sveltekit: number; // SvelteKit Framework
  cicd: number; // CI/CD Pipeline
  codeQuality: number; // Система качества кода
  vitest: number; // Vitest Testing Framework
  dependencies: number; // Управление зависимостями
  logging: number; // Система логирования
  framework: number; // Общие настройки фреймворка
  security: number; // Безопасность
  performance: number; // Производительность
  documentation: number; // Документация
}

export interface QualityThresholds {
  excellent: number; // 90+
  good: number; // 70+
  acceptable: number; // 50+
  poor: number; // <50
}

export type CheckCategory =
  | 'testing'
  | 'docker'
  | 'framework'
  | 'cicd'
  | 'code-quality'
  | 'dependencies'
  | 'security'
  | 'performance'
  | 'documentation'
  | 'structure'
  | 'sveltekit'
  | 'vitest'
  | 'logging';

export type CheckLevel = 'critical' | 'high' | 'medium' | 'low' | 'optional';

export type Grade =
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D+'
  | 'D'
  | 'D-'
  | 'F';

export interface ProjectInfo {
  name: string;
  version: string;
  description?: string;
  framework?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  hasTypeScript: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCICD: boolean;
  linesOfCode?: number;
  dependencies: {
    production: number;
    development: number;
    total: number;
  };
}

export interface AnalyzerOptions {
  projectPath: string;
  configPath?: string;
  outputPath?: string;
  format?: 'json' | 'html' | 'markdown' | 'console';
  verbose?: boolean;
  includeOptional?: boolean;
  excludeCategories?: CheckCategory[];
  onlyCategories?: CheckCategory[];
  threshold?: number;
  thresholds?: any; // Добавлено для поддержки адаптивных порогов
  generateReport?: boolean;
  openReport?: boolean;
}

export interface CheckContext {
  projectPath: string;
  projectInfo: ProjectInfo;
  options: AnalyzerOptions;
}

// Интерфейс для реализации проверок
export interface IChecker {
  check(context: CheckContext): Promise<CheckResult>;
}

// Интерфейс для генераторов отчетов
export interface IReportGenerator {
  generate(result: AnalysisResult, outputPath: string): Promise<void>;
}

// Конфигурация золотого стандарта по умолчанию
export const DEFAULT_GOLDEN_STANDARD: GoldenStandardConfig = {
  name: 'SHINOMONTAGKA Golden Standard',
  version: '1.0.0',
  standards: [], // Будет заполнено в файлах checkers
  weights: {
    emt: 10,
    docker: 9,
    sveltekit: 9,
    cicd: 9,
    codeQuality: 10,
    vitest: 8,
    dependencies: 8,
    logging: 7,
    framework: 7,
    security: 8,
    performance: 7,
    documentation: 6,
  },
  thresholds: {
    excellent: 90,
    good: 70,
    acceptable: 50,
    poor: 0,
  },
};

// Утилитарные типы
export type CheckFactory = (context: CheckContext) => IChecker;
export type ComponentChecker = (context: CheckContext) => Promise<ComponentResult>;

// События анализатора
export interface AnalyzerEvents {
  'analysis:start': (projectPath: string) => void;
  'analysis:complete': (result: AnalysisResult) => void;
  'component:start': (component: string) => void;
  'component:complete': (result: ComponentResult) => void;
  'check:start': (check: Check) => void;
  'check:complete': (result: CheckResult) => void;
  error: (error: Error) => void;
}
