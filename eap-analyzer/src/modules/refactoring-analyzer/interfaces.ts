export interface RefactoringTarget {
  type: 'method' | 'class' | 'module' | 'pattern';
  location: string;
  complexity: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedEffort: number; // in person-hours
  benefits: string[];
  risks: string[];
}

export interface RefactoringExample {
  targetId: string;
  before: {
    code: string;
    issues: string[];
    metrics: {
      cyclomatic: number;
      cognitive: number;
      lines: number;
    };
  };
  after: {
    code: string;
    improvements: string[];
    metrics: {
      cyclomatic: number;
      cognitive: number;
      lines: number;
    };
  };
  explanation: string;
}

export interface RefactoringStrategy {
  type: 'incremental' | 'big-bang' | 'parallel';
  phases: RefactoringPhase[];
  timeline: number; // in weeks
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  successMetrics: string[];
}

export interface RefactoringPhase {
  name: string;
  targets: string[];
  duration: number; // in weeks
  dependencies: string[];
  deliverables: string[];
  testingStrategy: string;
}

export interface RefactoringAssessment {
  targets: RefactoringTarget[];
  examples: RefactoringExample[];
  strategies: RefactoringStrategy[];
  summary: {
    totalTargets: number;
    totalEffort: number; // in person-hours
    estimatedTimeline: number; // in weeks
    riskProfile: 'low' | 'medium' | 'high';
    expectedImprovements: string[];
  };
  recommendations: string[];
}
