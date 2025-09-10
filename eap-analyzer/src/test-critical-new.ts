/**
 * Критическая проверка: работают ли новые компоненты изолированно
 */

export {};

console.log('🔥 КРИТИЧЕСКАЯ ПРОВЕРКА НОВЫХ КОМПОНЕНТОВ');
console.log('='.repeat(60));

async function testComponent(name: string, testFn: () => Promise<any>) {
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
    await testComponent('XSSAnalyzer', async () => {
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
    await testComponent('CSRFAnalyzer', async () => {
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
    })
  );

  // 3. WebSecurityChecker
  results.push(
    await testComponent('WebSecurityChecker', async () => {
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
    })
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

  console.log(`\n📈 ОБЩАЯ ОЦЕНКА:`);
  console.log(`   ✅ Работающих компонентов: ${okCount}/${results.length}`);
  console.log(`   ❌ Сломанных компонентов: ${errorCount}/${results.length}`);
  console.log(`   📊 Процент готовности: ${Math.round((okCount / results.length) * 100)}%`);

  return { okCount, errorCount, results };
}

// Запуск
runCriticalTests().then(result => {
  console.log('\n' + '='.repeat(60));
  if (result.errorCount === 0) {
    console.log('🎉 ВСЕ НОВЫЕ КОМПОНЕНТЫ РАБОТАЮТ!');
  } else {
    console.log('⚠️ ЕСТЬ ПРОБЛЕМЫ В КОМПОНЕНТАХ');
  }
  console.log('='.repeat(60));
});
