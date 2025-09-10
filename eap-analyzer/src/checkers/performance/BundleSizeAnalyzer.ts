import * as fs from 'fs';
import * as path from 'path';

// Локальные интерфейсы для избежания circular imports
interface IPerformanceAnalyzer {
  readonly name: string;
  readonly category: string;
  analyze(projectPath: string): Promise<PerformanceResult>;
}

interface PerformanceResult {
  score: number;
  metrics: Record<string, unknown>;
  issues: Array<{ severity: string; message: string }>;
  recommendations: string[];
  analysisTime: number;
  details?: Record<string, unknown>;
}

/**
 * Анализатор размера бандла и зависимостей
 * Проверяет размеры файлов, package.json и webpack конфигурации
 */
export class BundleSizeAnalyzer implements IPerformanceAnalyzer {
  readonly name = 'Bundle Size Analyzer';
  readonly category = 'bundling';

  private readonly maxBundleSize = 5 * 1024 * 1024; // 5MB
  private readonly maxChunkSize = 1 * 1024 * 1024; // 1MB

  async analyze(projectPath: string): Promise<PerformanceResult> {
    const startTime = Date.now();
    let score = 100;
    const issues: Array<{ severity: string; message: string }> = [];
    const recommendations: string[] = [];
    const metrics: Record<string, unknown> = {};

    try {
      // Анализ package.json
      const packageAnalysis = await this.analyzePackageJson(projectPath);
      metrics.dependencies = packageAnalysis.metrics;
      score -= packageAnalysis.penalty;
      issues.push(...packageAnalysis.issues);
      recommendations.push(...packageAnalysis.recommendations);

      // Анализ dist/build папок
      const buildAnalysis = await this.analyzeBuildOutputs(projectPath);
      metrics.buildOutputs = buildAnalysis.metrics;
      score -= buildAnalysis.penalty;
      issues.push(...buildAnalysis.issues);
      recommendations.push(...buildAnalysis.recommendations);

      // Анализ статических ресурсов
      const assetsAnalysis = await this.analyzeStaticAssets(projectPath);
      metrics.staticAssets = assetsAnalysis.metrics;
      score -= assetsAnalysis.penalty;
      issues.push(...assetsAnalysis.issues);
      recommendations.push(...assetsAnalysis.recommendations);

      // Анализ webpack конфигурации
      const webpackAnalysis = await this.analyzeWebpackConfig(projectPath);
      metrics.webpackConfig = webpackAnalysis.metrics;
      score -= webpackAnalysis.penalty;
      issues.push(...webpackAnalysis.issues);
      recommendations.push(...webpackAnalysis.recommendations);

      return {
        score: Math.max(0, Math.round(score)),
        metrics,
        issues,
        recommendations,
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          category: this.category,
        },
      };
    } catch (error) {
      return {
        score: 0,
        metrics,
        issues: [{ severity: 'high', message: `Bundle size analysis failed: ${error}` }],
        recommendations: ['Fix bundle analysis errors before optimization'],
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Анализирует package.json на тяжелые зависимости
   */
  private async analyzePackageJson(projectPath: string): Promise<{
    metrics: Record<string, unknown>;
    penalty: number;
    issues: Array<{ severity: string; message: string }>;
    recommendations: string[];
  }> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const metrics: Record<string, unknown> = {};
    let penalty = 0;
    const issues: Array<{ severity: string; message: string }> = [];
    const recommendations: string[] = [];

    if (!fs.existsSync(packageJsonPath)) {
      return {
        metrics,
        penalty: 5,
        issues: [{ severity: 'medium', message: 'package.json not found' }],
        recommendations: [],
      };
    }

    try {
      const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = packageContent.dependencies || {};
      const devDeps = packageContent.devDependencies || {};

      metrics.dependenciesCount = Object.keys(deps).length;
      metrics.devDependenciesCount = Object.keys(devDeps).length;

      // Проверка тяжелых зависимостей
      const heavyDependencies = [
        'lodash',
        'moment',
        'jquery',
        'bootstrap',
        'material-ui',
        'antd',
        'semantic-ui-react',
        '@babel/polyfill',
      ];

      const foundHeavy = Object.keys(deps).filter(dep =>
        heavyDependencies.some(heavy => dep.includes(heavy))
      );

      if (foundHeavy.length > 0) {
        penalty += foundHeavy.length * 10;
        issues.push({
          severity: 'medium',
          message: `Heavy dependencies detected: ${foundHeavy.join(', ')}`,
        });
        recommendations.push(
          'Consider lighter alternatives or tree-shaking for heavy dependencies'
        );
      }

      // Проверка количества зависимостей
      if (Object.keys(deps).length > 50) {
        penalty += 15;
        issues.push({
          severity: 'medium',
          message: `Too many dependencies: ${Object.keys(deps).length}`,
        });
        recommendations.push('Audit and remove unused dependencies');
      }

      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 5,
        issues: [{ severity: 'medium', message: 'Failed to parse package.json' }],
        recommendations: ['Fix package.json syntax errors'],
      };
    }
  }

