/**
 * Template Manager - Менеджер шаблонов
 * Связующее звено между Registry, Loader и TemplateEngine
 * Обеспечивает высокоуровневый API для работы с шаблонами
 */

import { TemplateEngine } from '../TemplateEngine';
import { TemplateRegistry } from './TemplateRegistry';
import { TemplateLoader } from './TemplateLoader';
import {
  Template,
  TemplateSection,
  TemplateFormat,
  TemplateCategory,
  TemplateComplexity,
  CompiledTemplate,
  TemplateCompileOptions,
  TemplateSearchQuery,
  TemplateSearchResult,
  TemplateValidationResult,
  TemplateUsageStats,
} from './types';

/**
 * Опции для компиляции с дополнительными настройками
 */
interface ExtendedCompileOptions extends TemplateCompileOptions {
  useCache?: boolean; // Использовать кэш
  trackUsage?: boolean; // Отслеживать статистику использования
  timeRender?: boolean; // Измерять время рендеринга
}

/**
 * Результат предварительного просмотра
 */
interface PreviewResult {
  success: boolean;
  content?: string;
  error?: string;
  renderTime?: number;
}

/**
 * Менеджер шаблонов - основной класс для работы с библиотекой шаблонов
 */
export class TemplateManager {
  private registry: TemplateRegistry;
  private loader: TemplateLoader;
  private engine: TemplateEngine;
  private initialized: boolean = false;

