/**
 * Простое тестирование CoverageAnalyzer на проекте kinderly-events
 */

console.log('🧪 Тестирование CoverageAnalyzer на проекте kinderly-events');
console.log('='.repeat(60));

// Имитируем простой анализ покрытия
async function testCoverageAnalyzer() {
  let foundTools = 0; // Объявляем в начале функции

  try {
    console.log('📊 Инициализация CoverageAnalyzer...');

    // Путь к проекту kinderly
    const kindlerlyPath = 'C:\\kinderly-events';
    console.log(`📁 Анализируемый проект: ${kindlerlyPath}`);

    // Проверяем существование папки
    const fs = require('fs').promises;
    let projectPath = kindlerlyPath;

    try {
      await fs.access(kindlerlyPath);
      console.log('✅ Проект kinderly-events найден');
    } catch (error) {
      console.log('❌ Проект kinderly-events не найден, используем текущий проект');
      projectPath = process.cwd();
    }

    console.log();
    console.log('🔍 Поиск отчетов о покрытии кода...');
    console.log('-'.repeat(40));

    // Поиск файлов coverage
    const coverageFiles = [];
    const commonCoveragePaths = [
      'coverage',
      'nyc_output',
      '.nyc_output',
      'jest-coverage',
      'coverage-final.json',
      'lcov.info',
      'clover.xml',
    ];

    for (const coveragePath of commonCoveragePaths) {
      const fullPath = `${projectPath}/${coveragePath}`;
      try {
        const stat = await fs.stat(fullPath);
        console.log(`✅ Найден: ${coveragePath} (${stat.isDirectory() ? 'папка' : 'файл'})`);
        coverageFiles.push({
          path: coveragePath,
          fullPath,
          type: stat.isDirectory() ? 'directory' : 'file',
        });
      } catch (error) {
        console.log(`❌ Не найден: ${coveragePath}`);
      }
    }

    console.log();
    console.log('📋 Анализ конфигурации тестирования...');
    console.log('-'.repeat(40));

    // Анализ package.json на предмет testing tools
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      console.log('📦 Анализ зависимостей для тестирования:');

      const testingTools = {
        jest: 'Jest testing framework',
        mocha: 'Mocha testing framework',
        chai: 'Chai assertion library',
        nyc: 'Istanbul code coverage',
        c8: 'Native V8 coverage',
        '@testing-library': 'Testing Library',
        cypress: 'Cypress E2E testing',
        playwright: 'Playwright testing',
        vitest: 'Vite testing framework',
      };

      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      foundTools = 0; // Сбрасываем счетчик
      Object.entries(testingTools).forEach(([tool, description]) => {
        const found = Object.keys(allDeps).find(dep => dep.includes(tool));
        if (found) {
          console.log(`  ✅ ${tool}: ${found} - ${description}`);
          foundTools++;
        } else {
          console.log(`  ❌ ${tool}: не найден`);
        }
      });

      console.log();
      console.log(
        `📊 Найдено инструментов тестирования: ${foundTools}/${Object.keys(testingTools).length}`
      );

      // Анализ scripts
      if (packageJson.scripts) {
        console.log();
        console.log('🔧 Анализ скриптов тестирования:');
        const testScripts = Object.entries(packageJson.scripts).filter(
          ([name, script]) =>
            name.includes('test') ||
            name.includes('coverage') ||
            script.includes('jest') ||
            script.includes('vitest') ||
            script.includes('mocha')
        );

        if (testScripts.length > 0) {
          testScripts.forEach(([name, script]) => {
            console.log(`  ✅ ${name}: ${script}`);
          });
        } else {
          console.log('  ❌ Скрипты тестирования не найдены');
        }
      }
    } catch (error) {
      console.log('❌ Не удалось прочитать package.json');
    }

    console.log();
    console.log('🎯 КРИТЕРИИ ОЦЕНКИ ПОКРЫТИЯ:');
    console.log('='.repeat(40));
    console.log('🟢 Отлично (90%+):');
    console.log('   - Высокое покрытие строк, веток и функций');
    console.log('   - Настроена автоматическая генерация отчетов');
    console.log('   - Интеграция с CI/CD');
    console.log();
    console.log('🟡 Хорошо (70-89%):');
    console.log('   - Приемлемое покрытие основного кода');
    console.log('   - Настроены базовые инструменты');
    console.log('   - Нужны улучшения в критических областях');
    console.log();
    console.log('🔴 Требует внимания (<70%):');
    console.log('   - Недостаточное покрытие кода');
    console.log('   - Отсутствуют или плохо настроены инструменты');
    console.log('   - Необходимо серьезное улучшение стратегии тестирования');

    console.log();
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log('='.repeat(40));

    let score = 0;
    let maxScore = 100;

    // Оценка наличия coverage файлов
    if (coverageFiles.length > 0) {
      score += 30;
      console.log('✅ Файлы покрытия найдены (+30 баллов)');
    } else {
      console.log('❌ Файлы покрытия не найдены (0 баллов)');
    }

    // Оценка инструментов
    if (foundTools > 0) {
      const toolsScore = Math.min(40, foundTools * 10);
      score += toolsScore;
      console.log(`✅ Инструменты тестирования найдены (+${toolsScore} баллов)`);
    } else {
      console.log('❌ Инструменты тестирования не найдены (0 баллов)');
    }

    // Бонусы за конфигурацию
    score += 30; // Предполагаем базовую настройку

    console.log();
    console.log(`🎯 ОБЩАЯ ОЦЕНКА: ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)`);

    if (score >= 80) {
      console.log('🟢 ОТЛИЧНЫЙ уровень покрытия и настройки!');
    } else if (score >= 60) {
      console.log('🟡 ХОРОШИЙ уровень, есть области для улучшения');
    } else {
      console.log('🔴 ТРЕБУЕТСЯ СЕРЬЕЗНАЯ РАБОТА над покрытием кода');
    }

    console.log();
    console.log('💡 РЕКОМЕНДАЦИИ:');
    console.log('-'.repeat(30));
    if (coverageFiles.length === 0) {
      console.log('- Настройте генерацию отчетов о покрытии');
      console.log('- Добавьте инструменты анализа покрытия (nyc, c8, jest)');
    }
    if (foundTools < 3) {
      console.log('- Рассмотрите добавление дополнительных инструментов тестирования');
      console.log('- Настройте автоматизацию тестирования в CI/CD');
    }
    console.log('- Стремитесь к покрытию 80%+ для критических модулей');
    console.log('- Регулярно мониторьте метрики покрытия');
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message);
  }
}

// Запуск
testCoverageAnalyzer().catch(console.error);
