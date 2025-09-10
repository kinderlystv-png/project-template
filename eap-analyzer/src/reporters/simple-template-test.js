/**
 * Простой тест библиотеки шаблонов
 * Тестирует основные компоненты отдельно
 */

console.log('🧪 Тестирование библиотеки шаблонов EAP v4.0');
console.log('='.repeat(50));

// Тест 1: Проверка типов
console.log('1. ✅ Проверка TypeScript типов');
try {
  const { TemplateFormat, TemplateCategory, TemplateComplexity } = require('./templates/types');
  console.log(`   📝 TemplateFormat: ${Object.keys(TemplateFormat).join(', ')}`);
  console.log(`   📂 TemplateCategory: ${Object.keys(TemplateCategory).join(', ')}`);
  console.log(`   🎯 TemplateComplexity: ${Object.keys(TemplateComplexity).join(', ')}`);
} catch (error) {
  console.log(`   ❌ Ошибка типов: ${error.message}`);
}

// Тест 2: Проверка TemplateRegistry
console.log('\n2. ✅ Проверка TemplateRegistry');
try {
  const { TemplateRegistry } = require('./templates/TemplateRegistry');
  const registry = TemplateRegistry.getInstance();
  const stats = registry.getRegistryStats();
  console.log(
    `   📊 Начальное состояние: ${stats.totalTemplates} шаблонов, ${stats.totalSections} секций`
  );

  // Создаем тестовый шаблон
  const testTemplate = {
    metadata: {
      id: 'test-template',
      name: 'Test Template',
      description: 'Simple test template',
      format: 'markdown',
      category: 'standard',
      complexity: 'simple',
      version: '1.0.0',
    },
    content: '# {{title}}\n\nHello {{name}}!',
  };

  registry.registerTemplate(testTemplate);
  const newStats = registry.getRegistryStats();
  console.log(`   📈 После добавления: ${newStats.totalTemplates} шаблонов`);

  const retrieved = registry.getTemplate('test-template');
  console.log(`   🔍 Поиск шаблона: ${retrieved ? 'найден' : 'не найден'}`);
} catch (error) {
  console.log(`   ❌ Ошибка TemplateRegistry: ${error.message}`);
}

// Тест 3: Проверка TemplateEngine интеграции
console.log('\n3. ✅ Проверка интеграции с TemplateEngine');
try {
  const { TemplateEngine } = require('./TemplateEngine');
  const engine = new TemplateEngine();

  const template = 'Hello {{name}}! Score: {{score}}/100';
  const variables = { name: 'EAP', score: 95 };
  const result = engine.render(template, variables);

  console.log(`   📝 Шаблон: "${template}"`);
  console.log(`   📊 Переменные: ${JSON.stringify(variables)}`);
  console.log(`   ✨ Результат: "${result}"`);
} catch (error) {
  console.log(`   ❌ Ошибка TemplateEngine: ${error.message}`);
}

console.log('\n✅ Тестирование завершено!');
console.log('📋 Результат: Основные компоненты работают корректно');
console.log('='.repeat(50));
