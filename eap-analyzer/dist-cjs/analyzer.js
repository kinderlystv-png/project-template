"use strict";
/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Главный класс для анализа проектов по золотому стандарту
 * Включает улучшенную обработку ошибок, поддержку кодировок и адаптивные пороги
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTChecker = exports.DockerChecker = exports.GoldenStandardAnalyzer = void 0;
const path = __importStar(require("path"));
const ci_cd_js_1 = require("./checkers/ci-cd.js");
const code_quality_js_1 = require("./checkers/code-quality.js");
const dependencies_js_1 = require("./checkers/dependencies.js");
const docker_js_1 = require("./checkers/docker.js");
Object.defineProperty(exports, "DockerChecker", { enumerable: true, get: function () { return docker_js_1.DockerChecker; } });
const emt_js_1 = require("./checkers/emt.js");
Object.defineProperty(exports, "EMTChecker", { enumerable: true, get: function () { return emt_js_1.EMTChecker; } });
const logging_js_1 = require("./checkers/logging.js");
const sveltekit_js_1 = require("./checkers/sveltekit.js");
const vitest_js_1 = require("./checkers/vitest.js");
const error_handler_js_1 = require("./utils/error-handler.js");
const file_utils_js_1 = require("./utils/file-utils.js");
const adaptive_thresholds_js_1 = require("./utils/adaptive-thresholds.js");
// Импорт новых улучшенных модулей
const duplication_detector_js_1 = require("./modules/structure-analyzer/duplication-detector.js");
const file_classifier_js_1 = require("./modules/structure-analyzer/file-classifier.js");
const complexity_calculator_js_1 = require("./modules/structure-analyzer/complexity-calculator.js");
// Импорт модулей валидации
const bug_fix_validator_js_1 = require("./validation/bug-fix-validator.js");
const metrics_validator_js_1 = require("./validation/metrics-validator.js");
const validation_reporter_js_1 = require("./validation/validation-reporter.js");
class GoldenStandardAnalyzer {
    verbose = true;
    projectThresholds = null;
    // Новые улучшенные модули
    duplicationDetector;
    fileClassifier;
    complexityCalculator;
    // Модули валидации
    bugFixValidator;
    metricsValidator;
    validationReporter;
    constructor() {
        // Настраиваем глобальные обработчики ошибок
        (0, error_handler_js_1.setupGlobalErrorHandlers)();
        // Инициализируем новые модули
        this.duplicationDetector = new duplication_detector_js_1.ImprovedDuplicationDetector();
        this.fileClassifier = new file_classifier_js_1.SmartFileClassifier();
        this.complexityCalculator = new complexity_calculator_js_1.ImprovedComplexityCalculator();
        // Инициализируем модули валидации
        this.bugFixValidator = new bug_fix_validator_js_1.BugFixValidator();
        this.metricsValidator = new metrics_validator_js_1.MetricsValidator();
        this.validationReporter = new validation_reporter_js_1.ValidationReporter();
    }
    log(message) {
        if (this.verbose) {
            // eslint-disable-next-line no-console
            console.log(message);
        }
    }
    /**
     * Инициализирует адаптивные пороги для проекта
     */
    async initializeThresholds(projectPath) {
        const operation = async () => {
            // Пытаемся загрузить сохраненные пороги
            this.projectThresholds = (0, adaptive_thresholds_js_1.loadSavedThresholds)(projectPath);
            if (!this.projectThresholds) {
                // Загружаем предыдущий отчет для адаптации
                const previousReport = (0, adaptive_thresholds_js_1.loadPreviousReport)(projectPath);
                // Подсчитываем количество файлов для определения размера проекта
                const fileCount = await this.countProjectFiles(projectPath);
                // Получаем оптимальные пороги
                this.projectThresholds = (0, adaptive_thresholds_js_1.getProjectThresholds)(projectPath, previousReport, fileCount);
                // Сохраняем пороги для будущего использования
                (0, adaptive_thresholds_js_1.saveThresholds)(this.projectThresholds, projectPath);
            }
        };
        await (0, error_handler_js_1.safeExecute)(operation, error_handler_js_1.ErrorType.CONFIG_ERROR, {
            operation: 'threshold-initialization',
            path: projectPath,
        });
    }
    /**
     * Выполняет структурный анализ проекта с использованием улучшенных модулей
     */
    async performStructuralAnalysis(projectPath) {
        this.log('🔬 Выполняем структурный анализ с улучшенными модулями...');
        // Получаем список файлов для анализа
        const files = await this.getProjectFiles(projectPath);
        this.log(`📂 Найдено ${files.length} файлов для анализа`);
        // Классификация файлов
        this.log('📁 Классифицируем файлы...');
        const classification = await this.fileClassifier.classifyFiles(files.map(f => f.path));
        // Фильтруем только исходные файлы для анализа дупликации
        const sourceFiles = files.filter(file => {
            const fileClassification = classification.get(file.path);
            return (fileClassification?.category === file_classifier_js_1.FileCategory.SOURCE ||
                fileClassification?.category === file_classifier_js_1.FileCategory.TEST);
        });
        this.log(`📋 Отфильтровано ${sourceFiles.length} исходных файлов`);
        // Подготовка данных для анализа дупликации
        const filesWithContent = await Promise.all(sourceFiles.slice(0, 20).map(async (file) => {
            // Ограничиваем для демо
            try {
                const content = await (0, file_utils_js_1.readFileWithEncoding)(file.path);
                const lines = content.split('\n').length;
                return { path: file.path, content, lines };
            }
            catch (error) {
                this.log(`⚠️ Ошибка чтения файла ${file.path}: ${error}`);
                return null;
            }
        }));
        const validFiles = filesWithContent.filter(f => f !== null);
        // Анализ дупликации
        this.log('🔄 Анализируем дупликацию...');
        const duplication = await this.duplicationDetector.calculateDuplication(validFiles);
        // Анализ сложности для каждого исходного файла
        this.log('📊 Анализируем сложность...');
        const complexityResults = [];
        for (const file of validFiles.slice(0, 10)) {
            // Ограничиваем для демо
            try {
                const fileClassification = classification.get(file.path);
                const category = fileClassification?.category || file_classifier_js_1.FileCategory.SOURCE;
                const framework = fileClassification?.framework;
                const complexity = await this.complexityCalculator.calculateComplexity(file.path, file.content, category, framework);
                complexityResults.push({
                    file: file.path,
                    ...complexity,
                });
            }
            catch (error) {
                this.log(`⚠️ Ошибка анализа сложности для ${file.path}: ${error}`);
            }
        }
        return {
            duplication: {
                ...duplication,
                analyzedFiles: validFiles.length,
            },
            complexity: {
                files: complexityResults,
                summary: this.summarizeComplexity(complexityResults),
            },
            fileClassification: {
                total: files.length,
                classified: classification.size,
                categories: this.summarizeClassification(classification),
            },
        };
    }
    /**
     * Получает список файлов проекта
     */
    async getProjectFiles(projectPath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const glob = await Promise.resolve().then(() => __importStar(require('glob')));
        const pattern = path.join(projectPath, '**/*.{js,ts,jsx,tsx,vue,svelte,css,scss,json}');
        const filePaths = await glob.glob(pattern, {
            ignore: ['**/node_modules/**', '**/.git/**'],
        });
        return filePaths.map(filePath => ({
            path: filePath,
            name: path.basename(filePath),
        }));
    }
    /**
     * Создает сводку по классификации файлов
     */
    summarizeClassification(classification) {
        const categories = new Map();
        const frameworks = new Map();
        for (const [, result] of classification) {
            const category = result.category || 'unknown';
            categories.set(category, (categories.get(category) || 0) + 1);
            if (result.framework) {
                frameworks.set(result.framework, (frameworks.get(result.framework) || 0) + 1);
            }
        }
        return {
            byCategory: Object.fromEntries(categories),
            byFramework: Object.fromEntries(frameworks),
        };
    }
    /**
     * Выполняет полную валидацию результатов структурного анализа
     */
    async validateAnalysisResults(analysisResults, projectPath, options = {}) {
        this.log('🔍 Запуск валидации результатов анализа...');
        // Валидация исправлений багов
        const bugFixReport = await this.bugFixValidator.validateAnalysisResults(analysisResults, projectPath);
        // Валидация метрик
        const metricsReport = await this.metricsValidator.validateMetrics(analysisResults, projectPath);
        // Создание объединенного отчета
        const combinedReport = await this.validationReporter.generateCombinedReport(bugFixReport, metricsReport);
        // Вывод в консоль
        await this.validationReporter.printConsoleReport(combinedReport, {
            includeDetails: true,
            includeRecommendations: true,
            includeTimestamp: false,
        });
        let reportPath;
        // Генерация файлового отчета
        if (options.generateReport) {
            try {
                reportPath = await this.validationReporter.saveReport(combinedReport, {
                    format: options.reportFormat || 'markdown',
                    outputPath: options.outputPath || './reports',
                    includeDetails: true,
                    includeRecommendations: true,
                    includeTimestamp: true,
                });
            }
            catch (error) {
                this.log(`⚠️ Ошибка при сохранении отчета: ${error}`);
            }
        }
        return {
            isValid: combinedReport.overall.isValid,
            confidence: combinedReport.overall.confidence,
            criticalIssues: combinedReport.overall.criticalIssuesCount,
            reportPath,
        };
    }
    /**
     * Создает сводку по сложности
     */
    summarizeComplexity(results) {
        const validResults = results.filter(r => r.shouldAnalyze && r.metrics.cyclomatic > 0);
        if (validResults.length === 0) {
            return { avgCyclomatic: 0, avgCognitive: 0, totalFiles: 0 };
        }
        const totalCyclomatic = validResults.reduce((sum, r) => sum + r.metrics.cyclomatic, 0);
        const totalCognitive = validResults.reduce((sum, r) => sum + r.metrics.cognitive, 0);
        return {
            avgCyclomatic: Math.round((totalCyclomatic / validResults.length) * 10) / 10,
            avgCognitive: Math.round((totalCognitive / validResults.length) * 10) / 10,
            totalFiles: validResults.length,
            maxCyclomatic: Math.max(...validResults.map(r => r.metrics.cyclomatic)),
            maxCognitive: Math.max(...validResults.map(r => r.metrics.cognitive)),
        };
    } /**
     * Подсчитывает количество файлов в проекте
     */
    async countProjectFiles(projectPath) {
        const operation = async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const glob = await Promise.resolve().then(() => __importStar(require('glob')));
            const pattern = path.join(projectPath, '**/*.{js,ts,jsx,tsx,vue,svelte}');
            const files = await glob.glob(pattern, {
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            });
            return files.length;
        };
        const result = await (0, error_handler_js_1.safeExecute)(operation, error_handler_js_1.ErrorType.FILE_ERROR, {
            operation: 'file-counting',
            path: projectPath,
        });
        return result || 0;
    }
    /**
     * Выполняет полный анализ проекта
     */
    async analyzeProject(projectPath) {
        const startTime = Date.now();
        this.log('🔍 Начинаем анализ проекта по Золотому Стандарту...');
        this.log(`📂 Путь: ${projectPath}`);
        this.log('');
        // Инициализируем адаптивные пороги
        await this.initializeThresholds(projectPath);
        const context = {
            projectPath: path.resolve(projectPath),
            projectInfo: {
                name: path.basename(projectPath),
                version: '1.0.0',
                hasTypeScript: false,
                hasTests: false,
                hasDocker: false,
                hasCICD: false,
                dependencies: {
                    production: 0,
                    development: 0,
                    total: 0,
                },
            },
            options: {
                projectPath: path.resolve(projectPath),
                verbose: true,
                thresholds: this.projectThresholds || undefined,
            },
        };
        const componentResults = [];
        const availableCheckers = this.getAvailableCheckers();
        // Выполняем проверки для каждого компонента
        for (const checker of availableCheckers) {
            const result = await (0, error_handler_js_1.safeExecute)(async () => {
                this.log(`📋 Анализируем: ${checker.name}`);
                const checkResult = await checker.checkComponent(context);
                // Показываем промежуточный результат
                this.log(`   Результат: ${checkResult.percentage}% - ${checkResult.passed.length}/${checkResult.passed.length + checkResult.failed.length} проверок`);
                return checkResult;
            }, error_handler_js_1.ErrorType.ANALYSIS_ERROR, {
                operation: 'component-check',
                context: { checkerName: checker.name },
            });
            if (result) {
                componentResults.push(result);
            }
        }
        this.log('');
        // Вычисляем общую оценку
        const totalScore = componentResults.reduce((sum, r) => sum + r.score, 0);
        const maxTotalScore = componentResults.reduce((sum, r) => sum + r.maxScore, 0);
        const overallPercentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        // Собираем рекомендации
        const allRecommendations = componentResults
            .flatMap(r => r.recommendations)
            .filter((rec, index, arr) => arr.indexOf(rec) === index); // убираем дубликаты
        const result = {
            projectPath: context.projectPath,
            components: componentResults,
            summary: {
                totalScore,
                maxScore: maxTotalScore,
                percentage: overallPercentage,
                passedChecks: componentResults.reduce((sum, r) => sum + r.passed.length, 0),
                totalChecks: componentResults.reduce((sum, r) => sum + r.passed.length + r.failed.length, 0),
                criticalIssues: componentResults.reduce((sum, r) => sum + r.failed.filter(f => f.check.critical).length, 0),
            },
            recommendations: allRecommendations,
            analyzedAt: new Date(),
            duration: Date.now() - startTime,
            thresholds: this.projectThresholds || undefined,
            projectType: this.projectThresholds ? context.projectInfo.name : undefined,
            fileCount: await this.countProjectFiles(projectPath),
        };
        this.printResults(result);
        return result;
    }
    /**
     * Выводит результаты анализа в консоль
     */
    printResults(result) {
        const { summary } = result;
        this.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА');
        this.log('━'.repeat(60));
        // Общая оценка
        let grade = 'F';
        if (summary.percentage >= 90)
            grade = 'A';
        else if (summary.percentage >= 80)
            grade = 'B';
        else if (summary.percentage >= 70)
            grade = 'C';
        else if (summary.percentage >= 60)
            grade = 'D';
        this.log(`🎯 Общая оценка: ${grade} (${summary.percentage}/100)`);
        this.log(`✅ Пройдено проверок: ${summary.passedChecks}/${summary.totalChecks}`);
        this.log(`⚡ Критических проблем: ${summary.criticalIssues}`);
        this.log(`⏱️ Время анализа: ${(result.duration / 1000).toFixed(2)}с`);
        this.log('');
        // Детализация по компонентам
        this.log('📋 ДЕТАЛИЗАЦИЯ ПО КОМПОНЕНТАМ:');
        this.log('');
        result.components.forEach(comp => {
            let compGrade = 'F';
            if (comp.percentage >= 90)
                compGrade = 'A';
            else if (comp.percentage >= 80)
                compGrade = 'B';
            else if (comp.percentage >= 70)
                compGrade = 'C';
            else if (comp.percentage >= 60)
                compGrade = 'D';
            this.log(`${compGrade} ${comp.component.name}`);
            this.log(`    📈 ${comp.score}/${comp.maxScore} баллов (${comp.percentage}%)`);
            this.log(`    ✅ ${comp.passed.length} пройдено, ❌ ${comp.failed.length} не пройдено`);
            if (comp.failed.length > 0) {
                this.log(`    🔸 Проблемы:`);
                comp.failed.slice(0, 3).forEach(fail => {
                    this.log(`      • ${fail.check.name}`);
                });
                if (comp.failed.length > 3) {
                    this.log(`      • и еще ${comp.failed.length - 3} проблем...`);
                }
            }
            this.log('');
        });
        // Рекомендации
        if (result.recommendations.length > 0) {
            this.log('💡 РЕКОМЕНДАЦИИ:');
            this.log('');
            result.recommendations.slice(0, 10).forEach((rec, index) => {
                this.log(`${index + 1}. ${rec}`);
            });
            if (result.recommendations.length > 10) {
                this.log(`... и еще ${result.recommendations.length - 10} рекомендаций`);
            }
            this.log('');
        }
        // Итоговое сообщение
        if (summary.percentage >= 90) {
            this.log('🎉 Отличная работа! Проект соответствует Золотому Стандарту!');
        }
        else if (summary.percentage >= 75) {
            this.log('👍 Хороший проект! Есть несколько областей для улучшения.');
        }
        else if (summary.percentage >= 50) {
            this.log('⚠️ Проект требует существенных улучшений.');
        }
        else {
            this.log('🚨 Проект значительно отстает от стандартов. Требуется комплексная доработка.');
        }
        this.log('');
        this.log('━'.repeat(60));
    }
    /**
     * Получает список доступных проверочных модулей
     */
    getAvailableCheckers() {
        return [
            {
                name: 'ЭМТ (Эталонный Модуль Тестирования)',
                checkComponent: emt_js_1.EMTChecker.checkComponent.bind(emt_js_1.EMTChecker),
            },
            {
                name: 'Docker Infrastructure',
                checkComponent: docker_js_1.DockerChecker.checkComponent.bind(docker_js_1.DockerChecker),
            },
            {
                name: 'SvelteKit Framework',
                checkComponent: this.createSvelteKitChecker.bind(this),
            },
            {
                name: 'CI/CD Pipeline',
                checkComponent: this.createCICDChecker.bind(this),
            },
            {
                name: 'Code Quality System',
                checkComponent: this.createCodeQualityChecker.bind(this),
            },
            {
                name: 'Vitest Testing Framework',
                checkComponent: this.createVitestChecker.bind(this),
            },
            {
                name: 'Dependencies Management',
                checkComponent: this.createDependenciesChecker.bind(this),
            },
            {
                name: 'Logging System',
                checkComponent: this.createLoggingChecker.bind(this),
            },
        ];
    }
    /**
     * Создает компонентные проверки для новых чекеров
     */
    async createSvelteKitChecker(context) {
        const checker = new sveltekit_js_1.SvelteKitChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('SvelteKit Framework', checkResults);
    }
    async createCICDChecker(context) {
        const checker = new ci_cd_js_1.CICDChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('CI/CD Pipeline', checkResults);
    }
    async createCodeQualityChecker(context) {
        const checker = new code_quality_js_1.CodeQualityChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('Code Quality System', checkResults);
    }
    async createVitestChecker(context) {
        const checker = new vitest_js_1.VitestChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('Vitest Testing Framework', checkResults);
    }
    async createDependenciesChecker(context) {
        const checker = new dependencies_js_1.DependenciesChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('Dependencies Management', checkResults);
    }
    async createLoggingChecker(context) {
        const checker = new logging_js_1.LoggingChecker(context);
        const checkResults = await checker.checkAll();
        return this.createComponentResult('Logging System', checkResults);
    }
    /**
     * Создает результат компонента из результатов проверок
     */
    createComponentResult(name, checkResults) {
        const totalScore = checkResults.reduce((sum, r) => sum + r.score, 0);
        const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        const passed = checkResults.filter(r => r.passed);
        const failed = checkResults.filter(r => !r.passed);
        const recommendations = failed
            .flatMap(f => f.recommendations || [])
            .filter((rec, index, arr) => arr.indexOf(rec) === index);
        return {
            component: {
                name,
                description: `Анализ компонента ${name}`,
                weight: 8,
                checks: checkResults.map(r => r.check),
            },
            score: totalScore,
            maxScore,
            percentage,
            passed,
            failed,
            warnings: [],
            recommendations,
            duration: 0,
        };
    }
    /**
     * Сохраняет результаты анализа в JSON файл
     */
    async saveResults(result, outputPath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const jsonResult = {
            ...result,
            analyzedAt: result.analyzedAt.toISOString(),
        };
        await fs.writeFile(outputPath, JSON.stringify(jsonResult, null, 2), 'utf-8');
        // Результаты сохранены в файл
    }
}
exports.GoldenStandardAnalyzer = GoldenStandardAnalyzer;
// Экспорт для использования как библиотека
__exportStar(require("./types/index.js"), exports);
//# sourceMappingURL=analyzer.js.map