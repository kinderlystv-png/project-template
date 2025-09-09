/**
 * Основной класс анализатора структуры проекта
 * Содержит базовую конфигурацию и координацию модулей
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../config.json');
import LearningSystem from '../learning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Основной класс StructureAnalyzer
 */
export class AnalyzerCore {
  constructor(userConfig = {}) {
    this.config = this.loadConfig(userConfig);
    this.learningSystem = new LearningSystem(this.config.dataDir);
    this.version = config.module.version;
  }

  /**
   * Загружает конфигурацию модуля
   */
  loadConfig(userConfig) {
    const defaultConfig = {
      dataDir: path.join(__dirname, '../../../../../data/learning'),
      enableLearning: config.analysis.types.learning.enabled,
      enableAdvancedAnalysis: config.analysis.types.advanced.enabled,
      thresholds: config.thresholds.basic,
      outputFormat: config.output.defaultFormat,
      performanceSettings: config.performance,
      integrationSettings: config.integration,
    };

    return { ...defaultConfig, ...userConfig };
  }

  /**
   * Проверяет размер проекта на соответствие ограничениям производительности
   */
  async validateProjectSize(projectPath) {
    const fs = await import('fs');
    const stats = await fs.promises.stat(projectPath);

    if (!stats.isDirectory()) {
      throw new Error('Project path must be a directory');
    }

    // Проверяем ограничения размера проекта
    const maxSize = this.config.performanceSettings?.maxProjectSize || 500 * 1024 * 1024; // 500MB
    const folderSize = await this.getFolderSize(projectPath);

    if (folderSize > maxSize) {
      throw new Error(
        `Project size (${Math.round(folderSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
      );
    }
  }

  /**
   * Вычисляет размер папки рекурсивно
   */
  async getFolderSize(dirPath) {
    const fs = await import('fs');
    let totalSize = 0;

    const files = await fs.promises.readdir(dirPath);
    for (const file of files) {
      if (file.startsWith('.') || file === 'node_modules') continue;

      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        totalSize += await this.getFolderSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Получает адаптивные пороги анализа
   */
  getAnalysisThresholds() {
    return this.config.enableLearning
      ? this.learningSystem.getCurrentThresholds()
      : { basic: this.config.thresholds };
  }

  /**
   * Получает статистику обучения системы
   */
  getLearningStats() {
    return this.config.enableLearning ? this.learningSystem.getLearningStats() : null;
  }

  /**
   * Обновляет систему обучения результатами анализа
   */
  updateLearningSystem(projectPath, basicResults, advancedResults) {
    if (this.config.enableLearning) {
      console.log('[AnalyzerCore] Обновление системы обучения...');
      this.learningSystem.addAnalysisResult(projectPath, basicResults, advancedResults);
    }
  }

  /**
   * Получает информацию о модуле
   */
  getModuleInfo() {
    return {
      name: config.module.name,
      version: this.version,
      description: config.module.description,
      capabilities: {
        basicAnalysis: true,
        advancedAnalysis: this.config.enableAdvancedAnalysis,
        learningSystem: this.config.enableLearning,
        eapIntegration: true,
      },
    };
  }
}

export default AnalyzerCore;
