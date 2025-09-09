/**
 * Расширенный анализатор структуры проекта
 * Адаптированная версия advanced-project-analyzer.js для интеграции с ЭАП
 */

import fs from 'fs';
import path from 'path';
import basicAnalyzer from './basic-analyzer.js';

/**
 * Выполняет расширенный анализ структуры проекта
 */
async function analyze(projectRoot, config) {
  console.log('[AdvancedAnalyzer] Начало расширенного анализа...');

  // Собираем файлы для анализа
  const files = await basicAnalyzer.collectFiles(projectRoot, config);

  const results = {
    totalFiles: files.length,
    complexityData: [],
    duplicationData: null,
    architecturalMetrics: {},
    hotspots: [],
    avgMaintainabilityIndex: 0,
    duplicationPercentage: 0,
    cohesion: 0,
    coupling: 0,
    filesByDirectory: {},
  };

  // 1. Анализ сложности каждого файла
  console.log('[AdvancedAnalyzer] Анализ сложности кода...');
  for (const file of files) {
    try {
      const fullPath = path.join(projectRoot, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const fileAnalysis = analyzeFileComplexity(file, content, config);
      results.complexityData.push(fileAnalysis);

      // Группировка по директориям
      const dir = path.dirname(file);
      if (!results.filesByDirectory[dir]) {
        results.filesByDirectory[dir] = { files: [], avgComplexity: 0, totalLines: 0 };
      }
      results.filesByDirectory[dir].files.push(fileAnalysis);
      results.filesByDirectory[dir].totalLines += fileAnalysis.linesOfCode;
    } catch (error) {
      console.error(`[AdvancedAnalyzer] Ошибка при анализе файла ${file}:`, error.message);
    }
  }

  // Вычисляем средние значения по директориям
  for (const dir in results.filesByDirectory) {
    const dirData = results.filesByDirectory[dir];
    if (dirData.files.length > 0) {
      dirData.avgComplexity =
        dirData.files.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) / dirData.files.length;
    }
  }

  // 2. Анализ дублирования кода
  console.log('[AdvancedAnalyzer] Анализ дублирования кода...');
  results.duplicationData = analyzeDuplication(files, projectRoot);
  results.duplicationPercentage = results.duplicationData?.percentage || 0;

  // 3. Архитектурные метрики
  console.log('[AdvancedAnalyzer] Расчет архитектурных метрик...');
  results.architecturalMetrics = calculateArchitecturalMetrics(results, files, projectRoot);
  results.cohesion = results.architecturalMetrics.cohesion || 0;
  results.coupling = results.architecturalMetrics.coupling || 0;

  // 4. Поиск проблемных файлов (hotspots)
  console.log('[AdvancedAnalyzer] Поиск проблемных файлов...');
  results.hotspots = findHotspots(results, projectRoot);

  // 5. Средний индекс сопровождаемости
  if (results.complexityData.length > 0) {
    results.avgMaintainabilityIndex =
      results.complexityData.reduce((sum, f) => sum + f.maintainabilityIndex, 0) /
      results.complexityData.length;
  }

  console.log('[AdvancedAnalyzer] Расширенный анализ завершен');
  return results;
}

/**
 * Анализирует сложность отдельного файла
 */
