/**
 * Демонстрация системы шаблонов EAP v4.0 Stage 4
 * Показывает все возможности новой системы шаблонов
 */

import { TemplateManager } from './TemplateManager';
import { TemplateFormat, TemplateCategory, TemplateComplexity } from './types';

/**
 * Демонстрирует основные возможности системы шаблонов
 */
async function demonstrateTemplateSystem() {
  console.log('🎯 Демонстрация системы шаблонов EAP v4.0 Stage 4\n');

  // 1. Инициализация системы
  console.log('1️⃣ Инициализация TemplateManager...');
  const templateManager = new TemplateManager();
  await templateManager.initialize();
  console.log('✅ Система шаблонов инициализирована\n');

  // 2. Просмотр доступных шаблонов
  console.log('2️⃣ Просмотр встроенных шаблонов:');
  const searchResult = await templateManager.searchTemplates({
    format: TemplateFormat.MARKDOWN,
  });

  console.log(`Найдено шаблонов: ${searchResult.totalCount}`);
  searchResult.templates.forEach(template => {
    console.log(`  📄 ${template.metadata.name} (${template.metadata.category})`);
    console.log(`     ${template.metadata.description}`);
    console.log(`     Сложность: ${template.metadata.complexity}\n`);
  });

  // 3. Компиляция шаблона
  console.log('3️⃣ Компиляция шаблона:');
  const testData = {
    projectName: 'Демо проект',
    analysisDate: new Date().toLocaleDateString('ru-RU'),
    version: '4.0',
    summary: {
      score: 87.5,
      grade: 'B',
      passedChecks: 42,
      failedChecks: 8,
      recommendations: 15,
    },
    sections: [
      {
        title: 'Архитектура',
        score: 90,
        status: 'good',
        items: [
          {
            title: 'Модульность',
            type: 'success',
            description: 'Код хорошо разделен на модули',
          },
          {
            title: 'Связанность',
            type: 'warning',
            description: 'Некоторые модули слишком связаны',
          },
        ],
      },
      {
        title: 'Качество кода',
        score: 85,
        status: 'good',
        items: [
          {
            title: 'Читаемость',
            type: 'success',
            description: 'Код легко читается',
          },
        ],
      },
    ],
  };

  const compiled = await templateManager.compileTemplate('markdown-standard', testData);
  if (compiled) {
    console.log('✅ Шаблон успешно скомпилирован');
    console.log('📄 Результат:');
    console.log('─'.repeat(50));
    console.log(compiled.content.substring(0, 500) + '...');
    console.log('─'.repeat(50));
  }

  // 4. Предварительный просмотр
  console.log('\n4️⃣ Предварительный просмотр HTML шаблона:');
  const preview = await templateManager.previewTemplate('html-standard', testData);
  if (preview.success) {
    console.log('✅ Превью сгенерировано успешно');
    console.log(`⏱️ Время рендеринга: ${preview.renderTime}мс`);
  }

  // 5. Статистика использования
  console.log('\n5️⃣ Статистика использования шаблонов:');
  const stats = templateManager.getUsageStatistics();
  stats.forEach(stat => {
    console.log(`  📊 ${stat.id}: ${stat.usageCount} использований`);
  });

  // 6. Поиск шаблонов по категориям
  console.log('\n6️⃣ Поиск шаблонов для JSON отчетов:');
  const jsonTemplates = await templateManager.searchTemplates({
    format: TemplateFormat.JSON,
    category: TemplateCategory.STANDARD,
  });

  console.log(`Найдено JSON шаблонов: ${jsonTemplates.totalCount}`);
  jsonTemplates.templates.forEach(template => {
    console.log(`  🔧 ${template.metadata.name}`);
  });

  console.log('\n🎉 Демонстрация завершена!');
}

/**
 * Демонстрирует продвинутые возможности
 */
async function demonstrateAdvancedFeatures() {
  console.log('\n🚀 Продвинутые возможности системы шаблонов\n');

  const templateManager = new TemplateManager();
  await templateManager.initialize();

  // Поиск специализированных шаблонов
  console.log('🔍 Поиск специализированных шаблонов:');
  const specializedSearch = await templateManager.searchTemplates({
    category: TemplateCategory.TECHNICAL,
    complexity: TemplateComplexity.ADVANCED,
  });

  console.log(`Найдено специализированных шаблонов: ${specializedSearch.totalCount}`);

  // Демонстрация кэширования
  console.log('\n💾 Демонстрация кэширования:');
  const startTime = Date.now();
  await templateManager.compileTemplate('markdown-standard', { projectName: 'Test' });
  const firstCompileTime = Date.now() - startTime;

  const cacheStartTime = Date.now();
  await templateManager.compileTemplate('markdown-standard', { projectName: 'Test' });
  const cachedCompileTime = Date.now() - cacheStartTime;

  console.log(`⏱️ Первая компиляция: ${firstCompileTime}мс`);
  console.log(`⚡ Компиляция с кэшем: ${cachedCompileTime}мс`);
  console.log(`🚀 Ускорение: ${Math.round(firstCompileTime / cachedCompileTime)}x`);
}

// Запуск демонстрации
if (require.main === module) {
  demonstrateTemplateSystem()
    .then(() => demonstrateAdvancedFeatures())
    .catch(console.error);
}

export { demonstrateTemplateSystem, demonstrateAdvancedFeatures };
