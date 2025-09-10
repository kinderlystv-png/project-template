/**
 * Demo: EAP v4.0 Unified Reporting System
 * Демонстрация работы унифицированной системы отчетов
 */

import { createEAPAnalyzerWithReporting } from './index';
import { Project } from './types/Project';
import {
  ReportFormat,
  UnifiedReportingSystem,
  MarkdownReporter,
  JSONReporter,
  HTMLReporter,
  TemplateEngine,
} from './reporters';

// Имитация проекта для демонстрации
const mockProject = {
  path: '/demo/project',
  name: 'Demo Project',
  getFileList: async () => ['src/index.ts', 'package.json', 'README.md'],
  getFileStats: async () => ({ size: 1024, mtime: new Date() }) as any,
  readFile: async () => 'console.log("Hello World");',
} as Project;

/**
 * Демонстрация базовых репортеров
 */
async function demoBasicReporters() {
  console.log('🔧 ФАЗА 2: Демонстрация базовых репортеров\n');

  // Создаем анализатор с поддержкой отчетов
  const { analyzer, generateReport } = createEAPAnalyzerWithReporting();

  // Имитируем результат анализа
  const mockAnalysis = {
    modules: {},
    checks: {
      SecurityChecker: {
        checker: 'SecurityChecker',
        category: 'security' as const,
        passed: true,
        score: 95,
        message: 'No security vulnerabilities found',
        timestamp: new Date(),
        recommendations: ['Consider implementing HTTPS headers'],
      },
      CodeQualityChecker: {
        checker: 'CodeQualityChecker',
        category: 'quality' as const,
        passed: false,
        score: 70,
        message: 'Code quality issues detected',
        timestamp: new Date(),
        recommendations: ['Fix ESLint errors', 'Add type annotations'],
      },
    },
    summary: {
      overallScore: 82.5,
      totalChecks: 2,
      passedChecks: 1,
      failedChecks: 1,
      categories: {
        quality: { score: 70, checks: 1, passed: 0 },
        security: { score: 95, checks: 1, passed: 1 },
        performance: { score: 0, checks: 0, passed: 0 },
        structure: { score: 0, checks: 0, passed: 0 },
      },
      criticalIssues: ['Code quality needs improvement'],
      recommendations: [
        'Consider implementing HTTPS headers',
        'Fix ESLint errors',
        'Add type annotations',
      ],
    },
    metadata: {
      version: '4.0.0',
      duration: 1500,
    },
  };

  try {
    // 1. Markdown отчет
    console.log('📝 Генерируем Markdown отчет...');
    const markdownReport = await generateReport(mockProject, mockAnalysis, 'markdown');
    console.log('✅ Markdown отчет создан');
    console.log('Превью:', markdownReport.content.substring(0, 200) + '...\n');

    // 2. JSON отчет
    console.log('📊 Генерируем JSON отчет...');
    const jsonReport = await generateReport(mockProject, mockAnalysis, 'json');
    console.log('✅ JSON отчет создан');
    console.log('Размер:', jsonReport.content.length, 'символов\n');

    // 3. HTML отчет
    console.log('🌐 Генерируем HTML отчет...');
    const htmlReport = await generateReport(mockProject, mockAnalysis, 'html');
    console.log('✅ HTML отчет создан');
    console.log('Содержит CSS:', htmlReport.content.includes('<style>') ? 'Да' : 'Нет');
    console.log(
      'Содержит интерактивность:',
      htmlReport.content.includes('<script>') ? 'Да' : 'Нет'
    );
  } catch (error) {
    console.error('❌ Ошибка при генерации отчетов:', error);
  }
}

/**
 * Демонстрация системы шаблонов
 */
async function demoTemplateEngine() {
  console.log('\n🎨 ФАЗА 1: Демонстрация TemplateEngine\n');

  const templateEngine = new TemplateEngine();

  // Простая замена переменных
  const simpleTemplate = 'Проект: {{projectName}}, Балл: {{score}}/100';
  const variables = { projectName: 'Demo Project', score: 85 };

  console.log('Шаблон:', simpleTemplate);
  console.log('Результат:', templateEngine.render(simpleTemplate, variables));

  // Условные блоки
  const conditionalTemplate = `
{{#if score}}
✅ Балл: {{score}}/100
{{/if}}
{{#if recommendations}}
💡 Есть рекомендации для улучшения
{{/if}}`;

  console.log('\nУсловный шаблон:', conditionalTemplate.trim());
  console.log(
    'Результат:',
    templateEngine
      .render(conditionalTemplate, {
        score: 85,
        recommendations: ['Fix bugs', 'Add tests'],
      })
      .trim()
  );

  // Циклы
  const loopTemplate = `
Рекомендации:
{{#each recommendations}}
- {{@item}}
{{/each}}`;

  console.log('\nШаблон с циклом:', loopTemplate.trim());
  console.log(
    'Результат:',
    templateEngine
      .render(loopTemplate, {
        recommendations: [
          'Улучшить безопасность',
          'Добавить тесты',
          'Оптимизировать производительность',
        ],
      })
      .trim()
  );

  // Стандартные шаблоны
  console.log('\n📋 Доступные стандартные шаблоны:');
  const standardTemplates = TemplateEngine.getStandardTemplates();
  console.log('- Markdown:', Object.keys(standardTemplates.markdown).join(', '));
  console.log('- HTML:', Object.keys(standardTemplates.html).join(', '));
}

