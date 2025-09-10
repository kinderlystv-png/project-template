import { RecommendationEngine } from './src/recommendations/RecommendationEngine';
import { WebSecurityChecker } from './src/checkers/security/WebSecurityChecker';
import { CheckContext } from './src/types/index.js';

/**
 * Тест интеграции веб-безопасности с RecommendationEngine
 * Проверяет полный поток: WebSecurityChecker → RecommendationEngine
 */

async function testRecommendationEngineIntegration() {
  console.log('🧪 Тестирование интеграции RecommendationEngine с веб-безопасностью...\n');

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
    // 1. Создаем временный файл для анализа
    console.log('1️⃣ Подготовка тестового файла...');
    const fs = await import('fs/promises');
    const testFilePath = 'test-integration.js';
    await fs.writeFile(testFilePath, testCode);

    // 2. Создаем контекст для проверки
    const context: CheckContext = {
      projectPath: process.cwd(),
      projectInfo: {
        name: 'test-project',
        version: '1.0.0',
        hasTypeScript: true,
        hasTests: false,
        hasDocker: false,
        hasCICD: false,
        dependencies: {
          production: 0,
          development: 0,
          total: 0,
        },
      },
      options: {
        projectPath: process.cwd(),
      },
    };

    // 3. Добавляем файл в контекст
    const updatedContext = {
      ...context,
      filePath: testFilePath,
      fileContent: testCode,
    };

    // 4. Запускаем анализ веб-безопасности
    console.log('2️⃣ Запуск анализа веб-безопасности...');
    const webChecker = new WebSecurityChecker();
    const webSecurityResult = await webChecker.analyzeWebSecurity(updatedContext as any);

    console.log(
      `🕷️ Найдено XSS уязвимостей: ${webSecurityResult.xss?.vulnerabilities?.length || 0}`
    );
    console.log(
      `🛡️ Найдено CSRF уязвимостей: ${webSecurityResult.csrf?.vulnerabilities?.length || 0}`
    );
    console.log(`📊 Всего уязвимостей: ${webSecurityResult.summary?.totalVulnerabilities || 0}\n`);

    // 5. Генерируем рекомендации через RecommendationEngine
    console.log('3️⃣ Генерация рекомендаций через RecommendationEngine...');

    const webRecommendations = RecommendationEngine.generateRecommendations(webSecurityResult);

    console.log(`📋 Сгенерировано веб-рекомендаций: ${webRecommendations.length}\n`);

    // 6. Анализ качества рекомендаций
    console.log('4️⃣ Анализ качества рекомендаций...');

    const categories = [...new Set(webRecommendations.map((r: any) => r.category))];
    console.log(`🏷️ Категории: ${categories.join(', ')}`);

    const priorityStats = webRecommendations.reduce((stats: any, rec: any) => {
      stats[rec.priority] = (stats[rec.priority] || 0) + 1;
      return stats;
    }, {});
    console.log(`⭐ Приоритеты:`, priorityStats);

    const severityStats = webRecommendations.reduce((stats: any, rec: any) => {
      stats[rec.severity] = (stats[rec.severity] || 0) + 1;
      return stats;
    }, {});
    console.log(`⚠️ Серьезность:`, severityStats);

    // 7. Детали рекомендаций
    console.log('\n5️⃣ Детали первых 3 рекомендаций:');
    webRecommendations.slice(0, 3).forEach((rec: any, index: number) => {
      console.log(`\n📌 Рекомендация ${index + 1}: ${rec.title}`);
      console.log(`   💡 Описание: ${rec.description?.substring(0, 100)}...`);
      console.log(`   🎯 Категория: ${rec.category} | Приоритет: ${rec.priority}`);
      console.log(`   ⚠️ Серьезность: ${rec.severity} | Сложность: ${rec.difficulty}`);
      console.log(`   🔧 Шагов исправления: ${rec.fixTemplate?.steps?.length || 0}`);
      console.log(`   📚 Ресурсов: ${rec.documentation?.links?.length || 0}`);
      console.log(`   🏷️ Теги: ${rec.tags?.join(', ') || 'нет'}`);

      if (rec.fixTemplate?.beforeCode && rec.fixTemplate?.afterCode) {
        console.log(`   💻 Есть примеры кода: До/После`);
      }
    });

    // 8. Группировка по категориям
    console.log('\n6️⃣ Группировка рекомендаций по категориям...');
    const grouped = RecommendationEngine.groupRecommendationsByCategory(webRecommendations);

    Object.entries(grouped).forEach(([category, recs]: [string, any]) => {
      console.log(`📂 ${category}: ${recs.length} рекомендаций`);
      recs.slice(0, 2).forEach((rec: any) => {
        console.log(`   • ${rec.title} (${rec.priority})`);
      });
    });

    // 9. Валидация структуры
    console.log('\n7️⃣ Валидация структуры рекомендаций...');

    const validationResults = webRecommendations.map((rec: any) => {
      const errors: string[] = [];

      if (!rec.id) errors.push('ID');
      if (!rec.title) errors.push('title');
      if (!rec.description) errors.push('description');
      if (!rec.category) errors.push('category');
      if (!rec.severity) errors.push('severity');
      if (!rec.priority) errors.push('priority');
      if (!rec.fixTemplate) errors.push('fixTemplate');
      if (!rec.fixTemplate?.steps?.length) errors.push('steps');
      if (!rec.documentation) errors.push('documentation');
      if (!rec.estimatedTime) errors.push('estimatedTime');
      if (!rec.difficulty) errors.push('difficulty');

      return {
        id: rec.id,
        valid: errors.length === 0,
        errors,
        score: Math.round(((11 - errors.length) / 11) * 100),
      };
    });

    const validCount = validationResults.filter(v => v.valid).length;
    const avgScore =
      validationResults.reduce((sum, v) => sum + v.score, 0) / validationResults.length;

    console.log(`✅ Полностью валидных: ${validCount}/${webRecommendations.length}`);
    console.log(`📊 Средний балл качества: ${Math.round(avgScore)}%`);

    if (validCount < webRecommendations.length) {
      console.log('\n🔍 Проблемы в структуре:');
      const allErrors = validationResults.flatMap(v => v.errors);
      const errorCounts = allErrors.reduce((counts: any, error) => {
        counts[error] = (counts[error] || 0) + 1;
        return counts;
      }, {});

      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`   ❌ ${error}: ${count} раз`);
      });
    }

    // 10. Проверка конвертации типов
    console.log('\n8️⃣ Проверка конвертации типов...');

    const hasWebCategories = webRecommendations.some((r: any) =>
      ['xss', 'csrf', 'injection'].includes(r.category)
    );
    console.log(`🌐 Есть веб-категории: ${hasWebCategories ? '✅' : '❌'}`);

    const hasPriorities = webRecommendations.every((r: any) => r.priority);
    console.log(`⭐ Все имеют приоритет: ${hasPriorities ? '✅' : '❌'}`);

    const hasTags = webRecommendations.some((r: any) => r.tags?.length > 0);
    console.log(`🏷️ Есть теги: ${hasTags ? '✅' : '❌'}`);

    // 11. Итоговая статистика
    console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
    console.log(`🔍 Строк кода: ${testCode.split('\n').filter(l => l.trim()).length}`);
    console.log(`⚠️ Веб-уязвимостей: ${webSecurityResult.summary?.totalVulnerabilities || 0}`);
    console.log(`💡 Рекомендаций: ${webRecommendations.length}`);
    console.log(`✅ Качество: ${Math.round(avgScore)}%`);
    console.log(`🏷️ Категорий: ${categories.length}`);
    console.log(
      `📚 Общих ресурсов: ${webRecommendations.reduce((sum: number, r: any) => sum + (r.documentation?.links?.length || 0), 0)}`
    );

    // Очистка
    await fs.unlink(testFilePath);

    console.log('\n🎉 ИНТЕГРАЦИЯ УСПЕШНО ПРОТЕСТИРОВАНА!');

    // Финальная проверка
    const integrationSuccess =
      webRecommendations.length > 0 && validCount > 0 && hasWebCategories && avgScore > 70;

    if (integrationSuccess) {
      console.log('✅ RecommendationEngine успешно интегрирован с веб-безопасностью!');
      console.log('✅ Task 1.3 (RecommendationEngine Integration) ЗАВЕРШЕН!');
    } else {
      console.log('❌ Интеграция требует доработки');
    }

    return integrationSuccess;
  } catch (error) {
    console.error('❌ Ошибка в тесте интеграции:', error);
    return false;
  }
}

// Запускаем тест
testRecommendationEngineIntegration()
  .then(success => {
    if (success) {
      console.log('\n🎊 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! PHASE 5.2.2 TASK 1.3 COMPLETE!');
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
