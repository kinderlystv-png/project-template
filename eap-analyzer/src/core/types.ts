/**
 * Базовые типы для системы анализа
 */

export interface CheckContext {
  projectPath: string;
  moduleResults?: ModuleResults;
  config?: AnalysisConfig;
}

export interface CheckResult {
  checker: string;
  category: 'quality' | 'security' | 'performance' | 'structure';
  passed: boolean;
  score: number;
  message: string;
  details?: any;
  timestamp: Date;
  recommendations?: string[];
}

export interface ModuleResults {
  [moduleName: string]: any;
}

export interface CheckerResults {
  [checkerName: string]: CheckResult;
}

export interface FullAnalysisResult {
  modules: ModuleResults;
  checks: CheckerResults;
  summary: AnalysisSummary;
  metadata: AnalysisMetadata;
}

export interface AnalysisSummary {
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  categories: CategorySummary;
  criticalIssues: string[];
  recommendations: string[];
}

export interface CategorySummary {
  quality: { score: number; checks: number; passed: number };
  security: { score: number; checks: number; passed: number };
  performance: { score: number; checks: number; passed: number };
  structure: { score: number; checks: number; passed: number };
}

export interface AnalysisMetadata {
  version: string;
  timestamp: Date;
  duration: number;
  projectPath: string;
  modulesUsed: string[];
  checkersUsed: string[];
}

export interface AnalysisConfig {
  enabledModules?: string[];
  enabledCheckers?: string[];
  thresholds?: {
    minScore?: number;
    criticalThreshold?: number;
  };
  output?: {
    format?: 'json' | 'html' | 'markdown';
    includeDetails?: boolean;
  };
}

// Новые типы для комплексных отчетов
export interface ComprehensiveReport {
  executiveSummary: ExecutiveSummary;
  detailedFindings: Finding[];
  roadmap: ProjectRoadmap;
  visualizations: Visualizations;
  recommendations: PrioritizedRecommendation[];
}

export interface ExecutiveSummary {
  overallScore: number;
  status: string;
  criticalIssuesCount: number;
  topIssues: string[];
  categoryScores: {
    quality: number;
    security: number;
    performance: number;
    structure: number;
  };
}

export interface Finding {
  source: string;
  category: 'quality' | 'security' | 'performance' | 'structure';
  score: number;
  message: string;
  details: any;
  recommendations: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort?: EffortEstimate;
}

export interface EffortEstimate {
  days: number;
  complexity: string;
}

export interface ProjectRoadmap {
  immediate: Finding[];
  shortTerm: Finding[];
  longTerm: Finding[];
  timeline: RoadmapTimeline;
  dependencies: DependencyGraph;
  estimatedEffort: TotalEffort;
}

export interface RoadmapTimeline {
  phases: RoadmapPhase[];
  totalDuration: number;
  startDate: Date;
  estimatedEndDate: Date;
}

export interface RoadmapPhase {
  name: string;
  duration: number;
  items: RoadmapItem[];
}

export interface RoadmapItem {
  title: string;
  effort: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  label: string;
  category: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  label: string;
}

export interface TotalEffort {
  days: number;
  cost: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: Record<string, number>;
}

export interface Visualizations {
  architectureDiagram: string;
  debtHeatmap: any;
  trendCharts: any;
}

export interface PrioritizedRecommendation {
  text: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: string;
}

// Типы для кэширования
export interface CachedResult<T = any> {
  data: T;
  expiry: number;
}

// === РАСШИРЕННЫЕ ТИПЫ ДЛЯ ПОЛНОГО АНАЛИЗА ===

// Ultimate Report - высший стандарт отчетности
export interface UltimateReport {
  executiveSummary: ExecutiveSummary;
  aiInsights: AIInsightsReport;
  architecture: ArchitectureReport;
  technicalDebt: TechnicalDebtReport;
  refactoring: RefactoringReport;
  security: SecurityReport;
  performance: PerformanceReport;
  codeQuality: CodeQualityReport;
  roadmap: ComprehensiveRoadmap;
  recommendations: PrioritizedRecommendations;
  visualizations: CompleteVisualizations;
  metadata: EnhancedMetadata;
}

