/**
 * SecurityChecker Test - Phase 5.1.1
 * Тестирование восстановленного SecurityChecker
 */

import { SecurityChecker } from './checkers/security/SecurityChecker.js';

async function testSecurityChecker() {
  const projectPath = 'C:/alphacore/project-template';

  const context = {
    projectPath,
    projectInfo: {
      name: 'project-template',
      version: '2.0.0',
      hasTypeScript: true,
      hasTests: true,
      hasDocker: true,
      hasCICD: true,
      dependencies: { production: 0, development: 0, total: 0 },
    },
    options: {
      projectPath,
      verbose: true,
    },
  };

  try {
    console.log('🔒 === SecurityChecker Phase 5.1.1 Test ===');
    console.log('🎯 Тестирование восстановленного SecurityChecker...');

    const startTime = Date.now();
    const result = await SecurityChecker.checkComponent(context);
    const duration = Date.now() - startTime;

    console.log(`⏱️ Время выполнения: ${duration}ms`);
    console.log(`🎯 Общий балл: ${result.score}/${result.maxScore} (${result.percentage}%)`);
    console.log(`✅ Успешных проверок: ${result.passed.length}`);
    console.log(`❌ Неудачных проверок: ${result.failed.length}`);

    console.log('\n📊 === ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ ===');

    if (result.passed.length > 0) {
      console.log('\n✅ УСПЕШНЫЕ ПРОВЕРКИ:');
      result.passed.forEach(check => {
        console.log(`  ✓ ${check.check.name}: ${check.score}/100`);
        console.log(`    📝 ${check.details}`);
      });
    }

    if (result.failed.length > 0) {
      console.log('\n❌ НЕУДАЧНЫЕ ПРОВЕРКИ:');
      result.failed.forEach(check => {
        console.log(`  ❌ ${check.check.name}: ${check.score}/100`);
        console.log(`    📝 ${check.details}`);
        if (check.recommendations && check.recommendations.length > 0) {
          console.log(`    💡 Рекомендации:`);
          check.recommendations.forEach(rec => console.log(`      - ${rec}`));
        }
      });
    }

    if (result.recommendations.length > 0) {
      console.log('\n🎯 ОБЩИЕ РЕКОМЕНДАЦИИ:');
      result.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }

    const success = result.percentage >= 50;
    console.log(`\n${success ? '🎉' : '⚠️'} === РЕЗУЛЬТАТ ТЕСТА ===`);
    console.log(`Phase 5.1.1: ${success ? 'УСПЕШНА' : 'ТРЕБУЕТ ДОРАБОТКИ'}`);
    console.log(`SecurityChecker: ${success ? 'РАБОТАЕТ' : 'НЕИСПРАВЕН'} (${result.percentage}%)`);

    if (success) {
      console.log('✅ SecurityChecker готов к интеграции с AnalysisOrchestrator');
      console.log('🚀 Можно переходить к Phase 5.1.2');
    } else {
      console.log('⚠️ SecurityChecker требует отладки');
    }

    return success;
  } catch (error) {
    console.error('❌ Критическая ошибка SecurityChecker:', error);
    console.log('💥 Phase 5.1.1 FAILED - SecurityChecker неработоспособен');
    return false;
  }
}

// Запуск теста
testSecurityChecker()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Фатальная ошибка теста:', error);
    process.exit(1);
  });
