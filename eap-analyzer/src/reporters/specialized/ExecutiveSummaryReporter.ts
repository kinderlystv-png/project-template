/**
 * Executive Summary Reporter
 * Специализированный репортер для краткого резюме руководителей
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
 * Конфигурация для Executive Summary
 */
export interface ExecutiveSummaryConfig {
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
  includeRoadmap?: boolean;
  includeROI?: boolean;
  maxRecommendations?: number;
  focusAreas?: string[];
  executiveLevel?: 'C-level' | 'VP' | 'Director' | 'Manager';
}

/**
 * Репортер для создания краткого резюме для руководителей
 */
export class ExecutiveSummaryReporter
  extends BaseReporter
  implements ISpecializedReporter<ExecutiveSummaryConfig>
{
  private executiveConfig: ExecutiveSummaryConfig = {
    includeMetrics: true,
    includeRecommendations: true,
    includeRoadmap: false,
    includeROI: true,
    maxRecommendations: 5,
    executiveLevel: 'Director',
  };

  constructor(config: ReporterConfig = {}) {
    super({
      outputDir: 'reports/executive',
      fileName: 'executive-summary',
      ...config,
    });
  }

  configure(options: ExecutiveSummaryConfig): void {
    this.executiveConfig = { ...this.executiveConfig, ...options };
  }

  getFormat(): ReportFormat {
    return ReportFormat.MARKDOWN;
  }

  getName(): string {
    return 'Executive Summary Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Generating Executive Summary...');

    this.validateReportData(data);

    const content = this.buildExecutiveSummary(project, data);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        reportType: 'executive-summary',
        executiveLevel: this.executiveConfig.executiveLevel,
        ...data.metadata,
      },
    };

    this.log('Executive Summary generated successfully');
    return result;
  }

  /**
   * Создает краткое резюме для руководителей
   */
  private buildExecutiveSummary(project: Project, data: ReportData): string {
    const summary = this.createSummary(data);
    const businessImpact = this.calculateBusinessImpact(data);

    let content = this.buildHeader(data, summary);

    content += '\n\n' + this.buildKeyFindings(summary, businessImpact);

    if (this.executiveConfig.includeMetrics) {
      content += '\n\n' + this.buildKeyMetrics(summary, data);
    }

    if (this.executiveConfig.includeROI) {
      content += '\n\n' + this.buildROIAnalysis(businessImpact);
    }

    if (this.executiveConfig.includeRecommendations) {
      content += '\n\n' + this.buildStrategicRecommendations(data);
    }

    if (this.executiveConfig.includeRoadmap) {
      content += '\n\n' + this.buildRoadmap(data);
    }

    content += '\n\n' + this.buildNextSteps(data);
    content += '\n\n' + this.buildFooter();

    return content;
  }

  /**
   * Создает заголовок отчета
   */
  private buildHeader(data: ReportData, summary: any): string {
    const status = this.getProjectStatus(summary.score);
    const riskLevel = this.getRiskLevel(summary.score);

    return `# Executive Summary: ${data.projectName}

**Report Date:** ${data.analysisDate.toLocaleDateString()}
**Project Status:** ${status}
**Risk Level:** ${riskLevel}
**Overall Quality Score:** ${summary.score}/100 (Grade: ${summary.grade})

---`;
  }

  /**
   * Создает секцию ключевых результатов
   */
  private buildKeyFindings(summary: any, businessImpact: any): string {
    const findings = [];

    if (summary.score >= 80) {
      findings.push('✅ **Strong Foundation**: Project demonstrates high quality standards');
    } else if (summary.score >= 60) {
      findings.push('⚠️ **Moderate Risk**: Project requires attention in several areas');
    } else {
      findings.push('🚨 **High Risk**: Project needs immediate intervention');
    }

    if (summary.failedChecks > 10) {
      findings.push(`❌ **Quality Concerns**: ${summary.failedChecks} critical issues identified`);
    }

    if (businessImpact.estimatedCost > 100) {
      findings.push(
        `💰 **Financial Impact**: Estimated ${businessImpact.estimatedCost} hours of technical debt`
      );
    }

    if (businessImpact.securityRisk === 'high') {
      findings.push('🔒 **Security Alert**: High-priority security vulnerabilities detected');
    }

    return `## 🎯 Key Findings

${findings.map(finding => `- ${finding}`).join('\n')}`;
  }

  /**
   * Создает секцию ключевых метрик
   */
  private buildKeyMetrics(summary: any, data: ReportData): string {
    const successRate = this.calculateSuccessRate(summary);
    const timeToFix = this.estimateTimeToFix(data);

    return `## 📊 Key Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Quality Score | ${summary.score}/100 | ≥80 | ${summary.score >= 80 ? '✅' : '❌'} |
| Success Rate | ${successRate}% | ≥90% | ${successRate >= 90 ? '✅' : '❌'} |
| Critical Issues | ${summary.failedChecks} | 0 | ${summary.failedChecks === 0 ? '✅' : '❌'} |
| Est. Fix Time | ${timeToFix}h | <40h | ${timeToFix < 40 ? '✅' : '❌'} |`;
  }

  /**
   * Создает анализ ROI
   */
  private buildROIAnalysis(businessImpact: any): string {
    const currentCost = businessImpact.estimatedCost;
    const fixCost = Math.round(currentCost * 0.6); // Примерно 60% от долга на исправление
    const savings = Math.round(currentCost * 0.8); // Экономия 80% от текущего долга
    const roi = Math.round(((savings - fixCost) / fixCost) * 100);

    return `## 💼 Business Impact & ROI

### Current State
- **Technical Debt:** ${currentCost} development hours
- **Monthly Impact:** ${Math.round(currentCost * 0.1)} hours maintenance overhead
- **Risk Exposure:** ${businessImpact.riskLevel}

### Investment Required
- **Estimated Fix Cost:** ${fixCost} hours
- **Timeline:** ${Math.ceil(fixCost / 40)} weeks (1 developer)

### Expected Returns
- **Annual Savings:** ${savings} hours
- **ROI:** ${roi}% within 12 months
- **Risk Reduction:** ${businessImpact.riskReduction}`;
  }

  /**
   * Создает стратегические рекомендации
   */
  private buildStrategicRecommendations(data: ReportData): string {
    const groups = this.groupItemsByType(data.sections);
    const recommendations = [];

    if (groups.critical.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: `Address ${groups.critical.length} critical security/stability issues`,
        impact: 'High',
        effort: 'Medium',
      });
    }

    if (groups.high.length > 5) {
      recommendations.push({
        priority: 'SHORT-TERM',
        action: 'Implement automated quality gates and CI/CD improvements',
        impact: 'High',
        effort: 'Medium',
      });
    }

    recommendations.push({
      priority: 'MEDIUM-TERM',
      action: 'Establish continuous monitoring and quality metrics',
      impact: 'Medium',
      effort: 'Low',
    });

    if (this.executiveConfig.focusAreas) {
      for (const area of this.executiveConfig.focusAreas) {
        recommendations.push({
          priority: 'ONGOING',
          action: `Strengthen ${area} practices and standards`,
          impact: 'Medium',
          effort: 'Low',
        });
      }
    }

    const maxRecs = this.executiveConfig.maxRecommendations || 5;
    const topRecs = recommendations.slice(0, maxRecs);

    return `## 🎯 Strategic Recommendations

${topRecs
  .map(
    (rec, index) => `