// AI Insights - интеллектуальный анализ
export interface AIInsightsReport {
  patterns: AIPattern[];
  predictions: QualityPrediction;
  codeSmells: CodeSmell[];
  duplications: DuplicationReport;
  complexity: ComplexityReport;
  recommendations: string[];
  confidence: number;
}

export interface AIPattern {
  name: string;
  type: 'design-pattern' | 'anti-pattern' | 'code-smell';
  confidence: number;
  occurrences: number;
  impact: number;
  description: string;
  example: string;
  recommendation: string;
  effort: EffortEstimate;
}

export interface QualityPrediction {
  overallQuality: number;
  confidence: number;
  factors: QualityFactor[];
  trend: 'improving' | 'degrading' | 'stable';
  prediction: string;
  timeframe: string;
}

export interface QualityFactor {
  name: string;
  impact: number;
  trend: string;
  description: string;
}

export interface CodeSmell {
  name: string;
  severity: 'critical' | 'major' | 'minor';
  files: string[];
  occurrences: number;
  description: string;
  impact: string;
  refactoringSteps: string[];
  effort: EffortEstimate;
}

export interface DuplicationReport {
  percentage: number;
  lines: number;
  files: DuplicatedFile[];
  savings: number; // часы экономии при рефакторинге
  recommendations: string[];
}

export interface DuplicatedFile {
  path: string;
  duplicatedLines: number;
  similarFiles: string[];
  extractionTarget: string;
}

export interface ComplexityReport {
  average: number;
  maximum: number;
  distribution: ComplexityDistribution;
  hotspots: ComplexityHotspot[];
  recommendations: string[];
}

export interface ComplexityDistribution {
  low: number; // < 5
  medium: number; // 5-10
  high: number; // 10-20
  extreme: number; // > 20
}

export interface ComplexityHotspot {
  file: string;
  function: string;
  complexity: number;
  lines: number;
  recommendation: string;
  effort: EffortEstimate;
}

// Architecture Analysis
export interface ArchitectureReport {
  detectedPatterns: ArchitecturalPattern[];
  modularity: ModularityMetrics;
  dependencies: DependencyAnalysis;
  scalability: ScalabilityAssessment;
  stability: StabilityMetrics;
  recommendations: string[];
}

export interface ArchitecturalPattern {
  name: string;
  confidence: number;
  implementation: 'full' | 'partial' | 'violated';
  benefits: string[];
  violations: string[];
  recommendations: string[];
}

export interface ModularityMetrics {
  cohesion: number; // 0-100
  coupling: number; // 0-100
  modules: ModuleMetric[];
  score: number;
  recommendations: string[];
}

export interface ModuleMetric {
  name: string;
  cohesion: number;
  coupling: number;
  dependencies: number;
  dependents: number;
  stability: number;
}

export interface DependencyAnalysis {
  totalDependencies: number;
  cyclicDependencies: CyclicDependency[];
  unusedDependencies: string[];
  outdatedDependencies: OutdatedDependency[];
  securityRisks: string[];
  recommendations: string[];
}

export interface CyclicDependency {
  cycle: string[];
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface OutdatedDependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  securityRisk: boolean;
  breaking: boolean;
}

export interface ScalabilityAssessment {
  score: number; // 0-100
  bottlenecks: string[];
  recommendations: string[];
  horizontalScaling: number;
  verticalScaling: number;
}

export interface StabilityMetrics {
  abstractness: number;
  instability: number;
  distance: number;
  score: number;
}

// Technical Debt
export interface TechnicalDebtReport {
  totalDebt: TechnicalDebtSummary;
  categories: DebtCategory[];
  timeline: DebtTimeline;
  heatmap: DebtHeatmap;
  payoffStrategy: PayoffStrategy;
  roi: ROIAnalysis;
}

