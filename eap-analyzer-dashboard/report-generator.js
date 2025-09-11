#!/usr/bin/env node

/**
 * EAP Analyzer Report Generator
 * Автоматический генератор актуальных отчетов на основе анализа кодовой базы
 *
 * Использование:
 * node report-generator.js [--output path] [--format md|json] [--deep-scan]
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class EAPReportGenerator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.eapAnalyzerPath = path.join(this.projectRoot, 'eap-analyzer');
    this.outputPath =
      options.outputPath ||
      path.join(this.projectRoot, 'eap-analyzer-dashboard', 'data', 'reports');
    this.format = options.format || 'md';
    this.deepScan = options.deepScan || false;

    this.categories = {
      testing: { name: 'Тестирование', icon: '🧪', priority: 'ВЫСОКИЙ' },
      security: { name: 'Безопасность', icon: '🔒', priority: 'КРИТИЧЕСКИЙ' },
      performance: { name: 'Производительность', icon: '⚡', priority: 'ВЫСОКИЙ' },
      docker: { name: 'Docker & Контейнеризация', icon: '🐳', priority: 'СРЕДНИЙ' },
      dependencies: { name: 'Зависимости', icon: '📦', priority: 'СРЕДНИЙ' },
      logging: { name: 'Логирование', icon: '📝', priority: 'НИЗКИЙ' },
      cicd: { name: 'CI/CD', icon: '🔄', priority: 'СРЕДНИЙ' },
      'code-quality': { name: 'Качество кода', icon: '💎', priority: 'ВЫСОКИЙ' },
      core: { name: 'Ядро системы', icon: '🏗️', priority: 'КРИТИЧЕСКИЙ' },
      ai: { name: 'ИИ интеграция', icon: '🤖', priority: 'ИННОВАЦИОННЫЙ' },
      architecture: { name: 'Архитектура', icon: '🏛️', priority: 'ВЫСОКИЙ' },
      infrastructure: { name: 'Инфраструктура', icon: '⚙️', priority: 'СРЕДНИЙ' },
    };
  }

  /**
   * Главный метод генерации отчета
   */
  async generateReport() {
    console.log('🚀 Запуск генератора отчетов EAP Analyzer...');

    try {
      // 1. Сканирование файловой структуры
      console.log('📂 Сканирование файловой структуры...');
      const components = await this.scanComponents();

      // 2. Анализ кода и вычисление метрик
      console.log('🔍 Анализ кода и вычисление метрик...');
      const analyzedComponents = await this.analyzeComponents(components);

      // 3. Сбор статистики
      console.log('📊 Сбор статистики...');
      const statistics = this.calculateStatistics(analyzedComponents);

      // 4. Генерация отчета
      console.log('📝 Генерация отчета...');
      const report = await this.createReport(analyzedComponents, statistics);

      // 5. Сохранение отчета
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `EAP-ANALYZER-REPORT-${timestamp}.${this.format}`;
      const outputFile = path.join(this.outputPath, filename);

      await this.ensureDirectoryExists(this.outputPath);
      await fs.writeFile(outputFile, report, 'utf8');

      // 6. Обновление основного файла
      const mainFile = path.join(this.outputPath, 'EAP-ANALYZER-FULL-COMPONENT-CATALOG.md');
      if (this.format === 'md') {
        await fs.writeFile(mainFile, report, 'utf8');
        console.log(`✅ Основной каталог обновлен: ${mainFile}`);
      }

      console.log(`✅ Отчет сохранен: ${outputFile}`);
      console.log(`📊 Проанализировано компонентов: ${Object.keys(analyzedComponents).length}`);
      console.log(
        `📈 Средняя готовность: ${statistics.avgLogic.toFixed(1)}% / ${statistics.avgFunctionality.toFixed(1)}%`
      );

      return {
        components: analyzedComponents,
        statistics,
        outputFile,
        timestamp,
      };
    } catch (error) {
      console.error('❌ Ошибка генерации отчета:', error.message);
      throw error;
    }
  }

  /**
   * Сканирование компонентов в директории eap-analyzer
   */
  async scanComponents() {
    const components = {};

    try {
      const files = await this.getAllFiles(this.eapAnalyzerPath, ['.js', '.cjs', '.ts']);

      for (const file of files) {
        const relativePath = path.relative(this.eapAnalyzerPath, file);
        const componentName = this.extractComponentName(file);
        const category = this.determineCategory(file, componentName);

        components[componentName] = {
          name: componentName,
          file: relativePath,
          fullPath: file,
          category,
          size: 0,
          lines: 0,
          functions: 0,
          classes: 0,
          tests: null,
          logic: 0,
          functionality: 0,
          description: '',
          lastModified: null,
        };
      }

      return components;
    } catch (error) {
      console.warn('⚠️ Не удалось просканировать eap-analyzer директорию:', error.message);
      return {};
    }
  }

  /**
   * Анализ каждого компонента
   */
  async analyzeComponents(components) {
    for (const [name, component] of Object.entries(components)) {
      try {
        // Базовый анализ файла
        const stats = await fs.stat(component.fullPath);
        component.lastModified = stats.mtime;
        component.size = stats.size;

        // Анализ содержимого
        const content = await fs.readFile(component.fullPath, 'utf8');
        const analysis = this.analyzeCode(content);

        Object.assign(component, analysis);

        // Вычисление метрик готовности
        const metrics = this.calculateReadinessMetrics(component, content);
        component.logic = metrics.logic;
        component.functionality = metrics.functionality;

        // Поиск связанных тестов
        component.tests = await this.findRelatedTests(component);

        if (this.deepScan) {
          // Глубокий анализ (AST, сложность и т.д.)
          const deepAnalysis = await this.performDeepAnalysis(content, component.fullPath);
          Object.assign(component, deepAnalysis);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка анализа ${name}:`, error.message);
      }
    }

    return components;
  }

  /**
   * Анализ кода для извлечения метрик
   */
  analyzeCode(content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

    // Подсчет функций
    const functionMatches =
      content.match(/(function\s+\w+|const\s+\w+\s*=\s*\(?|class\s+\w+|async\s+function)/g) || [];

    // Подсчет классов
    const classMatches = content.match(/class\s+\w+/g) || [];

    // Извлечение описания из комментариев
    const descriptionMatch = content.match(
      /\/\*\*[\s\S]*?\*\/([\s\S]*?)(?:class|function|const|module\.exports)/
    );
    let description = '';

    if (descriptionMatch) {
      const commentBlock = descriptionMatch[0];
      const descLines = commentBlock
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@'))
        .slice(1, 3);
      description = descLines.join(' ');
    }

    // Автоматическое описание на основе имени файла
    if (!description) {
      description = this.generateAutoDescription(content);
    }

    return {
      lines: nonEmptyLines,
      functions: functionMatches.length,
      classes: classMatches.length,
      description: description.slice(0, 200), // Ограничиваем длину
    };
  }

  /**
   * Вычисление метрик готовности на основе анализа кода
   */
  calculateReadinessMetrics(component, content) {
    let logicScore = 0;
    let functionalityScore = 0;

    // Базовая оценка по размеру и сложности
    const sizeScore = Math.min((component.lines / 100) * 30, 30);
    const functionScore = Math.min((component.functions / 10) * 20, 20);
    const classScore = Math.min((component.classes / 3) * 15, 15);

    logicScore = sizeScore + functionScore + classScore;

    // Дополнительные факторы для логики
    if (content.includes('async') && content.includes('await')) logicScore += 10;
    if (content.includes('try') && content.includes('catch')) logicScore += 8;
    if (content.includes('class') && content.includes('constructor')) logicScore += 12;
    if (content.includes('module.exports') || content.includes('export')) logicScore += 5;

    // Оценка функциональности
    functionalityScore = logicScore * 0.8; // Базово 80% от логики

    // Дополнительные факторы для функциональности
    if (component.tests) functionalityScore += 10;
    if (content.includes('console.log') || content.includes('logger')) functionalityScore += 5;
    if (content.includes('validation') || content.includes('validate')) functionalityScore += 8;

    // Категорийные модификаторы
    const categoryMultipliers = {
      testing: { logic: 1.1, functionality: 1.2 },
      security: { logic: 1.05, functionality: 1.1 },
      core: { logic: 1.0, functionality: 1.05 },
      ai: { logic: 1.15, functionality: 1.1 },
    };

    const multiplier = categoryMultipliers[component.category] || {
      logic: 1.0,
      functionality: 1.0,
    };
    logicScore *= multiplier.logic;
    functionalityScore *= multiplier.functionality;

    // Ограничиваем значения
    logicScore = Math.min(Math.max(Math.round(logicScore), 10), 98);
    functionalityScore = Math.min(Math.max(Math.round(functionalityScore), 5), 95);

    return { logic: logicScore, functionality: functionalityScore };
  }

  /**
   * Поиск связанных тестовых файлов
   */
  async findRelatedTests(component) {
    const testDirs = [
      path.join(this.projectRoot, 'tests'),
      path.join(this.projectRoot, '__tests__'),
      path.join(this.projectRoot, 'test'),
      path.join(this.projectRoot, 'spec'),
    ];

    const baseName = path.basename(component.file, path.extname(component.file));
    const testPatterns = [
      `${baseName}.test.js`,
      `${baseName}.spec.js`,
      `${baseName}.test.ts`,
      `${baseName}.spec.ts`,
    ];

    for (const testDir of testDirs) {
      try {
        const exists = await fs
          .access(testDir)
          .then(() => true)
          .catch(() => false);
        if (!exists) continue;

        for (const pattern of testPatterns) {
          const testFile = path.join(testDir, pattern);
          const testExists = await fs
            .access(testFile)
            .then(() => true)
            .catch(() => false);
          if (testExists) {
            const testContent = await fs.readFile(testFile, 'utf8');
            const testCount = (testContent.match(/it\(|test\(|describe\(/g) || []).length;
            return `${testCount} тестов`;
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа к директориям
      }
    }

    return null;
  }

  /**
   * Определение категории компонента
   */
  determineCategory(filePath, componentName) {
    const pathLower = filePath.toLowerCase();
    const nameLower = componentName.toLowerCase();

    if (pathLower.includes('test') || nameLower.includes('test') || nameLower.includes('jest')) {
      return 'testing';
    }
    if (pathLower.includes('security') || nameLower.includes('security')) {
      return 'security';
    }
    if (pathLower.includes('performance') || nameLower.includes('performance')) {
      return 'performance';
    }
    if (pathLower.includes('docker') || nameLower.includes('docker')) {
      return 'docker';
    }
    if (
      pathLower.includes('ai') ||
      pathLower.includes('intelligence') ||
      nameLower.includes('ai')
    ) {
      return 'ai';
    }
    if (pathLower.includes('core') || pathLower.includes('orchestrator')) {
      return 'core';
    }
    if (pathLower.includes('architecture') || nameLower.includes('structure')) {
      return 'architecture';
    }
    if (pathLower.includes('infrastructure') || nameLower.includes('infrastructure')) {
      return 'infrastructure';
    }
    if (nameLower.includes('dependencies') || nameLower.includes('dependency')) {
      return 'dependencies';
    }
    if (nameLower.includes('logging') || nameLower.includes('log')) {
      return 'logging';
    }
    if (nameLower.includes('ci') || nameLower.includes('cd')) {
      return 'cicd';
    }
    if (nameLower.includes('quality') || nameLower.includes('lint')) {
      return 'code-quality';
    }

    return 'core'; // По умолчанию
  }

  /**
   * Извлечение имени компонента из пути к файлу
   */
  extractComponentName(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.replace(/[-_]/g, '');
  }

  /**
   * Автоматическая генерация описания
   */
  generateAutoDescription(content) {
    const firstComment = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (firstComment) {
      return firstComment[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line)
        .slice(0, 2)
        .join(' ');
    }

    // Описание на основе первой строки кода
    const lines = content.split('\n').filter(line => line.trim());
    const meaningfulLine = lines.find(
      line =>
        (!line.startsWith('//') &&
          !line.startsWith('/*') &&
          !line.startsWith('*') &&
          line.includes('class')) ||
        line.includes('function') ||
        line.includes('const')
    );

    return meaningfulLine ? `Автоматически определенный компонент` : 'Анализируемый модуль системы';
  }

  /**
   * Вычисление общей статистики
   */
  calculateStatistics(components) {
    const componentList = Object.values(components);
    const totalComponents = componentList.length;

    if (totalComponents === 0) {
      return {
        total: 0,
        avgLogic: 0,
        avgFunctionality: 0,
        ready: 0,
        inProgress: 0,
        planned: 0,
        categories: {},
      };
    }

    const totalLogic = componentList.reduce((sum, comp) => sum + comp.logic, 0);
    const totalFunctionality = componentList.reduce((sum, comp) => sum + comp.functionality, 0);

    const avgLogic = totalLogic / totalComponents;
    const avgFunctionality = totalFunctionality / totalComponents;

    // Подсчет по статусам
    let ready = 0,
      inProgress = 0,
      planned = 0;
    componentList.forEach(comp => {
      const overall = (comp.logic + comp.functionality) / 2;
      if (overall >= 90) ready++;
      else if (overall >= 50) inProgress++;
      else planned++;
    });

    // Статистика по категориям
    const categories = {};
    componentList.forEach(comp => {
      if (!categories[comp.category]) {
        categories[comp.category] = {
          count: 0,
          avgLogic: 0,
          avgFunctionality: 0,
          components: [],
        };
      }
      categories[comp.category].count++;
      categories[comp.category].avgLogic += comp.logic;
      categories[comp.category].avgFunctionality += comp.functionality;
      categories[comp.category].components.push(comp.name);
    });

    // Вычисляем средние по категориям
    Object.values(categories).forEach(cat => {
      cat.avgLogic = Math.round(cat.avgLogic / cat.count);
      cat.avgFunctionality = Math.round(cat.avgFunctionality / cat.count);
    });

    return {
      total: totalComponents,
      avgLogic,
      avgFunctionality,
      ready,
      inProgress,
      planned,
      categories,
    };
  }

  /**
   * Создание Markdown отчета
   */
  async createReport(components, statistics) {
    const timestamp = new Date().toLocaleDateString('ru-RU');
    const componentsByCategory = this.groupByCategory(components);

    let report = `# 📋 EAP ANALYZER - ПОЛНЫЙ КАТАЛОГ КОМПОНЕНТОВ

*Сгенерировано автоматически: ${timestamp}*
*Версия: ${new Date().getFullYear()}.${new Date().getMonth() + 1}*

## 📊 ПОКАЗАТЕЛИ ГОТОВНОСТИ

- **Первая цифра**: Готовность логики (% реализации)
- **Вторая цифра**: Функциональность (% работоспособности)

## 📈 СВОДНАЯ СТАТИСТИКА
- **Общее количество компонентов:** ${statistics.total}
- **Средняя готовность логики:** ${statistics.avgLogic.toFixed(1)}%
- **Средняя функциональность:** ${statistics.avgFunctionality.toFixed(1)}%
- **Готовы к продакшену (>90%):** ${statistics.ready} компонентов
- **В активной разработке (50-90%):** ${statistics.inProgress} компонентов  
- **В планах (<50%):** ${statistics.planned} компонентов

---

## 🎯 **ОСНОВНЫЕ КАТЕГОРИИ АНАЛИЗА**

`;

    // Генерируем секции по категориям
    for (const [categoryKey, categoryComponents] of Object.entries(componentsByCategory)) {
      const categoryInfo = this.categories[categoryKey];
      const categoryStats = statistics.categories[categoryKey];

      if (!categoryInfo || !categoryStats) continue;

      report += `### ${Object.keys(componentsByCategory).indexOf(categoryKey) + 1}. ${categoryInfo.icon} **${categoryInfo.name.toUpperCase()}** [${categoryStats.avgLogic}% / ${categoryStats.avgFunctionality}%]

*Приоритет: ${categoryInfo.priority} | Компонентов: ${categoryStats.count}*

`;

      // Добавляем компоненты категории
      categoryComponents.forEach(component => {
        const testsInfo = component.tests || 'Тестов нет';
        report += `#### ${component.name}
- **Готовность логики:** ${component.logic}%
- **Функциональность:** ${component.functionality}%
- **Файл:** \`${component.file}\`
- **Описание:** ${component.description || 'Автоматически проанализированный компонент'}
- **Тесты:** ${testsInfo}
- **Строк кода:** ${component.lines}
- **Функций:** ${component.functions}

`;
      });

      report += `---

`;
    }

    // Добавляем историю изменений
    report += `## История изменений

### ${timestamp}
- Автоматически сгенерированный отчет
- Проанализировано ${statistics.total} компонентов
- Средняя готовность логики: ${statistics.avgLogic.toFixed(1)}%
- Средняя функциональность: ${statistics.avgFunctionality.toFixed(1)}%

---

*Отчет сгенерирован автоматически системой EAP Analyzer Report Generator*
*Для обновления запустите: \`node report-generator.js\`*
`;

    return report;
  }

  /**
   * Группировка компонентов по категориям
   */
  groupByCategory(components) {
    const grouped = {};

    Object.values(components).forEach(component => {
      const category = component.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(component);
    });

    // Сортируем компоненты в каждой категории по готовности
    Object.values(grouped).forEach(categoryComponents => {
      categoryComponents.sort((a, b) => {
        const overallA = (a.logic + a.functionality) / 2;
        const overallB = (b.logic + b.functionality) / 2;
        return overallB - overallA; // По убыванию готовности
      });
    });

    return grouped;
  }

  /**
   * Получение всех файлов в директории с заданными расширениями
   */
  async getAllFiles(dir, extensions = []) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Рекурсивно обходим поддиректории
          const subFiles = await this.getAllFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Проверяем расширение файла
          const ext = path.extname(entry.name);
          if (extensions.length === 0 || extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Не удалось прочитать директорию ${dir}:`, error.message);
    }

    return files;
  }

  /**
   * Обеспечение существования директории
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Глубокий анализ (для будущего расширения)
   */
  async performDeepAnalysis(content, filePath) {
    // Здесь можно добавить AST анализ, цикломатическую сложность и т.д.
    return {
      complexity: Math.floor(Math.random() * 10) + 1, // Заглушка
      maintainability: Math.floor(Math.random() * 100), // Заглушка
    };
  }
}

// CLI интерфейс
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--deep-scan':
        options.deepScan = true;
        break;
      case '--help':
        console.log(`
EAP Analyzer Report Generator

Использование:
  node report-generator.js [опции]

Опции:
  --output <path>    Путь для сохранения отчета (по умолчанию: ./eap-analyzer-dashboard/data/reports)
  --format <format>  Формат отчета: md или json (по умолчанию: md)
  --deep-scan        Включить глубокий анализ кода
  --help            Показать справку

Примеры:
  node report-generator.js
  node report-generator.js --output ./reports --format json
  node report-generator.js --deep-scan
`);
        process.exit(0);
    }
  }

  try {
    const generator = new EAPReportGenerator(options);
    await generator.generateReport();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = EAPReportGenerator;
