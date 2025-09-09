/**
 * Конфигурация с адаптивными порогами (TypeScript версия)
 */
import * as fs from 'fs';
import * as path from 'path';
import { readFileWithEncoding } from './file-utils.js';
import { handleConfigError, handleFileError } from './error-handler.js';

export interface ProjectThresholds {
  fileSize: number;
  complexity: number;
  nesting: number;
  duplication: number;
  maintainabilityIndex: number;
  linesPerFunction: number;
  parametersPerFunction: number;
  classesPerFile: number;
}

export interface ProjectMetrics {
  complexityMedian?: number;
  complexityAvg?: number;
  fileSizeP75?: number;
  duplicationPercent?: number;
  totalFiles?: number;
  refactoringPercent?: number;
}

export interface ProjectSizeConfig {
  files: [number, number];
  multiplier: number;
}

export interface ThresholdData {
  timestamp: string;
  projectType: string;
  thresholds: ProjectThresholds;
}

// Базовые пороги по умолчанию
export const DEFAULT_THRESHOLDS: ProjectThresholds = {
  fileSize: 300,
  complexity: 15,
  nesting: 4,
  duplication: 10,
  maintainabilityIndex: 65,
  linesPerFunction: 50,
  parametersPerFunction: 7,
  classesPerFile: 3,
};

// Пороги по типам проектов
export const PROJECT_TYPE_THRESHOLDS: Record<string, Partial<ProjectThresholds>> = {
  react: {
    fileSize: 400,
    complexity: 45,
    nesting: 5,
    linesPerFunction: 60,
    classesPerFile: 2,
  },
  node: {
    fileSize: 250,
    complexity: 20,
    nesting: 4,
    linesPerFunction: 40,
    classesPerFile: 5,
  },
  svelte: {
    fileSize: 350,
    complexity: 25,
    nesting: 4,
    linesPerFunction: 45,
    classesPerFile: 2,
  },
  angular: {
    fileSize: 450,
    complexity: 35,
    nesting: 5,
    linesPerFunction: 55,
    classesPerFile: 3,
  },
  vue: {
    fileSize: 400,
    complexity: 30,
    nesting: 5,
    linesPerFunction: 50,
    classesPerFile: 2,
  },
  typescript: {
    fileSize: 350,
    complexity: 25,
    nesting: 4,
    linesPerFunction: 45,
    classesPerFile: 4,
  },
};

// Множители для адаптации порогов в зависимости от размера проекта
export const PROJECT_SIZE_MULTIPLIERS: Record<string, ProjectSizeConfig> = {
  small: { files: [1, 50], multiplier: 0.8 },
  medium: { files: [51, 200], multiplier: 1.0 },
  large: { files: [201, 500], multiplier: 1.2 },
  huge: { files: [501, Infinity], multiplier: 1.4 },
};

/**
 * Определяет тип проекта по файловой структуре и зависимостям
 */
export function detectProjectType(projectRoot: string): string {
  try {
    const projectTypes: string[] = [];

    // Проверяем package.json для определения фреймворка
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const content = readFileWithEncoding(packageJsonPath);
      const packageJson = JSON.parse(content);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      // Проверяем зависимости
      if (deps['react'] || deps['next'] || deps['@next/core']) projectTypes.push('react');
      if (deps['svelte'] || deps['@sveltejs/kit']) projectTypes.push('svelte');
      if (deps['@angular/core'] || deps['@angular/cli']) projectTypes.push('angular');
      if (deps['vue'] || deps['@vue/cli']) projectTypes.push('vue');
      if (deps['typescript'] || deps['@types/node']) projectTypes.push('typescript');

      // Проверяем Node.js фреймворки
      if (deps['express'] || deps['koa'] || deps['fastify'] || deps['nestjs']) {
        projectTypes.push('node');
      }
    }

    // Проверяем конфигурационные файлы
    const configFiles = fs.readdirSync(projectRoot);

    if (configFiles.includes('tsconfig.json')) projectTypes.push('typescript');
    if (configFiles.includes('angular.json')) projectTypes.push('angular');
    if (configFiles.includes('vue.config.js')) projectTypes.push('vue');
    if (configFiles.includes('svelte.config.js')) projectTypes.push('svelte');
    if (configFiles.includes('next.config.js')) projectTypes.push('react');

    // Проверяем структуру директорий
    const dirs = fs
      .readdirSync(projectRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    if (dirs.includes('components') && dirs.includes('pages')) projectTypes.push('react');
    if (dirs.includes('routes') && dirs.includes('lib')) projectTypes.push('svelte');
    if (dirs.includes('src') && dirs.includes('app')) projectTypes.push('angular');
    if (dirs.includes('controllers') && dirs.includes('services')) projectTypes.push('node');

    // Возвращаем наиболее специфичный тип
    const priority = ['angular', 'react', 'vue', 'svelte', 'typescript', 'node'];
    for (const type of priority) {
      if (projectTypes.includes(type)) {
        return type;
      }
    }
  } catch (error) {
    console.error(`⚠️ Ошибка при определении типа проекта: ${error}`);
  }

  return 'default';
}

