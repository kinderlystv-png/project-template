/**
 * Генератор HTML страниц для EAP Debugger
 * Генерирует HTML на основе шаблона и данных о компонентах
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ComponentRegistration, DebuggerComponent } from '../models/Component.js';

export class HtmlGenerator {
  private templatePath: string;

  constructor() {
    // Получаем путь к директории eap-debugger независимо от того, откуда запускается
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    // Идем вверх от core/ к eap-debugger/, затем к templates/
    this.templatePath = path.resolve(currentDir, '..', 'templates', 'components.html');
  }

  /**
   * Генерирует HTML страницу с данными о компонентах
   */
  public async generateHtml(registration: ComponentRegistration): Promise<string> {
    let template = await this.loadTemplate();

    // Объединяем все компоненты
    const allComponents = [...registration.checkers, ...registration.modules];

    // Заменяем плейсхолдеры в шаблоне (используем глобальную замену)
    template = template.replace(
      /\{\{COMPONENTS_LIST\}\}/g,
      this.generateComponentsList(allComponents)
    );
    template = template.replace(/\{\{TOTAL_COUNT\}\}/g, registration.totalCount.toString());
    template = template.replace(/\{\{CHECKERS_COUNT\}\}/g, registration.checkers.length.toString());
    template = template.replace(/\{\{MODULES_COUNT\}\}/g, registration.modules.length.toString());
    template = template.replace(
      /\{\{CHECKERS_LIST\}\}/g,
      this.generateComponentsList(registration.checkers)
    );
    template = template.replace(
      /\{\{MODULES_LIST\}\}/g,
      this.generateComponentsList(registration.modules)
    );
    template = template.replace(
      /\{\{LAST_UPDATED\}\}/g,
      registration.lastUpdated.toLocaleString('ru-RU')
    );

    // Убираем плейсхолдер анализа если его нет
    template = template.replace(/\{\{ANALYSIS_INFO\}\}/g, '');

    return template;
  }

  /**
   * Сохраняет HTML в файл
   */
  public async saveHtml(html: string, outputPath: string): Promise<void> {
    try {
      // Создаем директорию если её нет
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      // Записываем файл
      await fs.promises.writeFile(outputPath, html, 'utf-8');
    } catch (error) {
      throw new Error(`Не удалось сохранить HTML: ${error}`);
    }
  }

  /**
   * Генерирует список компонентов в HTML формате
   */
  private generateComponentsList(components: DebuggerComponent[]): string {
    if (components.length === 0) {
      return '<div class="no-components">Нет зарегистрированных компонентов</div>';
    }

    return components.map(component => this.generateComponentCard(component)).join('\n');
  }

  /**
   * Генерирует HTML карточку для одного компонента
   */
  private generateComponentCard(component: DebuggerComponent): string {
    const typeClass = component.category === 'checker' ? 'checker' : 'module';
    const typeIcon = component.category === 'checker' ? '🔍' : '⚙️';

    return `
      <div class="component-card ${typeClass}">
        <div class="component-header">
          <span class="component-icon">${typeIcon}</span>
          <div class="component-info">
            <h3 class="component-name">${this.escapeHtml(component.name)}</h3>
            <span class="component-type">${component.category}</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${this.escapeHtml(component.id)}</div>
          <div class="component-active"><strong>Активен:</strong> ${component.isActive ? 'Да' : 'Нет'}</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${component.registeredAt.toLocaleString('ru-RU')}</div>
          ${component.path ? `<div class="component-path"><strong>Путь:</strong> ${this.escapeHtml(component.path)}</div>` : ''}
          ${
            component.metadata
              ? `<div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${this.escapeHtml(JSON.stringify(component.metadata, null, 2))}</pre>
          </div>`
              : ''
          }
        </div>
      </div>`;
  } /**
   * Экранирует HTML символы (простая реализация для Node.js)
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Загружает HTML шаблон
   */
  private async loadTemplate(): Promise<string> {
    try {
      return await fs.promises.readFile(this.templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Не удалось загрузить шаблон: ${this.templatePath}. Error: ${error}`);
    }
  }

  /**
   * Получает статистику по компонентам
   */
  public getComponentStats(components: DebuggerComponent[]): Record<string, number> {
    return {
      total: components.length,
      checkers: components.filter(c => c.type === 'checker').length,
      modules: components.filter(c => c.type === 'module').length,
    };
  }

  /**
   * Генерирует HTML с результатами анализа
   */
  public async generateHtmlWithResults(
    registration: ComponentRegistration,
    analysisResult: unknown,
    projectPath: string
  ): Promise<string> {
    let template = await this.loadTemplate();

    // Объединяем все компоненты
    const allComponents = [...registration.checkers, ...registration.modules];

    // Заменяем стандартные плейсхолдеры
    template = template.replace(
      /\{\{COMPONENTS_LIST\}\}/g,
      this.generateComponentsListWithResults(allComponents)
    );
    template = template.replace(/\{\{TOTAL_COUNT\}\}/g, registration.totalCount.toString());
    template = template.replace(/\{\{CHECKERS_COUNT\}\}/g, registration.checkers.length.toString());
    template = template.replace(/\{\{MODULES_COUNT\}\}/g, registration.modules.length.toString());
    template = template.replace(
      /\{\{CHECKERS_LIST\}\}/g,
      this.generateComponentsListWithResults(registration.checkers)
    );
    template = template.replace(
      /\{\{MODULES_LIST\}\}/g,
      this.generateComponentsListWithResults(registration.modules)
    );
    template = template.replace(
      /\{\{LAST_UPDATED\}\}/g,
      registration.lastUpdated.toLocaleString('ru-RU')
    );

    // Добавляем информацию об анализе
    template = template.replace(
      /\{\{ANALYSIS_INFO\}\}/g,
      this.generateAnalysisInfo(analysisResult, projectPath)
    );

    return template;
  }

  /**
   * Генерирует список компонентов с результатами анализа
   */
  private generateComponentsListWithResults(components: DebuggerComponent[]): string {
    if (components.length === 0) {
      return '<div class="no-components">Нет зарегистрированных компонентов</div>';
    }

    return components.map(component => this.generateComponentCardWithResults(component)).join('\n');
  }

  /**
   * Генерирует HTML карточку компонента с результатами анализа
   */
  private generateComponentCardWithResults(component: DebuggerComponent): string {
    const typeClass = component.category === 'checker' ? 'checker' : 'module';
    const typeIcon = component.category === 'checker' ? '🔍' : '⚙️';

    // Определяем статус и цвет
    let statusClass = 'status-unknown';
    let statusText = 'Не запускался';
    let statusIcon = '⏸️';

    if (component.analysisResult) {
      if (component.status === 'passed') {
        statusClass = 'status-passed';
        statusText = 'Пройден';
        statusIcon = '✅';
      } else if (component.status === 'failed') {
        statusClass = 'status-failed';
        statusText = 'Провален';
        statusIcon = '❌';
      } else if (component.status === 'completed') {
        statusClass = 'status-completed';
        statusText = 'Завершен';
        statusIcon = '🎯';
      }
    }

    return `
      <div class="component-card ${typeClass}">
        <div class="component-header">
          <span class="component-icon">${typeIcon}</span>
          <div class="component-info">
            <h3 class="component-name">${this.escapeHtml(component.name)}</h3>
            <span class="component-type">${component.category}</span>
            <span class="component-status ${statusClass}">${statusIcon} ${statusText}</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${this.escapeHtml(component.id)}</div>
          <div class="component-active"><strong>Активен:</strong> ${component.isActive ? 'Да' : 'Нет'}</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${component.registeredAt.toLocaleString('ru-RU')}</div>
          ${component.lastRun ? `<div class="component-last-run"><strong>Последний запуск:</strong> ${component.lastRun.toLocaleString('ru-RU')}</div>` : ''}
          ${component.path ? `<div class="component-path"><strong>Путь:</strong> ${this.escapeHtml(component.path)}</div>` : ''}
          ${this.generateAnalysisResultSection(component)}
          ${
            component.metadata
              ? `<div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${this.escapeHtml(JSON.stringify(component.metadata, null, 2))}</pre>
          </div>`
              : ''
          }
        </div>
      </div>`;
  }

  /**
   * Генерирует секцию с результатами анализа для компонента
   */
  private generateAnalysisResultSection(component: DebuggerComponent): string {
    if (!component.analysisResult) {
      return '<div class="analysis-result"><strong>Результат анализа:</strong> Не выполнялся</div>';
    }

    const result = component.analysisResult as Record<string, unknown>;

    if (component.category === 'checker') {
      const score = typeof result.score === 'number' ? result.score : 0;
      const message = typeof result.message === 'string' ? result.message : 'Нет сообщения';
      const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];

      return `
        <div class="analysis-result">
          <strong>Результат проверки:</strong>
          <div class="checker-result">
            <div class="score">Оценка: ${score}/100</div>
            <div class="message">${this.escapeHtml(message)}</div>
            ${
              recommendations.length > 0
                ? `
              <div class="recommendations">
                <strong>Рекомендации:</strong>
                <ul>
                  ${recommendations.map((rec: unknown) => `<li>${this.escapeHtml(String(rec))}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
    } else {
      return `
        <div class="analysis-result">
          <strong>Результат анализа модуля:</strong>
          <pre class="module-result">${this.escapeHtml(JSON.stringify(result, null, 2))}</pre>
        </div>
      `;
    }
  }

  /**
   * Генерирует информацию об общем анализе
   */
  private generateAnalysisInfo(analysisResult: unknown, projectPath: string): string {
    const result = analysisResult as Record<string, unknown>;
    const summary = (result.summary as Record<string, unknown>) || {};
    const checks = Array.isArray(result.checks) ? result.checks : [];
    const modules = (result.modules as Record<string, unknown>) || {};

    return `
      <div class="analysis-info">
        <h3>📊 Результаты анализа проекта</h3>
        <div class="project-path"><strong>Проект:</strong> ${this.escapeHtml(projectPath)}</div>
        <div class="overall-score"><strong>Общая оценка:</strong> ${summary.overallScore || 0}/100</div>
        <div class="checks-count"><strong>Выполнено проверок:</strong> ${checks.length}</div>
        <div class="modules-count"><strong>Выполнено модулей:</strong> ${Object.keys(modules).length}</div>
        <div class="analysis-time"><strong>Время анализа:</strong> ${new Date().toLocaleString('ru-RU')}</div>
      </div>
    `;
  }
}