/**
 * Демонстрация унифицированной системы отчетов
 */
async function demoUnifiedReporting() {
  console.log('\n🔄 УНИФИЦИРОВАННАЯ СИСТЕМА: Генерация всех форматов\n');

  const unifiedSystem = new UnifiedReportingSystem({
    formats: [ReportFormat.MARKDOWN, ReportFormat.JSON, ReportFormat.HTML],
    outputDir: 'reports/demo',
    includeExecutiveSummary: true,
  });

  // Имитируем данные отчета
  const reportData = {
    projectName: 'Demo Project v4.0',
    analysisDate: new Date(),
    version: '4.0.0',
    summary: {
      score: 87,
      grade: 'B',
      passedChecks: 8,
      failedChecks: 2,
      recommendations: 5,
      analysisTime: 2500,
    },
    sections: [
      {
        title: 'Безопасность',
        description: 'Анализ уязвимостей и безопасности кода',
        score: 95,
        items: [
          {
            type: 'success' as const,
            title: 'HTTPS Configuration',
            description: 'Правильная настройка HTTPS',
            severity: 'low' as const,
            recommendations: [],
          },
        ],
      },
      {
        title: 'Качество кода',
        description: 'Проверка стиля кода и архитектуры',
        score: 78,
        items: [
          {
            type: 'warning' as const,
            title: 'ESLint Warnings',
            description: 'Найдены предупреждения ESLint',
            severity: 'medium' as const,
            recommendations: ['Исправить предупреждения ESLint', 'Настроить prettier'],
          },
        ],
      },
    ],
    metadata: {
      environment: 'Node.js v18',
      tools: ['ESLint', 'TypeScript', 'Jest'],
    },
  };

  try {
    const result = await unifiedSystem.generateUnifiedReport(mockProject, reportData);

    console.log('📈 Результаты унифицированной генерации:');
    console.log('- Всего отчетов:', result.summary.totalReports);
    console.log('- Форматы:', result.summary.formats.join(', '));
    console.log('- Время генерации:', result.summary.generatedAt.toLocaleTimeString());
    console.log(
      '- Ошибки:',
      result.summary.errors.length ? result.summary.errors.join(', ') : 'Нет'
    );

    // Показываем, какие файлы созданы
    console.log('\n📁 Созданные файлы:');
    result.reports.forEach((report, format) => {
      console.log(`- ${format}: ${report.filePath || 'in-memory'}`);
    });
  } catch (error) {
    console.error('❌ Ошибка унифицированной генерации:', error);
  }
}

/**
 * Главная демонстрационная функция
 */
async function runDemo() {
  console.log('🚀 EAP v4.0 Unified Reporting System Demo\n');
  console.log('=========================================\n');

  try {
    await demoTemplateEngine();
    await demoBasicReporters();
    await demoUnifiedReporting();

    console.log('\n✨ Демонстрация завершена успешно!');
    console.log('\n📋 ИТОГИ ФАЗЫ 1-2:');
    console.log('✅ TemplateEngine с поддержкой переменных, условий и циклов');
    console.log('✅ BaseReporter с интеграцией шаблонов');
    console.log('✅ MarkdownReporter с улучшенным форматированием');
    console.log('✅ JSONReporter с поддержкой пользовательских схем');
    console.log('✅ HTMLReporter с CSS и интерактивностью');
    console.log('✅ AnalysisReportAdapter для интеграции с EAP');
    console.log('✅ UnifiedReportingSystem для комплексной генерации');
    console.log('✅ Полная интеграция с главным модулем EAP v4.0');
  } catch (error) {
    console.error('\n❌ Ошибка выполнения демо:', error);
  }
}

// Запускаем демо, если файл выполняется напрямую
if (require.main === module) {
  runDemo();
}

export { runDemo, demoBasicReporters, demoTemplateEngine, demoUnifiedReporting };
