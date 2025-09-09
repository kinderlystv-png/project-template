/**
 * Профайлер времени выполнения
 * Измеряет производительность различных этапов анализа
 * и выявляет узкие места в производительности
 */

export interface TimingMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  phase: string;
  metadata?: Record<string, any>;
}

export interface PerformanceProfileResult {
  measurements: TimingMeasurement[];
  totalDuration: number;
  phases: PhaseAnalysis[];
  bottlenecks: Bottleneck[];
  recommendations: string[];
  efficiency: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    description: string;
  };
}

export interface PhaseAnalysis {
  phase: string;
  totalDuration: number;
  averageDuration: number;
  operationCount: number;
  percentage: number;
  slowestOperation: TimingMeasurement;
}

export interface Bottleneck {
  operation: string;
  duration: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export class ExecutionTimer {
  private measurements: TimingMeasurement[] = [];
  private activeTimers = new Map<
    string,
    { startTime: number; phase: string; metadata?: Record<string, any> }
  >();
  private phaseStack: string[] = [];
  private isActive = false;

  /**
   * Запускает профилирование производительности
   */
  startProfiling(): void {
    this.isActive = true;
    this.measurements = [];
    this.activeTimers.clear();
    this.phaseStack = [];
  }

  /**
   * Останавливает профилирование производительности
   */
  stopProfiling(): void {
    this.isActive = false;

    // Завершаем все активные таймеры
    for (const [name] of this.activeTimers) {
      this.endTimer(name);
    }
  }

  /**
   * Входит в новую фазу выполнения
   */
  enterPhase(phaseName: string): void {
    if (!this.isActive) return;

    this.phaseStack.push(phaseName);
    this.startTimer(`phase_${phaseName}`, phaseName);
  }

  /**
   * Выходит из текущей фазы
   */
  exitPhase(): string | null {
    if (!this.isActive || this.phaseStack.length === 0) return null;

    const phase = this.phaseStack.pop()!;
    this.endTimer(`phase_${phase}`);
    return phase;
  }

  /**
   * Запускает таймер для операции
   */
  startTimer(name: string, phase?: string, metadata?: Record<string, any>): void {
    if (!this.isActive) return;

    const currentPhase = phase || this.getCurrentPhase();

    this.activeTimers.set(name, {
      startTime: performance.now(),
      phase: currentPhase,
      metadata,
    });
  }

  /**
   * Останавливает таймер и записывает измерение
   */
  endTimer(name: string): number {
    if (!this.isActive) return 0;

    const timer = this.activeTimers.get(name);
    if (!timer) {
      console.warn(`Timer "${name}" не был запущен`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - timer.startTime;

    const measurement: TimingMeasurement = {
      name,
      startTime: timer.startTime,
      endTime,
      duration,
      phase: timer.phase,
      metadata: timer.metadata,
    };

    this.measurements.push(measurement);
    this.activeTimers.delete(name);

    return duration;
  }

  /**
   * Измеряет время выполнения функции
   */
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T>,
    phase?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name, phase, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endTimer(name);
    }
  }

  /**
   * Измеряет время выполнения синхронной функции
   */
  measureSync<T>(name: string, fn: () => T, phase?: string, metadata?: Record<string, any>): T {
    this.startTimer(name, phase, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.endTimer(name);
    }
  }

  /**
   * Анализирует профиль производительности
   */
  analyzeProfile(): PerformanceProfileResult {
    if (this.measurements.length === 0) {
      return this.getEmptyResult();
    }

    const totalDuration = this.calculateTotalDuration();
    const phases = this.analyzePhases();
    const bottlenecks = this.detectBottlenecks(totalDuration);
    const recommendations = this.generateRecommendations(phases, bottlenecks);
    const efficiency = this.calculateEfficiency(phases, bottlenecks);

    return {
      measurements: this.measurements,
      totalDuration,
      phases,
      bottlenecks,
      recommendations,
      efficiency,
    };
  }

  /**
   * Получает текущую фазу выполнения
   */
  private getCurrentPhase(): string {
    return this.phaseStack.length > 0 ? this.phaseStack[this.phaseStack.length - 1] : 'default';
  }

  /**
   * Рассчитывает общее время выполнения
   */
  private calculateTotalDuration(): number {
    const phaseMeasurements = this.measurements.filter(m => m.name.startsWith('phase_'));

    if (phaseMeasurements.length === 0) {
      return this.measurements.reduce((total, m) => total + m.duration, 0);
    }

    return (
      Math.max(...phaseMeasurements.map(m => m.endTime)) -
      Math.min(...phaseMeasurements.map(m => m.startTime))
    );
  }

  /**
   * Анализирует производительность по фазам
   */
  private analyzePhases(): PhaseAnalysis[] {
    const phaseGroups = new Map<string, TimingMeasurement[]>();

    // Группируем измерения по фазам
    for (const measurement of this.measurements) {
      if (!phaseGroups.has(measurement.phase)) {
        phaseGroups.set(measurement.phase, []);
      }
      phaseGroups.get(measurement.phase)!.push(measurement);
    }

    const totalDuration = this.calculateTotalDuration();
    const phases: PhaseAnalysis[] = [];

    for (const [phase, measurements] of phaseGroups) {
      const phaseTotalDuration = measurements.reduce((sum, m) => sum + m.duration, 0);
      const averageDuration = phaseTotalDuration / measurements.length;
      const slowestOperation = measurements.reduce((slowest, current) =>
        current.duration > slowest.duration ? current : slowest
      );

      phases.push({
        phase,
        totalDuration: Math.round(phaseTotalDuration * 100) / 100,
        averageDuration: Math.round(averageDuration * 100) / 100,
        operationCount: measurements.length,
        percentage: Math.round((phaseTotalDuration / totalDuration) * 100 * 100) / 100,
        slowestOperation,
      });
    }

    return phases.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * Обнаруживает узкие места в производительности
   */
  private detectBottlenecks(totalDuration: number): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Сортируем по времени выполнения
    const sortedMeasurements = [...this.measurements].sort((a, b) => b.duration - a.duration);

    for (const measurement of sortedMeasurements) {
      const percentage = (measurement.duration / totalDuration) * 100;

      if (percentage < 5) break; // Игнорируем операции менее 5% времени

      let severity: Bottleneck['severity'];
      let recommendation: string;

      if (percentage > 40) {
        severity = 'critical';
        recommendation = `КРИТИЧНО: Операция ${measurement.name} занимает ${percentage.toFixed(1)}% времени. Требует немедленной оптимизации.`;
      } else if (percentage > 25) {
        severity = 'high';
        recommendation = `Операция ${measurement.name} занимает ${percentage.toFixed(1)}% времени. Рекомендуется оптимизация.`;
      } else if (percentage > 15) {
        severity = 'medium';
        recommendation = `Операция ${measurement.name} занимает ${percentage.toFixed(1)}% времени. Можно оптимизировать.`;
      } else {
        severity = 'low';
        recommendation = `Операция ${measurement.name} занимает ${percentage.toFixed(1)}% времени. Приемлемо, но есть потенциал для улучшения.`;
      }

      bottlenecks.push({
        operation: measurement.name,
        duration: Math.round(measurement.duration * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        severity,
        recommendation,
      });
    }

    return bottlenecks;
  }

  /**
   * Генерирует рекомендации по оптимизации производительности
   */
  private generateRecommendations(phases: PhaseAnalysis[], bottlenecks: Bottleneck[]): string[] {
    const recommendations: string[] = [];

    // Рекомендации по общей производительности
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high');

    if (criticalBottlenecks.length > 0) {
      recommendations.push(
        '🚨 КРИТИЧЕСКИЕ узкие места обнаружены! Немедленная оптимизация требуется.'
      );
    }

    if (highBottlenecks.length > 0) {
      recommendations.push('⚠️ Обнаружены серьезные узкие места. Рекомендуется оптимизация.');
    }

    // Рекомендации по фазам
    const slowestPhase = phases[0];
    if (slowestPhase && slowestPhase.percentage > 50) {
      recommendations.push(
        `📊 Фаза "${slowestPhase.phase}" занимает ${slowestPhase.percentage}% времени. Сфокусируйтесь на её оптимизации.`
      );
    }

    // Рекомендации по паттернам
    const shortOperations = this.measurements.filter(m => m.duration < 1).length;
    const totalOperations = this.measurements.length;

    if (shortOperations / totalOperations > 0.8) {
      recommendations.push('💡 Много мелких операций. Рассмотрите группировку или батчинг.');
    }

    // Общие рекомендации
    if (recommendations.length === 0) {
      recommendations.push('✅ Производительность в норме. Критических проблем не обнаружено.');
    }

    return recommendations;
  }

  /**
   * Рассчитывает эффективность производительности
   */
  private calculateEfficiency(
    phases: PhaseAnalysis[],
    bottlenecks: Bottleneck[]
  ): PerformanceProfileResult['efficiency'] {
    let score = 100;

    // Штрафы за узкие места
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;
    const mediumBottlenecks = bottlenecks.filter(b => b.severity === 'medium').length;

    score -= criticalBottlenecks * 30;
    score -= highBottlenecks * 15;
    score -= mediumBottlenecks * 8;

    // Штраф за неравномерное распределение нагрузки
    if (phases.length > 0) {
      const maxPhasePercentage = Math.max(...phases.map(p => p.percentage));
      if (maxPhasePercentage > 70) score -= 20;
      else if (maxPhasePercentage > 50) score -= 10;
    }

    score = Math.max(0, score);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    let description: string;

    if (score >= 90) {
      grade = 'A';
      description = 'Отличная производительность';
    } else if (score >= 80) {
      grade = 'B';
      description = 'Хорошая производительность';
    } else if (score >= 70) {
      grade = 'C';
      description = 'Удовлетворительная производительность';
    } else if (score >= 60) {
      grade = 'D';
      description = 'Плохая производительность';
    } else {
      grade = 'F';
      description = 'Критические проблемы производительности';
    }

    return { score, grade, description };
  }

  /**
   * Возвращает пустой результат
   */
  private getEmptyResult(): PerformanceProfileResult {
    return {
      measurements: [],
      totalDuration: 0,
      phases: [],
      bottlenecks: [],
      recommendations: ['Профилирование не проводилось'],
      efficiency: {
        score: 0,
        grade: 'F',
        description: 'Нет данных для анализа',
      },
    };
  }

  /**
   * Получает статистику текущих активных таймеров
   */
  getActiveTimersStats(): { count: number; names: string[]; phases: string[] } {
    const names = Array.from(this.activeTimers.keys());
    const phases = [...new Set(Array.from(this.activeTimers.values()).map(t => t.phase))];

    return {
      count: this.activeTimers.size,
      names,
      phases,
    };
  }

  /**
   * Очищает все данные профилирования
   */
  reset(): void {
    this.measurements = [];
    this.activeTimers.clear();
    this.phaseStack = [];
    this.isActive = false;
  }
}
