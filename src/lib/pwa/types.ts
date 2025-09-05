export interface PWAConfig {
  enabled: boolean;
  manifestPath: string;
  swPath: string;
  registration: ServiceWorkerRegistration | null;
  updateInterval: number;
  notificationConfig: NotificationConfig;
  installPrompt: InstallPromptConfig;
  cacheStrategy: CacheStrategy;
}

export interface NotificationConfig {
  enabled: boolean;
  icon: string;
  badge: string;
  defaultOptions: NotificationOptions;
  permission: NotificationPermission;
}

export interface InstallPromptConfig {
  enabled: boolean;
  showAfterVisits: number;
  dismissAfterDays: number;
  customText?: string;
}

export interface CacheStrategy {
  name: string;
  version: string;
  staticAssets: string[];
  dynamicCaching: boolean;
  maxDynamicEntries: number;
  networkFirst: string[];
  cacheFirst: string[];
  staleWhileRevalidate: string[];
}

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  changelog?: string;
  forceUpdate?: boolean;
}

export interface InstallInfo {
  canInstall: boolean;
  installed: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface SyncTask {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export type PWAEventType =
  | 'install'
  | 'update'
  | 'offline'
  | 'online'
  | 'notification'
  | 'sync'
  | 'error';

export interface PWAEvent {
  type: PWAEventType;
  data?: unknown;
  timestamp: number;
}

export type PWAEventHandler = (event: PWAEvent) => void;
