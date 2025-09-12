/**
 * OrchestratorIntegration - модуль для интеграции EapDebugger с AnalysisOrchestrator
 * Автоматически открывает отладочный HTML при запуске анализа
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from '../EapDebugger.js';

export interface OrchestratorHooks {
  onAnalysisStart?: (orchestrator: any) => Promise<void>;
  onAnalysisComplete?: (orchestrator: any, results?: any) => Promise<void>;
  onComponentRegistered?: (orchestrator: any, componentName: string) => Promise<void>;
}

/**
 * Класс для интеграции EapDebugger с AnalysisOrchestrator
 */
export class OrchestratorIntegration {
  private static instance: OrchestratorIntegration;
  private eapDebugger: EapDebugger;
  private isEnabled: boolean = true;
  private autoOpenBrowser: boolean = true;
  private debugHtmlPath: string;

  private constructor() {
    this.eapDebugger = new EapDebugger();
    this.debugHtmlPath = './eap-live-debug.html';
  }

  /**
   * Singleton pattern для глобального доступа
   */
  public static getInstance(): OrchestratorIntegration {
    if (!OrchestratorIntegration.instance) {
      OrchestratorIntegration.instance = new OrchestratorIntegration();
    }
    return OrchestratorIntegration.instance;
  }

  /**
   * Включает/выключает автоматическую отладку
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Включает/выключает автоматическое открытие браузера
   */
  public setAutoOpenBrowser(autoOpen: boolean): void {
    this.autoOpenBrowser = autoOpen;
  }

  /**
   * Устанавливает путь для HTML файла отладки
   */
  public setDebugHtmlPath(path: string): void {
    this.debugHtmlPath = path;
  }

  /**
   * Хук для вызова при старте анализа
   */
  public async onAnalysisStart(orchestrator: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      console.log('🚀 EAP Integration: Анализ начат, генерируем отладочный HTML...');

      if (this.autoOpenBrowser) {
        await this.eapDebugger.generateComponentsHtmlWithAutoOpen(
          orchestrator,
          this.debugHtmlPath,
          true
        );
      } else {
        await this.eapDebugger.generateComponentsHtml(orchestrator, this.debugHtmlPath);
      }

      // Запускаем автообновление каждые 3 секунды во время анализа
      this.eapDebugger.startAutoRefresh(orchestrator, this.debugHtmlPath, 3000);
    } catch (error) {
      console.error('❌ EAP Integration: Ошибка при генерации отладочного HTML:', error);
    }
  }

  /**
   * Хук для вызова при завершении анализа
   */
  public async onAnalysisComplete(orchestrator: any, _results?: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      console.log('✅ EAP Integration: Анализ завершен, обновляем отладочный HTML...');

      // Останавливаем автообновление
      this.eapDebugger.stopAutoRefresh();

      // Финальное обновление HTML с результатами
      await this.eapDebugger.generateComponentsHtml(orchestrator, this.debugHtmlPath);

      console.log(`📄 EAP Integration: Отладочный HTML доступен по пути: ${this.debugHtmlPath}`);
    } catch (error) {
      console.error('❌ EAP Integration: Ошибка при финальном обновлении HTML:', error);
    }
  }

  /**
   * Хук для вызова при регистрации нового компонента
   */
  public async onComponentRegistered(orchestrator: any, componentName: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      console.log(`🔧 EAP Integration: Зарегистрирован компонент: ${componentName}`);

      // Обновляем HTML при добавлении нового компонента
      await this.eapDebugger.generateComponentsHtml(orchestrator, this.debugHtmlPath);
    } catch (error) {
      console.error(
        '❌ EAP Integration: Ошибка при обновлении HTML после регистрации компонента:',
        error
      );
    }
  }

  /**
   * Создает объект с хуками для удобной интеграции
   */
  public getHooks(): OrchestratorHooks {
    return {
      onAnalysisStart: this.onAnalysisStart.bind(this),
      onAnalysisComplete: this.onAnalysisComplete.bind(this),
      onComponentRegistered: this.onComponentRegistered.bind(this),
    };
  }

  /**
   * Быстрая настройка интеграции
   */
  public static setupQuickIntegration(
    autoOpenBrowser = true,
    htmlPath = './eap-live-debug.html'
  ): OrchestratorHooks {
    const integration = OrchestratorIntegration.getInstance();
    integration.setAutoOpenBrowser(autoOpenBrowser);
    integration.setDebugHtmlPath(htmlPath);
    return integration.getHooks();
  }

  /**
   * Принудительная генерация отладочного HTML (ручной вызов)
   */
  public async generateDebugHtmlNow(orchestrator: any, openInBrowser = false): Promise<string> {
    if (openInBrowser) {
      return await this.eapDebugger.generateComponentsHtmlWithAutoOpen(
        orchestrator,
        this.debugHtmlPath,
        true
      );
    } else {
      return await this.eapDebugger.generateComponentsHtml(orchestrator, this.debugHtmlPath);
    }
  }

  /**
   * Cleanup при завершении работы
   */
  public destroy(): void {
    this.eapDebugger.destroy();
  }
}
