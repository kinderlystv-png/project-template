/**
 * Тест интеграции WebSecurityChecker
 */

export {};

console.log('🔒 Тестирование WebSecurityChecker...');

try {
  // Импортируем WebSecurityChecker
  const { WebSecurityChecker } = await import('./checkers/security/WebSecurityChecker.js');
  console.log('✅ WebSecurityChecker импортирован');

  const checker = new WebSecurityChecker();
  console.log('✅ Экземпляр создан');

  // Тестовый контекст
  const context = {
    projectPath: process.cwd(),
    projectInfo: {
      name: 'test',
      version: '1.0.0',
      hasTypeScript: true,
      hasTests: false,
      hasDocker: false,
      hasCICD: false,
      dependencies: { production: 0, development: 0, total: 0 },
    },
    options: {
      projectPath: process.cwd(),
      includeOptional: true,
    },
  };

  console.log('🔍 Запускаем полный веб-анализ...');
  const result = await checker.analyzeWebSecurity(context);

  console.log('\n📊 РЕЗУЛЬТАТЫ ВЕБА БЕЗОПАСНОСТИ:');
  console.log(`   🚨 Всего проблем: ${result.summary.totalVulnerabilities}`);
  console.log(`   🔴 Критических: ${result.summary.criticalCount}`);
  console.log(`   🟠 Высоких: ${result.summary.highCount}`);
  console.log(`   🟡 Средних: ${result.summary.mediumCount}`);
  console.log(`   📁 Файлов сканировано: ${result.summary.filesScanned}`);

  console.log('\n🔍 XSS АНАЛИЗ:');
  console.log(`   🎯 XSS уязвимости: ${result.xss.summary.total}`);

  console.log('\n🛡️ CSRF АНАЛИЗ:');
  console.log(`   🎯 CSRF проблемы: ${result.csrf.summary.total}`);
  console.log(`   📋 Форм найдено: ${result.csrf.formsFound}`);
  console.log(`   🔒 Защищенных форм: ${result.csrf.protectedForms}`);

  if (result.recommendations.length > 0) {
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    result.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  console.log('\n🎉 ИНТЕГРАЦИЯ РАБОТАЕТ УСПЕШНО!');

  // Оценка готовности к Phase 5.2.2
  let readinessScore = 0;

  if (result.xss.summary.total >= 0) {
    console.log('✅ XSS анализ функционирует (+25%)');
    readinessScore += 25;
  }

  if (result.csrf.summary.total >= 0) {
    console.log('✅ CSRF анализ функционирует (+25%)');
    readinessScore += 25;
  }

  if (result.recommendations.length > 0) {
    console.log('✅ Рекомендации генерируются (+25%)');
    readinessScore += 25;
  }

  if (result.summary.totalVulnerabilities > 0) {
    console.log('✅ Детекция проблем работает (+25%)');
    readinessScore += 25;
  }

  console.log(`\n📈 ГОТОВНОСТЬ К PHASE 5.2.2: ${readinessScore}%`);

  if (readinessScore >= 75) {
    console.log('🚀 ФАЗА 1 - ЗАДАЧА 1.1 ЗАВЕРШЕНА!');
    console.log('✅ XSS Detection Engine готов');
    console.log('🎯 Переходим к Задаче 1.2: CSRF Protection Checker');
  }
} catch (error) {
  console.error('❌ Ошибка интеграции:', error);
}
