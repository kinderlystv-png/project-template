/**
 * Template Library - Главный экспорт
 * Библиотека шаблонов для EAP Analyzer v4.0
 */

// Основные типы и интерфейсы
export * from './types';

// Основные классы
export { TemplateRegistry } from './TemplateRegistry';
export { TemplateLoader } from './TemplateLoader';
export { TemplateManager } from './TemplateManager';

// Удобные реэкспорты для быстрого доступа
export { TemplateFormat, TemplateCategory, TemplateComplexity } from './types';

// Импортируем для использования в функциях
import { TemplateManager } from './TemplateManager';

// Фабрика для создания менеджера шаблонов
export function createTemplateManager(): TemplateManager {
  return new TemplateManager();
}

// Утилита для быстрой инициализации
export async function initializeTemplateLibrary(): Promise<TemplateManager> {
  const manager = new TemplateManager();
  await manager.initialize();
  return manager;
}

// Версия библиотеки
export const TEMPLATE_LIBRARY_VERSION = '1.0.0';
