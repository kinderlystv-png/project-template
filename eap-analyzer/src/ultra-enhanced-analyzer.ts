import { ArchitectureAnalyzer, ArchitectureMetrics } from './modules/architecture-analyzer';
import { TechnicalDebtAnalyzer, TechnicalDebtAssessment } from './modules/technical-debt';
import { RefactoringAnalyzer, RefactoringAssessment } from './modules/refactoring-analyzer';

export interface UltraEnhancedAnalysisResult {
  architecture: ArchitectureMetrics;
  technicalDebt: TechnicalDebtAssessment;
  refactoring: RefactoringAssessment;
  summary: {
    overallScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    priorityActions: string[];
    recommendedStrategy: 'maintain' | 'incremental' | 'major-refactor' | 'rewrite';
    estimatedEffort: {
      totalHours: number;
      timeline: number; // weeks
      teamSize: number;
    };
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  roadmap: {
    immediate: ActionItem[];
    shortTerm: ActionItem[];
    longTerm: ActionItem[];
  };
}

export interface ActionItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: number; // hours
  impact: 'high' | 'medium' | 'low';
  dependencies: string[];
  category: 'architecture' | 'debt' | 'refactoring' | 'quality';
}

export class UltraEnhancedAnalyzer {
  private architectureAnalyzer: ArchitectureAnalyzer;
  private technicalDebtAnalyzer: TechnicalDebtAnalyzer;
  private refactoringAnalyzer: RefactoringAnalyzer;

  constructor() {
    this.architectureAnalyzer = new ArchitectureAnalyzer();
    this.technicalDebtAnalyzer = new TechnicalDebtAnalyzer();
    this.refactoringAnalyzer = new RefactoringAnalyzer();
  }

  async analyze(directoryPath: string): Promise<UltraEnhancedAnalysisResult> {
    console.log('🚀 Starting Ultra Enhanced Analysis...');

    // Run all analyses in parallel for better performance
    const [architecture, technicalDebt, refactoring] = await Promise.all([
      this.architectureAnalyzer.analyze(directoryPath),
      this.technicalDebtAnalyzer.analyze(directoryPath),
      this.refactoringAnalyzer.analyze(directoryPath),
    ]);

    console.log('📊 Generating comprehensive insights...');

    const summary = this.generateSummary(architecture, technicalDebt, refactoring);
    const insights = this.generateInsights(architecture, technicalDebt, refactoring);
    const roadmap = this.generateRoadmap(architecture, technicalDebt, refactoring);

    return {
      architecture,
      technicalDebt,
      refactoring,
      summary,
      insights,
      roadmap,
    };
  }

  private generateSummary(
    architecture: ArchitectureMetrics,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): UltraEnhancedAnalysisResult['summary'] {
    // Calculate overall score (weighted average)
    const archScore = this.calculateArchitectureScore(architecture);
    const debtScore = 100 - Math.min(100, (technicalDebt.totalDebt.totalDays / 50) * 100); // 50 days = 0 score
    const refactorScore = Math.max(0, 100 - refactoring.summary.totalTargets * 2); // 50 targets = 0 score

    const overallScore = Math.round(archScore * 0.4 + debtScore * 0.35 + refactorScore * 0.25);

    // Determine risk level
    const riskLevel = this.assessRiskLevel(architecture, technicalDebt, refactoring);

    // Generate priority actions
    const priorityActions = this.generatePriorityActions(architecture, technicalDebt, refactoring);

    // Recommend strategy
    const recommendedStrategy = this.recommendStrategy(
      overallScore,
      riskLevel,
      technicalDebt,
      refactoring
    );

    // Calculate effort estimates
    const estimatedEffort = this.calculateEstimatedEffort(technicalDebt, refactoring);

    return {
      overallScore,
      riskLevel,
      priorityActions,
      recommendedStrategy,
      estimatedEffort,
    };
  }

