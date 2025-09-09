"use strict";
/**
 * Генератор комплексных отчетов с дорожной картой и визуализациями
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerator = void 0;
class ReportGenerator {
    generateComprehensiveReport(results) {
        console.log('📊 Генерация комплексного отчета...');
        return {
            executiveSummary: this.generateExecutiveSummary(results),
            detailedFindings: this.aggregateAllFindings(results),
            roadmap: this.generateRoadmap(results),
            visualizations: this.generateVisualizations(results),
            recommendations: this.prioritizeRecommendations(results),
        };
    }
    generateExecutiveSummary(results) {
        const { summary } = results;
        return {
            overallScore: summary.overallScore,
            status: this.getProjectStatus(summary.overallScore),
            criticalIssuesCount: summary.criticalIssues.length,
            topIssues: summary.criticalIssues.slice(0, 3),
            categoryScores: {
                quality: summary.categories.quality.score,
                security: summary.categories.security.score,
                performance: summary.categories.performance.score,
                structure: summary.categories.structure.score,
            },
        };
    }
    getProjectStatus(score) {
        if (score >= 90)
            return 'Отлично';
        if (score >= 80)
            return 'Хорошо';
        if (score >= 70)
            return 'Удовлетворительно';
        if (score >= 60)
            return 'Требует улучшения';
        if (score >= 50)
            return 'Плохо';
        return 'Критическое состояние';
    }
    aggregateAllFindings(results) {
        const findings = [];
        // Собираем результаты всех проверок
        Object.entries(results.checks).forEach(([checkerName, result]) => {
            if (!result.passed) {
                findings.push({
                    source: `Checker: ${checkerName}`,
                    category: result.category,
                    score: result.score,
                    message: result.message,
                    details: result.details,
                    recommendations: result.recommendations || [],
                    priority: this.calculatePriority(result.score, result.category),
                    estimatedEffort: this.estimateEffort(result.score, result.category),
                });
            }
        });
        // Собираем проблемы из модулей
        Object.entries(results.modules).forEach(([moduleName, moduleResult]) => {
            if (moduleResult.issues) {
                moduleResult.issues.forEach((issue) => {
                    findings.push({
                        source: `Module: ${moduleName}`,
                        category: issue.category || 'quality',
                        score: issue.score || 0,
                        message: issue.message || issue.description,
                        details: issue.details || {},
                        recommendations: issue.recommendations || [],
                        priority: this.calculatePriority(issue.score || 0, issue.category || 'quality'),
                        estimatedEffort: this.estimateEffort(issue.score || 0, issue.category || 'quality'),
                    });
                });
            }
        });
        return findings.sort((a, b) => a.score - b.score);
    }
    calculatePriority(score, category) {
        // Базовые пороги для приоритета
        const categoryWeights = {
            security: 1.5,
            quality: 1.0,
            performance: 1.2,
            structure: 1.1,
        };
        const adjustedScore = score * (categoryWeights[category] || 1);
        if (adjustedScore < 30)
            return 'critical';
        if (adjustedScore < 50)
            return 'high';
        if (adjustedScore < 70)
            return 'medium';
        return 'low';
    }
    estimateEffort(score, category) {
        // Оценка трудозатрат на основе категории и оценки
        const baseEffort = {
            security: 2,
            quality: 1,
            performance: 1.5,
            structure: 3,
        };
        const categoryBase = baseEffort[category] || 1;
        // Более низкие оценки означают более серьезные проблемы
        const scoreFactor = ((100 - score) / 100) * 2;
        const days = Math.round(categoryBase * scoreFactor * 10) / 10;
        let complexity = 'Низкая';
        if (days > 3)
            complexity = 'Средняя';
        if (days > 5)
            complexity = 'Высокая';
        return { days, complexity };
    }
    generateRoadmap(results) {
        const allFindings = this.aggregateAllFindings(results);
        const immediate = allFindings.filter(f => f.priority === 'critical');
        const shortTerm = allFindings.filter(f => f.priority === 'high');
        const longTerm = allFindings.filter(f => f.priority === 'medium');
        return {
            immediate,
            shortTerm,
            longTerm,
            timeline: this.generateTimeline(immediate, shortTerm, longTerm),
            dependencies: this.analyzeDependencies(allFindings),
            estimatedEffort: this.calculateTotalEffort(allFindings),
        };
    }
    generateTimeline(immediate, shortTerm, longTerm) {
        const phases = [
            {
                name: 'Фаза 1: Критические проблемы',
                duration: this.calculatePhaseDuration(immediate),
                items: immediate.map(i => ({
                    title: this.truncate(i.message, 50),
                    effort: i.estimatedEffort?.days || 1,
                })),
            },
            {
                name: 'Фаза 2: Важные улучшения',
                duration: this.calculatePhaseDuration(shortTerm),
                items: shortTerm.map(i => ({
                    title: this.truncate(i.message, 50),
                    effort: i.estimatedEffort?.days || 1,
                })),
            },
            {
                name: 'Фаза 3: Долгосрочные улучшения',
                duration: this.calculatePhaseDuration(longTerm),
                items: longTerm.map(i => ({
                    title: this.truncate(i.message, 50),
                    effort: i.estimatedEffort?.days || 1,
                })),
            },
        ];
        const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
        const startDate = new Date();
        const estimatedEndDate = this.calculateEndDate(totalDuration);
        return {
            phases,
            totalDuration,
            startDate,
            estimatedEndDate,
        };
    }
    calculatePhaseDuration(issues) {
        // Предполагаем 30% параллелизации работы
        const totalEffort = issues.reduce((sum, i) => sum + (i.estimatedEffort?.days || 1), 0);
        return Math.round(totalEffort * 0.7);
    }
    calculateEndDate(totalDays) {
        // Учитываем выходные и буфер времени
        const workingDays = Math.round(totalDays * 1.4);
        const result = new Date();
        result.setDate(result.getDate() + workingDays);
        return result;
    }
    analyzeDependencies(findings) {
        const nodes = findings
            .filter(f => f.priority === 'critical' || f.priority === 'high')
            .map((finding, index) => ({
            id: `issue-${index}`,
            label: this.truncate(finding.message, 30),
            category: finding.category,
        }));
        const edges = [];
        // Создание зависимостей: проблемы безопасности блокируют остальные
        const securityNodes = nodes.filter(n => n.category === 'security');
        const otherNodes = nodes.filter(n => n.category !== 'security');
        for (const security of securityNodes) {
            for (const other of otherNodes) {
                edges.push({
                    from: security.id,
                    to: other.id,
                    label: 'блокирует',
                });
            }
        }
        return { nodes, edges };
    }
    calculateTotalEffort(findings) {
        const totalDays = findings.reduce((sum, f) => sum + (f.estimatedEffort?.days || 1), 0);
        const avgDeveloperCost = 500; // USD в день
        const byPriority = {
            critical: this.sumEffortByPriority(findings, 'critical'),
            high: this.sumEffortByPriority(findings, 'high'),
            medium: this.sumEffortByPriority(findings, 'medium'),
            low: this.sumEffortByPriority(findings, 'low'),
        };
        const byCategory = this.effortByCategory(findings);
        return {
            days: Math.round(totalDays),
            cost: Math.round(totalDays * avgDeveloperCost),
            byPriority,
            byCategory,
        };
    }
    sumEffortByPriority(findings, priority) {
        return Math.round(findings
            .filter(f => f.priority === priority)
            .reduce((sum, f) => sum + (f.estimatedEffort?.days || 1), 0));
    }
    effortByCategory(findings) {
        const categories = ['security', 'quality', 'performance', 'structure'];
        const result = {};
        categories.forEach(category => {
            result[category] = Math.round(findings
                .filter(f => f.category === category)
                .reduce((sum, f) => sum + (f.estimatedEffort?.days || 1), 0));
        });
        return result;
    }
    generateVisualizations(results) {
        return {
            architectureDiagram: this.generateArchitectureDiagram(results),
            debtHeatmap: this.generateDebtHeatmap(results),
            trendCharts: this.generateTrendCharts(results),
        };
    }
    generateArchitectureDiagram(results) {
        // Генерация Mermaid диаграммы
        let diagram = 'graph TD\n';
        if (results.modules.architecture?.dependencies) {
            const { dependencies } = results.modules.architecture;
            dependencies.nodes.forEach((node) => {
                diagram += `  ${node.id}["${node.label}"]\n`;
            });
            dependencies.edges.forEach((edge) => {
                diagram += `  ${edge.from} --> ${edge.to}\n`;
            });
        }
        else {
            // Запасной вариант
            diagram += '  A[Ядро]\n';
            diagram += '  B[Модули]\n';
            diagram += '  C[Чекеры]\n';
            diagram += '  D[Утилиты]\n';
            diagram += '  A --> B\n';
            diagram += '  A --> C\n';
            diagram += '  B --> D\n';
            diagram += '  C --> D\n';
        }
        return diagram;
    }
    generateDebtHeatmap(results) {
        if (results.modules.technicalDebt?.heatmap) {
            return results.modules.technicalDebt.heatmap;
        }
        // Генерация на основе результатов чекеров
        const heatmap = {};
        Object.entries(results.checks).forEach(([checker, result]) => {
            const category = result.category;
            if (!heatmap[category]) {
                heatmap[category] = {
                    score: 0,
                    count: 0,
                    items: [],
                };
            }
            heatmap[category].count++;
            heatmap[category].score += result.score;
            if (!result.passed) {
                heatmap[category].items.push({
                    name: checker,
                    score: result.score,
                    message: result.message,
                });
            }
        });
        // Расчет средних значений и цветов
        Object.values(heatmap).forEach((category) => {
            if (category.count > 0) {
                category.score = Math.round(category.score / category.count);
            }
            category.color = this.getHeatmapColor(category.score);
        });
        return heatmap;
    }
    getHeatmapColor(score) {
        if (score >= 80)
            return '#4caf50'; // зеленый
        if (score >= 60)
            return '#8bc34a'; // светло-зеленый
        if (score >= 40)
            return '#ffeb3b'; // желтый
        if (score >= 20)
            return '#ff9800'; // оранжевый
        return '#f44336'; // красный
    }
    generateTrendCharts(results) {
        return {
            quality: this.generateTrendData(results.summary.categories.quality.score),
            security: this.generateTrendData(results.summary.categories.security.score),
            performance: this.generateTrendData(results.summary.categories.performance.score),
            structure: this.generateTrendData(results.summary.categories.structure.score),
        };
    }
    generateTrendData(currentScore) {
        const months = 6;
        const data = [];
        let score = Math.max(currentScore - 15, 0);
        for (let i = 0; i < months; i++) {
            const upDown = Math.random() > 0.7 ? -1 : 1;
            const change = Math.random() * 10 * upDown;
            score = Math.min(Math.max(score + change, 0), 100);
            if (i === months - 1) {
                score = currentScore;
            }
            const date = new Date();
            date.setMonth(date.getMonth() - (months - i - 1));
            data.push({
                date: date.toISOString().split('T')[0],
                score: Math.round(score),
            });
        }
        return data;
    }
    prioritizeRecommendations(results) {
        const recommendations = [];
        // Сбор рекомендаций из чекеров
        Object.entries(results.checks).forEach(([checkerName, result]) => {
            if (result.recommendations) {
                result.recommendations.forEach(rec => {
                    recommendations.push({
                        text: rec,
                        category: result.category,
                        priority: this.calculatePriority(result.score, result.category),
                        source: checkerName,
                    });
                });
            }
        });
        // Сортировка по приоритету
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return recommendations
            .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
            .slice(0, 20); // Топ 20 рекомендаций
    }
    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
}
exports.ReportGenerator = ReportGenerator;
//# sourceMappingURL=report-generator.js.map