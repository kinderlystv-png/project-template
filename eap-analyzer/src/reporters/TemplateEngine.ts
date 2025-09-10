/**
 * Template Engine
 * Движок шаблонов для генерации отчетов EAP v4.0
 */

/**
 * Переменные шаблона
 */
export interface TemplateVariables {
  [key: string]: any;
}

/**
 * Конфигурация шаблонизатора
 */
export interface TemplateEngineConfig {
  delimiters?: {
    open: string;
    close: string;
  };
  escapeHtml?: boolean;
  allowUnsafeCode?: boolean;
}

/**
 * Движок шаблонов для форматирования отчетов
 */
export class TemplateEngine {
  private config: Required<TemplateEngineConfig>;

  constructor(config: TemplateEngineConfig = {}) {
    this.config = {
      delimiters: { open: '{{', close: '}}' },
      escapeHtml: true,
      allowUnsafeCode: false,
      ...config,
    };
  }

  /**
   * Обрабатывает шаблон с переданными переменными
   */
  render(template: string, variables: TemplateVariables): string {
    let result = template;

    // Простая замена переменных
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `${this.config.delimiters.open}${key}${this.config.delimiters.close}`;
      const stringValue = this.formatValue(value);
      result = result.replace(new RegExp(this.escapeRegex(placeholder), 'g'), stringValue);
    }

    // Обработка условных блоков
    result = this.processConditionals(result, variables);

    // Обработка циклов
    result = this.processLoops(result, variables);

    return result;
  }

  /**
   * Форматирует значение для вставки в шаблон
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    const stringValue = String(value);

    if (this.config.escapeHtml) {
      return this.escapeHtml(stringValue);
    }

    return stringValue;
  }

  /**
   * Экранирует HTML символы
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }

  /**
   * Экранирует специальные символы для регулярного выражения
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Обрабатывает условные блоки {{#if condition}}...{{/if}}
   */
  private processConditionals(template: string, variables: TemplateVariables): string {
    const { open, close } = this.config.delimiters;
    const ifPattern = new RegExp(
      `${this.escapeRegex(open)}#if\\s+(\\w+)${this.escapeRegex(close)}([\\s\\S]*?)${this.escapeRegex(open)}/if${this.escapeRegex(close)}`,
      'g'
    );

    return template.replace(ifPattern, (match, conditionKey, content) => {
      const conditionValue = variables[conditionKey];
      const isTrue = Boolean(conditionValue) && conditionValue !== 0 && conditionValue !== '';

      return isTrue ? content : '';
    });
  }

  /**
   * Обрабатывает циклы {{#each array}}...{{/each}}
   */
  private processLoops(template: string, variables: TemplateVariables): string {
    const { open, close } = this.config.delimiters;
    const eachPattern = new RegExp(
      `${this.escapeRegex(open)}#each\\s+(\\w+)${this.escapeRegex(close)}([\\s\\S]*?)${this.escapeRegex(open)}/each${this.escapeRegex(close)}`,
      'g'
    );

    return template.replace(eachPattern, (match, arrayKey, itemTemplate) => {
      const array = variables[arrayKey];

      if (!Array.isArray(array)) {
        return '';
      }

      return array
        .map((item, index) => {
          // Создаем контекст для каждого элемента
          const itemContext = {
            ...variables,
            '@item': item,
            '@index': index,
            '@first': index === 0,
            '@last': index === array.length - 1,
            // Если элемент - объект, добавляем его свойства
            ...(typeof item === 'object' && item !== null ? item : { value: item }),
          };

          return this.render(itemTemplate, itemContext);
        })
        .join('');
    });
  }

  /**
   * Создает шаблон для секции отчета
   */
  static createSectionTemplate(title: string, content: string, level: number = 2): string {
    const hashes = '#'.repeat(level);
    return `
${hashes} ${title}

${content}
`;
  }

  /**
   * Создает шаблон для списка элементов
   */
  static createListTemplate(items: string[], ordered: boolean = false): string {
    const marker = ordered ? '1.' : '-';
    return items.map(item => `${marker} ${item}`).join('\n');
  }

  /**
   * Создает шаблон для таблицы
   */
  static createTableTemplate(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`);

    return [headerRow, separator, ...dataRows].join('\n');
  }

  /**
   * Создает готовые шаблоны для стандартных форматов
   */
  static getStandardTemplates() {
    return {
      markdown: {
        header: `# {{projectName}} - Анализ Проекта

**Дата анализа:** {{analysisDate}}
**Версия ЭАП:** {{version}}
**Общий балл:** {{summary.score}}/100 ({{summary.grade}})

---
`,
        summary: `## 📊 Сводка

- ✅ **Успешных проверок:** {{summary.passedChecks}}
- ❌ **Неудачных проверок:** {{summary.failedChecks}}
- 💡 **Рекомендаций:** {{summary.recommendations}}
{{#if summary.analysisTime}}
- ⏱️ **Время анализа:** {{summary.analysisTime}}мс
{{/if}}

---
`,
        section: `## {{title}}

{{#if description}}
{{description}}

{{/if}}
{{#if score}}
**Балл секции:** {{score}}/100

{{/if}}
{{#each items}}
{{#if @item.type}}
{{#if @item.type === 'success'}}✅{{/if}}
{{#if @item.type === 'warning'}}⚠️{{/if}}
{{#if @item.type === 'issue'}}❌{{/if}}
{{#if @item.type === 'info'}}ℹ️{{/if}}
{{/if}} {{@item.title}}
{{#if @item.description}}
   {{@item.description}}
{{/if}}

{{/each}}
`,
      },

      html: {
        header: `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectName}} - Анализ Проекта</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .score-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .score-a { background: #28a745; color: white; }
        .score-b { background: #17a2b8; color: white; }
        .score-c { background: #ffc107; color: black; }
        .score-d { background: #fd7e14; color: white; }
        .score-f { background: #dc3545; color: white; }
        .item { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .item.success { border-color: #28a745; background: #d4edda; }
        .item.warning { border-color: #ffc107; background: #fff3cd; }
        .item.issue { border-color: #dc3545; background: #f8d7da; }
        .item.info { border-color: #17a2b8; background: #d1ecf1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{projectName}} - Анализ Проекта</h1>
        <p><strong>Дата анализа:</strong> {{analysisDate}}</p>
        <p><strong>Версия ЭАП:</strong> {{version}}</p>
        <p><strong>Общий балл:</strong> {{summary.score}}/100
           <span class="score-badge score-{{summary.grade | lower}}">{{summary.grade}}</span>
        </p>
    </div>
`,
        summary: `    <div class="summary">
        <h2>📊 Сводка</h2>
        <ul>
            <li>✅ <strong>Успешных проверок:</strong> {{summary.passedChecks}}</li>
            <li>❌ <strong>Неудачных проверок:</strong> {{summary.failedChecks}}</li>
            <li>💡 <strong>Рекомендаций:</strong> {{summary.recommendations}}</li>
            {{#if summary.analysisTime}}
            <li>⏱️ <strong>Время анализа:</strong> {{summary.analysisTime}}мс</li>
            {{/if}}
        </ul>
    </div>
`,
        footer: `</body>
</html>`,
      },
    };
  }
}

export default TemplateEngine;
