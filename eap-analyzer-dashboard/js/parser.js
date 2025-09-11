// Markdown Parser для EAP Analyzer отчетов
class EAPReportParser {
  constructor() {
    this.reports = [];
    this.components = new Map();
  }

  /**
   * Парсинг Markdown файла отчета
   * @param {string} markdownText - содержимое MD файла
   * @param {string} filename - имя файла
   * @param {Date} date - дата отчета
   */
  parseMarkdownReport(markdownText, filename, date = new Date()) {
    const report = {
      filename,
      date: this.extractDateFromContent(markdownText) || date,
      components: [],
      metadata: this.extractMetadata(markdownText),
    };

    // Парсинг компонентов с метриками
    report.components = this.extractComponents(markdownText);

    this.reports.push(report);
    this.updateComponentsHistory(report);

    return report;
  }

  /**
   * Извлечение компонентов и их метрик из Markdown
   */
  extractComponents(markdownText) {
    const components = [];
    const lines = markdownText.split('\n');

    // Регулярные выражения для поиска компонентов
    const componentPatterns = [
      // Формат: **ComponentName** [XX% / YY%] - description
      /\*\*(.*?)\*\*\s*\[(\d+)%\s*\/\s*(\d+)%\]\s*-\s*(.*)/g,
      // Формат: - **ComponentName** [XX% / YY%] - description
      /-\s*\*\*(.*?)\*\*\s*\[(\d+)%\s*\/\s*(\d+)%\]\s*-\s*(.*)/g,
      // Формат с дополнительной информацией о строках кода
      /\*\*(.*?)\*\*\s*\[(\d+)%\s*\/\s*(\d+)%\]\s*-\s*(.*?)\s*\((\d+)\s*строк/g,
    ];

    let currentCategory = 'unknown';

    for (const line of lines) {
      // Определение текущей категории
      const categoryMatch = line.match(/###?\s*\d*\.?\s*.*?\*\*(.*?)\s*\(.*?\)\*\*/);
      if (categoryMatch) {
        currentCategory = this.normalizeCategoryName(categoryMatch[1]);
        continue;
      }

      // Поиск компонентов
      for (const pattern of componentPatterns) {
        pattern.lastIndex = 0; // Сброс регулярного выражения
        const matches = pattern.exec(line);

        if (matches) {
          const component = {
            name: matches[1].trim(),
            logic: parseInt(matches[2]),
            functionality: parseInt(matches[3]),
            description: matches[4].trim(),
            category: currentCategory,
            lines: matches[5] ? parseInt(matches[5]) : null,
          };

          // Дополнительная очистка и валидация
          if (this.isValidComponent(component)) {
            components.push(component);
          }
        }
      }
    }

    return components;
  }

  /**
   * Извлечение метаданных из отчета
   */
  extractMetadata(markdownText) {
    const metadata = {
      title: null,
      avgLogic: null,
      avgFunctionality: null,
      totalComponents: null,
      topComponent: null,
    };

    // Поиск заголовка
    const titleMatch = markdownText.match(/^#\s*(.*?)$/m);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Поиск средних значений
    const avgLogicMatch = markdownText.match(/Средняя\s+готовность\s+логики[:\s]*(\d+\.?\d*)%/i);
    if (avgLogicMatch) {
      metadata.avgLogic = parseFloat(avgLogicMatch[1]);
    }

    const avgFuncMatch = markdownText.match(/Средняя\s+функциональность[:\s]*(\d+\.?\d*)%/i);
    if (avgFuncMatch) {
      metadata.avgFunctionality = parseFloat(avgFuncMatch[1]);
    }

    // Поиск общего количества компонентов
    const totalMatch = markdownText.match(/(\d+)\+?\s*(?:АКТИВНЫХ\s+)?КОМПОНЕНТОВ/i);
    if (totalMatch) {
      metadata.totalComponents = parseInt(totalMatch[1]);
    }

    return metadata;
  }

  /**
   * Извлечение даты из содержимого
   */
  extractDateFromContent(markdownText) {
    // Поиск различных форматов дат
    const datePatterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // DD.MM.YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    ];

    for (const pattern of datePatterns) {
      const match = markdownText.match(pattern);
      if (match) {
        if (pattern === datePatterns[0]) {
          // DD.MM.YYYY
          return new Date(match[3], match[2] - 1, match[1]);
        } else if (pattern === datePatterns[1]) {
          // YYYY-MM-DD
          return new Date(match[1], match[2] - 1, match[3]);
        } else if (pattern === datePatterns[2]) {
          // MM/DD/YYYY
          return new Date(match[3], match[1] - 1, match[2]);
        }
      }
    }

    return null;
  }

  /**
   * Нормализация названия категории
   */
  normalizeCategoryName(categoryName) {
    const categoryMap = {
      TESTING: 'testing',
      Тестирование: 'testing',
      SECURITY: 'security',
      Безопасность: 'security',
      PERFORMANCE: 'performance',
      Производительность: 'performance',
      DOCKER: 'docker',
      Контейнеризация: 'docker',
      'CODE QUALITY': 'core',
      'Качество кода': 'core',
      CORE: 'core',
      'Ядро системы': 'core',
      'AI Integration': 'ai',
      'ИИ интеграция': 'ai',
    };

    return categoryMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Валидация компонента
   */
  isValidComponent(component) {
    return (
      component.name &&
      component.name.length > 0 &&
      !isNaN(component.logic) &&
      !isNaN(component.functionality) &&
      component.logic >= 0 &&
      component.logic <= 100 &&
      component.functionality >= 0 &&
      component.functionality <= 100
    );
  }

  /**
   * Обновление истории компонентов
   */
  updateComponentsHistory(report) {
    for (const component of report.components) {
      const key = component.name;

      if (!this.components.has(key)) {
        this.components.set(key, {
          name: component.name,
          category: component.category,
          description: component.description,
          history: [],
        });
      }

      const existing = this.components.get(key);
      existing.history.push({
        date: report.date,
        logic: component.logic,
        functionality: component.functionality,
        lines: component.lines,
      });

      // Сортировка истории по дате
      existing.history.sort((a, b) => a.date - b.date);
    }
  }

  /**
   * Получение данных компонента с историей
   */
  getComponentHistory(componentName) {
    return this.components.get(componentName) || null;
  }

  /**
   * Получение всех отчетов
   */
  getAllReports() {
    return [...this.reports].sort((a, b) => b.date - a.date);
  }

  /**
   * Получение последнего отчета
   */
  getLatestReport() {
    return this.reports.length > 0
      ? this.reports.reduce((latest, current) => (current.date > latest.date ? current : latest))
      : null;
  }

  /**
   * Получение статистики по категориям
   */
  getCategoryStats() {
    const latest = this.getLatestReport();
    if (!latest) return {};

    const stats = {};

    for (const component of latest.components) {
      if (!stats[component.category]) {
        stats[component.category] = {
          components: [],
          avgLogic: 0,
          avgFunctionality: 0,
        };
      }
      stats[component.category].components.push(component);
    }

    // Вычисление средних значений
    for (const category in stats) {
      const components = stats[category].components;
      stats[category].avgLogic =
        components.reduce((sum, c) => sum + c.logic, 0) / components.length;
      stats[category].avgFunctionality =
        components.reduce((sum, c) => sum + c.functionality, 0) / components.length;
    }

    return stats;
  }

  /**
   * Экспорт данных в JSON
   */
  exportToJSON() {
    return JSON.stringify(
      {
        reports: this.reports,
        components: Array.from(this.components.entries()),
        exportDate: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Импорт данных из JSON
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.reports = data.reports || [];
      this.components = new Map(data.components || []);
      return true;
    } catch (error) {
      console.error('Ошибка импорта данных:', error);
      return false;
    }
  }
}

// Глобальный экземпляр парсера
window.EAPParser = new EAPReportParser();
