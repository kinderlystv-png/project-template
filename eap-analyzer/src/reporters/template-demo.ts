/**
 * Тестовый демо для библиотеки шаблонов
 * Демонстрирует основные возможности TemplateManager
 */

import { initializeTemplateLibrary, TemplateFormat, TemplateCategory } from './templates/index';

/**
 * Основная демо-функция
 */
export async function templateLibraryDemo(): Promise<void> {
  console.log('🚀 Демонстрация библиотеки шаблонов EAP v4.0');
  console.log('='.repeat(50));

  try {
    // Инициализируем библиотеку
    console.log('1. Инициализация библиотеки шаблонов...');
    const manager = await initializeTemplateLibrary();
    console.log('✅ Библиотека инициализирована!');

    // Получаем статистику
    console.log('\n2. Статистика загруженных шаблонов:');
    const stats = manager.getManagerStats();
    console.log(`   📊 Всего шаблонов: ${stats.registry.totalTemplates}`);
    console.log(`   📄 Всего секций: ${stats.registry.totalSections}`);
    console.log(`   💾 Размер кэша: ${stats.registry.cacheSize}`);

    console.log('\n   По форматам:');
    Object.entries(stats.registry.byFormat).forEach(([format, count]) => {
      console.log(`   - ${format}: ${count} шаблонов`);
    });

    // Показываем доступные шаблоны
    console.log('\n3. Доступные шаблоны:');

    // Markdown шаблоны
    const markdownTemplates = manager.getAvailableTemplates(TemplateFormat.MARKDOWN);
    console.log(`\n   📝 Markdown (${markdownTemplates.length}):`);
    markdownTemplates.forEach(template => {
      console.log(`   - ${template.metadata.id}: ${template.metadata.name}`);
      console.log(`     ${template.metadata.description}`);
    });

    // JSON шаблоны
    const jsonTemplates = manager.getAvailableTemplates(TemplateFormat.JSON);
    console.log(`\n   🔧 JSON (${jsonTemplates.length}):`);
    jsonTemplates.forEach(template => {
      console.log(`   - ${template.metadata.id}: ${template.metadata.name}`);
      console.log(`     ${template.metadata.description}`);
    });

    // HTML шаблоны
    const htmlTemplates = manager.getAvailableTemplates(TemplateFormat.HTML);
    console.log(`\n   🌐 HTML (${htmlTemplates.length}):`);
    htmlTemplates.forEach(template => {
      console.log(`   - ${template.metadata.id}: ${template.metadata.name}`);
      console.log(`     ${template.metadata.description}`);
    });

    // Тестируем предварительный просмотр
    console.log('\n4. Тестируем предварительный просмотр:');

    // Краткий Markdown отчет
    console.log('\n   📝 Markdown Summary Report:');
    const markdownPreview = await manager.previewTemplate('markdown-summary-report');
    if (markdownPreview.success) {
      console.log('   ✅ Успешно сгенерирован!');
      console.log(`   ⏱️ Время рендеринга: ${markdownPreview.renderTime}ms`);
      console.log('   Первые 200 символов:');
      console.log('   ' + markdownPreview.content!.substring(0, 200) + '...');
    } else {
      console.log('   ❌ Ошибка:', markdownPreview.error);
    }

    // Минимальный JSON отчет
    console.log('\n   🔧 JSON Minimal Report:');
    const jsonPreview = await manager.previewTemplate('json-minimal-report');
    if (jsonPreview.success) {
      console.log('   ✅ Успешно сгенерирован!');
      console.log(`   ⏱️ Время рендеринга: ${jsonPreview.renderTime}ms`);
      console.log('   Содержимое:');
      try {
        const formatted = JSON.stringify(JSON.parse(jsonPreview.content!), null, 2);
        console.log(
          '   ' +
            formatted
              .split('\n')
              .map(line => '   ' + line)
              .join('\n')
        );
      } catch {
        console.log('   ' + jsonPreview.content);
      }
    } else {
      console.log('   ❌ Ошибка:', jsonPreview.error);
    }

    // Поиск шаблонов
    console.log('\n5. Поиск шаблонов:');

    // Поиск по категории
    const standardTemplates = manager.getTemplatesByCategory(TemplateCategory.STANDARD);
    console.log(`\n   🎯 Стандартные шаблоны (${standardTemplates.length}):`);
    standardTemplates.forEach(template => {
      console.log(`   - ${template.metadata.name} (${template.metadata.format})`);
    });

    // Поиск по тегам
    const searchResult = manager.searchTemplates({
      tags: ['summary', 'brief'],
      includeCustom: false,
    });
    console.log(
      `\n   🔍 Поиск по тегам 'summary', 'brief': ${searchResult.totalCount} результатов`
    );
    searchResult.templates.forEach(template => {
      console.log(`   - ${template.metadata.name}: ${template.metadata.tags?.join(', ')}`);
    });

    // Рекомендуемые шаблоны
    console.log('\n6. Рекомендуемые шаблоны:');
    const recommended = manager.getRecommendedTemplates(TemplateFormat.MARKDOWN);
    console.log(`\n   💡 Рекомендуемые Markdown шаблоны (${recommended.length}):`);
    recommended.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.metadata.name}`);
      console.log(`      Сложность: ${template.metadata.complexity}`);
      console.log(`      Теги: ${template.metadata.tags?.join(', ') || 'нет'}`);
    });

    console.log('\n✅ Демо завершено успешно!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Ошибка во время демо:', error);
    throw error;
  }
}

/**
 * Запуск демо если файл выполняется напрямую
 */
if (require.main === module) {
  templateLibraryDemo().catch(console.error);
}
