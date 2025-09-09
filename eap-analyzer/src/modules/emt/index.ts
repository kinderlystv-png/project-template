/**
 * EMT Module - полный модуль для анализа EMT Framework проектов
 */

import { EMTAnalyzer } from './analyzer.js';
import { EMT_CHECKERS } from './checkers/index.js';

export { EMTAnalyzer } from './analyzer.js';
export type { EMTMetrics, EMTRoute, EMTComponent, EMTService } from './analyzer.js';

export {
  EMTRoutesChecker,
  EMTConfigChecker,
  EMTDependenciesChecker,
  EMT_CHECKERS,
} from './checkers/index.js';

// Основной экспорт модуля
export const EMTModule = {
  analyzer: EMTAnalyzer,
  checkers: EMT_CHECKERS,
  name: 'EMT Framework Module',
  version: '3.2.0',
} as const;
