/**
 * MetricsCalculator - Вычисление архитектурных и структурных метрик
 *
 * Предоставляет комплексный анализ качества кодовой базы
 * с интеллектуальными алгоритмами оценки
 */

import type { ScannedFile } from './FileSystemScanner.js';

export interface QualityMetrics {
  architecture: ArchitectureMetrics;
  modularity: ModularityMetrics;
  maintainability: MaintainabilityMetrics;
  complexity: ComplexityMetrics;
  technical_debt: TechnicalDebtMetrics;
}

export interface ArchitectureMetrics {
  score: number; // 0-100
  patterns_detected: number;
  separation_of_concerns: number; // 0-100
  dependency_management: number; // 0-100
  layer_compliance: number; // 0-100
  cohesion_score: number; // 0-100
}

export interface ModularityMetrics {
  score: number; // 0-100
  module_count: number;
  average_module_size: number;
  size_variance: number;
  coupling_factor: number; // 0-1
  reusability_score: number; // 0-100
}

export interface MaintainabilityMetrics {
  score: number; // 0-100
  test_coverage_indicator: number; // 0-100
  documentation_ratio: number; // 0-100
  code_duplication_risk: number; // 0-100
  file_size_distribution: number; // 0-100
  complexity_distribution: number; // 0-100
}

export interface ComplexityMetrics {
  score: number; // 0-100 (100 = low complexity)
  average_depth: number;
  max_depth: number;
  directory_spread: number;
  file_count_complexity: number; // 0-100
  naming_consistency: number; // 0-100
}

export interface TechnicalDebtMetrics {
  score: number; // 0-100 (100 = no debt)
  large_files_penalty: number;
  deep_nesting_penalty: number;
  poor_structure_penalty: number;
  maintenance_hours_estimate: number;
  refactoring_priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface FileCategory {
  name: string;
  count: number;
  avgSize: number;
  maxSize: number;
  quality: number; // 0-100
}

/**
 * Калькулятор архитектурных метрик
 */
export class MetricsCalculator {
  /**
   * Вычисляет полный набор метрик качества
   */
  static calculateQualityMetrics(files: ScannedFile[], projectPath: string): QualityMetrics {
    // Категоризируем файлы для анализа
    const categorizedFiles = MetricsCalculator.categorizeFiles(files);

    return {
      architecture: MetricsCalculator.calculateArchitectureMetrics(files, categorizedFiles),
      modularity: MetricsCalculator.calculateModularityMetrics(files),
      maintainability: MetricsCalculator.calculateMaintainabilityMetrics(files, categorizedFiles),
      complexity: MetricsCalculator.calculateComplexityMetrics(files),
      technical_debt: MetricsCalculator.calculateTechnicalDebtMetrics(files, categorizedFiles),
    };
  }

  /**
   * Категоризирует файлы по функциональному назначению
   */
  private static categorizeFiles(files: ScannedFile[]): Map<string, FileCategory> {
    const categories = new Map<string, FileCategory>();

    // Инициализация базовых категорий
    const baseCategories = [
      'components',
      'services',
      'utils',
      'config',
      'tests',
      'docs',
      'assets',
      'core',
      'features',
      'types',
    ];

    baseCategories.forEach(name => {
      categories.set(name, { name, count: 0, avgSize: 0, maxSize: 0, quality: 0 });
    });

    // Классификация файлов
    for (const file of files) {
      const category = MetricsCalculator.determineFileCategory(file);
      const existing = categories.get(category) || {
        name: category,
        count: 0,
        avgSize: 0,
        maxSize: 0,
        quality: 0,
      };

      existing.count++;
      existing.maxSize = Math.max(existing.maxSize, file.size);

      categories.set(category, existing);
    }

    // Вычисление средних размеров и качества
    categories.forEach(category => {
      if (category.count > 0) {
        const categoryFiles = files.filter(
          f => MetricsCalculator.determineFileCategory(f) === category.name
        );
        category.avgSize = categoryFiles.reduce((sum, f) => sum + f.size, 0) / category.count;
        category.quality = MetricsCalculator.calculateCategoryQuality(categoryFiles);
      }
    });

    return categories;
  }