export interface TechnicalDebtSummary {
  totalDays: number;
  totalCost: number;
  monthlyInterest: number;
  breakEvenPoint: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DebtCategory {
  name: string;
  debt: number; // дни
  cost: number; // USD
  files: number;
  impact: string;
  examples: string[];
}

export interface DebtTimeline {
  historical: DebtDataPoint[];
  projected: DebtDataPoint[];
  milestones: DebtMilestone[];
}

export interface DebtDataPoint {
  date: string;
  debt: number;
  cost: number;
}

export interface DebtMilestone {
  date: string;
  event: string;
  impact: number;
}

export interface DebtHeatmap {
  files: FileDebt[];
  modules: ModuleDebt[];
  functions: FunctionDebt[];
}

export interface FileDebt {
  path: string;
  debt: number;
  category: string;
  urgency: number;
}

export interface ModuleDebt {
  name: string;
  debt: number;
  files: number;
  category: string;
}

export interface FunctionDebt {
  name: string;
  file: string;
  debt: number;
  complexity: number;
  category: string;
}

export interface PayoffStrategy {
  phases: PayoffPhase[];
  totalEffort: number;
  totalSavings: number;
  recommendations: string[];
}

export interface PayoffPhase {
  name: string;
  duration: number;
  effort: number;
  savings: number;
  items: string[];
}

export interface ROIAnalysis {
  investmentCost: number;
  monthlySavings: number;
  breakEvenMonths: number;
  yearlyROI: number;
  riskAdjustedROI: number;
}

// Refactoring
export interface RefactoringReport {
  targets: RefactoringTarget[];
  examples: RefactoringExample[];
  strategy: RefactoringStrategy;
  risks: RefactoringRisk[];
  phases: RefactoringPhase[];
}

export interface RefactoringTarget {
  file: string;
  function?: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: EffortEstimate;
  benefits: string[];
  risks: string[];
}

export interface RefactoringExample {
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  benefits: string[];
  effort: EffortEstimate;
}

export interface RefactoringStrategy {
  approach: 'big-bang' | 'incremental' | 'strangler-fig';
  phases: RefactoringPhase[];
  risks: string[];
  mitigations: string[];
}

export interface RefactoringPhase {
  name: string;
  duration: number;
  targets: string[];
  dependencies: string[];
  risks: string[];
}

export interface RefactoringRisk {
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

// Security Analysis
export interface SecurityReport {
  vulnerabilities: SecurityVulnerability[];
  owaspCompliance: OWASPCompliance;
  secretsDetection: SecretsReport;
  dependencies: DependencySecurityReport;
  recommendations: SecurityRecommendation[];
  score: number;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  file: string;
  line?: number;
  cwe?: string;
  cvss?: number;
  fix: string;
  effort: EffortEstimate;
}

export interface OWASPCompliance {
  score: number;
  categories: OWASPCategory[];
  recommendations: string[];
}

export interface OWASPCategory {
  name: string;
  compliant: boolean;
  issues: string[];
  recommendations: string[];
}

export interface SecretsReport {
  found: SecretLeak[];
  recommendations: string[];
}

export interface SecretLeak {
  type: string;
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium';
  recommendation: string;
}

export interface DependencySecurityReport {
  vulnerabilities: DependencyVulnerability[];
  outdated: string[];
  recommendations: string[];
}

export interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerability: string;
  severity: string;
  fix: string;
}

export interface SecurityRecommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  effort: EffortEstimate;
}

// Performance Analysis
export interface PerformanceReport {
  bottlenecks: PerformanceBottleneck[];
  metrics: PerformanceMetrics;
  optimizations: PerformanceOptimization[];
  benchmarks: BenchmarkResult[];
  recommendations: string[];
}

export interface PerformanceBottleneck {
  location: string;
  type: 'cpu' | 'memory' | 'io' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  solution: string;
  effort: EffortEstimate;
}

export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  bundleSize: number;
  score: number;
}

export interface PerformanceOptimization {
  type: string;
  description: string;
  expectedGain: string;
  effort: EffortEstimate;
  implementation: string;
}

