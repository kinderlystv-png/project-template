/**
 * Types and interfaces for Template Library
 * Типы и интерфейсы для библиотеки шаблонов
 */

/**
 * Категории шаблонов
 */
export enum TemplateCategory {
  STANDARD = 'standard', // Стандартные отчеты
  EXECUTIVE = 'executive', // Для руководства
  TECHNICAL = 'technical', // Технические отчеты
  SECURITY = 'security', // Отчеты безопасности
  PERFORMANCE = 'performance', // Отчеты производительности
  CUSTOM = 'custom', // Пользовательские шаблоны
}

/**
 * Формат шаблона
 */
export enum TemplateFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  HTML = 'html',
}

/**
 * Уровень сложности шаблона
 */
export enum TemplateComplexity {
  SIMPLE = 'simple', // Простой шаблон
  MEDIUM = 'medium', // Средней сложности
  ADVANCED = 'advanced', // Продвинутый шаблон
}

/**
 * Метаданные шаблона
 */
export interface TemplateMetadata {
  id: string; // Уникальный идентификатор
  name: string; // Человекочитаемое название
  description: string; // Описание
  format: TemplateFormat; // Формат
  category: TemplateCategory; // Категория
  complexity: TemplateComplexity; // Уровень сложности
  version: string; // Версия
  author?: string; // Автор
  tags?: string[]; // Теги для поиска
  variables?: string[]; // Список используемых переменных
  dependencies?: string[]; // Зависимости от других шаблонов
  createdAt?: Date; // Дата создания
  updatedAt?: Date; // Дата обновления
}

/**
 * Шаблон отчета
 */
export interface Template {
  metadata: TemplateMetadata;
  content: string; // Содержимое шаблона
  partials?: Record<string, string>; // Частичные шаблоны (partials)
}

/**
 * Секция шаблона (переиспользуемый компонент)
 */
export interface TemplateSection {
  id: string;
  name: string;
  description?: string;
  content: string;
  format: TemplateFormat;
  variables?: string[];
}

/**
 * Результат компиляции шаблона
 */
export interface CompiledTemplate {
  content: string;
  metadata: TemplateMetadata;
  variables: Record<string, any>;
  compiledAt: Date;
  renderTime?: number; // Время рендеринга в мс
}

/**
 * Опции для компиляции шаблона
 */
export interface TemplateCompileOptions {
  strictMode?: boolean; // Строгий режим - ошибка при отсутствии переменных
  defaultValue?: string; // Значение по умолчанию для отсутствующих переменных
  enablePartials?: boolean; // Включить поддержку частичных шаблонов
  enableHelpers?: boolean; // Включить поддержку хелперов
}

/**
 * Результат валидации шаблона
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingVariables?: string[];
  unusedVariables?: string[];
}

/**
 * Статистика использования шаблона
 */
export interface TemplateUsageStats {
  id: string;
  name: string;
  usageCount: number;
  lastUsed?: Date;
  averageRenderTime?: number;
  errorCount: number;
}

/**
 * Конфигурация для поиска шаблонов
 */
export interface TemplateSearchQuery {
  format?: TemplateFormat;
  category?: TemplateCategory;
  complexity?: TemplateComplexity;
  tags?: string[];
  namePattern?: string; // Регулярное выражение для поиска по имени
  includeCustom?: boolean; // Включать пользовательские шаблоны
}

/**
 * Результат поиска шаблонов
 */
export interface TemplateSearchResult {
  templates: Template[];
  totalCount: number;
  searchQuery: TemplateSearchQuery;
}

/**
 * Фабрика для создания шаблонов
 */
export interface TemplateFactory {
  createTemplate(metadata: TemplateMetadata, content: string): Template;
  createSection(id: string, name: string, content: string, format: TemplateFormat): TemplateSection;
  validateTemplate(template: Template): TemplateValidationResult;
}

/**
 * Событие изменения шаблона
 */
export interface TemplateChangeEvent {
  type: 'added' | 'updated' | 'removed';
  templateId: string;
  timestamp: Date;
  details?: string;
}

/**
 * Слушатель событий шаблонов
 */
export type TemplateEventListener = (event: TemplateChangeEvent) => void;

/**
 * Интерфейс для кэша шаблонов
 */
export interface TemplateCache {
  get(key: string): CompiledTemplate | undefined;
  set(key: string, value: CompiledTemplate): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}
