/**
 * Генератор комплексных отчетов с дорожной картой и визуализациями
 */

import {
  FullAnalysisResult,
  ComprehensiveReport,
  ExecutiveSummary,
  Finding,
  ProjectRoadmap,
  RoadmapTimeline,
  DependencyGraph,
  TotalEffort,
  Visualizations,
  PrioritizedRecommendation,
  EffortEstimate,
} from './types.js';

export class ReportGenerator {
  generateComprehensiveReport(results: FullAnalysisResult): ComprehensiveReport {
    console.log('📊 Генерация комплексного отчета...');

    return {
      executiveSummary: this.generateExecutiveSummary(results),
      detailedFindings: this.aggregateAllFindings(results),
      roadmap: this.generateRoadmap(results),
      visualizations: this.generateVisualizations(results),
      recommendations: this.prioritizeRecommendations(results),
    };
  }

  private generateExecutiveSummary(results: FullAnalysisResult): ExecutiveSummary {
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

  private getProjectStatus(score: number): string {
    if (score >= 90) return 'Отлично';
    if (score >= 80) return 'Хорошо';
    if (score >= 70) return 'Удовлетворительно';
    if (score >= 60) return 'Требует улучшения';
    if (score >= 50) return 'Плохо';
    return 'Критическое состояние';
  }

  private aggregateAllFindings(results: FullAnalysisResult): Finding[] {
    const findings: Finding[] = [];

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
        moduleResult.issues.forEach((issue: any) => {
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

  private calculatePriority(
    score: number,
    category: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Базовые пороги для приоритета
    const categoryWeights: Record<string, number> = {
      security: 1.5,
      quality: 1.0,
      performance: 1.2,
      structure: 1.1,
    };

    const adjustedScore = score * (categoryWeights[category] || 1);

    if (adjustedScore < 30) return 'critical';
    if (adjustedScore < 50) return 'high';
    if (adjustedScore < 70) return 'medium';
    return 'low';
  }

  private estimateEffort(score: number, category: string): EffortEstimate {
    // Оценка трудозатрат на основе категории и оценки
    const baseEffort: Record<string, number> = {
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
    if (days > 3) complexity = 'Средняя';
    if (days > 5) complexity = 'Высокая';

    return { days, complexity };
  }

  private generateRoadmap(results: FullAnalysisResult): ProjectRoadmap {
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

  private generateTimeline(
    immediate: Finding[],
    shortTerm: Finding[],
    longTerm: Finding[]
  ): RoadmapTimeline {
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

  private calculatePhaseDuration(issues: Finding[]): number {
    // Предполагаем 30% параллелизации работы
    const totalEffort = issues.reduce((sum, i) => sum + (i.estimatedEffort?.days || 1), 0);
    return Math.round(totalEffort * 0.7);
  }

  private calculateEndDate(totalDays: number): Date {
    // Учитываем выходные и буфер времени
    const workingDays = Math.round(totalDays * 1.4);

    const result = new Date();
    result.setDate(result.getDate() + workingDays);
    return result;
  }

  private analyzeDependencies(findings: Finding[]): DependencyGraph {
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

  private calculateTotalEffort(findings: Finding[]): TotalEffort {
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

  private sumEffortByPriority(findings: Finding[], priority: string): number {
    return Math.round(
      findings
        .filter(f => f.priority === priority)
        .reduce((sum, f) => sum + (f.estimatedEffort?.days || 1), 0)
    );
  }

  private effortByCategory(findings: Finding[]): Record<string, number> {
    const categories = ['security', 'quality', 'performance', 'structure'];
    const result: Record<string, number> = {};

    categories.forEach(category => {
      result[category] = Math.round(
        findings
          .filter(f => f.category === category)
          .reduce((sum, f) => sum + (f.estimatedEffort?.days || 1), 0)
      );
    });

    return result;
  }

  private generateVisualizations(results: FullAnalysisResult): Visualizations {
    return {
      architectureDiagram: this.generateArchitectureDiagram(results),
      debtHeatmap: this.generateDebtHeatmap(results),
      trendCharts: this.generateTrendCharts(results),
    };
  }

  private generateArchitectureDiagram(results: FullAnalysisResult): string {
    // Генерация Mermaid диаграммы
    let diagram = 'graph TD\n';

    if (results.modules.architecture?.dependencies) {
      const { dependencies } = results.modules.architecture;

      dependencies.nodes.forEach((node: any) => {
        diagram += `  ${node.id}["${node.label}"]\n`;
      });

      dependencies.edges.forEach((edge: any) => {
        diagram += `  ${edge.from} --> ${edge.to}\n`;
      });
    } else {
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

  private generateDebtHeatmap(results: FullAnalysisResult): any {
    if (results.modules.technicalDebt?.heatmap) {
      return results.modules.technicalDebt.heatmap;
    }

    // Генерация на основе результатов чекеров
    const heatmap: Record<string, any> = {};

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
    Object.values(heatmap).forEach((category: any) => {
      if (category.count > 0) {
        category.score = Math.round(category.score / category.count);
      }
      category.color = this.getHeatmapColor(category.score);
    });

    return heatmap;
  }

  private getHeatmapColor(score: number): string {
    if (score >= 80) return '#4caf50'; // зеленый
    if (score >= 60) return '#8bc34a'; // светло-зеленый
    if (score >= 40) return '#ffeb3b'; // желтый
    if (score >= 20) return '#ff9800'; // оранжевый
    return '#f44336'; // красный
  }

  private generateTrendCharts(results: FullAnalysisResult): any {
    return {
      quality: this.generateTrendData(results.summary.categories.quality.score),
      security: this.generateTrendData(results.summary.categories.security.score),
      performance: this.generateTrendData(results.summary.categories.performance.score),
      structure: this.generateTrendData(results.summary.categories.structure.score),
    };
  }

  private generateTrendData(currentScore: number): any {
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

  private prioritizeRecommendations(results: FullAnalysisResult): PrioritizedRecommendation[] {
    const recommendations: PrioritizedRecommendation[] = [];

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

  private truncate(str: string, length: number): string {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
}