export interface BenchmarkResult {
  metric: string;
  current: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

// Code Quality
export interface CodeQualityReport {
  metrics: QualityMetrics;
  testCoverage: TestCoverageReport;
  documentation: DocumentationReport;
  linting: LintingReport;
  bestPractices: BestPracticesReport;
}

export interface QualityMetrics {
  maintainability: number;
  reliability: number;
  security: number;
  coverage: number;
  duplication: number;
  overall: number;
}

export interface TestCoverageReport {
  overall: number;
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  uncoveredFiles: string[];
  recommendations: string[];
}

export interface DocumentationReport {
  coverage: number;
  missing: string[];
  outdated: string[];
  quality: number;
  recommendations: string[];
}

export interface LintingReport {
  errors: LintError[];
  warnings: LintWarning[];
  score: number;
  recommendations: string[];
}

export interface LintError {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LintWarning {
  file: string;
  line: number;
  rule: string;
  message: string;
}

export interface BestPracticesReport {
  score: number;
  violations: BestPracticeViolation[];
  recommendations: string[];
}

export interface BestPracticeViolation {
  practice: string;
  files: string[];
  description: string;
  fix: string;
  effort: EffortEstimate;
}

// Comprehensive Roadmap
export interface ComprehensiveRoadmap extends ProjectRoadmap {
  strategicGoals: StrategicGoal[];
  quickWins: QuickWin[];
  riskMitigation: RiskMitigation[];
  resourcePlanning: ResourcePlanning;
}

export interface StrategicGoal {
  name: string;
  description: string;
  timeline: string;
  success: string[];
  dependencies: string[];
}

export interface QuickWin {
  title: string;
  effort: number; // часы
  impact: string;
  implementation: string;
}

export interface RiskMitigation {
  risk: string;
  probability: number;
  impact: number;
  mitigation: string;
  contingency: string;
}

export interface ResourcePlanning {
  phases: ResourcePhase[];
  skillsRequired: SkillRequirement[];
  timeline: string;
}

export interface ResourcePhase {
  name: string;
  duration: number;
  people: number;
  skills: string[];
  cost: number;
}

export interface SkillRequirement {
  skill: string;
  level: 'junior' | 'middle' | 'senior';
  duration: number;
  critical: boolean;
}

// Prioritized Recommendations
export interface PrioritizedRecommendations {
  critical: DetailedRecommendation[];
  high: DetailedRecommendation[];
  medium: DetailedRecommendation[];
  low: DetailedRecommendation[];
  quickWins: QuickWin[];
}

export interface DetailedRecommendation extends PrioritizedRecommendation {
  impact: string;
  effort: EffortEstimate;
  dependencies: string[];
  risks: string[];
  success: string[];
  examples?: string[];
}

// Complete Visualizations
export interface CompleteVisualizations extends Visualizations {
  overallDashboard: DashboardConfig;
  dependencyGraph: DependencyGraphConfig;
  performanceCharts: PerformanceChartConfig;
  qualityTrends: QualityTrendConfig;
  riskMatrix: RiskMatrixConfig;
}

export interface DashboardConfig {
  layout: string;
  widgets: DashboardWidget[];
  filters: string[];
}

export interface DashboardWidget {
  type: string;
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface DependencyGraphConfig {
  layout: 'force' | 'hierarchical' | 'circular';
  clustering: boolean;
  filters: string[];
}

export interface PerformanceChartConfig {
  metrics: string[];
  timeframe: string;
  benchmarks: boolean;
}

export interface QualityTrendConfig {
  period: string;
  metrics: string[];
  predictions: boolean;
}

export interface RiskMatrixConfig {
  categories: string[];
  thresholds: number[];
}

// Enhanced Metadata
export interface EnhancedMetadata extends AnalysisMetadata {
  statistics: AnalysisStatistics;
  confidence: ConfidenceReport;
  comparison: ComparisonData;
}

export interface AnalysisStatistics {
  filesAnalyzed: number;
  linesOfCode: number;
  functions: number;
  classes: number;
  modules: number;
  tests: number;
  dependencies: number;
}

export interface ConfidenceReport {
  overall: number;
  categories: { [key: string]: number };
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  impact: number;
  description: string;
}

export interface ComparisonData {
  previousAnalysis?: Date;
  improvements: string[];
  regressions: string[];
  trend: 'improving' | 'stable' | 'degrading';
}
