/**
 * FileStructureChecker - Обертка для интеграции FileStructureAnalyzer с оркестратором
 */
/* eslint-disable no-console */

import { BaseChecker } from '../core/checker.js';
import type { CheckContext, CheckResult } from '../core/types.js';
import { FileStructureAnalyzer } from '../analyzers/structure/FileStructureAnalyzer.js';

/**
 * Чекер для анализа структуры файлов проекта
 * Интегрирует FileStructureAnalyzer v3.0 в систему оркестратора
 */
export class FileStructureChecker extends BaseChecker {
  readonly name = 'FileStructureChecker';
  readonly category = 'structure' as const;
  readonly description =
    'Анализирует структуру файлов проекта с помощью FileStructureAnalyzer v3.0';

  async check(context: CheckContext): Promise<CheckResult> {
    try {
      console.log('🔍 FileStructureChecker: Запуск анализа структуры файлов...');

      // Вызываем FileStructureAnalyzer
      const result = await FileStructureAnalyzer.checkComponent(context);

      // Адаптируем результат под CheckResult
      const passed = result.percentage >= 70; // Порог прохождения
      const score = Math.round(result.percentage);

      const recommendations = result.recommendations || [];
      const details = {
        analyzer: 'FileStructureAnalyzer v3.0',
        filesAnalyzed: result.metadata?.filesAnalyzed || 0,
        metrics: result.metadata?.metrics || {},
        duration: result.duration,
        rawResult: result,
      };

      console.log(
        `🎯 FileStructureChecker: Завершен. Оценка: ${score}%, Файлов: ${details.filesAnalyzed}`
      );

      return this.createResult(
        passed,
        score,
        `Анализ структуры файлов завершен. Оценка: ${score}%. Проанализировано файлов: ${details.filesAnalyzed}`,
        details,
        recommendations
      );
    } catch (error) {
      console.error('❌ FileStructureChecker: Ошибка анализа:', error);

      return this.createResult(
        false,
        0,
        `Ошибка при анализе структуры файлов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте правильность пути к проекту', 'Убедитесь в доступности файлов для анализа']
      );
    }
  }

  /**
   * Проверяет применимость чекера
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isApplicable(_context: CheckContext): boolean {
    // Применим для всех проектов с файловой структурой
    return true;
  }

  /**
   * Высокий приоритет для структурного анализа
   */
  get priority(): number {
    return 2; // Высокий приоритет
  }

  /**
   * Статический метод для получения имени
   */
  getName(): string {
    return this.name;
  }
}
