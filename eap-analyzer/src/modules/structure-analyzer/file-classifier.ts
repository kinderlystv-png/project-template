/**
 * Система умной классификации файлов
 * Определяет тип файла и его назначение для корректного анализа
 */
import * as path from 'path';
import * as fs from 'fs';

export enum FileCategory {
  SOURCE = 'source',
  TEST = 'test',
  CONFIG = 'config',
  GENERATED = 'generated',
  DOCUMENTATION = 'documentation',
  ASSET = 'asset',
  VENDOR = 'vendor',
  BUILD_SCRIPT = 'build_script',
}

export enum Framework {
  REACT = 'react',
  VUE = 'vue',
  SVELTE = 'svelte',
  ANGULAR = 'angular',
  NEXTJS = 'nextjs',
  NUXT = 'nuxt',
  EXPRESS = 'express',
  NESTJS = 'nestjs',
  UNKNOWN = 'unknown',
}

export interface FileClassification {
  category: FileCategory;
  confidence: number;
  framework?: Framework;
  purpose?: string;
  shouldAnalyze: boolean;
  isMinified?: boolean;
  isGenerated?: boolean;
  estimatedComplexity?: 'low' | 'medium' | 'high';
}

export class SmartFileClassifier {
  // Паттерны для классификации файлов
  private readonly patterns = {
    test: [
      /\.(test|spec|e2e)\.[jt]sx?$/,
      /\/__tests__\//,
      /\/(test|tests|testing|spec|specs|e2e)\//,
      /\.test\//,
      /cypress\//,
      /playwright\//,
      /jest\//,
      /vitest\//,
    ],

    config: [
      /^\.[\w]+rc(\.json|\.js|\.ts|\.yaml|\.yml)?$/,
      /\.(config|conf)\.[jt]s$/,
      /^(webpack|vite|rollup|babel|eslint|prettier|commitlint)/,
      /^(tsconfig|jsconfig|package|composer|Dockerfile)/,
      /^(tailwind|postcss|stylelint)\.config/,
      /\.env(\.|$)/,
    ],

    generated: [
      // Директории сборки
      /\/(dist|build|out|output|\.next|\.nuxt|\.svelte-kit|\.cache)\//,
      // Минифицированные файлы
      /\.(min|bundle|chunk)\./,
      // Webpack/Vite артефакты
      /index-[a-f0-9]{8,}/,
      /chunk-[a-f0-9]+/,
      /vendor\.[a-f0-9]+\./,
      /runtime\.[a-f0-9]+\./,
      /polyfills\.[a-f0-9]+\./,
      // TypeScript декларации
      /\.d\.ts$/,
      // Sourcemaps
      /\.map$/,
      // Lock файлы
      /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/,
    ],

    documentation: [
      /\.(md|mdx|rst|txt|adoc)$/,
      /^(README|CHANGELOG|LICENSE|CONTRIBUTING|CODE_OF_CONDUCT|SECURITY)/i,
      /\/(docs|documentation|wiki)\//,
      /\.github\//,
    ],

    asset: [
      /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
      /\.(css|scss|sass|less|styl)$/,
      /\.(woff|woff2|ttf|eot|otf)$/,
      /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
      /\/(assets|static|public|images|fonts|media)\//,
    ],

    vendor: [/node_modules\//, /vendor\//, /third[-_]party\//, /external\//, /libs?\//],

    buildScript: [
      /^(build|deploy|release|publish)\.*/,
      /scripts?\//,
      /gulpfile\./,
      /gruntfile\./,
      /makefile$/i,
      /\.sh$/,
      /\.bat$/,
      /\.ps1$/,
    ],
  };

  // Маркеры фреймворков
  private readonly frameworkMarkers = {
    react: {
      dependencies: ['react', 'react-dom', '@types/react'],
      imports: [/import.*from ['"]react['"]/, /import.*React/],
      patterns: [/\.jsx$/, /useState|useEffect|useCallback|useMemo/, /React\.Component/],
      files: ['src/App.jsx', 'src/App.tsx'],
    },

    nextjs: {
      dependencies: ['next'],
      imports: [/import.*from ['"]next\//, /getServerSideProps|getStaticProps|getStaticPaths/],
      patterns: [/pages\//, /app\//, /middleware\./],
      files: ['next.config.js', 'next.config.ts'],
    },

    vue: {
      dependencies: ['vue', '@vue/cli', 'nuxt'],
      imports: [/import.*from ['"]vue['"]/, /defineComponent|ref|reactive|computed/],
      patterns: [/\.vue$/, /<template>/, /<script.*setup>/],
      files: ['vue.config.js', 'nuxt.config.js'],
    },

    svelte: {
      dependencies: ['svelte', '@sveltejs/kit'],
      imports: [/import.*from ['"]svelte/, /\$:/],
      patterns: [/\.svelte$/, /<script>/, /\$lib\//],
      files: ['svelte.config.js', 'vite.config.js'],
    },

    angular: {
      dependencies: ['@angular/core', '@angular/cli'],
      imports: [/import.*from ['"]@angular\//, /@Component|@Injectable|@NgModule/],
      patterns: [/\.component\.ts$/, /\.service\.ts$/, /\.module\.ts$/],
      files: ['angular.json', 'ng-package.json'],
    },
  };

  async classify(filePath: string, content?: string): Promise<FileClassification> {
    const normalizedPath = this.normalizePath(filePath);

    // 1. Vendor файлы (высший приоритет)
    if (this.matchesPatterns(normalizedPath, this.patterns.vendor)) {
      return {
        category: FileCategory.VENDOR,
        confidence: 0.95,
        purpose: 'external dependency',
        shouldAnalyze: false,
      };
    }

    // 2. Сгенерированные файлы
    const generatedClassification = this.classifyGenerated(normalizedPath, content);
    if (generatedClassification) {
      return generatedClassification;
    }

    // 3. Конфигурационные файлы
    if (this.matchesPatterns(normalizedPath, this.patterns.config)) {
      return {
        category: FileCategory.CONFIG,
        confidence: 0.9,
        purpose: 'configuration',
        shouldAnalyze: true,
        estimatedComplexity: 'low',
      };
    }

    // 4. Скрипты сборки
    if (this.matchesPatterns(normalizedPath, this.patterns.buildScript)) {
      return {
        category: FileCategory.BUILD_SCRIPT,
        confidence: 0.9,
        purpose: 'build automation',
        shouldAnalyze: true,
        estimatedComplexity: 'medium',
      };
    }

    // 5. Тестовые файлы
    if (this.matchesPatterns(normalizedPath, this.patterns.test)) {
      return {
        category: FileCategory.TEST,
        confidence: 0.9,
        framework: content ? this.detectTestFramework(content) : undefined,
        purpose: 'testing',
        shouldAnalyze: true,
        estimatedComplexity: 'medium',
      };
    }

    // 6. Документация
    if (this.matchesPatterns(normalizedPath, this.patterns.documentation)) {
      return {
        category: FileCategory.DOCUMENTATION,
        confidence: 0.95,
        purpose: 'documentation',
        shouldAnalyze: false,
      };
    }

    // 7. Ассеты
    if (this.matchesPatterns(normalizedPath, this.patterns.asset)) {
      return {
        category: FileCategory.ASSET,
        confidence: 0.95,
        purpose: 'static resource',
        shouldAnalyze: false,
      };
    }

    // 8. Исходный код (по умолчанию)
    return this.classifySourceCode(normalizedPath, content);
  }

  private classifyGenerated(filePath: string, content?: string): FileClassification | null {
    // Проверка пути
    if (this.matchesPatterns(filePath, this.patterns.generated)) {
      return {
        category: FileCategory.GENERATED,
        confidence: 0.95,
        purpose: 'build artifact',
        shouldAnalyze: false,
        isGenerated: true,
      };
    }

    // Проверка содержимого на признаки генерации
    if (content) {
      const generationMarkers = [
        /^\/\*\s*@generated/,
        /^\/\/\s*@generated/,
        /^\/\*!\s*(webpack|vite|rollup)/i,
        /^"use strict";var /, // Минифицированный код
        /webpackJsonp/,
        /__webpack_require__/,
        /\/\*\s*eslint-disable\s*\*\//,
      ];

      const firstLine = content.split('\n')[0];
      if (generationMarkers.some(marker => marker.test(firstLine))) {
        return {
          category: FileCategory.GENERATED,
          confidence: 0.9,
          purpose: 'generated code',
          shouldAnalyze: false,
          isGenerated: true,
        };
      }

      // Проверка на минификацию
      if (this.isMinified(content)) {
        return {
          category: FileCategory.GENERATED,
          confidence: 0.85,
          purpose: 'minified code',
          shouldAnalyze: false,
          isMinified: true,
        };
      }
    }

    return null;
  }

  private classifySourceCode(filePath: string, content?: string): FileClassification {
    // Проверяем расширение файла
    const ext = path.extname(filePath).toLowerCase();
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.mjs', '.cjs'];

    if (!sourceExtensions.includes(ext)) {
      return {
        category: FileCategory.SOURCE,
        confidence: 0.3,
        purpose: 'unknown',
        shouldAnalyze: false,
      };
    }

    // Определяем фреймворк
    const framework = content
      ? this.detectFramework(filePath, content)
      : this.detectFrameworkByPath(filePath);

    // Оценка сложности на основе содержимого
    const estimatedComplexity = content ? this.estimateComplexity(content) : 'medium';

    return {
      category: FileCategory.SOURCE,
      confidence: 0.8,
      framework,
      purpose: 'application code',
      shouldAnalyze: true,
      estimatedComplexity,
    };
  }

  private detectFramework(filePath: string, content: string): Framework {
    for (const [framework, markers] of Object.entries(this.frameworkMarkers)) {
      let score = 0;

      // Проверка импортов
      if (markers.imports?.some(pattern => pattern.test(content))) {
        score += 3;
      }

      // Проверка паттернов
      if (markers.patterns?.some(pattern => pattern.test(content) || pattern.test(filePath))) {
        score += 2;
      }

      // Проверка расширения файла
      if (framework === 'vue' && filePath.endsWith('.vue')) score += 3;
      if (framework === 'svelte' && filePath.endsWith('.svelte')) score += 3;

      if (score >= 3) {
        return framework as Framework;
      }
    }

    return Framework.UNKNOWN;
  }

  private detectFrameworkByPath(filePath: string): Framework {
    const pathIndicators = {
      [Framework.NEXTJS]: [/pages\//, /app\//, /next\.config\./],
      [Framework.NUXT]: [/nuxt\.config\./, /\.nuxt\//, /pages\//],
      [Framework.REACT]: [/src\/components\//, /\.jsx$/],
      [Framework.VUE]: [/\.vue$/, /src\/views\//],
      [Framework.SVELTE]: [/\.svelte$/, /src\/routes\//],
      [Framework.ANGULAR]: [/\.component\.ts$/, /\.service\.ts$/],
    };

    for (const [framework, patterns] of Object.entries(pathIndicators)) {
      if (patterns.some(pattern => pattern.test(filePath))) {
        return framework as Framework;
      }
    }

    return Framework.UNKNOWN;
  }

  private detectTestFramework(content: string): Framework {
    const testFrameworks = {
      jest: [/describe\(|test\(|it\(|expect\(/],
      vitest: [/import.*vitest|from ['"]vitest/],
      cypress: [/cy\.|Cypress/],
      playwright: [/test\(.*async|page\./],
    };

    for (const [framework, patterns] of Object.entries(testFrameworks)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return framework as Framework;
      }
    }

    return Framework.UNKNOWN;
  }

  private isMinified(content: string): boolean {
    if (content.length < 1000) return false;

    const lines = content.split('\n');

    // Если менее 10 строк, но больше 5000 символов - вероятно минифицированный
    if (lines.length < 10 && content.length > 5000) {
      return true;
    }

    // Средняя длина строки больше 300 символов
    const avgLineLength = content.length / lines.length;
    if (avgLineLength > 300) {
      return true;
    }

    // Отсутствие отступов и переносов строк
    const indentedLines = lines.filter(line => line.startsWith('  ') || line.startsWith('\t'));
    if (indentedLines.length / lines.length < 0.1) {
      return true;
    }

    return false;
  }

  private estimateComplexity(content: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      high: [
        /class\s+\w+.*extends/g,
        /async\s+function|function\s*\*|=>\s*{/g,
        /if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g,
        /try\s*{|catch\s*\(|finally\s*{/g,
      ],
      medium: [
        /function\s+\w+|const\s+\w+\s*=/g,
        /\?\s*:|&&|\|\|/g,
        /\.map\(|\.filter\(|\.reduce\(/g,
      ],
    };

    let score = 0;

    // Подсчет сложных конструкций
    for (const patterns of complexityIndicators.high) {
      const matches = content.match(patterns);
      score += (matches?.length || 0) * 3;
    }

    for (const patterns of complexityIndicators.medium) {
      const matches = content.match(patterns);
      score += (matches?.length || 0) * 1;
    }

    // Нормализация по размеру файла
    const lines = content.split('\n').length;
    const normalizedScore = score / Math.max(lines / 100, 1);

    if (normalizedScore > 10) return 'high';
    if (normalizedScore > 3) return 'medium';
    return 'low';
  }

  private matchesPatterns(filePath: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(filePath));
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Массовая классификация файлов для оптимизации производительности
   */
  async classifyFiles(filePaths: string[]): Promise<Map<string, FileClassification>> {
    const results = new Map<string, FileClassification>();

    console.log(`🏷️ Классифицируем ${filePaths.length} файлов...`);

    for (const filePath of filePaths) {
      try {
        // Для больших файлов читаем только первые 1000 строк для анализа
        let content: string | undefined;

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size < 100 * 1024) {
            // Файлы меньше 100KB
            content = fs.readFileSync(filePath, 'utf-8');
          } else {
            // Читаем только начало большого файла
            const buffer = Buffer.alloc(Math.min(stats.size, 10 * 1024));
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, 0);
            fs.closeSync(fd);
            content = buffer.toString('utf-8');
          }
        }

        const classification = await this.classify(filePath, content);
        results.set(filePath, classification);
      } catch (error) {
        console.warn(`⚠️ Ошибка при классификации файла ${filePath}:`, error);

        // Fallback классификация только по пути
        const fallbackClassification = await this.classify(filePath);
        results.set(filePath, fallbackClassification);
      }
    }

    console.log(`✅ Классификация завершена`);
    return results;
  }
}
