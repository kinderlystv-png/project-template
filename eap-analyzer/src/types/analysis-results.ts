/**
 * Analysis Results Types
 * Типы данных для результатов анализа различных аспектов проекта
 */

export interface StructureAnalysisResult {
  /** Общее количество файлов в проекте */
  fileCount: number;

  /** Максимальная глубина вложенности директорий */
  directoryDepth: number;

  /** Размеры файлов (путь -> размер в байтах) */
  fileSizes: Record<string, number>;

  /** Распределение файлов по типам (расширение -> количество) */
  fileTypes: Record<string, number>;

  /** Показатель модульности кода (0-1, где 1 - идеальная модульность) */
  modularity: number;

  /** Средний размер файла в байтах */
  averageFileSize: number;

  /** Количество файлов больше порогового размера */
  largeFilesCount: number;

  /** Список больших файлов с их размерами */
  largeFiles: Array<{ path: string; size: number }>;

  /** Директории с наибольшим количеством файлов */
  heaviestDirectories: Array<{ path: string; fileCount: number }>;
}

export interface ComplexityAnalysisResult {
  /** Цикломатическая сложность */
  cyclomaticComplexity: number;

  /** Когнитивная сложность */
  cognitiveComplexity: number;

  /** Общее количество строк кода */
  totalLines: number;

  /** Количество строк логического кода (без комментариев и пустых строк) */
  logicalLines: number;

  /** Количество функций */
  functionCount: number;

  /** Средняя сложность на функцию */
  averageComplexityPerFunction: number;

  /** Функции с высокой сложностью */
  complexFunctions: Array<{
    name: string;
    file: string;
    complexity: number;
    line: number;
  }>;

  /** Индекс поддерживаемости (0-100) */
  maintainabilityIndex: number;
}

export interface DuplicationAnalysisResult {
  /** Общий процент дублированного кода */
  duplicationPercentage: number;

  /** Количество дублированных блоков */
  duplicatedBlocks: number;

  /** Количество дублированных строк */
  duplicatedLines: number;

  /** Список найденных дублирований */
  duplications: Array<{
    sourceFile: string;
    targetFile: string;
    sourceLines: { start: number; end: number };
    targetLines: { start: number; end: number };
    similarity: number;
    tokensCount: number;
  }>;

  /** Файлы с наибольшим количеством дублирований */
  mostDuplicatedFiles: Array<{
    file: string;
    duplicationsCount: number;
    duplicatedLinesCount: number;
  }>;
}

export interface InfrastructureAnalysisResult {
  /** Тип инфраструктуры (docker, k8s, serverless, etc.) */
  type: string;

  /** Статус конфигурации (valid, invalid, missing) */
  status: 'valid' | 'invalid' | 'missing';

  /** Найденные проблемы */
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file?: string;
    line?: number;
  }>;

  /** Рекомендации по улучшению */
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedEffort: string;
  }>;

  /** Метрики безопасности */
  securityMetrics: {
    exposedPorts: number;
    rootUserUsage: boolean;
    secretsInConfig: number;
    vulnerabilities: number;
  };
}

export interface DockerAnalysisResult extends InfrastructureAnalysisResult {
  /** Информация о базовом образе */
  baseImage: {
    name: string;
    tag: string;
    size?: number;
    vulnerabilities?: number;
  };

  /** Количество слоев в образе */
  layersCount: number;

  /** Использование multi-stage build */
  multiStage: boolean;

  /** Открытые порты */
  exposedPorts: number[];

  /** Переменные окружения */
  environmentVariables: string[];

  /** Использование healthcheck */
  hasHealthcheck: boolean;
}

export interface CICDAnalysisResult extends InfrastructureAnalysisResult {
  /** Платформа CI/CD (github-actions, gitlab-ci, jenkins, etc.) */
  platform: string;

  /** Количество рабочих процессов */
  workflowsCount: number;

  /** Количество заданий */
  jobsCount: number;

  /** Используемые действия/плагины */
  actions: string[];

  /** Триггеры запуска */
  triggers: string[];

  /** Наличие тестов в pipeline */
  hasTests: boolean;

  /** Наличие анализа безопасности */
  hasSecurityScan: boolean;

  /** Время выполнения pipeline (в минутах) */
  estimatedDuration?: number;
}
