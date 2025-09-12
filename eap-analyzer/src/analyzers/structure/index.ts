/**
 * Structure Analyzers - анализаторы структуры проекта
 */

export { FileStructureAnalyzer } from './FileStructureAnalyzer.js';

// Экспорт для использования в системе регистрации
import { FileStructureAnalyzer } from './FileStructureAnalyzer.js';

export const STRUCTURE_ANALYZERS = [FileStructureAnalyzer] as const;
