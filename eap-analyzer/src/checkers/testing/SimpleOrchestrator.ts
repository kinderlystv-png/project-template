/**
 * Простой оркестратор анализа без AI модулей для тестирования
 */

import { BaseChecker } from '../../core/checker.js';
import { CheckContext, CheckResult } from '../../core/types.js';

export class SimpleOrchestrator {
  private checkers: Map<string, BaseChecker> = new Map();

  constructor() {
    console.log('🚀 Создан SimpleOrchestrator без AI модулей');
  }

  registerChecker(name: string, checker: BaseChecker): void {
    this.checkers.set(name, checker);
    console.log(`✅ Зарегистрирован чекер: ${name}`);
  }

  async analyzeProject(projectPath: string): Promise<{ checks: Record<string, CheckResult> }> {
    console.log('🔍 Запуск анализа проекта...');
    console.log(`📊 Зарегистрировано чекеров: ${this.checkers.size}`);

    const context: CheckContext = {
      projectPath,
      config: {},
    };

    const checks: Record<string, CheckResult> = {};

    try {
      // Последовательное выполнение чекеров (без параллелизма для простоты)
      for (const [name, checker] of this.checkers) {
        console.log(`🔧 Выполнение чекера: ${name}...`);

        try {
          const startTime = Date.now();
          const result = await checker.check(context);
          const endTime = Date.now();

          checks[name] = result;
          console.log(
            `✓ Чекер ${name} завершен за ${endTime - startTime}ms (оценка: ${result.score})`
          );
        } catch (error) {
          console.error(`❌ Ошибка в чекере ${name}:`, error);
          // Создаем результат с ошибкой
          checks[name] = {
            checker: name,
            category: 'quality',
            passed: false,
            score: 0,
            message: `Ошибка выполнения: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date(),
            details: { error: error instanceof Error ? error.message : String(error) },
          };
        }
      }

      console.log(`🎉 Анализ завершен. Обработано чекеров: ${Object.keys(checks).length}`);

      return { checks };
    } catch (error) {
      console.error('❌ Критическая ошибка анализа:', error);
      throw error;
    }
  }

  getCheckerCount(): number {
    return this.checkers.size;
  }

  getCheckerNames(): string[] {
    return Array.from(this.checkers.keys());
  }

  getRegisteredCheckers(): string[] {
    return this.getCheckerNames();
  }
}
