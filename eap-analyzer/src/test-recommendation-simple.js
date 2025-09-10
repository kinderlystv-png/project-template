/**
 * Простой тест RecommendationEngine
 */

// Импорт с расширениями для совместимости
const { RecommendationEngine } = require('./recommendations/RecommendationEngine.js');

async function testRecommendationEngine() {
  console.log('🧪 Простой тест RecommendationEngine...');

  try {
    // Тест с фиктивными данными
    const testContext = {
      type: 'dependency-vulnerability',
      severity: 'high',
      details: {
        packageName: 'lodash',
        currentVersion: '4.17.11',
        latestVersion: '4.17.21',
        vulnerability: 'CVE-2020-8203',
      },
    };

    console.log('📋 Генерируем рекомендацию для:', testContext);

    const recommendation = RecommendationEngine.generateRecommendation(testContext);

    if (recommendation) {
      console.log('✅ Рекомендация сгенерирована:');
      console.log(`   📌 Заголовок: ${recommendation.title}`);
      console.log(`   🎯 Категория: ${recommendation.category}`);
      console.log(`   ⚠️  Важность: ${recommendation.severity}`);
      console.log(`   ⏱️  Время: ${recommendation.estimatedTime}`);
      console.log(`   🔧 Шагов: ${recommendation.fixTemplate.steps.length}`);

      if (recommendation.fixTemplate.steps.length > 0) {
        console.log(`   📝 Первый шаг: ${recommendation.fixTemplate.steps[0]}`);
      }

      console.log('\n🎉 SUCCESS: RecommendationEngine работает корректно!');
      return true;
    } else {
      console.log('❌ Рекомендация не была сгенерирована');
      return false;
    }
  } catch (error) {
    console.error('💥 Ошибка:', error);
    return false;
  }
}

// Запуск теста
testRecommendationEngine()
  .then(success => {
    console.log('\n🏁 Тест завершен:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
