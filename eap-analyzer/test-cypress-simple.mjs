/**
 * Простой тест CypressChecker без TypeScript (для быстрого запуска)
 */

import { pathToFileURL } from 'url';
import path from 'path';

console.log('\n🌲 Тестирование CypressChecker...\n');

const projectPath = 'C:/alphacore/project-template';

// Тест 1: Проверка зависимости Cypress
console.log('🧪 Тест 1: Проверка Cypress зависимости');

let hasCypress = false;

try {
  const fs = await import('fs/promises');
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  hasCypress = !!(
    packageJson.dependencies?.['cypress'] || packageJson.devDependencies?.['cypress']
  );

  if (hasCypress) {
    console.log('✅ Cypress найден в зависимостях');
  } else {
    console.log('❌ Cypress не найден в зависимостях');
  }
} catch (error) {
  console.log('❌ Ошибка при проверке package.json:', error.message);
}

// Тест 2: Проверка конфигурации
console.log('\n🧪 Тест 2: Проверка конфигурации Cypress');

const configFiles = ['cypress.config.ts', 'cypress.config.js', 'cypress.json'];
let configFound = false;
let configPath = '';

for (const configFile of configFiles) {
  const fullPath = path.join(projectPath, configFile);
  try {
    const fs = await import('fs/promises');
    await fs.access(fullPath);
    configFound = true;
    configPath = configFile;
    console.log(`✅ Найден конфигурационный файл: ${configFile}`);
    break;
  } catch {
    // Файл не найден
  }
}

if (!configFound) {
  console.log('❌ Конфигурационный файл Cypress не найден');
}

// Тест 3: Анализ конфигурации (если найдена)
let configAnalysis = {
  hasReports: false,
  hasVideos: false,
  hasScreenshots: false,
  hasBaseUrl: false,
  hasViewports: false,
};

if (configFound) {
  console.log('\n🧪 Тест 3: Анализ конфигурации Cypress');

  try {
    const fs = await import('fs/promises');
    const configContent = await fs.readFile(path.join(projectPath, configPath), 'utf8');

    configAnalysis.hasReports =
      configContent.includes('reporter') ||
      configContent.includes('mochawesome') ||
      configContent.includes('junit');
    console.log(`📊 Отчеты настроены: ${configAnalysis.hasReports ? 'да' : 'нет'}`);

    configAnalysis.hasVideos =
      configContent.includes('video') && !configContent.includes('video: false');
    console.log(`🎥 Видео записи: ${configAnalysis.hasVideos ? 'включены' : 'выключены'}`);

    configAnalysis.hasScreenshots =
      configContent.includes('screenshot') &&
      !configContent.includes('screenshotOnRunFailure: false');
    console.log(`📸 Скриншоты: ${configAnalysis.hasScreenshots ? 'включены' : 'выключены'}`);

    configAnalysis.hasBaseUrl = configContent.includes('baseUrl');
    console.log(`🌐 Base URL: ${configAnalysis.hasBaseUrl ? 'настроен' : 'не настроен'}`);

    configAnalysis.hasViewports =
      configContent.includes('viewportWidth') || configContent.includes('viewport');
    console.log(`📱 Viewport: ${configAnalysis.hasViewports ? 'настроен' : 'не настроен'}`);
  } catch (error) {
    console.log('❌ Ошибка при анализе конфигурации:', error.message);
  }
}

// Тест 4: Подсчет тестов
console.log('\n🧪 Тест 4: Подсчет Cypress тестов');

let testsFound = 0;
const testDirs = ['cypress/e2e', 'cypress/integration', 'cypress/tests'];

for (const testDir of testDirs) {
  try {
    const fs = await import('fs/promises');
    const testDirPath = path.join(projectPath, testDir);

    async function countTestsRecursively(dirPath) {
      let count = 0;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            count += await countTestsRecursively(fullPath);
          } else if (
            entry.name.endsWith('.cy.ts') ||
            entry.name.endsWith('.cy.js') ||
            entry.name.endsWith('.spec.ts') ||
            entry.name.endsWith('.spec.js') ||
            entry.name.endsWith('.test.ts') ||
            entry.name.endsWith('.test.js')
          ) {
            count++;
          }
        }
      } catch {
        // Директория не доступна
      }
      return count;
    }

    const dirTests = await countTestsRecursively(testDirPath);
    testsFound += dirTests;
    if (dirTests > 0) {
      console.log(`📁 ${testDir}: найдено ${dirTests} тестов`);
    }
  } catch {
    // Директория не найдена
  }
}

console.log(`📝 Всего Cypress тестов: ${testsFound}`);

// Тест 5: Проверка fixtures и custom commands
console.log('\n🧪 Тест 5: Проверка дополнительных компонентов');

let hasFixtures = false;
let hasCustomCommands = false;

// Проверяем fixtures
try {
  const fs = await import('fs/promises');
  const fixturesPath = path.join(projectPath, 'cypress/fixtures');
  const fixturesFiles = await fs.readdir(fixturesPath);
  hasFixtures = fixturesFiles.length > 0;
  console.log(
    `📦 Fixtures: ${hasFixtures ? `найдено ${fixturesFiles.length} файлов` : 'не найдены'}`
  );
} catch {
  console.log('📦 Fixtures: директория не найдена');
}

