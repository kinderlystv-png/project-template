/**
 * Модели данных для EAP Debugger
 */

export interface DebuggerComponent {
  id: string;
  name: string;
  category: 'checker' | 'module';
  type: string;
  path?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  registeredAt: Date;
  analysisResult?: unknown; // Результат анализа компонента
  lastRun?: Date; // Время последнего запуска
  status?: 'passed' | 'failed' | 'completed' | 'error'; // Статус выполнения
}

export interface ComponentRegistration {
  checkers: DebuggerComponent[];
  modules: DebuggerComponent[];
  totalCount: number;
  lastUpdated: Date;
}

export interface DebuggerState {
  components: ComponentRegistration;
  htmlPath?: string;
  autoRefresh: boolean;
  refreshInterval: number; // ms
  analysisResult?: unknown; // Результат полного анализа
  projectPath?: string; // Путь к анализируемому проекту
}
