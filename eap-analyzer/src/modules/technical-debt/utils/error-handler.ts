/**
 * Унифицированный обработчик ошибок для анализаторов технического долга
 */

export interface ErrorContext {
  operation: string;
  file?: string;
  details?: Record<string, unknown>;
}

export class ErrorHandler {
  private static errors: Array<{ context: ErrorContext; error: Error; timestamp: Date }> = [];

  /**
   * Обрабатывает ошибку с контекстом
   */
  static handle(error: Error, context: ErrorContext): void {
    this.errors.push({
      context,
      error,
      timestamp: new Date(),
    });

    // Логирование в зависимости от типа операции
    if (context.operation === 'file-read' || context.operation === 'file-scan') {
      // console.debug(`File operation failed for ${context.file}:`, error.message);
    } else if (context.operation === 'analysis') {
      // console.warn(`Analysis failed:`, error.message);
    } else {
      // console.error(`Operation ${context.operation} failed:`, error.message);
    }
  }

  /**
   * Безопасно выполняет асинхронную операцию
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    defaultValue: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as Error, context);
      return defaultValue;
    }
  }

  /**
   * Безопасно выполняет синхронную операцию
   */
  static safe<T>(operation: () => T, context: ErrorContext, defaultValue: T): T {
    try {
      return operation();
    } catch (error) {
      this.handle(error as Error, context);
      return defaultValue;
    }
  }

  /**
   * Получает статистику ошибок
   */
  static getErrorStats() {
    const groupedErrors = this.errors.reduce(
      (acc, { context, error }) => {
        const key = context.operation;
        if (!acc[key]) {
          acc[key] = { count: 0, lastError: null };
        }
        acc[key].count++;
        acc[key].lastError = error.message;
        return acc;
      },
      {} as Record<string, { count: number; lastError: string | null }>
    );

    return {
      totalErrors: this.errors.length,
      byOperation: groupedErrors,
      lastErrors: this.errors.slice(-5).map(e => ({
        operation: e.context.operation,
        message: e.error.message,
        timestamp: e.timestamp,
      })),
    };
  }

  /**
   * Очищает накопленные ошибки
   */
  static clearErrors(): void {
    this.errors = [];
  }
}