  /**
   * Анализирует размеры в папках dist/build
   */
  private async analyzeBuildOutputs(projectPath: string): Promise<{
    metrics: Record<string, unknown>;
    penalty: number;
    issues: Array<{ severity: string; message: string }>;
    recommendations: string[];
  }> {
    const buildDirs = ['dist', 'build', 'public', 'out'];
    const metrics: Record<string, unknown> = {};
    let penalty = 0;
    const issues: Array<{ severity: string; message: string }> = [];
    const recommendations: string[] = [];

    for (const buildDir of buildDirs) {
      const buildPath = path.join(projectPath, buildDir);
      if (!fs.existsSync(buildPath)) continue;

      try {
        const buildStats = await this.getFolderSize(buildPath);
        metrics[`${buildDir}Size`] = buildStats.totalSize;
        metrics[`${buildDir}Files`] = buildStats.fileCount;

        // Проверка общего размера
        if (buildStats.totalSize > this.maxBundleSize) {
          penalty += 20;
          issues.push({
            severity: 'high',
            message: `${buildDir} folder is too large: ${this.formatBytes(buildStats.totalSize)}`,
          });
          recommendations.push(
            `Optimize ${buildDir} folder size through code splitting and compression`
          );
        }

        // Проверка больших файлов
        const largeFiles = buildStats.largeFiles.filter(file => file.size > this.maxChunkSize);
        if (largeFiles.length > 0) {
          penalty += largeFiles.length * 5;
          issues.push({
            severity: 'medium',
            message: `Large files in ${buildDir}: ${largeFiles.map(f => f.name).join(', ')}`,
          });
          recommendations.push('Split large bundles into smaller chunks');
        }
      } catch (error) {
        penalty += 2;
        issues.push({
          severity: 'low',
          message: `Could not analyze ${buildDir}: ${error}`,
        });
      }
    }

    return { metrics, penalty, issues, recommendations };
  }

  /**
   * Анализирует статические ресурсы
   */
  private async analyzeStaticAssets(projectPath: string): Promise<{
    metrics: Record<string, unknown>;
    penalty: number;
    issues: Array<{ severity: string; message: string }>;
    recommendations: string[];
  }> {
    const assetsDirs = ['src/assets', 'public/assets', 'assets', 'static'];
    const metrics: Record<string, unknown> = {};
    let penalty = 0;
    const issues: Array<{ severity: string; message: string }> = [];
    const recommendations: string[] = [];

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const maxImageSize = 500 * 1024; // 500KB

    for (const assetsDir of assetsDirs) {
      const assetsPath = path.join(projectPath, assetsDir);
      if (!fs.existsSync(assetsPath)) continue;

      try {
        const files = await this.getFilesRecursively(assetsPath);
        const images = files.filter(file =>
          imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
        );

        metrics[`${assetsDir.replace('/', '_')}_images`] = images.length;

        for (const imagePath of images) {
          const stats = fs.statSync(imagePath);
          if (stats.size > maxImageSize) {
            penalty += 3;
            issues.push({
              severity: 'medium',
              message: `Large image: ${path.basename(imagePath)} (${this.formatBytes(stats.size)})`,
            });
          }
        }

        if (images.some(img => fs.statSync(img).size > maxImageSize)) {
          recommendations.push('Optimize images with compression or modern formats (WebP, AVIF)');
        }
      } catch (error) {
        penalty += 1;
        issues.push({
          severity: 'low',
          message: `Could not analyze ${assetsDir}: ${error}`,
        });
      }
    }

    return { metrics, penalty, issues, recommendations };
  }

