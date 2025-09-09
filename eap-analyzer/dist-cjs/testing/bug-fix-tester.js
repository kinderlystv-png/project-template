"use strict";
/**
 * Модуль для тестирования исправлений критических багов EAP
 * Проверяет правильность расчета дупликации и сложности
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BugFixTester = void 0;
const fs = __importStar(require("fs"));
const analyzer_js_1 = require("../analyzer.js");
const duplication_detector_js_1 = require("../modules/structure-analyzer/duplication-detector.js");
const file_classifier_js_1 = require("../modules/structure-analyzer/file-classifier.js");
const complexity_calculator_js_1 = require("../modules/structure-analyzer/complexity-calculator.js");
class BugFixTester {
    duplicationDetector;
    fileClassifier;
    complexityCalculator;
    constructor() {
        this.duplicationDetector = new duplication_detector_js_1.ImprovedDuplicationDetector();
        this.fileClassifier = new file_classifier_js_1.SmartFileClassifier();
        this.complexityCalculator = new complexity_calculator_js_1.ImprovedComplexityCalculator();
    }
    /**
     * Запускает все тесты исправлений
     */
    async runAllTests() {
        console.log('🧪 Запуск тестов исправлений критических багов...\n');
        const duplicationTests = await this.testDuplicationFixes();
        const complexityTests = await this.testComplexityFixes();
        const classificationTests = await this.testClassificationFixes();
        const totalPassed = duplicationTests.passed + complexityTests.passed + classificationTests.passed;
        const totalFailed = duplicationTests.failed + complexityTests.failed + classificationTests.failed;
        const results = {
            duplicationTests,
            complexityTests,
            classificationTests,
            summary: {
                totalPassed,
                totalFailed,
                success: totalFailed === 0,
            },
        };
        this.printResults(results);
        return results;
    }
    /**
     * Тестирует исправления детектора дупликации
     */
    async testDuplicationFixes() {
        console.log('🔄 Тестирование исправлений детектора дупликации...');
        const tests = [];
        let passed = 0;
        let failed = 0;
        // Тест 1: Проверка корректного расчета процента дупликации
        try {
            const testFiles = [
                { path: 'file1.js', content: 'function hello() { console.log("Hello"); }', lines: 1 },
                { path: 'file2.js', content: 'function hello() { console.log("Hello"); }', lines: 1 },
            ];
            const result = await this.duplicationDetector.calculateDuplication(testFiles);
            const percentage = result.percentage;
            const test = {
                test: 'Процент дупликации не должен превышать 100%',
                expected: '<= 100%',
                actual: `${percentage}%`,
                passed: percentage <= 100,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Процент дупликации не должен превышать 100%',
                expected: '<= 100%',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 2: Исключение сгенерированных файлов
        try {
            const testFiles = [
                {
                    path: 'dist/bundle.min.js',
                    content: '!function(e){var t={};function n(r){if(t[r])return t[r].exports;',
                    lines: 1,
                },
                {
                    path: 'src/main.js',
                    content: 'import { app } from "./app.js"; app.mount("#app");',
                    lines: 1,
                },
            ];
            const result = await this.duplicationDetector.calculateDuplication(testFiles);
            const test = {
                test: 'Сгенерированные файлы должны исключаться из анализа',
                expected: 'только src файлы',
                actual: `проанализировано ${result.analysisMetadata.analyzedFiles} файлов`,
                passed: result.analysisMetadata.analyzedFiles === 1,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Сгенерированные файлы должны исключаться из анализа',
                expected: 'только src файлы',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 3: Корректная нормализация кода
        try {
            const testFiles = [
                {
                    path: 'file1.js',
                    content: `function hello() {
    console.log("Hello");
}`,
                    lines: 3,
                },
                {
                    path: 'file2.js',
                    content: `function hello(){console.log("Hello");}`,
                    lines: 1,
                },
            ];
            const result = await this.duplicationDetector.calculateDuplication(testFiles);
            const test = {
                test: 'Нормализация должна находить дубликаты с разным форматированием',
                expected: '> 0% дупликации',
                actual: `${result.percentage}% дупликации`,
                passed: result.percentage > 0,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Нормализация должна находить дубликаты с разным форматированием',
                expected: '> 0% дупликации',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        return { passed, failed, details: tests };
    }
    /**
     * Тестирует исправления калькулятора сложности
     */
    async testComplexityFixes() {
        console.log('📊 Тестирование исправлений калькулятора сложности...');
        const tests = [];
        let passed = 0;
        let failed = 0;
        // Тест 1: Простая функция должна иметь разумную сложность
        try {
            const simpleCode = `
function add(a, b) {
  return a + b;
}`;
            const result = await this.complexityCalculator.calculateComplexity('test.js', simpleCode, file_classifier_js_1.FileCategory.SOURCE);
            const test = {
                test: 'Простая функция должна иметь низкую сложность',
                expected: '< 5',
                actual: result.metrics.cyclomatic,
                passed: result.metrics.cyclomatic < 5,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Простая функция должна иметь низкую сложность',
                expected: '< 5',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 2: Минифицированный код должен пропускаться
        try {
            const minifiedCode = '!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).MyLibrary=t()}(this,function(){"use strict";var e=function(){return"Hello World"};return e});';
            const result = await this.complexityCalculator.calculateComplexity('bundle.min.js', minifiedCode, file_classifier_js_1.FileCategory.GENERATED);
            const test = {
                test: 'Минифицированный код должен пропускаться',
                expected: 'shouldAnalyze: false',
                actual: `shouldAnalyze: ${result.shouldAnalyze}`,
                passed: !result.shouldAnalyze,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Минифицированный код должен пропускаться',
                expected: 'shouldAnalyze: false',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 3: Функция с условиями должна иметь соответствующую сложность
        try {
            const complexCode = `
function processData(data) {
  if (!data) {
    return null;
  }

  if (data.length > 100) {
    return data.slice(0, 100);
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i].value > 0) {
      data[i].processed = true;
    }
  }

  return data;
}`;
            const result = await this.complexityCalculator.calculateComplexity('processor.js', complexCode, file_classifier_js_1.FileCategory.SOURCE);
            const test = {
                test: 'Функция с условиями должна иметь соответствующую сложность',
                expected: '5-15',
                actual: result.metrics.cyclomatic,
                passed: result.metrics.cyclomatic >= 5 && result.metrics.cyclomatic <= 15,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Функция с условиями должна иметь соответствующую сложность',
                expected: '5-15',
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        return { passed, failed, details: tests };
    }
    /**
     * Тестирует исправления классификатора файлов
     */
    async testClassificationFixes() {
        console.log('📁 Тестирование исправлений классификатора файлов...');
        const tests = [];
        let passed = 0;
        let failed = 0;
        // Тест 1: Классификация исходных файлов
        try {
            const result = await this.fileClassifier.classifyFiles(['src/components/Button.tsx']);
            const classification = result.get('src/components/Button.tsx');
            const test = {
                test: 'Исходные файлы должны классифицироваться как SOURCE',
                expected: file_classifier_js_1.FileCategory.SOURCE,
                actual: classification?.category,
                passed: classification?.category === file_classifier_js_1.FileCategory.SOURCE,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Исходные файлы должны классифицироваться как SOURCE',
                expected: file_classifier_js_1.FileCategory.SOURCE,
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 2: Классификация сгенерированных файлов
        try {
            const result = await this.fileClassifier.classifyFiles(['dist/bundle.js']);
            const classification = result.get('dist/bundle.js');
            const test = {
                test: 'Сгенерированные файлы должны классифицироваться как GENERATED',
                expected: file_classifier_js_1.FileCategory.GENERATED,
                actual: classification?.category,
                passed: classification?.category === file_classifier_js_1.FileCategory.GENERATED,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Сгенерированные файлы должны классифицироваться как GENERATED',
                expected: file_classifier_js_1.FileCategory.GENERATED,
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        // Тест 3: Классификация vendor файлов
        try {
            const result = await this.fileClassifier.classifyFiles(['node_modules/react/index.js']);
            const classification = result.get('node_modules/react/index.js');
            const test = {
                test: 'Vendor файлы должны классифицироваться как VENDOR',
                expected: file_classifier_js_1.FileCategory.VENDOR,
                actual: classification?.category,
                passed: classification?.category === file_classifier_js_1.FileCategory.VENDOR,
            };
            if (test.passed)
                passed++;
            else
                failed++;
            tests.push(test);
        }
        catch (error) {
            tests.push({
                test: 'Vendor файлы должны классифицироваться как VENDOR',
                expected: file_classifier_js_1.FileCategory.VENDOR,
                actual: `Error: ${error}`,
                passed: false,
            });
            failed++;
        }
        return { passed, failed, details: tests };
    }
    /**
     * Выводит результаты тестов
     */
    printResults(results) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ИСПРАВЛЕНИЙ');
        console.log('='.repeat(60));
        // Результаты по категориям
        console.log('\n🔄 Тесты дупликации:');
        console.log(`   ✅ Прошло: ${results.duplicationTests.passed}`);
        console.log(`   ❌ Провалено: ${results.duplicationTests.failed}`);
        console.log('\n📊 Тесты сложности:');
        console.log(`   ✅ Прошло: ${results.complexityTests.passed}`);
        console.log(`   ❌ Провалено: ${results.complexityTests.failed}`);
        console.log('\n📁 Тесты классификации:');
        console.log(`   ✅ Прошло: ${results.classificationTests.passed}`);
        console.log(`   ❌ Провалено: ${results.classificationTests.failed}`);
        // Общий итог
        console.log('\n' + '='.repeat(60));
        console.log('🎯 ОБЩИЙ ИТОГ:');
        console.log(`   ✅ Всего прошло: ${results.summary.totalPassed}`);
        console.log(`   ❌ Всего провалено: ${results.summary.totalFailed}`);
        console.log(`   ${results.summary.success ? '🎉 ВСЕ ТЕСТЫ ПРОШЛИ!' : '⚠️  ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ'}`);
        // Детали проваленных тестов
        if (results.summary.totalFailed > 0) {
            console.log('\n❌ ДЕТАЛИ ПРОВАЛЕННЫХ ТЕСТОВ:');
            [
                ...results.duplicationTests.details,
                ...results.complexityTests.details,
                ...results.classificationTests.details,
            ]
                .filter(test => !test.passed)
                .forEach(test => {
                console.log(`\n   ${test.test}`);
                console.log(`   Ожидалось: ${test.expected}`);
                console.log(`   Получено: ${test.actual}`);
            });
        }
        console.log('\n' + '='.repeat(60));
    }
    /**
     * Тестирует реальный проект с проблемными метриками
     */
    async testRealProject(projectPath) {
        console.log(`\n🔬 Тестирование реального проекта: ${projectPath}`);
        if (!fs.existsSync(projectPath)) {
            console.log('❌ Проект не найден!');
            return;
        }
        try {
            const analyzer = new analyzer_js_1.GoldenStandardAnalyzer();
            const result = await analyzer.analyzeProject(projectPath);
            console.log('\n📊 Результаты анализа реального проекта:');
            console.log(`   Общий балл: ${result.summary.percentage.toFixed(1)}%`);
            console.log(`   Критические проблемы: ${result.summary.criticalIssues}`);
            console.log(`   Время анализа: ${result.duration}мс`);
            // Проверяем, что больше нет impossible метрик
            const hasImpossibleMetrics = result.components.some(component => component.score > 100);
            if (hasImpossibleMetrics) {
                console.log('❌ Обнаружены невозможные метрики!');
            }
            else {
                console.log('✅ Невозможные метрики исправлены!');
            }
        }
        catch (error) {
            console.log(`❌ Ошибка при анализе: ${error}`);
        }
    }
}
exports.BugFixTester = BugFixTester;
//# sourceMappingURL=bug-fix-tester.js.map