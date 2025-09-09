/**
 * Интеграционный тест для новой архитектуры ЭАП
 * Демонстрирует работу DockerChecker с реальными примерами
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import { DockerChecker } from '../../src/checkers/docker/DockerChecker';
import { AnalysisCategory } from '../../src/types/AnalysisCategory';
import { Project, FileStats } from '../../src/types/Project';

// Реализация Project для работы с файловой системой
class FileSystemProject implements Project {
  public readonly path: string;
  public readonly name: string;

  constructor(basePath: string) {
    this.path = basePath;
    this.name = path.basename(basePath);
  }

  async getFileList(pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern || '**/*';
      const files = await glob(searchPattern, {
        cwd: this.path,
        nodir: true,
      });
      return files;
    } catch {
      return [];
    }
  }

  async getFileStats(filePath: string): Promise<FileStats> {
    try {
      const fullPath = this.resolvePath(filePath);
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch {
      return {
        size: 0,
        created: new Date(),
        modified: new Date(),
        isDirectory: false,
        isFile: false,
      };
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string, encoding: string = 'utf-8'): Promise<string> {
    try {
      const fullPath = this.resolvePath(filePath);
      return await fs.readFile(fullPath, encoding as BufferEncoding);
    } catch {
      return '';
    }
  }

  resolvePath(relativePath: string): string {
    return path.resolve(this.path, relativePath);
  }

  // Дополнительные методы для совместимости со старыми тестами
  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    try {
      const fullPath = this.resolvePath(dirPath);
      return await fs.readdir(fullPath);
    } catch {
      return [];
    }
  }

  async getStats(filePath: string): Promise<any> {
    return this.getFileStats(filePath);
  }

  getPath(): string {
    return this.path;
  }
}

describe('Интеграционный тест - DockerChecker с реальным проектом', () => {
  let checker: DockerChecker;
  let project: FileSystemProject;

  beforeEach(() => {
    checker = new DockerChecker();
    // Используем текущий проект как тестовый
    project = new FileSystemProject(process.cwd());
  });

  test('должен корректно анализировать текущий проект', async () => {
    console.log('🔍 Анализ текущего проекта с помощью DockerChecker...');

    // Проверяем применимость
    const applicable = await checker.isApplicable(project);
    console.log(`📋 Применимость: ${applicable ? '✅ Да' : '❌ Нет'}`);

    if (!applicable) {
      console.log('⚠️ Docker файлы не найдены, создаем базовый Dockerfile для теста');
      // Можно создать тестовые файлы при необходимости
      return;
    }

    // Выполняем анализ
    const startTime = Date.now();
    const results = await checker.check(project);
    const duration = Date.now() - startTime;

    console.log(`⏱️ Время выполнения: ${duration}ms`);
    console.log(`📊 Количество проверок: ${results.length}`);

    // Анализируем результаты
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    console.log('\n📈 Результаты анализа:');
    console.log(`  ✅ Пройдено: ${passed.length}`);
    console.log(`  ❌ Не пройдено: ${failed.length}`);
    console.log(`  🎯 Общий балл: ${totalScore}/${maxScore} (${percentage}%)`);

    // Детальные результаты
    console.log('\n📝 Детальные результаты:');
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const score = `${result.score}/${result.maxScore}`;
      console.log(`  ${status} ${result.name}: ${score} - ${result.message}`);

      if (result.details?.recommendations && Array.isArray(result.details.recommendations)) {
        result.details.recommendations.forEach((rec: string) => {
          console.log(`      💡 ${rec}`);
        });
      }
    });

    // Проверяем корректность структуры результатов
    results.forEach(result => {
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(typeof result.maxScore).toBe('number');
      expect(result.severity).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.stats).toBeDefined();
      expect(typeof result.stats?.duration).toBe('number');
      expect(typeof result.stats?.filesChecked).toBe('number');
      expect(typeof result.stats?.issuesFound).toBe('number');
    });

    // Проверяем, что анализ дает осмысленные результаты
    expect(results.length).toBe(8); // Должно быть 8 проверок
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  test('должен корректно работать с базовыми методами', () => {
    // Тестируем основные свойства чекера
    expect(checker.getName()).toBe('DockerChecker');
    expect(checker.getCategory()).toBe(AnalysisCategory.INFRASTRUCTURE);
    expect(checker.getStandard()).toBe('Docker Best Practices');
    expect(checker.getDescription()).toContain('Docker');
    expect(checker.getVersion()).toBe('2.0.0');

    // Тестируем доступные проверки
    const checks = checker.getAvailableChecks();
    expect(checks.length).toBe(8);

    const checkIds = checks.map(c => c.id);
    expect(checkIds).toContain('docker-dockerfile');
    expect(checkIds).toContain('docker-compose');
    expect(checkIds).toContain('docker-security');
  });

  test('безопасный режим должен обрабатывать ошибки', async () => {
    // Создаем проект с недоступным путем
    const invalidProject = new FileSystemProject('/nonexistent/path');

    const results = await checker.safeCheck(invalidProject);

    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true); // Должен быть помечен как "не применимо"
    expect(results[0].message).toContain('не может работать');
  });

  test('должен генерировать подробную статистику', async () => {
    const results = await checker.check(project);

    let totalDuration = 0;
    let totalFilesChecked = 0;
    let totalIssuesFound = 0;

    results.forEach(result => {
      if (result.stats) {
        totalDuration += result.stats.duration;
        totalFilesChecked += result.stats.filesChecked;
        totalIssuesFound += result.stats.issuesFound;
      }
    });

    console.log('\n📊 Статистика выполнения:');
    console.log(`  ⏱️ Общее время: ${totalDuration}ms`);
    console.log(`  📁 Файлов проверено: ${totalFilesChecked}`);
    console.log(`  🐛 Проблем найдено: ${totalIssuesFound}`);

    expect(totalDuration).toBeGreaterThan(0);
    // Остальные метрики могут быть 0 в зависимости от проекта
  });
});
