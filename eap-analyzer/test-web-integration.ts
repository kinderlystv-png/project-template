/**
 * Тест интеграции WebSecurityChecker с основным SecurityChecker
 *
 * Проверяет что веб-анализ безопасности корректно интегрирован
 * и веб-уязвимости отображаются в результатах
 */

import { SecurityChecker } from './src/checkers/security/SecurityChecker.js';
import { CheckContext } from './src/types/index.js';

async function testWebSecurityIntegration() {
  console.log('🔗 Тест интеграции WebSecurity с SecurityChecker...\n');

  try {
    const context: CheckContext = {
      projectPath: process.cwd(),
      projectInfo: {
        name: 'test-project',
        version: '1.0.0',
        hasTypeScript: true,
        hasTests: true,
        hasDocker: true,
        hasCICD: true,
        dependencies: { production: 0, development: 0, total: 0 },
      },
      options: {
        projectPath: process.cwd(),
        verbose: true,
      },
    };

    console.log('📊 Запуск полного анализа безопасности...');
    const result = await SecurityChecker.checkComponent(context);

    console.log('\n📋 Результаты анализа безопасности:');
    console.log(`📈 Общий балл: ${result.percentage}% (${result.score}/${result.maxScore})`);
    console.log(`✅ Пройдено: ${result.passed.length} проверок`);
    console.log(`❌ Не пройдено: ${result.failed.length} проверок`);
    console.log(`⏱️ Время выполнения: ${result.duration}ms\n`);

    // Проверим наличие веб-безопасности в результатах
    const webSecurityCheck =
      result.passed.find(check => check.check.id === 'security-web') ||
      result.failed.find(check => check.check.id === 'security-web');

    if (webSecurityCheck) {
      console.log('🌐 Web Security анализ найден:');
      console.log(`   📊 Статус: ${webSecurityCheck.passed ? '✅ Пройден' : '❌ Не пройден'}`);
      console.log(`   📝 Детали: ${webSecurityCheck.details}`);
      console.log(`   📈 Балл: ${webSecurityCheck.score}/${webSecurityCheck.maxScore}`);

      if (webSecurityCheck.recommendations && webSecurityCheck.recommendations.length > 0) {
        console.log('   💡 Рекомендации:');
        webSecurityCheck.recommendations.slice(0, 3).forEach(rec => {
          console.log(`      • ${rec}`);
        });
      }
    } else {
      console.log('❌ Web Security анализ НЕ найден в результатах!');
      return false;
    }

    // Проверим overall security score
    const overallCheck =
      result.passed.find(check => check.check.id === 'security-overall') ||
      result.failed.find(check => check.check.id === 'security-overall');

    if (overallCheck) {
      console.log('\n🏆 Overall Security Score:');
      console.log(`   📊 Балл: ${overallCheck.score}%`);
      console.log(`   📝 ${overallCheck.details}`);
    }

    // Проверим все категории безопасности
    console.log('\n📊 Детальная разбивка по категориям:');

    const categories = [
      'security-dependencies',
      'security-code',
      'security-config',
      'security-web',
    ];
    categories.forEach(catId => {
      const catCheck =
        result.passed.find(c => c.check.id === catId) ||
        result.failed.find(c => c.check.id === catId);
      if (catCheck) {
        const status = catCheck.passed ? '✅' : '❌';
        console.log(
          `   ${status} ${catCheck.check.name}: ${catCheck.score}% - ${catCheck.details}`
        );
      }
    });

    console.log('\n🎉 Интеграция WebSecurity успешно завершена!');
    console.log('📈 Web Security теперь является частью основного анализа безопасности.');

    return true;
  } catch (error) {
    console.error('❌ Ошибка тестирования интеграции:', error);
    return false;
  }
}

// Запуск теста
testWebSecurityIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ ИНТЕГРАЦИЯ ЗАВЕРШЕНА: WebSecurity → SecurityChecker');
      process.exit(0);
    } else {
      console.log('\n❌ ИНТЕГРАЦИЯ НЕ УДАЛАСЬ');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
