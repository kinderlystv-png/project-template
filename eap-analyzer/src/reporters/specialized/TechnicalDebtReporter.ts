/**
 * Technical Debt Reporter
 * Специализированный репортер для анализа технического долга
 */

import { Project } from '../../types/Project';
import { BaseReporter } from '../BaseReporter';
import {
  ReportData,
  ReportResult,
  ReporterConfig,
  ReportFormat,
  ISpecializedReporter,
} from '../interfaces';

/**
 * Конфигурация для Technical Debt анализа
 */
export interface TechnicalDebtConfig {
  includePriorityMatrix?: boolean;
  includeCodeMetrics?: boolean;
  includeRefactoringPlan?: boolean;
  includeTeamImpact?: boolean;
  hourlyRate?: number;
  teamSize?: number;
  sprintLength?: number;
  debtThreshold?: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Элемент технического долга
 */
interface DebtItem {
  category: string;
  description: string;
  effort: number;
  impact: number;
  priority: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  cost: number;
  interestRate: number; // Накопление долга со временем
  location: string;
  recommendation: string;
}

/**
 * Анализ технического долга по категориям
 */
interface DebtAnalysis {
  totalDebt: number;
  totalCost: number;
  categories: Map<
    string,
    {
      items: DebtItem[];
      totalEffort: number;
      averageImpact: number;
      priorityScore: number;
    }
  >;
  priorityMatrix: DebtItem[];
  monthlyInterest: number;
  quickWins: DebtItem[];
  majorRefactoring: DebtItem[];
}

/**
 * Репортер для анализа технического долга
 */
export class TechnicalDebtReporter
  extends BaseReporter
  implements ISpecializedReporter<TechnicalDebtConfig>
{
  private debtConfig: TechnicalDebtConfig = {
    includePriorityMatrix: true,
    includeCodeMetrics: true,
    includeRefactoringPlan: true,
    includeTeamImpact: true,
    hourlyRate: 100, // USD per hour
    teamSize: 5,
    sprintLength: 2, // weeks
    debtThreshold: {
      low: 8, // hours
      medium: 24, // hours
      high: 80, // hours
    },
  };

  constructor(config: ReporterConfig = {}) {
    super({
      outputDir: 'reports/technical-debt',
      fileName: 'technical-debt-analysis',
      ...config,
    });
  }

  configure(options: TechnicalDebtConfig): void {
    this.debtConfig = { ...this.debtConfig, ...options };
  }

  getFormat(): ReportFormat {
    return ReportFormat.MARKDOWN;
  }

  getName(): string {
    return 'Technical Debt Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Analyzing technical debt...');

    this.validateReportData(data);

    const debtAnalysis = this.analyzeDebt(data);
    const content = this.buildDebtReport(project, data, debtAnalysis);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        reportType: 'technical-debt',
        totalDebt: debtAnalysis.totalDebt,
        totalCost: debtAnalysis.totalCost,
        ...data.metadata,
      },
    };

    this.log('Technical debt analysis completed');
    return result;
  }

  /**
   * Анализирует технический долг проекта
   */
  private analyzeDebt(data: ReportData): DebtAnalysis {
    const debtItems: DebtItem[] = [];
    const categories = new Map<string, any>();

    // Собираем элементы долга из всех секций
    for (const section of data.sections) {
      for (const item of section.items) {
        if (item.type === 'issue' && item.effort && item.effort > 0) {
          const debtItem: DebtItem = {
            category: section.title,
            description: item.title,
            effort: item.effort,
            impact: item.impact || this.estimateImpact(item),
            priority: this.calculatePriority(item),
            risk: this.assessRisk(item),
            cost: item.effort * this.debtConfig.hourlyRate!,
            interestRate: this.calculateInterestRate(item),
            location: item.filePath || 'Unknown',
            recommendation: item.recommendations?.[0] || 'Review and refactor',
          };

          debtItems.push(debtItem);
        }
      }
    }

    // Группируем по категориям
    for (const item of debtItems) {
      if (!categories.has(item.category)) {
        categories.set(item.category, {
          items: [],
          totalEffort: 0,
          averageImpact: 0,
          priorityScore: 0,
        });
      }

      const category = categories.get(item.category)!;
      category.items.push(item);
      category.totalEffort += item.effort;
    }

    // Вычисляем средние значения для категорий
    for (const [, category] of categories) {
      if (category.items.length > 0) {
        category.averageImpact =
          category.items.reduce((sum: number, item: DebtItem) => sum + item.impact, 0) /
          category.items.length;
        category.priorityScore =
          category.items.reduce((sum: number, item: DebtItem) => sum + item.priority, 0) /
          category.items.length;
      }
    }

    const totalDebt = debtItems.reduce((sum, item) => sum + item.effort, 0);
    const totalCost = debtItems.reduce((sum, item) => sum + item.cost, 0);
    const monthlyInterest = debtItems.reduce(
      (sum, item) => sum + (item.cost * item.interestRate) / 100,
      0
    );

    return {
      totalDebt,
      totalCost,
      categories,
      priorityMatrix: this.createPriorityMatrix(debtItems),
      monthlyInterest,
      quickWins: this.identifyQuickWins(debtItems),
      majorRefactoring: this.identifyMajorRefactoring(debtItems),
    };
  }

  /**
   * Строит отчет по техническому долгу
   */
  private buildDebtReport(project: Project, data: ReportData, analysis: DebtAnalysis): string {
    let content = this.buildHeader(data, analysis);

    content += '\n\n' + this.buildExecutiveSummary(analysis);
    content += '\n\n' + this.buildDebtBreakdown(analysis);

    if (this.debtConfig.includePriorityMatrix) {
      content += '\n\n' + this.buildPriorityMatrix(analysis);
    }

    content += '\n\n' + this.buildQuickWins(analysis);

    if (this.debtConfig.includeRefactoringPlan) {
      content += '\n\n' + this.buildRefactoringPlan(analysis);
    }

    if (this.debtConfig.includeTeamImpact) {
      content += '\n\n' + this.buildTeamImpactAnalysis(analysis);
    }

    if (this.debtConfig.includeCodeMetrics) {
      content += '\n\n' + this.buildCodeMetrics(data, analysis);
    }

    content += '\n\n' + this.buildActionPlan(analysis);
    content += '\n\n' + this.buildFooter();

    return content;
  }

  /**
   * Создает заголовок отчета
   */
  private buildHeader(data: ReportData, analysis: DebtAnalysis): string {
    const debtLevel = this.getDebtLevel(analysis.totalDebt);
    const urgency = this.getUrgencyLevel(analysis);

    return `# Technical Debt Analysis: ${data.projectName}

**Analysis Date:** ${data.analysisDate.toLocaleDateString()}
**Total Technical Debt:** ${analysis.totalDebt} hours
**Estimated Cost:** $${analysis.totalCost.toLocaleString()}
**Debt Level:** ${debtLevel}
**Action Urgency:** ${urgency}

---`;
  }

  /**
   * Создает исполнительное резюме
   */
  private buildExecutiveSummary(analysis: DebtAnalysis): string {
    const paybackPeriod = this.calculatePaybackPeriod(analysis);
    const riskAssessment = this.assessOverallRisk(analysis);

    return `## 💼 Executive Summary

### Current State
- **Total Debt:** ${analysis.totalDebt} development hours
- **Financial Impact:** $${analysis.totalCost.toLocaleString()} initial cost
- **Monthly Interest:** $${Math.round(analysis.monthlyInterest).toLocaleString()} (productivity loss)
- **Categories Affected:** ${analysis.categories.size}

### Business Impact
- **Development Velocity:** ${this.calculateVelocityImpact(analysis)}% slower
- **Bug Risk:** ${riskAssessment.bugRisk}
- **Maintenance Overhead:** ${riskAssessment.maintenanceOverhead}% increase
- **Payback Period:** ${paybackPeriod} months

### Key Insights
${this.generateKeyInsights(analysis)}`;
  }

  /**
   * Создает разбивку долга по категориям
   */
  private buildDebtBreakdown(analysis: DebtAnalysis): string {
    let content = `## 📊 Debt Breakdown by Category

| Category | Items | Total Hours | Avg Impact | Priority | Cost |
|----------|-------|-------------|------------|----------|------|`;

    const sortedCategories = Array.from(analysis.categories.entries()).sort(
      ([, a], [, b]) => b.totalEffort - a.totalEffort
    );

    for (const [categoryName, category] of sortedCategories) {
      const avgImpact = Math.round(category.averageImpact * 10) / 10;
      const priorityIcon = this.getPriorityIcon(category.priorityScore);
      const cost = category.totalEffort * this.debtConfig.hourlyRate!;

      content += `\n| ${categoryName} | ${category.items.length} | ${category.totalEffort}h | ${avgImpact}/10 | ${priorityIcon} | $${cost.toLocaleString()} |`;
    }

    return content;
  }

  /**
   * Создает матрицу приоритетов
   */
  private buildPriorityMatrix(analysis: DebtAnalysis): string {
    const matrix = analysis.priorityMatrix.slice(0, 10); // Top 10

    let content = `## 🎯 Priority Matrix (Top 10)

*Items ordered by Priority Score (Impact × Effort ratio)*

| Priority | Item | Category | Effort | Impact | Risk | Cost |
|----------|------|----------|--------|--------|------|------|`;

    for (let i = 0; i < matrix.length; i++) {
      const item = matrix[i];
      const riskIcon = this.getRiskIcon(item.risk);

      content += `\n| ${i + 1} | ${item.description} | ${item.category} | ${item.effort}h | ${item.impact}/10 | ${riskIcon} | $${item.cost.toLocaleString()} |`;
    }

    return content;
  }

  /**
   * Создает секцию быстрых побед
   */
  private buildQuickWins(analysis: DebtAnalysis): string {
    const quickWins = analysis.quickWins.slice(0, 5);

    let content = `## ⚡ Quick Wins (High Impact, Low Effort)

*These items can be resolved quickly but provide significant value:*

`;

    for (let i = 0; i < quickWins.length; i++) {
      const item = quickWins[i];
      content += `
### ${i + 1}. ${item.description}
- **Effort:** ${item.effort} hours
- **Impact:** ${item.impact}/10
- **Cost:** $${item.cost.toLocaleString()}
- **Location:** \`${item.location}\`
- **Recommendation:** ${item.recommendation}
`;
    }

    return content;
  }

  /**
   * Создает план рефакторинга
   */
  private buildRefactoringPlan(analysis: DebtAnalysis): string {
    const sprintCapacity = this.debtConfig.teamSize! * this.debtConfig.sprintLength! * 8; // hours per sprint
    const sprintsNeeded = Math.ceil(analysis.totalDebt / sprintCapacity);

    return `## 🔧 Refactoring Implementation Plan

### Resource Planning
- **Team Capacity:** ${sprintCapacity} hours per sprint (${this.debtConfig.teamSize} devs × ${this.debtConfig.sprintLength} weeks)
- **Estimated Duration:** ${sprintsNeeded} sprints
- **Recommended Allocation:** 20-30% of sprint capacity to debt reduction

### Phase 1: Critical Issues (Sprint 1)
${this.buildPhaseItems(analysis.priorityMatrix.slice(0, 3))}

### Phase 2: High-Impact Items (Sprints 2-3)
${this.buildPhaseItems(analysis.quickWins.slice(0, 5))}

### Phase 3: Major Refactoring (Sprints 4+)
${this.buildPhaseItems(analysis.majorRefactoring.slice(0, 3))}`;
  }

  /**
   * Создает анализ влияния на команду
   */
  private buildTeamImpactAnalysis(analysis: DebtAnalysis): string {
    const dailyImpact = analysis.monthlyInterest / 30; // daily productivity loss
    const weeklyMeetings = Math.round(analysis.totalDebt / 100); // estimated extra meetings

    return `## 👥 Team Impact Analysis

### Productivity Impact
- **Daily Productivity Loss:** $${Math.round(dailyImpact)} (${Math.round((dailyImpact / (this.debtConfig.hourlyRate! * this.debtConfig.teamSize!)) * 100)}% of team capacity)
- **Extra Meetings:** ~${weeklyMeetings} hours/week discussing workarounds
- **Context Switching:** Increased due to complex codebase navigation
- **Onboarding Time:** +${Math.round(analysis.totalDebt / 40)}% for new team members

### Developer Experience
- **Frustration Level:** ${this.calculateFrustrationLevel(analysis)}
- **Code Confidence:** ${this.calculateCodeConfidence(analysis)}
- **Feature Velocity:** ${this.calculateVelocityImpact(analysis)}% of optimal

### Recommended Actions
- Allocate dedicated "Tech Debt Fridays"
- Establish debt reduction goals per sprint
- Implement pair programming for complex areas
- Create knowledge transfer sessions`;
  }

  /**
   * Создает метрики кода
   */
  private buildCodeMetrics(data: ReportData, analysis: DebtAnalysis): string {
    return `## 📈 Code Quality Metrics

### Debt Distribution
- **Quick Fixes:** ${analysis.quickWins.length} items (${this.calculateEffortPercentage(analysis.quickWins, analysis.totalDebt)}% of effort)
- **Medium Tasks:** ${this.getMediumTasks(analysis).length} items
- **Major Refactoring:** ${analysis.majorRefactoring.length} items (${this.calculateEffortPercentage(analysis.majorRefactoring, analysis.totalDebt)}% of effort)

### Risk Assessment
- **Critical Risk Items:** ${this.getCriticalItems(analysis).length}
- **Security-Related:** ${this.getSecurityItems(analysis).length}
- **Performance Impact:** ${this.getPerformanceItems(analysis).length}

### Technical Indicators
- **Cyclomatic Complexity:** High in ${Math.round(analysis.categories.size * 0.3)} modules
- **Code Duplication:** Estimated ${Math.round(analysis.totalDebt * 0.2)} hours to resolve
- **Test Coverage Gap:** ${Math.round(analysis.totalDebt * 0.15)} hours to achieve 80%`;
  }

  /**
   * Создает план действий
   */
  private buildActionPlan(analysis: DebtAnalysis): string {
    return `## 🚀 Action Plan

### Immediate Actions (This Sprint)
1. **Fix Critical Issues:** Address ${this.getCriticalItems(analysis).length} critical items
2. **Quick Wins:** Complete ${Math.min(3, analysis.quickWins.length)} high-impact, low-effort items
3. **Establish Baseline:** Implement debt tracking metrics

### Short-term (Next 3 Sprints)
1. **Debt Allocation:** Reserve 25% of sprint capacity for debt reduction
2. **Process Improvement:** Implement code review guidelines
3. **Tool Integration:** Set up automated debt detection

### Long-term (6+ Months)
1. **Cultural Change:** Establish "definition of done" including debt consideration
2. **Continuous Monitoring:** Regular debt assessment cycles
3. **Knowledge Sharing:** Document architectural decisions and patterns

### Success Metrics
- **Target Debt Reduction:** 50% within 6 months
- **Velocity Improvement:** 20% increase after debt reduction
- **Bug Reduction:** 30% fewer production issues`;
  }

  /**
   * Создает футер
   */
  private buildFooter(): string {
    return `---

**Analysis Method:** EAP Technical Debt Analyzer
**Confidence Level:** High (based on static analysis and heuristics)
**Next Analysis:** Recommended in 4 weeks

*For detailed implementation guidance, consult with your technical team leader.*`;
  }

  // Вспомогательные методы для анализа

  private estimateImpact(item: any): number {
    // Эвристика для оценки влияния на основе типа и описания
    if (item.severity === 'critical') return 9;
    if (item.severity === 'high') return 7;
    if (item.severity === 'medium') return 5;
    if (item.severity === 'low') return 3;
    return 5; // default
  }

  private calculatePriority(item: any): number {
    const impact = item.impact || this.estimateImpact(item);
    const effort = item.effort || 1;
    return Math.round((impact / effort) * 100) / 100;
  }

  private assessRisk(item: any): 'low' | 'medium' | 'high' | 'critical' {
    if (item.severity === 'critical') return 'critical';
    if (item.severity === 'high') return 'high';
    if (item.severity === 'medium') return 'medium';
    return 'low';
  }

  private calculateInterestRate(item: any): number {
    // Процент накопления долга в месяц
    switch (item.severity) {
      case 'critical':
        return 15; // 15% в месяц
      case 'high':
        return 10;
      case 'medium':
        return 5;
      default:
        return 2;
    }
  }

  private createPriorityMatrix(items: DebtItem[]): DebtItem[] {
    return items.sort((a, b) => b.priority - a.priority).slice(0, 20); // Top 20 items
  }

  private identifyQuickWins(items: DebtItem[]): DebtItem[] {
    const threshold = this.debtConfig.debtThreshold!.low;
    return items
      .filter(item => item.effort <= threshold && item.impact >= 6)
      .sort((a, b) => b.priority - a.priority);
  }

  private identifyMajorRefactoring(items: DebtItem[]): DebtItem[] {
    const threshold = this.debtConfig.debtThreshold!.high;
    return items.filter(item => item.effort >= threshold).sort((a, b) => b.impact - a.impact);
  }

  private getDebtLevel(totalDebt: number): string {
    if (totalDebt < 40) return '🟢 Low';
    if (totalDebt < 120) return '🟡 Moderate';
    if (totalDebt < 300) return '🟠 High';
    return '🔴 Critical';
  }

  private getUrgencyLevel(analysis: DebtAnalysis): string {
    const criticalItems = this.getCriticalItems(analysis);
    if (criticalItems.length > 5) return '🚨 Immediate';
    if (analysis.totalDebt > 200) return '⚠️ High';
    if (analysis.totalDebt > 80) return '📋 Medium';
    return '✅ Low';
  }

  private getCriticalItems(analysis: DebtAnalysis): DebtItem[] {
    return analysis.priorityMatrix.filter(item => item.risk === 'critical');
  }

  private getSecurityItems(analysis: DebtAnalysis): DebtItem[] {
    return analysis.priorityMatrix.filter(
      item =>
        item.description.toLowerCase().includes('security') ||
        item.category.toLowerCase().includes('security')
    );
  }

  private getPerformanceItems(analysis: DebtAnalysis): DebtItem[] {
    return analysis.priorityMatrix.filter(
      item =>
        item.description.toLowerCase().includes('performance') ||
        item.category.toLowerCase().includes('performance')
    );
  }

  private getMediumTasks(analysis: DebtAnalysis): DebtItem[] {
    const lowThreshold = this.debtConfig.debtThreshold!.low;
    const highThreshold = this.debtConfig.debtThreshold!.high;
    return analysis.priorityMatrix.filter(
      item => item.effort > lowThreshold && item.effort < highThreshold
    );
  }

  private calculateVelocityImpact(analysis: DebtAnalysis): number {
    // Эвристика: каждые 10 часов долга = 1% замедления
    return Math.min(50, Math.round(analysis.totalDebt / 10));
  }

  private calculatePaybackPeriod(analysis: DebtAnalysis): number {
    const monthlyProductivityLoss = analysis.monthlyInterest;
    const fixCost = analysis.totalCost * 0.6; // 60% от стоимости долга на исправление
    return Math.round(fixCost / monthlyProductivityLoss);
  }

  private assessOverallRisk(analysis: DebtAnalysis) {
    const criticalCount = this.getCriticalItems(analysis).length;
    return {
      bugRisk: criticalCount > 5 ? 'High' : criticalCount > 2 ? 'Medium' : 'Low',
      maintenanceOverhead: Math.round(analysis.totalDebt / 20),
    };
  }

  private generateKeyInsights(analysis: DebtAnalysis): string {
    const insights = [];

    if (analysis.quickWins.length > 5) {
      insights.push('• Significant opportunity for quick improvements with minimal effort');
    }

    if (this.getCriticalItems(analysis).length > 0) {
      insights.push('• Critical issues require immediate attention to prevent system instability');
    }

    if (analysis.totalDebt > 200) {
      insights.push('• High debt load is significantly impacting development velocity');
    }

    const securityItems = this.getSecurityItems(analysis);
    if (securityItems.length > 0) {
      insights.push('• Security-related debt items pose business risk');
    }

    return insights.join('\n');
  }

  private calculateFrustrationLevel(analysis: DebtAnalysis): string {
    const criticalCount = this.getCriticalItems(analysis).length;
    if (criticalCount > 10) return 'Very High';
    if (criticalCount > 5) return 'High';
    if (analysis.totalDebt > 100) return 'Medium';
    return 'Low';
  }

  private calculateCodeConfidence(analysis: DebtAnalysis): string {
    const riskItems = analysis.priorityMatrix.filter(
      item => item.risk === 'critical' || item.risk === 'high'
    ).length;

    if (riskItems > 15) return 'Very Low';
    if (riskItems > 8) return 'Low';
    if (riskItems > 3) return 'Medium';
    return 'High';
  }

  private calculateEffortPercentage(items: DebtItem[], totalDebt: number): number {
    const effort = items.reduce((sum, item) => sum + item.effort, 0);
    return Math.round((effort / totalDebt) * 100);
  }

  private buildPhaseItems(items: DebtItem[]): string {
    return items
      .map(item => `- **${item.description}** (${item.effort}h, Impact: ${item.impact}/10)`)
      .join('\n');
  }

  private getPriorityIcon(priority: number): string {
    if (priority > 5) return '🔴 High';
    if (priority > 3) return '🟡 Med';
    return '🟢 Low';
  }

  private getRiskIcon(risk: string): string {
    switch (risk) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      default:
        return '🔷';
    }
  }
}
