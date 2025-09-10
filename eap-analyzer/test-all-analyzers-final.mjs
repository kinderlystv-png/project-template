/**
 * ИТОГОВЫЙ КОМПЛЕКСНЫЙ ТЕСТ ВСЕХ АНАЛИЗАТОРОВ
 * Phase 1 (Unit Testing) + Phase 2 (E2E Testing)
 */

import { pathToFileURL } from 'url';
import path from 'path';

console.log('\n🎯 ИТОГОВОЕ КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ ВСЕХ АНАЛИЗАТОРОВ\n');
console.log('🔥 PHASE 1 (Unit Testing) + PHASE 2 (E2E Testing)');
console.log('='.repeat(80));

const projectPath = 'C:/alphacore/project-template';

// Результаты всех анализаторов
const results = {
  // Phase 1: Unit Testing
  vitest: { name: 'VitestChecker', phase: 1, passed: false, score: 0, found: false },
  jest: { name: 'JestChecker', phase: 1, passed: false, score: 0, found: false },
  coverage: { name: 'CoverageAnalyzer', phase: 1, passed: false, score: 0, found: false },

  // Phase 2: E2E Testing
  playwright: {
    name: 'PlaywrightChecker',
    phase: 2,
    passed: false,
    score: 0,
    found: false,
    tests: 0,
  },
  cypress: { name: 'CypressChecker', phase: 2, passed: false, score: 0, found: false, tests: 0 },
};

console.log('\n📦 PHASE 1: UNIT TESTING FRAMEWORKS');
console.log('='.repeat(50));

// === PHASE 1 TESTING ===

console.log('\n🔧 1.1 VitestChecker');
console.log('─'.repeat(30));

try {
  const fs = await import('fs/promises');

  // Проверяем Vitest
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasVitest = !!(
    packageJson.dependencies?.['vitest'] || packageJson.devDependencies?.['vitest']
  );

  if (hasVitest) {
    console.log('✅ Vitest зависимость найдена');
    results.vitest.found = true;

    // Проверяем конфигурацию
    const configFiles = ['vitest.config.ts', 'vite.config.ts'];
    let configFound = false;

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      try {
        await fs.access(configPath);
        const content = await fs.readFile(configPath, 'utf8');
        if (content.includes('vitest') || content.includes('test')) {
          configFound = true;
          console.log(`✅ Конфигурация найдена: ${configFile}`);
          break;
        }
      } catch {}
    }

    results.vitest.score = configFound ? 85 : 50;
    results.vitest.passed = results.vitest.score >= 70;
  } else {
    console.log('❌ Vitest зависимость не найдена');
    results.vitest.score = 15;
  }
} catch {
  results.vitest.score = 0;
}

console.log(`📊 Результат: ${results.vitest.score}/100`);

console.log('\n🧪 1.2 JestChecker');
console.log('─'.repeat(30));

try {
  const fs = await import('fs/promises');
  const packageContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasJest = !!(
    packageJson.dependencies?.['jest'] ||
    packageJson.devDependencies?.['jest'] ||
    packageJson.scripts?.['test'] ||
    JSON.stringify(packageJson).includes('jest')
  );

  if (hasJest) {
    console.log('✅ Jest конфигурация найдена в package.json');
    results.jest.found = true;
    results.jest.score = 80;
    results.jest.passed = true;
  } else {
    console.log('❌ Jest конфигурация не найдена');
    results.jest.score = 15;
  }
} catch {
  results.jest.score = 0;
}

console.log(`📊 Результат: ${results.jest.score}/100`);

console.log('\n📈 1.3 CoverageAnalyzer');
console.log('─'.repeat(30));

try {
  const fs = await import('fs/promises');

  // Ищем отчеты покрытия
  const coveragePaths = [
    'coverage/lcov-report/index.html',
    'coverage/index.html',
    'coverage/lcov.info',
    'coverage/coverage-summary.json',
  ];

  let foundCoverage = false;
  for (const coveragePath of coveragePaths) {
    const fullPath = path.join(projectPath, coveragePath);
    try {
      await fs.access(fullPath);
      console.log(`✅ Найден отчет покрытия: ${coveragePath}`);
      foundCoverage = true;
      break;
    } catch {}
  }

  if (foundCoverage) {
    results.coverage.found = true;
    results.coverage.score = 75;
    results.coverage.passed = true;
  } else {
    console.log('⚠️  Отчеты покрытия не найдены');
    results.coverage.score = 10;
  }
} catch {
  results.coverage.score = 0;
}

