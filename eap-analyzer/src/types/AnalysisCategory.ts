/**
 * Категории анализа в EAP системе
 */
export enum AnalysisCategory {
  CODE = 'code',
  INFRASTRUCTURE = 'infrastructure',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  TESTING = 'testing',
  DEPENDENCIES = 'dependencies',
  DOCUMENTATION = 'documentation',
}

/**
 * Человекочитаемые названия категорий
 */
export const ANALYSIS_CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  [AnalysisCategory.CODE]: 'Анализ кода',
  [AnalysisCategory.INFRASTRUCTURE]: 'Инфраструктура',
  [AnalysisCategory.PERFORMANCE]: 'Производительность',
  [AnalysisCategory.SECURITY]: 'Безопасность',
  [AnalysisCategory.TESTING]: 'Тестирование',
  [AnalysisCategory.DEPENDENCIES]: 'Зависимости',
  [AnalysisCategory.DOCUMENTATION]: 'Документация',
};