### ${index + 1}. ${rec.action}
- **Priority:** ${rec.priority}
- **Business Impact:** ${rec.impact}
- **Implementation Effort:** ${rec.effort}
`
  )
  .join('')}`;
  }

  /**
   * Создает дорожную карту
   */
  private buildRoadmap(data: ReportData): string {
    return `## 🗺️ Implementation Roadmap

### Phase 1: Immediate Actions (Weeks 1-2)
- Fix critical security vulnerabilities
- Address high-impact stability issues
- Implement emergency monitoring

### Phase 2: Foundation Building (Weeks 3-6)
- Establish automated testing pipeline
- Implement code quality gates
- Set up continuous integration

### Phase 3: Optimization (Weeks 7-12)
- Performance optimization
- Technical debt reduction
- Team training and process improvement

### Phase 4: Maintenance (Ongoing)
- Regular quality assessments
- Continuous improvement
- Proactive monitoring`;
  }

  /**
   * Создает следующие шаги
   */
  private buildNextSteps(data: ReportData): string {
    const summary = this.createSummary(data);
    const steps = [];

    if (summary.score < 60) {
      steps.push('🚨 **Emergency Response**: Convene immediate technical review meeting');
    }

    steps.push('📋 **Action Planning**: Assign ownership for critical issues');
    steps.push('💰 **Budget Approval**: Allocate resources for quality improvements');
    steps.push('📅 **Timeline Agreement**: Establish delivery milestones');
    steps.push('📊 **Progress Tracking**: Schedule weekly status reviews');

    return `## 🚀 Immediate Next Steps

${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Recommended Review Frequency:** ${this.getReviewFrequency(summary.score)}`;
  }

  /**
   * Создает футер
   */
  private buildFooter(): string {
    return `---

**Report Prepared By:** EAP Quality Analysis System
**Contact:** For detailed technical analysis, consult with your development team
**Next Review:** ${this.getNextReviewDate()}

*This executive summary provides a high-level overview. Detailed technical reports are available for deeper analysis.*`;
  }

  // Вспомогательные методы

  private calculateBusinessImpact(data: ReportData) {
    const groups = this.groupItemsByType(data.sections);

    let estimatedCost = 0;
    let securityRisk = 'low';
    let riskLevel = 'Low';

    // Подсчет времени на исправление
    for (const section of data.sections) {
      for (const item of section.items) {
        if (item.effort) {
          estimatedCost += item.effort;
        }
      }
    }

    // Определение уровня риска
    if (groups.critical.length > 0) {
      securityRisk = 'high';
      riskLevel = 'High';
    } else if (groups.high.length > 5) {
      securityRisk = 'medium';
      riskLevel = 'Medium';
    }

    return {
      estimatedCost,
      securityRisk,
      riskLevel,
      riskReduction: riskLevel === 'High' ? '70%' : riskLevel === 'Medium' ? '50%' : '30%',
    };
  }

  private getProjectStatus(score: number): string {
    if (score >= 90) return '🟢 Excellent';
    if (score >= 80) return '🟡 Good';
    if (score >= 70) return '🟠 Fair';
    if (score >= 60) return '🔴 At Risk';
    return '⚫ Critical';
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    return 'High';
  }

  private calculateSuccessRate(summary: any): number {
    const total = summary.passedChecks + summary.failedChecks;
    return total > 0 ? Math.round((summary.passedChecks / total) * 100) : 0;
  }

  private estimateTimeToFix(data: ReportData): number {
    let totalTime = 0;
    for (const section of data.sections) {
      for (const item of section.items) {
        if (item.type === 'issue' && item.effort) {
          totalTime += item.effort;
        }
      }
    }
    return totalTime;
  }

  private getReviewFrequency(score: number): string {
    if (score < 60) return 'Daily until score >60';
    if (score < 80) return 'Weekly';
    return 'Monthly';
  }

  private getNextReviewDate(): string {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 30);
    return nextReview.toLocaleDateString();
  }
}