  /**
   * Определяет категорию файла
   */
  private static determineFileCategory(file: ScannedFile): string {
    const path = file.relativePath.toLowerCase();
    const dir = path.split('/')[0] || 'root';

    // Явные категории по содержимому пути
    if (path.includes('component') || path.includes('ui/')) return 'components';
    if (path.includes('service') || path.includes('api/')) return 'services';
    if (path.includes('util') || path.includes('helper')) return 'utils';
    if (path.includes('config') || path.includes('setting')) return 'config';
    if (path.includes('test') || path.includes('spec')) return 'tests';
    if (path.includes('doc') || file.extension === '.md') return 'docs';
    if (path.includes('asset') || path.includes('static')) return 'assets';
    if (path.includes('type') || file.extension === '.d.ts') return 'types';
    if (path.includes('feature') || path.includes('page')) return 'features';

    // Категории по директориям верхнего уровня
    if (['src', 'lib', 'core'].includes(dir)) return 'core';

    return 'core'; // По умолчанию
  }

  /**
   * Вычисляет качество категории файлов
   */
  private static calculateCategoryQuality(files: ScannedFile[]): number {
    if (files.length === 0) return 100;

    let score = 100;
    const avgSize = files.reduce((sum, f) => sum + f.size, 0) / files.length;

    // Штраф за большие файлы
    if (avgSize > 20000)
      score -= 30; // > 20KB
    else if (avgSize > 10000) score -= 15; // > 10KB

    // Штраф за неравномерность размеров
    const sizes = files.map(f => f.size);
    const variance = MetricsCalculator.calculateVariance(sizes);
    const coefficient = Math.sqrt(variance) / avgSize;
    if (coefficient > 2) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Вычисляет архитектурные метрики
   */
  private static calculateArchitectureMetrics(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): ArchitectureMetrics {
    const totalFiles = files.length;

    // Количество обнаруженных паттернов
    const patterns_detected = MetricsCalculator.detectArchitecturalPatterns(files, categories);

    // Разделение ответственности (Separation of Concerns)
    const separation_of_concerns = MetricsCalculator.calculateSeparationOfConcerns(
      categories,
      totalFiles
    );

    // Управление зависимостями
    const dependency_management = MetricsCalculator.calculateDependencyManagement(files);

    // Соответствие слоям
    const layer_compliance = MetricsCalculator.calculateLayerCompliance(files);

    // Сплоченность кода
    const cohesion_score = MetricsCalculator.calculateCohesionScore(files, categories);

    // Общий архитектурный счет
    const score = Math.round(
      separation_of_concerns * 0.3 +
        dependency_management * 0.25 +
        layer_compliance * 0.25 +
        cohesion_score * 0.2
    );

    return {
      score,
      patterns_detected,
      separation_of_concerns,
      dependency_management,
      layer_compliance,
      cohesion_score,
    };
  }

  /**
   * Определяет количество архитектурных паттернов
   */
  private static detectArchitecturalPatterns(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): number {
    let patterns = 0;

    // MVC/MVP паттерн
    const hasModels = categories.get('core')?.count || 0 > 0;
    const hasViews = categories.get('components')?.count || 0 > 0;
    const hasControllers = categories.get('services')?.count || 0 > 0;
    if (hasModels && hasViews && hasControllers) patterns++;

    // Модульная архитектура
    const moduleCount = Array.from(categories.values()).filter(c => c.count > 3).length;
    if (moduleCount >= 3) patterns++;

    // Service Layer
    if ((categories.get('services')?.count || 0) >= 2) patterns++;

    // Repository паттерн
    const hasRepositories = files.some(f => f.relativePath.toLowerCase().includes('repository'));
    if (hasRepositories) patterns++;

    return patterns;
  }

  /**
   * Вычисляет разделение ответственности
   */
  private static calculateSeparationOfConcerns(
    categories: Map<string, FileCategory>,
    totalFiles: number
  ): number {
    const coreFiles = categories.get('core')?.count || 0;
    const coreRatio = coreFiles / totalFiles;

    // Хорошее разделение = меньше файлов в core, больше в специализированных категориях
    let score = 100;

    if (coreRatio > 0.8)
      score -= 40; // Слишком много в core
    else if (coreRatio > 0.6) score -= 25;
    else if (coreRatio > 0.4) score -= 10;

    // Бонус за наличие специализированных категорий
    const specializedCategories = ['components', 'services', 'utils', 'features'].filter(
      cat => (categories.get(cat)?.count || 0) > 0
    ).length;

    score += specializedCategories * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Вычисляет качество управления зависимостями
   */
  private static calculateDependencyManagement(files: ScannedFile[]): number {
    // Анализ на основе структуры директорий
    const directories = new Set(files.map(f => f.relativePath.split('/')[0]));

    let score = 80; // Базовая оценка

    // Бонус за модульную структуру
    if (directories.size >= 5) score += 10;
    if (directories.size >= 10) score += 5;

    // Штраф за слишком плоскую структуру
    const flatFiles = files.filter(f => f.depth <= 1).length;
    const flatRatio = flatFiles / files.length;
    if (flatRatio > 0.5) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Вычисляет соответствие слоистой архитектуре
   */
  private static calculateLayerCompliance(files: ScannedFile[]): number {
    const layers = ['presentation', 'business', 'data', 'infrastructure'];
    const detectedLayers = layers.filter(layer =>
      files.some(f => f.relativePath.toLowerCase().includes(layer))
    );

    let score = 60; // Базовая оценка
    score += detectedLayers.length * 10; // Бонус за каждый слой

    return Math.min(100, score);
  }

  /**
   * Вычисляет сплоченность кода
   */
  private static calculateCohesionScore(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): number {
    // Анализ распределения файлов по категориям
    const categoryScores = Array.from(categories.values()).map(c => c.quality);
    const avgCategoryQuality =
      categoryScores.reduce((sum, q) => sum + q, 0) / categoryScores.length;

    return Math.round(avgCategoryQuality);
  }

  /**
   * Вычисляет метрики модульности
   */
  private static calculateModularityMetrics(files: ScannedFile[]): ModularityMetrics {
    // Группируем файлы по модулям (директориям верхнего уровня)
    const modules = new Map<string, ScannedFile[]>();

    for (const file of files) {
      const module = file.relativePath.split('/')[0] || 'root';
      const existing = modules.get(module) || [];
      existing.push(file);
      modules.set(module, existing);
    }

    const module_count = modules.size;
    const moduleSizes = Array.from(modules.values()).map(m => m.length);
    const average_module_size = moduleSizes.reduce((sum, size) => sum + size, 0) / module_count;
    const size_variance = MetricsCalculator.calculateVariance(moduleSizes);

    // Фактор связанности (упрощенная оценка)
    const coupling_factor = MetricsCalculator.calculateCouplingFactor(modules);

    // Оценка переиспользования
    const reusability_score = MetricsCalculator.calculateReusabilityScore(files);

    // Общая оценка модульности
    const score = Math.round(
      (100 - Math.min(50, size_variance)) * 0.4 +
        (100 - coupling_factor * 100) * 0.3 +
        reusability_score * 0.3
    );

    return {
      score,
      module_count,
      average_module_size,
      size_variance,
      coupling_factor,
      reusability_score,
    };
  }

  /**
   * Вычисляет фактор связанности между модулями
   */
  private static calculateCouplingFactor(modules: Map<string, ScannedFile[]>): number {
    // Упрощенная оценка на основе количества модулей и их размеров
    const moduleCount = modules.size;
    if (moduleCount <= 1) return 1.0;

    const sizes = Array.from(modules.values()).map(m => m.length);
    const maxSize = Math.max(...sizes);
    const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;

    // Высокая связанность = большой разброс в размерах модулей
    const sizeRatio = maxSize / avgSize;
    return Math.min(1.0, sizeRatio / 10);
  }

  /**
   * Вычисляет оценку переиспользования
   */
  private static calculateReusabilityScore(files: ScannedFile[]): number {
    // Ищем потенциально переиспользуемые компоненты
    const utilFiles = files.filter(
      f =>
        f.relativePath.toLowerCase().includes('util') ||
        f.relativePath.toLowerCase().includes('helper') ||
        f.relativePath.toLowerCase().includes('common')
    );

    const componentFiles = files.filter(f => f.relativePath.toLowerCase().includes('component'));

    const reusableRatio = (utilFiles.length + componentFiles.length) / files.length;
    return Math.round(Math.min(100, reusableRatio * 200));
  }

  /**
   * Вычисляет метрики поддерживаемости
   */
  private static calculateMaintainabilityMetrics(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): MaintainabilityMetrics {
    const totalFiles = files.length;

    // Индикатор покрытия тестами
    const testFiles = categories.get('tests')?.count || 0;
    const test_coverage_indicator = Math.min(100, (testFiles / totalFiles) * 200);

    // Соотношение документации
    const docFiles = categories.get('docs')?.count || 0;
    const documentation_ratio = Math.min(100, (docFiles / totalFiles) * 500);

    // Риск дублирования кода
    const code_duplication_risk = MetricsCalculator.calculateDuplicationRisk(files);

    // Распределение размеров файлов
    const file_size_distribution = MetricsCalculator.calculateFileSizeDistribution(files);

    // Распределение сложности
    const complexity_distribution = MetricsCalculator.calculateComplexityDistribution(files);

    // Общая оценка поддерживаемости
    const score = Math.round(
      test_coverage_indicator * 0.25 +
        documentation_ratio * 0.15 +
        (100 - code_duplication_risk) * 0.2 +
        file_size_distribution * 0.2 +
        complexity_distribution * 0.2
    );

    return {
      score,
      test_coverage_indicator,
      documentation_ratio,
      code_duplication_risk,
      file_size_distribution,
      complexity_distribution,
    };
  }

  /**
   * Вычисляет риск дублирования кода
   */
  private static calculateDuplicationRisk(files: ScannedFile[]): number {
    // Анализ на основе похожих имен файлов и размеров
    const sizeGroups = new Map<number, number>();

    for (const file of files) {
      const sizeRange = Math.floor(file.size / 1000) * 1000; // Группируем по 1KB
      sizeGroups.set(sizeRange, (sizeGroups.get(sizeRange) || 0) + 1);
    }

    // Высокий риск если много файлов одинакового размера
    const duplicatePotential = Array.from(sizeGroups.values()).filter(count => count > 3).length;
    return Math.min(100, duplicatePotential * 15);
  }

  /**
   * Оценивает распределение размеров файлов
   */
  private static calculateFileSizeDistribution(files: ScannedFile[]): number {
    const sizes = files.map(f => f.size);
    const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
    const variance = MetricsCalculator.calculateVariance(sizes);
    const coefficient = Math.sqrt(variance) / avgSize;

    // Хорошее распределение = низкий коэффициент вариации
    return Math.max(0, 100 - coefficient * 20);
  }

  /**
   * Оценивает распределение сложности
   */
  private static calculateComplexityDistribution(files: ScannedFile[]): number {
    const depths = files.map(f => f.depth);
    const maxDepth = Math.max(...depths);
    const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;

    // Хорошее распределение = не слишком глубокая вложенность
    let score = 100;
    if (maxDepth > 8) score -= 30;
    else if (maxDepth > 6) score -= 15;

    if (avgDepth > 4) score -= 20;
    else if (avgDepth > 3) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Вычисляет метрики сложности
   */
  private static calculateComplexityMetrics(files: ScannedFile[]): ComplexityMetrics {
    const depths = files.map(f => f.depth);
    const average_depth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
    const max_depth = Math.max(...depths);

    // Распределение по директориям
    const directories = new Set(files.map(f => f.relativePath.split('/').slice(0, -1).join('/')));
    const directory_spread = directories.size;

    // Сложность по количеству файлов
    const file_count_complexity = Math.max(0, 100 - Math.floor(files.length / 100) * 10);

    // Консистентность именования
    const naming_consistency = MetricsCalculator.calculateNamingConsistency(files);

    // Общая оценка сложности (инвертированная - чем меньше сложность, тем выше оценка)
    const score = Math.round(
      file_count_complexity * 0.3 +
        naming_consistency * 0.3 +
        Math.max(0, 100 - average_depth * 15) * 0.25 +
        Math.max(0, 100 - max_depth * 10) * 0.15
    );

    return {
      score,
      average_depth,
      max_depth,
      directory_spread,
      file_count_complexity,
      naming_consistency,
    };
  }

  /**
   * Оценивает консистентность именования
   */
  private static calculateNamingConsistency(files: ScannedFile[]): number {
    // Анализ паттернов именования
    const extensions = new Set(files.map(f => f.extension));
    const namingPatterns = new Map<string, number>();

    for (const file of files) {
      const name = file.relativePath.split('/').pop() || '';
      const pattern = MetricsCalculator.extractNamingPattern(name);
      namingPatterns.set(pattern, (namingPatterns.get(pattern) || 0) + 1);
    }

    // Высокая консистентность = доминирует один паттерн
    const totalFiles = files.length;
    const dominantPattern = Math.max(...Array.from(namingPatterns.values()));
    const consistency = dominantPattern / totalFiles;

    return Math.round(consistency * 100);
  }

  /**
   * Извлекает паттерн именования из имени файла
   */
  private static extractNamingPattern(filename: string): string {
    if (filename.includes('-')) return 'kebab-case';
    if (filename.includes('_')) return 'snake_case';
    if (/[A-Z]/.test(filename)) return 'camelCase';
    return 'lowercase';
  }

  /**
   * Вычисляет метрики технического долга
   */
  private static calculateTechnicalDebtMetrics(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): TechnicalDebtMetrics {
    // Штраф за большие файлы
    const largeFiles = files.filter(f => f.size > 15000);
    const large_files_penalty = Math.min(50, largeFiles.length * 5);

    // Штраф за глубокую вложенность
    const deepFiles = files.filter(f => f.depth > 6);
    const deep_nesting_penalty = Math.min(30, deepFiles.length * 3);

    // Штраф за плохую структуру
    const poor_structure_penalty = MetricsCalculator.calculateStructurePenalty(categories);

    // Оценка часов на поддержку
    const maintenance_hours_estimate = MetricsCalculator.estimateMaintenanceHours(
      files,
      categories
    );

    // Приоритет рефакторинга
    const refactoring_priority = MetricsCalculator.determineRefactoringPriority(
      large_files_penalty,
      deep_nesting_penalty,
      poor_structure_penalty
    );

    // Общая оценка (100 = нет технического долга)
    const totalPenalty = large_files_penalty + deep_nesting_penalty + poor_structure_penalty;
    const score = Math.max(0, 100 - totalPenalty);

    return {
      score,
      large_files_penalty,
      deep_nesting_penalty,
      poor_structure_penalty,
      maintenance_hours_estimate,
      refactoring_priority,
    };
  }

  /**
   * Вычисляет штраф за плохую структуру
   */
  private static calculateStructurePenalty(categories: Map<string, FileCategory>): number {
    let penalty = 0;

    const totalFiles = Array.from(categories.values()).reduce((sum, c) => sum + c.count, 0);
    const coreFiles = categories.get('core')?.count || 0;
    const testFiles = categories.get('tests')?.count || 0;

    // Штраф за отсутствие тестов
    const testRatio = testFiles / totalFiles;
    if (testRatio < 0.1) penalty += 20;
    else if (testRatio < 0.2) penalty += 10;

    // Штраф за слишком много файлов в core
    const coreRatio = coreFiles / totalFiles;
    if (coreRatio > 0.7) penalty += 15;
    else if (coreRatio > 0.5) penalty += 8;

    return penalty;
  }

  /**
   * Оценивает часы на поддержку
   */
  private static estimateMaintenanceHours(
    files: ScannedFile[],
    categories: Map<string, FileCategory>
  ): number {
    const totalFiles = files.length;
    const largeFiles = files.filter(f => f.size > 10000).length;
    const testFiles = categories.get('tests')?.count || 0;

    // Базовая оценка: 0.5 часа на файл
    let hours = totalFiles * 0.5;

    // Дополнительное время для больших файлов
    hours += largeFiles * 1.5;

    // Снижение времени при хорошем покрытии тестами
    const testRatio = testFiles / totalFiles;
    if (testRatio > 0.3) hours *= 0.8;
    else if (testRatio > 0.2) hours *= 0.9;

    return Math.round(hours);
  }

  /**
   * Определяет приоритет рефакторинга
   */
  private static determineRefactoringPriority(
    largePenalty: number,
    nestingPenalty: number,
    structurePenalty: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const totalPenalty = largePenalty + nestingPenalty + structurePenalty;

    if (totalPenalty >= 70) return 'critical';
    if (totalPenalty >= 50) return 'high';
    if (totalPenalty >= 25) return 'medium';
    return 'low';
  }

  /**
   * Вычисляет дисперсию массива чисел
   */
  private static calculateVariance(numbers: number[]): number {
    if (numbers.length <= 1) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

export default MetricsCalculator;
