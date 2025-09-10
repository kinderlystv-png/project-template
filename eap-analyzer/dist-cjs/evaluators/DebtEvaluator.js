"use strict";
/**
 * Debt Evaluator
 * Оценщик технического долга проекта
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtEvaluator = void 0;
const interfaces_1 = require("./interfaces");
class DebtEvaluator extends interfaces_1.BaseEvaluator {
    HOURLY_RATE = 50; // Условная стоимость часа разработки
    COMPLEXITY_THRESHOLD = 10;
    DUPLICATION_THRESHOLD = 5; // Процент дублирования
    FILE_SIZE_THRESHOLD = 500; // Строк кода
    constructor() {
        super('DebtEvaluator', 'Оценивает технический долг проекта и рассчитывает стоимость его устранения');
    }
    async evaluate(project, analysisData) {
        console.log(`[${this.name}] Начинаем оценку технического долга...`);
        try {
            // Собираем данные для анализа долга
            const debtIssues = await this.collectDebtIssues(project, analysisData);
            // Категоризируем долг
            const debtByCategory = this.categorizeDebt(debtIssues);
            // Вычисляем общие метрики
            const totalHours = debtIssues.reduce((sum, issue) => sum + issue.effort, 0);
            const totalCost = totalHours * this.HOURLY_RATE;
            const debtRatio = await this.calculateDebtRatio(project, analysisData);
            // Рассчитываем ROI
            const roi = this.calculateROI(debtIssues);
            // Сортируем проблемы по приоритету
            const priorityIssues = this.prioritizeIssues(debtIssues);
            // Анализируем тренд (заглушка для демонстрации)
            const trend = {
                direction: 'stable',
                changeRate: 0
            };
            const result = {
                totalHours,
                totalCost,
                priorityIssues,
                roi,
                debtRatio,
                debtByCategory,
                trend
            };
            console.log(`[${this.name}] Оценка завершена. Общий долг: ${totalHours} часов, стоимость: ${totalCost} у.е.`);
            return result;
        }
        catch (error) {
            console.error(`[${this.name}] Ошибка при оценке:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Ошибка оценки технического долга: ${errorMessage}`);
        }
    }
    /**
     * Собирает проблемы технического долга
     */
    async collectDebtIssues(project, analysisData) {
        const issues = [];
        // Анализируем структуру проекта
        if (analysisData?.structure) {
            const structure = analysisData.structure;
            // Проблемы с большими файлами
            for (const largeFile of structure.largeFiles) {
                issues.push({
                    issue: `Большой файл: ${largeFile.path}`,
                    category: 'maintainability',
                    effort: Math.ceil(largeFile.size / 100000), // 1 час на 100К байт
                    impact: 7,
                    severity: 'medium',
                    description: `Файл ${largeFile.path} содержит ${largeFile.size} байт, что превышает рекомендуемый размер`,
                    recommendation: 'Разбить файл на более мелкие модули'
                });
            }
            // Проблемы с модульностью
            if (structure.modularity < 0.5) {
                issues.push({
                    issue: 'Низкая модульность проекта',
                    category: 'code-quality',
                    effort: Math.ceil((0.7 - structure.modularity) * 20),
                    impact: 8,
                    severity: 'high',
                    description: `Показатель модульности составляет ${Math.round(structure.modularity * 100)}%, что ниже рекомендуемого уровня 70%`,
                    recommendation: 'Создать index файлы для модулей, улучшить структуру директорий'
                });
            }
            // Проблемы с "тяжелыми" директориями
            for (const heavyDir of structure.heaviestDirectories.slice(0, 3)) {
                issues.push({
                    issue: `Перегруженная директория: ${heavyDir.path}`,
                    category: 'maintainability',
                    effort: Math.ceil(heavyDir.fileCount / 20),
                    impact: 6,
                    severity: 'medium',
                    description: `Директория ${heavyDir.path} содержит ${heavyDir.fileCount} файлов`,
                    recommendation: 'Разбить директорию на поддиректории по функциональности'
                });
            }
        }
        // Анализируем сложность кода
        if (analysisData?.complexity) {
            const complexity = analysisData.complexity;
            // Высокая цикломатическая сложность
            if (complexity.cyclomaticComplexity > this.COMPLEXITY_THRESHOLD) {
                issues.push({
                    issue: 'Высокая цикломатическая сложность',
                    category: 'code-quality',
                    effort: Math.ceil((complexity.cyclomaticComplexity - this.COMPLEXITY_THRESHOLD) * 2),
                    impact: 9,
                    severity: 'high',
                    description: `Цикломатическая сложность ${complexity.cyclomaticComplexity} превышает рекомендуемый порог ${this.COMPLEXITY_THRESHOLD}`,
                    recommendation: 'Рефакторинг сложных функций, выделение методов'
                });
            }
            // Сложные функции
            for (const complexFunc of complexity.complexFunctions.slice(0, 5)) {
                issues.push({
                    issue: `Сложная функция: ${complexFunc.name}`,
                    category: 'code-quality',
                    effort: Math.ceil(complexFunc.complexity / 3),
                    impact: 6,
                    severity: complexFunc.complexity > 20 ? 'high' : 'medium',
                    description: `Функция ${complexFunc.name} в файле ${complexFunc.file} имеет сложность ${complexFunc.complexity}`,
                    recommendation: 'Разбить функцию на более простые части'
                });
            }
            // Низкий индекс поддерживаемости
            if (complexity.maintainabilityIndex < 70) {
                issues.push({
                    issue: 'Низкий индекс поддерживаемости',
                    category: 'maintainability',
                    effort: Math.ceil((70 - complexity.maintainabilityIndex) / 10),
                    impact: 8,
                    severity: 'medium',
                    description: `Индекс поддерживаемости ${Math.round(complexity.maintainabilityIndex)} ниже рекомендуемого уровня 70`,
                    recommendation: 'Упростить код, добавить комментарии, улучшить структуру'
                });
            }
        }
        // Анализируем конфигурационные проблемы
        const configIssues = await this.analyzeConfigurationDebt(project);
        issues.push(...configIssues);
        // Анализируем зависимости
        const dependencyIssues = await this.analyzeDependencyDebt(project);
        issues.push(...dependencyIssues);
        return issues;
    }
    /**
     * Анализирует долг в конфигурациях
     */
    async analyzeConfigurationDebt(project) {
        const issues = [];
        // Проверяем package.json
        const packageContent = await this.safeReadFile(project, 'package.json');
        if (packageContent) {
            const packageJson = this.safeParseJSON(packageContent);
            if (!packageJson?.scripts?.test) {
                issues.push({
                    issue: 'Отсутствуют тесты',
                    category: 'code-quality',
                    effort: 8,
                    impact: 9,
                    severity: 'high',
                    description: 'В проекте не настроены автоматические тесты',
                    recommendation: 'Настроить тестовую среду и написать базовые тесты'
                });
            }
            if (!packageJson?.scripts?.lint) {
                issues.push({
                    issue: 'Отсутствует линтер',
                    category: 'code-quality',
                    effort: 2,
                    impact: 6,
                    severity: 'medium',
                    description: 'В проекте не настроен линтер для проверки качества кода',
                    recommendation: 'Настроить ESLint или аналогичный инструмент'
                });
            }
        }
        // Проверяем TypeScript конфигурацию
        const tsconfigContent = await this.safeReadFile(project, 'tsconfig.json');
        if (tsconfigContent) {
            const tsconfig = this.safeParseJSON(tsconfigContent);
            if (!tsconfig?.compilerOptions?.strict) {
                issues.push({
                    issue: 'Не включен строгий режим TypeScript',
                    category: 'code-quality',
                    effort: 4,
                    impact: 7,
                    severity: 'medium',
                    description: 'Строгий режим TypeScript помогает обнаружить больше ошибок',
                    recommendation: 'Включить "strict": true в tsconfig.json'
                });
            }
        }
        return issues;
    }
    /**
     * Анализирует долг в зависимостях
     */
    async analyzeDependencyDebt(project) {
        const issues = [];
        const packageContent = await this.safeReadFile(project, 'package.json');
        if (packageContent) {
            const packageJson = this.safeParseJSON(packageContent);
            // Проверяем устаревшие зависимости (упрощенная логика)
            const dependencies = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
            let outdatedCount = 0;
            for (const [name, version] of Object.entries(dependencies || {})) {
                if (typeof version === 'string' && version.includes('^') && !version.includes('latest')) {
                    outdatedCount++;
                }
            }
            if (outdatedCount > 5) {
                issues.push({
                    issue: 'Устаревшие зависимости',
                    category: 'security',
                    effort: Math.ceil(outdatedCount / 3),
                    impact: 7,
                    severity: 'medium',
                    description: `Обнаружено ${outdatedCount} потенциально устаревших зависимостей`,
                    recommendation: 'Обновить зависимости до актуальных версий'
                });
            }
        }
        return issues;
    }
    /**
     * Категоризирует долг по типам
     */
    categorizeDebt(issues) {
        const categories = {
            'code-quality': { hours: 0, cost: 0, issuesCount: 0 },
            'performance': { hours: 0, cost: 0, issuesCount: 0 },
            'security': { hours: 0, cost: 0, issuesCount: 0 },
            'maintainability': { hours: 0, cost: 0, issuesCount: 0 }
        };
        for (const issue of issues) {
            const category = categories[issue.category];
            if (category) {
                category.hours += issue.effort;
                category.cost += issue.effort * this.HOURLY_RATE;
                category.issuesCount++;
            }
        }
        return categories;
    }
    /**
     * Вычисляет коэффициент технического долга
     */
    async calculateDebtRatio(project, analysisData) {
        // Упрощенный расчет на основе доступных данных
        let ratio = 0;
        if (analysisData?.structure) {
            const structure = analysisData.structure;
            ratio += (1 - structure.modularity) * 30; // До 30% за модульность
            ratio += (structure.largeFiles.length / Math.max(structure.fileCount, 1)) * 20; // До 20% за большие файлы
        }
        if (analysisData?.complexity) {
            const complexity = analysisData.complexity;
            ratio += Math.min(complexity.cyclomaticComplexity / 20, 1) * 25; // До 25% за сложность
            ratio += Math.max(0, (70 - complexity.maintainabilityIndex) / 70) * 25; // До 25% за поддерживаемость
        }
        return Math.min(ratio, 100);
    }
    /**
     * Рассчитывает ROI от устранения долга
     */
    calculateROI(issues) {
        const totalEffort = issues.reduce((sum, issue) => sum + issue.effort, 0);
        const totalImpact = issues.reduce((sum, issue) => sum + issue.impact, 0);
        if (totalEffort === 0)
            return 0;
        // ROI = (Польза - Затраты) / Затраты * 100
        const benefit = totalImpact * 10; // Условная польза
        const cost = totalEffort * this.HOURLY_RATE;
        return ((benefit - cost) / cost) * 100;
    }
    /**
     * Приоритизирует проблемы
     */
    prioritizeIssues(issues) {
        return issues
            .sort((a, b) => {
            // Сначала по severity, потом по impact/effort ratio
            const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0)
                return severityDiff;
            const aRatio = a.impact / Math.max(a.effort, 1);
            const bRatio = b.impact / Math.max(b.effort, 1);
            return bRatio - aRatio;
        })
            .slice(0, 20); // Топ 20 проблем
    } /**
     * Проверяет применимость оценщика
     */
    async isApplicable(project) {
        // Оценщик долга применим ко всем проектам
        return true;
    }
}
exports.DebtEvaluator = DebtEvaluator;
//# sourceMappingURL=DebtEvaluator.js.map