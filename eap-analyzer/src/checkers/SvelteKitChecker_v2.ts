/**
 * Оптимизированный SvelteKit Framework Checker v2.0
 * Устранение дублирования кода и улучшение функциональности
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { CheckCategory, CheckContext, CheckLevel, CheckResult } from '../types/index.js';

interface FileCheckConfig {
  id: string;
  name: string;
  description: string;
  paths: string[];
  score: number;
  critical: boolean;
  level: CheckLevel;
  tags: string[];
  recommendations?: string[];
}

interface PackageJsonData {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

abstract class BaseFileChecker {
  protected context: CheckContext;

  constructor(context: CheckContext) {
    this.context = context;
  }

  protected async checkFile(config: FileCheckConfig): Promise<CheckResult> {
    const { path: foundPath, exists } = this.findFile(config.paths);

    let details = '';
    let score = exists ? config.score : 0;

    if (exists && foundPath) {
      try {
        const content = readFileSync(foundPath, 'utf-8');
        details = `${config.name} найден: ${foundPath.split('/').pop()}. Размер: ${content.length} символов`;
      } catch (error) {
        details = `Ошибка чтения ${config.name}: ${error}`;
        score = 0;
      }
    } else {
      details = `${config.name} не найден`;
    }

    return {
      check: {
        id: config.id,
        name: config.name,
        description: config.description,
        category: 'sveltekit' as CheckCategory,
        score: config.score,
        critical: config.critical,
        level: config.level,
        tags: config.tags,
      },
      passed: exists && score > 0,
      score,
      maxScore: config.score,
      details,
      recommendations: exists ? [] : config.recommendations || [],
    };
  }

  private findFile(paths: string[]): { path: string | null; exists: boolean } {
    for (const relativePath of paths) {
      const fullPath = join(this.context.projectPath, relativePath);
      if (existsSync(fullPath)) {
        return { path: fullPath, exists: true };
      }
    }
    return { path: null, exists: false };
  }

  protected getPackageJson(): { exists: boolean; data?: PackageJsonData; error?: string } {
    const packagePath = join(this.context.projectPath, 'package.json');

    if (!existsSync(packagePath)) {
      return { exists: false, error: 'package.json не найден' };
    }

    try {
      const content = readFileSync(packagePath, 'utf-8');
      const data = JSON.parse(content) as PackageJsonData;
      return { exists: true, data };
    } catch (error) {
      return { exists: false, error: `Ошибка парсинга package.json: ${error}` };
    }
  }
}

export class SvelteKitChecker extends BaseFileChecker {
  constructor(context: CheckContext) {
    super(context);
  }

  async checkAll(): Promise<CheckResult[]> {
    const checks = [
      this.checkSvelteKitConfig(),
      this.checkSvelteKitVersion(),
      this.checkViteConfig(),
      this.checkTailwindConfig(),
      this.checkPostCSSConfig(),
      this.checkAppHTML(),
      this.checkRoutesStructure(),
      this.checkLibStructure(),
      this.checkSvelteConfig(),
      this.checkTypeScriptConfig(),
    ];

    return Promise.all(checks);
  }

  private async checkSvelteKitConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'sveltekit-config',
      name: 'SvelteKit Configuration',
      description: 'Проверка конфигурации SvelteKit',
      paths: ['svelte.config.js', 'svelte.config.ts', 'svelte.config.mjs'],
      score: 10,
      critical: true,
      level: 'high',
      tags: ['sveltekit', 'config'],
      recommendations: [
        'Создайте svelte.config.js',
        'Настройте адаптер (@sveltejs/adapter-auto рекомендуется)',
        'Добавьте препроцессоры для TypeScript и PostCSS',
      ],
    });
  }

  private async checkSvelteKitVersion(): Promise<CheckResult> {
    const { exists, data, error } = this.getPackageJson();

    if (!exists) {
      return this.createErrorResult(
        'sveltekit-version',
        'SvelteKit Version Check',
        error || 'package.json не найден'
      );
    }

    const dependencies = data?.dependencies || {};
    const devDependencies = data?.devDependencies || {};

    const svelteKitVersion = devDependencies['@sveltejs/kit'] || dependencies['@sveltejs/kit'];

    const passed = !!svelteKitVersion;
    let details = '';
    let score = 0;

    if (passed) {
      details = `SvelteKit версия: ${svelteKitVersion}`;
      score = 10;

      if (svelteKitVersion.includes('1.')) {
        details += ' (устаревшая версия 1.x)';
        score = 7;
      } else if (svelteKitVersion.includes('2.')) {
        details += ' (актуальная версия 2.x)';
        score = 10;
      }
    } else {
      details = 'SvelteKit не найден в зависимостях';
    }

    return {
      check: {
        id: 'sveltekit-version',
        name: 'SvelteKit Version',
        description: 'Проверка версии SvelteKit',
        category: 'sveltekit' as CheckCategory,
        score: 10,
        critical: false,
        level: 'high',
        tags: ['sveltekit', 'version', 'dependencies'],
      },
      passed,
      score,
      maxScore: 10,
      details,
      recommendations: passed
        ? score < 10
          ? ['Обновите до актуальной версии 2.x']
          : []
        : ['Установите @sveltejs/kit как dev dependency', 'Используйте актуальную версию 2.x'],
    };
  }

  private async checkViteConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'vite-config',
      name: 'Vite Configuration',
      description: 'Проверка конфигурации Vite',
      paths: ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'],
      score: 8,
      critical: false,
      level: 'medium',
      tags: ['vite', 'config', 'build'],
      recommendations: [
        'Создайте vite.config.ts для TypeScript поддержки',
        'Настройте @sveltejs/vite-plugin-svelte',
        'Добавьте оптимизации для production',
      ],
    });
  }

  private async checkTailwindConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'tailwind-config',
      name: 'Tailwind CSS Configuration',
      description: 'Проверка конфигурации Tailwind CSS',
      paths: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'],
      score: 6,
      critical: false,
      level: 'low',
      tags: ['tailwind', 'css', 'styling'],
      recommendations: [
        'Создайте tailwind.config.js если используете Tailwind',
        'Настройте content paths для purging',
        'Добавьте пути к Svelte файлам',
      ],
    });
  }

  private async checkPostCSSConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'postcss-config',
      name: 'PostCSS Configuration',
      description: 'Проверка конфигурации PostCSS',
      paths: ['postcss.config.js', 'postcss.config.ts', 'postcss.config.cjs'],
      score: 5,
      critical: false,
      level: 'low',
      tags: ['postcss', 'css', 'processing'],
      recommendations: [
        'Создайте postcss.config.js для CSS обработки',
        'Добавьте autoprefixer для браузерной совместимости',
        'Настройте tailwindcss если используете Tailwind',
      ],
    });
  }

  private async checkAppHTML(): Promise<CheckResult> {
    return this.checkFile({
      id: 'app-html',
      name: 'App HTML Template',
      description: 'Проверка основного HTML шаблона',
      paths: ['src/app.html'],
      score: 8,
      critical: true,
      level: 'high',
      tags: ['html', 'template', 'structure'],
      recommendations: [
        'Создайте src/app.html',
        'Добавьте %sveltekit.head% в <head>',
        'Добавьте %sveltekit.body% в <body>',
      ],
    });
  }

  private async checkRoutesStructure(): Promise<CheckResult> {
    const routesPath = join(this.context.projectPath, 'src/routes');
    const passed = existsSync(routesPath);

    let details = '';
    let score = 0;

    if (passed) {
      details = 'Директория src/routes найдена';
      score = 8;

      const layoutExists = existsSync(join(routesPath, '+layout.svelte'));
      const pageExists = existsSync(join(routesPath, '+page.svelte'));

      if (layoutExists) {
        details += ', +layout.svelte найден';
        score += 1;
      }
      if (pageExists) {
        details += ', +page.svelte найден';
        score += 1;
      }
    } else {
      details = 'Директория src/routes не найдена';
    }

    return {
      check: {
        id: 'routes-structure',
        name: 'Routes Structure',
        description: 'Проверка структуры маршрутов',
        category: 'sveltekit' as CheckCategory,
        score: 10,
        critical: true,
        level: 'high',
        tags: ['routes', 'structure', 'pages'],
      },
      passed,
      score: Math.min(score, 10),
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : ['Создайте директорию src/routes', 'Добавьте +page.svelte для главной страницы'],
    };
  }

  private async checkLibStructure(): Promise<CheckResult> {
    const libPath = join(this.context.projectPath, 'src/lib');
    const passed = existsSync(libPath);

    return {
      check: {
        id: 'lib-structure',
        name: 'Library Structure',
        description: 'Проверка структуры библиотеки',
        category: 'sveltekit' as CheckCategory,
        score: 5,
        critical: false,
        level: 'low',
        tags: ['lib', 'structure', 'components'],
      },
      passed,
      score: passed ? 5 : 0,
      maxScore: 5,
      details: passed ? 'Директория src/lib найдена' : 'Директория src/lib не найдена',
      recommendations: passed ? [] : ['Создайте src/lib для переиспользуемых компонентов'],
    };
  }

  private async checkSvelteConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'svelte-component-config',
      name: 'Svelte Component Configuration',
      description: 'Проверка настроек Svelte компонентов',
      paths: ['src/app.d.ts'],
      score: 6,
      critical: false,
      level: 'medium',
      tags: ['svelte', 'types', 'configuration'],
      recommendations: ['Создайте src/app.d.ts для типов', 'Добавьте reference на @sveltejs/kit'],
    });
  }

  private async checkTypeScriptConfig(): Promise<CheckResult> {
    return this.checkFile({
      id: 'typescript-config',
      name: 'TypeScript Configuration',
      description: 'Проверка конфигурации TypeScript',
      paths: ['tsconfig.json'],
      score: 7,
      critical: false,
      level: 'medium',
      tags: ['typescript', 'config', 'types'],
      recommendations: [
        'Создайте tsconfig.json для TypeScript поддержки',
        'Наследуйте от .svelte-kit/tsconfig.json',
        'Настройте include для src директории',
      ],
    });
  }

  private createErrorResult(id: string, name: string, error: string): CheckResult {
    return {
      check: {
        id,
        name,
        description: 'Проверка завершилась с ошибкой',
        category: 'sveltekit' as CheckCategory,
        score: 0,
        critical: false,
        level: 'high',
        tags: ['error'],
      },
      passed: false,
      score: 0,
      maxScore: 10,
      details: error,
      recommendations: ['Исправьте ошибку конфигурации'],
    };
  }
}

export default SvelteKitChecker;
