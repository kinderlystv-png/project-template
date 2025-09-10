/**
 * Template Registry - Центральный реестр всех шаблонов
 * Синглтон для управления шаблонами, секциями и кэшем
 */

import {
  Template,
  TemplateSection,
  TemplateMetadata,
  TemplateFormat,
  TemplateCategory,
  TemplateComplexity,
  TemplateSearchQuery,
  TemplateSearchResult,
  TemplateChangeEvent,
  TemplateEventListener,
  TemplateUsageStats,
  CompiledTemplate,
  TemplateCache,
} from './types';

/**
 * Простой кэш для компилированных шаблонов
 */
class SimpleTemplateCache implements TemplateCache {
  private cache = new Map<string, CompiledTemplate>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): CompiledTemplate | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: CompiledTemplate): void {
    // Простая стратегия LRU - удаляем самый старый при превышении размера
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Реестр шаблонов - синглтон для управления всеми шаблонами
 */
export class TemplateRegistry {
  private static instance: TemplateRegistry;

  // Хранилища
  private templates: Map<string, Template> = new Map();
  private sections: Map<string, TemplateSection> = new Map();
  private usageStats: Map<string, TemplateUsageStats> = new Map();

  // Кэш и события
  private cache: TemplateCache;
  private eventListeners: TemplateEventListener[] = [];

  private constructor() {
    this.cache = new SimpleTemplateCache();
  }

  /**
   * Получение экземпляра синглтона
   */
  public static getInstance(): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry();
    }
    return TemplateRegistry.instance;
  }

  // ========== УПРАВЛЕНИЕ ШАБЛОНАМИ ==========

  /**
   * Регистрация шаблона
   */
  public registerTemplate(template: Template): void {
    // Валидация обязательных полей
    if (!template.metadata.id || !template.content) {
      throw new Error('Template must have id and content');
    }

    // Проверяем, что ID уникален
    if (this.templates.has(template.metadata.id)) {
      console.warn(`Template with id '${template.metadata.id}' already exists. Overwriting.`);
    }

    // Добавляем временные метки
    const now = new Date();
    template.metadata.createdAt = template.metadata.createdAt || now;
    template.metadata.updatedAt = now;

    // Регистрируем шаблон
    this.templates.set(template.metadata.id, template);

    // Инициализируем статистику
    if (!this.usageStats.has(template.metadata.id)) {
      this.usageStats.set(template.metadata.id, {
        id: template.metadata.id,
        name: template.metadata.name,
        usageCount: 0,
        errorCount: 0,
      });
    }

    // Уведомляем слушателей
    this.emitEvent({
      type: 'added',
      templateId: template.metadata.id,
      timestamp: now,
      details: `Template '${template.metadata.name}' registered`,
    });
  }

  /**
   * Получение шаблона по ID
   */
  public getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Удаление шаблона
   */
  public removeTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    this.templates.delete(id);
    this.usageStats.delete(id);

    // Очищаем кэш для этого шаблона
    this.cache.clear(); // Простое решение - очищаем весь кэш

    this.emitEvent({
      type: 'removed',
      templateId: id,
      timestamp: new Date(),
      details: `Template '${template.metadata.name}' removed`,
    });

    return true;
  }

  /**
   * Обновление шаблона
   */
  public updateTemplate(id: string, updates: Partial<Template>): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    // Обновляем шаблон
    const updatedTemplate: Template = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        id, // ID не должен изменяться
        updatedAt: new Date(),
      },
    };

    this.templates.set(id, updatedTemplate);

    // Очищаем кэш для этого шаблона
    this.cache.clear();

    this.emitEvent({
      type: 'updated',
      templateId: id,
      timestamp: new Date(),
      details: `Template '${updatedTemplate.metadata.name}' updated`,
    });

    return true;
  }

  // ========== УПРАВЛЕНИЕ СЕКЦИЯМИ ==========

  /**
   * Регистрация секции шаблона
   */
  public registerSection(section: TemplateSection): void {
    if (!section.id || !section.content) {
      throw new Error('Section must have id and content');
    }

    if (this.sections.has(section.id)) {
      console.warn(`Section with id '${section.id}' already exists. Overwriting.`);
    }

    this.sections.set(section.id, section);
  }

  /**
   * Получение секции по ID
   */
  public getSection(id: string): TemplateSection | undefined {
    return this.sections.get(id);
  }

  /**
   * Получение всех секций определенного формата
   */
  public getSectionsByFormat(format: TemplateFormat): TemplateSection[] {
    return Array.from(this.sections.values()).filter(section => section.format === format);
  }

  // ========== ПОИСК И ФИЛЬТРАЦИЯ ==========

  /**
   * Получение всех шаблонов определенного формата
   */
  public getTemplatesByFormat(format: TemplateFormat): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.metadata.format === format
    );
  }

  /**
   * Получение всех шаблонов определенной категории
   */
  public getTemplatesByCategory(category: TemplateCategory): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.metadata.category === category
    );
  }

  /**
   * Поиск шаблонов по тегам
   */
  public findTemplatesByTags(tags: string[]): Template[] {
    return Array.from(this.templates.values()).filter(template =>
      tags.some(tag => template.metadata.tags?.includes(tag))
    );
  }

  /**
   * Расширенный поиск шаблонов
   */
  public searchTemplates(query: TemplateSearchQuery): TemplateSearchResult {
    let results = Array.from(this.templates.values());

    // Фильтрация по формату
    if (query.format) {
      results = results.filter(t => t.metadata.format === query.format);
    }

    // Фильтрация по категории
    if (query.category) {
      results = results.filter(t => t.metadata.category === query.category);
    }

    // Фильтрация по сложности
    if (query.complexity) {
      results = results.filter(t => t.metadata.complexity === query.complexity);
    }

    // Фильтрация по тегам
    if (query.tags && query.tags.length > 0) {
      results = results.filter(t => query.tags!.some(tag => t.metadata.tags?.includes(tag)));
    }

    // Фильтрация по имени (регулярное выражение)
    if (query.namePattern) {
      try {
        const regex = new RegExp(query.namePattern, 'i');
        results = results.filter(t => regex.test(t.metadata.name));
      } catch (error) {
        console.warn(`Invalid regex pattern: ${query.namePattern}`);
      }
    }

    // Исключаем пользовательские шаблоны если не указано
    if (!query.includeCustom) {
      results = results.filter(t => t.metadata.category !== TemplateCategory.CUSTOM);
    }

    return {
      templates: results,
      totalCount: results.length,
      searchQuery: query,
    };
  }

  // ========== СТАТИСТИКА И КЭШ ==========

  /**
   * Обновление статистики использования
   */
  public updateUsageStats(templateId: string, renderTime?: number, hasError?: boolean): void {
    const stats = this.usageStats.get(templateId);
    if (!stats) {
      return;
    }

    stats.usageCount++;
    stats.lastUsed = new Date();

    if (renderTime !== undefined) {
      stats.averageRenderTime = stats.averageRenderTime
        ? (stats.averageRenderTime + renderTime) / 2
        : renderTime;
    }

    if (hasError) {
      stats.errorCount++;
    }

    this.usageStats.set(templateId, stats);
  }

  /**
   * Получение статистики использования
   */
  public getUsageStats(templateId?: string): TemplateUsageStats | TemplateUsageStats[] {
    if (templateId) {
      return (
        this.usageStats.get(templateId) || {
          id: templateId,
          name: 'Unknown',
          usageCount: 0,
          errorCount: 0,
        }
      );
    }

    return Array.from(this.usageStats.values()).sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Получение кэша
   */
  public getCache(): TemplateCache {
    return this.cache;
  }

  /**
   * Очистка кэша
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // ========== СОБЫТИЯ ==========

  /**
   * Подписка на события
   */
  public addEventListener(listener: TemplateEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Отписка от событий
   */
  public removeEventListener(listener: TemplateEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Отправка события
   */
  private emitEvent(event: TemplateChangeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in template event listener:', error);
      }
    });
  }

  // ========== УТИЛИТЫ ==========

  /**
   * Получение общей статистики реестра
   */
  public getRegistryStats(): {
    totalTemplates: number;
    totalSections: number;
    byFormat: Record<string, number>;
    byCategory: Record<string, number>;
    cacheSize: number;
  } {
    const templates = Array.from(this.templates.values());

    const byFormat: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    templates.forEach(template => {
      byFormat[template.metadata.format] = (byFormat[template.metadata.format] || 0) + 1;
      byCategory[template.metadata.category] = (byCategory[template.metadata.category] || 0) + 1;
    });

    return {
      totalTemplates: templates.length,
      totalSections: this.sections.size,
      byFormat,
      byCategory,
      cacheSize: this.cache.size(),
    };
  }

  /**
   * Экспорт всех шаблонов (для бэкапа)
   */
  public exportTemplates(): { templates: Template[]; sections: TemplateSection[] } {
    return {
      templates: Array.from(this.templates.values()),
      sections: Array.from(this.sections.values()),
    };
  }

  /**
   * Импорт шаблонов (для восстановления)
   */
  public importTemplates(data: { templates: Template[]; sections: TemplateSection[] }): void {
    // Очищаем текущие данные
    this.templates.clear();
    this.sections.clear();
    this.usageStats.clear();
    this.cache.clear();

    // Импортируем шаблоны
    data.templates.forEach(template => {
      this.registerTemplate(template);
    });

    // Импортируем секции
    data.sections.forEach(section => {
      this.registerSection(section);
    });
  }
}
