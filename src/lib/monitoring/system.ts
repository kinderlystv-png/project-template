/**
 * ADVANCED Monitoring System v1.0
 * Централизованная система сбора метрик и мониторинга производительности
 *
 * Возможности:
 * - Сбор метрик производительности в реальном времени
 * - Мониторинг использования ресурсов
 * - Отслеживание пользовательских действий
 * - Система алертов и уведомлений
 * - Аналитика и визуализация данных
 * - Интеграция с внешними системами мониторинга
 */

// Базовые типы для системы мониторинга
interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: 'ms' | 'bytes' | 'count' | 'percent' | 'rate';
}

interface PerformanceMetric extends MetricData {
  type: 'performance';
  category: 'timing' | 'memory' | 'network' | 'rendering';
}

interface BusinessMetric extends MetricData {
  type: 'business';
  category: 'user' | 'feature' | 'conversion' | 'engagement';
}

interface SystemMetric extends MetricData {
  type: 'system';
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'error';
}

type Metric = PerformanceMetric | BusinessMetric | SystemMetric;

interface MonitoringConfig {
  enabledCategories: string[];
  sampleRate: number;
  bufferSize: number;
  flushInterval: number;
  endpoints: {
    metrics?: string;
    alerts?: string;
    analytics?: string;
  };
  thresholds: Record<
    string,
    {
      warning: number;
      critical: number;
    }
  >;
  enableDebug: boolean;
}

interface Alert {
  id: string;
  metric: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  context?: Record<string, unknown>;
}

interface MonitoringSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  userId?: string;
  userAgent: string;
  url: string;
  metrics: Metric[];
  alerts: Alert[];
}

/**
 * Продвинутая система мониторинга
 */
export class AdvancedMonitoringSystem {
  private config: MonitoringConfig;
  private metricsBuffer: Metric[] = [];
  private alertsBuffer: Alert[] = [];
  private currentSession: MonitoringSession;
  private flushTimer: number | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private memoryObserver: number | null = null;

  // Кэш для агрегированных метрик
  private aggregatedMetrics = new Map<
    string,
    {
      count: number;
      sum: number;
      min: number;
      max: number;
      avg: number;
      last: number;
    }
  >();