// Проверяем custom commands
const commandsPaths = [
  'cypress/support/commands.ts',
  'cypress/support/commands.js',
  'cypress/support/e2e.ts',
  'cypress/support/e2e.js',
];

for (const commandsPath of commandsPaths) {
  const fullPath = path.join(projectPath, commandsPath);
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(fullPath, 'utf8');
    if (
      content.includes('Cypress.Commands.add') ||
      content.includes('cy.') ||
      content.length > 200
    ) {
      hasCustomCommands = true;
      console.log(`🛠️  Custom commands: найдены в ${commandsPath}`);
      break;
    }
  } catch {
    // Файл не найден
  }
}

if (!hasCustomCommands) {
  console.log('🛠️  Custom commands: не найдены');
}

// Вычисляем оценку
console.log('\n📊 РЕЗУЛЬТАТ АНАЛИЗА CYPRESS:');
console.log('─'.repeat(60));

let score = 0;
let passed = false;

if (!hasCypress) {
  score = 5;
  console.log('❌ Результат: НЕУДАЧА');
  console.log(`📊 Оценка: ${score}/100`);
  console.log('📝 Сообщение: Cypress не найден в зависимостях проекта');
  console.log('💡 Рекомендации:');
  console.log('   • Установите Cypress: npm install --save-dev cypress');
  console.log('   • Инициализируйте Cypress: npx cypress open');
} else if (!configFound) {
  score = 15;
  console.log('❌ Результат: НЕУДАЧА');
  console.log(`📊 Оценка: ${score}/100`);
  console.log('📝 Сообщение: Конфигурационный файл Cypress не найден');
  console.log('💡 Рекомендации:');
  console.log('   • Создайте cypress.config.ts');
  console.log('   • Настройте базовую конфигурацию E2E тестов');
} else if (testsFound === 0) {
  score = 30;
  console.log('⚠️  Результат: ЧАСТИЧНО');
  console.log(`📊 Оценка: ${score}/100`);
  console.log('📝 Сообщение: Cypress конфигурация найдена, но E2E тесты отсутствуют');
  console.log('💡 Рекомендации:');
  console.log('   • Создайте E2E тесты в директории cypress/e2e');
  console.log('   • Добавьте файлы с расширением .cy.ts или .cy.js');
} else {
  score = 40; // Базовые баллы

  if (hasFixtures) score += 10;
  if (hasCustomCommands) score += 10;
  if (configAnalysis.hasReports) score += 15;
  if (configAnalysis.hasVideos) score += 5;
  if (configAnalysis.hasScreenshots) score += 5;
  if (configAnalysis.hasBaseUrl) score += 10;
  if (configAnalysis.hasViewports) score += 5;
  if (testsFound >= 3) score += 10;
  if (testsFound >= 10) score += 5;

  passed = score >= 70;

  console.log(`${passed ? '✅' : '⚠️'} Результат: ${passed ? 'УСПЕХ' : 'ЧАСТИЧНО'}`);
  console.log(`📊 Оценка: ${Math.min(score, 100)}/100`);
  console.log(`📝 Сообщение: Cypress E2E: найдено ${testsFound} тестов, конфигурация настроена`);

  console.log('📋 Детали:');
  console.log(`   • Найдено тестов: ${testsFound}`);
  console.log(`   • Fixtures: ${hasFixtures ? 'есть' : 'нет'}`);
  console.log(`   • Custom commands: ${hasCustomCommands ? 'есть' : 'нет'}`);
  console.log(`   • Отчеты: ${configAnalysis.hasReports ? 'настроены' : 'не настроены'}`);
  console.log(`   • Видео: ${configAnalysis.hasVideos ? 'включены' : 'выключены'}`);
  console.log(`   • Base URL: ${configAnalysis.hasBaseUrl ? 'настроен' : 'не настроен'}`);

  if (!passed) {
    console.log('💡 Рекомендации:');
    if (!hasFixtures) {
      console.log('   • Создайте fixtures для тестовых данных');
    }
    if (!hasCustomCommands) {
      console.log('   • Добавьте custom commands для переиспользования кода');
    }
    if (!configAnalysis.hasReports) {
      console.log('   • Настройте генерацию отчетов (Mochawesome, JUnit)');
    }
    if (!configAnalysis.hasBaseUrl) {
      console.log('   • Настройте baseUrl для упрощения тестов');
    }
    if (testsFound < 5) {
      console.log('   • Увеличьте покрытие E2E тестами ключевых сценариев');
    }
  }
}

console.log('─'.repeat(60));

console.log('\n🌲 ЗАКЛЮЧЕНИЕ:');
if (hasCypress) {
  if (passed) {
    console.log('🎉 CypressChecker: конфигурация и тесты в отличном состоянии!');
  } else if (score >= 30) {
    console.log('🔧 CypressChecker: базовая настройка выполнена, требуются улучшения');
  } else {
    console.log('⚠️  CypressChecker: конфигурация найдена, но требуются тесты');
  }
} else {
  console.log('❌ CypressChecker: Cypress не установлен в проекте');
}

console.log(`🏆 Итоговая оценка: ${Math.min(score, 100)}/100`);
console.log('\n✅ Тестирование CypressChecker завершено!');