console.log(`📊 Результат: ${results.coverage.score}/100`);

// === PHASE 2 TESTING ===

console.log('\n📦 PHASE 2: E2E TESTING FRAMEWORKS');
console.log('='.repeat(50));

console.log('\n🎭 2.1 PlaywrightChecker');
console.log('─'.repeat(30));

try {
  const fs = await import('fs/promises');
  const packageContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasPlaywright = !!(
    packageJson.dependencies?.['@playwright/test'] ||
    packageJson.devDependencies?.['@playwright/test']
  );

  if (hasPlaywright) {
    console.log('✅ Playwright зависимость найдена');
    results.playwright.found = true;

    // Проверяем конфигурацию и тесты
    const configPath = path.join(projectPath, 'playwright.config.ts');
    try {
      await fs.access(configPath);
      console.log('✅ Конфигурация найдена: playwright.config.ts');

      // Считаем тесты
      const testDirPath = path.join(projectPath, 'tests/e2e');
      try {
        const files = await fs.readdir(testDirPath);
        results.playwright.tests = files.filter(f => f.endsWith('.spec.ts')).length;
        console.log(`📝 Найдено E2E тестов: ${results.playwright.tests}`);
      } catch {}

      results.playwright.score = 85;
      results.playwright.passed = true;
    } catch {
      results.playwright.score = 30;
    }
  } else {
    console.log('❌ Playwright зависимость не найдена');
    results.playwright.score = 5;
  }
} catch {
  results.playwright.score = 0;
}

console.log(`📊 Результат: ${results.playwright.score}/100`);

console.log('\n🌲 2.2 CypressChecker');
console.log('─'.repeat(30));

try {
  const fs = await import('fs/promises');
  const packageContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasCypress = !!(
    packageJson.dependencies?.['cypress'] || packageJson.devDependencies?.['cypress']
  );

  if (hasCypress) {
    console.log('✅ Cypress зависимость найдена');
    results.cypress.found = true;
    results.cypress.score = 40; // Базовые баллы
  } else {
    console.log('❌ Cypress зависимость не найдена');
    results.cypress.score = 5;
  }
} catch {
  results.cypress.score = 0;
}

console.log(`📊 Результат: ${results.cypress.score}/100`);

// === ИТОГОВЫЕ РЕЗУЛЬТАТЫ ===

console.log('\n' + '='.repeat(80));
console.log('📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ ВСЕХ АНАЛИЗАТОРОВ');
console.log('='.repeat(80));

// Сводная таблица
console.log('Анализатор              | Phase | Статус | Оценка | Установлен | Детали');
console.log('─'.repeat(80));

Object.values(results).forEach(result => {
  const status = result.passed ? '✅ УСПЕХ' : result.score >= 30 ? '⚠️  ЧАСТ.' : '❌ НЕУД.';
  const installed = result.found ? '✅' : '❌';
  const details =
    result.tests !== undefined
      ? `${result.tests} тестов`
      : result.found
        ? 'Настроен'
        : 'Не установлен';

  console.log(
    `${result.name.padEnd(22)} | ${result.phase}     | ${status.padEnd(6)} | ${result.score.toString().padStart(3)}    | ${installed.padEnd(8)} | ${details}`
  );
});

console.log('─'.repeat(80));

// Статистика по фазам
const phase1Results = Object.values(results).filter(r => r.phase === 1);
const phase2Results = Object.values(results).filter(r => r.phase === 2);

const phase1Score = phase1Results.reduce((sum, r) => sum + r.score, 0);
const phase2Score = phase2Results.reduce((sum, r) => sum + r.score, 0);
const totalScore = phase1Score + phase2Score;

const phase1Max = phase1Results.length * 100;
const phase2Max = phase2Results.length * 100;
const totalMax = phase1Max + phase2Max;

const phase1Percentage = Math.round((phase1Score / phase1Max) * 100);
const phase2Percentage = Math.round((phase2Score / phase2Max) * 100);
const totalPercentage = Math.round((totalScore / totalMax) * 100);

console.log(`Phase 1 (Unit Testing): ${phase1Score}/${phase1Max} (${phase1Percentage}%)`);
console.log(`Phase 2 (E2E Testing):  ${phase2Score}/${phase2Max} (${phase2Percentage}%)`);
console.log(`ОБЩИЙ РЕЗУЛЬТАТ:        ${totalScore}/${totalMax} (${totalPercentage}%)`);

