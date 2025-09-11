'use strict';
/**
 * Простой оркестратор анализа без AI модулей для тестирования
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.SimpleOrchestrator = void 0;
class SimpleOrchestrator {
  checkers = new Map();
  constructor() {
    console.log('🚀 Создан SimpleOrchestrator без AI модулей');
  }
  registerChecker(name, checker) {
    this.checkers.set(name, checker);
    console.log(`✅ Зарегистрирован чекер: ${name}`);
  }
  async analyzeProject(projectPath) {
    console.log('🔍 Запуск анализа проекта...');
    console.log(`📊 Зарегистрировано чекеров: ${this.checkers.size}`);
    const context = {
      projectPath,
      config: {},
    };
    const checks = {};
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
  getCheckerCount() {
    return this.checkers.size;
  }
  getCheckerNames() {
    return Array.from(this.checkers.keys());
  }
  getRegisteredCheckers() {
    return this.getCheckerNames();
  }
}
exports.SimpleOrchestrator = SimpleOrchestrator;
//# sourceMappingURL=SimpleOrchestrator.js.map
