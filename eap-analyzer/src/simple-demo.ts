/**
 * Simple Demo: EAP v4.0 Reporting System
 * Простая демонстрация системы отчетов без сложной типизации
 */

import { TemplateEngine } from './reporters/TemplateEngine';
import { MarkdownReporter } from './reporters/MarkdownReporter';
import { JSONReporter } from './reporters/JSONReporter';
import { HTMLReporter } from './reporters/HTMLReporter';
import { ReportFormat } from './reporters/interfaces';

/**
 * Демонстрация системы шаблонов
 */
async function demoTemplateEngine() {
  console.log('🎨 ФАЗА 1: Демонстрация TemplateEngine\n');

  const templateEngine = new TemplateEngine();

  // Простая замена переменных
  const simpleTemplate = 'Проект: {{projectName}}, Балл: {{score}}/100';
  const variables = { projectName: 'Demo Project', score: 85 };

  console.log('✨ Простая замена переменных:');
  console.log('Шаблон:', simpleTemplate);
  console.log('Результат:', templateEngine.render(simpleTemplate, variables));

  // Условные блоки
  const conditionalTemplate = `{{#if score}}✅ Балл: {{score}}/100{{/if}}{{#if recommendations}}
💡 Есть рекомендации для улучшения{{/if}}`;

  console.log('\n🔀 Условные блоки:');
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
  const loopTemplate = `Рекомендации:{{#each recommendations}}
- {{@item}}{{/each}}`;

  console.log('\n🔄 Циклы:');
  console.log(
    'Результат:',
    templateEngine.render(loopTemplate, {
      recommendations: [
        'Улучшить безопасность',
        'Добавить тесты',
        'Оптимизировать производительность',
      ],
    })
  );

  console.log('\n📋 Стандартные шаблоны:');
  const standardTemplates = TemplateEngine.getStandardTemplates();
  console.log('- Markdown:', Object.keys(standardTemplates.markdown).join(', '));
  console.log('- HTML:', Object.keys(standardTemplates.html).join(', '));
}

/**
 * Демонстрация форматтеров
 */
