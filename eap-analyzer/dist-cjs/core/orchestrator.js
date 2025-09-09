"use strict";
/**
 * Главный оркестратор анализа v3.0
 * Координирует все модули и чекеры с поддержкой параллельного выполнения и кеширования
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisOrchestrator = void 0;
const cache_manager_js_1 = require("./cache-manager.js");
const report_generator_js_1 = require("./report-generator.js");
const ultimate_report_generator_js_1 = require("./ultimate-report-generator.js");
const analyzer_js_1 = require("../modules/ai-insights/analyzer.js");
const simple_analyzer_js_1 = require("../modules/technical-debt/simple-analyzer.js");
class AnalysisOrchestrator {
    checkers = new Map();
    modules = new Map();
    cacheManager;
    reportGenerator;
    ultimateReportGenerator;
    maxParallelism;
    constructor(cacheManagerOrMaxParallelism) {
        // Поддержка разных вариантов конструктора
        if (typeof cacheManagerOrMaxParallelism === 'number') {
            this.maxParallelism = cacheManagerOrMaxParallelism;
            this.cacheManager = new cache_manager_js_1.CacheManager();
        }
        else if (cacheManagerOrMaxParallelism instanceof cache_manager_js_1.CacheManager) {
            this.cacheManager = cacheManagerOrMaxParallelism;
            this.maxParallelism = 4;
        }
        else {
            this.cacheManager = new cache_manager_js_1.CacheManager();
            this.maxParallelism = 4;
        }
        this.reportGenerator = new report_generator_js_1.ReportGenerator();
        this.ultimateReportGenerator = new ultimate_report_generator_js_1.UltimateReportGenerator();
        // Автоматическая регистрация новых анализаторов
        this.registerDefaultAnalyzers();
    }
    /**
     * Регистрация стандартных анализаторов
     */
    registerDefaultAnalyzers() {
        const aiAnalyzer = new analyzer_js_1.AIAnalyzer();
        const debtAnalyzer = new simple_analyzer_js_1.SimpleTechnicalDebtAnalyzer();
        this.registerModule(aiAnalyzer.getName(), aiAnalyzer);
        this.registerModule(debtAnalyzer.getName(), debtAnalyzer);
    }
    registerChecker(name, checker) {
        this.checkers.set(name, checker);
        console.log(`✅ Зарегистрирован чекер: ${name}`);
    }
    registerModule(name, module) {
        this.modules.set(name, module);
        console.log(`📦 Зарегистрирован модуль: ${name}`);
    }
    async analyzeProject(projectPath, useCache = true) {
        console.log('🚀 Запуск параллельного анализа проекта...');
        console.log(`� Зарегистрировано чекеров: ${this.checkers.size}`);
        console.log(`📦 Зарегистрировано модулей: ${this.modules.size}`);
        console.log(`⚡ Максимальный параллелизм: ${this.maxParallelism}`);
        const context = {
            projectPath,
            config: {},
        };
        try {
            // Параллельное выполнение всех чекеров
            const checkResults = await this.runCheckersInParallel(context, useCache);
            // Параллельное выполнение всех модулей
            const moduleResults = await this.runModulesInParallel(context, useCache);
            // Агрегация результатов
            const summary = this.aggregateResults(checkResults, moduleResults);
            const result = {
                summary,
                checks: checkResults,
                modules: moduleResults,
                metadata: {
                    version: '3.0.0',
                    timestamp: new Date(),
                    duration: 0,
                    projectPath,
                    modulesUsed: Array.from(this.modules.keys()),
                    checkersUsed: Array.from(this.checkers.keys()),
                },
            };
            console.log('✅ Анализ завершен успешно');
            console.log(`� Общая оценка: ${summary.overallScore}/100`);
            console.log(`🚨 Критических проблем: ${summary.criticalIssues.length}`);
            return result;
        }
        catch (error) {
            console.error('❌ Ошибка при выполнении анализа:', error);
            throw error;
        }
    }
    /**
     * Главный метод для полного анализа проекта
     */
    async runFullAnalysis(projectPath) {
        console.log(`🚀 Запуск полного анализа проекта: ${projectPath}`);
        return await this.analyzeProject(projectPath);
    }
    async generateReport(results) {
        console.log('📊 Генерация comprehensive отчета...');
        // Генерация стандартного отчета
        const standardReport = this.reportGenerator.generateComprehensiveReport(results);
        // Генерация ultimate отчета с AI анализом
        const ultimateReport = await this.ultimateReportGenerator.generateUltimateReport(results);
        return standardReport;
    }
    async analyzeProjectWithReport(projectPath) {
        const analysis = await this.analyzeProject(projectPath);
        const report = await this.generateReport(analysis);
        return { analysis, report };
    }
    async runCheckersInParallel(context, useCache) {
        const checkerNames = Array.from(this.checkers.keys());
        const checkResults = {};
        console.log(`⚡ Выполнение ${checkerNames.length} чекеров параллельно...`);
        // Разбиваем чекеры на батчи для контроля параллелизма
        const batches = this.chunkArray(checkerNames, this.maxParallelism);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 Батч ${i + 1}/${batches.length}: выполнение ${batch.length} чекеров`);
            const batchPromises = batch.map(async (name) => {
                const checker = this.checkers.get(name);
                const cacheKey = `checker-${name}-${context.projectPath}`;
                const result = useCache
                    ? await this.cacheManager.getOrCompute(cacheKey, () => Promise.resolve(checker.check(context)))
                    : await Promise.resolve(checker.check(context));
                console.log(`✓ Чекер ${name} завершен (оценка: ${result.score})`);
                return { name, result };
            });
            const batchResults = await Promise.allSettled(batchPromises);
            // Обработка результатов батча
            batchResults.forEach((promiseResult, index) => {
                const checkerName = batch[index];
                if (promiseResult.status === 'fulfilled') {
                    checkResults[promiseResult.value.name] = promiseResult.value.result;
                }
                else {
                    console.error(`❌ Ошибка в чекере ${checkerName}:`, promiseResult.reason);
                    // Создаем результат с ошибкой
                    checkResults[checkerName] = {
                        passed: false,
                        score: 0,
                        category: 'quality',
                        message: `Ошибка выполнения чекера: ${promiseResult.reason?.message || 'Unknown error'}`,
                        details: { error: promiseResult.reason },
                        recommendations: [
                            'Проверьте конфигурацию чекера',
                            'Убедитесь в корректности входных данных',
                        ],
                    };
                }
            });
        }
        return checkResults;
    }
    async runModulesInParallel(context, useCache) {
        const moduleNames = Array.from(this.modules.keys());
        const moduleResults = {};
        console.log(`📦 Выполнение ${moduleNames.length} модулей параллельно...`);
        // Модули также выполняем батчами
        const batches = this.chunkArray(moduleNames, this.maxParallelism);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`🔧 Батч модулей ${i + 1}/${batches.length}: анализ ${batch.length} модулей`);
            const batchPromises = batch.map(async (name) => {
                const module = this.modules.get(name);
                const cacheKey = `module-${name}-${context.projectPath}`;
                const result = useCache
                    ? await this.cacheManager.getOrCompute(cacheKey, () => module.analyze(context.projectPath))
                    : await module.analyze(context.projectPath);
                console.log(`✓ Модуль ${name} завершен`);
                return { name, result };
            });
            const batchResults = await Promise.allSettled(batchPromises);
            // Обработка результатов батча
            batchResults.forEach((promiseResult, index) => {
                const moduleName = batch[index];
                if (promiseResult.status === 'fulfilled') {
                    moduleResults[promiseResult.value.name] = promiseResult.value.result;
                }
                else {
                    console.error(`❌ Ошибка в модуле ${moduleName}:`, promiseResult.reason);
                    // Создаем результат с ошибкой
                    moduleResults[moduleName] = {
                        score: 0,
                        status: 'error',
                        analysis: {},
                        issues: [
                            {
                                type: 'error',
                                message: `Ошибка выполнения модуля: ${promiseResult.reason?.message || 'Unknown error'}`,
                                severity: 'critical',
                            },
                        ],
                    };
                }
            });
        }
        return moduleResults;
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    aggregateResults(checkResults, moduleResults) {
        const scores = Object.values(checkResults)
            .filter(r => typeof r.score === 'number')
            .map(r => r.score);
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const criticalIssues = [];
        // Сбор критических проблем из чекеров
        Object.entries(checkResults).forEach(([name, result]) => {
            if (result.score < 50) {
                criticalIssues.push({
                    message: result.message,
                    source: `Checker: ${name}`,
                    score: result.score,
                });
            }
        });
        // Сбор критических проблем из модулей
        Object.entries(moduleResults).forEach(([name, result]) => {
            if (result.issues) {
                result.issues.forEach((issue) => {
                    if (issue.severity === 'critical' || (issue.score && issue.score < 50)) {
                        criticalIssues.push({
                            message: issue.message || issue.description,
                            source: `Module: ${name}`,
                            score: issue.score || 0,
                        });
                    }
                });
            }
        });
        // Сортировка критических проблем по серьезности
        criticalIssues.sort((a, b) => a.score - b.score);
        return {
            overallScore,
            status: overallScore >= 70 ? 'good' : overallScore >= 50 ? 'warning' : 'critical',
            criticalIssues: criticalIssues.slice(0, 15).map(issue => `${issue.source}: ${issue.message}`),
            categories: {
                quality: this.getCategoryScore(checkResults, 'quality'),
                security: this.getCategoryScore(checkResults, 'security'),
                performance: this.getCategoryScore(checkResults, 'performance'),
                structure: this.getCategoryScore(checkResults, 'structure'),
            },
            totalChecks: Object.keys(checkResults).length,
            passedChecks: Object.values(checkResults).filter((r) => r.passed).length,
            failedChecks: Object.values(checkResults).filter((r) => !r.passed).length,
            recommendations: [],
        };
    }
    getCategoryScore(results, category) {
        const categoryResults = Object.values(results).filter(r => r.category === category);
        if (categoryResults.length === 0)
            return { score: 100, checks: 0, passed: 0 };
        const avgScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
        const passed = categoryResults.filter(r => r.passed).length;
        return {
            score: Math.round(avgScore),
            checks: categoryResults.length,
            passed: passed,
        };
    }
    // Утилиты для управления кешем
    clearCache() {
        this.cacheManager.clear();
        console.log('🗑️ Кеш очищен');
    }
    invalidateProjectCache(projectPath) {
        this.cacheManager.invalidatePattern(`*${projectPath}*`);
        console.log(`🗑️ Кеш проекта ${projectPath} очищен`);
    }
    getCacheStats() {
        console.log('📊 Статистика кеша недоступна');
        return {};
    }
}
exports.AnalysisOrchestrator = AnalysisOrchestrator;
//# sourceMappingURL=orchestrator.js.map