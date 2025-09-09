/**
 * EMT Module Checkers - экспорт всех чекеров для EMT модуля
 */

import { EMTRoutesChecker } from './routes.checker.js';
import { EMTConfigChecker } from './config.checker.js';
import { EMTDependenciesChecker } from './dependencies.checker.js';

export { EMTRoutesChecker } from './routes.checker.js';
export { EMTConfigChecker } from './config.checker.js';
export { EMTDependenciesChecker } from './dependencies.checker.js';

// Массив всех EMT чекеров для удобного импорта
export const EMT_CHECKERS = [EMTRoutesChecker, EMTConfigChecker, EMTDependenciesChecker] as const;