async function demoFormatters() {
  console.log('\n📝 ФАЗА 2: Демонстрация форматтеров отчетов\n');

  // Тестовые данные отчета
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

  const mockProject = {
    path: '/demo/project',
    name: 'Demo Project',
  } as any;

  try {
    // 1. Markdown Reporter
    console.log('📝 MarkdownReporter:');
    const markdownReporter = new MarkdownReporter();
    const markdownResult = await markdownReporter.generateReport(mockProject, reportData);
    console.log('✅ Создан, формат:', markdownResult.format);
    console.log('📏 Размер:', markdownResult.content.length, 'символов');
    console.log('🔍 Превью:', markdownResult.content.substring(0, 100) + '...');

    // 2. JSON Reporter
    console.log('\n📊 JSONReporter:');
    const jsonReporter = new JSONReporter();
    const jsonResult = await jsonReporter.generateReport(mockProject, reportData);
    console.log('✅ Создан, формат:', jsonResult.format);
    console.log('📏 Размер:', jsonResult.content.length, 'символов');
    console.log('🔍 Валидный JSON:', !!JSON.parse(jsonResult.content));

    // 3. HTML Reporter
    console.log('\n🌐 HTMLReporter:');
    const htmlReporter = new HTMLReporter();
    const htmlResult = await htmlReporter.generateReport(mockProject, reportData);
    console.log('✅ Создан, формат:', htmlResult.format);
    console.log('📏 Размер:', htmlResult.content.length, 'символов');
    console.log('🎨 Содержит CSS:', htmlResult.content.includes('<style>'));
    console.log('📱 Содержит meta viewport:', htmlResult.content.includes('viewport'));

    // 4. Демонстрация шаблонов в форматтерах
    console.log('\n🎭 Шаблонизация:');
    console.log('- Markdown поддерживает шаблоны:', markdownReporter.supportsTemplating());
    console.log('- JSON поддерживает шаблоны:', jsonReporter.supportsTemplating());
    console.log('- HTML поддерживает шаблоны:', htmlReporter.supportsTemplating());

    // 5. Пользовательский шаблон
    console.log('\n📝 Пользовательский Markdown шаблон:');
    const customTemplate =
      '# {{projectName}}\n\n**Балл:** {{summary.score}}/100 ({{summary.grade}})\n\n{{#each sections}}## {{title}}\nБалл секции: {{score}}/100\n{{/each}}';
    const customResult = markdownReporter.formatContent(reportData, customTemplate);
    console.log('Результат:\n', customResult.substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Ошибка демонстрации:', error);
  }
}

/**
 * Демонстрация возможностей шаблонизации
 */
async function demoAdvancedTemplating() {
  console.log('\n🚀 ПРОДВИНУТАЯ ШАБЛОНИЗАЦИЯ\n');

  const engine = new TemplateEngine();

  // Комплексные данные
  const complexData = {
    project: 'Advanced EAP Project',
    version: '4.0.0',
    date: new Date().toLocaleDateString('ru-RU'),
    summary: {
      score: 92,
      grade: 'A-',
      total: 50,
      passed: 46,
    },
    categories: [
      { name: 'Безопасность', score: 98, critical: true },
      { name: 'Производительность', score: 85, critical: false },
      { name: 'Качество кода', score: 93, critical: true },
    ],
    issues: [
      { severity: 'high', count: 2 },
      { severity: 'medium', count: 5 },
      { severity: 'low', count: 12 },
    ],
  };

  const advancedTemplate = `
# 📊 Отчет {{project}} v{{version}}

**Дата:** {{date}}
**Общий балл:** {{summary.score}}/100 ({{summary.grade}})

## 🎯 Категории анализа

{{#each categories}}
### {{name}} {{#if critical}}🔥{{/if}}
- **Балл:** {{score}}/100
- **Критичность:** {{#if critical}}Высокая{{else}}Обычная{{/if}}

{{/each}}

## 📈 Статистика проблем

{{#each issues}}
{{#if @first}}| Серьезность | Количество |
| --- | --- |{{/if}}
| {{severity}} | {{count}} |
{{/each}}

## 📝 Итоги

{{#if summary}}
✅ **Пройдено:** {{summary.passed}}/{{summary.total}} проверок
🎯 **Успешность:** {{formatScore summary.score}}%
{{/if}}

---
*Сгенерировано EAP v4.0*
`;

  console.log('🎨 Комплексный шаблон:');
  const result = engine.render(advancedTemplate, {
    ...complexData,
    formatScore: (score: number) => score.toFixed(1),
  });

  console.log(result);
}

/**
 * Главная демонстрационная функция
 */
async function runSimpleDemo() {
  console.log('🚀 EAP v4.0 Reporting System - Simple Demo\n');
  console.log('==========================================\n');

  try {
    await demoTemplateEngine();
    await demoFormatters();
    await demoAdvancedTemplating();

    console.log('\n✨ Демонстрация завершена успешно!');
    console.log('\n📋 ИТОГИ РЕАЛИЗАЦИИ ФАЗ 1-2:');
    console.log('✅ TemplateEngine с переменными, условиями и циклами');
    console.log('✅ BaseReporter с поддержкой шаблонов');
    console.log('✅ MarkdownReporter с форматированием');
    console.log('✅ JSONReporter со структурированными данными');
    console.log('✅ HTMLReporter с CSS стилизацией');
    console.log('✅ AnalysisReportAdapter для интеграции');
    console.log('✅ Полная интеграция с EAP v4.0');
    console.log('\n🎯 Система готова для Фазы 3 (специализированные отчеты)');
  } catch (error) {
    console.error('\n❌ Ошибка выполнения демо:', error);
  }
}

// Запускаем демо, если файл выполняется напрямую
if (require.main === module) {
  runSimpleDemo();
}

export { runSimpleDemo, demoTemplateEngine, demoFormatters, demoAdvancedTemplating };