  /**
   * Анализирует webpack конфигурацию на оптимизации
   */
  private async analyzeWebpackConfig(projectPath: string): Promise<{
    metrics: Record<string, unknown>;
    penalty: number;
    issues: Array<{ severity: string; message: string }>;
    recommendations: string[];
  }> {
    const configFiles = [
      'webpack.config.js',
      'webpack.config.ts',
      'webpack.prod.js',
      'webpack.production.js',
      'next.config.js',
      'vite.config.js',
      'vite.config.ts',
    ];

    const metrics: Record<string, unknown> = { configFound: false };
    let penalty = 0;
    const issues: Array<{ severity: string; message: string }> = [];
    const recommendations: string[] = [];

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (!fs.existsSync(configPath)) continue;

      metrics.configFound = true;
      metrics.configFile = configFile;

      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');

        // Проверка на оптимизации
        const hasMinification = /minify|uglify|terser/.test(configContent);
        const hasCompression = /compression|gzip/.test(configContent);
        const hasCodeSplitting = /splitChunks|dynamic.*import/.test(configContent);
        const hasTreeShaking = /usedExports|sideEffects/.test(configContent);

        metrics.hasMinification = hasMinification;
        metrics.hasCompression = hasCompression;
        metrics.hasCodeSplitting = hasCodeSplitting;
        metrics.hasTreeShaking = hasTreeShaking;

        if (!hasMinification) {
          penalty += 10;
          issues.push({ severity: 'medium', message: 'Minification not configured' });
          recommendations.push('Enable minification/uglification in build config');
        }

        if (!hasCompression) {
          penalty += 5;
          issues.push({ severity: 'low', message: 'Compression not configured' });
          recommendations.push('Enable gzip/brotli compression');
        }

        if (!hasCodeSplitting) {
          penalty += 15;
          issues.push({ severity: 'high', message: 'Code splitting not configured' });
          recommendations.push('Implement code splitting for better loading performance');
        }

        if (!hasTreeShaking) {
          penalty += 8;
          issues.push({ severity: 'medium', message: 'Tree shaking not optimized' });
          recommendations.push('Enable tree shaking to remove unused code');
        }

        break; // Анализируем только первый найденный конфиг
      } catch (error) {
        penalty += 3;
        issues.push({ severity: 'low', message: `Could not analyze ${configFile}: ${error}` });
      }
    }

    if (!metrics.configFound) {
      penalty += 5;
      issues.push({ severity: 'medium', message: 'No build configuration found' });
      recommendations.push('Add build configuration with optimization settings');
    }

    return { metrics, penalty, issues, recommendations };
  }

  /**
   * Получает размер папки и список больших файлов
   */
  private async getFolderSize(folderPath: string): Promise<{
    totalSize: number;
    fileCount: number;
    largeFiles: Array<{ name: string; size: number }>;
  }> {
    let totalSize = 0;
    let fileCount = 0;
    const largeFiles: Array<{ name: string; size: number }> = [];

    const files = await this.getFilesRecursively(folderPath);

    for (const filePath of files) {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      fileCount++;

      if (stats.size > 100 * 1024) {
        // > 100KB
        largeFiles.push({
          name: path.relative(folderPath, filePath),
          size: stats.size,
        });
      }
    }

    return { totalSize, fileCount, largeFiles };
  }

  /**
   * Получает все файлы в папке рекурсивно
   */
  private async getFilesRecursively(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.getFilesRecursively(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Форматирует байты в читаемый вид
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default BundleSizeAnalyzer;
