import type {
  InstallInfo,
  NetworkStatus,
  PWAConfig,
  PWAEvent,
  PWAEventHandler,
  SyncTask,
  UpdateInfo,
} from './types.js';

export class PWAManager {
  private config: PWAConfig;
  private eventHandlers: Map<string, PWAEventHandler[]> = new Map();
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private syncTasks: Map<string, SyncTask> = new Map();
  private networkStatus: NetworkStatus = { online: navigator.onLine };

  constructor(config?: Partial<PWAConfig>) {
    this.config = this.createDefaultConfig(config);
    this.initialize();
  }

  private createDefaultConfig(overrides?: Partial<PWAConfig>): PWAConfig {
    return {
      enabled: true,
      manifestPath: '/manifest.json',
      swPath: '/sw.js',
      registration: null,
      updateInterval: 60000, // 1 минута
      notificationConfig: {
        enabled: true,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        defaultOptions: {
          requireInteraction: true,
          tag: 'default',
        },
        permission: 'default',
      },
      installPrompt: {
        enabled: true,
        showAfterVisits: 3,
        dismissAfterDays: 7,
      },
      cacheStrategy: {
        name: 'app-cache',
        version: '1.0.0',
        staticAssets: ['/', '/index.html', '/styles.css', '/app.js'],
        dynamicCaching: true,
        maxDynamicEntries: 50,
        networkFirst: ['/api/'],
        cacheFirst: ['/assets/', '/images/'],
        staleWhileRevalidate: ['/'],
      },
      ...overrides,
    };
  }

  private async initialize(): Promise<void> {
    if (!this.config.enabled || !this.isSupported()) {
      return;
    }

    await this.registerServiceWorker();
    this.setupEventListeners();
    this.setupNetworkMonitoring();
    this.setupInstallPrompt();
    this.requestNotificationPermission();
    this.startUpdateCheck();
  }

  private isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register(this.config.swPath);
      this.config.registration = registration;

      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Проверяем активный SW
      if (registration.active) {
        this.emitEvent('install', { registration });
      }

