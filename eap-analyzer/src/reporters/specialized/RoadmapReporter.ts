/**
 * Roadmap Reporter
 * Специализированный репортер для создания дорожной карты развития проекта
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
 * Конфигурация для Roadmap
 */
export interface RoadmapConfig {
  timeHorizon?: number; // months
  includeEstimates?: boolean;
  includeDependencies?: boolean;
  includeRisks?: boolean;
  teamVelocity?: number; // story points per sprint
  sprintLength?: number; // weeks
  priorityWeights?: {
    business: number;
    technical: number;
    user: number;
    security: number;
  };
}

/**
 * Элемент дорожной карты
 */
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'fix' | 'infrastructure' | 'security';
  priority: number;
  effort: number; // hours
  businessValue: number; // 1-10
  technicalComplexity: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: string[];
  quarter: string;
  milestone: string;
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  stakeholders: string[];
  successMetrics: string[];
}

/**
 * Фаза развития
 */
interface RoadmapPhase {
  name: string;
  description: string;
  duration: number; // weeks
  objectives: string[];
  deliverables: RoadmapItem[];
  risks: string[];
  dependencies: string[];
  successCriteria: string[];
}

/**
 * Анализ дорожной карты
 */
interface RoadmapAnalysis {
  phases: RoadmapPhase[];
  timeline: Map<string, RoadmapItem[]>; // quarter -> items
  dependencies: Map<string, string[]>; // item -> dependencies
  risks: Map<string, string[]>; // risk category -> risks
  resourcePlan: {
    totalEffort: number;
    quarterlyBreakdown: Map<string, number>;
    teamAllocation: Map<string, number>;
  };
}

/**
 * Репортер для создания дорожной карты проекта
 */
export class RoadmapReporter extends BaseReporter implements ISpecializedReporter<RoadmapConfig> {
  private roadmapConfig: RoadmapConfig = {
    timeHorizon: 12, // 12 months
    includeEstimates: true,
    includeDependencies: true,
    includeRisks: true,
    teamVelocity: 30, // story points per sprint
    sprintLength: 2, // weeks
    priorityWeights: {
      business: 0.4,
      technical: 0.3,
      user: 0.2,
      security: 0.1,
    },
  };

  constructor(config: ReporterConfig = {}) {
    super({
      outputDir: 'reports/roadmap',
      fileName: 'development-roadmap',
      ...config,
    });
  }

  configure(options: RoadmapConfig): void {
    this.roadmapConfig = { ...this.roadmapConfig, ...options };
  }

  getFormat(): ReportFormat {
    return ReportFormat.MARKDOWN;
  }

  getName(): string {
    return 'Roadmap Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Creating development roadmap...');

    this.validateReportData(data);

