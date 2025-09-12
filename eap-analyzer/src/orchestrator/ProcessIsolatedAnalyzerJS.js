/**/**

 * ProcessIsolatedAnalyzer - Оптимизированная JavaScript версия v2.0 * ProcessIsolatedAnalyzer - JavaScript версия для тестирования

 * Устранение разрыва функциональности с 46% до 90%+ * Phase 4.1: Изолированный запуск UnifiedTestingAnalyzer

 * */

 * Ключевые улучшения:

 * - Исправлена работа с модулями и путямиimport * as child_process from 'child_process';

 * - Улучшена обработка ошибок для всех ОСimport * as path from 'path';

 * - Добавлена типизация результатовimport * as fs from 'fs/promises';

 * - Оптимизирована работа с памятью

 * - Добавлен механизм резилентности/**

 */ * Менеджер изолированного запуска UnifiedTestingAnalyzer

 */

import * as child_process from 'child_process';export class ProcessIsolatedAnalyzer {

import * as path from 'path';  constructor() {

import * as fs from 'fs/promises';    this.config = {

      timeout: 30000, // 30 секунд

/**      maxMemory: 200 * 1024 * 1024, // 200MB

 * Оптимизированный менеджер изолированного запуска анализаторов      cwd: process.cwd(),

 */      env: {

export class ProcessIsolatedAnalyzer {        ...process.env,

  constructor(config = {}) {        NODE_ENV: 'analysis',

    this.config = {        FORCE_COLOR: '0', // отключаем цветной вывод для парсинга

      timeout: 45000, // Увеличено до 45 секунд      },

      maxMemory: 256 * 1024 * 1024, // 256MB    };

      cwd: process.cwd(),

      retryAttempts: 3,    this.stats = {

      retryDelay: 1000,      totalRuns: 0,

      env: {      successfulRuns: 0,

        ...process.env,      averageExecutionTime: 0,

        NODE_ENV: 'analysis',      lastExecutionTime: 0,

        FORCE_COLOR: '0',    };

        NODE_OPTIONS: '--max-old-space-size=256',  }

      },

      ...config,  /**

    };   * Запускает UnifiedTestingAnalyzer в изолированном процессе

   */

    this.stats = {  async runUnifiedAnalysis(context) {

      totalRuns: 0,    const startTime = Date.now();

      successfulRuns: 0,    this.stats.totalRuns++;

      failedRuns: 0,

      averageExecutionTime: 0,    try {

      lastExecutionTime: 0,      // Создаем временный скрипт для запуска

      successRate: 0,      const scriptPath = await this.createIsolatedScript(context);

      memoryPeakUsage: 0,

    };      try {

        // Запускаем анализ в отдельном процессе

    this.tempFiles = new Set();        const result = await this.executeIsolatedProcess(scriptPath);



    // Регистрируем очистку при завершении процесса        this.stats.successfulRuns++;

    process.on('exit', () => this.cleanup());        this.stats.lastExecutionTime = Date.now() - startTime;

    process.on('SIGINT', () => this.cleanup());        this.updateAverageExecutionTime();

    process.on('SIGTERM', () => this.cleanup());

  }        return result;

      } finally {

  /**        // Очищаем временный файл

   * Запускает анализ в изолированном процессе с поддержкой retry        await this.cleanupScript(scriptPath);

   */      }

  async runUnifiedAnalysis(context) {    } catch (error) {

    const startTime = Date.now();      this.stats.lastExecutionTime = Date.now() - startTime;

    this.stats.totalRuns++;      this.updateAverageExecutionTime();



    let lastError = null;      console.error('❌ Ошибка изолированного процесса:', error);

      throw error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {    }

      try {  }

        // eslint-disable-next-line no-console

        console.log(`🔄 Попытка ${attempt}/${this.config.retryAttempts} изолированного анализа...`);  /**

   * Создает временный скрипт для изолированного запуска

        const result = await this.executeAnalysisWithTimeout(context);   */

  async createIsolatedScript(context) {

        this.updateSuccessStats(startTime);    const scriptContent = `

        return result;/**

      } catch (error) { * Изолированный скрипт для запуска UnifiedTestingAnalyzer

        lastError = error instanceof Error ? error : new Error(String(error)); * Генерируется автоматически ProcessIsolatedAnalyzer

        // eslint-disable-next-line no-console */

        console.warn(`⚠️ Попытка ${attempt} не удалась:`, lastError.message);

// Импорт через динамический импорт для избежания конфликтов

        if (attempt < this.config.retryAttempts) {async function runIsolatedAnalysis() {

          // eslint-disable-next-line no-console  try {

          console.log(`⏳ Ожидание ${this.config.retryDelay}ms перед повторной попыткой...`);    console.log('🔄 Изолированный анализ запущен...');

          await this.delay(this.config.retryDelay);    console.log('📁 Текущая директория:', process.cwd());

        }

      }    // Динамический импорт UnifiedTestingAnalyzer (путь из корня eap-analyzer)

    }    console.log('📦 Импортируем UnifiedTestingAnalyzer...');

    const module = await import('./src/checkers/testing/UnifiedTestingAnalyzerJS.js');

    this.updateFailureStats(startTime);    console.log('📦 Модуль импортирован:', Object.keys(module));

    throw lastError || new Error('Все попытки анализа не удались');

  }    const UnifiedTestingAnalyzer = module.UnifiedTestingAnalyzer;

    console.log('📦 UnifiedTestingAnalyzer найден:', typeof UnifiedTestingAnalyzer);

  /**

   * Выполняет анализ с тайм-аутом    console.log('✅ UnifiedTestingAnalyzer импортирован успешно');

   */

  async executeAnalysisWithTimeout(context) {    const analyzer = new UnifiedTestingAnalyzer();

    return Promise.race([this.executeIsolatedAnalysis(context), this.createTimeoutPromise()]);    const projectPath = '${context.projectPath.replace(/\\/g, '\\\\')}';

  }

    console.log('🚀 Запускаем анализ:', projectPath);

  /**

   * Основной метод выполнения изолированного анализа    // Запускаем анализ

   */    const result = await analyzer.analyze(projectPath);

  async executeIsolatedAnalysis(context) {

    const scriptPath = await this.createOptimizedScript(context);    console.log('✅ Анализ завершен успешно');

    this.tempFiles.add(scriptPath);

    // Выводим результат в stdout как JSON

    try {    console.log(JSON.stringify({

      const result = await this.spawnAnalysisProcess(scriptPath);      success: true,

      return result;      data: result,

    } finally {      timestamp: Date.now()

      await this.cleanupScript(scriptPath);    }));

      this.tempFiles.delete(scriptPath);

    }  } catch (error) {

  }    console.error('❌ Ошибка в изолированном анализе:', error.message);

    console.error('🔍 Stack trace:', error.stack);

  /**

   * Создает оптимизированный скрипт для анализа    // Выводим ошибку в stdout как JSON для парсинга

   */    console.log(JSON.stringify({

  async createOptimizedScript(context) {      success: false,

    const scriptContent = `      error: {

/**        message: error.message,

 * Оптимизированный изолированный скрипт анализа v2.0        stack: error.stack,

 * Автогенерирован ProcessIsolatedAnalyzer        name: error.name

 */      },

      timestamp: Date.now()

import { fileURLToPath } from 'url';    }));

import { dirname, resolve } from 'path';

    process.exit(1);

const __filename = fileURLToPath(import.meta.url);  }

const __dirname = dirname(__filename);}// Запуск анализа

runIsolatedAnalysis();

async function runOptimizedAnalysis() {`;

  const startTime = Date.now();

    const scriptPath = path.join(

  try {      this.config.cwd,

    // Устанавливаем базовый путь      `isolated-analysis-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`

    const basePath = resolve(__dirname);    );



    // Попытка импорта с различными путями    await fs.writeFile(scriptPath, scriptContent, 'utf8');

    let UnifiedTestingAnalyzer;    return scriptPath;

  }

    const importPaths = [

      './src/checkers/testing/UnifiedTestingAnalyzerJS.js',  /**

      './eap-analyzer/src/checkers/testing/UnifiedTestingAnalyzerJS.js',   * Выполняет изолированный процесс

      resolve(basePath, 'src/checkers/testing/UnifiedTestingAnalyzerJS.js'),   */

      resolve(basePath, 'eap-analyzer/src/checkers/testing/UnifiedTestingAnalyzerJS.js')  async executeIsolatedProcess(scriptPath) {

    ];    return new Promise((resolve, reject) => {

      const child = child_process.spawn('node', [scriptPath], {

    for (const importPath of importPaths) {        cwd: this.config.cwd,

      try {        env: this.config.env,

        const module = await import(importPath);        stdio: ['ignore', 'pipe', 'pipe'],

        UnifiedTestingAnalyzer = module.UnifiedTestingAnalyzer || module.default;        timeout: this.config.timeout,

        if (UnifiedTestingAnalyzer) {      });

          console.error('✅ Успешный импорт из:', importPath);

          break;      let stdout = '';

        }      let stderr = '';

      } catch (error) {

        console.error('⚠️ Не удался импорт из:', importPath, error.message);      // Собираем вывод

      }      child.stdout?.on('data', data => {

    }        stdout += data.toString();

      });

    if (!UnifiedTestingAnalyzer) {

      throw new Error('UnifiedTestingAnalyzer не найден во всех попытках импорта');      child.stderr?.on('data', data => {

    }        stderr += data.toString();

      });

    // Создаем анализатор и запускаем

    const analyzer = new UnifiedTestingAnalyzer();      // Обработка завершения процесса

    const projectPath = '${context.projectPath.replace(/\\/g, '\\\\')}';      child.on('close', (code, signal) => {

        if (signal === 'SIGTERM') {

    console.error('🚀 Запуск анализа для:', projectPath);          reject(new Error(`Analysis timed out after ${this.config.timeout}ms`));

    const result = await analyzer.analyze(projectPath);          return;

        }

    const duration = Date.now() - startTime;

        if (code !== 0) {

    // Выводим результат в stdout          reject(new Error(`Analysis process exited with code ${code}. stderr: ${stderr}`));

    const output = {          return;

      success: true,        }

      data: result,

      timestamp: Date.now(),        try {

      duration,          // Парсим JSON результат

      metadata: {          const result = this.parseAnalysisResult(stdout);

        projectPath,

        analyzerVersion: '2.0',          if (result.success) {

        memoryUsage: process.memoryUsage()            resolve(result.data);

      }          } else {

    };            reject(new Error(`Analysis failed: ${result.error?.message || 'Unknown error'}`));

          }

    console.log(JSON.stringify(output));        } catch (parseError) {

          const errorMessage =

  } catch (error) {            parseError instanceof Error ? parseError.message : String(parseError);

    const duration = Date.now() - startTime;          reject(new Error(`Failed to parse analysis result: ${errorMessage}. stdout: ${stdout}`));

        }

    const output = {      });

      success: false,

      error: {      // Обработка ошибок запуска

        message: error.message || 'Unknown error',      child.on('error', error => {

        name: error.name || 'Error',        reject(new Error(`Failed to start analysis process: ${error.message}`));

        stack: error.stack      });

      },    });

      timestamp: Date.now(),  }

      duration,

      metadata: {  /**

        nodeVersion: process.version,   * Парсит результат анализа из stdout

        platform: process.platform,   */

        memoryUsage: process.memoryUsage()  parseAnalysisResult(stdout) {

      }    // Ищем JSON в выводе (может быть смешан с логами)

    };    const lines = stdout.split('\n');



    console.log(JSON.stringify(output));    for (const line of lines) {

    process.exit(1);      const trimmed = line.trim();

  }      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {

}        try {

          return JSON.parse(trimmed);

// Запуск с обработкой неперехваченных исключений        } catch (error) {

process.on('uncaughtException', (error) => {          // Продолжаем поиск

  const output = {        }

    success: false,      }

    error: {    }

      message: 'Uncaught Exception: ' + error.message,

      name: 'UncaughtException',    // Если не нашли отдельную строку, пробуем весь вывод

      stack: error.stack    try {

    },      return JSON.parse(stdout.trim());

    timestamp: Date.now(),    } catch (error) {

    duration: 0      throw new Error(`No valid JSON found in output: ${stdout}`);

  };    }

  }

  console.log(JSON.stringify(output));

  process.exit(1);  /**

});   * Очищает временный скрипт

   */

runOptimizedAnalysis();  async cleanupScript(scriptPath) {

`;    try {

      await fs.unlink(scriptPath);

    const scriptPath = path.join(    } catch (error) {

      this.config.cwd,      // Игнорируем ошибки очистки

      `optimized-analysis-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`      console.warn(`⚠️ Failed to cleanup script ${scriptPath}:`, error);

    );    }

  }

    await fs.writeFile(scriptPath, scriptContent, 'utf8');

    return scriptPath;  /**

  }   * Обновляет среднее время выполнения

   */

  /**  updateAverageExecutionTime() {

   * Запускает процесс анализа    if (this.stats.totalRuns > 0) {

   */      this.stats.averageExecutionTime =

  async spawnAnalysisProcess(scriptPath) {        (this.stats.averageExecutionTime * (this.stats.totalRuns - 1) +

    return new Promise((resolve, reject) => {          this.stats.lastExecutionTime) /

      const startTime = Date.now();        this.stats.totalRuns;

      let memoryPeak = 0;    }

  }

      const child = child_process.spawn('node', [scriptPath], {

        cwd: this.config.cwd,  /**

        env: this.config.env,   * Проверяет доступность анализа

        stdio: ['ignore', 'pipe', 'pipe'],   */

        timeout: this.config.timeout,  async checkAvailability() {

      });    try {

      // Простой тест - пытаемся создать временный файл

      let stdout = '';      const testPath = path.join(this.config.cwd, `test-${Date.now()}.tmp`);

      let stderr = '';      await fs.writeFile(testPath, 'test', 'utf8');

      await fs.unlink(testPath);

      // Собираем данные

      if (child.stdout) {      return true;

        child.stdout.on('data', data => {    } catch (error) {

          stdout += data.toString();      return false;

        });    }

      }  }



      if (child.stderr) {  /**

        child.stderr.on('data', data => {   * Возвращает статистику производительности

          stderr += data.toString();   */

        });  getPerformanceStats() {

      }    return { ...this.stats };

  }

      // Мониторинг памяти

      const memoryMonitor = setInterval(() => {  /**

        if (child.pid) {   * Сбрасывает статистику

          try {   */

            const memUsage = process.memoryUsage();  resetStats() {

            memoryPeak = Math.max(memoryPeak, memUsage.rss);    this.stats.totalRuns = 0;

    this.stats.successfulRuns = 0;

            if (memUsage.rss > this.config.maxMemory) {    this.stats.averageExecutionTime = 0;

              clearInterval(memoryMonitor);    this.stats.lastExecutionTime = 0;

              child.kill('SIGTERM');  }

              reject(

                new Error(`Превышен лимит памяти: ${memUsage.rss} > ${this.config.maxMemory}`)  /**

              );   * Обновляет конфигурацию

            }   */

          } catch (error) {  updateConfig(updates) {

            // Игнорируем ошибки мониторинга    Object.assign(this.config, updates);

          }  }

        }}

      }, 1000);

      // Обработка завершения
      child.on('close', (_code, signal) => {
        clearInterval(memoryMonitor);
        this.stats.memoryPeakUsage = Math.max(this.stats.memoryPeakUsage, memoryPeak);

        if (signal === 'SIGTERM') {
          reject(new Error(`Анализ прерван по тайм-ауту после ${this.config.timeout}ms`));
          return;
        }

        try {
          const result = this.parseOptimizedResult(stdout, stderr);
          result.duration = Date.now() - startTime;

          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error?.message || 'Анализ завершился с ошибкой'));
          }
        } catch (parseError) {
          reject(
            new Error(
              `Ошибка парсинга результата: ${parseError}. stdout: ${stdout.substring(0, 500)}`
            )
          );
        }
      });

      child.on('error', error => {
        clearInterval(memoryMonitor);
        reject(new Error(`Ошибка запуска процесса: ${error.message}`));
      });
    });
  }

  /**
   * Парсит оптимизированный результат
   */
  parseOptimizedResult(stdout, stderr) {
    // Ищем JSON в stdout
    const lines = stdout.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed.success === 'boolean') {
            return parsed;
          }
        } catch (error) {
          // Продолжаем поиск
        }
      }
    }

    // Если JSON не найден, создаем результат на основе stderr
    return {
      success: false,
      error: {
        message: stderr || 'Результат анализа не найден',
        name: 'ParseError',
      },
      timestamp: Date.now(),
      duration: 0,
    };
  }

  /**
   * Создает промис с тайм-аутом
   */
  createTimeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Глобальный тайм-аут анализа: ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  /**
   * Задержка
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Обновляет статистику успеха
   */
  updateSuccessStats(startTime) {
    this.stats.successfulRuns++;
    this.stats.lastExecutionTime = Date.now() - startTime;
    this.updateDerivedStats();
  }

  /**
   * Обновляет статистику неудач
   */
  updateFailureStats(startTime) {
    this.stats.failedRuns++;
    this.stats.lastExecutionTime = Date.now() - startTime;
    this.updateDerivedStats();
  }

  /**
   * Обновляет производные статистики
   */
  updateDerivedStats() {
    this.stats.averageExecutionTime =
      (this.stats.averageExecutionTime * (this.stats.totalRuns - 1) +
        this.stats.lastExecutionTime) /
      this.stats.totalRuns;

    this.stats.successRate =
      this.stats.totalRuns > 0 ? (this.stats.successfulRuns / this.stats.totalRuns) * 100 : 0;
  }

  /**
   * Очищает временный скрипт
   */
  async cleanupScript(scriptPath) {
    try {
      await fs.unlink(scriptPath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ Не удалось удалить временный файл ${scriptPath}:`, error);
    }
  }

  /**
   * Очищает все временные файлы
   */
  async cleanup() {
    const cleanupPromises = Array.from(this.tempFiles).map(file => this.cleanupScript(file));
    await Promise.allSettled(cleanupPromises);
    this.tempFiles.clear();
  }

  /**
   * Проверяет доступность системы
   */
  async checkAvailability() {
    try {
      const testPath = path.join(this.config.cwd, `availability-test-${Date.now()}.tmp`);
      await fs.writeFile(testPath, 'test', 'utf8');
      await fs.unlink(testPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Возвращает детальную статистику
   */
  getPerformanceStats() {
    return { ...this.stats };
  }

  /**
   * Сбрасывает статистику
   */
  resetStats() {
    Object.assign(this.stats, {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      successRate: 0,
      memoryPeakUsage: 0,
    });
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(updates) {
    Object.assign(this.config, updates);
  }

  /**
   * Диагностическая информация
   */
  getDiagnostics() {
    return {
      config: this.config,
      stats: this.stats,
      tempFiles: Array.from(this.tempFiles),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cwd: process.cwd(),
      },
    };
  }
}

// Экспорт по умолчанию
export default ProcessIsolatedAnalyzer;
