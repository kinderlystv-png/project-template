/**
 * Критическая проверка: работают ли новые компоненты изолированно
 */

export {};
return {
  score: result.score || 0,
  checks: result.checkResults?.length || 0,
  hasWebSecurity,
};
onsole.log('🔥 КРИТИЧЕСКАЯ ПРОВЕРКА НОВЫХ КОМПОНЕНТОВ');
console.log('='.repeat(60));

async function testComponent(name: string, importPath: string, testFn: () => Promise<any>) {
  console.log(`\n🧪 Тестируем ${name}...`);

  try {
    const result = await testFn();
    console.log(`✅ ${name}: РАБОТАЕТ`);
    return { name, status: 'OK', result };
  } catch (error: any) {
    console.log(`❌ ${name}: ОШИБКА - ${error?.message || 'Unknown error'}`);
    return { name, status: 'ERROR', error: error?.message || 'Unknown error' };
  }
}

async function runCriticalTests() {
  const results = [];

  // 1. XSSAnalyzer
  results.push(
    await testComponent('XSSAnalyzer', './checkers/security/analyzers/XSSAnalyzer.js', async () => {
      const { XSSAnalyzer } = await import('./checkers/security/analyzers/XSSAnalyzer.js');
      const analyzer = new XSSAnalyzer();

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
        options: { projectPath: process.cwd() },
      };

      const result = await analyzer.analyzeXSS(context);
      return { vulnerabilities: result.summary.total, files: result.filesScanned };
    })
  );

  // 2. CSRFAnalyzer
  results.push(
    await testComponent(
      'CSRFAnalyzer',
      './checkers/security/analyzers/CSRFAnalyzer.js',
      async () => {
        const { CSRFAnalyzer } = await import('./checkers/security/analyzers/CSRFAnalyzer.js');
        const analyzer = new CSRFAnalyzer();

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
          options: { projectPath: process.cwd() },
        };

        const result = await analyzer.analyzeCSRF(context);
        return { issues: result.summary.total, forms: result.formsFound };
      }
    )
  );

  // 3. WebSecurityChecker
  results.push(
    await testComponent(
      'WebSecurityChecker',
      './checkers/security/WebSecurityChecker.js',
      async () => {
        const { WebSecurityChecker } = await import('./checkers/security/WebSecurityChecker.js');
        const checker = new WebSecurityChecker();

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
          options: { projectPath: process.cwd() },
        };

        const result = await checker.analyzeWebSecurity(context);
        return {
          totalProblems: result.summary.totalVulnerabilities,
          xss: result.xss.summary.total,
          csrf: result.csrf.summary.total,
        };
      }
    )
  );

  // 4. Проверка интеграции с основным SecurityChecker
  results.push(
    await testComponent(
      'SecurityChecker Integration',
      './checkers/security/SecurityChecker.js',
      async () => {
        const { SecurityChecker } = await import('./checkers/security/SecurityChecker.js');

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
          options: { projectPath: process.cwd() },
        };

        const result = await SecurityChecker.checkComponent(context);

        // Проверяем, есть ли веб-безопасность в результатах
        const hasWebSecurity =
          JSON.stringify(result).toLowerCase().includes('xss') ||
          JSON.stringify(result).toLowerCase().includes('csrf');

        return {
          score: result.overallScore,
          checks: result.checkResults?.length || 0,
          hasWebSecurity,
        };
      }
    )
  );

  // 5. RecommendationEngine интеграция
  results.push(
    await testComponent(
      'RecommendationEngine',
      './recommendations/RecommendationEngine.js',
      async () => {
        const { RecommendationEngine } = await import('./recommendations/RecommendationEngine.js');
        const engine = new RecommendationEngine();

        // Тестовые данные
        const testIssues = {
          dependencies: { vulnerabilities: [], outdatedPackages: [] },
          code: { issues: [{ type: 'xss', severity: 'high', file: 'test.js' }] },
          config: { issues: [] },
        };

        const recommendations = await engine.generateRecommendations(testIssues);
        return { recommendations: recommendations.length };
      }
    )
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ:');
  console.log('='.repeat(60));

  const okCount = results.filter(r => r.status === 'OK').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  results.forEach(result => {
    const status = result.status === 'OK' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);

    if (result.status === 'OK' && result.result) {
      const data = JSON.stringify(result.result, null, 2).replace(/\n/g, '\n     ');
      console.log(`     ${data}`);
    } else if (result.status === 'ERROR') {
      console.log(`     Ошибка: ${result.error}`);
    }
  });

  console.log('\n📈 ОБЩАЯ ОЦЕНКА:');
  console.log(`   ✅ Работающих компонентов: ${okCount}/${results.length}`);
  console.log(`   ❌ Сломанных компонентов: ${errorCount}/${results.length}`);
  console.log(`   📊 Процент готовности: ${Math.round((okCount / results.length) * 100)}%`);

  // Критическая оценка
  const criticalIssues = [];

  const webSecurityResult = results.find(r => r.name === 'WebSecurityChecker');
  if (webSecurityResult?.status === 'OK') {
    console.log('   ✅ WebSecurity: Компоненты работают изолированно');
  } else {
    criticalIssues.push('WebSecurity компоненты не работают');
  }

  const integrationResult = results.find(r => r.name === 'SecurityChecker Integration');
  if (integrationResult?.status === 'OK' && integrationResult.result?.hasWebSecurity) {
    console.log('   ✅ Интеграция: WebSecurity интегрирован в главный SecurityChecker');
  } else {
    criticalIssues.push('WebSecurity НЕ интегрирован в главный SecurityChecker');
  }

  if (criticalIssues.length > 0) {
    console.log('\n🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
    criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
  }

  return { okCount, errorCount, criticalIssues };
}

// Запуск
runCriticalTests().then(result => {
  console.log('\n' + '='.repeat(60));
  if (result.criticalIssues.length === 0 && result.okCount === 5) {
    console.log('🎉 ВСЕ КОМПОНЕНТЫ РАБОТАЮТ И ИНТЕГРИРОВАНЫ!');
  } else {
    console.log('⚠️ ТРЕБУЕТСЯ ДОРАБОТКА КОМПОНЕНТОВ');
  }
  console.log('='.repeat(60));
});
