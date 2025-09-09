/**
 * Modules - экспорт всех модулей EAP Analyzer
 */

import { EMTModule } from './emt/index.js';
import { DockerModule } from './docker/index.js';

// EMT Module
export {
  EMTAnalyzer,
  EMTModule,
  EMTRoutesChecker,
  EMTConfigChecker,
  EMTDependenciesChecker,
  EMT_CHECKERS,
} from './emt/index.js';

export type { EMTMetrics, EMTRoute, EMTComponent, EMTService } from './emt/index.js';

// Docker Module
export {
  DockerAnalyzer,
  DockerModule,
  DockerSecurityChecker,
  DockerOptimizationChecker,
  DOCKER_CHECKERS,
} from './docker/index.js';

export type { DockerMetrics, DockerFile } from './docker/index.js';

// Все модули для удобного импорта
export const ALL_MODULES = {
  emt: EMTModule,
  docker: DockerModule,
} as const;

// Все анализаторы
import { EMTAnalyzer } from './emt/index.js';
import { DockerAnalyzer } from './docker/index.js';

export const ALL_ANALYZERS = [EMTAnalyzer, DockerAnalyzer] as const;

// Все чекеры из модулей
import { EMT_CHECKERS } from './emt/index.js';
import { DOCKER_CHECKERS } from './docker/index.js';

export const ALL_MODULE_CHECKERS = [...EMT_CHECKERS, ...DOCKER_CHECKERS] as const;
