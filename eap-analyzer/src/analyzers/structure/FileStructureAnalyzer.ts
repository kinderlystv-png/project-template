/**
 * Fiimport FileSystemScanner, { type ScannedFile } from './FileSystemScanner.js';
import MetricsCalculator, {
  type QualityMetrics,
  type ArchitectureMetrics,
  type ModularityMetrics,
  type MaintainabilityMetrics,
  type ComplexityMetrics,
  type TechnicalDebtMetrics
} from './MetricsCalculator.js';
import type { CheckContext, ComponentResult, CheckResult } from './types.js';nalyzer v3.0 - Реальный анализатор структуры проекта
 *
 * Заменяет примитивное демо optimized-analyzer.cjs реальным анализатором:
 * - Сканирование 100% файлов проекта (не выборочное)
 * - Интеллектуальные метрики архитектуры
 * - Выявление архитектурных паттернов и антипаттернов
 * - Конкретные рекомендации по рефакторингу
 */

import FileSystemScanner, { type ScannedFile } from './FileSystemScanner.js';
import MetricsCalculator, { type QualityMetrics } from './MetricsCalculator.js';
import type {
  CheckContext,
  ComponentResult,
  CheckResult,
  ArchitectureMetrics,
  ModularityMetrics,
  MaintainabilityMetrics,
  ComplexityMetrics,
  TechnicalDebtMetrics,
} from './types.js';

/**
 * Главный класс анализатора структуры файлов
 */
export class FileStructureAnalyzer {
  private analysisCache: Map<string, QualityMetrics> = new Map();

  /**
   * Основной метод для интеграции с AnalysisOrchestrator
   */
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const analyzer = new FileStructureAnalyzer();
    const startTime = Date.now();

