/**
 * Базовый класс для всех чекеров системы
 */

import { CheckContext, CheckResult } from './types.js';

export abstract class BaseChecker {
  abstract readonly name: string;
  abstract readonly category: 'quality' | 'security' | 'performance' | 'structure';
  abstract readonly description: string;

  /**
   * Выполняет проверку
   */
  abstract check(context: CheckContext): Promise<CheckResult> | CheckResult;

  /**
   * Проверяет, поддерживается ли данный тип проекта
   */
  isApplicable(context: CheckContext): boolean {
    return true; // По умолчанию применимо везде
  }

  /**
   * Приоритет выполнения чекера (1 = высший)
   */
  get priority(): number {
    return 10;
  }

  /**
   * Создает результат проверки
   */
  protected createResult(
    passed: boolean,
    score: number,
    message: string,
    details?: any,
    recommendations?: string[]
  ): CheckResult {
    return {
      checker: this.name,
      category: this.category,
      passed,
      score: Math.max(0, Math.min(100, score)), // Нормализация 0-100
      message,
      details,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Создает результат об ошибке
   */
  protected createErrorResult(error: Error): CheckResult {
    return this.createResult(false, 0, `Ошибка при выполнении проверки: ${error.message}`, {
      error: error.stack,
    });
  }

  /**
   * Проверяет существование файла
   */
  protected fileExists(filePath: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Читает содержимое файла
   */
  protected readFile(filePath: string): string | null {
    try {
      const fs = require('fs');
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }
}

/**
 * Интерфейс для модульных чекеров (специфичных для определенного модуля)
 */
export abstract class ModuleChecker extends BaseChecker {
  abstract readonly moduleName: string;

  /**
   * Проверяет, поддерживается ли модуль в данном проекте
   */
  isApplicable(context: CheckContext): boolean {
    // Проверяем, есть ли результаты от нужного модуля
    return context.moduleResults?.[this.moduleName] !== undefined;
  }
}