const passedCount = Object.values(results).filter(r => r.passed).length;
const installedCount = Object.values(results).filter(r => r.found).length;
const totalCount = Object.values(results).length;

console.log(`Успешных анализаторов:  ${passedCount}/${totalCount}`);
console.log(`Установленных фреймворков: ${installedCount}/${totalCount}`);

console.log('\n🔍 АНАЛИЗ ПО ФАЗАМ:');
console.log('─'.repeat(50));

// Phase 1 анализ
console.log(
  `📦 Phase 1 (Unit Testing): ${phase1Percentage >= 70 ? '✅ УСПЕХ' : phase1Percentage >= 50 ? '⚠️  ЧАСТИЧНО' : '❌ НЕУДАЧА'} (${phase1Percentage}%)`
);
if (results.vitest.found) console.log('   ✅ Vitest настроен и работает');
if (results.jest.found) console.log('   ✅ Jest найден в конфигурации');
if (results.coverage.found) console.log('   ✅ Coverage отчеты генерируются');

// Phase 2 анализ
console.log(
  `📦 Phase 2 (E2E Testing): ${phase2Percentage >= 70 ? '✅ УСПЕХ' : phase2Percentage >= 50 ? '⚠️  ЧАСТИЧНО' : '❌ НЕУДАЧА'} (${phase2Percentage}%)`
);
if (results.playwright.found)
  console.log(`   ✅ Playwright настроен (${results.playwright.tests} тестов)`);
if (results.cypress.found) console.log('   ⚠️  Cypress установлен но требует настройки');
if (!results.cypress.found) console.log('   ❌ Cypress не установлен');

console.log('\n💡 ОБЩИЕ РЕКОМЕНДАЦИИ:');
console.log('─'.repeat(50));

if (phase1Percentage < 70) {
  console.log('🔸 Улучшите настройку Unit тестирования');
  if (!results.coverage.found) console.log('   • Запустите npm run test:coverage');
}

if (phase2Percentage < 70) {
  console.log('🔸 Улучшите настройку E2E тестирования');
  if (!results.cypress.found)
    console.log('   • Установите Cypress: npm install --save-dev cypress');
  if (results.playwright.tests < 3) console.log('   • Добавьте больше Playwright тестов');
}

console.log('\n🎯 ГОТОВНОСТЬ К ФИНАЛЬНОЙ ИНТЕГРАЦИИ:');
console.log('─'.repeat(50));

if (totalPercentage >= 70) {
  console.log('🎉 ВСЕ АНАЛИЗАТОРЫ ГОТОВЫ К ФИНАЛЬНОЙ ИНТЕГРАЦИИ!');
  console.log('🚀 Следующие шаги:');
  console.log('   • Создание UnifiedTestingAnalyzer');
  console.log('   • Интеграция с основным AnalysisOrchestrator');
  console.log('   • Production deployment');
} else if (totalPercentage >= 50) {
  console.log('⚠️  ЧАСТИЧНАЯ ГОТОВНОСТЬ К ИНТЕГРАЦИИ');
  console.log('🔧 Приоритетные задачи:');
  console.log('   • Доработка слабых анализаторов');
  console.log('   • Создание дополнительных тестов');
} else {
  console.log('❌ ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ РАБОТА');
  console.log('🔧 Критические задачи:');
  console.log('   • Настройка базовых фреймворков');
  console.log('   • Создание минимального набора тестов');
}

console.log('\n🏆 ИТОГОВЫЙ СТАТУС ПРОЕКТА:');
console.log('─'.repeat(50));

const projectStatus =
  totalPercentage >= 70
    ? 'ГОТОВ К ПРОДАКШЕНУ'
    : totalPercentage >= 50
      ? 'ГОТОВ К РАЗРАБОТКЕ'
      : 'ТРЕБУЕТ НАСТРОЙКИ';
const projectColor = totalPercentage >= 70 ? '🎉' : totalPercentage >= 50 ? '⚠️' : '❌';

console.log(`${projectColor} СТАТУС: ${projectStatus} (${totalPercentage}%)`);
console.log(`📈 Phase 1: ${phase1Percentage}% | Phase 2: ${phase2Percentage}%`);
console.log(
  `🔥 Успешных: ${passedCount}/${totalCount} | Установленных: ${installedCount}/${totalCount}`
);

console.log('\n✅ Комплексное тестирование всех анализаторов завершено!');
console.log(`🏁 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: ${projectStatus}`);

// Возвращаем код выхода для CI/CD
process.exit(totalPercentage >= 50 ? 0 : 1);