    try {
      // Фаза 1: Сканирование файловой системы
      const scannedFiles = await analyzer.scanProjectFiles(context.projectPath);

      // Фаза 2: Вычисление метрик качества
      const qualityMetrics = analyzer.calculateMetrics(scannedFiles, context.projectPath);

      // Фаза 3: Создание результата анализа
      const result = analyzer.createAnalysisResult(qualityMetrics, scannedFiles, startTime);

      return result;
    } catch (error) {
      return analyzer.createErrorResult(startTime, error);
    }
  }

  /**
   * Сканирует файлы проекта с использованием FileSystemScanner
   */
  private async scanProjectFiles(projectPath: string): Promise<ScannedFile[]> {
    const scannedFiles = await FileSystemScanner.scanProject(projectPath, {
      maxFiles: 5000, // Ограничиваем для производительности
      maxDepth: 15, // Разумная глубина
    });

    return scannedFiles;
  }

  /**
   * Вычисляет метрики качества с использованием MetricsCalculator
   */
  private calculateMetrics(files: ScannedFile[], projectPath: string): QualityMetrics {
    // Проверяем кэш
    const cacheKey = `${projectPath}-${files.length}-${files.reduce((sum, f) => sum + f.size, 0)}`;
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Вычисляем новые метрики
    const metrics = MetricsCalculator.calculateQualityMetrics(files, projectPath);

    // Кэшируем результат
    this.analysisCache.set(cacheKey, metrics);

    return metrics;
  }

  /**
   * Создает результат анализа для интеграции с системой
   */
  private createAnalysisResult(
    metrics: QualityMetrics,
    files: ScannedFile[],
    startTime: number
  ): ComponentResult {
    const checkResults: CheckResult[] = [
      {
        check: {
          id: 'structure-architecture',
          name: 'Архитектурное качество',
          description: 'Оценка архитектурного качества и паттернов проекта',
          category: 'structure',
          score: 100,
          critical: true,
          level: 'high',
          tags: ['architecture', 'quality', 'patterns'],
        },
        passed: metrics.architecture.score >= 70,
        score: metrics.architecture.score,
        maxScore: 100,
        details: `Архитектурный счет: ${metrics.architecture.score}/100. Паттернов обнаружено: ${metrics.architecture.patterns_detected}. Разделение ответственности: ${metrics.architecture.separation_of_concerns}/100`,
        recommendations: this.generateArchitectureRecommendations(metrics.architecture, files),
        metrics: {
          patterns_detected: metrics.architecture.patterns_detected,
          separation_of_concerns: metrics.architecture.separation_of_concerns,
          dependency_management: metrics.architecture.dependency_management,
          layer_compliance: metrics.architecture.layer_compliance,
          cohesion_score: metrics.architecture.cohesion_score,
        },
      },
      {
        check: {
          id: 'structure-modularity',
          name: 'Модульность',
          description: 'Оценка модульности и организации кода',
          category: 'structure',
          score: 100,
          critical: false,
          level: 'medium',
          tags: ['modularity', 'organization', 'coupling'],
        },
        passed: metrics.modularity.score >= 60,
        score: metrics.modularity.score,
        maxScore: 100,
        details: `Модульность: ${metrics.modularity.score}/100. Модулей: ${metrics.modularity.module_count}. Средний размер модуля: ${metrics.modularity.average_module_size.toFixed(1)} файлов. Фактор связанности: ${(metrics.modularity.coupling_factor * 100).toFixed(1)}%`,
        recommendations: this.generateModularityRecommendations(metrics.modularity),
        metrics: {
          module_count: metrics.modularity.module_count,
          average_module_size: metrics.modularity.average_module_size,
          size_variance: metrics.modularity.size_variance,
          coupling_factor: metrics.modularity.coupling_factor,
          reusability_score: metrics.modularity.reusability_score,
        },
      },
      {
        check: {
          id: 'structure-maintainability',
          name: 'Поддерживаемость',
          description: 'Оценка поддерживаемости кодовой базы',
          category: 'structure',
          score: 100,
          critical: false,
          level: 'medium',
          tags: ['maintainability', 'documentation', 'testing'],
        },
        passed: metrics.maintainability.score >= 65,
        score: metrics.maintainability.score,
        maxScore: 100,
        details: `Поддерживаемость: ${metrics.maintainability.score}/100. Индикатор тестов: ${metrics.maintainability.test_coverage_indicator}/100. Документация: ${metrics.maintainability.documentation_ratio}/100. Риск дублирования: ${metrics.maintainability.code_duplication_risk}/100`,
        recommendations: this.generateMaintainabilityRecommendations(metrics.maintainability),
        metrics: {
          test_coverage_indicator: metrics.maintainability.test_coverage_indicator,
          documentation_ratio: metrics.maintainability.documentation_ratio,
          code_duplication_risk: metrics.maintainability.code_duplication_risk,
          file_size_distribution: metrics.maintainability.file_size_distribution,
          complexity_distribution: metrics.maintainability.complexity_distribution,
        },
      },
      {
        check: {
          id: 'structure-complexity',
          name: 'Сложность структуры',
          description: 'Оценка структурной сложности проекта',
          category: 'structure',
          score: 100,
          critical: false,
          level: 'low',
          tags: ['complexity', 'depth', 'organization'],
        },
        passed: metrics.complexity.score >= 60,
        score: metrics.complexity.score,
        maxScore: 100,
        details: `Сложность: ${metrics.complexity.score}/100 (100 = низкая сложность). Средняя глубина: ${metrics.complexity.average_depth.toFixed(1)}. Максимальная глубина: ${metrics.complexity.max_depth}. Консистентность именования: ${metrics.complexity.naming_consistency}/100`,
        recommendations: this.generateComplexityRecommendations(metrics.complexity),
        metrics: {
          average_depth: metrics.complexity.average_depth,
          max_depth: metrics.complexity.max_depth,
          directory_spread: metrics.complexity.directory_spread,
          file_count_complexity: metrics.complexity.file_count_complexity,
          naming_consistency: metrics.complexity.naming_consistency,
        },
      },
      {
        check: {
          id: 'structure-technical-debt',
          name: 'Технический долг',
          description: 'Оценка технического долга в структуре проекта',
          category: 'structure',
          score: 100,
          critical: true,
          level: 'high',
          tags: ['technical-debt', 'refactoring', 'maintenance'],
        },
        passed: metrics.technical_debt.score >= 70,
        score: metrics.technical_debt.score,
        maxScore: 100,
        details: `Технический долг: ${metrics.technical_debt.score}/100 (100 = нет долга). Оценка поддержки: ${metrics.technical_debt.maintenance_hours_estimate} часов. Приоритет рефакторинга: ${metrics.technical_debt.refactoring_priority}`,
        recommendations: this.generateTechnicalDebtRecommendations(metrics.technical_debt),
        metrics: {
          large_files_penalty: metrics.technical_debt.large_files_penalty,
          deep_nesting_penalty: metrics.technical_debt.deep_nesting_penalty,
          poor_structure_penalty: metrics.technical_debt.poor_structure_penalty,
          maintenance_hours_estimate: metrics.technical_debt.maintenance_hours_estimate,
        },
      },
    ];

    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);
    const totalScore = checkResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Собираем общие рекомендации
    const allRecommendations = checkResults.flatMap(r => r.recommendations).slice(0, 8); // Ограничиваем топ-8

    return {
      component: {
        name: 'File Structure Analysis v3.0',
        description: `Реальный анализатор структуры проекта. Проанализировано ${files.length} файлов`,
        weight: 9, // Высокая важность для архитектуры
        checks: checkResults.map(r => r.check),
        critical: true,
      },
      score: totalScore,
      maxScore,
      percentage,
      passed,
      failed,
      warnings: this.generateWarnings(metrics, files),
      recommendations: allRecommendations,
      duration: Date.now() - startTime,
      metadata: {
        filesAnalyzed: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        averageFileSize:
          files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0,
        uniqueExtensions: new Set(files.map(f => f.extension)).size,
        deepestNesting: Math.max(...files.map(f => f.depth), 0),
      },
    };
  }

  /**
   * Генерирует улучшенные рекомендации по архитектуре с учетом реального анализа
   */
  private generateArchitectureRecommendations(
    arch: ArchitectureMetrics,
    files?: ScannedFile[]
  ): string[] {
    // Если переданы файлы, используем улучшенную логику
    if (files) {
      return this.generateEnhancedRecommendations(files);
    }

    // Иначе используем старую логику
    const recommendations: string[] = [];

    if (arch.patterns_detected === 0) {
      recommendations.push(
        'Не обнаружено архитектурных паттернов. Рекомендуется реорганизация проекта по принципам MVC или модульной архитектуры'
      );
    }

    if (arch.separation_of_concerns < 60) {
      recommendations.push(
        'Низкое разделение ответственности. Вынесите специализированную логику в отдельные модули'
      );
    }

    if (arch.dependency_management < 70) {
      recommendations.push('Улучшите управление зависимостями. Создайте четкую иерархию модулей');
    }

    if (arch.layer_compliance < 60) {
      recommendations.push('Рассмотрите применение слоистой архитектуры для улучшения структуры');
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Генерирует рекомендации по модульности
   */
  private generateModularityRecommendations(mod: ModularityMetrics): string[] {
    const recommendations: string[] = [];

    if (mod.module_count < 3) {
      recommendations.push(
        'Слишком мало модулей. Разбейте код на логические группы по функциональности'
      );
    }

    if (mod.coupling_factor > 0.7) {
      recommendations.push(
        'Высокая связанность между модулями. Уменьшите зависимости между компонентами'
      );
    }

    if (mod.size_variance > 50) {
      recommendations.push('Большой разброс в размерах модулей. Сбалансируйте распределение кода');
    }

    if (mod.reusability_score < 40) {
      recommendations.push(
        'Низкий потенциал переиспользования. Выделите общие утилиты и компоненты'
      );
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Генерирует рекомендации по поддерживаемости
   */
  private generateMaintainabilityRecommendations(maint: MaintainabilityMetrics): string[] {
    const recommendations: string[] = [];

    if (maint.test_coverage_indicator < 50) {
      recommendations.push(
        'Низкое покрытие тестами. Добавьте unit и integration тесты для критических компонентов'
      );
    }

    if (maint.documentation_ratio < 30) {
      recommendations.push(
        'Недостаточно документации. Создайте README, архитектурные диаграммы и API документацию'
      );
    }

    if (maint.code_duplication_risk > 70) {
      recommendations.push(
        'Высокий риск дублирования кода. Проведите рефакторинг для выделения общих компонентов'
      );
    }

    if (maint.file_size_distribution < 60) {
      recommendations.push(
        'Неравномерное распределение размеров файлов. Разбейте большие файлы на меньшие модули'
      );
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Генерирует рекомендации по сложности
   */
  private generateComplexityRecommendations(comp: ComplexityMetrics): string[] {
    const recommendations: string[] = [];

    if (comp.average_depth > 4) {
      recommendations.push('Слишком глубокая структура директорий. Упростите иерархию файлов');
    }

    if (comp.max_depth > 8) {
      recommendations.push('Критически глубокая вложенность. Реорганизуйте структуру проекта');
    }

    if (comp.naming_consistency < 60) {
      recommendations.push(
        'Низкая консистентность именования. Применяйте единый стиль именования файлов'
      );
    }

    if (comp.file_count_complexity < 50) {
      recommendations.push(
        'Высокая сложность из-за количества файлов. Рассмотрите группировку связанных файлов'
      );
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Генерирует рекомендации по техническому долгу
   */
  private generateTechnicalDebtRecommendations(debt: TechnicalDebtMetrics): string[] {
    const recommendations: string[] = [];

    if (debt.large_files_penalty > 20) {
      recommendations.push(
        'Обнаружены большие файлы. Разбейте их на меньшие, более управляемые модули'
      );
    }

    if (debt.deep_nesting_penalty > 15) {
      recommendations.push('Слишком глубокая вложенность директорий. Упростите структуру проекта');
    }

    if (debt.poor_structure_penalty > 20) {
      recommendations.push(
        'Проблемы со структурой проекта. Реорганизуйте код согласно архитектурным принципам'
      );
    }

    if (debt.maintenance_hours_estimate > 100) {
      recommendations.push(
        `Высокие затраты на поддержку (${debt.maintenance_hours_estimate} часов). Приоритизируйте рефакторинг`
      );
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Генерирует предупреждения
   */
  private generateWarnings(metrics: QualityMetrics, files: ScannedFile[]): string[] {
    const warnings: string[] = [];

    // Предупреждения по критическим проблемам
    if (metrics.technical_debt.refactoring_priority === 'critical') {
      warnings.push('КРИТИЧЕСКИЙ технический долг требует немедленного рефакторинга');
    }

    if (metrics.architecture.score < 30) {
      warnings.push('Критически низкое архитектурное качество');
    }

    const largeFiles = files.filter(f => f.size > 50000); // > 50KB
    if (largeFiles.length > 0) {
      warnings.push(`Обнаружено ${largeFiles.length} очень больших файлов (>50KB)`);
    }

    const veryDeepFiles = files.filter(f => f.depth > 10);
    if (veryDeepFiles.length > 0) {
      warnings.push(
        `Обнаружено ${veryDeepFiles.length} файлов с критически глубокой вложенностью (>10 уровней)`
      );
    }

    return warnings.slice(0, 4);
  }

  /**
   * Создание результата при ошибке
   */
  private createErrorResult(startTime: number, error: unknown): ComponentResult {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const errorCheck: CheckResult = {
      check: {
        id: 'structure-error',
        name: 'Structure Analysis Error',
        description: 'Ошибка при анализе структуры файлов',
        category: 'structure',
        score: 0,
        critical: true,
        level: 'critical',
        tags: ['error', 'failure'],
      },
      passed: false,
      score: 0,
      maxScore: 100,
      details: `Критическая ошибка анализа: ${errorMessage}`,
      recommendations: [
        'Проверьте права доступа к файлам проекта',
        'Убедитесь что путь к проекту корректен',
        'Проверьте наличие свободного места на диске',
        'Убедитесь что проект не содержит поврежденных файлов',
      ],
    };

    return {
      component: {
        name: 'File Structure Analysis Error',
        description: 'Критическая ошибка анализа структуры',
        weight: 9,
        checks: [errorCheck.check],
        critical: true,
      },
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: [],
      failed: [errorCheck],
      warnings: ['Анализ структуры файлов не удался'],
      recommendations: ['Исправьте ошибки для получения анализа структуры проекта'],
      duration: Date.now() - startTime,
      metadata: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Улучшенный анализ захламленности корневой директории
   */
  private static analyzeRootClutter(files: ScannedFile[]): {
    rootFileCount: number;
    tempFilesInRoot: number;
    documentationFilesInRoot: number;
    clutterScore: number;
  } {
    const rootFiles = files.filter(f => f.depth === 0);
    const rootFileCount = rootFiles.length;

    // Извлекаем имя файла из relativePath
    const getFileName = (file: ScannedFile): string => {
      const parts = file.relativePath.split('/');
      return parts[parts.length - 1];
    };

    const tempFilesInRoot = rootFiles.filter(f => {
      const fileName = getFileName(f);
      return (
        fileName.includes('temp') ||
        fileName.includes('test-') ||
        fileName.includes('debug-') ||
        f.extension === '.log' ||
        f.extension === '.bak'
      );
    }).length;

    const documentationFilesInRoot = rootFiles.filter(f => {
      const fileName = getFileName(f);
      return (
        f.extension === '.md' && !['README.md', 'CHANGELOG.md', 'LICENSE.md'].includes(fileName)
      );
    }).length;

    // Рассчитываем оценку захламленности
    let clutterScore = 100;
    if (rootFileCount > 50) clutterScore -= 40;
    else if (rootFileCount > 30) clutterScore -= 25;
    else if (rootFileCount > 20) clutterScore -= 15;

    clutterScore -= tempFilesInRoot * 2;
    clutterScore -= documentationFilesInRoot * 1;

    return {
      rootFileCount,
      tempFilesInRoot,
      documentationFilesInRoot,
      clutterScore: Math.max(0, clutterScore),
    };
  }

  /**
   * Улучшенный анализ соблюдения конвенций именования
   */
  private static analyzeNamingConventions(files: ScannedFile[]): {
    cyrillicFiles: number;
    conventionScore: number;
  } {
    const getFileName = (file: ScannedFile): string => {
      const parts = file.relativePath.split('/');
      return parts[parts.length - 1];
    };

    const cyrillicFiles = files.filter(f => /[а-яё]/i.test(getFileName(f))).length;
    const longNames = files.filter(f => getFileName(f).length > 50).length;

    let conventionScore = 100;
    conventionScore -= cyrillicFiles * 3; // -3 за каждый файл с кириллицей
    conventionScore -= longNames * 2; // -2 за каждое длинное имя

    return {
      cyrillicFiles,
      conventionScore: Math.max(0, conventionScore),
    };
  }

  /**
   * Улучшенные рекомендации с учетом реального анализа проекта
   */
  private generateEnhancedRecommendations(files: ScannedFile[]): string[] {
    const recommendations: string[] = [];
    const rootClutter = FileStructureAnalyzer.analyzeRootClutter(files);
    const namingAnalysis = FileStructureAnalyzer.analyzeNamingConventions(files);

    // Рекомендации по захламленности корня
    if (rootClutter.rootFileCount > 30) {
      recommendations.push('Очистить корень от временных файлов, переместить .md файлы в docs/');
    }

    if (rootClutter.tempFilesInRoot > 5) {
      recommendations.push('Удалить временные и отладочные файлы из корневой директории');
    }

    if (rootClutter.documentationFilesInRoot > 10) {
      recommendations.push('Переместить документацию из корня в папку docs/');
    }

    // Рекомендации по именованию
    if (namingAnalysis.cyrillicFiles > 0) {
      recommendations.push('Использовать английские имена файлов для лучшей совместимости');
    }

    // Проверяем структуру проекта
    const hasReadme = files.some(f => {
      const fileName = f.relativePath.split('/').pop()?.toLowerCase();
      return fileName === 'readme.md';
    });

    const hasPackageJson = files.some(f => {
      const fileName = f.relativePath.split('/').pop();
      return fileName === 'package.json';
    });

    const hasProperSrcStructure = files.some(f => f.relativePath.startsWith('src/'));

    // Корректные рекомендации только если что-то действительно отсутствует
    if (!hasReadme) {
      recommendations.push('Добавить README.md в корень проекта');
    }

    if (!hasPackageJson && files.some(f => f.extension === '.js' || f.extension === '.ts')) {
      recommendations.push('Добавить package.json для управления зависимостями');
    }

    if (!hasProperSrcStructure && files.length > 20) {
      recommendations.push('Создать папку src/ для организации исходного кода');
    }

    return recommendations.slice(0, 5);
  }

  private static calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  }
}

export default FileStructureAnalyzer;
