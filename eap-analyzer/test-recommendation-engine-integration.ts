import { RecommendationEngine } from './src/recommendations/RecommendationEngine';
import { SecurityChecker } from './src/checkers/security/SecurityChecker';
import { CheckContext } from './src/types/index.js';

/**
 * Тест интеграции веб-безопасности с RecommendationEngine
 * Проверяет полный поток: SecurityChecker → WebSecurity → RecommendationEngine
 */

async function testWebSecurityRecommendationEngineIntegration() {
  console.log('🧪 Тестирование интеграции веб-безопасности с RecommendationEngine...\n');

  const testCode = `
// XSS уязвимости
function displayUserData(userData) {
  document.getElementById('content').innerHTML = userData.name;
  document.body.innerHTML += \`<p>\${userData.comment}</p>\`;

  // eval с пользовательскими данными
  eval('var x = ' + userData.value);
}

// CSRF уязвимость
function transferMoney(amount, to) {
  fetch('/api/transfer', {
    method: 'POST',
    body: JSON.stringify({ amount, to })
  });
}

// Небезопасное создание элементов
function createLink(url) {
  document.write('<a href="' + url + '">Click me</a>');
  return '<script>alert("' + url + '")</script>';
}
`;

  try {
    // 1. Создаем контекст для проверки
    console.log('1️⃣ Подготовка контекста для анализа...');
    const context: CheckContext = {
      projectPath: process.cwd(),
      projectInfo: {
        name: 'test-project',
        version: '1.0.0',
        hasTypeScript: true,
        hasPackageJson: true,
        packageManager: 'npm',
        files: ['test.js'],
      },
      options: {
        includeTests: true,
        includeNodeModules: false,
        excludePatterns: [],
      },
    };

    // 2. Запускаем анализ безопасности
    console.log('2️⃣ Запуск анализа безопасности...');
    const securityResults = await SecurityChecker.checkComponent(context);

    console.log(`✅ Общий балл безопасности: ${securityResults.overallScore || 0}`);
    console.log(`🔍 Найдено проблем кода: ${securityResults.code?.issues?.length || 0}`);
    console.log(
      `🕷️ Найдено XSS уязвимостей: ${securityResults.webSecurity?.xssResults?.length || 0}`
    );
    console.log(
      `🛡️ Найдено CSRF уязвимостей: ${securityResults.webSecurity?.csrfResults?.length || 0}\n`
    );

    // 3. Генерируем рекомендации через RecommendationEngine
    console.log('3️⃣ Генерация рекомендаций через RecommendationEngine...');

    let webRecommendations: any[] = [];
    if (securityResults.webSecurity) {
      webRecommendations = RecommendationEngine.generateRecommendations(
        securityResults.webSecurity
      );
    }

    console.log(`📋 Сгенерировано веб-рекомендаций: ${webRecommendations.length}\n`);

    // 4. Проверяем качество рекомендаций
    console.log('4️⃣ Анализ качества рекомендаций...');

    const categories = [...new Set(webRecommendations.map((r: any) => r.category))];
    console.log(`🏷️ Категории: ${categories.join(', ')}`);

    const priorityStats = webRecommendations.reduce((stats: any, rec: any) => {
      stats[rec.priority] = (stats[rec.priority] || 0) + 1;
      return stats;
    }, {});
    console.log(`⭐ Приоритеты:`, priorityStats);

    // 5. Проверяем детали рекомендаций
    console.log('\n5️⃣ Детали первых 3 рекомендаций:');
    webRecommendations.slice(0, 3).forEach((rec: any, index: number) => {
      console.log(`\n📌 Рекомендация ${index + 1}: ${rec.title}`);
      console.log(`   💡 Описание: ${rec.description?.substring(0, 80)}...`);
      console.log(`   🎯 Категория: ${rec.category} | Приоритет: ${rec.priority}`);
      console.log(`   ⚠️ Серьезность: ${rec.severity} | Сложность: ${rec.difficulty}`);
      console.log(`   🔧 Шагов исправления: ${rec.fixTemplate?.steps?.length || 0}`);
      console.log(`   📚 Ресурсов: ${rec.documentation?.links?.length || 0}`);
      console.log(`   🏷️ Теги: ${rec.tags?.join(', ') || 'нет'}`);
    });

    // 6. Проверяем группировку по категориям
    console.log('\n6️⃣ Группировка рекомендаций по категориям...');
    const grouped = RecommendationEngine.groupRecommendationsByCategory(webRecommendations);

    Object.entries(grouped).forEach(([category, recs]: [string, any]) => {
      console.log(`📂 ${category}: ${recs.length} рекомендаций`);
    });

    // 7. Валидация структуры рекомендаций
    console.log('\n7️⃣ Валидация структуры рекомендаций...');

    const validationResults = webRecommendations.map((rec: any) => {
      const errors: string[] = [];

      if (!rec.id) errors.push('Отсутствует ID');
      if (!rec.title) errors.push('Отсутствует заголовок');
      if (!rec.description) errors.push('Отсутствует описание');
      if (!rec.category) errors.push('Отсутствует категория');
      if (!rec.severity) errors.push('Отсутствует серьезность');
      if (!rec.fixTemplate?.steps?.length) errors.push('Отсутствуют шаги исправления');

      return { id: rec.id, valid: errors.length === 0, errors };
    });

    const validCount = validationResults.filter(v => v.valid).length;
    console.log(`✅ Валидных рекомендаций: ${validCount}/${webRecommendations.length}`);

    const invalidRecs = validationResults.filter(v => !v.valid);
    if (invalidRecs.length > 0) {
      console.log('❌ Ошибки валидации:');
      invalidRecs.forEach(rec => {
        console.log(`   ${rec.id}: ${rec.errors.join(', ')}`);
      });
    }

    // 8. Итоговая статистика
    console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
    console.log(`🔍 Проанализированных строк кода: ${testCode.split('\n').length}`);
    console.log(`⚠️ Общий балл безопасности: ${securityResults.overallScore || 0}`);
    console.log(
      `🌐 Найдено веб-уязвимостей: ${(securityResults.webSecurity?.xssResults?.length || 0) + (securityResults.webSecurity?.csrfResults?.length || 0)}`
    );
    console.log(`💡 Сгенерировано рекомендаций: ${webRecommendations.length}`);
    console.log(`✅ Валидных рекомендаций: ${validCount}`);
    console.log(`🏷️ Уникальных категорий: ${categories.length}`);

    console.log('\n🎉 Тест интеграции веб-безопасности с RecommendationEngine успешно завершен!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка в тесте интеграции:', error);
    return false;
  }
} // Запускаем тест
testWebSecurityRecommendationEngineIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
      process.exit(0);
    } else {
      console.log('\n❌ ТЕСТЫ ПРОВАЛИЛИСЬ!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
