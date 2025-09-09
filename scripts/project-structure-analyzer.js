#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Конфигурация
const CONFIG = {
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.svelte-kit', '.next'],
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'],
  maxFileSize: 300, // строк кода
  maxComplexity: 15,
  maxDuplication: 10, // процент дублирования
};

// Глобальные счетчики
const stats = {
  totalFiles: 0,
  totalLines: 0,
  largeFiles: 0,
  complexFiles: 0,
  duplicatedCode: 0,
  filesByType: {},
  directoryStats: {},
  potentialRefactorFiles: [],
  circularDependencies: [],
  dependencyGraph: {},
};

// Модуль самообучения анализатора
const learningSystem = {
  projectPatterns: {},
  metricDistributions: {},
  suggestedThresholds: {},

  // Анализ распределения метрик для самообучения
  analyzeMetricDistributions() {
    // Анализ распределения размера файлов
    const fileSizes = stats.potentialRefactorFiles
      .map(file => file.lines)
      .concat(Object.values(stats.dependencyGraph).map(() => 0));

    if (fileSizes.length > 0) {
      const sortedSizes = [...fileSizes].sort((a, b) => a - b);
      const median = sortedSizes[Math.floor(sortedSizes.length / 2)];
      const p75 = sortedSizes[Math.floor(sortedSizes.length * 0.75)];
      const p90 = sortedSizes[Math.floor(sortedSizes.length * 0.9)];

      this.metricDistributions.fileSize = { median, p75, p90 };

      // Предложение по корректировке порога размера файла
      if (p90 < CONFIG.maxFileSize * 0.7) {
        this.suggestedThresholds.fileSize = Math.max(p90 * 1.2, 200);
      } else if (p75 > CONFIG.maxFileSize * 1.2) {
        this.suggestedThresholds.fileSize = Math.max(p75 * 1.1, 350);
      }
    }

    // Анализ распределения сложности
    const complexities = stats.potentialRefactorFiles.map(file => file.complexity);
    if (complexities.length > 0) {
      const sortedComplexities = [...complexities].sort((a, b) => a - b);
      const median = sortedComplexities[Math.floor(sortedComplexities.length / 2)];
      const p75 = sortedComplexities[Math.floor(sortedComplexities.length * 0.75)];

      this.metricDistributions.complexity = { median, p75 };

      // Предложение по корректировке порога сложности
      if (p75 < CONFIG.maxComplexity * 0.7) {
        this.suggestedThresholds.complexity = Math.max(p75 * 1.2, 10);
      } else if (median > CONFIG.maxComplexity * 0.8) {
        this.suggestedThresholds.complexity = Math.max(median * 1.1, 18);
      }
    }

    return this;
  },

  // Определение архитектурных паттернов проекта
  detectProjectPatterns() {
    // Анализ распределения файлов по директориям для определения архитектуры
    const dirPatterns = {};
    for (const [dir, data] of Object.entries(stats.directoryStats)) {
      const dirName = path.basename(dir);
      // Распознаем типичные директории в архитектурах
      if (['components', 'views', 'pages'].includes(dirName)) {
        dirPatterns.uiLayer = dirPatterns.uiLayer || {};
        dirPatterns.uiLayer[dirName] = data.files;
      } else if (['services', 'api', 'data', 'store', 'stores'].includes(dirName)) {
        dirPatterns.dataLayer = dirPatterns.dataLayer || {};
        dirPatterns.dataLayer[dirName] = data.files;
      } else if (['utils', 'helpers', 'lib', 'common'].includes(dirName)) {
        dirPatterns.utilLayer = dirPatterns.utilLayer || {};
        dirPatterns.utilLayer[dirName] = data.files;
      }
    }

    // Определяем типовой архитектурный паттерн
    if (dirPatterns.uiLayer && dirPatterns.dataLayer) {
      if (
        Object.keys(dirPatterns.uiLayer).includes('components') &&
        Object.keys(dirPatterns.uiLayer).includes('pages')
      ) {
        this.projectPatterns.architecture = 'React/Next.js';
      } else if (
        Object.keys(dirPatterns.uiLayer).includes('components') &&
        Object.keys(dirPatterns.dataLayer).includes('store')
      ) {
        this.projectPatterns.architecture = 'Vue/Vuex';
      } else if (Object.keys(dirPatterns.uiLayer).includes('routes')) {
        this.projectPatterns.architecture = 'SvelteKit';
      } else {
        this.projectPatterns.architecture = 'Generic Frontend';
      }
    } else if (
      Object.keys(stats.filesByType).includes('.ts') &&
      !Object.keys(stats.filesByType).includes('.jsx')
    ) {
      this.projectPatterns.architecture = 'Node.js/TypeScript Backend';
    }

    return this;
  },

  // Генерация рекомендаций по улучшению критериев оценки
  generateAnalyzerImprovements() {
    const improvements = {
      thresholdAdjustments: [],
      additionalMetrics: [],
      contextualRules: [],
    };

    // Рекомендации по корректировке порогов на основе распределения метрик
    if (
      this.suggestedThresholds.fileSize &&
      Math.abs(this.suggestedThresholds.fileSize - CONFIG.maxFileSize) > 50
    ) {
      improvements.thresholdAdjustments.push({
        metric: 'Размер файла',
        current: CONFIG.maxFileSize,
        suggested: Math.round(this.suggestedThresholds.fileSize),
        reason: `Распределение размеров файлов в проекте (медиана: ${this.metricDistributions.fileSize.median}, P90: ${this.metricDistributions.fileSize.p90})`,
      });
    }

    if (
      this.suggestedThresholds.complexity &&
      Math.abs(this.suggestedThresholds.complexity - CONFIG.maxComplexity) > 3
    ) {
      improvements.thresholdAdjustments.push({
        metric: 'Цикломатическая сложность',
        current: CONFIG.maxComplexity,
        suggested: Math.round(this.suggestedThresholds.complexity),
        reason: `Распределение сложности в проекте (медиана: ${this.metricDistributions.complexity?.median})`,
      });
    }

    // Предложения новых метрик на основе архитектуры проекта
    if (this.projectPatterns.architecture) {
      switch (this.projectPatterns.architecture) {
        case 'React/Next.js':
          improvements.additionalMetrics.push({
            name: 'Анализ размера пропсов компонентов',
            description: 'Выявление компонентов с избыточным количеством props (>8)',
            implementation: 'Парсинг определений компонентов и подсчет props',
          });
          improvements.contextualRules.push({
            name: 'Правила для React-хуков',
            description:
              'Проверка корректности использования правила зависимостей в useEffect/useMemo/useCallback',
            implementation: 'Статический анализ замыканий в хуках',
          });
          break;
        case 'Vue/Vuex':
          improvements.additionalMetrics.push({
            name: 'Анализ размера шаблонов компонентов',
            description: 'Выявление компонентов со сложными шаблонами',
            implementation: 'Подсчет количества директив и вложенности шаблонов',
          });
          break;
        case 'SvelteKit':
          improvements.additionalMetrics.push({
            name: 'Анализ реактивных переменных',
            description: 'Поиск избыточного использования реактивных переменных',
            implementation: 'Анализ использования $: синтаксиса',
          });
          break;
        case 'Node.js/TypeScript Backend':
          improvements.additionalMetrics.push({
            name: 'Анализ обработки ошибок',
            description: 'Проверка корректности обработки асинхронных ошибок',
            implementation: 'Анализ try/catch блоков в async функциях',
          });
          break;
      }
    }

    // Дополнительные универсальные метрики
    const filesWithHighComplexity = stats.potentialRefactorFiles.filter(
      f => f.complexity > CONFIG.maxComplexity
    );
    if (filesWithHighComplexity.length > stats.totalFiles * 0.2) {
      improvements.additionalMetrics.push({
        name: 'Когнитивная сложность',
        description: 'Дополнение к цикломатической сложности, оценивающее понятность кода',
        implementation: 'Анализ вложенности, количества ветвлений и абстракций',
      });
    }

    // Если много файлов с высоким числом строк
    if (stats.largeFiles > stats.totalFiles * 0.15) {
      improvements.additionalMetrics.push({
        name: 'Функциональная когезия',
        description: 'Оценка, насколько функции в модуле связаны одной задачей',
        implementation: 'Анализ вызовов функций и использования переменных в модуле',
      });
    }

    return improvements;
  },
};

