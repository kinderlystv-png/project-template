/**
 * ComponentRegistry - извлекает зарегистрированные компоненты из AnalysisOrchestrator
 */

import { DebuggerComponent, ComponentRegistration } from '../models/Component.js';

// Базовые интерфейсы для типизации
interface BaseChecker {
  check?: (context: unknown) => Promise<unknown>;
  constructor: { name: string };
}

interface BaseAnalyzer {
  analyze?: (projectPath: string) => Promise<unknown>;
  getName?: () => string;
  constructor: { name: string };
}

interface OrchestratorLike {
  checkers?: Map<string, BaseChecker>;
  modules?: Map<string, BaseAnalyzer>;
}

export class ComponentRegistry {
  /**
   * Извлекает список зарегистрированных компонентов из оркестратора
   */
  public getRegisteredComponents(orchestrator: OrchestratorLike): ComponentRegistration {
    const checkers = this.extractCheckers(orchestrator);
    const modules = this.extractModules(orchestrator);

    return {
      checkers,
      modules,
      totalCount: checkers.length + modules.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Извлекает зарегистрированные чекеры
   */
  private extractCheckers(orchestrator: OrchestratorLike): DebuggerComponent[] {
    const components: DebuggerComponent[] = [];

    // Проверяем наличие Map checkers в оркестраторе
    if (orchestrator.checkers && orchestrator.checkers instanceof Map) {
      for (const [name, checker] of orchestrator.checkers) {
        components.push({
          id: `checker-${name}`,
          name,
          category: 'checker',
          type: this.getCheckerType(checker),
          isActive: true,
          registeredAt: new Date(),
          metadata: {
            className: checker.constructor.name,
            hasCheck: typeof checker.check === 'function',
          },
        });
      }
    }

    return components;
  }

  /**
   * Извлекает зарегистрированные модули
   */
  private extractModules(orchestrator: OrchestratorLike): DebuggerComponent[] {
    const components: DebuggerComponent[] = [];

    // Проверяем наличие Map modules в оркестраторе
    if (orchestrator.modules && orchestrator.modules instanceof Map) {
      for (const [name, module] of orchestrator.modules) {
        components.push({
          id: `module-${name}`,
          name,
          category: 'module',
          type: this.getModuleType(module),
          isActive: true,
          registeredAt: new Date(),
          metadata: {
            className: module.constructor.name,
            hasAnalyze: typeof module.analyze === 'function',
            hasGetName: typeof module.getName === 'function',
          },
        });
      }
    }

    return components;
  }

  /**
   * Определяет тип чекера по его классу
   */
  private getCheckerType(checker: BaseChecker): string {
    const className = checker.constructor.name;

    if (className.includes('Security')) return 'security';
    if (className.includes('Test') || className.includes('Jest')) return 'testing';
    if (className.includes('Structure') || className.includes('File')) return 'structure';
    if (className.includes('Technical') || className.includes('Debt')) return 'technical-debt';
    if (className.includes('Performance')) return 'performance';

    return 'general';
  }

  /**
   * Определяет тип модуля по его классу
   */
  private getModuleType(module: BaseAnalyzer): string {
    const className = module.constructor.name;

    if (className.includes('AI')) return 'ai';
    if (className.includes('Technical') || className.includes('Debt')) return 'technical-debt';
    if (className.includes('Security')) return 'security';
    if (className.includes('Performance')) return 'performance';

    return 'general';
  }

  /**
   * Возвращает статистику по компонентам
   */
  public getComponentStats(registration: ComponentRegistration) {
    const checkerTypes = new Map<string, number>();
    const moduleTypes = new Map<string, number>();

    registration.checkers.forEach(checker => {
      checkerTypes.set(checker.type, (checkerTypes.get(checker.type) || 0) + 1);
    });

    registration.modules.forEach(module => {
      moduleTypes.set(module.type, (moduleTypes.get(module.type) || 0) + 1);
    });

    return {
      checkers: {
        total: registration.checkers.length,
        byType: Object.fromEntries(checkerTypes),
      },
      modules: {
        total: registration.modules.length,
        byType: Object.fromEntries(moduleTypes),
      },
      totalComponents: registration.totalCount,
    };
  }
}
