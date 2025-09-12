#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                PERFORMANCE CONFIG VALIDATOR                  ║
 * ║         Валидация и проверка performance конфигурации        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════
// 🔧 ВАЛИДАЦИОННЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════════════════

/**
 * Проверяет существование файлов конфигурации
 */
function validateConfigFiles() {
  console.log('🔍 Проверка файлов конфигурации...');

  const requiredFiles = [
    'vitest.performance.config.ts',
    'test-utils/performance-reporter.js',
    'test-utils/performance-setup.ts',
    'test-utils/memory-profiler.ts',
    'test-utils/global-performance-setup.ts',
    'tests/config/vitest-performance-config.test.ts',
    'tests/performance/example.performance.test.ts',
  ];

  const missing = [];
  for (const file of requiredFiles) {
    const fullPath = resolve(__dirname, '..', file);
    if (!existsSync(fullPath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Отсутствуют файлы:');
    missing.forEach(file => console.error(`   - ${file}`));
    return false;
  }

  console.log('✅ Все файлы конфигурации найдены');
  return true;
}

/**
 * Проверяет загружаемость конфигурации
 */
async function validateConfigLoading() {
  console.log('📥 Проверка загружаемости конфигурации...');

  try {
    const config = await import('../vitest.performance.config.ts');

    if (!config.default) {
      throw new Error('Конфигурация не экспортирует default');
    }

    if (typeof config.getOptimalWorkerCount !== 'function') {
      throw new Error('Функция getOptimalWorkerCount не экспортирована');
    }

    console.log('✅ Конфигурация загружается корректно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка загрузки конфигурации:', error.message);
    return false;
  }
}

/**
 * Проверяет функцию getOptimalWorkerCount
 */
async function validateWorkerCount() {
  console.log('⚡ Проверка функции getOptimalWorkerCount...');

  try {
    const { getOptimalWorkerCount } = await import('../vitest.performance.config.ts');

    const workerCount = getOptimalWorkerCount();

    if (!Number.isInteger(workerCount) || workerCount <= 0) {
      throw new Error(`Некорректное количество воркеров: ${workerCount}`);
    }

    if (workerCount > 32) {
      console.warn('⚠️  Большое количество воркеров:', workerCount);
    }

    console.log(`✅ Оптимальное количество воркеров: ${workerCount}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки воркеров:', error.message);
    return false;
  }
}

/**
 * Проверяет наличие npm scripts
 */
function validateNpmScripts() {
  console.log('📦 Проверка npm scripts...');

  try {
    const packageJson = require('../package.json');
    const requiredScripts = [
      'test:performance',
      'test:performance:config',
      'test:performance:smoke',
      'test:validate-performance',
    ];

    const missing = requiredScripts.filter(script => !packageJson.scripts[script]);

    if (missing.length > 0) {
      console.error('❌ Отсутствуют npm scripts:');
      missing.forEach(script => console.error(`   - ${script}`));
      return false;
    }

    console.log('✅ Все npm scripts найдены');
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки npm scripts:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 ОСНОВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 Запуск валидации performance конфигурации\n');

  const results = [];

  results.push(validateConfigFiles());
  results.push(await validateConfigLoading());
  results.push(await validateWorkerCount());
  results.push(validateNpmScripts());

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Результаты валидации: ${passed}/${total} проверок пройдено`);

  if (passed === total) {
    console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! Performance конфигурация готова к использованию');
    process.exit(0);
  } else {
    console.log('❌ Есть проблемы в конфигурации. Исправьте их перед использованием');
    process.exit(1);
  }
}

// Запуск
main().catch(error => {
  console.error('💥 Критическая ошибка валидации:', error);
  process.exit(1);
});