  private generateInsights(
    architecture: ArchitectureMetrics,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): UltraEnhancedAnalysisResult['insights'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Architecture insights
    if (architecture.patterns.length > 0) {
      strengths.push(
        `Well-structured architecture with ${architecture.patterns.length} recognized patterns`
      );
    }
    if (architecture.modularity.cohesion > 0.7) {
      strengths.push('High cohesion in module design');
    }
    if (architecture.modularity.coupling < 0.3) {
      strengths.push('Low coupling between modules');
    }
    if (architecture.scalability.score < 0.6) {
      weaknesses.push('Limited scalability potential');
    }

    // Technical debt insights
    if (technicalDebt.totalDebt.totalDays < 10) {
      strengths.push('Low technical debt burden');
    } else if (technicalDebt.totalDebt.totalDays > 30) {
      weaknesses.push('High technical debt requiring immediate attention');
    }

    if (technicalDebt.categories.length > 0) {
      const criticalDebt = technicalDebt.categories.filter(c => c.priority === 'critical');
      if (criticalDebt.length > 0) {
        threats.push(
          `${criticalDebt.length} critical technical debt items threatening system stability`
        );
      }
    }

    // Refactoring insights
    if (refactoring.summary.totalTargets < 10) {
      strengths.push('Well-maintained codebase with minimal refactoring needs');
    } else if (refactoring.summary.totalTargets > 30) {
      weaknesses.push('Extensive refactoring requirements indicating code quality issues');
    }

    const highPriorityRefactoring = refactoring.targets.filter(t => t.priority === 'high');
    if (highPriorityRefactoring.length > 5) {
      threats.push('Multiple high-priority refactoring targets may impact development velocity');
    }

    // Opportunities
    if (architecture.scalability.recommendations.length > 0) {
      opportunities.push('Architecture improvements can enhance system maintainability');
    }
    if (technicalDebt.payoffPlan.quickWins.length > 0) {
      opportunities.push('Technical debt resolution can improve development efficiency');
    }
    if (refactoring.strategies.length > 0) {
      opportunities.push('Systematic refactoring can significantly improve code quality');
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  private generateRoadmap(
    architecture: ArchitectureMetrics,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): UltraEnhancedAnalysisResult['roadmap'] {
    const immediate: ActionItem[] = [];
    const shortTerm: ActionItem[] = [];
    const longTerm: ActionItem[] = [];

    // Immediate actions (next 2 weeks)
    const criticalDebt = technicalDebt.categories.filter(c => c.priority === 'critical');
    criticalDebt.forEach(debt => {
      immediate.push({
        title: `Resolve Critical Technical Debt: ${debt.name}`,
        description: debt.description,
        priority: 'critical',
        effort: debt.amount * 8, // Convert days to hours
        impact: 'high',
        dependencies: [],
        category: 'debt',
      });
    });

    const highPriorityRefactoring = refactoring.targets
      .filter(t => t.priority === 'high')
      .slice(0, 3);
    highPriorityRefactoring.forEach(target => {
      immediate.push({
        title: `High-Priority Refactoring: ${target.type}`,
        description: target.description,
        priority: 'high',
        effort: target.estimatedEffort,
        impact: 'high',
        dependencies: [],
        category: 'refactoring',
      });
    });

    // Short-term actions (next 2 months)
    if (architecture.scalability.recommendations.length > 0) {
      architecture.scalability.recommendations.slice(0, 2).forEach((rec: string, index: number) => {
        shortTerm.push({
          title: `Architecture Improvement ${index + 1}`,
          description: rec,
          priority: 'medium',
          effort: 20,
          impact: 'medium',
          dependencies: immediate.map(i => i.title),
          category: 'architecture',
        });
      });
    }

    const mediumDebt = technicalDebt.categories.filter(c => c.priority === 'medium');
    mediumDebt.forEach(debt => {
      shortTerm.push({
        title: `Address Technical Debt: ${debt.name}`,
        description: debt.description,
        priority: 'medium',
        effort: debt.amount * 8, // Convert days to hours
        impact: 'medium',
        dependencies: [],
        category: 'debt',
      });
    });

    // Long-term actions (6+ months)
    if (refactoring.strategies.length > 0) {
      refactoring.strategies.forEach((strategy, index) => {
        longTerm.push({
          title: `Implement Refactoring Strategy: ${strategy.type}`,
          description: `Execute ${strategy.phases.length}-phase refactoring plan`,
          priority: 'medium',
          effort: strategy.timeline * 40, // Convert weeks to hours
          impact: 'high',
          dependencies: shortTerm.map(s => s.title),
          category: 'refactoring',
        });
      });
    }

    if (architecture.scalability.recommendations.length > 0) {
      longTerm.push({
        title: 'Scalability Enhancement',
        description: 'Implement comprehensive scalability improvements',
        priority: 'low',
        effort: 80,
        impact: 'high',
        dependencies: [],
        category: 'architecture',
      });
    }

    return { immediate, shortTerm, longTerm };
  }

  private calculateArchitectureScore(architecture: ArchitectureMetrics): number {
    const patternScore = Math.min(100, architecture.patterns.length * 20);
    const modularityScore =
      architecture.modularity.cohesion * 50 + (1 - architecture.modularity.coupling) * 50;
    const scalabilityScore = architecture.scalability.score;

    return Math.round(patternScore * 0.3 + modularityScore * 0.4 + scalabilityScore * 0.3);
  }

  private assessRiskLevel(
    architecture: ArchitectureMetrics,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalDebt = technicalDebt.categories.filter(c => c.priority === 'critical').length;
    const highPriorityRefactoring = refactoring.targets.filter(t => t.priority === 'high').length;
    const scalabilityScore = architecture.scalability.score;

    if (criticalDebt > 3 || highPriorityRefactoring > 10 || scalabilityScore < 30) {
      return 'critical';
    }
    if (criticalDebt > 1 || highPriorityRefactoring > 5 || scalabilityScore < 50) {
      return 'high';
    }
    if (
      technicalDebt.totalDebt.totalDays > 15 ||
      highPriorityRefactoring > 2 ||
      scalabilityScore < 70
    ) {
      return 'medium';
    }
    return 'low';
  }

  private generatePriorityActions(
    architecture: ArchitectureMetrics,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): string[] {
    const actions: string[] = [];

    const criticalDebt = technicalDebt.categories.filter(c => c.priority === 'critical');
    if (criticalDebt.length > 0) {
      actions.push(`Immediately address ${criticalDebt.length} critical technical debt items`);
    }

    const highPriorityRefactoring = refactoring.targets.filter(t => t.priority === 'high');
    if (highPriorityRefactoring.length > 0) {
      actions.push(`Refactor ${highPriorityRefactoring.length} high-complexity code components`);
    }

    if (architecture.scalability.score < 50) {
      actions.push('Implement scalability improvements to handle future growth');
    }

    if (architecture.modularity.coupling > 0.7) {
      actions.push('Reduce coupling between modules to improve maintainability');
    }

    if (actions.length === 0) {
      actions.push('Maintain current high code quality standards');
    }

    return actions.slice(0, 5); // Top 5 priority actions
  }

  private recommendStrategy(
    overallScore: number,
    riskLevel: string,
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): 'maintain' | 'incremental' | 'major-refactor' | 'rewrite' {
    if (overallScore >= 80 && riskLevel === 'low') {
      return 'maintain';
    }

    if (overallScore >= 60 && riskLevel !== 'critical') {
      return 'incremental';
    }

    if (
      overallScore >= 30 ||
      (technicalDebt.totalDebt.totalDays > 50 && refactoring.summary.totalTargets > 50)
    ) {
      return 'major-refactor';
    }

    return 'rewrite';
  }

  private calculateEstimatedEffort(
    technicalDebt: TechnicalDebtAssessment,
    refactoring: RefactoringAssessment
  ): { totalHours: number; timeline: number; teamSize: number } {
    const debtHours = technicalDebt.totalDebt.totalDays * 8; // Convert person-days to hours
    const refactoringHours = refactoring.summary.totalEffort;
    const totalHours = debtHours + refactoringHours;

    // Estimate timeline assuming 32 productive hours per week per developer
    const productiveHoursPerWeek = 32;
    const recommendedTeamSize = totalHours > 500 ? 3 : totalHours > 200 ? 2 : 1;
    const timeline = Math.ceil(totalHours / (productiveHoursPerWeek * recommendedTeamSize));

    return {
      totalHours,
      timeline,
      teamSize: recommendedTeamSize,
    };
  }

  // Utility method for generating reports
  generateReport(result: UltraEnhancedAnalysisResult): string {
    return `
# Ultra Enhanced Analysis Report

## Executive Summary
- **Overall Score**: ${result.summary.overallScore}/100
- **Risk Level**: ${result.summary.riskLevel.toUpperCase()}
- **Recommended Strategy**: ${result.summary.recommendedStrategy.replace('-', ' ').toUpperCase()}

## Key Metrics
- **Architecture Patterns**: ${result.architecture.patterns.length} detected
- **Technical Debt**: ${result.technicalDebt.totalDebt.totalDays} person-days
- **Refactoring Targets**: ${result.refactoring.summary.totalTargets} identified
- **Estimated Effort**: ${result.summary.estimatedEffort.totalHours} hours (${result.summary.estimatedEffort.timeline} weeks)

## Priority Actions
${result.summary.priorityActions.map(action => `- ${action}`).join('\n')}

## SWOT Analysis
### Strengths
${result.insights.strengths.map(s => `- ${s}`).join('\n')}

### Weaknesses
${result.insights.weaknesses.map(w => `- ${w}`).join('\n')}

### Opportunities
${result.insights.opportunities.map(o => `- ${o}`).join('\n')}

### Threats
${result.insights.threats.map(t => `- ${t}`).join('\n')}

## Roadmap
### Immediate (Next 2 weeks)
${result.roadmap.immediate.map(item => `- **${item.title}** (${item.effort}h, ${item.priority} priority)`).join('\n')}

### Short-term (Next 2 months)
${result.roadmap.shortTerm.map(item => `- **${item.title}** (${item.effort}h, ${item.priority} priority)`).join('\n')}

### Long-term (6+ months)
${result.roadmap.longTerm.map(item => `- **${item.title}** (${item.effort}h, ${item.priority} priority)`).join('\n')}
`;
  }
}
