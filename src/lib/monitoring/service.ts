import type {
  CustomMetric,
  ErrorEvent,
  MonitoringConfig,
  PerformanceMetric,
  UserAction,
  WebVitalsMetric,
} from './types.js';

export class MonitoringService {
  private config: MonitoringConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private flushTimer: number | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableCustomMetrics: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      flushInterval: 30000, // 30 секунд
      maxBatchSize: 50,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableWebVitals) {
      this.initializeWebVitals();
    }

    if (this.config.enableErrorTracking) {
      this.initializeErrorTracking();
    }

    if (this.config.enableUserTracking) {
      this.initializeUserTracking();
    }

    // Запускаем периодическую отправку метрик
    this.startFlushTimer();

    // Отправляем метрики при закрытии страницы
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private initializeWebVitals(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordWebVital('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch {
      // Ignore if not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            const delay = fidEntry.processingStart - fidEntry.startTime;
            this.recordWebVital('FID', delay);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch {
      // Ignore if not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    try {
      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
            this.recordWebVital('CLS', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      // Ignore if not supported
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.recordWebVital('FCP', fcpEntry.startTime);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch {
      // Ignore if not supported
    }

    // Time to First Byte (TTFB)
    if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      this.recordWebVital('TTFB', ttfb);
    }

    // Memory usage (если доступно)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory.used', memory.usedJSHeapSize, {
          category: 'performance',
          unit: 'bytes',
        });
        this.recordMetric('memory.total', memory.totalJSHeapSize, {
          category: 'performance',
          unit: 'bytes',
        });
      }, 10000);
    }
  }

  private initializeErrorTracking(): void {
    // Глобальные ошибки JavaScript
    window.addEventListener('error', event => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    // Необработанные Promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });
  }

  private initializeUserTracking(): void {
    // Отслеживание кликов
    document.addEventListener('click', event => {
      const target = event.target as Element;
      this.recordUserAction({
        action: 'click',
        target: this.getElementSelector(target),
        timestamp: Date.now(),
        sessionId: this.sessionId,
      });
    });

    // Отслеживание времени на странице
    const pageLoadTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - pageLoadTime;
      this.recordMetric('page.time_spent', timeOnPage, {
        category: 'user',
        unit: 'ms',
        page: window.location.pathname,
      });
    });

    // Отслеживание скролла
    let scrollDepth = 0;
    window.addEventListener('scroll', () => {
      const currentScrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (currentScrollDepth > scrollDepth) {
        scrollDepth = currentScrollDepth;
        this.recordMetric('page.scroll_depth', scrollDepth, {
          category: 'user',
          unit: 'percent',
          page: window.location.pathname,
        });
      }
    });
  }

  public recordWebVital(type: WebVitalsMetric['vitalsType'], value: number): void {
    const rating = this.getWebVitalRating(type, value);

    const metric: WebVitalsMetric = {
      name: `web_vitals.${type.toLowerCase()}`,
      value,
      timestamp: Date.now(),
      tags: {
        type,
        rating,
        page: window.location.pathname,
        session: this.sessionId,
      },
      vitalsType: type,
      rating,
      unit: this.getWebVitalUnit(type),
    };

    this.metrics.push(metric);
    this.checkFlush();
  }

  public recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        session: this.sessionId,
        page: window.location.pathname,
      },
      category: (tags.category as CustomMetric['category']) || 'custom',
    };

    this.metrics.push(metric);
    this.checkFlush();
  }

  public recordError(error: ErrorEvent): void {
    // Сохраняем ошибку как метрику
    this.recordMetric('error.count', 1, {
      category: 'error',
      message: error.message.substring(0, 100), // Ограничиваем длину
      filename: error.filename || 'unknown',
    });

    // Сохраняем полную информацию об ошибке
    const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
    errorLogs.push(error);

    // Храним только последние 50 ошибок
    if (errorLogs.length > 50) {
      errorLogs.shift();
    }

    localStorage.setItem('error_logs', JSON.stringify(errorLogs));
  }

  public recordUserAction(action: UserAction): void {
    // Сохраняем действие как метрику
    this.recordMetric('user.action', 1, {
      category: 'user',
      action: action.action,
      target: action.target || 'unknown',
    });

    // Сохраняем в локальное хранилище для аналитики
    const userActions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    userActions.push(action);

    // Храним только последние 100 действий
    if (userActions.length > 100) {
      userActions.shift();
    }

    localStorage.setItem('user_actions', JSON.stringify(userActions));
  }

  public async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      if (this.config.endpoint) {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: metricsToSend,
            timestamp: Date.now(),
            sessionId: this.sessionId,
          }),
        });
      } else {
        // Если нет endpoint, сохраняем в localStorage
        const storedMetrics = JSON.parse(localStorage.getItem('app_metrics') || '[]');
        storedMetrics.push(...metricsToSend);

        // Храним только последние 1000 метрик
        if (storedMetrics.length > 1000) {
          storedMetrics.splice(0, storedMetrics.length - 1000);
        }

        localStorage.setItem('app_metrics', JSON.stringify(storedMetrics));
      }
    } catch (error) {
      // Возвращаем метрики обратно при ошибке
      this.metrics.unshift(...metricsToSend);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getStoredMetrics(): PerformanceMetric[] {
    return JSON.parse(localStorage.getItem('app_metrics') || '[]');
  }

  public clearMetrics(): void {
    this.metrics = [];
    localStorage.removeItem('app_metrics');
    localStorage.removeItem('error_logs');
    localStorage.removeItem('user_actions');
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  // Приватные методы

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getWebVitalRating(
    type: WebVitalsMetric['vitalsType'],
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[type];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getWebVitalUnit(type: WebVitalsMetric['vitalsType']): string {
    return type === 'CLS' ? 'score' : 'ms';
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private startFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private checkFlush(): void {
    if (this.metrics.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }
}

// Глобальный экземпляр мониторинга
export const monitoring = new MonitoringService();