    const roadmapAnalysis = this.analyzeRoadmap(data);
    const content = this.buildRoadmapReport(project, data, roadmapAnalysis);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        reportType: 'development-roadmap',
        timeHorizon: this.roadmapConfig.timeHorizon,
        phasesCount: roadmapAnalysis.phases.length,
        ...data.metadata,
      },
    };

    this.log('Development roadmap created successfully');
    return result;
  }

  /**
   * Анализирует данные и создает дорожную карту
   */
  private analyzeRoadmap(data: ReportData): RoadmapAnalysis {
    const roadmapItems = this.extractRoadmapItems(data);
    const prioritizedItems = this.prioritizeItems(roadmapItems);
    const phases = this.createPhases(prioritizedItems);
    const timeline = this.createTimeline(prioritizedItems);
    const dependencies = this.analyzeDependencies(prioritizedItems);
    const risks = this.analyzeRisks(prioritizedItems);
    const resourcePlan = this.planResources(prioritizedItems);

    return {
      phases,
      timeline,
      dependencies,
      risks,
      resourcePlan,
    };
  }

  /**
   * Извлекает элементы для дорожной карты из данных анализа
   */
  private extractRoadmapItems(data: ReportData): RoadmapItem[] {
    const items: RoadmapItem[] = [];
    let itemId = 1;

    for (const section of data.sections) {
      for (const item of section.items) {
        if (item.type === 'issue' && item.effort && item.effort > 0) {
          const roadmapItem: RoadmapItem = {
            id: `ITEM-${itemId++}`,
            title: item.title,
            description: item.description,
            category: this.categorizeItem(item, section.title),
            priority: this.calculateItemPriority(item),
            effort: item.effort,
            businessValue: this.estimateBusinessValue(item),
            technicalComplexity: this.estimateTechnicalComplexity(item),
            riskLevel: this.assessItemRisk(item),
            dependencies: [],
            quarter: '',
            milestone: '',
            status: 'planned',
            stakeholders: this.identifyStakeholders(item, section.title),
            successMetrics: this.defineSuccessMetrics(item),
          };

          items.push(roadmapItem);
        }
      }
    }

    return items;
  }

  /**
   * Приоритизирует элементы дорожной карты
   */
  private prioritizeItems(items: RoadmapItem[]): RoadmapItem[] {
    return items.sort((a, b) => {
      const scoreA = this.calculateItemScore(a);
      const scoreB = this.calculateItemScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Создает фазы развития
   */
  private createPhases(items: RoadmapItem[]): RoadmapPhase[] {
    const phases: RoadmapPhase[] = [];

    // Фаза 1: Стабилизация (критические исправления)
    const criticalItems = items
      .filter(item => item.category === 'fix' || item.category === 'security')
      .slice(0, 10);

    if (criticalItems.length > 0) {
      phases.push({
        name: 'Phase 1: Stabilization',
        description: 'Address critical issues and security vulnerabilities',
        duration: Math.ceil(this.calculatePhaseDuration(criticalItems)),
        objectives: [
          'Fix critical bugs and security issues',
          'Establish stable foundation',
          'Improve system reliability',
        ],
        deliverables: criticalItems,
        risks: ['Technical debt accumulation', 'Resource constraints'],
        dependencies: [],
        successCriteria: [
          'Zero critical security vulnerabilities',
          'System stability >99%',
          'Reduced support tickets by 50%',
        ],
      });
    }

    // Фаза 2: Инфраструктура
    const infrastructureItems = items
      .filter(item => item.category === 'infrastructure' || item.category === 'improvement')
      .slice(0, 8);

    if (infrastructureItems.length > 0) {
      phases.push({
        name: 'Phase 2: Infrastructure Enhancement',
        description: 'Improve development infrastructure and tooling',
        duration: Math.ceil(this.calculatePhaseDuration(infrastructureItems)),
        objectives: [
          'Enhance CI/CD pipeline',
          'Improve monitoring and observability',
          'Optimize development workflow',
        ],
        deliverables: infrastructureItems,
        risks: ['Integration complexity', 'Learning curve'],
        dependencies: criticalItems.map(item => item.id),
        successCriteria: [
          'Deployment time reduced by 70%',
          'Development velocity increased by 30%',
          'Zero-downtime deployments',
        ],
      });
    }

    // Фаза 3: Функциональность
    const featureItems = items.filter(item => item.category === 'feature').slice(0, 12);

    if (featureItems.length > 0) {
      phases.push({
        name: 'Phase 3: Feature Development',
        description: 'Deliver new features and enhancements',
        duration: Math.ceil(this.calculatePhaseDuration(featureItems)),
        objectives: [
          'Deliver high-priority features',
          'Enhance user experience',
          'Expand system capabilities',
        ],
        deliverables: featureItems,
        risks: ['Scope creep', 'Technical complexity'],
        dependencies: [
          ...criticalItems.map(item => item.id),
          ...infrastructureItems.map(item => item.id),
        ],
        successCriteria: [
          'User satisfaction >90%',
          'Feature adoption >70%',
          'Performance benchmarks met',
        ],
      });
    }

    return phases;
  }

  /**
   * Создает временную шкалу по кварталам
   */
  private createTimeline(items: RoadmapItem[]): Map<string, RoadmapItem[]> {
    const timeline = new Map<string, RoadmapItem[]>();
    const quarters = this.generateQuarters();

    let currentQuarterIndex = 0;
    let currentQuarterEffort = 0;
    const quarterCapacity = this.calculateQuarterCapacity();

    for (const item of items) {
      // Проверяем, помещается ли элемент в текущий квартал
      if (
        currentQuarterEffort + item.effort > quarterCapacity &&
        currentQuarterIndex < quarters.length - 1
      ) {
        currentQuarterIndex++;
        currentQuarterEffort = 0;
      }

      const quarter = quarters[currentQuarterIndex];
      item.quarter = quarter;

      if (!timeline.has(quarter)) {
        timeline.set(quarter, []);
      }

      timeline.get(quarter)!.push(item);
      currentQuarterEffort += item.effort;
    }

    return timeline;
  }

  /**
   * Строит отчет дорожной карты
   */
  private buildRoadmapReport(
    project: Project,
    data: ReportData,
    analysis: RoadmapAnalysis
  ): string {
    let content = this.buildHeader(data, analysis);

    content += '\n\n' + this.buildExecutiveSummary(analysis);
    content += '\n\n' + this.buildVisionAndGoals(data);
    content += '\n\n' + this.buildTimelineOverview(analysis);
    content += '\n\n' + this.buildPhasesDetail(analysis);

    if (this.roadmapConfig.includeEstimates) {
      content += '\n\n' + this.buildResourcePlan(analysis);
    }

    if (this.roadmapConfig.includeDependencies) {
      content += '\n\n' + this.buildDependencyAnalysis(analysis);
    }

    if (this.roadmapConfig.includeRisks) {
      content += '\n\n' + this.buildRiskAssessment(analysis);
    }

    content += '\n\n' + this.buildSuccessMetrics(analysis);
    content += '\n\n' + this.buildMonitoringPlan();
    content += '\n\n' + this.buildFooter();

    return content;
  }

  /**
   * Создает заголовок отчета
   */
  private buildHeader(data: ReportData, analysis: RoadmapAnalysis): string {
    const totalEffort = analysis.resourcePlan.totalEffort;
    const estimatedDuration = Math.ceil(totalEffort / this.calculateWeeklyCapacity());

    return `# Development Roadmap: ${data.projectName}

**Planning Date:** ${data.analysisDate.toLocaleDateString()}
**Time Horizon:** ${this.roadmapConfig.timeHorizon} months
**Total Effort:** ${totalEffort} hours
**Estimated Duration:** ${estimatedDuration} weeks
**Number of Phases:** ${analysis.phases.length}

---`;
  }

  /**
   * Создает исполнительное резюме
   */
  private buildExecutiveSummary(analysis: RoadmapAnalysis): string {
    const highPriorityItems = this.getHighPriorityCount(analysis);
    const majorMilestones = analysis.phases.length;

    return `## 🎯 Executive Summary

### Strategic Objectives
This roadmap outlines the strategic development plan for the next ${this.roadmapConfig.timeHorizon} months, focusing on:

- **Quality & Stability:** Addressing ${this.getCriticalIssuesCount(analysis)} critical issues
- **Infrastructure Modernization:** Enhancing development capabilities and operational efficiency
- **Feature Delivery:** Rolling out ${this.getFeatureCount(analysis)} high-value features
- **Technical Excellence:** Reducing technical debt and improving code quality

### Key Highlights
- **${majorMilestones} Major Phases** with clear deliverables and success criteria
- **${highPriorityItems} High-Priority Items** requiring immediate attention
- **Estimated ROI:** ${this.calculateEstimatedROI(analysis)}% within 12 months
- **Risk Mitigation:** Comprehensive risk assessment and mitigation strategies

### Resource Requirements
- **Total Investment:** ${analysis.resourcePlan.totalEffort} development hours
- **Team Allocation:** Distributed across ${analysis.phases.length} phases
- **Expected Benefits:** Improved velocity, reduced maintenance overhead, enhanced user satisfaction`;
  }

  /**
   * Создает видение и цели
   */
  private buildVisionAndGoals(data: ReportData): string {
    return `## 🌟 Vision & Strategic Goals

### Product Vision
Transform ${data.projectName} into a modern, scalable, and maintainable system that:
- Delivers exceptional user experience
- Maintains high security and reliability standards
- Enables rapid feature development and deployment
- Supports business growth and scalability requirements

### Strategic Goals

#### 🎯 Quality & Reliability
- Achieve 99.9% system uptime
- Reduce critical bugs by 80%
- Implement comprehensive monitoring and alerting

#### ⚡ Developer Experience
- Increase development velocity by 40%
- Reduce deployment time from hours to minutes
- Establish automated testing and quality gates

#### 🚀 Business Value
- Accelerate time-to-market for new features
- Improve user satisfaction scores by 25%
- Enable data-driven decision making

#### 🔒 Security & Compliance
- Achieve industry-standard security certifications
- Implement zero-trust security model
- Ensure GDPR and regulatory compliance`;
  }

  /**
   * Создает обзор временной шкалы
   */
  private buildTimelineOverview(analysis: RoadmapAnalysis): string {
    let content = `## 📅 Timeline Overview

### Quarterly Breakdown

`;

    for (const [quarter, items] of analysis.timeline) {
      const totalEffort = items.reduce((sum, item) => sum + item.effort, 0);
      const criticalCount = items.filter(item => item.priority > 8).length;

      content += `#### ${quarter}
- **Focus:** ${this.getQuarterFocus(items)}
- **Deliverables:** ${items.length} items (${totalEffort} hours)
- **Critical Items:** ${criticalCount}
- **Key Milestones:** ${this.getKeyMilestones(items).join(', ')}

`;
    }

    return content;
  }

  /**
   * Создает детальное описание фаз
   */
  private buildPhasesDetail(analysis: RoadmapAnalysis): string {
    let content = `## 🚀 Development Phases

`;

    for (let i = 0; i < analysis.phases.length; i++) {
      const phase = analysis.phases[i];
      content += this.buildPhaseSection(phase, i + 1);
      content += '\n\n';
    }

    return content;
  }

  /**
   * Создает секцию отдельной фазы
   */
  private buildPhaseSection(phase: RoadmapPhase, phaseNumber: number): string {
    const totalEffort = phase.deliverables.reduce((sum, item) => sum + item.effort, 0);

    return `### Phase ${phaseNumber}: ${phase.name}

**Duration:** ${phase.duration} weeks
**Total Effort:** ${totalEffort} hours
**Deliverables:** ${phase.deliverables.length} items

${phase.description}

#### 🎯 Objectives
${phase.objectives.map(obj => `- ${obj}`).join('\n')}

#### 📦 Key Deliverables
${phase.deliverables
  .slice(0, 5)
  .map(item => `- **${item.title}** (${item.effort}h) - ${item.description}`)
  .join('\n')}
${phase.deliverables.length > 5 ? `\n*...and ${phase.deliverables.length - 5} more items*` : ''}

#### ✅ Success Criteria
${phase.successCriteria.map(criteria => `- ${criteria}`).join('\n')}

#### ⚠️ Risks & Mitigation
${phase.risks.map(risk => `- **Risk:** ${risk}`).join('\n')}`;
  }

  /**
   * Создает план ресурсов
   */
  private buildResourcePlan(analysis: RoadmapAnalysis): string {
    const weeklyCapacity = this.calculateWeeklyCapacity();
    const totalWeeks = Math.ceil(analysis.resourcePlan.totalEffort / weeklyCapacity);

    let content = `## 👥 Resource Planning

### Team Capacity
- **Weekly Capacity:** ${weeklyCapacity} hours
- **Sprint Velocity:** ${this.roadmapConfig.teamVelocity} story points
- **Estimated Timeline:** ${totalWeeks} weeks

### Quarterly Resource Allocation

| Quarter | Effort (hours) | Percentage | Focus Area |
|---------|----------------|------------|------------|`;

    for (const [quarter, effort] of analysis.resourcePlan.quarterlyBreakdown) {
      const percentage = Math.round((effort / analysis.resourcePlan.totalEffort) * 100);
      const items = analysis.timeline.get(quarter) || [];
      const focus = this.getQuarterFocus(items);

      content += `\n| ${quarter} | ${effort} | ${percentage}% | ${focus} |`;
    }

    content += `

### Resource Distribution by Category

${this.buildCategoryDistribution(analysis)}`;

    return content;
  }

  /**
   * Создает анализ зависимостей
   */
  private buildDependencyAnalysis(analysis: RoadmapAnalysis): string {
    return `## 🔗 Dependency Analysis

### Critical Path Items
Items that block other deliverables and require priority attention:

${this.getCriticalPathItems(analysis)}

### Phase Dependencies
${analysis.phases
  .map(
    phase => `
**${phase.name}**
- Depends on: ${phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None'}
- Blocks: ${this.getBlockedByPhase(phase, analysis)}
`
  )
  .join('')}

### Mitigation Strategies
- **Parallel Development:** Identify work streams that can run in parallel
- **Incremental Delivery:** Break large items into smaller, independent deliverables
- **Risk Buffer:** Add 20% time buffer for critical path items
- **Alternative Paths:** Prepare backup plans for high-risk dependencies`;
  }

  /**
   * Создает оценку рисков
   */
  private buildRiskAssessment(analysis: RoadmapAnalysis): string {
    return `## ⚠️ Risk Assessment & Mitigation

### High-Risk Areas

#### Technical Risks
- **Legacy System Integration:** Complex migrations may take longer than estimated
- **Third-party Dependencies:** External service limitations could impact timeline
- **Technical Debt:** Accumulated debt may slow down feature development

#### Resource Risks
- **Team Availability:** Key team members may not be available as planned
- **Skill Gaps:** New technologies may require additional training time
- **Competing Priorities:** Business needs may shift development focus

#### Business Risks
- **Scope Creep:** Additional requirements may emerge during development
- **Market Changes:** Competitive landscape may require priority adjustments
- **Regulatory Changes:** New compliance requirements may impact timeline

### Mitigation Strategies

#### Proactive Measures
- Regular risk assessment sessions
- Continuous stakeholder communication
- Flexible sprint planning with buffer time
- Cross-training team members on critical skills

#### Contingency Plans
- Prepared alternative solutions for high-risk items
- Reserve capacity allocation (15% buffer)
- Escalation procedures for blocked items
- Regular checkpoint reviews and replanning sessions`;
  }

  /**
   * Создает метрики успеха
   */
  private buildSuccessMetrics(analysis: RoadmapAnalysis): string {
    return `## 📊 Success Metrics & KPIs

### Delivery Metrics
- **On-time Delivery:** >90% of milestones delivered on schedule
- **Scope Completion:** >95% of planned features delivered
- **Quality Gates:** 100% pass rate for critical quality checks

### Business Impact Metrics
- **User Satisfaction:** >4.5/5 rating from user feedback
- **System Uptime:** >99.9% availability
- **Performance Improvement:** 50% reduction in page load times

### Technical Excellence Metrics
- **Code Quality:** Technical debt reduced by 60%
- **Test Coverage:** >90% automated test coverage
- **Deployment Frequency:** Daily deployments achieved

### Team Productivity Metrics
- **Velocity Improvement:** 40% increase in sprint velocity
- **Cycle Time:** 50% reduction in feature development time
- **Developer Satisfaction:** >4.0/5 team satisfaction score

### Measurement Schedule
- **Weekly:** Sprint velocity and quality metrics
- **Monthly:** Business impact and user satisfaction
- **Quarterly:** Strategic goal progress and roadmap adjustments`;
  }

  /**
   * Создает план мониторинга
   */
  private buildMonitoringPlan(): string {
    return `## 📈 Monitoring & Governance

### Regular Reviews

#### Weekly Sprint Reviews
- Progress against sprint goals
- Blockers and impediments identification
- Quality metrics assessment
- Resource utilization tracking

#### Monthly Milestone Reviews
- Phase progress evaluation
- Budget and timeline assessment
- Stakeholder feedback incorporation
- Risk register updates

#### Quarterly Strategic Reviews
- Roadmap relevance assessment
- Market and business alignment check
- Resource plan adjustments
- Success metrics evaluation

### Governance Structure

#### Steering Committee
- **Frequency:** Monthly
- **Participants:** Product Owner, Tech Lead, Stakeholders
- **Scope:** Strategic decisions and resource allocation

#### Technical Review Board
- **Frequency:** Bi-weekly
- **Participants:** Senior developers, Architects
- **Scope:** Technical decisions and quality standards

#### Progress Tracking Tools
- Project management dashboard
- Automated reporting systems
- Regular stakeholder communications
- Transparency through shared metrics`;
  }

  /**
   * Создает футер
   */
  private buildFooter(): string {
    return `---

**Roadmap Version:** 1.0
**Next Review:** ${this.getNextReviewDate()}
**Document Owner:** Development Team Lead

*This roadmap is a living document and will be updated regularly based on progress, feedback, and changing requirements.*

**Contact Information:**
- For technical questions: Development Team
- For business alignment: Product Owner
- For resource planning: Project Manager`;
  }

  // Вспомогательные методы

  private categorizeItem(
    item: any,
    sectionTitle: string
  ): 'feature' | 'improvement' | 'fix' | 'infrastructure' | 'security' {
    const title = item.title.toLowerCase();
    const section = sectionTitle.toLowerCase();

    if (item.severity === 'critical' || section.includes('security')) return 'security';
    if (item.type === 'issue' || title.includes('fix') || title.includes('bug')) return 'fix';
    if (section.includes('infrastructure') || title.includes('ci') || title.includes('deployment'))
      return 'infrastructure';
    if (title.includes('feature') || title.includes('new')) return 'feature';
    return 'improvement';
  }

  private calculateItemPriority(item: any): number {
    const weights = this.roadmapConfig.priorityWeights!;
    let score = 0;

    // Business value
    score += (item.impact || 5) * weights.business;

    // Technical necessity
    if (item.severity === 'critical') score += 10 * weights.technical;
    else if (item.severity === 'high') score += 7 * weights.technical;
    else score += 4 * weights.technical;

    // User impact
    score += (item.impact || 5) * weights.user;

    // Security weight
    if (item.title.toLowerCase().includes('security')) {
      score += 9 * weights.security;
    }

    return Math.round(score * 10) / 10;
  }

  private estimateBusinessValue(item: any): number {
    if (item.impact) return item.impact;
    if (item.severity === 'critical') return 9;
    if (item.severity === 'high') return 7;
    if (item.severity === 'medium') return 5;
    return 3;
  }

  private estimateTechnicalComplexity(item: any): number {
    const effort = item.effort || 8;
    if (effort > 40) return 9;
    if (effort > 20) return 7;
    if (effort > 8) return 5;
    return 3;
  }

  private assessItemRisk(item: any): 'low' | 'medium' | 'high' {
    if (item.severity === 'critical') return 'high';
    if (item.effort && item.effort > 40) return 'high';
    if (item.severity === 'high' || (item.effort && item.effort > 16)) return 'medium';
    return 'low';
  }

  private identifyStakeholders(item: any, sectionTitle: string): string[] {
    const stakeholders = ['Development Team'];

    if (sectionTitle.toLowerCase().includes('security')) {
      stakeholders.push('Security Team');
    }
    if (item.title.toLowerCase().includes('user') || item.title.toLowerCase().includes('ui')) {
      stakeholders.push('UX Team');
    }
    if (item.severity === 'critical') {
      stakeholders.push('Product Owner');
    }

    return stakeholders;
  }

  private defineSuccessMetrics(item: any): string[] {
    const metrics = [];

    if (item.type === 'issue') {
      metrics.push('Issue resolved and verified');
      metrics.push('No regression detected');
    } else {
      metrics.push('Feature works as specified');
      metrics.push('User acceptance criteria met');
    }

    if (item.severity === 'critical') {
      metrics.push('System stability improved');
    }

    return metrics;
  }

  private calculateItemScore(item: RoadmapItem): number {
    return item.businessValue * 0.4 + (10 - item.technicalComplexity) * 0.3 + item.priority * 0.3;
  }

  private calculatePhaseDuration(items: RoadmapItem[]): number {
    const totalEffort = items.reduce((sum, item) => sum + item.effort, 0);
    const weeklyCapacity = this.calculateWeeklyCapacity();
    return totalEffort / weeklyCapacity;
  }

  private calculateWeeklyCapacity(): number {
    // Предполагаем команду из 5 разработчиков, 32 часа в неделю на разработку
    return 5 * 32; // 160 hours per week
  }

  private calculateQuarterCapacity(): number {
    return this.calculateWeeklyCapacity() * 12; // 12 weeks per quarter
  }

  private generateQuarters(): string[] {
    const quarters = [];
    const currentDate = new Date();

    for (let i = 0; i < Math.ceil(this.roadmapConfig.timeHorizon! / 3); i++) {
      const quarterDate = new Date(currentDate);
      quarterDate.setMonth(quarterDate.getMonth() + i * 3);
      const year = quarterDate.getFullYear();
      const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
      quarters.push(`Q${quarter} ${year}`);
    }

    return quarters;
  }

  private analyzeDependencies(items: RoadmapItem[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    // Простая эвристика: элементы инфраструктуры блокируют функциональность
    const infrastructureItems = items.filter(item => item.category === 'infrastructure');
    const featureItems = items.filter(item => item.category === 'feature');

    for (const feature of featureItems) {
      const deps = infrastructureItems
        .filter(infra => this.isRelated(feature, infra))
        .map(infra => infra.id);
      if (deps.length > 0) {
        dependencies.set(feature.id, deps);
      }
    }

    return dependencies;
  }

  private analyzeRisks(items: RoadmapItem[]): Map<string, string[]> {
    const risks = new Map<string, string[]>();

    risks.set('Technical', [
      'Complex legacy system integration',
      'Third-party API dependencies',
      'Performance optimization challenges',
    ]);

    risks.set('Resource', [
      'Key developer availability',
      'Learning curve for new technologies',
      'Concurrent project demands',
    ]);

    risks.set('Business', ['Changing requirements', 'Market conditions', 'Regulatory compliance']);

    return risks;
  }

  private planResources(items: RoadmapItem[]): any {
    const totalEffort = items.reduce((sum, item) => sum + item.effort, 0);
    const quarterlyBreakdown = new Map<string, number>();
    const teamAllocation = new Map<string, number>();

    // Распределение по кварталам
    const quarters = this.generateQuarters();
    const quarterCapacity = this.calculateQuarterCapacity();

    let remainingEffort = totalEffort;
    for (const quarter of quarters) {
      const quarterEffort = Math.min(remainingEffort, quarterCapacity);
      quarterlyBreakdown.set(quarter, quarterEffort);
      remainingEffort -= quarterEffort;
      if (remainingEffort <= 0) break;
    }

    return {
      totalEffort,
      quarterlyBreakdown,
      teamAllocation,
    };
  }

  private isRelated(item1: RoadmapItem, item2: RoadmapItem): boolean {
    // Простая эвристика для определения связанности элементов
    const keywords1 = item1.title.toLowerCase().split(' ');
    const keywords2 = item2.title.toLowerCase().split(' ');

    return keywords1.some(keyword => keywords2.includes(keyword));
  }

  private getHighPriorityCount(analysis: RoadmapAnalysis): number {
    let count = 0;
    for (const phase of analysis.phases) {
      count += phase.deliverables.filter(item => item.priority > 7).length;
    }
    return count;
  }

  private getCriticalIssuesCount(analysis: RoadmapAnalysis): number {
    let count = 0;
    for (const phase of analysis.phases) {
      count += phase.deliverables.filter(
        item => item.category === 'fix' || item.category === 'security'
      ).length;
    }
    return count;
  }

  private getFeatureCount(analysis: RoadmapAnalysis): number {
    let count = 0;
    for (const phase of analysis.phases) {
      count += phase.deliverables.filter(item => item.category === 'feature').length;
    }
    return count;
  }

  private calculateEstimatedROI(analysis: RoadmapAnalysis): number {
    // Простая эвристика для ROI
    const totalValue = analysis.phases.reduce(
      (sum, phase) => sum + phase.deliverables.reduce((pSum, item) => pSum + item.businessValue, 0),
      0
    );
    const totalCost = analysis.resourcePlan.totalEffort * 100; // $100 per hour
    return Math.round(((totalValue * 1000) / totalCost) * 100);
  }

  private getQuarterFocus(items: RoadmapItem[]): string {
    const categories = new Map<string, number>();

    for (const item of items) {
      categories.set(item.category, (categories.get(item.category) || 0) + 1);
    }

    let maxCategory = '';
    let maxCount = 0;

    for (const [category, count] of categories) {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    }

    switch (maxCategory) {
      case 'fix':
        return 'Stabilization';
      case 'security':
        return 'Security';
      case 'infrastructure':
        return 'Infrastructure';
      case 'feature':
        return 'Feature Development';
      default:
        return 'Improvements';
    }
  }

  private getKeyMilestones(items: RoadmapItem[]): string[] {
    return items
      .filter(item => item.priority > 8)
      .slice(0, 3)
      .map(item => item.title);
  }

  private buildCategoryDistribution(analysis: RoadmapAnalysis): string {
    const categories = new Map<string, number>();

    for (const phase of analysis.phases) {
      for (const item of phase.deliverables) {
        categories.set(item.category, (categories.get(item.category) || 0) + item.effort);
      }
    }

    let content =
      '| Category | Effort (hours) | Percentage |\n|----------|----------------|------------|\n';

    for (const [category, effort] of categories) {
      const percentage = Math.round((effort / analysis.resourcePlan.totalEffort) * 100);
      content += `| ${category} | ${effort} | ${percentage}% |\n`;
    }

    return content;
  }

  private getCriticalPathItems(analysis: RoadmapAnalysis): string {
    const criticalItems = [];

    for (const phase of analysis.phases) {
      const highPriorityItems = phase.deliverables.filter(item => item.priority > 8).slice(0, 3);

      criticalItems.push(
        ...highPriorityItems.map(
          item => `- **${item.title}** (${item.effort}h) - ${item.description}`
        )
      );
    }

    return criticalItems.join('\n');
  }

  private getBlockedByPhase(phase: RoadmapPhase, analysis: RoadmapAnalysis): string {
    const phaseIndex = analysis.phases.indexOf(phase);
    const nextPhase = analysis.phases[phaseIndex + 1];
    return nextPhase ? nextPhase.name : 'None';
  }

  private getNextReviewDate(): string {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 1);
    return nextReview.toLocaleDateString();
  }
}
