/**
 * Тест улучшенного FileStructureAnalyzer
 */

const { FileStructureAnalyzer } = require('./src/analyzers/structure/FileStructureAnalyzer.ts');

async function testEnhancedAnalyzer() {
  console.log('🔍 Тестирование улучшенного FileStructureAnalyzer...');

  try {
    const context = {
      projectPath: 'C:\\kinderly-events',
      options: {
        maxFiles: 1000,
        includePatterns: ['**/*'],
        excludePatterns: ['**/node_modules/**', '**/.git/**'],
      },
    };

    console.log('📁 Анализ проекта:', context.projectPath);
    const result = await FileStructureAnalyzer.checkComponent(context);

    console.log('\n📊 Результаты анализа:');
    console.log('Оценка:', result.score, '/', result.maxScore);
    console.log('Процент:', result.percentage + '%');

    console.log('\n✅ Пройденные проверки:', result.passed.length);
    result.passed.forEach(check => {
      console.log(`  - ${check.check.name}: ${check.score}/100`);
    });

    console.log('\n❌ Не пройденные проверки:', result.failed.length);
    result.failed.forEach(check => {
      console.log(`  - ${check.check.name}: ${check.score}/100`);
    });

    console.log('\n💡 Рекомендации:');
    result.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n⏱️ Время выполнения:', result.duration + 'мс');
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error(error.stack);
  }
}

testEnhancedAnalyzer();
