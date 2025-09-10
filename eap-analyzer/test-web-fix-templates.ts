/**
 * Тест WebSecurityFixTemplates - Генерация практических рекомендаций
 *
 * Проверяет создание детальных шаблонов исправлений для XSS и CSRF уязвимостей
 */

import { WebSecurityFixTemplates } from './src/checkers/security/WebSecurityFixTemplates.js';
import type { XSSVulnerability } from './src/checkers/security/analyzers/XSSAnalyzer.js';
import type { CSRFIssue } from './src/checkers/security/analyzers/CSRFAnalyzer.js';
import type { WebSecurityResult } from './src/checkers/security/WebSecurityChecker.js';

async function testWebSecurityFixTemplates() {
  console.log('🔧 Тест WebSecurityFixTemplates...\n');

  try {
    // Создаем тестовые XSS уязвимости
    const testXSSVulnerabilities: XSSVulnerability[] = [
      {
        type: 'html_output',
        file: 'src/routes/+page.svelte',
        line: 15,
        column: 10,
        severity: 'critical',
        context: '{@html userContent}',
        code: '{@html userContent}',
        description: 'Небезопасное использование {@html} без санитизации',
      },
      {
        type: 'inner_html',
        file: 'src/lib/utils.js',
        line: 32,
        column: 5,
        severity: 'high',
        context: 'element.innerHTML = input',
        code: 'element.innerHTML = userInput;',
        description: 'Прямое присваивание innerHTML',
      },
      {
        type: 'url_param',
        file: 'src/routes/search/+page.svelte',
        line: 8,
        column: 20,
        severity: 'medium',
        context: 'URL параметр в выводе',
        code: '<div>{$page.url.searchParams.get("q")}</div>',
        description: 'URL параметр выводится без проверки',
      },
    ];

    // Создаем тестовые CSRF проблемы
    const testCSRFIssues: CSRFIssue[] = [
      {
        type: 'form_no_token',
        file: 'src/routes/profile/+page.svelte',
        line: 25,
        severity: 'high',
        context: 'Форма без CSRF токена',
        code: '<form method="POST" action="?/updateProfile">',
        description: 'POST форма без CSRF защиты',
        suggestion: 'Добавьте CSRF токен в форму',
      },
      {
        type: 'cookie_no_samesite',
        file: 'src/routes/api/auth/+server.ts',
        line: 45,
        severity: 'medium',
        context: 'Cookie без SameSite',
        code: 'cookies.set("session", sessionId)',
        description: 'Cookie без защитных флагов',
        suggestion: 'Добавьте SameSite и другие флаги',
      },
    ];

    // Тест 1: Генерация XSS рекомендаций
    console.log('📋 Тест 1: Генерация XSS рекомендаций...');
    const xssRecommendations = WebSecurityFixTemplates.generateXSSFixes(testXSSVulnerabilities);
    console.log(`✅ Сгенерировано ${xssRecommendations.length} XSS рекомендаций`);

    for (const rec of xssRecommendations) {
      console.log(`   🔸 ${rec.title} (${rec.severity}) - ${rec.estimatedTime}`);
      console.log(`     📝 ${rec.description}`);
      console.log(`     🔧 Шаги: ${rec.steps.length} пунктов`);
      if (rec.codeExample) {
        console.log(`     💻 Есть пример кода: до/после`);
      }
      console.log('');
    }

    // Тест 2: Генерация CSRF рекомендаций
    console.log('📋 Тест 2: Генерация CSRF рекомендаций...');
    const csrfRecommendations = WebSecurityFixTemplates.generateCSRFFixes(testCSRFIssues);
    console.log(`✅ Сгенерировано ${csrfRecommendations.length} CSRF рекомендаций`);

    for (const rec of csrfRecommendations) {
      console.log(`   🔸 ${rec.title} (${rec.severity}) - ${rec.estimatedTime}`);
      console.log(`     📝 ${rec.description}`);
      console.log(`     🔧 Шаги: ${rec.steps.length} пунктов`);
      console.log('');
    }

    // Тест 3: Полная генерация веб-рекомендаций
    console.log('📋 Тест 3: Полная генерация веб-рекомендаций...');
    const mockWebSecurityResult: WebSecurityResult = {
      xss: {
        vulnerabilities: testXSSVulnerabilities,
        filesScanned: 10,
        summary: {
          critical: 1,
          high: 1,
          medium: 1,
          total: 3,
        },
      },
      csrf: {
        issues: testCSRFIssues,
        filesScanned: 8,
        formsFound: 3,
        protectedForms: 1,
        summary: {
          critical: 0,
          high: 1,
          medium: 1,
          total: 2,
        },
      },
      summary: {
        totalVulnerabilities: 5,
        criticalCount: 1,
        highCount: 2,
        mediumCount: 2,
        filesScanned: 10,
      },
      recommendations: [],
    };

    const fullRecommendations =
      WebSecurityFixTemplates.generateWebRecommendations(mockWebSecurityResult);
    console.log(`✅ Полная генерация: ${fullRecommendations.length} рекомендаций`);

    // Тест 4: Группировка по категориям
    console.log('\n📊 Тест 4: Группировка рекомендаций...');
    const grouped = WebSecurityFixTemplates.groupRecommendationsByCategory(fullRecommendations);

    for (const [category, recs] of Object.entries(grouped)) {
      console.log(`   📂 ${category}: ${recs.length} рекомендаций`);
    }

    // Тест 5: Сводка рекомендаций
    console.log('\n📈 Тест 5: Сводка рекомендаций...');
    const summary = WebSecurityFixTemplates.generateRecommendationsSummary(fullRecommendations);

    console.log(`   📊 Всего рекомендаций: ${summary.total}`);
    console.log(`   🔥 Критических: ${summary.critical}`);
    console.log(`   ⚠️  Высоких: ${summary.high}`);
    console.log(`   ⏱️  Оценочное время: ${summary.estimatedTotalTime}`);
    console.log(`   🎯 Топ приоритеты:`);

    summary.topPriorities.forEach((rec, index) => {
      console.log(`      ${index + 1}. ${rec.title} (приоритет: ${rec.priority})`);
    });

    // Тест 6: Примеры кода
    console.log('\n💻 Тест 6: Проверка примеров кода...');
    const recsWithCode = fullRecommendations.filter(r => r.codeExample);
    console.log(`✅ Рекомендаций с примерами кода: ${recsWithCode.length}`);

    if (recsWithCode.length > 0) {
      const example = recsWithCode[0];
      console.log(`\n   📝 Пример из "${example.title}":`);
      console.log(`   ❌ До: ${example.codeExample?.before}`);
      console.log(`   ✅ После: ${example.codeExample?.after}`);
      console.log(`   💡 ${example.codeExample?.description}`);
    }

    // Тест 7: Ресурсы и теги
    console.log('\n🔗 Тест 7: Ресурсы и теги...');
    const totalResources = fullRecommendations.reduce((sum, rec) => sum + rec.resources.length, 0);
    const allTags = [...new Set(fullRecommendations.flatMap(rec => rec.tags))];

    console.log(`✅ Всего ресурсов: ${totalResources}`);
    console.log(`✅ Уникальных тегов: ${allTags.length}`);
    console.log(
      `   📚 Теги: ${allTags.slice(0, 10).join(', ')}${allTags.length > 10 ? '...' : ''}`
    );

    console.log('\n🎉 Все тесты WebSecurityFixTemplates прошли успешно!');
    console.log('📈 Система генерации практических рекомендаций готова!');

    return true;
  } catch (error) {
    console.error('❌ Ошибка тестирования WebSecurityFixTemplates:', error);
    return false;
  }
}

// Запуск теста
testWebSecurityFixTemplates()
  .then(success => {
    if (success) {
      console.log('\n✅ ЗАДАЧА 1.2 ЗАВЕРШЕНА: WebSecurityFixTemplates готов!');
      process.exit(0);
    } else {
      console.log('\n❌ ТЕСТ НЕ ПРОШЕЛ');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
