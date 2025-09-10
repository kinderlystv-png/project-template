/**
 * Base Evaluator Interface
 * Базовый интерфейс для всех оценщиков
 */

import { Project } from '../types/Project';

export interface IEvaluator<TResult = any> {
  /**
   * Выполнить оценку проекта
   * @param project Проект для оценки
   * @param analysisData Данные анализа (опционально)
   * @returns Результат оценки
   */
  evaluate(project: Project, analysisData?: any): Promise<TResult>;

  /**
   * Получить название оценщика
   */
  getName(): string;

  /**
   * Получить описание оценщика
   */
  getDescription(): string;

  /**
   * Проверить, применим ли оценщик к данному проекту
   * @param project Проект для проверки
   */
  isApplicable(project: Project): Promise<boolean>;
}

/**
 * Базовый абстрактный класс для оценщиков
 */
export abstract class BaseEvaluator<TResult = any> implements IEvaluator<TResult> {
  protected readonly name: string;
  protected readonly description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract evaluate(project: Project, analysisData?: any): Promise<TResult>;

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  async isApplicable(project: Project): Promise<boolean> {
    // По умолчанию оценщик применим ко всем проектам
    return true;
  }

  /**
   * Безопасное чтение файла с обработкой ошибок
   */
  protected async safeReadFile(project: Project, filePath: string): Promise<string | null> {
    try {
      if (await project.exists(filePath)) {
        return await project.readFile(filePath);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Безопасный парсинг JSON с обработкой ошибок
   */
  protected safeParseJSON<T = any>(content: string): T | null {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Нормализует значение в диапазон 0-100
   */
  protected normalizeScore(value: number, min: number, max: number): number {
    if (max === min) return 100;
    const normalized = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Вычисляет взвешенную оценку
   */
  protected calculateWeightedScore(
    scores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, score] of Object.entries(scores)) {
      const weight = weights[category] || 1;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Категоризирует значение по уровням
   */
  protected categorizeLevel(
    value: number,
    thresholds: { excellent: number; good: number; fair: number }
  ): string {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.fair) return 'fair';
    return 'poor';
  }

  /**
   * Генерирует рекомендации на основе оценки
   */
  protected generateRecommendations(
    scores: Record<string, number>,
    thresholds: Record<string, number>
  ): Array<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    currentScore: number;
    targetScore: number;
    actions: string[];
    estimatedEffort: number;
    expectedImpact: number;
  }> {
    const recommendations = [];

    for (const [category, score] of Object.entries(scores)) {
      const threshold = thresholds[category] || 70;
      if (score < threshold) {
        const gap = threshold - score;
        const priority: 'low' | 'medium' | 'high' = gap > 40 ? 'high' : gap > 20 ? 'medium' : 'low';

        recommendations.push({
          category,
          priority,
          currentScore: score,
          targetScore: threshold,
          actions: this.getActionsForCategory(category, gap),
          estimatedEffort: this.estimateEffort(gap),
          expectedImpact: gap,
        });
      }
    }

    return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
  }

  /**
   * Получает действия для улучшения категории
   */
  private getActionsForCategory(category: string, gap: number): string[] {
    const actionMap: Record<string, string[]> = {
      codeQuality: [
        'Рефакторинг сложных функций',
        'Устранение дублирования кода',
        'Добавление типизации',
        'Улучшение именования переменных',
      ],
      testCoverage: [
        'Написание unit-тестов',
        'Добавление интеграционных тестов',
        'Настройка автоматического тестирования',
        'Покрытие критических путей',
      ],
      documentation: [
        'Написание README',
        'Документирование API',
        'Добавление комментариев к сложным функциям',
        'Создание примеров использования',
      ],
      performance: [
        'Оптимизация алгоритмов',
        'Кэширование данных',
        'Уменьшение размера бандла',
        'Ленивая загрузка компонентов',
      ],
      security: [
        'Обновление зависимостей',
        'Аудит безопасности',
        'Использование HTTPS',
        'Валидация входных данных',
      ],
    };

    return actionMap[category] || ['Общие улучшения'];
  }

  /**
   * Оценивает усилия для устранения проблем
   */
  private estimateEffort(gap: number): number {
    // Базовая формула: gap * 0.5 часа
    return Math.ceil(gap * 0.5);
  }
}
