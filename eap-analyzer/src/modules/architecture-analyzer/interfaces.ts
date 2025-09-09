/**
 * Интерфейсы для модуля архитектурного анализа
 */

export interface ArchitectureMetrics {
  patterns: ArchitecturalPattern[];
  modularity: ModularityScore;
  stability: StabilityMetrics;
  dependencies: DependencyGraph;
  scalability: ScalabilityAssessment;
}

export interface ArchitecturalPattern {
  name: string;
  type: 'MVC' | 'Layered' | 'Microservices' | 'Monolithic' | 'Event-Driven' | 'Component-Based';
  confidence: number;
  location: string[];
  quality: 'good' | 'acceptable' | 'poor';
  recommendations: string[];
}

export interface ModularityScore {
  cohesion: number; // 0-100 - внутренняя связность модулей
  coupling: number; // 0-100 - внешние зависимости (меньше лучше)
  abstractness: number; // 0-1 - уровень абстракции
  instability: number; // 0-1 - нестабильность (зависимость от изменений)
  components: ComponentMetrics[];
}

export interface ComponentMetrics {
  name: string;
  path: string;
  loc: number;
  dependencies: string[];
  dependents: string[];
  cohesion: number;
  coupling: number;
  complexity: number;
}

export interface StabilityMetrics {
  volatility: number; // частота изменений
  maturity: number; // зрелость архитектуры
  breakingChangesRisk: 'low' | 'medium' | 'high';
  technicalDebt: number; // в человеко-днях
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][]; // циклические зависимости
  layers: DependencyLayer[];
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'module' | 'package' | 'file' | 'class';
  metrics: {
    size: number;
    complexity: number;
    dependencies: number;
    dependents: number;
  };
}

export interface DependencyEdge {
  from: string;
  to: string;
  weight: number; // сила зависимости
  type: 'import' | 'require' | 'inject' | 'inherit';
}

export interface DependencyLayer {
  level: number;
  name: string;
  components: string[];
  dependencies: string[]; // зависимости от других слоев
}

export interface ScalabilityAssessment {
  score: number; // 0-100
  bottlenecks: Bottleneck[];
  recommendations: string[];
  estimatedGrowthCapacity: 'low' | 'medium' | 'high';
}

export interface Bottleneck {
  component: string;
  type: 'performance' | 'coupling' | 'complexity' | 'database' | 'external-api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  solution: string;
}
