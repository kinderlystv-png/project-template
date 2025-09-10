"use strict";
/**
 * Калькулятор метрик и оценок для анализа структуры
 * Вычисляет различные показатели качества и сложности кода
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCalculator = void 0;
/**
 * Класс для вычисления метрик проекта
 */
class MetricsCalculator {
    constructor(core) {
        this.core = core;
    }
    /**
     * Вычисляет общий балл структуры проекта
     */
    calculateStructureScore(basicResults, advancedResults = null) {
        let score = 0;
        let maxScore = 0;
        // Базовые метрики (60% от общего балла)
        const basicScore = this.calculateBasicScore(basicResults);
        score += basicScore * 0.6;
        maxScore += 100 * 0.6;
        // Расширенные метрики (40% от общего балла)
        if (advancedResults) {
            const advancedScore = this.calculateAdvancedScore(advancedResults);
            score += advancedScore * 0.4;
            maxScore += 100 * 0.4;
        }
        else {
            // Если нет расширенного анализа, увеличиваем вес базового
            score += basicScore * 0.4;
            maxScore += 100 * 0.4;
        }
        return Math.round((score / maxScore) * 100);
    }
    /**
     * Вычисляет базовый балл структуры
     */
    calculateBasicScore(basicResults) {
        let score = 100;
        // Штрафы за превышение порогов
        if (basicResults.avgFileSize > this.core.config.thresholds.maxFileSize) {
            score -= Math.min(30, (basicResults.avgFileSize - this.core.config.thresholds.maxFileSize) / 10);
        }
        if (basicResults.directoryDepth > 8) {
            score -= Math.min(15, (basicResults.directoryDepth - 8) * 3);
        }
        if (basicResults.emptyFiles > 0) {
            score -= Math.min(10, basicResults.emptyFiles * 2);
        }
        // Бонусы за хорошую структуру
        if (basicResults.testFiles > 0) {
            score += Math.min(10, (basicResults.testFiles / basicResults.totalFiles) * 50);
        }
        if (basicResults.documentationFiles > 0) {
            score += 5;
        }
        if (basicResults.configurationFiles > 0) {
            score += 5;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Вычисляет расширенный балл качества
     */
    calculateAdvancedScore(advancedResults) {
        let score = 100;
        // Штрафы за проблемы качества
        if (advancedResults.avgMaintainabilityIndex < 70) {
            score -= 70 - advancedResults.avgMaintainabilityIndex;
        }
        if (advancedResults.duplicationPercentage > 5) {
            score -= Math.min(25, (advancedResults.duplicationPercentage - 5) * 3);
        }
        if (advancedResults.hotspots && advancedResults.hotspots.length > 0) {
            score -= Math.min(30, advancedResults.hotspots.length * 3);
        }
        if (advancedResults.coupling > 0.5) {
            score -= Math.min(15, (advancedResults.coupling - 0.5) * 30);
        }
        if (advancedResults.cohesion < 0.5) {
            score -= Math.min(15, (0.5 - advancedResults.cohesion) * 30);
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Оценивает покрытие тестами
     */
    estimateTestCoverage(basicResults) {
        if (basicResults.testFiles === 0)
            return 0;
        const testRatio = basicResults.testFiles / Math.max(1, basicResults.totalFiles - basicResults.testFiles);
        return Math.min(100, testRatio * 100);
    }
    /**
     * Вычисляет общее качество кода
     */
    calculateCodeQuality(basicResults, advancedResults) {
        let quality = 50; // базовое значение
        // Влияние тестов
        if (basicResults.testFiles > 0) {
            quality += 20;
        }
        // Влияние документации
        if (basicResults.documentationFiles > 0) {
            quality += 10;
        }
        // Влияние расширенных метрик
        if (advancedResults) {
            if (advancedResults.avgMaintainabilityIndex > 70) {
                quality += 15;
            }
            if (advancedResults.duplicationPercentage < 5) {
                quality += 10;
            }
            if (advancedResults.hotspots.length === 0) {
                quality += 15;
            }
        }
        return Math.min(100, quality);
    }
    /**
     * Вычисляет структурную сложность
     */
    calculateStructuralComplexity(basicResults, advancedResults) {
        let complexity = 0;
        // Базовая сложность от структуры файлов
        complexity += Math.min(50, basicResults.directoryDepth * 5);
        complexity += Math.min(30, basicResults.totalFiles / 10);
        // Дополнительная сложность от метрик кода
        if (advancedResults) {
            const avgComplexity = advancedResults.complexityData
                ? advancedResults.complexityData.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) /
                    advancedResults.complexityData.length
                : 0;
            complexity += Math.min(20, avgComplexity * 2);
        }
        return Math.min(100, complexity);
    }
    /**
     * Вычисляет метрики поддерживаемости
     */
    calculateMaintainabilityMetrics(basicResults, advancedResults) {
        const metrics = {
            fileSize: {
                average: basicResults.avgFileSize || 0,
                max: basicResults.maxFileSize || 0,
                score: this.scoreFileSize(basicResults.avgFileSize),
            },
            complexity: {
                structural: this.calculateStructuralComplexity(basicResults, advancedResults),
                cyclomatic: advancedResults?.avgCyclomaticComplexity || 0,
                score: this.scoreComplexity(advancedResults?.avgCyclomaticComplexity),
            },
            duplication: {
                percentage: advancedResults?.duplicationPercentage || 0,
                score: this.scoreDuplication(advancedResults?.duplicationPercentage),
            },
            testCoverage: {
                estimated: this.estimateTestCoverage(basicResults),
                score: this.scoreTestCoverage(this.estimateTestCoverage(basicResults)),
            },
        };
        // Общий балл поддерживаемости
        const weights = { fileSize: 0.2, complexity: 0.3, duplication: 0.2, testCoverage: 0.3 };
        metrics.overall = Object.entries(weights).reduce((sum, [key, weight]) => {
            return sum + metrics[key].score * weight;
        }, 0);
        return metrics;
    }
    /**
     * Оценивает размер файлов
     */
    scoreFileSize(avgSize) {
        if (!avgSize)
            return 100;
        if (avgSize < 200)
            return 100;
        if (avgSize < 500)
            return 80;
        if (avgSize < 1000)
            return 60;
        if (avgSize < 2000)
            return 40;
        return 20;
    }
    /**
     * Оценивает сложность
     */
    scoreComplexity(avgComplexity) {
        if (!avgComplexity)
            return 100;
        if (avgComplexity < 5)
            return 100;
        if (avgComplexity < 10)
            return 80;
        if (avgComplexity < 15)
            return 60;
        if (avgComplexity < 20)
            return 40;
        return 20;
    }
    /**
     * Оценивает дублирование
     */
    scoreDuplication(duplicationPercentage) {
        if (!duplicationPercentage)
            return 100;
        if (duplicationPercentage < 2)
            return 100;
        if (duplicationPercentage < 5)
            return 80;
        if (duplicationPercentage < 10)
            return 60;
        if (duplicationPercentage < 20)
            return 40;
        return 20;
    }
    /**
     * Оценивает покрытие тестами
     */
    scoreTestCoverage(coverage) {
        if (coverage >= 80)
            return 100;
        if (coverage >= 60)
            return 80;
        if (coverage >= 40)
            return 60;
        if (coverage >= 20)
            return 40;
        if (coverage > 0)
            return 20;
        return 0;
    }
    /**
     * Генерирует итоговое резюме метрик
     */
    generateMetricsSummary(basicResults, advancedResults, recommendations) {
        const score = this.calculateStructureScore(basicResults, advancedResults);
        const criticalIssues = recommendations.filter(r => r.priority === 'high').length;
        const maintainabilityMetrics = this.calculateMaintainabilityMetrics(basicResults, advancedResults);
        return {
            // Основные показатели
            totalFiles: basicResults.totalFiles || 0,
            totalLines: basicResults.totalLines || 0,
            avgFileSize: basicResults.avgFileSize || 0,
            directoryDepth: basicResults.directoryDepth || 0,
            // Оценки и баллы
            overallScore: score,
            maintainabilityScore: Math.round(maintainabilityMetrics.overall),
            codeQualityScore: this.calculateCodeQuality(basicResults, advancedResults),
            // Детальные метрики
            metrics: maintainabilityMetrics,
            // Проблемы и рекомендации
            criticalIssues,
            totalRecommendations: recommendations.length,
            // Паттерны и особенности
            patterns: basicResults.patterns || [],
            flags: {
                needsRefactoring: criticalIssues > 0 || score < 70,
                wellStructured: score >= 80,
                hasTests: basicResults.testFiles > 0,
                documented: basicResults.documentationFiles > 0,
                highComplexity: advancedResults?.avgCyclomaticComplexity > 15,
                highDuplication: advancedResults?.duplicationPercentage > 10,
            },
        };
    }
    /**
     * Вычисляет ROI от рефакторинга
     */
    calculateRefactoringROI(basicResults, advancedResults) {
        const currentScore = this.calculateStructureScore(basicResults, advancedResults);
        const potentialImprovement = Math.max(0, 90 - currentScore); // Целевой балл 90
        // Оценка времени на рефакторинг (в часах)
        let refactoringHours = 0;
        // Большие файлы
        if (basicResults.largeFiles) {
            refactoringHours += basicResults.largeFiles.length * 6;
        }
        // Проблемные файлы
        if (advancedResults?.hotspots) {
            refactoringHours += advancedResults.hotspots.length * 4;
        }
        // Дублирование кода
        if (advancedResults?.duplicationPercentage > 10) {
            refactoringHours += advancedResults.duplicationPercentage * 2;
        }
        // Тесты
        if (basicResults.testFiles === 0) {
            refactoringHours += Math.min(basicResults.totalFiles * 2, 40);
        }
        // Экономия времени разработки (часов в месяц)
        const monthlySavings = potentialImprovement * 0.5; // 0.5 часа в месяц за каждый балл улучшения
        // ROI в процентах за первый год
        const yearlyROI = ((monthlySavings * 12) / Math.max(refactoringHours, 1)) * 100;
        return {
            currentScore,
            potentialImprovement,
            estimatedRefactoringHours: refactoringHours,
            monthlySavings,
            yearlyROI: Math.round(yearlyROI),
            breakEvenMonths: Math.ceil(refactoringHours / monthlySavings),
        };
    }
}
exports.MetricsCalculator = MetricsCalculator;
exports.default = MetricsCalculator;
//# sourceMappingURL=calculator.js.map