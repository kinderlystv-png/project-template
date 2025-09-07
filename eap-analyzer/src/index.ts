/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Точка входа для модуля
 */

// Основные классы
export { GoldenStandardAnalyzer } from './analyzer.js';

// Проверочные модули
export { DockerChecker } from './checkers/docker.js';
export { EMTChecker } from './checkers/emt.js';

// Утилиты
export * from './utils/index.js';

// Типы
export * from './types/index.js';

// Тестовая функция
export { testAnalyzer } from './test.js';
