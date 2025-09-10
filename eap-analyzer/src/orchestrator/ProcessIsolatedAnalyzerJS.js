/**
 * ProcessIsolatedAnalyzer - JavaScript версия для тестирования
 * Phase 4.1: Изолированный запуск UnifiedTestingAnalyzer
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Менеджер изолированного запуска UnifiedTestingAnalyzer
 */
export class ProcessIsolatedAnalyzer {
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
  async runUnifiedAnalysis(context) {
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
  async createIsolatedScript(context) {
    const scriptContent = `
/**
 * Изолированный скрипт для запуска UnifiedTestingAnalyzer
 * Генерируется автоматически ProcessIsolatedAnalyzer
 */

// Импорт через динамический импорт для избежания конфликтов
async function runIsolatedAnalysis() {
  try {
    console.log('🔄 Изолированный анализ запущен...');
    console.log('📁 Текущая директория:', process.cwd());

    // Динамический импорт UnifiedTestingAnalyzer (путь из корня eap-analyzer)
    console.log('📦 Импортируем UnifiedTestingAnalyzer...');
    const module = await import('./src/checkers/testing/UnifiedTestingAnalyzerJS.js');
    console.log('📦 Модуль импортирован:', Object.keys(module));

    const UnifiedTestingAnalyzer = module.UnifiedTestingAnalyzer;
    console.log('📦 UnifiedTestingAnalyzer найден:', typeof UnifiedTestingAnalyzer);

    console.log('✅ UnifiedTestingAnalyzer импортирован успешно');

    const analyzer = new UnifiedTestingAnalyzer();
    const projectPath = '${context.projectPath.replace(/\\/g, '\\\\')}';

    console.log('🚀 Запускаем анализ:', projectPath);

    // Запускаем анализ
    const result = await analyzer.analyze(projectPath);

    console.log('✅ Анализ завершен успешно');

    // Выводим результат в stdout как JSON
    console.log(JSON.stringify({
      success: true,
      data: result,
      timestamp: Date.now()
    }));

  } catch (error) {
    console.error('❌ Ошибка в изолированном анализе:', error.message);
    console.error('🔍 Stack trace:', error.stack);

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
}// Запуск анализа
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
  async executeIsolatedProcess(scriptPath) {
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
    });
  }

  /**
   * Парсит результат анализа из stdout
   */
  parseAnalysisResult(stdout) {
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
  async cleanupScript(scriptPath) {
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
  updateAverageExecutionTime() {
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
  async checkAvailability() {
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
  getPerformanceStats() {
    return { ...this.stats };
  }

  /**
   * Сбрасывает статистику
   */
  resetStats() {
    this.stats.totalRuns = 0;
    this.stats.successfulRuns = 0;
    this.stats.averageExecutionTime = 0;
    this.stats.lastExecutionTime = 0;
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(updates) {
    Object.assign(this.config, updates);
  }
}
