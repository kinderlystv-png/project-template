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
exports.RuntimeMetricsAnalyzer = void 0;
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
/**
 * Анализатор runtime производительности и Core Web Vitals
 * Анализирует JavaScript код на предмет runtime performance паттернов
 */
class RuntimeMetricsAnalyzer {
  name = 'Runtime Metrics Analyzer';
  category = 'runtime';
  performanceThresholds = {
    // Core Web Vitals thresholds (в миллисекундах)
    largestContentfulPaint: 2500, // LCP < 2.5s
    firstInputDelay: 100, // FID < 100ms
    cumulativeLayoutShift: 0.1, // CLS < 0.1
    // Runtime thresholds
    domOperationsPerSecond: 1000, // DOM operations/sec
    memoryUsageMB: 50, // Memory usage in MB
    jsExecutionTime: 1000, // JS execution time
    // Code analysis thresholds
    maxFunctionComplexity: 10, // Cyclomatic complexity
    maxFileSize: 100000, // File size in bytes (100KB)
    maxDOMQueries: 50, // querySelector calls per file
  };
  async analyze(projectPath) {
    const startTime = Date.now();
    let score = 100;
    const issues = [];
    const recommendations = [];
    const metrics = {};
    try {
      // 1. Анализ JavaScript файлов на runtime паттерны
      const jsAnalysis = await this.analyzeJavaScriptPerformance(projectPath);
      metrics.jsPerformance = jsAnalysis.metrics;
      score -= jsAnalysis.penalty;
      issues.push(...jsAnalysis.issues);
      recommendations.push(...jsAnalysis.recommendations);
      // 2. Симуляция Core Web Vitals на основе кода
      const webVitalsAnalysis = await this.analyzeCoreWebVitals(projectPath);
      metrics.coreWebVitals = webVitalsAnalysis.metrics;
      score -= webVitalsAnalysis.penalty;
      issues.push(...webVitalsAnalysis.issues);
      recommendations.push(...webVitalsAnalysis.recommendations);
      // 3. Анализ DOM operations в коде
      const domAnalysis = await this.analyzeDOMOperations(projectPath);
      metrics.domOperations = domAnalysis.metrics;
      score -= domAnalysis.penalty;
      issues.push(...domAnalysis.issues);
      recommendations.push(...domAnalysis.recommendations);
      // 4. Анализ памяти и performance API usage
      const memoryAnalysis = await this.analyzeMemoryPatterns(projectPath);
      metrics.memoryPatterns = memoryAnalysis.metrics;
      score -= memoryAnalysis.penalty;
      issues.push(...memoryAnalysis.issues);
      recommendations.push(...memoryAnalysis.recommendations);
      // 5. Framework-specific runtime оптимизации
      const frameworkAnalysis = await this.analyzeFrameworkPerformance(projectPath);
      metrics.frameworkOptimizations = frameworkAnalysis.metrics;
      score -= frameworkAnalysis.penalty;
      issues.push(...frameworkAnalysis.issues);
      recommendations.push(...frameworkAnalysis.recommendations);
      return {
        score: Math.max(0, Math.round(score)),
        metrics,
        issues,
        recommendations,
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          category: this.category,
          thresholds: this.performanceThresholds,
        },
      };
    } catch (error) {
      return {
        score: 0,
        metrics,
        issues: [{ severity: 'high', message: `Runtime analysis failed: ${error}` }],
        recommendations: ['Fix runtime analysis errors before optimization'],
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  /**
   * Анализирует JavaScript файлы на performance паттерны
   */
  async analyzeJavaScriptPerformance(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const jsFiles = await this.findJavaScriptFiles(projectPath);
      metrics.totalJSFiles = jsFiles.length;
      let totalLinesOfCode = 0;
      let complexFunctions = 0;
      let largeFiles = 0;
      let asyncAwaitUsage = 0;
      let promiseUsage = 0;
      for (const filePath of jsFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        totalLinesOfCode += lines.length;
        // Проверка размера файла
        const fileSize = content.length;
        if (fileSize > this.performanceThresholds.maxFileSize) {
          largeFiles++;
          penalty += 5;
          issues.push({
            severity: 'medium',
            message: `Large JS file: ${path.basename(filePath)} (${this.formatBytes(fileSize)})`,
          });
        }
        // Анализ сложности функций (упрощенный)
        const functionComplexity = this.calculateFunctionComplexity(content);
        if (functionComplexity > this.performanceThresholds.maxFunctionComplexity) {
          complexFunctions++;
          penalty += 8;
          issues.push({
            severity: 'high',
            message: `High complexity function in ${path.basename(filePath)}`,
          });
        }
        // Проверка async/await vs Promise паттернов
        const asyncMatches = content.match(/async\s+function|async\s*\(|async\s+\w+\s*=>/g);
        const promiseMatches = content.match(/\.then\(|\.catch\(|new Promise\(/g);
        if (asyncMatches) asyncAwaitUsage += asyncMatches.length;
        if (promiseMatches) promiseUsage += promiseMatches.length;
        // Проверка блокирующих операций
        const blockingPatterns = [
          /document\.write\(/g,
          /alert\(/g,
          /confirm\(/g,
          /prompt\(/g,
          /synchronous.*xhr/gi,
        ];
        blockingPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            penalty += matches.length * 10;
            issues.push({
              severity: 'high',
              message: `Blocking operation detected in ${path.basename(filePath)}`,
            });
          }
        });
      }
      metrics.totalLinesOfCode = totalLinesOfCode;
      metrics.averageFileSize = jsFiles.length > 0 ? totalLinesOfCode / jsFiles.length : 0;
      metrics.complexFunctions = complexFunctions;
      metrics.largeFiles = largeFiles;
      metrics.asyncAwaitUsage = asyncAwaitUsage;
      metrics.promiseUsage = promiseUsage;
      // Рекомендации
      if (largeFiles > 0) {
        recommendations.push('Split large JavaScript files into smaller modules');
      }
      if (complexFunctions > 0) {
        recommendations.push('Reduce function complexity and refactor complex logic');
      }
      if (promiseUsage > asyncAwaitUsage * 2) {
        recommendations.push(
          'Consider migrating from Promises to async/await for better readability'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 10,
        issues: [{ severity: 'medium', message: `JS analysis failed: ${error}` }],
        recommendations: ['Fix JavaScript analysis errors'],
      };
    }
  }
  /**
   * Симулирует анализ Core Web Vitals на основе кода
   */
  async analyzeCoreWebVitals(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      // Симуляция LCP (Largest Contentful Paint)
      const lcpFactors = await this.analyzeLCPFactors(projectPath);
      metrics.lcpFactors = lcpFactors;
      // Симуляция FID (First Input Delay)
      const fidFactors = await this.analyzeFIDFactors(projectPath);
      metrics.fidFactors = fidFactors;
      // Симуляция CLS (Cumulative Layout Shift)
      const clsFactors = await this.analyzeCLSFactors(projectPath);
      metrics.clsFactors = clsFactors;
      // Оценка LCP
      if (lcpFactors.largeImages > 3) {
        penalty += 15;
        issues.push({
          severity: 'high',
          message: `Too many large images affecting LCP: ${lcpFactors.largeImages}`,
        });
        recommendations.push('Optimize images with WebP format and proper sizing');
      }
      // Оценка FID
      if (fidFactors.heavyJSBlocks > 2) {
        penalty += 12;
        issues.push({
          severity: 'medium',
          message: `Heavy JavaScript blocks may affect FID: ${fidFactors.heavyJSBlocks}`,
        });
        recommendations.push('Split heavy JavaScript into smaller chunks and use code splitting');
      }
      // Оценка CLS
      if (clsFactors.dynamicContent > 5) {
        penalty += 10;
        issues.push({
          severity: 'medium',
          message: `Dynamic content insertion may cause layout shifts: ${clsFactors.dynamicContent}`,
        });
        recommendations.push('Reserve space for dynamic content and use CSS containment');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 5,
        issues: [{ severity: 'low', message: `Core Web Vitals analysis failed: ${error}` }],
        recommendations: ['Enable Core Web Vitals monitoring'],
      };
    }
  }
  /**
   * Анализирует DOM operations в коде
   */
  async analyzeDOMOperations(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const jsFiles = await this.findJavaScriptFiles(projectPath);
      let totalDOMQueries = 0;
      let inefficientQueries = 0;
      let domModifications = 0;
      let eventListeners = 0;
      for (const filePath of jsFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Подсчет DOM queries
        const querySelectors = content.match(
          /querySelector|querySelectorAll|getElementById|getElementsBy/g
        );
        if (querySelectors) {
          totalDOMQueries += querySelectors.length;
          // Проверка на избыточные queries в одном файле
          if (querySelectors.length > this.performanceThresholds.maxDOMQueries) {
            inefficientQueries++;
            penalty += 8;
            issues.push({
              severity: 'medium',
              message: `Too many DOM queries in ${path.basename(filePath)}: ${querySelectors.length}`,
            });
          }
        }
        // Подсчет DOM modifications
        const domMods = content.match(
          /innerHTML|appendChild|removeChild|createElement|insertBefore/g
        );
        if (domMods) {
          domModifications += domMods.length;
        }
        // Подсчет event listeners
        const eventListenerMatches = content.match(/addEventListener|removeEventListener/g);
        if (eventListenerMatches) {
          eventListeners += eventListenerMatches.length;
        }
        // Проверка на потенциально медленные операции
        const slowOperations = [
          /getComputedStyle/g,
          /getBoundingClientRect/g,
          /offsetWidth|offsetHeight/g,
          /scrollWidth|scrollHeight/g,
        ];
        slowOperations.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && matches.length > 5) {
            penalty += 5;
            issues.push({
              severity: 'medium',
              message: `Potential layout thrashing in ${path.basename(filePath)}`,
            });
          }
        });
      }
      metrics.totalDOMQueries = totalDOMQueries;
      metrics.domModifications = domModifications;
      metrics.eventListeners = eventListeners;
      metrics.inefficientQueries = inefficientQueries;
      // Рекомендации
      if (inefficientQueries > 0) {
        recommendations.push('Cache DOM query results and use efficient selectors');
      }
      if (domModifications > totalDOMQueries * 2) {
        recommendations.push('Batch DOM modifications to minimize reflows');
      }
      if (eventListeners > jsFiles.length * 10) {
        recommendations.push('Consider using event delegation for better performance');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 3,
        issues: [{ severity: 'low', message: `DOM analysis failed: ${error}` }],
        recommendations: ['Review DOM operation patterns'],
      };
    }
  }
  /**
   * Анализирует паттерны использования памяти
   */
  async analyzeMemoryPatterns(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const jsFiles = await this.findJavaScriptFiles(projectPath);
      let memoryLeakRisks = 0;
      let largeDataStructures = 0;
      let inefficientLoops = 0;
      for (const filePath of jsFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Поиск потенциальных утечек памяти
        const leakPatterns = [
          /setInterval(?!.*clearInterval)/g, // setInterval without clearInterval
          /setTimeout.*function.*\{.*\}/g, // Complex setTimeout callbacks
          /addEventListener(?!.*removeEventListener)/g, // Event listeners without cleanup
          /new.*Worker/g, // Web Workers
        ];
        leakPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            memoryLeakRisks += matches.length;
            penalty += matches.length * 3;
          }
        });
        // Поиск больших структур данных
        const largeDataPatterns = [
          /new Array\(\d{4,}\)/g, // Large arrays
          /\.map\(.*\.map\(/g, // Nested maps
          /for.*for.*for/g, // Triple nested loops
        ];
        largeDataPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            largeDataStructures += matches.length;
            penalty += matches.length * 5;
          }
        });
        // Проверка на неэффективные циклы
        const inefficientPatterns = [
          /for.*length/g, // Loop without cached length
          /while.*querySelector/g, // DOM queries in loops
          /forEach.*appendChild/g, // DOM modifications in forEach
        ];
        inefficientPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            inefficientLoops += matches.length;
            penalty += matches.length * 4;
          }
        });
      }
      metrics.memoryLeakRisks = memoryLeakRisks;
      metrics.largeDataStructures = largeDataStructures;
      metrics.inefficientLoops = inefficientLoops;
      // Добавление issues
      if (memoryLeakRisks > 0) {
        issues.push({
          severity: 'high',
          message: `Potential memory leaks detected: ${memoryLeakRisks} patterns`,
        });
        recommendations.push('Add proper cleanup for intervals, timeouts and event listeners');
      }
      if (largeDataStructures > 0) {
        issues.push({
          severity: 'medium',
          message: `Large data structures detected: ${largeDataStructures} instances`,
        });
        recommendations.push('Consider data pagination and lazy loading for large datasets');
      }
      if (inefficientLoops > 0) {
        issues.push({
          severity: 'medium',
          message: `Inefficient loop patterns: ${inefficientLoops} instances`,
        });
        recommendations.push(
          'Optimize loops by caching values and avoiding DOM operations inside loops'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 2,
        issues: [{ severity: 'low', message: `Memory analysis failed: ${error}` }],
        recommendations: ['Enable memory profiling'],
      };
    }
  }
  /**
   * Анализирует framework-specific оптимизации
   */
  async analyzeFrameworkPerformance(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      // Определение фреймворка
      const framework = await this.detectFramework(projectPath);
      metrics.detectedFramework = framework;
      if (framework === 'react') {
        const reactAnalysis = await this.analyzeReactPerformance(projectPath);
        Object.assign(metrics, reactAnalysis.metrics);
        penalty += reactAnalysis.penalty;
        issues.push(...reactAnalysis.issues);
        recommendations.push(...reactAnalysis.recommendations);
      } else if (framework === 'vue') {
        const vueAnalysis = await this.analyzeVuePerformance(projectPath);
        Object.assign(metrics, vueAnalysis.metrics);
        penalty += vueAnalysis.penalty;
        issues.push(...vueAnalysis.issues);
        recommendations.push(...vueAnalysis.recommendations);
      } else if (framework === 'svelte') {
        const svelteAnalysis = await this.analyzeSveltePerformance(projectPath);
        Object.assign(metrics, svelteAnalysis.metrics);
        penalty += svelteAnalysis.penalty;
        issues.push(...svelteAnalysis.issues);
        recommendations.push(...svelteAnalysis.recommendations);
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 1,
        issues: [{ severity: 'low', message: `Framework analysis failed: ${error}` }],
        recommendations: ['Consider framework-specific optimizations'],
      };
    }
  }
  // === HELPER METHODS ===
  async findJavaScriptFiles(projectPath) {
    const jsFiles = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    const searchDirectory = dirPath => {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (
          entry.isDirectory() &&
          !['node_modules', '.git', 'dist', 'build'].includes(entry.name)
        ) {
          searchDirectory(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          jsFiles.push(fullPath);
        }
      }
    };
    searchDirectory(projectPath);
    return jsFiles;
  }
  calculateFunctionComplexity(content) {
    // Упрощенный анализ цикломатической сложности
    const complexityPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\b/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // Ternary operators
      /&&|\|\|/g, // Logical operators
    ];
    return complexityPatterns.reduce((complexity, pattern) => {
      const matches = content.match(pattern);
      return complexity + (matches ? matches.length : 0);
    }, 1); // Base complexity is 1
  }
  async analyzeLCPFactors(projectPath) {
    let largeImages = 0;
    let unoptimizedImages = 0;
    // Проверка папок с изображениями
    const imageDirs = ['src/assets', 'public', 'static', 'images'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    for (const dir of imageDirs) {
      const fullPath = path.join(projectPath, dir);
      if (fs.existsSync(fullPath)) {
        const files = await this.getFilesRecursively(fullPath);
        for (const filePath of files) {
          if (imageExtensions.some(ext => filePath.toLowerCase().endsWith(ext))) {
            const stats = fs.statSync(filePath);
            if (stats.size > 500 * 1024) {
              // > 500KB
              largeImages++;
            }
            if (!filePath.toLowerCase().includes('webp')) {
              unoptimizedImages++;
            }
          }
        }
      }
    }
    return { largeImages, unoptimizedImages };
  }
  async analyzeFIDFactors(projectPath) {
    const jsFiles = await this.findJavaScriptFiles(projectPath);
    let heavyJSBlocks = 0;
    let longTasks = 0;
    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      // Проверка на длинные блоки кода (потенциально долгие задачи)
      if (lines.length > 500) {
        heavyJSBlocks++;
      }
      // Поиск потенциально долгих операций
      const heavyOperations = [
        /for\s*\([^)]*;\s*\w+\s*<\s*\d{4,}/g, // Large loops
        /while\s*\([^)]*\.length\s*>\s*\d{3,}/g, // Long while loops
        /JSON\.parse\s*\(\s*.*\s*\)/g, // JSON parsing
        /JSON\.stringify\s*\(\s*.*\s*\)/g, // JSON stringifying
      ];
      heavyOperations.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) longTasks += matches.length;
      });
    }
    return { heavyJSBlocks, longTasks };
  }
  async analyzeCLSFactors(projectPath) {
    const jsFiles = await this.findJavaScriptFiles(projectPath);
    let dynamicContent = 0;
    let layoutShiftRisks = 0;
    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Поиск динамической вставки контента
      const dynamicPatterns = [
        /innerHTML\s*=/g,
        /appendChild/g,
        /insertBefore/g,
        /insertAdjacentHTML/g,
      ];
      dynamicPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) dynamicContent += matches.length;
      });
      // Поиск операций, вызывающих layout shift
      const shiftPatterns = [
        /style\..*=.*px/g, // Dynamic styling
        /classList\.add/g, // Class additions
        /setAttribute.*style/g, // Style attributes
      ];
      shiftPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) layoutShiftRisks += matches.length;
      });
    }
    return { dynamicContent, layoutShiftRisks };
  }
  async detectFramework(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.svelte) return 'svelte';
      if (deps.angular || deps['@angular/core']) return 'angular';
    }
    return 'vanilla';
  }
  async analyzeReactPerformance(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    const jsFiles = await this.findJavaScriptFiles(projectPath);
    let unnecessaryRerenders = 0;
    let missingMemoization = 0;
    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Проверка на отсутствие мemoization
      if (
        content.includes('useEffect') &&
        !content.includes('useMemo') &&
        !content.includes('useCallback')
      ) {
        missingMemoization++;
        penalty += 5;
      }
      // Проверка на потенциальные лишние ререндеры
      if (content.includes('useState') && content.includes('map(') && !content.includes('key=')) {
        unnecessaryRerenders++;
        penalty += 8;
        issues.push({
          severity: 'medium',
          message: `Missing keys in lists may cause unnecessary re-renders in ${path.basename(filePath)}`,
        });
      }
    }
    metrics.unnecessaryRerenders = unnecessaryRerenders;
    metrics.missingMemoization = missingMemoization;
    if (missingMemoization > 0) {
      recommendations.push('Consider using useMemo and useCallback for expensive operations');
    }
    return { metrics, penalty, issues, recommendations };
  }
  async analyzeVuePerformance(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    // Простой анализ Vue производительности
    const vueFiles = (await this.findJavaScriptFiles(projectPath)).filter(
      file => file.endsWith('.vue') || fs.readFileSync(file, 'utf-8').includes('Vue')
    );
    metrics.vueFiles = vueFiles.length;
    if (vueFiles.length > 0) {
      recommendations.push('Consider using Vue 3 Composition API for better performance');
    }
    return { metrics, penalty, issues, recommendations };
  }
  async analyzeSveltePerformance(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    // Простой анализ Svelte производительности
    const svelteFiles = (await this.findJavaScriptFiles(projectPath)).filter(file =>
      file.endsWith('.svelte')
    );
    metrics.svelteFiles = svelteFiles.length;
    if (svelteFiles.length > 0) {
      recommendations.push(
        'Svelte provides good performance out of the box, consider using stores for state management'
      );
    }
    return { metrics, penalty, issues, recommendations };
  }
  async getFilesRecursively(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath)) return files;
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
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
exports.RuntimeMetricsAnalyzer = RuntimeMetricsAnalyzer;
exports.default = RuntimeMetricsAnalyzer;
//# sourceMappingURL=RuntimeMetricsAnalyzer.js.map
