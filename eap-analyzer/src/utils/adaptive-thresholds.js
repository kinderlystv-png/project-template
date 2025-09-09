/**
 * Конфигурация с адаптивными порогами для анализатора структуры
 */
const fs = require('fs');
const path = require('path');
const { readFileWithEncoding } = require('./file-utils');
const { handleConfigError, handleFileError } = require('./error-handler');

// Базовые пороги по умолчанию
const DEFAULT_THRESHOLDS = {
  fileSize: 300,
  complexity: 15,
  nesting: 4,
  duplication: 10,
  maintainabilityIndex: 65,
  linesPerFunction: 50,
  parametersPerFunction: 7,
  classesPerFile: 3,
};

// Пороги по типам проектов (на основе анализа отчетов)
const PROJECT_TYPE_THRESHOLDS = {
  react: {
    fileSize: 400, // React компоненты часто больше
    complexity: 45, // На основе медианы из отчета (41)
    nesting: 5, // Больше из-за JSX структуры
    linesPerFunction: 60,
    classesPerFile: 2, // Обычно один компонент на файл
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
const PROJECT_SIZE_MULTIPLIERS = {
  small: { files: [1, 50], multiplier: 0.8 }, // Маленькие проекты - строже
  medium: { files: [51, 200], multiplier: 1.0 }, // Средние проекты - базовые пороги
  large: { files: [201, 500], multiplier: 1.2 }, // Большие проекты - мягче
  huge: { files: [501, Infinity], multiplier: 1.4 }, // Огромные проекты - еще мягче
};

/**
 * Определяет тип проекта по файловой структуре и зависимостям
 * @param {string} projectRoot Корневая директория проекта
 * @returns {string} Тип проекта ('react', 'node', etc.) или 'default'
 */
function detectProjectType(projectRoot) {
  try {
    const projectTypes = [];

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
    console.error(`⚠️ Ошибка при определении типа проекта: ${error.message}`);
  }

  return 'default';
}

/**
 * Определяет размер проекта по количеству файлов
 * @param {number} fileCount Количество файлов в проекте
 * @returns {string} Размер проекта: 'small', 'medium', 'large', 'huge'
 */
function getProjectSize(fileCount) {
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
 * @param {string} reportContent Содержимое отчета
 * @returns {Object} Извлеченные метрики
 */
function parseReportMetrics(reportContent) {
  const metrics = {};

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
    console.error(`⚠️ Ошибка при парсинге метрик отчета: ${error.message}`);
  }

  return metrics;
}

/**
 * Вычисляет адаптивные пороги на основе отчета анализа
 * @param {Object} reportMetrics Метрики из предыдущего отчета
 * @param {Object} baseThresholds Базовые пороги
 * @returns {Object} Обновленные пороги для проекта
 */
function calculateAdaptiveThresholds(reportMetrics, baseThresholds) {
  const adaptiveThresholds = { ...baseThresholds };

  // Адаптация порога сложности
  if (reportMetrics.complexityMedian) {
    // Устанавливаем порог на 110% от медианы, но не менее базового и не более чем в 3 раза выше
    const suggestedComplexity = Math.ceil(reportMetrics.complexityMedian * 1.1);
    adaptiveThresholds.complexity = Math.max(
      baseThresholds.complexity,
      Math.min(suggestedComplexity, baseThresholds.complexity * 3)
    );
  }

  // Адаптация порога размера файла
  if (reportMetrics.fileSizeP75) {
    // Устанавливаем порог на 120% от 75-го процентиля
    const suggestedFileSize = Math.ceil(reportMetrics.fileSizeP75 * 1.2);
    adaptiveThresholds.fileSize = Math.max(
      baseThresholds.fileSize,
      Math.min(suggestedFileSize, baseThresholds.fileSize * 2)
    );
  }

  // Адаптация порога дублирования
  if (reportMetrics.duplicationPercent) {
    // Если дублирование высокое, ужесточаем порог
    if (reportMetrics.duplicationPercent > 50) {
      adaptiveThresholds.duplication = Math.max(5, baseThresholds.duplication * 0.7);
    } else if (reportMetrics.duplicationPercent < 5) {
      // Если дублирование низкое, можем ослабить порог
      adaptiveThresholds.duplication = baseThresholds.duplication * 1.5;
    }
  }

  // Адаптация на основе процента файлов, требующих рефакторинга
  if (reportMetrics.refactoringPercent) {
    const refactoringFactor = Math.min(2.0, reportMetrics.refactoringPercent / 50);

    // Если много файлов требует рефакторинга, ужесточаем все пороги
    if (reportMetrics.refactoringPercent > 70) {
      Object.keys(adaptiveThresholds).forEach(key => {
        if (typeof adaptiveThresholds[key] === 'number') {
          adaptiveThresholds[key] = Math.ceil(adaptiveThresholds[key] * 0.8);
        }
      });
    }
  }

  return adaptiveThresholds;
}

/**
 * Получает оптимальные пороги для текущего проекта
 * @param {string} projectRoot Корневая директория проекта
 * @param {Object} previousReport Предыдущий отчет анализа (опционально)
 * @param {number} fileCount Количество файлов в проекте (опционально)
 * @returns {Object} Оптимизированные пороги для проекта
 */
function getProjectThresholds(projectRoot, previousReport = null, fileCount = 0) {
  try {
    // Определяем тип проекта
    const projectType = detectProjectType(projectRoot);
    console.log(`📋 Тип проекта: ${projectType}`);

    // Базовые пороги для данного типа проекта
    const typeThresholds = PROJECT_TYPE_THRESHOLDS[projectType] || {};
    const baseThresholds = { ...DEFAULT_THRESHOLDS, ...typeThresholds };

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
        if (typeof adjustedThresholds[key] === 'number') {
          adjustedThresholds[key] = Math.ceil(adjustedThresholds[key] * multiplier);
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
 * Загружает предыдущий отчет анализа, если он существует
 * @param {string} projectRoot Корневая директория проекта
 * @returns {string|null} Содержимое предыдущего отчета или null
 */
function loadPreviousReport(projectRoot) {
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
 * @param {Object} thresholds Пороги для сохранения
 * @param {string} projectRoot Корневая директория проекта
 */
function saveThresholds(thresholds, projectRoot) {
  try {
    const thresholdsPath = path.join(projectRoot, '.eap-thresholds.json');
    const data = {
      timestamp: new Date().toISOString(),
      projectType: detectProjectType(projectRoot),
      thresholds: thresholds,
    };

    fs.writeFileSync(thresholdsPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Пороги сохранены в: ${thresholdsPath}`);
  } catch (error) {
    console.warn(`⚠️ Не удалось сохранить пороги: ${error.message}`);
  }
}

/**
 * Загружает сохраненные пороги из файла
 * @param {string} projectRoot Корневая директория проекта
 * @returns {Object|null} Загруженные пороги или null
 */
function loadSavedThresholds(projectRoot) {
  try {
    const thresholdsPath = path.join(projectRoot, '.eap-thresholds.json');
    if (fs.existsSync(thresholdsPath)) {
      const content = readFileWithEncoding(thresholdsPath);
      const data = JSON.parse(content);

      // Проверяем, не устарели ли сохраненные пороги (старше 30 дней)
      const savedDate = new Date(data.timestamp);
      const now = new Date();
      const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);

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
    console.warn(`⚠️ Не удалось загрузить сохраненные пороги: ${error.message}`);
  }

  return null;
}

module.exports = {
  DEFAULT_THRESHOLDS,
  PROJECT_TYPE_THRESHOLDS,
  PROJECT_SIZE_MULTIPLIERS,
  detectProjectType,
  getProjectSize,
  parseReportMetrics,
  calculateAdaptiveThresholds,
  getProjectThresholds,
  loadPreviousReport,
  saveThresholds,
  loadSavedThresholds,
};
