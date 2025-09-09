/**
 * Базовый анализатор структуры проекта
 * Адаптированная версия project-structure-analyzer.js для интеграции с ЭАП
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

/**
 * Анализирует структуру проекта и выявляет файлы, требующие рефакторинга
 */
async function analyze(projectRoot, config) {
  const stats = {
    totalFiles: 0,
    totalLines: 0,
    largeFiles: 0,
    complexFiles: 0,
    criticalIssues: 0,
    filesByType: {},
    directoryStats: {},
    potentialRefactorFiles: [],
    circularDependencies: [],
    dependencyGraph: {},
    technicalDebt: 0,
    filesNeedingRefactoring: 0,
    refactoringPercentage: 0,
  };

  // Собираем файлы для анализа
  await traverseDirectory(projectRoot, stats, config);

  // Анализируем циклические зависимости
  findCircularDependencies(stats);

  // Вычисляем метрики
  calculateMetrics(stats);

  return stats;
}

/**
 * Обходит директории и анализирует файлы
 */
async function traverseDirectory(dir, stats, config) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!config.excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
          stats.directoryStats[fullPath] = { files: 0, lines: 0, avgComplexity: 0 };
          await traverseDirectory(fullPath, stats, config);
        }
        continue;
      }

      const ext = path.extname(fullPath);
      if (config.fileExtensions.includes(ext)) {
        stats.totalFiles++;
        stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;

        const fileStats = await analyzeFile(fullPath, config);

        // Обновляем общую статистику
        stats.totalLines += fileStats.lines;

        // Обновляем статистику директории
        const dirPath = path.dirname(fullPath);
        if (!stats.directoryStats[dirPath]) {
          stats.directoryStats[dirPath] = { files: 0, lines: 0, avgComplexity: 0 };
        }
        stats.directoryStats[dirPath].files++;
        stats.directoryStats[dirPath].lines += fileStats.lines;
        stats.directoryStats[dirPath].avgComplexity =
          (stats.directoryStats[dirPath].avgComplexity * (stats.directoryStats[dirPath].files - 1) +
            fileStats.complexity) /
          stats.directoryStats[dirPath].files;

        // Обновляем граф зависимостей
        stats.dependencyGraph[fullPath] = fileStats.dependencies;

        // Добавляем в список файлов, требующих рефакторинга
        if (fileStats.needsRefactoring) {
          stats.filesNeedingRefactoring++;
          stats.potentialRefactorFiles.push({
            path: fullPath,
            relativePath: path.relative(process.cwd(), fullPath),
            reasons: fileStats.refactoringReasons,
            lines: fileStats.lines,
            complexity: fileStats.complexity,
            bugFixes: fileStats.bugFixes,
            priority: calculateRefactoringPriority(fileStats),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка при обходе директории ${dir}:`, error.message);
  }
}

/**
 * Анализирует отдельный файл
 */
async function analyzeFile(filePath, config) {
  const fileStats = {
    path: filePath,
    lines: 0,
    complexity: 0,
    dependencies: [],
    modificationFrequency: 0,
    bugFixes: 0,
    needsRefactoring: false,
    refactoringReasons: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    fileStats.lines = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

    // Оценка сложности
    fileStats.complexity = estimateComplexity(content);

    // Проверяем критерии рефакторинга
    if (fileStats.lines > config.thresholds.maxFileSize) {
      fileStats.needsRefactoring = true;
      fileStats.refactoringReasons.push(
        `Large file (${fileStats.lines} lines > ${config.thresholds.maxFileSize})`
      );
    }

    if (fileStats.complexity > config.thresholds.maxComplexity) {
      fileStats.needsRefactoring = true;
      fileStats.refactoringReasons.push(
        `High complexity (${fileStats.complexity} > ${config.thresholds.maxComplexity})`
      );
    }

    // Извлекаем зависимости
    fileStats.dependencies = extractDependencies(content, filePath, config);

    // Анализируем историю Git
    try {
      const { stdout: gitHistory } = await execPromise(
        `git log --follow --format="%H" -- "${filePath}"`,
        { timeout: 5000, cwd: path.dirname(filePath) }
      );
      const commits = gitHistory.trim().split('\n').filter(Boolean);
      fileStats.modificationFrequency = commits.length;

      const { stdout: bugfixCommits } = await execPromise(
        `git log --follow --grep="fix\\|bug\\|issue\\|resolve\\|close" --format="%H" -- "${filePath}"`,
        { timeout: 5000, cwd: path.dirname(filePath) }
      );
      const bugfixes = bugfixCommits.trim().split('\n').filter(Boolean);
      fileStats.bugFixes = bugfixes.length;

      if (bugfixes.length > 5) {
        fileStats.needsRefactoring = true;
        fileStats.refactoringReasons.push(`High number of bug fixes (${bugfixes.length})`);
      }
    } catch (error) {
      // Git недоступен или ошибка - игнорируем
    }

    return fileStats;
  } catch (error) {
    console.error(`Ошибка при анализе файла ${filePath}:`, error.message);
    return fileStats;
  }
}

/**
 * Оценивает цикломатическую сложность кода
 */
function estimateComplexity(content) {
  const patterns = [
    /if\s*\(/g,
    /else\s*if\s*\(/g,
    /else[\s{]/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /do\s*{/g,
    /switch\s*\(/g,
    /case\s+[^:]+:/g,
    /catch\s*\(/g,
    /\?\s*[^:]+:/g, // тернарный оператор
    /&&/g,
    /\|\|/g,
    /function\s+\w+\s*\(/g,
    /=>\s*{/g,
  ];

  let complexity = 1; // базовая сложность

  for (const pattern of patterns) {
    const matches = content.match(pattern) || [];
    complexity += matches.length;
  }

  return complexity;
}

/**
 * Извлекает зависимости из файла
 */
function extractDependencies(content, filePath, config) {
  const dependencies = [];

  // Паттерны для поиска импортов
  const importPatterns = [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(['"]([^'"]+)['"]\)/g,
    /import\s*\(['"]([^'"]+)['"]\)/g,
  ];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const resolvedPath = resolveImportPath(importPath, filePath, config);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
        }
      }
    }
  }

  return [...new Set(dependencies)]; // убираем дубликаты
}

/**
 * Разрешает относительный путь импорта в абсолютный
 */
function resolveImportPath(importPath, filePath, config) {
  try {
    const baseDir = path.dirname(filePath);
    let resolvedPath = path.resolve(baseDir, importPath);

    // Проверяем существование файла с различными расширениями
    if (!fs.existsSync(resolvedPath)) {
      for (const ext of config.fileExtensions) {
        const pathWithExt = resolvedPath + ext;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }

      // Проверяем index файлы
      for (const ext of config.fileExtensions) {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  } catch (error) {
    return null;
  }
}

/**
 * Находит циклические зависимости
 */
function findCircularDependencies(stats) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(file, path = []) {
    if (recursionStack.has(file)) {
      const cycleStart = path.indexOf(file);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart));
      }
      return;
    }

    if (visited.has(file)) {
      return;
    }

    visited.add(file);
    recursionStack.add(file);
    path.push(file);

    const dependencies = stats.dependencyGraph[file] || [];
    for (const dependency of dependencies) {
      dfs(dependency, [...path]);
    }

    recursionStack.delete(file);
  }

  for (const file in stats.dependencyGraph) {
    if (!visited.has(file)) {
      dfs(file);
    }
  }

  stats.circularDependencies = cycles;
}

/**
 * Вычисляет метрики проекта
 */
function calculateMetrics(stats) {
  // Процент файлов, требующих рефакторинга
  stats.refactoringPercentage =
    stats.totalFiles > 0 ? (stats.filesNeedingRefactoring / stats.totalFiles) * 100 : 0;

  // Технический долг (упрощенная оценка в часах)
  stats.technicalDebt = stats.potentialRefactorFiles.reduce((debt, file) => {
    let fileDebt = 0;
    fileDebt += file.lines > 500 ? (file.lines - 500) / 100 : 0; // 1 час на каждые 100 строк сверх 500
    fileDebt += file.complexity > 20 ? (file.complexity - 20) / 5 : 0; // 1 час на каждые 5 единиц сложности сверх 20
    fileDebt += file.bugFixes > 3 ? file.bugFixes - 3 : 0; // 1 час на каждый багфикс сверх 3
    return debt + Math.max(fileDebt, 0.5); // минимум 0.5 часа на файл
  }, 0);

  // Критические проблемы
  stats.criticalIssues = stats.circularDependencies.length;
  stats.criticalIssues += stats.potentialRefactorFiles.filter(
    f => f.lines > 1000 || f.complexity > 50
  ).length;

  // Сортируем файлы по приоритету рефакторинга
  stats.potentialRefactorFiles.sort((a, b) => b.priority - a.priority);
}

/**
 * Вычисляет приоритет рефакторинга файла
 */
function calculateRefactoringPriority(fileStats) {
  let priority = 0;

  priority += fileStats.complexity * 2;
  priority += fileStats.lines / 50;
  priority += fileStats.bugFixes * 5;
  priority += fileStats.modificationFrequency / 10;

  return Math.round(priority);
}

/**
 * Собирает список файлов для анализа
 */
async function collectFiles(projectRoot, config = {}) {
  const defaultConfig = {
    excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage'],
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'],
  };

  const actualConfig = { ...defaultConfig, ...config };
  const files = [];

  function traverse(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(projectRoot, fullPath);

        if (entry.isDirectory()) {
          if (!actualConfig.excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (actualConfig.fileExtensions.includes(ext)) {
            files.push(relativePath);
          }
        }
      }
    } catch (error) {
      // Игнорируем ошибки доступа к файлам
    }
  }

  traverse(projectRoot);
  return files;
}

export default {
  analyze,
  analyzeFile,
  collectFiles,
  estimateComplexity,
  extractDependencies,
  findCircularDependencies,
};
