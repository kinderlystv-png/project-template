/**
 * EapDebugger - основной класс для отладки EAP компонентов
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ComponentRegistry } from './core/ComponentRegistry.js';
import { HtmlGenerator } from './core/HtmlGenerator.js';
import { DebuggerState } from './models/Component.js';

const execAsync = promisify(exec);

// Простой logger для debugger'а
class Logger {
  static log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  static error(message: string, error?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
}

export class EapDebugger {
  private componentRegistry: ComponentRegistry;
  private htmlGenerator: HtmlGenerator;
  private state: DebuggerState;
  private refreshInterval?: NodeJS.Timeout;

  constructor() {
    this.componentRegistry = new ComponentRegistry();
    this.htmlGenerator = new HtmlGenerator();
    this.state = {
      components: {
        checkers: [],
        modules: [],
        totalCount: 0,
        lastUpdated: new Date(),
      },
      autoRefresh: true,
      refreshInterval: 5000, // 5 секунд
    };
  }

  /**
   * Открывает HTML файл в браузере по умолчанию
   */
  private static async openInBrowser(htmlPath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(htmlPath);
      let command: string;

      // Определяем команду в зависимости от операционной системы
      switch (process.platform) {
        case 'win32':
          command = `start "" "${absolutePath}"`;
          break;
        case 'darwin':
          command = `open "${absolutePath}"`;
          break;
        default:
          command = `xdg-open "${absolutePath}"`;
          break;
      }

      await execAsync(command);
      Logger.log(`🌐 EAP Debugger: Открыт в браузере - ${absolutePath}`);
    } catch (error) {
      Logger.error('❌ Не удалось открыть файл в браузере:', error);
    }
  }

  /**
   * Генерирует HTML файл с информацией о зарегистрированных компонентах
   * и автоматически открывает в браузере
   */
  public async generateComponentsHtmlWithAutoOpen(
    orchestrator: Record<string, unknown>,
    outputPath?: string,
    openInBrowser = true
  ): Promise<string> {
    const html = await this.generateComponentsHtml(orchestrator, outputPath);

    if (openInBrowser && outputPath) {
      await EapDebugger.openInBrowser(outputPath);
    }

    return html;
  }
  public async generateComponentsHtml(
    orchestrator: Record<string, unknown>,
    outputPath?: string
  ): Promise<string> {
    // Получаем данные о компонентах
    const registration = this.componentRegistry.getRegisteredComponents(orchestrator);
    this.state.components = registration;

    // Генерируем HTML
    const html = await this.htmlGenerator.generateHtml(registration);

    // Сохраняем в файл если указан путь
    if (outputPath) {
      await this.htmlGenerator.saveHtml(html, outputPath);
      this.state.htmlPath = outputPath;
      Logger.log(`🔍 EAP Debugger: HTML сохранен в ${outputPath}`);
    }

    return html;
  }

  /**
   * Запускает автоматическое обновление HTML файла
   */
  public startAutoRefresh(
    orchestrator: Record<string, unknown>,
    outputPath: string,
    intervalMs?: number
  ): void {
    this.stopAutoRefresh(); // Останавливаем предыдущий интервал

    const interval = intervalMs || this.state.refreshInterval;

    this.refreshInterval = setInterval(async () => {
      try {
        await this.generateComponentsHtml(orchestrator, outputPath);
        Logger.log(`🔄 EAP Debugger: Auto-refresh completed at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        Logger.error('❌ EAP Debugger: Auto-refresh error:', error);
      }
    }, interval);

    Logger.log(`🚀 EAP Debugger: Auto-refresh started (${interval}ms interval)`);
  }

  /**
   * Останавливает автоматическое обновление
   */
  public stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
      Logger.log('⏹️ EAP Debugger: Auto-refresh stopped');
    }
  }

  /**
   * Получает статистику компонентов
   */
  public getComponentStats() {
    return this.componentRegistry.getComponentStats(this.state.components);
  }

  /**
   * Получает текущее состояние debugger'а
   */
  public getState(): DebuggerState {
    return { ...this.state };
  }

  /**
   * Создает дефолтный путь для HTML файла
   */
  public static getDefaultHtmlPath(): string {
    return path.resolve(process.cwd(), 'eap-debugger-components.html');
  }

  /**
   * Создает быстрый метод для одноразовой генерации HTML
   */
  public static async quickGenerate(
    orchestrator: Record<string, unknown>,
    outputPath?: string,
    openInBrowser = false
  ): Promise<string> {
    const eapDebugger = new EapDebugger();
    const htmlPath = outputPath || EapDebugger.getDefaultHtmlPath();

    const html = await eapDebugger.generateComponentsHtml(orchestrator, htmlPath);

    if (openInBrowser) {
      await EapDebugger.openInBrowser(htmlPath);
    }

    return html;
  }

  /**
   * Создает быстрый метод для генерации HTML с автоматическим открытием в браузере
   */
  public static async quickGenerateAndOpen(
    orchestrator: Record<string, unknown>,
    outputPath?: string
  ): Promise<string> {
    return await EapDebugger.quickGenerate(orchestrator, outputPath, true);
  }

  /**
   * Публичный метод для получения регистрации компонентов
   */
  public getComponentRegistration(orchestrator: Record<string, unknown>) {
    return this.componentRegistry.getRegisteredComponents(orchestrator);
  }

  /**
   * Запускает анализ проекта и показывает результаты в HTML
   */
  public static async runAnalysisAndShow(
    orchestrator: Record<string, unknown>,
    projectPath: string,
    outputPath?: string
  ): Promise<string> {
    const finalOutputPath = outputPath || './eap-analysis-results.html';

    Logger.log(`🚀 EAP Debugger: Запуск анализа проекта ${projectPath}...`);

    try {
      // Запускаем анализ проекта
      Logger.log('📊 Выполнение анализа...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analysisResult = await (orchestrator as any).analyzeProject(projectPath);

      Logger.log(`✅ Анализ завершен! Общая оценка: ${analysisResult.summary.overallScore}/100`);

      // Создаем дебаггер для генерации HTML с результатами
      const eapDebugger = new EapDebugger();

      // Получаем данные о компонентах с результатами анализа
      const registration = eapDebugger.componentRegistry.getRegisteredComponents(orchestrator);

      // Обогащаем данные результатами анализа
      eapDebugger.enrichWithAnalysisResults(registration, analysisResult);

      // Обновляем состояние
      eapDebugger.state.components = registration;
      eapDebugger.state.analysisResult = analysisResult;
      eapDebugger.state.projectPath = projectPath;

      // Генерируем HTML с результатами
      const html = await eapDebugger.htmlGenerator.generateHtmlWithResults(
        registration,
        analysisResult,
        projectPath
      );

      // Сохраняем и открываем
      await eapDebugger.htmlGenerator.saveHtml(html, finalOutputPath);
      await EapDebugger.openInBrowser(finalOutputPath);

      Logger.log(`🔍 EAP Debugger: HTML с результатами анализа сохранен в ${finalOutputPath}`);
      Logger.log('🌐 EAP Debugger: Открыт в браузере с результатами диагностики!');

      return html;
    } catch (error) {
      Logger.error('❌ EAP Debugger: Ошибка при анализе:', error);
      throw error;
    }
  }

  /**
   * Обогащает данные о компонентах результатами анализа
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private enrichWithAnalysisResults(registration: any, analysisResult: any): void {
    // Добавляем результаты к чекерам
    if (analysisResult.checks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registration.checkers.forEach((checker: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = analysisResult.checks.find((check: any) => check.checker === checker.id);
        if (result) {
          checker.analysisResult = result;
          checker.lastRun = new Date();
          checker.status = result.passed ? 'passed' : 'failed';
        }
      });
    }

    // Добавляем результаты к модулям
    if (analysisResult.modules) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registration.modules.forEach((module: any) => {
        const result = analysisResult.modules[module.id];
        if (result) {
          module.analysisResult = result;
          module.lastRun = new Date();
          module.status = 'completed';
        }
      });
    }
  } /**
   * Cleanup метод для корректного завершения работы
   */
  public destroy(): void {
    this.stopAutoRefresh();
    Logger.log('🧹 EAP Debugger: Cleanup completed');
  }
}

// Экспортируем также Logger для использования вне класса
export { Logger };
