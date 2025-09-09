/**
 * Интерфейсы для модуля оценки технического долга
 */

export interface TechnicalDebtAssessment {
  totalDebt: DebtMetrics;
  categories: DebtCategory[];
  heatmap: DebtHeatmap;
  timeline: DebtTimeline;
  payoffPlan: PayoffStrategy;
}

export interface DebtMetrics {
  totalDays: number; // общий долг в человеко-днях
  totalCost: number; // оценка в денежном выражении
  monthlyInterest: number; // "проценты" - рост долга в месяц
  breakEvenPoint: number; // точка окупаемости рефакторинга (дни)
}

export interface DebtCategory {
  type: 'intentional' | 'unintentional' | 'strategic' | 'tactical';
  name: string;
  description: string;
  amount: number; // в человеко-днях
  priority: 'low' | 'medium' | 'high' | 'critical';
  items: DebtItem[];
}

export interface DebtItem {
  id: string;
  file: string;
  line?: number;
  type: string;
  description: string;
  effort: number; // часы на исправление
  impact: number; // влияние на систему (1-10)
  risk: number; // риск если не исправить (1-10)
}

export interface DebtHeatmap {
  files: HeatmapEntry[];
  modules: HeatmapEntry[];
  maxDebt: number;
}

export interface HeatmapEntry {
  path: string;
  debtScore: number; // 0-100
  color: string; // hex цвет для визуализации
  issues: number;
}

export interface DebtTimeline {
  history: DebtSnapshot[];
  trend: 'increasing' | 'stable' | 'decreasing';
  projection: DebtProjection;
}

export interface DebtSnapshot {
  date: Date;
  totalDebt: number;
  newDebt: number;
  paidDebt: number;
}

export interface DebtProjection {
  months: number[];
  pessimistic: number[];
  realistic: number[];
  optimistic: number[];
}

export interface PayoffStrategy {
  quickWins: DebtItem[]; // быстрые победы
  highImpact: DebtItem[]; // высокое влияние
  riskMitigation: DebtItem[]; // снижение рисков
  phases: RefactoringPhase[];
  estimatedROI: number; // окупаемость инвестиций
}

export interface RefactoringPhase {
  phase: number;
  name: string;
  duration: number; // дни
  items: string[]; // ID элементов долга
  effort: number; // человеко-часы
  expectedImprovement: number; // процент улучшения
}
