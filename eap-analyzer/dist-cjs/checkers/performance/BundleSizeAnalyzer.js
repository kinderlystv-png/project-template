'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.BundleSizeAnalyzer = void 0;
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
/**
 * Анализатор размера бандла и зависимостей
 * Проверяет размеры файлов, package.json и webpack конфигурации
 */
class BundleSizeAnalyzer {
  name = 'Bundle Size Analyzer';
  category = 'bundling';
  maxBundleSize = 5 * 1024 * 1024; // 5MB
  maxChunkSize = 1 * 1024 * 1024; // 1MB
  async analyze(projectPath) {
    const startTime = Date.now();
    let score = 100;
    const issues = [];
    const recommendations = [];
    const metrics = {};
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
  async analyzePackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
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
  async analyzeBuildOutputs(projectPath) {
    const buildDirs = ['dist', 'build', 'public', 'out'];
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
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
  async analyzeStaticAssets(projectPath) {
    const assetsDirs = ['src/assets', 'public/assets', 'assets', 'static'];
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
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
  async analyzeWebpackConfig(projectPath) {
    const configFiles = [
      'webpack.config.js',
      'webpack.config.ts',
      'webpack.prod.js',
      'webpack.production.js',
      'next.config.js',
      'vite.config.js',
      'vite.config.ts',
    ];
    const metrics = { configFound: false };
    let penalty = 0;
    const issues = [];
    const recommendations = [];
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
  async getFolderSize(folderPath) {
    let totalSize = 0;
    let fileCount = 0;
    const largeFiles = [];
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
  async getFilesRecursively(dirPath) {
    const files = [];
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
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
exports.BundleSizeAnalyzer = BundleSizeAnalyzer;
exports.default = BundleSizeAnalyzer;
//# sourceMappingURL=BundleSizeAnalyzer.js.map