/**
 * Определяет размер проекта по количеству файлов
 */
export function getProjectSize(fileCount: number): string {
  for (const [size, config] of Object.entries(PROJECT_SIZE_MULTIPLIERS)) {
    const [min, max] = config.files;
    if (fileCount >= min && fileCount <= max) {
      return size;
    }
  }
  return 'medium';
}

/**
 * Парсит предыдущий отчет для извлечения статистических данных
 */
export function parseReportMetrics(reportContent: string): ProjectMetrics {
  const metrics: ProjectMetrics = {};

  try {
    // Парсим медиану сложности
    const complexityMedianMatch = reportContent.match(/Медиана:\s*(\d+)/i);
    if (complexityMedianMatch) {
      metrics.complexityMedian = parseInt(complexityMedianMatch[1], 10);
    }

    // Парсим среднюю сложность
    const complexityAvgMatch = reportContent.match(/Средняя сложность:\s*(\d+\.?\d*)/i);
    if (complexityAvgMatch) {
      metrics.complexityAvg = parseFloat(complexityAvgMatch[1]);
    }

    // Парсим 75-й процентиль размера файлов
    const fileSizeP75Match = reportContent.match(/75-й процентиль:\s*(\d+)\s*строк/i);
    if (fileSizeP75Match) {
      metrics.fileSizeP75 = parseInt(fileSizeP75Match[1], 10);
    }

    // Парсим процент дублирования
    const duplicationMatch = reportContent.match(/Дублирование:\s*(\d+\.?\d*)%/i);
    if (duplicationMatch) {
      metrics.duplicationPercent = parseFloat(duplicationMatch[1]);
    }

    // Парсим количество файлов
    const fileCountMatch = reportContent.match(/Всего файлов:\s*(\d+)/i);
    if (fileCountMatch) {
      metrics.totalFiles = parseInt(fileCountMatch[1], 10);
    }

    // Парсим процент файлов, требующих рефакторинга
    const refactoringMatch = reportContent.match(/(\d+\.?\d*)%.*требу[ют|ет].*рефакторинг/i);
    if (refactoringMatch) {
      metrics.refactoringPercent = parseFloat(refactoringMatch[1]);
    }
  } catch (error) {
    console.error(`⚠️ Ошибка при парсинге метрик отчета: ${error}`);
  }

  return metrics;
}

/**
 * Получает оптимальные пороги для текущего проекта
 */
export function getProjectThresholds(
  projectRoot: string,
  previousReport: string | null = null,
  fileCount = 0
): ProjectThresholds {
  try {
    // Определяем тип проекта
    const projectType = detectProjectType(projectRoot);
    console.log(`📋 Тип проекта: ${projectType}`);

    // Базовые пороги для данного типа проекта
    const typeThresholds = PROJECT_TYPE_THRESHOLDS[projectType] || {};
    const baseThresholds: ProjectThresholds = { ...DEFAULT_THRESHOLDS, ...typeThresholds };

    // Корректируем пороги в зависимости от размера проекта
    let adjustedThresholds = { ...baseThresholds };
    if (fileCount > 0) {
      const projectSize = getProjectSize(fileCount);
      const multiplier = PROJECT_SIZE_MULTIPLIERS[projectSize].multiplier;

      console.log(
        `📊 Размер проекта: ${projectSize} (${fileCount} файлов), множитель: ${multiplier}`
      );

      // Применяем множитель к численным порогам
      Object.keys(adjustedThresholds).forEach(key => {
        const value = adjustedThresholds[key as keyof ProjectThresholds];
        if (typeof value === 'number') {
          (adjustedThresholds as any)[key] = Math.ceil(value * multiplier);
        }
      });
    }

    // Если есть предыдущий отчет, адаптируем пороги
    if (previousReport) {
      console.log(`🔍 Найден предыдущий отчет, адаптируем пороги...`);
      const reportMetrics = parseReportMetrics(previousReport);
      adjustedThresholds = calculateAdaptiveThresholds(reportMetrics, adjustedThresholds);
    }

    console.log(`✅ Установлены пороги:`, adjustedThresholds);
    return adjustedThresholds;
  } catch (error) {
    const configError = handleConfigError(error, 'adaptive-thresholds');
    console.error(configError.formatForConsole());
    return DEFAULT_THRESHOLDS;
  }
}

