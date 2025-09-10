/**
 * 📋 EAP ANALYZER v6.0 - REPORTER TYPES
 * Интерфейсы и типы для системы отчетов
 */

export interface ReportData {
  timestamp: string;
  projectPath: string;
  summary: ProjectSummary;
  categories: CategoryReport[];
  recommendations: Recommendation[];
  performance: PerformanceMetrics;
  security: SecurityReport;
  testing: TestingReport;
  metadata: ReportMetadata;
}

export interface ProjectSummary {
  totalReadiness: number;
  componentsCount: number;
  issuesCount: number;
  recommendationsCount: number;
  criticalIssues: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface CategoryReport {
  name: string;
  slug: string;
  readiness: number;
  components: ComponentReport[];
  status: ComponentStatus;
  description: string;
}

export interface ComponentReport {
  name: string;
  readiness: number;
  status: ComponentStatus;
  issues: Issue[];
  recommendations: string[];
  details: ComponentDetails;
}

export interface ComponentDetails {
  filesAnalyzed: number;
  linesOfCode: number;
  testsCount: number;
  coverage?: number;
  lastUpdated: string;
  dependencies: string[];
}

export interface Issue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
}

export interface Recommendation {
  id: string;
  category: string;
  component: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  estimatedTime: string;
  impact: string;
}

export interface PerformanceMetrics {
  bundleSize: {
    total: number;
    gzipped: number;
    assets: AssetInfo[];
  };
  buildTime: number;
  memoryUsage: number;
  coreWebVitals?: CoreWebVitals;
  lighthouse?: LighthouseMetrics;
}

export interface AssetInfo {
  name: string;
  size: number;
  gzipped: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

export interface SecurityReport {
  vulnerabilities: SecurityVulnerability[];
  securityScore: number;
  cspStatus: string;
  httpsStatus: string;
  authenticationStatus: string;
  dataProtectionStatus: string;
}

export interface SecurityVulnerability {
  type: 'xss' | 'csrf' | 'sql-injection' | 'path-traversal' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  recommendation: string;
  cve?: string;
}

export interface TestingReport {
  coverage: TestCoverage;
  testResults: TestResults;
  testFiles: TestFile[];
  mockingStatus: string;
  e2eStatus: string;
}

export interface TestCoverage {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface TestFile {
  path: string;
  tests: number;
  passed: number;
  failed: number;
  coverage: number;
}

export interface ReportMetadata {
  version: string;
  analyzer: string;
  nodeVersion: string;
  os: string;
  totalAnalysisTime: number;
  configUsed: string;
}

export type ComponentStatus = 'excellent' | 'good' | 'warning' | 'critical';

export interface ReportConfig {
  format: 'html' | 'markdown' | 'json' | 'console';
  outputPath?: string;
  templatePath?: string;
  includeDetails: boolean;
  includeRecommendations: boolean;
  theme?: 'light' | 'dark' | 'auto';
  interactive: boolean;
  minifyOutput: boolean;
}

export interface IReporter {
  generate(data: ReportData, config: ReportConfig): Promise<string>;
  getDefaultConfig(): ReportConfig;
  getSupportedFormats(): string[];
}

export interface ReporterOptions {
  outputDir: string;
  includeTimestamp: boolean;
  openAfterGeneration: boolean;
  compareWithPrevious: boolean;
  ci: boolean;
}