  // Система алертов
  private activeAlerts = new Map<string, Alert>();
  private alertCallbacks = new Map<string, (alert: Alert) => void>();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabledCategories: ['performance', 'system', 'business'],
      sampleRate: 1.0, // 100% в разработке
      bufferSize: 100,
      flushInterval: 30000, // 30 секунд
      endpoints: {},
      thresholds: {
        'page.load': { warning: 2000, critical: 5000 },
        'api.response': { warning: 1000, critical: 3000 },
        'memory.usage': { warning: 80, critical: 95 },
        'error.rate': { warning: 1, critical: 5 },
      },
      enableDebug: process.env.NODE_ENV !== 'production',
      ...config,
    };

    this.currentSession = this.createSession();
    this.initializeMonitoring();
    this.startAutoFlush();
  }

  /**
   * Создание новой сессии мониторинга
   */
  private createSession(): MonitoringSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      userId: this.getCurrentUserId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      metrics: [],
      alerts: [],
    };
  }

  /**
   * Инициализация системы мониторинга
   */
  private initializeMonitoring(): void {
    // Performance Observer для Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      this.initializePerformanceObserver();
    }

    // Memory monitoring
    if (typeof window !== 'undefined') {
      this.initializeMemoryMonitoring();
    }

    // Error monitoring
    this.initializeErrorMonitoring();

    // Navigation monitoring
    this.initializeNavigationMonitoring();
  }

  /**
   * Инициализация Performance Observer
   */
  private initializePerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Мониторинг различных типов performance entries
      this.performanceObserver.observe({
        entryTypes: [
          'navigation',
          'paint',
          'largest-contentful-paint',
          'first-input',
          'layout-shift',
          'measure',
          'resource',
        ],
      });
    } catch (error) {
      this.debug('Performance Observer not supported:', error);
    }
  }

  /**
   * Обработка performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: `performance.${entry.entryType}`,
      type: 'performance',
      category: 'timing',
      value: entry.duration || (entry as PerformanceEntry & { value?: number }).value || 0,
      timestamp: Date.now(),
      unit: 'ms',
      tags: {
        entryType: entry.entryType,
        name: entry.name,
      },
    };

    // Специальная обработка для Web Vitals
    if (entry.entryType === 'largest-contentful-paint') {
      metric.name = 'vitals.lcp';
      metric.tags = { ...metric.tags, vital: 'LCP' };
    } else if (entry.entryType === 'first-input') {
      metric.name = 'vitals.fid';
      const fidEntry = entry as PerformanceEntry & { processingStart?: number };
      metric.value = (fidEntry.processingStart || 0) - entry.startTime;
      metric.tags = { ...metric.tags, vital: 'FID' };
    } else if (entry.entryType === 'layout-shift') {
      metric.name = 'vitals.cls';
      const clsEntry = entry as PerformanceEntry & { value?: number };
      metric.value = clsEntry.value || 0;
      metric.unit = 'count';
      metric.tags = { ...metric.tags, vital: 'CLS' };
    }

    this.recordMetric(metric);
  }

  /**
   * Инициализация мониторинга памяти
   */
  private initializeMemoryMonitoring(): void {
    this.memoryObserver = window.setInterval(() => {
      const performanceWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };

      if (performanceWithMemory.memory) {
        const memory = performanceWithMemory.memory;

        this.recordMetric({
          name: 'system.memory.used',
          type: 'system',
          category: 'memory',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          unit: 'bytes',
        });

        this.recordMetric({
          name: 'system.memory.total',
          type: 'system',
          category: 'memory',
          value: memory.totalJSHeapSize,
          timestamp: Date.now(),
          unit: 'bytes',
        });

        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        this.recordMetric({
          name: 'system.memory.usage',
          type: 'system',
          category: 'memory',
          value: usage,
          timestamp: Date.now(),
          unit: 'percent',
        });
      }
    }, 10000); // Каждые 10 секунд
  }

  /**
   * Инициализация мониторинга ошибок
   */
  private initializeErrorMonitoring(): void {
    if (typeof window !== 'undefined') {
      // JavaScript errors
      window.addEventListener('error', event => {
        this.recordMetric({
          name: 'system.error.javascript',
          type: 'system',
          category: 'error',
          value: 1,
          timestamp: Date.now(),
          unit: 'count',
          tags: {
            message: event.message,
            filename: event.filename,
            line: String(event.lineno),
            column: String(event.colno),
          },
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', event => {
        this.recordMetric({
          name: 'system.error.unhandled_promise',
          type: 'system',
          category: 'error',
          value: 1,
          timestamp: Date.now(),
          unit: 'count',
          tags: {
            reason: String(event.reason),
          },
        });
      });
    }
  }

  /**
   * Инициализация мониторинга навигации
   */
  private initializeNavigationMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Page visibility changes
      document.addEventListener('visibilitychange', () => {
        this.recordMetric({
          name: 'user.page.visibility',
          type: 'business',
          category: 'user',
          value: document.hidden ? 0 : 1,
          timestamp: Date.now(),
          unit: 'count',
          tags: {
            state: document.hidden ? 'hidden' : 'visible',
          },
        });
      });

      // Before unload
      window.addEventListener('beforeunload', () => {
        this.endSession();
        this.flush();
      });
    }
  }

  /**
   * Запись метрики
   */
  recordMetric(metric: Metric): void {
    // Проверяем sample rate
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Проверяем разрешенные категории
    if (!this.config.enabledCategories.includes(metric.type)) {
      return;
    }

    // Добавляем метрику в буфер
    this.metricsBuffer.push(metric);
    this.currentSession.metrics.push(metric);

    // Обновляем агрегированные метрики
    this.updateAggregatedMetrics(metric);

    // Проверяем пороговые значения
    this.checkThresholds(metric);

    // Автоматический flush при переполнении буфера
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flush();
    }

    this.debug('Metric recorded:', metric);
  }

  /**
   * Обновление агрегированных метрик
   */
  private updateAggregatedMetrics(metric: Metric): void {
    const key = metric.name;
    const existing = this.aggregatedMetrics.get(key);

    if (existing) {
      existing.count++;
      existing.sum += metric.value;
      existing.min = Math.min(existing.min, metric.value);
      existing.max = Math.max(existing.max, metric.value);
      existing.avg = existing.sum / existing.count;
      existing.last = metric.value;
    } else {
      this.aggregatedMetrics.set(key, {
        count: 1,
        sum: metric.value,
        min: metric.value,
        max: metric.value,
        avg: metric.value,
        last: metric.value,
      });
    }
  }

  /**
   * Проверка пороговых значений и генерация алертов
   */
  private checkThresholds(metric: Metric): void {
    const threshold = this.config.thresholds[metric.name];
    if (!threshold) return;

    const alertId = `${metric.name}_${metric.timestamp}`;
    let alert: Alert | null = null;

    if (metric.value >= threshold.critical) {
      alert = {
        id: alertId,
        metric: metric.name,
        level: 'critical',
        message: `Critical threshold exceeded: ${metric.name} = ${metric.value} (threshold: ${threshold.critical})`,
        timestamp: Date.now(),
        resolved: false,
        context: { metric, threshold },
      };
    } else if (metric.value >= threshold.warning) {
      alert = {
        id: alertId,
        metric: metric.name,
        level: 'warning',
        message: `Warning threshold exceeded: ${metric.name} = ${metric.value} (threshold: ${threshold.warning})`,
        timestamp: Date.now(),
        resolved: false,
        context: { metric, threshold },
      };
    }

    if (alert) {
      this.addAlert(alert);
    }
  }

  /**
   * Добавление алерта
   */
  private addAlert(alert: Alert): void {
    this.alertsBuffer.push(alert);
    this.currentSession.alerts.push(alert);
    this.activeAlerts.set(alert.id, alert);

    // Вызываем callback'и
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        this.debug('Alert callback error:', error);
      }
    });

    this.debug('Alert generated:', alert);
  }

  /**
   * Регистрация callback'а для алертов
   */
  onAlert(name: string, callback: (alert: Alert) => void): void {
    this.alertCallbacks.set(name, callback);
  }

  /**
   * Удаление callback'а для алертов
   */
  offAlert(name: string): void {
    this.alertCallbacks.delete(name);
  }

  /**
   * Ручная запись бизнес-метрики
   */
  track(name: string, value = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name: `business.${name}`,
      type: 'business',
      category: 'user',
      value,
      timestamp: Date.now(),
      unit: 'count',
      tags,
    });
  }

  /**
   * Замер времени выполнения
   */
  timeSync<T>(name: string, fn: () => T): T {
    const startTime = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        type: 'performance',
        category: 'timing',
        value: duration,
        timestamp: Date.now(),
        unit: 'ms',
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        type: 'performance',
        category: 'timing',
        value: duration,
        timestamp: Date.now(),
        unit: 'ms',
        tags: { error: 'true' },
      });
      throw error;
    }
  }

  /**
   * Замер времени выполнения асинхронных функций
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        type: 'performance',
        category: 'timing',
        value: duration,
        timestamp: Date.now(),
        unit: 'ms',
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        type: 'performance',
        category: 'timing',
        value: duration,
        timestamp: Date.now(),
        unit: 'ms',
        tags: { error: 'true' },
      });
      throw error;
    }
  }

  /**
   * Начало замера времени
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        type: 'performance',
        category: 'timing',
        value: duration,
        timestamp: Date.now(),
        unit: 'ms',
      });
    };
  }

  /**
   * Получение агрегированных метрик
   */
  getAggregatedMetrics(): Map<
    string,
    {
      count: number;
      sum: number;
      min: number;
      max: number;
      avg: number;
      last: number;
    }
  > {
    return new Map(this.aggregatedMetrics);
  }

  /**
   * Получение активных алертов
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Разрешение алерта
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.debug('Alert resolved:', alert);
    }
  }

  /**
   * Отправка метрик на сервер
   */
  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.alertsBuffer.length === 0) {
      return;
    }

    const payload = {
      session: this.currentSession.sessionId,
      timestamp: Date.now(),
      metrics: [...this.metricsBuffer],
      alerts: [...this.alertsBuffer],
    };

    // Очищаем буферы
    this.metricsBuffer.length = 0;
    this.alertsBuffer.length = 0;

    try {
      // Отправляем метрики
      if (this.config.endpoints.metrics) {
        await fetch(this.config.endpoints.metrics, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      this.debug('Metrics flushed successfully');
    } catch (error) {
      this.debug('Failed to flush metrics:', error);

      // В случае ошибки сохраняем в localStorage
      this.saveToLocalStorage(payload);
    }
  }

  /**
   * Сохранение в localStorage при ошибках отправки
   */
  private saveToLocalStorage(payload: {
    session: string;
    timestamp: number;
    metrics: Metric[];
    alerts: Alert[];
  }): void {
    try {
      const key = `monitoring_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(payload));

      // Ограничиваем количество сохраненных записей
      const keys = Object.keys(localStorage).filter(k => k.startsWith('monitoring_'));
      if (keys.length > 10) {
        keys
          .sort()
          .slice(0, keys.length - 10)
          .forEach(k => {
            localStorage.removeItem(k);
          });
      }
    } catch (error) {
      this.debug('Failed to save to localStorage:', error);
    }
  }

  /**
   * Автоматический flush
   */
  private startAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Завершение сессии
   */
  private endSession(): void {
    this.currentSession.endTime = Date.now();

    // Записываем финальную метрику длительности сессии
    this.recordMetric({
      name: 'session.duration',
      type: 'business',
      category: 'user',
      value: this.currentSession.endTime - this.currentSession.startTime,
      timestamp: Date.now(),
      unit: 'ms',
    });
  }

  /**
   * Получение статистики сессии
   */
  getSessionStats() {
    const session = this.currentSession;
    const duration = (session.endTime || Date.now()) - session.startTime;

    return {
      sessionId: session.sessionId,
      duration,
      metricsCount: session.metrics.length,
      alertsCount: session.alerts.length,
      errorCount: session.metrics.filter(m => m.name.includes('error')).length,
      performanceScore: this.calculatePerformanceScore(session.metrics),
    };
  }

  /**
   * Вычисление общего скора производительности
   */
  private calculatePerformanceScore(metrics: Metric[]): number {
    const vitals = metrics.filter(m => m.name.startsWith('vitals.'));
    if (vitals.length === 0) return 100;

    let score = 100;

    vitals.forEach(metric => {
      if (metric.name === 'vitals.lcp' && metric.value > 2500) {
        score -= 20;
      } else if (metric.name === 'vitals.fid' && metric.value > 100) {
        score -= 20;
      } else if (metric.name === 'vitals.cls' && metric.value > 0.1) {
        score -= 20;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Вспомогательные методы
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Здесь должна быть логика получения ID текущего пользователя
    return undefined;
  }

  private debug(...args: unknown[]): void {
    if (this.config.enableDebug && typeof window !== 'undefined' && window.console) {
      window.console.log('[Monitoring]', ...args);
    }
  }

  /**
   * Уничтожение экземпляра
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.memoryObserver) {
      clearInterval(this.memoryObserver);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.endSession();
    this.flush();

    this.metricsBuffer.length = 0;
    this.alertsBuffer.length = 0;
    this.aggregatedMetrics.clear();
    this.activeAlerts.clear();
    this.alertCallbacks.clear();
  }
}

/**
 * Фабрика для создания конфигураций мониторинга
 */
export class MonitoringConfigFactory {
  /**
   * Конфигурация для разработки
   */
  static createDevelopmentConfig(): Partial<MonitoringConfig> {
    return {
      enabledCategories: ['performance', 'system', 'business'],
      sampleRate: 1.0,
      bufferSize: 50,
      flushInterval: 10000, // 10 секунд
      enableDebug: true,
      thresholds: {
        'page.load': { warning: 3000, critical: 6000 },
        'api.response': { warning: 2000, critical: 5000 },
        'memory.usage': { warning: 85, critical: 95 },
      },
    };
  }

  /**
   * Конфигурация для продакшена
   */
  static createProductionConfig(): Partial<MonitoringConfig> {
    return {
      enabledCategories: ['performance', 'system', 'business'],
      sampleRate: 0.1, // 10% sampling
      bufferSize: 100,
      flushInterval: 30000, // 30 секунд
      enableDebug: false,
      thresholds: {
        'page.load': { warning: 2000, critical: 4000 },
        'api.response': { warning: 1000, critical: 2500 },
        'memory.usage': { warning: 80, critical: 90 },
      },
    };
  }

  /**
   * Конфигурация для аналитики
   */
  static createAnalyticsConfig(): Partial<MonitoringConfig> {
    return {
      enabledCategories: ['business'],
      sampleRate: 1.0,
      bufferSize: 200,
      flushInterval: 60000, // 1 минута
      enableDebug: false,
    };
  }
}

// Глобальный экземпляр мониторинга
export const monitoring = new AdvancedMonitoringSystem(
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? MonitoringConfigFactory.createProductionConfig()
    : MonitoringConfigFactory.createDevelopmentConfig()
);
