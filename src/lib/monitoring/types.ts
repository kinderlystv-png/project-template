export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  unit?: string;
}

export interface WebVitalsMetric extends PerformanceMetric {
  vitalsType: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export interface CustomMetric extends PerformanceMetric {
  category: 'performance' | 'business' | 'error' | 'user';
}

export interface MonitoringConfig {
  enableWebVitals: boolean;
  enableCustomMetrics: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
  flushInterval: number;
  maxBatchSize: number;
  endpoint?: string;
}

export interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface UserAction {
  action: string;
  target?: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}
