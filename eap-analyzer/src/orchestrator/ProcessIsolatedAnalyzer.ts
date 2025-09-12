/**
 * ProcessIsolatedAnalyzer - Изолированный запуск UnifiedTestingAnalyzer
 *
 * Phase 4.1-4.2: Техническая реализация изоляции процессов
 *
 * Решает проблему конфликта AI модулей путем запуска анализа в отдельном процессе
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { CheckContext } from '../types/index.js';

/**
 * Конфигурация изолированного процесса
 */
interface IsolatedProcessConfig {
  timeout: number;
  maxMemory: number;
  cwd: string;
  env: Record<string, string>;
}

/**
 * Статистика производительности
 */
interface PerformanceStats {
  totalRuns: number;
  successfulRuns: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
}

/**
 * Менеджер изолированного запуска UnifiedTestingAnalyzer
 */
export class ProcessIsolatedAnalyzer {
  private readonly config: IsolatedProcessConfig;
  private readonly stats: PerformanceStats;

  constructor() {
    this.config = {
      timeout: 30000, // 30 секунд
      maxMemory: 200 * 1024 * 1024, // 200MB
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'analysis',
        FORCE_COLOR: '0', // отключаем цветной вывод для парсинга
      },
    };

    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
    };
  }

  /**
   * Запускает UnifiedTestingAnalyzer в изолированном процессе
   */
  async runUnifiedAnalysis(context: CheckContext): Promise<any> {
    const startTime = Date.now();
    this.stats.totalRuns++;

    try {
      // Создаем временный скрипт для запуска
      const scriptPath = await this.createIsolatedScript(context);

      try {
        // Запускаем анализ в отдельном процессе
        const result = await this.executeIsolatedProcess(scriptPath);

        this.stats.successfulRuns++;
        this.stats.lastExecutionTime = Date.now() - startTime;
        this.updateAverageExecutionTime();

        return result;
      } finally {
        // Очищаем временный файл
        await this.cleanupScript(scriptPath);
      }
    } catch (error) {
      this.stats.lastExecutionTime = Date.now() - startTime;
      this.updateAverageExecutionTime();

      console.error('❌ Ошибка изолированного процесса:', error);
      throw error;
    }
  }

  /**
   * Создает временный скрипт для изолированного запуска
   */
  private async createIsolatedScript(context: CheckContext): Promise<string> {
    const scriptContent = `
/**
 * Изолированный скрипт для запуска UnifiedTestingAnalyzer
 * Генерируется автоматически ProcessIsolatedAnalyzer
 */

// Импорт через динамический импорт для избежания конфликтов
async function runIsolatedAnalysis() {
  try {
    // Динамический импорт UnifiedTestingAnalyzer
    const { UnifiedTestingAnalyzer } = await import('./src/checkers/testing/UnifiedTestingAnalyzerJS.js');

    const analyzer = new UnifiedTestingAnalyzer();
    const projectPath = '${context.projectPath.replace(/\\/g, '\\\\')}';

    // Запускаем анализ
    const result = await analyzer.analyze(projectPath);

    // Выводим результат в stdout как JSON
    console.log(JSON.stringify({
      success: true,
      data: result,
      timestamp: Date.now()
    }));

  } catch (error) {
    // Выводим ошибку в stdout как JSON для парсинга
    console.log(JSON.stringify({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: Date.now()
    }));

    process.exit(1);
  }
}

// Запуск анализа
runIsolatedAnalysis();
`;

    const scriptPath = path.join(
      this.config.cwd,
      `isolated-analysis-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`
    );

    await fs.writeFile(scriptPath, scriptContent, 'utf8');
    return scriptPath;
  }

  /**
   * Выполняет изолированный процесс
   */
  private async executeIsolatedProcess(scriptPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = child_process.spawn('node', [scriptPath], {
        cwd: this.config.cwd,
        env: this.config.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: this.config.timeout,
      });

      let stdout = '';
      let stderr = '';

      // Собираем вывод
      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      // Обработка завершения процесса
      child.on('close', (code, signal) => {
        if (signal === 'SIGTERM') {
          reject(new Error(`Analysis timed out after ${this.config.timeout}ms`));
          return;
        }

        if (code !== 0) {
          reject(new Error(`Analysis process exited with code ${code}. stderr: ${stderr}`));
          return;
        }

        try {
          // Парсим JSON результат
          const result = this.parseAnalysisResult(stdout);

          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(`Analysis failed: ${result.error?.message || 'Unknown error'}`));
          }
        } catch (parseError) {
          const errorMessage =
            parseError instanceof Error ? parseError.message : String(parseError);
          reject(new Error(`Failed to parse analysis result: ${errorMessage}. stdout: ${stdout}`));
        }
      });

      // Обработка ошибок запуска
      child.on('error', error => {
        reject(new Error(`Failed to start analysis process: ${error.message}`));
      });

      // Мониторинг памяти (если доступно)
      if (process.platform !== 'win32') {
        const memoryCheck = setInterval(() => {
          if (child.pid) {
            try {
              const memUsage = process.memoryUsage();
              if (memUsage.rss > this.config.maxMemory) {
                clearInterval(memoryCheck);
                child.kill('SIGTERM');
                reject(
                  new Error(
                    `Analysis process exceeded memory limit (${this.config.maxMemory} bytes)`
                  )
                );
              }
            } catch (error) {
              // Игнорируем ошибки мониторинга памяти
            }
          }
        }, 1000);

        child.on('close', () => {
          clearInterval(memoryCheck);
        });
      }
    });
  }

  /**
   * Парсит результат анализа из stdout
   */
  private parseAnalysisResult(stdout: string): any {
    // Ищем JSON в выводе (может быть смешан с логами)
    const lines = stdout.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          return JSON.parse(trimmed);
        } catch (error) {
          // Продолжаем поиск
        }
      }
    }

    // Если не нашли отдельную строку, пробуем весь вывод
    try {
      return JSON.parse(stdout.trim());
    } catch (error) {
      throw new Error(`No valid JSON found in output: ${stdout}`);
    }
  }

  /**
   * Очищает временный скрипт
   */
  private async cleanupScript(scriptPath: string): Promise<void> {
    try {
      await fs.unlink(scriptPath);
    } catch (error) {
      // Игнорируем ошибки очистки
      console.warn(`⚠️ Failed to cleanup script ${scriptPath}:`, error);
    }
  }

  /**
   * Обновляет среднее время выполнения
   */
  private updateAverageExecutionTime(): void {
    if (this.stats.totalRuns > 0) {
      this.stats.averageExecutionTime =
        (this.stats.averageExecutionTime * (this.stats.totalRuns - 1) +
          this.stats.lastExecutionTime) /
        this.stats.totalRuns;
    }
  }

  /**
   * Проверяет доступность анализа
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Простой тест - пытаемся создать временный файл
      const testPath = path.join(this.config.cwd, `test-${Date.now()}.tmp`);
      await fs.writeFile(testPath, 'test', 'utf8');
      await fs.unlink(testPath);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Возвращает статистику производительности
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Сбрасывает статистику
   */
  resetStats(): void {
    this.stats.totalRuns = 0;
    this.stats.successfulRuns = 0;
    this.stats.averageExecutionTime = 0;
    this.stats.lastExecutionTime = 0;
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(updates: Partial<IsolatedProcessConfig>): void {
    Object.assign(this.config, updates);
  }
}
