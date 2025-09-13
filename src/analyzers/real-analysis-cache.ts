/**
 * 💾 Система кэширования результатов анализа с поддержкой динамики качества
 */
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import type {
  AnalysisResult,
  AnalysisCache,
  CacheEntry,
  QualityTrend,
  DynamicsReport,
} from './real-analyzer-interfaces.js';

export class FileBasedAnalysisCache implements AnalysisCache {
  private cacheDir: string;
  private historyLimit: number;

  constructor(cacheDir: string = './cache/analysis', historyLimit: number = 50) {
    this.cacheDir = path.resolve(cacheDir);
    this.historyLimit = historyLimit;
  }

  async save(projectPath: string, results: AnalysisResult[]): Promise<void> {
    await fs.ensureDir(this.cacheDir);

    const projectHash = this.getProjectHash(projectPath);
    const timestamp = new Date();

    const cacheEntry: CacheEntry = {
      projectPath,
      timestamp,
      results,
      projectHash,
    };

    // Сохраняем как текущий результат
    const currentFile = path.join(this.cacheDir, `${projectHash}-current.json`);
    await fs.writeJson(currentFile, cacheEntry, { spaces: 2 });

    // Сохраняем в историю с timestamp
    const historyFile = path.join(
      this.cacheDir,
      'history',
      `${projectHash}-${timestamp.getTime()}.json`
    );
    await fs.ensureDir(path.dirname(historyFile));
    await fs.writeJson(historyFile, cacheEntry, { spaces: 2 });

    // Очищаем старые записи истории
    await this.cleanupHistory(projectHash);

    console.log(`💾 Результаты сохранены: ${results.length} компонентов`);
  }

  async load(projectPath: string): Promise<CacheEntry | null> {
    const projectHash = this.getProjectHash(projectPath);
    const currentFile = path.join(this.cacheDir, `${projectHash}-current.json`);

    try {
      if (await fs.pathExists(currentFile)) {
        const cacheEntry = (await fs.readJson(currentFile)) as CacheEntry;
        console.log(`📂 Загружены кэшированные результаты для ${projectPath}`);
        return cacheEntry;
      }
    } catch (error) {
      console.warn(`⚠️ Ошибка загрузки кэша: ${error}`);
    }

    return null;
  }

  async getHistory(projectPath: string, limit?: number): Promise<CacheEntry[]> {
    const projectHash = this.getProjectHash(projectPath);
    const historyDir = path.join(this.cacheDir, 'history');

    try {
      if (!(await fs.pathExists(historyDir))) {
        return [];
      }

      const files = await fs.readdir(historyDir);
      const projectFiles = files
        .filter((file: string) => file.startsWith(`${projectHash}-`) && file.endsWith('.json'))
        .sort()
        .reverse(); // Новые записи первыми

      const actualLimit = limit || this.historyLimit;
      const selectedFiles = projectFiles.slice(0, actualLimit);

      const history: CacheEntry[] = [];
      for (const file of selectedFiles) {
        try {
          const entry = (await fs.readJson(path.join(historyDir, file))) as CacheEntry;
          entry.timestamp = new Date(entry.timestamp); // Восстанавливаем Date объект
          history.push(entry);
        } catch (error) {
          console.warn(`⚠️ Не удалось загрузить файл истории: ${file}`);
        }
      }

      return history;
    } catch (error) {
      console.error(`❌ Ошибка получения истории: ${error}`);
      return [];
    }
  }

  async cleanup(olderThanDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const historyDir = path.join(this.cacheDir, 'history');

    if (!(await fs.pathExists(historyDir))) {
      return;
    }

    const files = await fs.readdir(historyDir);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(historyDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.remove(filePath);
        deletedCount++;
      }
    }

    console.log(`🧹 Очищено ${deletedCount} устаревших записей кэша`);
  }

  /**
   * Генерирует отчет о динамике качества проекта
   */
  async generateDynamicsReport(projectPath: string): Promise<DynamicsReport> {
    const history = await this.getHistory(projectPath);

    if (history.length === 0) {
      throw new Error('Недостаточно данных для создания отчета динамики');
    }

    const trends: QualityTrend[] = [];

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      const overallScore = this.calculateOverallScore(entry.results);
      const componentScores: Record<string, number> = {};

      entry.results.forEach(result => {
        componentScores[result.componentName] = this.parseScore(result.overallScore);
      });

      const trend: QualityTrend = {
        timestamp: entry.timestamp,
        overallScore,
        componentScores,
      };

      // Добавляем изменения относительно предыдущего анализа
      if (i < history.length - 1) {
        const prevTrend = trends[trends.length - 1];
        if (prevTrend) {
          trend.changeFromPrevious = {
            overall: overallScore - prevTrend.overallScore,
            components: {},
          };

          Object.keys(componentScores).forEach(component => {
            const current = componentScores[component];
            const previous = prevTrend.componentScores[component] || 0;
            trend.changeFromPrevious!.components[component] = current - previous;
          });
        }
      }

      trends.push(trend);
    }

    trends.reverse(); // Хронологический порядок

    const summary = this.analyzeTrends(trends);

    return {
      projectPath,
      generatedAt: new Date(),
      trends,
      summary,
    };
  }

  private async cleanupHistory(projectHash: string): Promise<void> {
    const historyDir = path.join(this.cacheDir, 'history');
    const files = await fs.readdir(historyDir);

    const projectFiles = files
      .filter((file: string) => file.startsWith(`${projectHash}-`))
      .sort()
      .reverse();

    // Удаляем файлы, превышающие лимит
    if (projectFiles.length > this.historyLimit) {
      const filesToDelete = projectFiles.slice(this.historyLimit);
      for (const file of filesToDelete) {
        await fs.remove(path.join(historyDir, file));
      }
    }
  }

  private getProjectHash(projectPath: string): string {
    return crypto.createHash('md5').update(path.resolve(projectPath)).digest('hex').substring(0, 8);
  }

  private calculateOverallScore(results: AnalysisResult[]): number {
    if (results.length === 0) return 0;

    const scores = results.map(result => this.parseScore(result.overallScore));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private parseScore(scoreString: string): number {
    // Преобразуем оценки типа "A+ (92%)" в числовые значения
    const match = scoreString.match(/\((\d+)%\)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Fallback для других форматов
    if (scoreString.includes('A+')) return 95;
    if (scoreString.includes('A')) return 90;
    if (scoreString.includes('B+')) return 85;
    if (scoreString.includes('B')) return 80;
    if (scoreString.includes('C+')) return 75;
    if (scoreString.includes('C')) return 70;

    return 60; // По умолчанию
  }

  private analyzeTrends(trends: QualityTrend[]) {
    const improvementAreas: string[] = [];
    const regressionAreas: string[] = [];
    const stableComponents: string[] = [];

    if (trends.length < 2) {
      return { improvementAreas, regressionAreas, stableComponents };
    }

    const allComponents = new Set<string>();
    trends.forEach(trend => {
      Object.keys(trend.componentScores).forEach(comp => allComponents.add(comp));
    });

    allComponents.forEach(component => {
      const scores = trends
        .map(trend => trend.componentScores[component])
        .filter(score => score !== undefined);

      if (scores.length < 2) return;

      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];
      const change = lastScore - firstScore;

      if (change > 5) {
        improvementAreas.push(component);
      } else if (change < -5) {
        regressionAreas.push(component);
      } else {
        stableComponents.push(component);
      }
    });

    return { improvementAreas, regressionAreas, stableComponents };
  }
}
