#!/usr/bin/env node

/**
 * CLI интерфейс для Эталонного Анализатора Проектов (ЭАП)
 */

import { Command } from 'commander';
import * as path from 'path';
import { GoldenStandardAnalyzer } from './analyzer.js';

const program = new Command();

program
  .name('eap')
  .description('Эталонный Анализатор Проектов (ЭАП) - анализ по золотому стандарту SHINOMONTAGKA')
  .version('1.0.0');

program
  .command('analyze')
  .alias('a')
  .description('Анализировать проект по золотому стандарту')
  .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
  .option('-o, --output <file>', 'Сохранить результаты в JSON файл')
  .option('-r, --report <file>', 'Создать HTML отчет')
  .option('--silent', 'Тихий режим (только результат)')
  .action(
    async (
      projectPath: string,
      options: { output?: string; report?: string; silent?: boolean }
    ) => {
      try {
        const resolvedPath = path.resolve(projectPath);

        if (!options.silent) {
          // eslint-disable-next-line no-console
          console.log('🔍 Запуск анализа проекта...');
          // eslint-disable-next-line no-console
          console.log(`📂 Анализируем: ${resolvedPath}`);
          // eslint-disable-next-line no-console
          console.log('');
        }

        const analyzer = new GoldenStandardAnalyzer();
        const result = await analyzer.analyzeProject(resolvedPath);

        // Сохранение результатов
        if (options.output) {
          await analyzer.saveResults(result, options.output);
        }

        if (options.report) {
          // TODO: Реализовать создание HTML отчета
          // eslint-disable-next-line no-console
          console.log('📄 HTML отчет будет реализован в следующей версии');
        }

        // Возвращаем код завершения в зависимости от результата
        if (result.summary.percentage >= 75) {
          process.exit(0); // Успех
        } else if (result.summary.percentage >= 50) {
          process.exit(1); // Предупреждение
        } else {
          process.exit(2); // Критические проблемы
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка при анализе:', error instanceof Error ? error.message : error);
        process.exit(3);
      }
    }
  );

program
  .command('check')
  .alias('c')
  .description('Быстрая проверка готовности проекта')
  .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
  .action(async (projectPath: string) => {
    try {
      const analyzer = new GoldenStandardAnalyzer();
      const result = await analyzer.analyzeProject(path.resolve(projectPath));

      // Краткий вывод
      // eslint-disable-next-line no-console
      console.log('\n🎯 КРАТКИЙ РЕЗУЛЬТАТ:');
      // eslint-disable-next-line no-console
      console.log(`   Оценка: ${result.summary.percentage}/100`);
      // eslint-disable-next-line no-console
      console.log(
        `   Проверок пройдено: ${result.summary.passedChecks}/${result.summary.totalChecks}`
      );
      // eslint-disable-next-line no-console
      console.log(`   Критических проблем: ${result.summary.criticalIssues}`);

      if (result.summary.percentage >= 75) {
        // eslint-disable-next-line no-console
        console.log('✅ Проект готов к продакшену!');
      } else {
        // eslint-disable-next-line no-console
        console.log('⚠️ Проект требует доработки.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Ошибка:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Инициализация проекта с базовыми файлами золотого стандарта')
  .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
  .action(async (_projectPath: string) => {
    // eslint-disable-next-line no-console
    console.log('🚀 Инициализация проекта по золотому стандарту...');
    // eslint-disable-next-line no-console
    console.log('📝 Эта функция будет реализована в следующей версии');
    // eslint-disable-next-line no-console
    console.log('💡 Пока что используйте SHINOMONTAGKA template как основу');
  });

program
  .command('standard')
  .alias('s')
  .description('Показать информацию о золотом стандарте')
  .action(() => {
    // eslint-disable-next-line no-console
    console.log('📚 SHINOMONTAGKA Golden Standard');
    // eslint-disable-next-line no-console
    console.log('━'.repeat(50));
    // eslint-disable-next-line no-console
    console.log('🔬 ЭМТ (Эталонный Модуль Тестирования):');
    // eslint-disable-next-line no-console
    console.log('   • Vitest для unit/integration тестов');
    // eslint-disable-next-line no-console
    console.log('   • Playwright для E2E тестов');
    // eslint-disable-next-line no-console
    console.log('   • Coverage >= 75%');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🐳 Docker Infrastructure:');
    // eslint-disable-next-line no-console
    console.log('   • Multi-stage Dockerfile');
    // eslint-disable-next-line no-console
    console.log('   • Docker Compose для всех окружений');
    // eslint-disable-next-line no-console
    console.log('   • Безопасность и оптимизация');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🎯 И еще 5 компонентов золотого стандарта!');
  });

// Если нет аргументов, показываем help
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
