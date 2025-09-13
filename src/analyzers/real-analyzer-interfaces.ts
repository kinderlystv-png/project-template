/**
 * 🏗️ Базовые интерфейсы для реальных анализаторов EAP
 */

export interface AnalysisCriteria {
  name: string;
  score: string;
  details?: string;
  weight?: number;
}

export interface AnalysisResult {
  componentName: string;
  version: string;
  type: 'checker' | 'module';
  status: 'success' | 'error' | 'warning';
  accuracy: number;
  executionTime: number;
  overallScore: string;
  criteria: AnalysisCriteria[];
  details?: string;
  timestamp: Date;
  // Дополнительные поля для детализации
  filePath?: string;
  orchestratorStatus?: string;
  functionality?: string;
  recommendations?: string[];
  readyStatus?: string;
}

export interface RealAnalyzer {
  name: string;
  version: string;
  type: 'checker' | 'module';

  /**
   * Выполняет реальный анализ проекта
   */
  analyze(projectPath: string): Promise<AnalysisResult>;

  /**
   * Возвращает критерии, которые анализирует этот компонент
   */
  getCriteria(): AnalysisCriteria[];

  /**
   * Проверяет готовность к анализу
   */
  isReady(): boolean;
}

export interface CacheEntry {
  projectPath: string;
  timestamp: Date;
  results: AnalysisResult[];
  projectHash?: string;
}

export interface AnalysisCache {
  /**
   * Сохраняет результаты анализа
   */
  save(projectPath: string, results: AnalysisResult[]): Promise<void>;

  /**
   * Загружает последние результаты анализа
   */
  load(projectPath: string): Promise<CacheEntry | null>;

  /**
   * Получает историю анализов для отслеживания динамики
   */
  getHistory(projectPath: string, limit?: number): Promise<CacheEntry[]>;

  /**
   * Очищает устаревшие записи
   */
  cleanup(olderThanDays: number): Promise<void>;
}

export interface QualityTrend {
  timestamp: Date;
  overallScore: number;
  componentScores: Record<string, number>;
  changeFromPrevious?: {
    overall: number;
    components: Record<string, number>;
  };
}

export interface DynamicsReport {
  projectPath: string;
  generatedAt: Date;
  trends: QualityTrend[];
  summary: {
    improvementAreas: string[];
    regressionAreas: string[];
    stableComponents: string[];
  };
}
