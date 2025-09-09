"use strict";
/**
 * Модуль системы обучения для анализатора структуры проекта
 * Адаптированная версия для интеграции с ЭАП
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LearningSystem {
    constructor(dataDir = null) {
        this.dataDir = dataDir || path_1.default.join(__dirname, '../../../../data/learning');
        this.metricsHistoryFile = path_1.default.join(this.dataDir, 'metrics-history.json');
        this.thresholdsFile = path_1.default.join(this.dataDir, 'adaptive-thresholds.json');
        this.patternsFile = path_1.default.join(this.dataDir, 'project-patterns.json');
        this.ensureDataDirectory();
        this.metricsHistory = this.loadMetricsHistory();
        this.adaptiveThresholds = this.loadAdaptiveThresholds();
        this.projectPatterns = this.loadProjectPatterns();
    }
    /**
     * Обеспечивает наличие директории для данных обучения
     */
    ensureDataDirectory() {
        try {
            if (!fs_1.default.existsSync(this.dataDir)) {
                fs_1.default.mkdirSync(this.dataDir, { recursive: true });
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка создания директории данных:', error.message);
        }
    }
    /**
     * Загружает историю метрик
     */
    loadMetricsHistory() {
        try {
            if (fs_1.default.existsSync(this.metricsHistoryFile)) {
                const data = fs_1.default.readFileSync(this.metricsHistoryFile, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка загрузки истории метрик:', error.message);
        }
        return {
            projects: [],
            aggregatedMetrics: {},
            lastUpdated: new Date().toISOString(),
        };
    }
    /**
     * Загружает адаптивные пороговые значения
     */
    loadAdaptiveThresholds() {
        try {
            if (fs_1.default.existsSync(this.thresholdsFile)) {
                const data = fs_1.default.readFileSync(this.thresholdsFile, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка загрузки адаптивных порогов:', error.message);
        }
        return this.getDefaultThresholds();
    }
    /**
     * Загружает паттерны проектов
     */
    loadProjectPatterns() {
        try {
            if (fs_1.default.existsSync(this.patternsFile)) {
                const data = fs_1.default.readFileSync(this.patternsFile, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка загрузки паттернов проектов:', error.message);
        }
        return {
            patterns: [],
            classifications: {},
            lastUpdated: new Date().toISOString(),
        };
    }
    /**
     * Возвращает пороговые значения по умолчанию
     */
    getDefaultThresholds() {
        return {
            basic: {
                maxFileSize: 300,
                maxComplexity: 10,
                minMaintainability: 70,
                maxNestingDepth: 4,
                minTestCoverage: 80,
            },
            advanced: {
                maxCognitiveComplexity: 15,
                maxDuplicationPercentage: 5,
                minCohesion: 0.7,
                maxCoupling: 0.3,
                maxHotspotScore: 50,
            },
            confidence: {
                sampleSize: 0,
                lastAdjustment: new Date().toISOString(),
                adjustmentHistory: [],
            },
        };
    }
    /**
     * Сохраняет данные обучения
     */
    saveData() {
        try {
            fs_1.default.writeFileSync(this.metricsHistoryFile, JSON.stringify(this.metricsHistory, null, 2));
            fs_1.default.writeFileSync(this.thresholdsFile, JSON.stringify(this.adaptiveThresholds, null, 2));
            fs_1.default.writeFileSync(this.patternsFile, JSON.stringify(this.projectPatterns, null, 2));
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка сохранения данных:', error.message);
        }
    }
    /**
     * Добавляет результаты анализа в историю
     */
    addAnalysisResult(projectPath, basicResults, advancedResults = null) {
        try {
            const projectName = path_1.default.basename(projectPath);
            const timestamp = new Date().toISOString();
            // Создаем запись о проекте
            const projectRecord = {
                name: projectName,
                path: projectPath,
                timestamp,
                basic: this.extractBasicMetrics(basicResults),
                advanced: advancedResults ? this.extractAdvancedMetrics(advancedResults) : null,
                patterns: this.detectProjectPatterns(basicResults, advancedResults),
            };
            // Добавляем в историю
            this.metricsHistory.projects.push(projectRecord);
            this.metricsHistory.lastUpdated = timestamp;
            // Обновляем агрегированные метрики
            this.updateAggregatedMetrics(projectRecord);
            // Обновляем паттерны проектов
            this.updateProjectPatterns(projectRecord);
            // Адаптируем пороги если накопилось достаточно данных
            if (this.metricsHistory.projects.length >= 5) {
                this.adaptThresholds();
            }
            console.log(`[LearningSystem] Добавлен анализ проекта: ${projectName}`);
            this.saveData();
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка добавления результатов:', error.message);
        }
    }
    /**
     * Извлекает базовые метрики из результатов
     */
    extractBasicMetrics(results) {
        return {
            totalFiles: results.totalFiles || 0,
            totalLines: results.totalLines || 0,
            avgFileSize: results.avgFileSize || 0,
            maxFileSize: results.maxFileSize || 0,
            directoryDepth: results.directoryDepth || 0,
            configurationFiles: results.configurationFiles || 0,
            testFiles: results.testFiles || 0,
            documentationFiles: results.documentationFiles || 0,
            binaryFiles: results.binaryFiles || 0,
            emptyFiles: results.emptyFiles || 0,
        };
    }
    /**
     * Извлекает расширенные метрики из результатов
     */
    extractAdvancedMetrics(results) {
        return {
            avgComplexity: this.calculateAverageComplexity(results.complexityData),
            maxComplexity: this.getMaxComplexity(results.complexityData),
            avgMaintainability: results.avgMaintainabilityIndex || 0,
            duplicationPercentage: results.duplicationPercentage || 0,
            cohesion: results.cohesion || 0,
            coupling: results.coupling || 0,
            hotspotCount: results.hotspots ? results.hotspots.length : 0,
            criticalHotspots: results.hotspots
                ? results.hotspots.filter(h => h.priority === 'CRITICAL').length
                : 0,
        };
    }
    /**
     * Вычисляет среднюю сложность
     */
    calculateAverageComplexity(complexityData) {
        if (!complexityData || complexityData.length === 0)
            return 0;
        const total = complexityData.reduce((sum, file) => sum + (file.cyclomaticComplexity || 0), 0);
        return total / complexityData.length;
    }
    /**
     * Получает максимальную сложность
     */
    getMaxComplexity(complexityData) {
        if (!complexityData || complexityData.length === 0)
            return 0;
        return Math.max(...complexityData.map(file => file.cyclomaticComplexity || 0));
    }
    /**
     * Обнаруживает паттерны проекта
     */
    detectProjectPatterns(basicResults, advancedResults) {
        const patterns = [];
        // Анализ типа проекта по структуре файлов
        if (basicResults.packageJson) {
            const packageData = basicResults.packageJson;
            // React проект
            if (packageData.dependencies &&
                (packageData.dependencies.react || packageData.dependencies['@types/react'])) {
                patterns.push('react');
            }
            // Next.js проект
            if (packageData.dependencies && packageData.dependencies.next) {
                patterns.push('nextjs');
            }
            // Vue проект
            if (packageData.dependencies && packageData.dependencies.vue) {
                patterns.push('vue');
            }
            // Angular проект
            if (packageData.dependencies && packageData.dependencies['@angular/core']) {
                patterns.push('angular');
            }
            // Svelte проект
            if (packageData.dependencies && packageData.dependencies.svelte) {
                patterns.push('svelte');
            }
            // Node.js backend
            if (packageData.dependencies &&
                (packageData.dependencies.express || packageData.dependencies.fastify)) {
                patterns.push('nodejs-backend');
            }
            // TypeScript проект
            if (packageData.dependencies &&
                (packageData.dependencies.typescript || packageData.devDependencies?.typescript)) {
                patterns.push('typescript');
            }
        }
        // Анализ по структуре директорий
        const directories = basicResults.directoryStructure || {};
        if (directories.src)
            patterns.push('src-structure');
        if (directories.components)
            patterns.push('component-based');
        if (directories.pages)
            patterns.push('page-based');
        if (directories.api)
            patterns.push('api-structure');
        if (directories.tests || directories.test || directories.__tests__)
            patterns.push('well-tested');
        if (directories.docs)
            patterns.push('documented');
        // Анализ размера проекта
        if (basicResults.totalFiles) {
            if (basicResults.totalFiles < 20)
                patterns.push('small-project');
            else if (basicResults.totalFiles < 100)
                patterns.push('medium-project');
            else
                patterns.push('large-project');
        }
        // Анализ качества кода (если есть расширенные результаты)
        if (advancedResults) {
            if (advancedResults.avgMaintainabilityIndex > 80)
                patterns.push('high-quality');
            else if (advancedResults.avgMaintainabilityIndex < 50)
                patterns.push('needs-refactoring');
            if (advancedResults.duplicationPercentage < 3)
                patterns.push('low-duplication');
            else if (advancedResults.duplicationPercentage > 10)
                patterns.push('high-duplication');
            if (advancedResults.hotspotCount === 0)
                patterns.push('no-hotspots');
            else if (advancedResults.hotspotCount > 10)
                patterns.push('many-hotspots');
        }
        return patterns;
    }
    /**
     * Обновляет агрегированные метрики
     */
    updateAggregatedMetrics(projectRecord) {
        const metrics = this.metricsHistory.aggregatedMetrics;
        // Инициализируем если пусто
        if (!metrics.count) {
            metrics.count = 0;
            metrics.basic = {};
            metrics.advanced = {};
        }
        metrics.count++;
        // Обновляем базовые метрики
        this.updateMetricStats(metrics.basic, projectRecord.basic);
        // Обновляем расширенные метрики если есть
        if (projectRecord.advanced) {
            this.updateMetricStats(metrics.advanced, projectRecord.advanced);
        }
    }
    /**
     * Обновляет статистики метрик
     */
    updateMetricStats(targetStats, newValues) {
        for (const [key, value] of Object.entries(newValues)) {
            if (typeof value === 'number') {
                if (!targetStats[key]) {
                    targetStats[key] = { sum: 0, count: 0, avg: 0, min: value, max: value };
                }
                targetStats[key].sum += value;
                targetStats[key].count++;
                targetStats[key].avg = targetStats[key].sum / targetStats[key].count;
                targetStats[key].min = Math.min(targetStats[key].min, value);
                targetStats[key].max = Math.max(targetStats[key].max, value);
            }
        }
    }
    /**
     * Обновляет паттерны проектов
     */
    updateProjectPatterns(projectRecord) {
        const patterns = projectRecord.patterns;
        for (const pattern of patterns) {
            // Добавляем паттерн если его еще нет
            if (!this.projectPatterns.patterns.includes(pattern)) {
                this.projectPatterns.patterns.push(pattern);
            }
            // Обновляем классификации
            if (!this.projectPatterns.classifications[pattern]) {
                this.projectPatterns.classifications[pattern] = {
                    count: 0,
                    projects: [],
                    avgMetrics: {},
                };
            }
            this.projectPatterns.classifications[pattern].count++;
            this.projectPatterns.classifications[pattern].projects.push({
                name: projectRecord.name,
                timestamp: projectRecord.timestamp,
            });
        }
        this.projectPatterns.lastUpdated = new Date().toISOString();
    }
    /**
     * Адаптирует пороговые значения на основе накопленных данных
     */
    adaptThresholds() {
        try {
            const aggregated = this.metricsHistory.aggregatedMetrics;
            if (!aggregated.basic || aggregated.count < 5)
                return;
            const adjustments = {};
            const currentThresholds = this.adaptiveThresholds;
            // Адаптируем базовые пороги
            if (aggregated.basic.maxFileSize) {
                const newMaxFileSize = Math.round(aggregated.basic.maxFileSize.avg * 1.5);
                if (Math.abs(newMaxFileSize - currentThresholds.basic.maxFileSize) > 50) {
                    adjustments.maxFileSize = {
                        old: currentThresholds.basic.maxFileSize,
                        new: newMaxFileSize,
                        reason: `Based on average max file size: ${aggregated.basic.maxFileSize.avg.toFixed(1)}`,
                    };
                    currentThresholds.basic.maxFileSize = newMaxFileSize;
                }
            }
            // Адаптируем расширенные пороги если есть данные
            if (aggregated.advanced && aggregated.advanced.avgComplexity) {
                const newMaxComplexity = Math.max(10, Math.round(aggregated.advanced.avgComplexity.avg * 2));
                if (Math.abs(newMaxComplexity - currentThresholds.basic.maxComplexity) > 3) {
                    adjustments.maxComplexity = {
                        old: currentThresholds.basic.maxComplexity,
                        new: newMaxComplexity,
                        reason: `Based on average complexity: ${aggregated.advanced.avgComplexity.avg.toFixed(1)}`,
                    };
                    currentThresholds.basic.maxComplexity = newMaxComplexity;
                }
            }
            // Записываем историю корректировок
            if (Object.keys(adjustments).length > 0) {
                currentThresholds.confidence.adjustmentHistory.push({
                    timestamp: new Date().toISOString(),
                    sampleSize: aggregated.count,
                    adjustments,
                });
                currentThresholds.confidence.lastAdjustment = new Date().toISOString();
                currentThresholds.confidence.sampleSize = aggregated.count;
                console.log('[LearningSystem] Адаптированы пороговые значения:', adjustments);
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка адаптации порогов:', error.message);
        }
    }
    /**
     * Получает рекомендации на основе анализа паттернов
     */
    getRecommendations(currentPatterns, basicResults, advancedResults = null) {
        const recommendations = [];
        try {
            // Рекомендации на основе типа проекта
            if (currentPatterns.includes('react') || currentPatterns.includes('nextjs')) {
                if (!currentPatterns.includes('typescript')) {
                    recommendations.push({
                        type: 'enhancement',
                        priority: 'medium',
                        title: 'Рассмотрите использование TypeScript',
                        description: 'TypeScript улучшает надежность React/Next.js проектов',
                    });
                }
                if (!currentPatterns.includes('well-tested')) {
                    recommendations.push({
                        type: 'quality',
                        priority: 'high',
                        title: 'Добавьте тесты',
                        description: 'React компоненты нуждаются в тестировании',
                    });
                }
            }
            // Рекомендации по структуре
            if (basicResults.totalFiles > 50 && !currentPatterns.includes('src-structure')) {
                recommendations.push({
                    type: 'structure',
                    priority: 'medium',
                    title: 'Организуйте код в src/ директории',
                    description: 'Для больших проектов рекомендуется четкая структура',
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
                if (advancedResults.hotspotCount > 5) {
                    recommendations.push({
                        type: 'refactoring',
                        priority: 'high',
                        title: 'Отрефакторьте проблемные файлы',
                        description: `Найдено ${advancedResults.hotspotCount} проблемных файлов`,
                    });
                }
            }
            // Рекомендации на основе схожих проектов
            const similarProjects = this.findSimilarProjects(currentPatterns);
            if (similarProjects.length > 0) {
                const commonPatterns = this.getCommonPatterns(similarProjects, currentPatterns);
                for (const pattern of commonPatterns) {
                    recommendations.push({
                        type: 'best-practice',
                        priority: 'low',
                        title: `Рассмотрите паттерн: ${pattern}`,
                        description: `Используется в ${similarProjects.length} схожих проектах`,
                    });
                }
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка генерации рекомендаций:', error.message);
        }
        return recommendations;
    }
    /**
     * Находит схожие проекты
     */
    findSimilarProjects(currentPatterns) {
        const projects = this.metricsHistory.projects;
        const similarProjects = [];
        for (const project of projects) {
            const commonPatterns = project.patterns.filter(p => currentPatterns.includes(p));
            if (commonPatterns.length >= 2) {
                similarProjects.push({
                    ...project,
                    similarity: commonPatterns.length / Math.max(currentPatterns.length, project.patterns.length),
                });
            }
        }
        return similarProjects.sort((a, b) => b.similarity - a.similarity);
    }
    /**
     * Получает общие паттерны для схожих проектов
     */
    getCommonPatterns(similarProjects, currentPatterns) {
        const patternCounts = {};
        for (const project of similarProjects) {
            for (const pattern of project.patterns) {
                if (!currentPatterns.includes(pattern)) {
                    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
                }
            }
        }
        // Возвращаем паттерны, которые встречаются более чем в половине схожих проектов
        const threshold = Math.ceil(similarProjects.length / 2);
        return Object.keys(patternCounts).filter(pattern => patternCounts[pattern] >= threshold);
    }
    /**
     * Получает текущие адаптивные пороги
     */
    getCurrentThresholds() {
        return this.adaptiveThresholds;
    }
    /**
     * Получает статистику обучения
     */
    getLearningStats() {
        return {
            totalProjects: this.metricsHistory.projects.length,
            patterns: this.projectPatterns.patterns.length,
            lastUpdate: this.metricsHistory.lastUpdated,
            thresholdAdjustments: this.adaptiveThresholds.confidence.adjustmentHistory.length,
            dataQuality: this.assessDataQuality(),
        };
    }
    /**
     * Оценивает качество данных для обучения
     */
    assessDataQuality() {
        const projectCount = this.metricsHistory.projects.length;
        if (projectCount === 0)
            return 'no-data';
        if (projectCount < 5)
            return 'insufficient';
        if (projectCount < 20)
            return 'moderate';
        if (projectCount < 50)
            return 'good';
        return 'excellent';
    }
    /**
     * Очищает старые данные
     */
    cleanOldData(maxAgeInDays = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
            const originalCount = this.metricsHistory.projects.length;
            this.metricsHistory.projects = this.metricsHistory.projects.filter(project => new Date(project.timestamp) > cutoffDate);
            const removedCount = originalCount - this.metricsHistory.projects.length;
            if (removedCount > 0) {
                console.log(`[LearningSystem] Удалено ${removedCount} старых записей`);
                // Пересчитываем агрегированные метрики
                this.recalculateAggregatedMetrics();
                this.saveData();
            }
        }
        catch (error) {
            console.error('[LearningSystem] Ошибка очистки старых данных:', error.message);
        }
    }
    /**
     * Пересчитывает агрегированные метрики
     */
    recalculateAggregatedMetrics() {
        this.metricsHistory.aggregatedMetrics = {};
        for (const project of this.metricsHistory.projects) {
            this.updateAggregatedMetrics(project);
        }
    }
}
exports.default = LearningSystem;
//# sourceMappingURL=learning.js.map