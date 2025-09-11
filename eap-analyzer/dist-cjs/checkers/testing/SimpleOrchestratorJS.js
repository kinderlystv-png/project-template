'use strict';
/**
 * SimpleOrchestrator - JavaScript версия для UnifiedTestingAnalyzer
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.SimpleOrchestrator = void 0;
class SimpleOrchestrator {
  constructor() {
    this.checkers = [];
  }
  /**
   * Регистрирует анализатор
   */
  register(checker) {
    this.checkers.push(checker);
    console.log(`📝 Зарегистрирован анализатор: ${checker.name}`);
  }
  /**
   * Запускает анализ всех зарегистрированных анализаторов
   */
  async analyze(context) {
    console.log(`🔍 Запуск анализа ${this.checkers.length} анализаторов...`);
    const results = [];
    for (const checker of this.checkers) {
      const startTime = Date.now();
      try {
        console.log(`   ⚡ Анализирую ${checker.name}...`);
        const result = await checker.check(context);
        const executionTime = Date.now() - startTime;
        results.push({
          checker: checker.name,
          score: result.score,
          success: result.success,
          message: result.message,
          details: result.details,
          recommendations: result.recommendations,
          executionTime,
        });
        console.log(`   ✅ ${checker.name}: ${result.score}/100 (${executionTime}ms)`);
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`   ❌ ${checker.name}: ошибка (${executionTime}ms)`, error.message);
        results.push({
          checker: checker.name,
          score: 0,
          success: false,
          message: `Ошибка: ${error.message}`,
          details: { error: true },
          recommendations: [`Исправить ошибку: ${error.message}`],
          executionTime,
        });
      }
    }
    console.log(`✅ Анализ завершен: ${results.length} результатов`);
    return results;
  }
}
exports.SimpleOrchestrator = SimpleOrchestrator;
//# sourceMappingURL=SimpleOrchestratorJS.js.map