function analyzeFileComplexity(filePath, content, config) {
  const lines = content.split('\n');
  const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

  // Цикломатическая сложность
  const cyclomaticComplexity = calculateCyclomaticComplexity(content);

  // Когнитивная сложность
  const cognitiveComplexity = calculateCognitiveComplexity(content);

  // Индекс сопровождаемости
  const maintainabilityIndex = calculateMaintainabilityIndex(
    linesOfCode,
    cyclomaticComplexity,
    content
  );

  // Глубина вложенности
  const maxNestingDepth = calculateMaxNestingDepth(content);

  // Количество функций
  const functionCount = (content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length;

  // Определяем необходимость рефакторинга
  const needsRefactoring =
    linesOfCode > config.thresholds.maxFileSize ||
    cyclomaticComplexity > config.thresholds.maxComplexity ||
    maintainabilityIndex < config.thresholds.minMaintainability ||
    maxNestingDepth > config.thresholds.maxNestingDepth;

  return {
    path: filePath,
    linesOfCode,
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex,
    maxNestingDepth,
    functionCount,
    needsRefactoring,
    refactoringReasons: getRefactoringReasons(
      linesOfCode,
      cyclomaticComplexity,
      maintainabilityIndex,
      maxNestingDepth,
      config
    ),
  };
}

/**
 * Вычисляет цикломатическую сложность
 */
function calculateCyclomaticComplexity(content) {
  const patterns = [
    /if\s*\(/g,
    /else\s*if\s*\(/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /do\s*{/g,
    /switch\s*\(/g,
    /case\s+[^:]+:/g,
    /catch\s*\(/g,
    /\?\s*[^:]+:/g, // тернарный оператор
    /&&/g,
    /\|\|/g,
  ];

  let complexity = 1; // базовая сложность

  for (const pattern of patterns) {
    const matches = content.match(pattern) || [];
    complexity += matches.length;
  }

  return complexity;
}

/**
 * Вычисляет когнитивную сложность
 */
function calculateCognitiveComplexity(content) {
  let complexity = 0;
  let nestingLevel = 0;
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Увеличиваем уровень вложенности
    if (trimmed.includes('{')) {
      nestingLevel++;
    }

    // Уменьшаем уровень вложенности
    if (trimmed.includes('}')) {
      nestingLevel = Math.max(0, nestingLevel - 1);
    }

    // Добавляем сложность для различных конструкций
    if (/if\s*\(/.test(trimmed)) {
      complexity += 1 + nestingLevel;
    }
    if (/else/.test(trimmed)) {
      complexity += 1;
    }
    if (/for\s*\(|while\s*\(/.test(trimmed)) {
      complexity += 1 + nestingLevel;
    }
    if (/switch\s*\(/.test(trimmed)) {
      complexity += 1 + nestingLevel;
    }
    if (/case\s+[^:]+:/.test(trimmed)) {
      complexity += 1;
    }
    if (/catch\s*\(/.test(trimmed)) {
      complexity += 1 + nestingLevel;
    }
  }

  return complexity;
}

/**
 * Вычисляет индекс сопровождаемости
 */
function calculateMaintainabilityIndex(linesOfCode, cyclomaticComplexity, content) {
  // Упрощенная формула индекса сопровождаемости
  const halsteadVolume = Math.log2(linesOfCode) * linesOfCode; // упрощенный объем Halstead
  const commentRatio = getCommentRatio(content);

  let maintainabilityIndex =
    171 -
    5.2 * Math.log(halsteadVolume) -
    0.23 * cyclomaticComplexity -
    16.2 * Math.log(linesOfCode);

  // Бонус за комментарии
  maintainabilityIndex += commentRatio * 10;

  return Math.max(0, Math.min(100, maintainabilityIndex));
}

/**
 * Вычисляет максимальную глубину вложенности
 */
function calculateMaxNestingDepth(content) {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of content) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  return maxDepth;
}

/**
 * Получает коэффициент комментариев
 */
function getCommentRatio(content) {
  const lines = content.split('\n');
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }).length;

  return lines.length === 0 ? 0 : commentLines / lines.length;
}

/**
 * Получает причины для рефакторинга
 */
function getRefactoringReasons(
  linesOfCode,
  cyclomaticComplexity,
  maintainabilityIndex,
  maxNestingDepth,
  config
) {
  const reasons = [];

  if (linesOfCode > config.thresholds.maxFileSize) {
    reasons.push(`Large file (${linesOfCode} lines)`);
  }
  if (cyclomaticComplexity > config.thresholds.maxComplexity) {
    reasons.push(`High complexity (${cyclomaticComplexity})`);
  }
  if (maintainabilityIndex < config.thresholds.minMaintainability) {
    reasons.push(`Low maintainability (${maintainabilityIndex.toFixed(1)})`);
  }
  if (maxNestingDepth > config.thresholds.maxNestingDepth) {
    reasons.push(`Deep nesting (${maxNestingDepth} levels)`);
  }

  return reasons;
}

/**
 * Анализирует дублирование кода (упрощенная версия)
 */
function analyzeDuplication(files, projectRoot) {
  try {
    // Упрощенный анализ дублирования на основе хэшей строк кода
    const codeHashes = new Map();
    let totalLines = 0;
    let duplicatedLines = 0;

    for (const file of files) {
      try {
        const fullPath = path.join(projectRoot, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('//') && !line.startsWith('/*'));

        totalLines += lines.length;

        for (const line of lines) {
          if (line.length > 20) {
            // Игнорируем короткие строки
            const hash = hashCode(line);
            if (codeHashes.has(hash)) {
              duplicatedLines++;
            } else {
              codeHashes.set(hash, file);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения файлов
      }
    }

    const percentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

    return {
      percentage,
      duplicatedLines,
      totalLines,
      files: Array.from(codeHashes.values()),
    };
  } catch (error) {
    console.error('[AdvancedAnalyzer] Ошибка при анализе дублирования:', error.message);
    return {
      percentage: 0,
      duplicatedLines: 0,
      totalLines: 0,
      files: [],
    };
  }
}

/**
 * Простая хэш-функция для строк
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Конвертируем в 32-битное целое
  }
  return hash;
}

/**
 * Вычисляет архитектурные метрики
 */
function calculateArchitecturalMetrics(results, files, projectRoot) {
  try {
    // Упрощенные архитектурные метрики
    const modules = results.filesByDirectory;
    const totalModules = Object.keys(modules).length;

    if (totalModules === 0) {
      return { cohesion: 0, coupling: 0, totalDependencies: 0 };
    }

    // Связность (cohesion) - насколько функции в модуле связаны между собой
    let totalCohesion = 0;
    for (const [dir, moduleData] of Object.entries(modules)) {
      const files = moduleData.files;
      if (files.length > 1) {
        // Упрощенная оценка связности на основе схожести имен функций и переменных
        const cohesion = calculateModuleCohesion(files);
        totalCohesion += cohesion;
      } else {
        totalCohesion += 0.8; // Один файл в модуле считается связным
      }
    }
    const avgCohesion = totalCohesion / totalModules;

    // Связанность (coupling) - зависимости между модулями
    const coupling = calculateModuleCoupling(modules, projectRoot);

    return {
      cohesion: Math.min(1, Math.max(0, avgCohesion)),
      coupling: Math.min(1, Math.max(0, coupling)),
      totalDependencies: files.length * 2, // Упрощенная оценка
    };
  } catch (error) {
    console.error('[AdvancedAnalyzer] Ошибка при расчете архитектурных метрик:', error.message);
    return { cohesion: 0, coupling: 0, totalDependencies: 0 };
  }
}

/**
 * Вычисляет связность модуля
 */
function calculateModuleCohesion(files) {
  // Упрощенная оценка связности на основе схожести в именовании
  if (files.length < 2) return 0.8;

  let similarityScore = 0;
  let comparisons = 0;

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const file1 = path.basename(files[i].path, path.extname(files[i].path));
      const file2 = path.basename(files[j].path, path.extname(files[j].path));

      // Проверяем схожесть имен файлов
      const similarity = calculateStringSimilarity(file1, file2);
      similarityScore += similarity;
      comparisons++;
    }
  }

  return comparisons > 0 ? similarityScore / comparisons : 0.5;
}

/**
 * Вычисляет связанность между модулями
 */
function calculateModuleCoupling(modules, projectRoot) {
  // Упрощенная оценка связанности
  const moduleNames = Object.keys(modules);
  if (moduleNames.length < 2) return 0;

  let crossModuleReferences = 0;
  let totalPossibleReferences = 0;

  for (const [moduleName, moduleData] of Object.entries(modules)) {
    for (const file of moduleData.files) {
      // Проверяем, ссылается ли файл на другие модули
      for (const otherModule of moduleNames) {
        if (otherModule !== moduleName) {
          // Упрощенная проверка - есть ли импорты из других модулей
          if (file.path.includes('import') || file.path.includes('require')) {
            crossModuleReferences++;
          }
          totalPossibleReferences++;
        }
      }
    }
  }

  return totalPossibleReferences > 0 ? crossModuleReferences / totalPossibleReferences : 0;
}

/**
 * Вычисляет схожесть строк
 */
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = calculateEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Вычисляет расстояние редактирования (Левенштейна)
 */
function calculateEditDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Находит проблемные файлы (hotspots)
 */
function findHotspots(results, projectRoot) {
  try {
    const hotspots = [];

    for (const file of results.complexityData) {
      let hotspotScore = 0;
      const issues = [];

      // Высокая сложность
      if (file.cyclomaticComplexity > 20) {
        hotspotScore += file.cyclomaticComplexity * 2;
        issues.push(`Very high complexity (${file.cyclomaticComplexity})`);
      }

      // Большой размер файла
      if (file.linesOfCode > 500) {
        hotspotScore += file.linesOfCode / 50;
        issues.push(`Very large file (${file.linesOfCode} lines)`);
      }

      // Низкая сопровождаемость
      if (file.maintainabilityIndex < 50) {
        hotspotScore += (50 - file.maintainabilityIndex) * 2;
        issues.push(`Very low maintainability (${file.maintainabilityIndex.toFixed(1)})`);
      }

      // Глубокая вложенность
      if (file.maxNestingDepth > 6) {
        hotspotScore += file.maxNestingDepth * 5;
        issues.push(`Very deep nesting (${file.maxNestingDepth} levels)`);
      }

      if (hotspotScore > 50) {
        hotspots.push({
          path: file.path,
          score: Math.round(hotspotScore),
          issues,
          priority: hotspotScore > 100 ? 'CRITICAL' : 'HIGH',
          linesOfCode: file.linesOfCode,
          complexity: file.cyclomaticComplexity,
          maintainability: file.maintainabilityIndex,
        });
      }
    }

    // Сортируем по убыванию score
    hotspots.sort((a, b) => b.score - a.score);

    return hotspots.slice(0, 20); // Возвращаем топ 20 hotspots
  } catch (error) {
    console.error('[AdvancedAnalyzer] Ошибка при поиске hotspots:', error.message);
    return [];
  }
}

export default {
  analyze,
  analyzeFileComplexity,
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaintainabilityIndex,
  analyzeDuplication,
  calculateArchitecturalMetrics,
  findHotspots,
};