// Функция для обхода директории
async function traverseDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Пропускаем исключенные директории
    if (entry.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        stats.directoryStats[fullPath] = { files: 0, lines: 0, avgComplexity: 0 };
        await traverseDirectory(fullPath);
      }
      continue;
    }

    // Анализируем только файлы с указанными расширениями
    const ext = path.extname(fullPath);
    if (CONFIG.fileExtensions.includes(ext)) {
      stats.totalFiles++;

      // Считаем по типам файлов
      stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;

      // Анализируем файл
      const fileStats = await analyzeFile(fullPath);

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
    }
  }
}

// Функция для анализа файла
async function analyzeFile(filePath) {
  const fileStats = {
    path: filePath,
    lines: 0,
    complexity: 0,
    dependencies: [],
    duplicatedLines: 0,
    modificationFrequency: 0,
    bugFixes: 0,
    needsRefactoring: false,
    refactoringReasons: [],
  };

  try {
    // Читаем содержимое файла
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    fileStats.lines = lines.length;
    stats.totalLines += lines.length;

    // Проверяем размер файла
    if (lines.length > CONFIG.maxFileSize) {
      stats.largeFiles++;
      fileStats.needsRefactoring = true;
      fileStats.refactoringReasons.push(
        `Large file (${lines.length} lines > ${CONFIG.maxFileSize})`
      );
    }

    // Оцениваем сложность (примитивная оценка)
    const complexityScore = estimateComplexity(content);
    fileStats.complexity = complexityScore;

    if (complexityScore > CONFIG.maxComplexity) {
      stats.complexFiles++;
      fileStats.needsRefactoring = true;
      fileStats.refactoringReasons.push(
        `High complexity (${complexityScore} > ${CONFIG.maxComplexity})`
      );
    }

    // Находим зависимости
    fileStats.dependencies = extractDependencies(content, filePath);

    // Анализируем историю изменений (если есть Git)
    try {
      const { stdout: gitHistory } = await execPromise(
        `git log --follow --format="%H" -- "${filePath}"`,
        { timeout: 5000 }
      );
      const commits = gitHistory.trim().split('\n').filter(Boolean);
      fileStats.modificationFrequency = commits.length;

      // Количество коммитов с исправлением багов
      const { stdout: bugfixCommits } = await execPromise(
        `git log --follow --grep="fix\\|bug\\|issue\\|resolve\\|close" --format="%H" -- "${filePath}"`,
        { timeout: 5000 }
      );
      const bugfixes = bugfixCommits.trim().split('\n').filter(Boolean);
      fileStats.bugFixes = bugfixes.length;

      // Файлы с большим количеством багфиксов потенциально требуют рефакторинга
      if (bugfixes.length > 5) {
        fileStats.needsRefactoring = true;
        fileStats.refactoringReasons.push(`High number of bug fixes (${bugfixes.length})`);
      }
    } catch (error) {
      // Git не установлен или не репозиторий - игнорируем
    }

    // Если файл нуждается в рефакторинге, добавляем его в список
    if (fileStats.needsRefactoring) {
      stats.potentialRefactorFiles.push({
        path: filePath,
        reasons: fileStats.refactoringReasons,
        lines: fileStats.lines,
        complexity: fileStats.complexity,
        bugFixes: fileStats.bugFixes,
      });
    }

    // Обновляем граф зависимостей
    if (!stats.dependencyGraph[filePath]) {
      stats.dependencyGraph[filePath] = [];
    }
    stats.dependencyGraph[filePath] = fileStats.dependencies;

    return fileStats;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error.message);
    return fileStats;
  }
}

