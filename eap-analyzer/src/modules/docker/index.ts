/**
 * Docker Module - полный модуль для анализа Docker конфигураций
 */

import { DockerAnalyzer } from './analyzer.js';
import { DOCKER_CHECKERS } from './checkers/index.js';

export { DockerAnalyzer } from './analyzer.js';
export type { DockerMetrics, DockerFile } from './analyzer.js';

export {
  DockerSecurityChecker,
  DockerOptimizationChecker,
  DOCKER_CHECKERS,
} from './checkers/index.js';

// Основной экспорт модуля
export const DockerModule = {
  analyzer: DockerAnalyzer,
  checkers: DOCKER_CHECKERS,
  name: 'Docker Module',
  version: '3.0.0',
} as const;
