#!/usr/bin/env node

/**
 * EAP Analyzer Report Generator (CommonJS версия)
 * Автоматический генератор актуальных отчетов на основе анализа кодовой базы
 */

const fs = require('fs').promises;
const path = require('path');

class EAPReportGenerator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.eapAnalyzerPath = path.join(this.projectRoot, 'eap-analyzer');
    this.outputPath =
      options.outputPath ||
      path.join(this.projectRoot, 'eap-analyzer-dashboard', 'data', 'reports');
    this.format = options.format || 'md';

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
      console.log('📂 Сканирование файловой структуры...');
      const components = await this.scanComponents();

      console.log('🔍 Анализ кода и вычисление метрик...');
      const analyzedComponents = await this.analyzeComponents(components);

      console.log('📊 Сбор статистики...');
      const statistics = this.calculateStatistics(analyzedComponents);

      console.log('📝 Генерация отчета...');
      const report = await this.createReport(analyzedComponents, statistics);

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `EAP-ANALYZER-REPORT-${timestamp}.${this.format}`;
      const outputFile = path.join(this.outputPath, filename);

      await this.ensureDirectoryExists(this.outputPath);
      await fs.writeFile(outputFile, report, 'utf8');

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

      return { components: analyzedComponents, statistics, outputFile, timestamp };
    } catch (error) {
      console.error('❌ Ошибка генерации отчета:', error.message);
      throw error;
    }
  }

  /**
   * Сканирование компонентов
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
          logic: 0,
          functionality: 0,
          description: '',
          lastModified: null,
        };
      }

      return components;
    } catch (error) {
      console.warn('⚠️ Директория eap-analyzer не найдена:', error.message);
      return {};
    }
  }

  /**
   * Анализ компонентов
   */
  async analyzeComponents(components) {
    for (const [name, component] of Object.entries(components)) {
      try {
        const stats = await fs.stat(component.fullPath);
        component.lastModified = stats.mtime;
        component.size = stats.size;

        const content = await fs.readFile(component.fullPath, 'utf8');
        const analysis = this.analyzeCode(content);

        Object.assign(component, analysis);

        const metrics = this.calculateReadinessMetrics(component, content);
        component.logic = metrics.logic;
        component.functionality = metrics.functionality;
      } catch (error) {
        console.warn(`⚠️ Ошибка анализа ${name}:`, error.message);
      }
    }

    return components;
  }

  /**
   * Анализ кода
   */
  analyzeCode(content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

    const functionMatches =
      content.match(/(function\s+\w+|const\s+\w+\s*=\s*\(?|class\s+\w+|async\s+function)/g) || [];
    const classMatches = content.match(/class\s+\w+/g) || [];

    let description = this.extractDescription(content) || this.generateAutoDescription(content);

    return {
      lines: nonEmptyLines,
      functions: functionMatches.length,
      classes: classMatches.length,
      description: description.slice(0, 200),
    };
  }

  /**
   * Извлечение описания из комментариев
   */
  extractDescription(content) {
    const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (commentMatch) {
      const lines = commentMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@'))
        .slice(0, 2);
      return lines.join(' ');
    }
    return '';
  }

  /**
   * Автогенерация описания
   */
  generateAutoDescription(content) {
    if (content.includes('class')) return 'Класс-анализатор системы';
    if (content.includes('function')) return 'Функциональный модуль';
    if (content.includes('async')) return 'Асинхронный компонент';
    return 'Модуль системы анализа';
  }

  /**
   * Вычисление метрик готовности
   */
  calculateReadinessMetrics(component, content) {
    let logicScore = 0;
    let functionalityScore = 0;

    // Базовая оценка
    const sizeScore = Math.min((component.lines / 100) * 30, 30);
    const functionScore = Math.min((component.functions / 10) * 20, 20);
    const classScore = Math.min((component.classes / 3) * 15, 15);

    logicScore = sizeScore + functionScore + classScore;

    // Дополнительные факторы
    if (content.includes('async') && content.includes('await')) logicScore += 10;
    if (content.includes('try') && content.includes('catch')) logicScore += 8;
    if (content.includes('class') && content.includes('constructor')) logicScore += 12;
    if (content.includes('module.exports') || content.includes('export')) logicScore += 5;

    functionalityScore = logicScore * 0.8;

    if (content.includes('test') || content.includes('describe')) functionalityScore += 10;
    if (content.includes('console.log') || content.includes('logger')) functionalityScore += 5;

    // Категорийные модификаторы
    const multipliers = {
      testing: { logic: 1.1, functionality: 1.2 },
      security: { logic: 1.05, functionality: 1.1 },
      ai: { logic: 1.15, functionality: 1.1 },
    };

    const multiplier = multipliers[component.category] || { logic: 1.0, functionality: 1.0 };
    logicScore *= multiplier.logic;
    functionalityScore *= multiplier.functionality;

    return {
      logic: Math.min(Math.max(Math.round(logicScore), 10), 98),
      functionality: Math.min(Math.max(Math.round(functionalityScore), 5), 95),
    };
  }

  /**
   * Определение категории
   */
  determineCategory(filePath, componentName) {
    const pathLower = filePath.toLowerCase();
    const nameLower = componentName.toLowerCase();

    if (pathLower.includes('test') || nameLower.includes('test') || nameLower.includes('jest'))
      return 'testing';
    if (pathLower.includes('security') || nameLower.includes('security')) return 'security';
    if (pathLower.includes('performance') || nameLower.includes('performance'))
      return 'performance';
    if (pathLower.includes('docker') || nameLower.includes('docker')) return 'docker';
    if (pathLower.includes('ai') || nameLower.includes('ai')) return 'ai';
    if (pathLower.includes('core') || pathLower.includes('orchestrator')) return 'core';
    if (pathLower.includes('architecture')) return 'architecture';
    if (nameLower.includes('dependencies')) return 'dependencies';
    if (nameLower.includes('logging')) return 'logging';
    if (nameLower.includes('quality')) return 'code-quality';

    return 'core';
  }

  /**
   * Извлечение имени компонента
   */
  extractComponentName(filePath) {
    return path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, '');
  }

  /**
   * Статистика
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

    let ready = 0,
      inProgress = 0,
      planned = 0;
    componentList.forEach(comp => {
      const overall = (comp.logic + comp.functionality) / 2;
      if (overall >= 90) ready++;
      else if (overall >= 50) inProgress++;
      else planned++;
    });

    const categories = {};
    componentList.forEach(comp => {
      if (!categories[comp.category]) {
        categories[comp.category] = { count: 0, avgLogic: 0, avgFunctionality: 0 };
      }
      categories[comp.category].count++;
      categories[comp.category].avgLogic += comp.logic;
      categories[comp.category].avgFunctionality += comp.functionality;
    });

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
   * Создание отчета
   */
  async createReport(components, statistics) {
    const timestamp = new Date().toLocaleDateString('ru-RU');
    const componentsByCategory = this.groupByCategory(components);

    let report = `# 📋 EAP ANALYZER - ПОЛНЫЙ КАТАЛОГ КОМПОНЕНТОВ

*Автоматически сгенерирован: ${timestamp}*

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

    for (const [categoryKey, categoryComponents] of Object.entries(componentsByCategory)) {
      const categoryInfo = this.categories[categoryKey];
      const categoryStats = statistics.categories[categoryKey];

      if (!categoryInfo || !categoryStats) continue;

      report += `### ${Object.keys(componentsByCategory).indexOf(categoryKey) + 1}. ${categoryInfo.icon} **${categoryInfo.name.toUpperCase()}** [${categoryStats.avgLogic}% / ${categoryStats.avgFunctionality}%]

*Приоритет: ${categoryInfo.priority} | Компонентов: ${categoryStats.count}*

`;

      categoryComponents.forEach(component => {
        report += `#### ${component.name}
- **Готовность логики:** ${component.logic}%
- **Функциональность:** ${component.functionality}%
- **Файл:** \`${component.file}\`
- **Описание:** ${component.description}
- **Строк кода:** ${component.lines}
- **Функций:** ${component.functions}

`;
      });

      report += `---

`;
    }

    report += `## История изменений

### ${timestamp}
- Автоматически сгенерированный отчет
- Проанализировано ${statistics.total} компонентов
- Средняя готовность: ${statistics.avgLogic.toFixed(1)}% / ${statistics.avgFunctionality.toFixed(1)}%

---

*Отчет создан системой EAP Analyzer Report Generator*
`;

    return report;
  }

  /**
   * Группировка по категориям
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

    Object.values(grouped).forEach(categoryComponents => {
      categoryComponents.sort((a, b) => {
        const overallA = (a.logic + a.functionality) / 2;
        const overallB = (b.logic + b.functionality) / 2;
        return overallB - overallA;
      });
    });

    return grouped;
  }

  /**
   * Получение всех файлов
   */
  async getAllFiles(dir, extensions = []) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Пропускаем системные и временные директории
        if (entry.isDirectory()) {
          if (
            entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === 'build'
          ) {
            continue;
          }
          const subFiles = await this.getAllFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.length === 0 || extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Игнорируем недоступные директории
    }

    return files;
  }

  /**
   * Создание директории
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// Запуск
async function main() {
  try {
    const generator = new EAPReportGenerator();
    await generator.generateReport();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EAPReportGenerator;