/**
 * Вычисляет адаптивные пороги на основе отчета анализа
 */
function calculateAdaptiveThresholds(
  reportMetrics: ProjectMetrics,
  baseThresholds: ProjectThresholds
): ProjectThresholds {
  const adaptiveThresholds = { ...baseThresholds };

  // Адаптация порога сложности
  if (reportMetrics.complexityMedian) {
    const suggestedComplexity = Math.ceil(reportMetrics.complexityMedian * 1.1);
    adaptiveThresholds.complexity = Math.max(
      baseThresholds.complexity,
      Math.min(suggestedComplexity, baseThresholds.complexity * 3)
    );
  }

  // Адаптация порога размера файла
  if (reportMetrics.fileSizeP75) {
    const suggestedFileSize = Math.ceil(reportMetrics.fileSizeP75 * 1.2);
    adaptiveThresholds.fileSize = Math.max(
      baseThresholds.fileSize,
      Math.min(suggestedFileSize, baseThresholds.fileSize * 2)
    );
  }

  // Адаптация порога дублирования
  if (reportMetrics.duplicationPercent) {
    if (reportMetrics.duplicationPercent > 50) {
      adaptiveThresholds.duplication = Math.max(5, baseThresholds.duplication * 0.7);
    } else if (reportMetrics.duplicationPercent < 5) {
      adaptiveThresholds.duplication = baseThresholds.duplication * 1.5;
    }
  }

  // Адаптация на основе процента файлов, требующих рефакторинга
  if (reportMetrics.refactoringPercent && reportMetrics.refactoringPercent > 70) {
    Object.keys(adaptiveThresholds).forEach(key => {
      const value = adaptiveThresholds[key as keyof ProjectThresholds];
      if (typeof value === 'number') {
        (adaptiveThresholds as any)[key] = Math.ceil(value * 0.8);
      }
    });
  }

  return adaptiveThresholds;
}

/**
 * Загружает предыдущий отчет анализа, если он существует
 */
export function loadPreviousReport(projectRoot: string): string | null {
  const possibleReportPaths = [
    path.join(projectRoot, 'project-analysis-report.md'),
    path.join(projectRoot, 'eap-report.md'),
    path.join(projectRoot, 'analysis-report.md'),
  ];

  for (const reportPath of possibleReportPaths) {
    if (fs.existsSync(reportPath)) {
      try {
        console.log(`📄 Найден предыдущий отчет: ${reportPath}`);
        return readFileWithEncoding(reportPath);
      } catch (error) {
        const fileError = handleFileError(error, reportPath, 'чтении');
        console.warn(fileError.formatForConsole());
      }
    }
  }

  return null;
}

/**
 * Сохраняет текущие пороги в файл для последующего использования
 */
export function saveThresholds(thresholds: ProjectThresholds, projectRoot: string): void {
  try {
    const thresholdsPath = path.join(projectRoot, '.eap-thresholds.json');
    const data: ThresholdData = {
      timestamp: new Date().toISOString(),
      projectType: detectProjectType(projectRoot),
      thresholds: thresholds,
    };

    fs.writeFileSync(thresholdsPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Пороги сохранены в: ${thresholdsPath}`);
  } catch (error) {
    console.warn(`⚠️ Не удалось сохранить пороги: ${error}`);
  }
}

/**
 * Загружает сохраненные пороги из файла
 */
export function loadSavedThresholds(projectRoot: string): ProjectThresholds | null {
  try {
    const thresholdsPath = path.join(projectRoot, '.eap-thresholds.json');
    if (fs.existsSync(thresholdsPath)) {
      const content = readFileWithEncoding(thresholdsPath);
      const data: ThresholdData = JSON.parse(content);

      // Проверяем, не устарели ли сохраненные пороги (старше 30 дней)
      const savedDate = new Date(data.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 30) {
        console.log(`📂 Загружены сохраненные пороги (${Math.floor(daysDiff)} дней назад)`);
        return data.thresholds;
      } else {
        console.log(
          `📅 Сохраненные пороги устарели (${Math.floor(daysDiff)} дней), используем новые`
        );
      }
    }
  } catch (error) {
    console.warn(`⚠️ Не удалось загрузить сохраненные пороги: ${error}`);
  }

  return null;
}
