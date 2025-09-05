export interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    tokenKey: string;
    refreshInterval: number;
    loginPath: string;
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
  };
  features: {
    enableAnalytics: boolean;
    enableSentry: boolean;
    enablePWA: boolean;
    enableDevTools: boolean;
  };
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  analytics: {
    trackingId: string;
    enablePageViews: boolean;
    enableEvents: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    enableAnimations: boolean;
  };
  development: {
    enableMocks: boolean;
    apiDelay: number;
    showDebugInfo: boolean;
  };
}