  constructor(engine?: TemplateEngine) {
    this.registry = TemplateRegistry.getInstance();
    this.loader = new TemplateLoader();
    this.engine = engine || new TemplateEngine();
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ==========

  /**
   * Инициализация менеджера (загрузка встроенных шаблонов)
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loader.loadBuiltInTemplates();
      this.registerTemplateHelpers();
      this.initialized = true;
      console.log('TemplateManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TemplateManager:', error);
      throw error;
    }
  }

  /**
   * Регистрирует дополнительные хелперы для шаблонов
   */
  private registerTemplateHelpers(): void {
    // Можно добавить дополнительные хелперы в TemplateEngine
    // Здесь заглушка для будущего расширения
  }

  // ========== КОМПИЛЯЦИЯ ШАБЛОНОВ ==========

  /**
   * Компилирует шаблон по ID
   */
  public async compileTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: ExtendedCompileOptions = {}
  ): Promise<CompiledTemplate | null> {
    try {
      // Проверяем инициализацию
      if (!this.initialized) {
        await this.initialize();
      }

      // Создаем ключ для кэша
      const cacheKey = this.createCacheKey(templateId, variables, options);

      // Проверяем кэш
      if (options.useCache !== false) {
        const cached = this.registry.getCache().get(cacheKey);
        if (cached) {
          if (options.trackUsage !== false) {
            this.registry.updateUsageStats(templateId);
          }
          return cached;
        }
      }

      // Получаем шаблон
      const template = this.registry.getTemplate(templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
        return null;
      }

      // Измеряем время рендеринга
      const startTime = options.timeRender ? Date.now() : 0;

      // Компилируем шаблон
      let content: string;

      try {
        // Обрабатываем партиалы (частичные шаблоны)
        const processedTemplate = await this.processPartials(template);

        // Расширяем переменные дополнительными хелперами
        const enrichedVariables = this.enrichVariables(variables, template);

        // Компилируем с помощью TemplateEngine
        content = this.engine.render(processedTemplate.content, enrichedVariables);
      } catch (renderError) {
        const errorMessage =
          renderError instanceof Error ? renderError.message : String(renderError);
        console.error(`Template rendering failed for ${templateId}:`, errorMessage);

        // Обновляем статистику ошибок
        if (options.trackUsage !== false) {
          this.registry.updateUsageStats(templateId, undefined, true);
        }

        // В строгом режиме пробрасываем ошибку
        if (options.strictMode) {
          throw renderError;
        }

        // Иначе возвращаем сообщение об ошибке
        content = options.defaultValue || `Error rendering template: ${errorMessage}`;
      }

      const renderTime = options.timeRender ? Date.now() - startTime : undefined;

      // Создаем результат
      const compiled: CompiledTemplate = {
        content,
        metadata: template.metadata,
        variables,
        compiledAt: new Date(),
        renderTime,
      };

      // Сохраняем в кэш
      if (options.useCache !== false) {
        this.registry.getCache().set(cacheKey, compiled);
      }

      // Обновляем статистику
      if (options.trackUsage !== false) {
        this.registry.updateUsageStats(templateId, renderTime);
      }

      return compiled;
    } catch (error) {
      console.error(`Failed to compile template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Компилирует шаблон напрямую из содержимого
   */
  public compileContent(
    content: string,
    variables: Record<string, any>,
    options: ExtendedCompileOptions = {}
  ): string {
    try {
      const enrichedVariables = this.enrichVariables(variables);
      return this.engine.render(content, enrichedVariables);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (options.strictMode) {
        throw error;
      }

      return options.defaultValue || `Error: ${errorMessage}`;
    }
  }

  // ========== ПОИСК И УПРАВЛЕНИЕ ==========

  /**
   * Получает список доступных шаблонов по формату
   */
  public getAvailableTemplates(format?: TemplateFormat): Template[] {
    if (format) {
      return this.registry.getTemplatesByFormat(format);
    }

    // Возвращаем все шаблоны, отсортированные по категориям
    const allTemplates = this.registry.searchTemplates({}).templates;
    return allTemplates.sort((a, b) => {
      // Сначала стандартные, потом пользовательские
      if (a.metadata.category !== b.metadata.category) {
        if (a.metadata.category === TemplateCategory.STANDARD) return -1;
        if (b.metadata.category === TemplateCategory.STANDARD) return 1;
      }
      return a.metadata.name.localeCompare(b.metadata.name);
    });
  }

  /**
   * Поиск шаблонов
   */
  public searchTemplates(query: TemplateSearchQuery): TemplateSearchResult {
    return this.registry.searchTemplates(query);
  }

  /**
   * Получает шаблоны по категории
   */
  public getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.registry.getTemplatesByCategory(category);
  }

  /**
   * Получает рекомендуемые шаблоны для конкретного использования
   */
  public getRecommendedTemplates(
    format: TemplateFormat,
    complexity?: TemplateComplexity,
    tags?: string[]
  ): Template[] {
    const query: TemplateSearchQuery = {
      format,
      complexity,
      tags,
      includeCustom: false, // Только встроенные для рекомендаций
    };

    const result = this.registry.searchTemplates(query);

    // Сортируем по популярности (количество использований)
    return result.templates.sort((a, b) => {
      const statsA = this.registry.getUsageStats(a.metadata.id) as TemplateUsageStats;
      const statsB = this.registry.getUsageStats(b.metadata.id) as TemplateUsageStats;
      return statsB.usageCount - statsA.usageCount;
    });
  }

  // ========== ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР ==========

  /**
   * Предварительный просмотр шаблона с примерными данными
   */
  public async previewTemplate(
    templateId: string,
    sampleData?: Record<string, any>
  ): Promise<PreviewResult> {
    try {
      // Используем примерные данные или создаем базовые
      const variables = sampleData || this.createSampleData();

      const compiled = await this.compileTemplate(templateId, variables, {
        useCache: false,
        trackUsage: false,
        timeRender: true,
      });

      if (!compiled) {
        return {
          success: false,
          error: `Template ${templateId} not found or compilation failed`,
        };
      }

      return {
        success: true,
        content: compiled.content,
        renderTime: compiled.renderTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Создает примерные данные для предварительного просмотра
   */
  private createSampleData(): Record<string, any> {
    return {
      projectName: 'Sample Project',
      version: '1.0.0',
      analysisDate: new Date().toISOString(),
      generatedDate: new Date().toISOString(),
      summary: {
        score: 85,
        grade: 'B',
        passedChecks: 42,
        failedChecks: 8,
        recommendations: 5,
        analysisTime: 1250,
      },
      sections: [
        {
          title: 'Code Quality',
          description: 'Analysis of code quality metrics',
          score: 90,
          items: [
            {
              type: 'success',
              title: 'Good test coverage',
              description: 'Test coverage is above 80%',
              severity: 'low',
              recommendations: ['Maintain current coverage level'],
            },
            {
              type: 'warning',
              title: 'Complex functions detected',
              description: 'Some functions have high cyclomatic complexity',
              severity: 'medium',
              filePath: 'src/utils.ts',
              lineNumber: 45,
              recommendations: ['Refactor complex functions', 'Add unit tests'],
            },
          ],
        },
        {
          title: 'Security',
          description: 'Security analysis results',
          score: 75,
          items: [
            {
              type: 'issue',
              title: 'Potential XSS vulnerability',
              description: 'User input not properly sanitized',
              severity: 'high',
              filePath: 'src/components/Form.tsx',
              lineNumber: 23,
              code: 'dangerouslySetInnerHTML: { __html: userInput }',
              recommendations: ['Sanitize user input', 'Use safe rendering methods'],
            },
          ],
        },
      ],
      statistics: {
        filesCounted: 156,
        linesAnalyzed: 12450,
        issuesFound: 8,
        techDebtHours: 16,
        estimatedFixTime: 20,
      },
    };
  }

  // ========== ВАЛИДАЦИЯ ==========

  /**
   * Валидирует шаблон
   */
  public validateTemplate(templateId: string): TemplateValidationResult {
    const template = this.registry.getTemplate(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: [`Template ${templateId} not found`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка базовой структуры
    if (!template.content || template.content.trim().length === 0) {
      errors.push('Template content is empty');
    }

    // Проверка метаданных
    if (!template.metadata.name) {
      warnings.push('Template name is missing');
    }

    if (!template.metadata.description) {
      warnings.push('Template description is missing');
    }

    // Проверка синтаксиса шаблона
    try {
      this.engine.render(template.content, {});
    } catch (syntaxError) {
      errors.push(
        `Template syntax error: ${syntaxError instanceof Error ? syntaxError.message : String(syntaxError)}`
      );
    }

    // Проверка переменных
    const declaredVariables = template.metadata.variables || [];
    const usedVariables = this.extractUsedVariables(template.content);

    const missingVariables = usedVariables.filter(v => !declaredVariables.includes(v));
    const unusedVariables = declaredVariables.filter(v => !usedVariables.includes(v));

    if (missingVariables.length > 0) {
      warnings.push(`Undeclared variables: ${missingVariables.join(', ')}`);
    }

    if (unusedVariables.length > 0) {
      warnings.push(`Unused declared variables: ${unusedVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingVariables,
      unusedVariables,
    };
  }

  // ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЬСКИХ ШАБЛОНОВ ==========

  /**
   * Загружает шаблон из файла
   */
  public async loadTemplateFromFile(filePath: string): Promise<string | null> {
    const result = await this.loader.loadTemplateFromFile(filePath);

    if (result.success) {
      return result.templateId || null;
    } else {
      console.error(`Failed to load template: ${result.error}`);
      return null;
    }
  }

  /**
   * Загружает шаблоны из директории
   */
  public async loadTemplatesFromDirectory(dirPath: string): Promise<string[]> {
    const results = await this.loader.loadTemplatesFromDirectory(dirPath, { recursive: true });

    return results
      .filter(r => r.success)
      .map(r => r.templateId!)
      .filter(id => id !== undefined);
  }

  // ========== СТАТИСТИКА ==========

  /**
   * Получает статистику использования
   */
  public getUsageStatistics(): TemplateUsageStats[] {
    return this.registry.getUsageStats() as TemplateUsageStats[];
  }

  /**
   * Получает общую статистику менеджера
   */
  public getManagerStats(): {
    initialized: boolean;
    registry: ReturnType<TemplateRegistry['getRegistryStats']>;
    loader: ReturnType<TemplateLoader['getLoadStats']>;
    topUsedTemplates: TemplateUsageStats[];
  } {
    const usageStats = this.getUsageStatistics();

    return {
      initialized: this.initialized,
      registry: this.registry.getRegistryStats(),
      loader: this.loader.getLoadStats(),
      topUsedTemplates: usageStats.slice(0, 5),
    };
  }

  // ========== ПРИВАТНЫЕ УТИЛИТЫ ==========

  /**
   * Создает ключ для кэша
   */
  private createCacheKey(
    templateId: string,
    variables: Record<string, any>,
    options: ExtendedCompileOptions
  ): string {
    // Простой хеш на основе данных
    const variablesHash = JSON.stringify(variables);
    const optionsHash = JSON.stringify(options);
    return `${templateId}-${variablesHash.length}-${optionsHash.length}`;
  }

  /**
   * Обрабатывает партиалы в шаблоне
   */
  private async processPartials(template: Template): Promise<Template> {
    let content = template.content;

    // Ищем партиалы в формате {{>partial-name}}
    const partialPattern = /\{\{>\s*([^}]+)\s*\}\}/g;
    let match;

    while ((match = partialPattern.exec(content)) !== null) {
      const partialId = match[1].trim();
      const section = this.registry.getSection(partialId);

      if (section) {
        content = content.replace(match[0], section.content);
      } else {
        console.warn(`Partial not found: ${partialId}`);
        content = content.replace(match[0], `<!-- Partial not found: ${partialId} -->`);
      }
    }

    return {
      ...template,
      content,
    };
  }

  /**
   * Обогащает переменные дополнительными хелперами
   */
  private enrichVariables(
    variables: Record<string, any>,
    template?: Template
  ): Record<string, any> {
    return {
      ...variables,
      // Добавляем дополнительные утилиты
      formatDate: (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString();
      },
      formatDateTime: (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleString();
      },
      toLowerCase: (str: string) => str.toLowerCase(),
      toUpperCase: (str: string) => str.toUpperCase(),
      escapeHtml: (str: string) => this.escapeHtml(str),
      escapeJson: (str: string) => JSON.stringify(str).slice(1, -1),
    };
  }

  /**
   * Извлекает используемые переменные из содержимого
   */
  private extractUsedVariables(content: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim().split(' ')[0];
      if (
        variable &&
        !variable.startsWith('#') &&
        !variable.startsWith('/') &&
        !variable.startsWith('>')
      ) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Экранирует HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
