/**
 * Простой тест PlaywrightChecker без TypeScript (для быстрого запуска)
 */

import { pathToFileURL } from 'url';
import path from 'path';

console.log('\n🎭 Тестирование PlaywrightChecker...\n');

const projectPath = 'C:/alphacore/project-template';

// Тест 1: Проверка зависимости Playwright
console.log('🧪 Тест 1: Проверка Playwright зависимости');

try {
  const fs = await import('fs/promises');
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasPlaywright = !!(
    packageJson.dependencies?.['@playwright/test'] ||
    packageJson.devDependencies?.['@playwright/test'] ||
    packageJson.dependencies?.['playwright'] ||
    packageJson.devDependencies?.['playwright']
  );

  if (hasPlaywright) {
    console.log('✅ Playwright найден в зависимостях');
  } else {
    console.log('❌ Playwright не найден в зависимостях');
  }
} catch (error) {
  console.log('❌ Ошибка при проверке package.json:', error.message);
}

// Тест 2: Проверка конфигурации
console.log('\n🧪 Тест 2: Проверка конфигурации Playwright');

const configFiles = ['playwright.config.ts', 'playwright.config.js'];
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
  console.log('❌ Конфигурационный файл Playwright не найден');
}

// Тест 3: Анализ конфигурации
let configAnalysis = {
  testDir: 'tests/e2e',
  hasReports: false,
  browsers: [],
  parallelConfig: false,
  retryConfig: false,
};

if (configFound) {
  console.log('\n🧪 Тест 3: Анализ конфигурации');

  try {
    const fs = await import('fs/promises');
    const configContent = await fs.readFile(path.join(projectPath, configPath), 'utf8');

    // Анализируем конфигурацию
    const testDirMatch = configContent.match(/testDir:\s*['"`]([^'"`]+)['"`]/);
    if (testDirMatch) {
      configAnalysis.testDir = testDirMatch[1];
      console.log(`📁 Директория тестов: ${configAnalysis.testDir}`);
    }

    configAnalysis.hasReports =
      configContent.includes('reporter') &&
      (configContent.includes('html') || configContent.includes('junit'));
    console.log(`📊 Отчеты настроены: ${configAnalysis.hasReports ? 'да' : 'нет'}`);

    // Проверяем браузеры
    if (configContent.includes('chromium')) configAnalysis.browsers.push('chromium');
    if (configContent.includes('firefox')) configAnalysis.browsers.push('firefox');
    if (configContent.includes('webkit')) configAnalysis.browsers.push('webkit');
    if (configAnalysis.browsers.length === 0) configAnalysis.browsers.push('chromium');

    console.log(`🌐 Браузеры: ${configAnalysis.browsers.join(', ')}`);

    configAnalysis.parallelConfig =
      configContent.includes('fullyParallel') || configContent.includes('workers');
    console.log(`⚡ Параллельность: ${configAnalysis.parallelConfig ? 'да' : 'нет'}`);

    configAnalysis.retryConfig = configContent.includes('retries');
    console.log(`🔄 Retry механизм: ${configAnalysis.retryConfig ? 'да' : 'нет'}`);
  } catch (error) {
    console.log('❌ Ошибка при анализе конфигурации:', error.message);
  }
}

// Тест 4: Подсчет тестов
console.log('\n🧪 Тест 4: Подсчет тестовых файлов');

let testsFound = 0;

try {
  const fs = await import('fs/promises');
  const testDirPath = path.join(projectPath, configAnalysis.testDir);

  async function countTestsRecursively(dirPath) {
    let count = 0;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          count += await countTestsRecursively(fullPath);
        } else if (
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

  testsFound = await countTestsRecursively(testDirPath);
  console.log(`📝 Найдено E2E тестов: ${testsFound}`);
} catch (error) {
  console.log('⚠️  Не удалось подсчитать тесты:', error.message);
}

// Вычисляем оценку
console.log('\n📊 РЕЗУЛЬТАТ АНАЛИЗА PLAYWRIGHT:');
console.log('─'.repeat(60));

let score = 0;
let passed = false;

if (!configFound) {
  score = 15;
  console.log('❌ Результат: НЕУДАЧА');
  console.log(`📊 Оценка: ${score}/100`);
  console.log('📝 Сообщение: Конфигурационный файл Playwright не найден');
  console.log('💡 Рекомендации:');
  console.log('   • Создайте playwright.config.ts');
  console.log('   • Настройте базовую конфигурацию тестов');
} else if (testsFound === 0) {
  score = 30;
  console.log('⚠️  Результат: ЧАСТИЧНО');
  console.log(`📊 Оценка: ${score}/100`);
  console.log('📝 Сообщение: Playwright конфигурация найдена, но E2E тесты отсутствуют');
  console.log('💡 Рекомендации:');
  console.log(`   • Создайте E2E тесты в директории ${configAnalysis.testDir}`);
  console.log('   • Добавьте файлы с расширением .spec.ts');
} else {
  score = 40; // Базовые баллы

  if (configAnalysis.hasReports) score += 15;
  if (configAnalysis.parallelConfig) score += 10;
  if (configAnalysis.retryConfig) score += 10;
  if (configAnalysis.browsers.length >= 2) score += 10;
  if (testsFound >= 3) score += 10;
  if (testsFound >= 10) score += 5;

  passed = score >= 70;

  console.log(`${passed ? '✅' : '⚠️'} Результат: ${passed ? 'УСПЕХ' : 'ЧАСТИЧНО'}`);
  console.log(`📊 Оценка: ${Math.min(score, 100)}/100`);
  console.log(
    `📝 Сообщение: Playwright E2E: найдено ${testsFound} тестов, ${configAnalysis.browsers.length} браузеров`
  );

  console.log('📋 Детали:');
  console.log(`   • Найдено тестов: ${testsFound}`);
  console.log(`   • Браузеры: ${configAnalysis.browsers.join(', ')}`);
  console.log(`   • Отчеты: ${configAnalysis.hasReports ? 'настроены' : 'не настроены'}`);
  console.log(`   • Параллельность: ${configAnalysis.parallelConfig ? 'включена' : 'выключена'}`);
  console.log(`   • Retry: ${configAnalysis.retryConfig ? 'настроен' : 'не настроен'}`);

  if (!passed) {
    console.log('💡 Рекомендации:');
    if (!configAnalysis.hasReports) {
      console.log('   • Настройте генерацию отчетов (HTML, JUnit)');
    }
    if (!configAnalysis.parallelConfig) {
      console.log('   • Включите параллельное выполнение тестов');
    }
    if (testsFound < 5) {
      console.log('   • Увеличьте покрытие E2E тестами критических сценариев');
    }
  }
}

console.log('─'.repeat(60));

console.log('\n🎭 ЗАКЛЮЧЕНИЕ:');
if (passed) {
  console.log('🎉 PlaywrightChecker: конфигурация и тесты в отличном состоянии!');
} else if (score >= 30) {
  console.log('🔧 PlaywrightChecker: базовая настройка выполнена, требуются улучшения');
} else {
  console.log('⚠️  PlaywrightChecker: требуется первоначальная настройка');
}

console.log(`🏆 Итоговая оценка: ${Math.min(score, 100)}/100`);
console.log('\n✅ Тестирование PlaywrightChecker завершено!');
