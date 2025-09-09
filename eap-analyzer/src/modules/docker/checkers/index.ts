/**
 * Docker Module Checkers - экспорт всех чекеров для Docker модуля
 */

import { DockerSecurityChecker } from './security.checker.js';
import { DockerOptimizationChecker } from './optimization.checker.js';

export { DockerSecurityChecker } from './security.checker.js';
export { DockerOptimizationChecker } from './optimization.checker.js';

// Массив всех Docker чекеров для удобного импорта
export const DOCKER_CHECKERS = [DockerSecurityChecker, DockerOptimizationChecker] as const;
