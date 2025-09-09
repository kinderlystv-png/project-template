"use strict";
/**
 * Основной модуль анализатора структуры проекта для ЭАП
 * Интегрированная версия с системой самообучения
 */
const basicAnalyzer = require('./basic-analyzer');
const advancedAnalyzer = require('./advanced-analyzer');
const LearningSystem = require('./learning');
const config = require('./config.json');
const path = require('path');
const fs = require('fs');
class StructureAnalyzer {
    constructor(userConfig = {}) {
        this.config = this.loadConfig(userConfig);
        this.learningSystem = new LearningSystem(this.config.dataDir);
        this.version = config.module.version;
    }
    /**
     * Загружает конфигурацию модуля
     */
    loadConfig(userConfig) {
        const defaultConfig = {
            dataDir: path.join(__dirname, '../../../../data/learning'),
            enableLearning: config.analysis.types.learning.enabled,
            enableAdvancedAnalysis: config.analysis.types.advanced.enabled,
            thresholds: config.thresholds.basic,
            outputFormat: config.output.defaultFormat,
            performanceSettings: config.performance,
            integrationSettings: config.integration,
        };
        return { ...defaultConfig, ...userConfig };
    }
    /**
     * Основная функция анализа структуры проекта
     */
    async analyzeProjectStructure(projectPath, options = {}) {
        console.log('[StructureAnalyzer] Начало полного анализа структуры проекта...');
        const startTime = Date.now();
        const analysisOptions = {
            enableAdvanced: options.enableAdvanced !== false && this.config.enableAdvancedAnalysis,
            enableLearning: options.enableLearning !== false && this.config.enableLearning,
            outputFormat: options.outputFormat || this.config.outputFormat,
            timeout: options.timeout || config.analysis.fullAnalysisTimeout,
            ...options,
        };
        try {
            // Проверяем ограничения производительности
            await this.validateProjectSize(projectPath);
            // 1. Получаем адаптивные пороги
            const thresholds = this.config.enableLearning
                ? this.learningSystem.getCurrentThresholds()
                : { basic: this.config.thresholds };
            // 2. Базовый анализ
            console.log('[StructureAnalyzer] Выполнение базового анализа...');
            const basicResults = await basicAnalyzer.analyze(projectPath, thresholds.basic || thresholds);
            let advancedResults = null;
            if (analysisOptions.enableAdvanced) {
                // 3. Расширенный анализ
                console.log('[StructureAnalyzer] Выполнение расширенного анализа...');
                advancedResults = await advancedAnalyzer.analyze(projectPath, thresholds.basic || thresholds);
            }
            // 4. Обучение системы
            if (analysisOptions.enableLearning) {
                console.log('[StructureAnalyzer] Обновление системы обучения...');
                this.learningSystem.addAnalysisResult(projectPath, basicResults, advancedResults);
            }
            // 5. Генерация рекомендаций
            const patterns = basicResults.patterns || [];
            const recommendations = this.config.enableLearning
                ? this.learningSystem.getRecommendations(patterns, basicResults, advancedResults)
                : this.generateStaticRecommendations(basicResults, advancedResults);
            // 6. Интеграция с ЭАП
            const eapIntegration = this.generateEAPIntegration(basicResults, advancedResults, recommendations);
            // 7. Формирование итогового результата
            const result = {
                metadata: {
                    projectPath,
                    analysisTime: new Date().toISOString(),
                    executionTime: Date.now() - startTime,
                    analyzerVersion: this.version,
                    eapIntegration: true,
                    thresholdsUsed: thresholds.basic || thresholds,
                    analysisType: analysisOptions.enableAdvanced ? 'full' : 'basic',
                },
                basic: basicResults,
                advanced: advancedResults,
                recommendations,
                learningStats: this.config.enableLearning ? this.learningSystem.getLearningStats() : null,
                score: this.calculateStructureScore(basicResults, advancedResults),
                summary: this.generateSummary(basicResults, advancedResults, recommendations),
                eap: eapIntegration,
            };
            console.log(`[StructureAnalyzer] Анализ структуры завершен за ${result.metadata.executionTime}ms`);
            return result;
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка при анализе:', error.message);
            throw new Error(`Failed to analyze project structure: ${error.message}`);
        }
    }
    /**
     * Быстрый анализ структуры (только базовые метрики)
     */
    async quickStructureCheck(projectPath) {
        console.log('[StructureAnalyzer] Быстрая проверка структуры...');
        const startTime = Date.now();
        try {
            const thresholds = this.config.enableLearning
                ? this.learningSystem.getCurrentThresholds().basic
                : this.config.thresholds;
            const basicResults = await basicAnalyzer.analyze(projectPath, thresholds);
            const score = this.calculateBasicScore(basicResults);
            return {
                projectPath,
                score,
                issues: basicResults.issues || [],
                patterns: basicResults.patterns || [],
                recommendation: this.getQuickRecommendation(score),
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка быстрой проверки:', error.message);
            throw new Error(`Quick structure check failed: ${error.message}`);
        }
    }
    /**
     * Проверяет размер проекта для производительности
     */
    async validateProjectSize(projectPath) {
        try {
            const stats = await fs.promises.stat(projectPath);
            if (!stats.isDirectory()) {
                throw new Error('Project path must be a directory');
            }
            // Подсчет файлов
            const fileCount = await this.countFiles(projectPath);
            if (fileCount > this.config.performanceSettings.maxFiles) {
                console.warn(`[StructureAnalyzer] Проект содержит ${fileCount} файлов (лимит: ${this.config.performanceSettings.maxFiles})`);
            }
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка валидации проекта:', error.message);
            throw error;
        }
    }
    /**
     * Подсчитывает файлы в проекте
     */
    async countFiles(dirPath, count = 0) {
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !this.shouldIgnoreDirectory(entry.name)) {
                    count = await this.countFiles(path.join(dirPath, entry.name), count);
                }
                else if (entry.isFile()) {
                    count++;
                }
            }
            return count;
        }
        catch (error) {
            return count;
        }
    }
    /**
     * Проверяет, нужно ли игнорировать директорию
     */
    shouldIgnoreDirectory(dirName) {
        const ignoredDirs = config.fileTypes.source.exclude;
        return ignoredDirs.includes(dirName) || dirName.startsWith('.');
    }
    /**
     * Генерирует статические рекомендации (когда обучение отключено)
     */
    generateStaticRecommendations(basicResults, advancedResults) {
        const recommendations = [];
        // Рекомендации по структуре
        if (basicResults.totalFiles > 50 && !basicResults.directoryStructure?.src) {
            recommendations.push({
                type: 'structure',
                priority: 'medium',
                title: 'Организуйте код в src/ директории',
                description: 'Для больших проектов рекомендуется четкая структура каталогов',
            });
        }
        if (basicResults.testFiles === 0) {
            recommendations.push({
                type: 'quality',
                priority: 'high',
                title: 'Добавьте тесты',
                description: 'Проект не содержит тестовых файлов',
            });
        }
        if (basicResults.documentationFiles === 0) {
            recommendations.push({
                type: 'documentation',
                priority: 'medium',
                title: 'Добавьте документацию',
                description: 'Отсутствуют файлы документации (README.md и т.д.)',
            });
        }
        // Рекомендации по качеству кода
        if (advancedResults) {
            if (advancedResults.avgMaintainabilityIndex < 60) {
                recommendations.push({
                    type: 'refactoring',
                    priority: 'high',
                    title: 'Улучшите сопровождаемость кода',
                    description: `Текущий индекс: ${advancedResults.avgMaintainabilityIndex.toFixed(1)}`,
                });
            }
            if (advancedResults.duplicationPercentage > 10) {
                recommendations.push({
                    type: 'refactoring',
                    priority: 'medium',
                    title: 'Устраните дублирование кода',
                    description: `Найдено ${advancedResults.duplicationPercentage.toFixed(1)}% дублирования`,
                });
            }
            if (advancedResults.hotspots && advancedResults.hotspots.length > 5) {
                recommendations.push({
                    type: 'refactoring',
                    priority: 'high',
                    title: 'Отрефакторьте проблемные файлы',
                    description: `Найдено ${advancedResults.hotspots.length} проблемных файлов`,
                });
            }
        }
        return recommendations;
    }
    /**
     * Генерирует данные для интеграции с ЭАП
     */
    generateEAPIntegration(basicResults, advancedResults, recommendations) {
        const structureScore = this.calculateStructureScore(basicResults, advancedResults);
        const criticalIssues = recommendations.filter(r => r.priority === 'high').length;
        return {
            moduleVersion: this.version,
            contributionToScore: config.integration.eap.scoreContribution,
            structureScore,
            criticalIssues,
            recommendations: {
                total: recommendations.length,
                byPriority: {
                    high: recommendations.filter(r => r.priority === 'high').length,
                    medium: recommendations.filter(r => r.priority === 'medium').length,
                    low: recommendations.filter(r => r.priority === 'low').length,
                },
            },
            metrics: {
                maintainability: advancedResults ? advancedResults.avgMaintainabilityIndex : null,
                testCoverage: this.estimateTestCoverage(basicResults),
                codeQuality: this.calculateCodeQuality(basicResults, advancedResults),
                structuralComplexity: this.calculateStructuralComplexity(basicResults, advancedResults),
            },
            flags: {
                needsRefactoring: criticalIssues > 0,
                wellStructured: structureScore >= 80,
                hasTests: basicResults.testFiles > 0,
                documented: basicResults.documentationFiles > 0,
            },
        };
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
     * Вычисляет базовый балл
     */
    calculateBasicScore(basicResults) {
        let score = 100;
        // Штрафы за превышение порогов
        if (basicResults.avgFileSize > this.config.thresholds.maxFileSize) {
            score -= Math.min(30, (basicResults.avgFileSize - this.config.thresholds.maxFileSize) / 10);
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
     * Вычисляет расширенный балл
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
     * Генерирует краткую рекомендацию для быстрой проверки
     */
    getQuickRecommendation(score) {
        if (score >= 90)
            return 'Отличная структура проекта';
        if (score >= 80)
            return 'Хорошая структура, есть место для улучшений';
        if (score >= 70)
            return 'Удовлетворительная структура, рекомендуется рефакторинг';
        if (score >= 60)
            return 'Структура требует внимания';
        return 'Критические проблемы со структурой, необходим рефакторинг';
    }
    /**
     * Генерирует итоговое резюме анализа
     */
    generateSummary(basicResults, advancedResults, recommendations) {
        const summary = {
            totalFiles: basicResults.totalFiles || 0,
            totalLines: basicResults.totalLines || 0,
            avgFileSize: basicResults.avgFileSize || 0,
            directoryDepth: basicResults.directoryDepth || 0,
            patterns: basicResults.patterns || [],
            issues: [],
            strengths: [],
        };
        // Определяем проблемы
        if (basicResults.emptyFiles > 0) {
            summary.issues.push(`${basicResults.emptyFiles} пустых файлов`);
        }
        if (advancedResults && advancedResults.hotspots && advancedResults.hotspots.length > 0) {
            summary.issues.push(`${advancedResults.hotspots.length} проблемных файлов`);
        }
        if (advancedResults && advancedResults.duplicationPercentage > 10) {
            summary.issues.push(`${advancedResults.duplicationPercentage.toFixed(1)}% дублирования кода`);
        }
        // Определяем сильные стороны
        if (basicResults.testFiles > 0) {
            summary.strengths.push('Наличие тестов');
        }
        if (basicResults.documentationFiles > 0) {
            summary.strengths.push('Хорошая документация');
        }
        if (advancedResults && advancedResults.avgMaintainabilityIndex > 80) {
            summary.strengths.push('Высокая сопровождаемость');
        }
        if (advancedResults && advancedResults.cohesion > 0.7) {
            summary.strengths.push('Хорошая связность модулей');
        }
        summary.recommendationCount = recommendations.length;
        summary.highPriorityRecommendations = recommendations.filter(r => r.priority === 'high').length;
        return summary;
    }
    /**
     * Получает информацию о модуле
     */
    getModuleInfo() {
        return {
            name: config.module.name,
            version: config.module.version,
            description: config.module.description,
            author: config.module.author,
            integration: config.module.integration,
            capabilities: {
                basicAnalysis: config.analysis.types.basic.enabled,
                advancedAnalysis: config.analysis.types.advanced.enabled,
                learningSystem: config.analysis.types.learning.enabled,
                supportedFormats: config.output.formats,
                performance: config.performance,
            },
        };
    }
    /**
     * Получает статистику обучения
     */
    getLearningStats() {
        if (!this.config.enableLearning) {
            return { enabled: false };
        }
        return {
            enabled: true,
            ...this.learningSystem.getLearningStats(),
        };
    }
    /**
     * Получает текущие адаптивные пороги
     */
    getCurrentThresholds() {
        return this.config.enableLearning
            ? this.learningSystem.getCurrentThresholds()
            : { basic: this.config.thresholds };
    }
    /**
     * Экспортирует результаты анализа
     */
    async exportResults(results, outputPath, format = 'json') {
        try {
            let content;
            switch (format.toLowerCase()) {
                case 'json':
                    content = JSON.stringify(results, null, 2);
                    break;
                case 'text':
                    content = this.formatResultsAsText(results);
                    break;
                case 'html':
                    content = this.formatResultsAsHTML(results);
                    break;
                case 'csv':
                    content = this.formatResultsAsCSV(results);
                    break;
                default:
                    throw new Error(`Неподдерживаемый формат: ${format}`);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `structure-analysis-${timestamp}.${format}`;
            const fullPath = path.join(outputPath, filename);
            await fs.promises.mkdir(outputPath, { recursive: true });
            await fs.promises.writeFile(fullPath, content);
            console.log(`[StructureAnalyzer] Результаты сохранены: ${fullPath}`);
            return fullPath;
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка экспорта:', error.message);
            throw error;
        }
    }
    /**
     * Форматирует результаты как CSV
     */
    formatResultsAsCSV(results) {
        const rows = [
            ['Метрика', 'Значение'],
            ['Общий балл', results.score],
            ['Общее количество файлов', results.summary.totalFiles],
            ['Общее количество строк', results.summary.totalLines],
            ['Средний размер файла', results.summary.avgFileSize],
            ['Глубина директорий', results.summary.directoryDepth],
            ['Количество рекомендаций', results.summary.recommendationCount],
            ['Высокоприоритетные рекомендации', results.summary.highPriorityRecommendations],
        ];
        if (results.advanced) {
            rows.push(['Индекс сопровождаемости', results.advanced.avgMaintainabilityIndex]);
            rows.push(['Дублирование кода (%)', results.advanced.duplicationPercentage]);
            rows.push([
                'Проблемных файлов',
                results.advanced.hotspots ? results.advanced.hotspots.length : 0,
            ]);
        }
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    /**
     * Форматирует результаты как текст
     */
    formatResultsAsText(results) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('АНАЛИЗ СТРУКТУРЫ ПРОЕКТА');
        lines.push('='.repeat(80));
        lines.push(`Проект: ${results.metadata.projectPath}`);
        lines.push(`Время анализа: ${results.metadata.analysisTime}`);
        lines.push(`Общий балл: ${results.score}/100`);
        lines.push(`Время выполнения: ${results.metadata.executionTime}ms`);
        lines.push('');
        // Основные метрики
        lines.push('ОСНОВНЫЕ МЕТРИКИ:');
        lines.push('-'.repeat(40));
        lines.push(`Общее количество файлов: ${results.summary.totalFiles}`);
        lines.push(`Общее количество строк: ${results.summary.totalLines}`);
        lines.push(`Средний размер файла: ${results.summary.avgFileSize} строк`);
        lines.push(`Глубина директорий: ${results.summary.directoryDepth}`);
        lines.push('');
        // Обнаруженные паттерны
        if (results.summary.patterns.length > 0) {
            lines.push('ОБНАРУЖЕННЫЕ ПАТТЕРНЫ:');
            lines.push('-'.repeat(40));
            results.summary.patterns.forEach(pattern => {
                lines.push(`• ${pattern}`);
            });
            lines.push('');
        }
        // Проблемы
        if (results.summary.issues.length > 0) {
            lines.push('ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:');
            lines.push('-'.repeat(40));
            results.summary.issues.forEach(issue => {
                lines.push(`• ${issue}`);
            });
            lines.push('');
        }
        // Сильные стороны
        if (results.summary.strengths.length > 0) {
            lines.push('СИЛЬНЫЕ СТОРОНЫ:');
            lines.push('-'.repeat(40));
            results.summary.strengths.forEach(strength => {
                lines.push(`• ${strength}`);
            });
            lines.push('');
        }
        // Рекомендации
        if (results.recommendations.length > 0) {
            lines.push('РЕКОМЕНДАЦИИ:');
            lines.push('-'.repeat(40));
            results.recommendations.forEach((rec, index) => {
                lines.push(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
                lines.push(`   ${rec.description}`);
                lines.push('');
            });
        }
        // ЭАП интеграция
        if (results.eap) {
            lines.push('ИНТЕГРАЦИЯ С ЭАП:');
            lines.push('-'.repeat(40));
            lines.push(`Вклад в общий балл: ${(results.eap.contributionToScore * 100).toFixed(1)}%`);
            lines.push(`Критические проблемы: ${results.eap.criticalIssues}`);
            lines.push(`Качество кода: ${results.eap.metrics.codeQuality}/100`);
            lines.push(`Структурная сложность: ${results.eap.metrics.structuralComplexity}/100`);
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Форматирует результаты как HTML
     */
    formatResultsAsHTML(results) {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Анализ структуры проекта</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
        .score { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .score-label { font-size: 1.2em; opacity: 0.9; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .list-item { padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #28a745; }
        .issue-item { border-left-color: #dc3545; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 10px 0; }
        .rec-high { border-left: 4px solid #dc3545; }
        .rec-medium { border-left: 4px solid #ffc107; }
        .rec-low { border-left: 4px solid #28a745; }
        .eap-integration { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .eap-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .eap-metric { text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; }
        .patterns { display: flex; flex-wrap: wrap; gap: 10px; }
        .pattern-tag { background: #e3f2fd; color: #1976d2; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .execution-time { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Анализ структуры проекта</h1>
            <p><strong>Проект:</strong> ${results.metadata.projectPath}</p>
            <p><strong>Время анализа:</strong> ${results.metadata.analysisTime}</p>
            <p class="execution-time">Время выполнения: ${results.metadata.executionTime}ms</p>
            <div class="score" style="color: ${results.score >= 80 ? '#4CAF50' : results.score >= 60 ? '#FF9800' : '#F44336'}">${results.score}</div>
            <div class="score-label">из 100 баллов</div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${results.summary.totalFiles}</div>
                <div class="metric-label">Общее количество файлов</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.summary.totalLines.toLocaleString()}</div>
                <div class="metric-label">Общее количество строк</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(results.summary.avgFileSize)}</div>
                <div class="metric-label">Средний размер файла</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.summary.directoryDepth}</div>
                <div class="metric-label">Глубина директорий</div>
            </div>
        </div>

        ${results.summary.patterns.length > 0
            ? `
        <div class="section">
            <h2>Обнаруженные паттерны</h2>
            <div class="patterns">
                ${results.summary.patterns.map(pattern => `<span class="pattern-tag">${pattern}</span>`).join('')}
            </div>
        </div>
        `
            : ''}

        ${results.summary.issues.length > 0
            ? `
        <div class="section">
            <h2>Обнаруженные проблемы</h2>
            ${results.summary.issues.map(issue => `<div class="list-item issue-item">${issue}</div>`).join('')}
        </div>
        `
            : ''}

        ${results.summary.strengths.length > 0
            ? `
        <div class="section">
            <h2>Сильные стороны</h2>
            ${results.summary.strengths.map(strength => `<div class="list-item">${strength}</div>`).join('')}
        </div>
        `
            : ''}

        ${results.recommendations.length > 0
            ? `
        <div class="section">
            <h2>Рекомендации</h2>
            ${results.recommendations
                .map((rec, index) => `
                <div class="recommendation rec-${rec.priority}">
                    <strong>${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}</strong><br>
                    <span style="color: #666;">${rec.description}</span>
                </div>
            `)
                .join('')}
        </div>
        `
            : ''}

        ${results.eap
            ? `
        <div class="eap-integration">
            <h2 style="color: white; margin-top: 0;">Интеграция с ЭАП</h2>
            <p>Вклад в общий балл: ${(results.eap.contributionToScore * 100).toFixed(1)}%</p>
            <div class="eap-metrics">
                <div class="eap-metric">
                    <div style="font-size: 1.5em; font-weight: bold;">${results.eap.metrics.codeQuality}</div>
                    <div>Качество кода</div>
                </div>
                <div class="eap-metric">
                    <div style="font-size: 1.5em; font-weight: bold;">${results.eap.criticalIssues}</div>
                    <div>Критические проблемы</div>
                </div>
                <div class="eap-metric">
                    <div style="font-size: 1.5em; font-weight: bold;">${results.eap.metrics.structuralComplexity}</div>
                    <div>Структурная сложность</div>
                </div>
                ${results.eap.metrics.testCoverage !== null
                ? `
                <div class="eap-metric">
                    <div style="font-size: 1.5em; font-weight: bold;">${Math.round(results.eap.metrics.testCoverage)}%</div>
                    <div>Покрытие тестами</div>
                </div>
                `
                : ''}
            </div>
        </div>
        `
            : ''}

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
            Сгенерировано модулем Structure Analyzer v${results.metadata.analyzerVersion} для ЭАП
        </div>
    </div>
</body>
</html>
    `.trim();
    }
}
// Создаем статические методы для прямого использования в ЭАП
/**
 * Основная функция анализа структуры проекта для интеграции с ЭАП
 */
async function analyzeProjectStructure(projectPath, options = {}) {
    const analyzer = new StructureAnalyzer();
    return await analyzer.analyzeProjectStructure(projectPath, options);
}
/**
 * Быстрая проверка структуры проекта
 */
async function quickStructureCheck(projectPath) {
    const analyzer = new StructureAnalyzer();
    return await analyzer.quickStructureCheck(projectPath);
}
/**
 * Получение информации о модуле
 */
function getModuleInfo() {
    const analyzer = new StructureAnalyzer();
    return analyzer.getModuleInfo();
}
/**
 * Экспорт результатов анализа
 */
async function exportResults(results, outputPath, format = 'json') {
    const analyzer = new StructureAnalyzer();
    return await analyzer.exportResults(results, outputPath, format);
}
module.exports = {
    StructureAnalyzer,
    analyzeProjectStructure,
    quickStructureCheck,
    getModuleInfo,
    exportResults,
};
//# sourceMappingURL=index-new.js.map