      // Service Worker успешно зарегистрирован
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.emitEvent('error', { error, context: 'sw-registration' });
    }
  }

  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Новая версия доступна
          this.emitEvent('update', {
            hasUpdate: true,
            registration,
          });
        }
      }
    });
  }

  private setupEventListeners(): void {
    // Обработка сообщений от Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Обработка beforeinstallprompt
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.checkInstallPromptConditions();
    });

    // Обработка изменения состояния приложения
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emitEvent('install', { installed: true });
    });
  }

  private setupNetworkMonitoring(): void {
    const updateNetworkStatus = () => {
      const wasOnline = this.networkStatus.online;
      this.networkStatus.online = navigator.onLine;

      if ('connection' in navigator) {
        const connection = (navigator as unknown as { connection: NetworkInformation }).connection;
        this.networkStatus.effectiveType = connection.effectiveType;
        this.networkStatus.downlink = connection.downlink;
        this.networkStatus.rtt = connection.rtt;
      }

      if (wasOnline !== this.networkStatus.online) {
        this.emitEvent(this.networkStatus.online ? 'online' : 'offline', this.networkStatus);

        if (this.networkStatus.online) {
          this.processPendingSyncTasks();
        }
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if ('connection' in navigator) {
      (navigator as unknown as { connection: NetworkInformation }).connection.addEventListener(
        'change',
        updateNetworkStatus
      );
    }

    updateNetworkStatus();
  }

  private setupInstallPrompt(): void {
    if (!this.config.installPrompt.enabled) return;

    const visits = this.getVisitCount();
    const lastDismissed = this.getLastDismissed();
    const daysSinceDismiss = lastDismissed
      ? Math.floor((Date.now() - lastDismissed) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (
      visits >= this.config.installPrompt.showAfterVisits &&
      daysSinceDismiss >= this.config.installPrompt.dismissAfterDays
    ) {
      this.showInstallPrompt();
    }

    this.incrementVisitCount();
  }

  private async requestNotificationPermission(): Promise<void> {
    if (!this.config.notificationConfig.enabled) return;

    try {
      const permission = await Notification.requestPermission();
      this.config.notificationConfig.permission = permission;

      if (permission === 'granted') {
        // Разрешение на уведомления получено
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  private startUpdateCheck(): void {
    setInterval(async () => {
      await this.checkForUpdates();
    }, this.config.updateInterval);
  }

  // Публичные методы

  async checkForUpdates(): Promise<UpdateInfo> {
    if (!this.config.registration) {
      return { hasUpdate: false };
    }

    try {
      await this.config.registration.update();

      return {
        hasUpdate: Boolean(this.config.registration.waiting),
        version: await this.getVersion(),
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false };
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.config.registration?.waiting) return;

    this.config.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Перезагружаем страницу после активации
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  getInstallInfo(): InstallInfo {
    const canInstall = Boolean(this.installPrompt);
    const installed = window.matchMedia('(display-mode: standalone)').matches;

    let platform: InstallInfo['platform'] = 'unknown';

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      platform = 'ios';
    } else if (/Android/.test(navigator.userAgent)) {
      platform = 'android';
    } else {
      platform = 'desktop';
    }

    return {
      canInstall,
      installed,
      platform,
    };
  }

  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      const result = await this.installPrompt.prompt();
      const accepted = result.outcome === 'accepted';

      if (accepted) {
        this.installPrompt = null;
      }

      return accepted;
    } catch (error) {
      console.error('Error during installation:', error);
      return false;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.config.notificationConfig.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notificationOptions = {
      ...this.config.notificationConfig.defaultOptions,
      ...options,
      icon: options?.icon || this.config.notificationConfig.icon,
      badge: options?.badge || this.config.notificationConfig.badge,
    };

    if (this.config.registration) {
      await this.config.registration.showNotification(title, notificationOptions);
    } else {
      new Notification(title, notificationOptions);
    }

    this.emitEvent('notification', { title, options: notificationOptions });
  }

  addSyncTask(task: Omit<SyncTask, 'timestamp' | 'retries'>): void {
    const syncTask: SyncTask = {
      ...task,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncTasks.set(task.id, syncTask);

    if (this.networkStatus.online) {
      this.processSyncTask(syncTask);
    }
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  isOnline(): boolean {
    return this.networkStatus.online;
  }

  isInstalled(): boolean {
    return this.getInstallInfo().installed;
  }

  // Обработчики событий

  on(event: string, handler: PWAEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: PWAEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(type: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const event: PWAEvent = {
        type: type as PWAEvent['type'],
        data,
        timestamp: Date.now(),
      };

      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in PWA event handler for ${type}:`, error);
        }
      });
    }
  }

  // Приватные утилиты

  private handleServiceWorkerMessage(data: unknown): void {
    if (typeof data === 'object' && data && 'type' in data) {
      const message = data as { type: string; [key: string]: unknown };

      switch (message.type) {
        case 'CACHE_UPDATED':
          this.emitEvent('update', data);
          break;
        case 'SYNC_COMPLETE':
          if ('taskId' in message && typeof message.taskId === 'string') {
            this.handleSyncComplete({ taskId: message.taskId });
          }
          break;
        default:
          // Неизвестное сообщение от SW
          break;
      }
    }
  }

  private async processPendingSyncTasks(): Promise<void> {
    for (const task of this.syncTasks.values()) {
      await this.processSyncTask(task);
    }
  }

  private async processSyncTask(task: SyncTask): Promise<void> {
    try {
      // Отправляем задачу в Service Worker для обработки
      if (this.config.registration?.active) {
        this.config.registration.active.postMessage({
          type: 'BACKGROUND_SYNC',
          task,
        });
      }
    } catch (error) {
      console.error('Error processing sync task:', error);

      task.retries++;
      if (task.retries >= task.maxRetries) {
        this.syncTasks.delete(task.id);
        this.emitEvent('error', {
          error,
          context: 'sync-task',
          taskId: task.id,
        });
      }
    }
  }

  private handleSyncComplete(data: { taskId: string }): void {
    this.syncTasks.delete(data.taskId);
    this.emitEvent('sync', data);
  }

  private showInstallPrompt(): void {
    // Создаем собственный UI для установки
    const promptElement = document.createElement('div');
    promptElement.className = 'pwa-install-prompt';
    promptElement.innerHTML = `
      <div class="pwa-install-content">
        <h3>${this.config.installPrompt.customText || 'Установить приложение'}</h3>
        <p>Установите наше приложение для быстрого доступа с домашнего экрана</p>
        <div class="pwa-install-buttons">
          <button class="pwa-install-yes">Установить</button>
          <button class="pwa-install-no">Позже</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-prompt {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        padding: 16px;
        max-width: 400px;
        margin: 0 auto;
      }
      .pwa-install-content h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }
      .pwa-install-content p {
        margin: 0 0 16px 0;
        color: #666;
      }
      .pwa-install-buttons {
        display: flex;
        gap: 8px;
      }
      .pwa-install-buttons button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .pwa-install-yes {
        background: #007bff;
        color: white;
      }
      .pwa-install-no {
        background: #f8f9fa;
        color: #666;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(promptElement);

    // Обработчики кнопок
    promptElement.querySelector('.pwa-install-yes')?.addEventListener('click', async () => {
      try {
        await this.install();
      } catch (error) {
        console.error('Install failed:', error);
      }
      document.body.removeChild(promptElement);
      document.head.removeChild(style);
    });

    promptElement.querySelector('.pwa-install-no')?.addEventListener('click', () => {
      this.dismissInstallPrompt();
      document.body.removeChild(promptElement);
      document.head.removeChild(style);
    });
  }

  private checkInstallPromptConditions(): void {
    if (this.config.installPrompt.enabled && !this.getInstallInfo().installed) {
      this.showInstallPrompt();
    }
  }

  private getVisitCount(): number {
    return parseInt(localStorage.getItem('pwa-visit-count') || '0');
  }

  private incrementVisitCount(): void {
    const count = this.getVisitCount() + 1;
    localStorage.setItem('pwa-visit-count', count.toString());
  }

  private getLastDismissed(): number | null {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    return dismissed ? parseInt(dismissed) : null;
  }

  private dismissInstallPrompt(): void {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  private async getVersion(): Promise<string> {
    try {
      const response = await fetch('/version.json');
      const data = await response.json();
      return data.version || this.config.cacheStrategy.version;
    } catch {
      return this.config.cacheStrategy.version;
    }
  }

  // Получение конфигурации
  getConfig(): PWAConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Типы для TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  addEventListener(type: string, listener: EventListener): void;
}
