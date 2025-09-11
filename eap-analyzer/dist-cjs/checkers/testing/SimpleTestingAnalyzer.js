'use strict';
/**
 * Временный простой анализатор тестирования для исправления сборки
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.UnifiedTestingAnalyzer = void 0;
const BaseChecker_1 = require('../../core/base/BaseChecker');
const AnalysisCategory_1 = require('../../types/AnalysisCategory');
const SeverityLevel_1 = require('../../types/SeverityLevel');
const CheckResultUtils_1 = require('./utils/CheckResultUtils');
class UnifiedTestingAnalyzer extends BaseChecker_1.BaseChecker {
  name = 'UnifiedTestingAnalyzer';
  version = '3.0.0';
  category = AnalysisCategory_1.AnalysisCategory.TESTING;
  description = 'Комплексный анализ тестовой экосистемы проекта';
  standard = 'EAP-3.0';
  severity = SeverityLevel_1.SeverityLevel.MEDIUM;
  /**
   * Выполняет анализ тестовой экосистемы проекта
   */
  async check(project) {
    try {
      console.log('🔍 Начинаю анализ тестовой экосистемы...');
      // Проверяем наличие тестовых файлов
      const files = await project.getFileList();
      const testFiles = files.filter(
        file => /\.(test|spec)\.(js|ts|jsx|tsx)$/i.test(file) || file.includes('__tests__')
      );
      const hasTestFramework = await this.checkTestFramework(project);
      const hasTestFiles = testFiles.length > 0;
      const results = [];
      // Проверка наличия тестового фреймворка
      results.push(
        (0, CheckResultUtils_1.createCheckResult)({
          id: 'testing-framework',
          name: 'Тестовый фреймворк',
          description: 'Проверка наличия настроенного тестового фреймворка',
          passed: hasTestFramework,
          message: hasTestFramework
            ? 'Тестовый фреймворк настроен'
            : 'Тестовый фреймворк не найден',
          details: { frameworkFound: hasTestFramework },
          recommendations: hasTestFramework
            ? []
            : [
                'Установите и настройте тестовый фреймворк (Jest, Vitest, или другой)',
                'Добавьте скрипты для запуска тестов в package.json',
              ],
        })
      );
      // Проверка наличия тестовых файлов
      results.push(
        (0, CheckResultUtils_1.createCheckResult)({
          id: 'test-files',
          name: 'Тестовые файлы',
          description: 'Проверка наличия тестовых файлов в проекте',
          passed: hasTestFiles,
          message: hasTestFiles
            ? `Найдено ${testFiles.length} тестовых файлов`
            : 'Тестовые файлы не найдены',
          details: {
            testFiles: testFiles,
            testFilesCount: testFiles.length,
          },
          recommendations: hasTestFiles
            ? []
            : [
                'Создайте тестовые файлы с расширениями .test.js, .spec.js или в папке __tests__',
                'Покройте основную функциональность unit-тестами',
              ],
        })
      );
      console.log(`✅ Анализ тестирования завершен. Найдено ${results.length} проверок`);
      return results;
    } catch (error) {
      console.error('❌ Ошибка при анализе тестирования:', error);
      return [
        (0, CheckResultUtils_1.createCheckResult)({
          id: 'testing-analysis-error',
          name: 'Ошибка анализа тестирования',
          description: 'Произошла ошибка при анализе тестовой экосистемы',
          passed: false,
          message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        }),
      ];
    }
  }
  /**
   * Проверяет наличие тестового фреймворка в проекте
   */
  async checkTestFramework(project) {
    try {
      // Проверяем package.json на наличие тестовых зависимостей
      const packageJsonPath = project.resolvePath('package.json');
      if (await project.exists(packageJsonPath)) {
        const packageContent = await project.readFile(packageJsonPath);
        const packageJson = JSON.parse(packageContent);
        const testFrameworks = [
          'jest',
          'vitest',
          'mocha',
          'jasmine',
          'cypress',
          'playwright',
          '@testing-library',
          'karma',
        ];
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        return testFrameworks.some(framework =>
          Object.keys(dependencies).some(dep => dep.includes(framework))
        );
      }
      return false;
    } catch (error) {
      console.error('Ошибка проверки тестового фреймворка:', error);
      return false;
    }
  }
}
exports.UnifiedTestingAnalyzer = UnifiedTestingAnalyzer;
//# sourceMappingURL=SimpleTestingAnalyzer.js.map