// Оценка сложности кода (упрощенная)
function estimateComplexity(content) {
  // Подсчет количества условных операторов, циклов и т.д.
  const ifMatches = content.match(/if\s*\(/g) || [];
  const elseMatches = content.match(/else[\s{]/g) || [];
  const forMatches = content.match(/for\s*\(/g) || [];
  const whileMatches = content.match(/while\s*\(/g) || [];
  const switchMatches = content.match(/switch\s*\(/g) || [];
  const caseMatches = content.match(/case\s+[^:]+:/g) || [];
  const catchMatches = content.match(/catch\s*\(/g) || [];
  const ternaryMatches = content.match(/\?.*:/g) || [];
  const functionMatches = content.match(/function\s+\w+\s*\(/g) || [];
  const arrowFunctionMatches = content.match(/=>\s*{/g) || [];

  // Циклометрическая сложность (примерная)
  return (
    ifMatches.length +
    elseMatches.length +
    forMatches.length +
    whileMatches.length +
    switchMatches.length +
    caseMatches.length +
    catchMatches.length +
    ternaryMatches.length +
    functionMatches.length +
    arrowFunctionMatches.length +
    1
  );
}

// Извлечение зависимостей
function extractDependencies(content, filePath) {
  const dependencies = [];

  // Анализ импортов (упрощенно)
  const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
  const requireMatches = content.match(/require\s*\(['"]([^'"]+)['"]\)/g) || [];

  // Обработка импортов
  for (const match of importMatches) {
    const importPath = match.match(/from\s+['"]([^'"]+)['"]/);
    if (importPath && importPath[1]) {
      const dependency = resolveImportPath(importPath[1], filePath);
      if (dependency) dependencies.push(dependency);
    }
  }

  // Обработка require
  for (const match of requireMatches) {
    const requirePath = match.match(/require\s*\(['"]([^'"]+)['"]\)/);
    if (requirePath && requirePath[1]) {
      const dependency = resolveImportPath(requirePath[1], filePath);
      if (dependency) dependencies.push(dependency);
    }
  }

  return dependencies;
}

// Преобразование пути импорта в абсолютный путь
function resolveImportPath(importPath, filePath) {
  // Пропускаем внешние зависимости
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  try {
    const baseDir = path.dirname(filePath);
    let resolvedPath = path.resolve(baseDir, importPath);

    // Проверка существования файла
    if (!fs.existsSync(resolvedPath)) {
      // Проверяем с расширениями
      for (const ext of CONFIG.fileExtensions) {
        if (fs.existsSync(resolvedPath + ext)) {
          resolvedPath += ext;
          break;
        }
      }

      // Проверяем index файлы
      if (!fs.existsSync(resolvedPath)) {
        for (const ext of CONFIG.fileExtensions) {
          if (fs.existsSync(path.join(resolvedPath, `index${ext}`))) {
            resolvedPath = path.join(resolvedPath, `index${ext}`);
            break;
          }
        }
      }
    }

    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  } catch (error) {
    return null;
  }
}

// Функция для поиска циклических зависимостей
function findCircularDependencies() {
  function checkCircular(file, visited = new Set(), path = []) {
    if (visited.has(file)) {
      const cycleStart = path.indexOf(file);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart);
        stats.circularDependencies.push(cycle);
        return true;
      }
      return false;
    }

    visited.add(file);
    path.push(file);

    const dependencies = stats.dependencyGraph[file] || [];
    for (const dependency of dependencies) {
      if (checkCircular(dependency, visited, [...path])) {
        return true;
      }
    }

    return false;
  }

  // Проверяем каждый файл
  for (const file in stats.dependencyGraph) {
    checkCircular(file);
  }

  // Удаляем дубликаты циклов
  stats.circularDependencies = stats.circularDependencies.filter((cycle, index) => {
    return (
      stats.circularDependencies.findIndex(
        otherCycle =>
          otherCycle.length === cycle.length && otherCycle.every((file, i) => file === cycle[i])
      ) === index
    );
  });
}

// Генерация отчета
function generateReport() {
  // Анализируем распределение метрик
  learningSystem.analyzeMetricDistributions();

  // Определяем архитектурные паттерны
  learningSystem.detectProjectPatterns();

  // Получаем рекомендации по улучшению анализатора
  const analyzerImprovements = learningSystem.generateAnalyzerImprovements();

  // Вычисляем процент файлов требующих рефакторинга
  const refactoringPercentage = (
    (stats.potentialRefactorFiles.length / stats.totalFiles) *
    100
  ).toFixed(1);
  const refactoringNeeded =
    refactoringPercentage > 15 ? 'ВЫСОКАЯ' : refactoringPercentage > 5 ? 'СРЕДНЯЯ' : 'НИЗКАЯ';

  // Сортируем файлы по срочности рефакторинга
  stats.potentialRefactorFiles.sort(
    (a, b) =>
      b.complexity * 2 +
      b.lines / 50 +
      b.bugFixes * 3 -
      (a.complexity * 2 + a.lines / 50 + a.bugFixes * 3)
  );

  // Форматируем отчет в Markdown
  let report = `# Отчет о структуре проекта и необходимости рефакторинга

## 📊 Общая информация

| Метрика | Значение |
|---------|---------|
| Всего файлов | ${stats.totalFiles} |
| Всего строк кода | ${stats.totalLines} |
| Файлов требующих рефакторинга | ${stats.potentialRefactorFiles.length} (${refactoringPercentage}%) |
| Циклических зависимостей | ${stats.circularDependencies.length} |

## 🔄 Необходимость рефакторинга: ${refactoringNeeded}

### 📁 Распределение файлов по типам

`;

  // Добавляем статистику по типам файлов
  for (const [ext, count] of Object.entries(stats.filesByType)) {
    report += `- **${ext}**: ${count} файлов (${((count / stats.totalFiles) * 100).toFixed(1)}%)\n`;
  }

  // Добавляем топ файлов требующих рефакторинга
  report += `
## 🔥 Топ файлов требующих рефакторинга

`;

  const topFiles = stats.potentialRefactorFiles.slice(0, 10);
  for (let i = 0; i < topFiles.length; i++) {
    const file = topFiles[i];
    report += `### ${i + 1}. ${path.basename(file.path)}\n`;
    report += `**Путь**: \`${file.path}\`\n`;
    report += `**Строк**: ${file.lines}\n`;
    report += `**Сложность**: ${file.complexity}\n`;
    report += `**Исправлений багов**: ${file.bugFixes}\n`;
    report += `**Причины для рефакторинга**:\n`;
    for (const reason of file.reasons) {
      report += `- ${reason}\n`;
    }
    report += '\n';
  }

  // Добавляем информацию о циклических зависимостях
  if (stats.circularDependencies.length > 0) {
    report += `
## 🔄 Циклические зависимости

`;
    for (let i = 0; i < stats.circularDependencies.length; i++) {
      const cycle = stats.circularDependencies[i];
      report += `### Цикл ${i + 1}:\n`;
      for (let j = 0; j < cycle.length; j++) {
        const file = cycle[j];
        report += `${j + 1}. \`${file}\`\n`;
      }
      report += '↩️ (цикл)\n\n';
    }
  }

  // Добавляем тепловую карту директорий
  report += `
## 📊 Тепловая карта директорий

| Директория | Файлов | Строк кода | Средняя сложность | Статус |
|------------|--------|------------|-------------------|--------|
`;

  // Сортируем директории по среднему показателю сложности
  const sortedDirs = Object.entries(stats.directoryStats).sort(
    ([, a], [, b]) => b.avgComplexity - a.avgComplexity
  );

  for (const [dir, dirStats] of sortedDirs) {
    const status = dirStats.avgComplexity > 10 ? '🔴' : dirStats.avgComplexity > 5 ? '🟡' : '🟢';

    report += `| \`${dir}\` | ${dirStats.files} | ${dirStats.lines} | ${dirStats.avgComplexity.toFixed(1)} | ${status} |\n`;
  }

  // Добавляем секцию самообучения в отчет
  report += `
## 🧠 Самообучение анализатора

### 📐 Обнаруженные паттерны проекта

`;

  if (learningSystem.projectPatterns.architecture) {
    report += `- **Архитектурный паттерн**: ${learningSystem.projectPatterns.architecture}\n`;
  }

  if (learningSystem.metricDistributions.fileSize) {
    report += `- **Распределение размеров файлов**:
  - Медиана: ${learningSystem.metricDistributions.fileSize.median} строк
  - 75-й процентиль: ${learningSystem.metricDistributions.fileSize.p75} строк
  - 90-й процентиль: ${learningSystem.metricDistributions.fileSize.p90} строк\n`;
  }

  if (learningSystem.metricDistributions.complexity) {
    report += `- **Распределение сложности**:
  - Медиана: ${learningSystem.metricDistributions.complexity.median}
  - 75-й процентиль: ${learningSystem.metricDistributions.complexity.p75}\n`;
  }

  report += `
### 🛠️ Рекомендации по улучшению критериев анализа

`;

  if (analyzerImprovements.thresholdAdjustments.length > 0) {
    report += `#### Корректировка порогов для текущего проекта

| Метрика | Текущий порог | Рекомендуемый | Причина |
|---------|---------------|---------------|---------|
`;

    for (const adjustment of analyzerImprovements.thresholdAdjustments) {
      report += `| ${adjustment.metric} | ${adjustment.current} | ${adjustment.suggested} | ${adjustment.reason} |\n`;
    }
  } else {
    report += `- Текущие пороги оценки оптимальны для данного проекта\n`;
  }

  if (analyzerImprovements.additionalMetrics.length > 0) {
    report += `
#### Предлагаемые дополнительные метрики

`;

    for (const metric of analyzerImprovements.additionalMetrics) {
      report += `- **${metric.name}**: ${metric.description}\n`;
    }
  }

  if (analyzerImprovements.contextualRules.length > 0) {
    report += `
#### Специфичные для данного проекта правила

`;

    for (const rule of analyzerImprovements.contextualRules) {
      report += `- **${rule.name}**: ${rule.description}\n`;
    }
  }

  // Рекомендации
  report += `
## 💡 Рекомендации по рефакторингу

`;

  if (stats.potentialRefactorFiles.length > 0) {
    report += `1. **Приоритеты рефакторинга**:
   - Сначала устраните циклические зависимости (${stats.circularDependencies.length})
   - Разбейте крупные файлы на модули
   - Уменьшите сложность функций

2. **Разделение ответственности**:
   - Выделите бизнес-логику из компонентов UI
   - Создайте отдельные слои для данных, логики и представления

3. **Улучшение тестирования**:
   - Добавьте тесты перед рефакторингом сложных файлов
   - Следуйте принципу "красный-зеленый-рефакторинг"

4. **План действий**:
`;

    // Добавляем план действий, основанный на анализе
    const highPriorityFiles = stats.potentialRefactorFiles.slice(0, 3);
    for (const file of highPriorityFiles) {
      report += `   - Рефакторинг \`${path.basename(file.path)}\`: ${file.reasons[0]}\n`;
    }
  } else {
    report += `Проект имеет хорошую структуру, специального рефакторинга не требуется.`;
  }

  report += `\n\n---\n\nАнализ выполнен: ${new Date().toISOString()}\n`;
  return report;
}

// Основная функция
async function main() {
  const projectRoot = process.argv[2] || process.cwd();
  console.log(`Анализ проекта: ${projectRoot}`);
  console.log('Версия анализатора: 1.1.0 (с самообучением)');

  await traverseDirectory(projectRoot);
  findCircularDependencies();

  const report = generateReport();

  // Сохраняем отчет
  const reportPath = path.join(projectRoot, 'project-analysis-report.md');
  fs.writeFileSync(reportPath, report);

  console.log(`Анализ завершен. Отчет сохранен в: ${reportPath}`);

  // Выводим краткую сводку в консоль
  console.log('\n📊 Краткая сводка:');
  console.log(`- Всего файлов: ${stats.totalFiles}`);
  console.log(`- Файлов требующих рефакторинга: ${stats.potentialRefactorFiles.length}`);
  console.log(`- Циклических зависимостей: ${stats.circularDependencies.length}`);
  console.log(
    `- Необходимость рефакторинга: ${((stats.potentialRefactorFiles.length / stats.totalFiles) * 100).toFixed(1) > 15 ? 'ВЫСОКАЯ' : ((stats.potentialRefactorFiles.length / stats.totalFiles) * 100).toFixed(1) > 5 ? 'СРЕДНЯЯ' : 'НИЗКАЯ'}`
  );

  // Выводим информацию о самообучении
  if (
    learningSystem.suggestedThresholds.fileSize ||
    learningSystem.suggestedThresholds.complexity
  ) {
    console.log('\n🧠 Результаты самообучения:');
    if (learningSystem.projectPatterns.architecture) {
      console.log(`- Архитектурный паттерн: ${learningSystem.projectPatterns.architecture}`);
    }
    if (learningSystem.suggestedThresholds.fileSize) {
      console.log(
        `- Рекомендуемый порог размера файла: ${Math.round(learningSystem.suggestedThresholds.fileSize)} строк (текущий: ${CONFIG.maxFileSize})`
      );
    }
    if (learningSystem.suggestedThresholds.complexity) {
      console.log(
        `- Рекомендуемый порог сложности: ${Math.round(learningSystem.suggestedThresholds.complexity)} (текущий: ${CONFIG.maxComplexity})`
      );
    }
  }
}

main().catch(error => {
  console.error('Ошибка при анализе проекта:', error);
});
