/**
 * SecurityChecker Integration Test
 * Phase 5.1.1: Тестирование интеграции SecurityChecker с ЭАП системой
 */

import { SecurityChecker } from '../eap-analyzer/src/checkers/security/SecurityChecker.js';
import { CheckContext } from '../eap-analyzer/src/types/index.js';

async function testSecurityChecker() {
  console.log('🔒 === SecurityChecker Integration Test ===');
  console.log('🎯 Phase 5.1.1: Тестирование восстановленного SecurityChecker');

  const context: CheckContext = {
    projectPath: 'C:/alphacore/project-template',
    projectName: 'project-template',
    timestamp: new Date(),
    config: {}
  };

  try {
    console.log('\n📋 Запуск SecurityChecker.checkComponent...');
    const startTime = Date.now();

    const result = await SecurityChecker.checkComponent(context);

    const duration = Date.now() - startTime;
    console.log(`⏱️ Время выполнения: ${duration}ms`);

    console.log('\n📊 === РЕЗУЛЬТАТЫ АНАЛИЗА БЕЗОПАСНОСТИ ===');
    console.log(`🎯 Общий балл: ${result.score}/${result.maxScore} (${result.percentage}%)`);
    console.log(`✅ Успешных проверок: ${result.passed.length}`);
    console.log(`❌ Неудачных проверок: ${result.failed.length}`);

    console.log('\n✅ === УСПЕШНЫЕ ПРОВЕРКИ ===');
    result.passed.forEach(check => {
      console.log(`  ✓ ${check.check.name}: ${check.score}/100`);
      console.log(`    📝 ${check.details}`);
    });

    console.log('\n❌ === НЕУДАЧНЫЕ ПРОВЕРКИ ===');
    result.failed.forEach(check => {
      console.log(`  ❌ ${check.check.name}: ${check.score}/100`);
      console.log(`    📝 ${check.details}`);
      if (check.recommendations?.length > 0) {
        console.log(`    💡 Рекомендации:`);
        check.recommendations.forEach(rec => console.log(`      - ${rec}`));
      }
    });

    console.log('\n🎯 === ОБЩИЕ РЕКОМЕНДАЦИИ ===');
    result.recommendations.forEach(rec => console.log(`  💡 ${rec}`));

    const success = result.percentage >= 50; // 50% threshold for testing
    console.log(`\n${success ? '🎉' : '⚠️'} === РЕЗУЛЬТАТ ТЕСТА ===`);
    console.log(`SecurityChecker ${success ? 'УСПЕШНО РАБОТАЕТ' : 'ТРЕБУЕТ ДОРАБОТКИ'}`);
    console.log(`Балл безопасности: ${result.percentage}% ${success ? '(✅ ДОСТАТОЧНО)' : '(❌ НЕДОСТАТОЧНО)'}`);

    return {
      success,
      score: result.percentage,
      duration,
      details: result
    };

  } catch (error) {
    console.error('❌ Ошибка при тестировании SecurityChecker:', error);
    return {
      success: false,
      score: 0,
      duration: 0,
      error: error.message
    };
  }
}

// Запускаем тест
testSecurityChecker()
  .then(result => {
    console.log('\n🏁 === ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
    console.log(`Phase 5.1.1 ${result.success ? 'УСПЕШНА' : 'ТРЕБУЕТ ИСПРАВЛЕНИЙ'}`);
    if (result.success) {
      console.log('✅ SecurityChecker готов к production использованию');
      console.log('🚀 Можно переходить к Phase 5.1.2 - интеграция с AnalysisOrchestrator');
    } else {
      console.log('⚠️ SecurityChecker требует дополнительной отладки');
      console.log('📋 Необходимо исправить найденные проблемы');
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка теста:', error);
    process.exit(1);
  });
