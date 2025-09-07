/**
 * SvelteKit Framework Checker
 * Проверки конфигурации и настройки SvelteKit
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { CheckCategory, CheckContext, CheckLevel, CheckResult } from '../types/index.js';

export class SvelteKitChecker {
  private context: CheckContext;

  constructor(context: CheckContext) {
    this.context = context;
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
    const configPath = join(this.context.projectPath, 'svelte.config.js');
    const passed = existsSync(configPath);

    let details = '';
    if (passed) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        details = `SvelteKit конфигурация найдена. Размер: ${content.length} символов`;

        // Проверим основные настройки
        const hasAdapter = content.includes('@sveltejs/adapter');
        const hasPreprocess = content.includes('preprocess');

        if (!hasAdapter) details += '. Предупреждение: адаптер не настроен';
        if (!hasPreprocess) details += '. Предупреждение: препроцессор не настроен';
      } catch (error) {
        details = `Ошибка чтения конфигурации: ${error}`;
      }
    } else {
      details = 'svelte.config.js не найден';
    }

    return {
      check: {
        id: 'sveltekit-config',
        name: 'SvelteKit Configuration',
        description: 'Проверка наличия и корректности svelte.config.js',
        category: 'sveltekit' as CheckCategory,
        score: 15,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['sveltekit', 'config', 'setup'],
      },
      passed,
      score: passed ? 15 : 0,
      maxScore: 15,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте svelte.config.js с базовой конфигурацией',
            'Настройте адаптер для вашей платформы',
            'Добавьте preprocessors для TypeScript и CSS',
          ],
    };
  }

  private async checkSvelteKitVersion(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const svelteKitVersion =
          pkg.devDependencies?.['@sveltejs/kit'] || pkg.dependencies?.['@sveltejs/kit'];

        if (svelteKitVersion) {
          passed = true;
          details = `SvelteKit версия: ${svelteKitVersion}`;

          // Проверим актуальность версии (2.x считается современной)
          const isModern = svelteKitVersion.includes('2.') || svelteKitVersion.includes('^2.');
          if (!isModern) {
            details += '. Рекомендуется обновление до 2.x';
          }
        } else {
          details = 'SvelteKit не найден в зависимостях';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'sveltekit-version',
        name: 'SvelteKit Version',
        description: 'Проверка версии SvelteKit',
        category: 'sveltekit' as CheckCategory,
        score: 10,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['sveltekit', 'version', 'dependencies'],
      },
      passed,
      score: passed ? 10 : 0,
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : ['Установите @sveltejs/kit как dev dependency', 'Используйте актуальную версию 2.x'],
    };
  }

  private async checkViteConfig(): Promise<CheckResult> {
    const vitePaths = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'];

    let configPath = '';
    let passed = false;

    for (const path of vitePaths) {
      const fullPath = join(this.context.projectPath, path);
      if (existsSync(fullPath)) {
        configPath = path;
        passed = true;
        break;
      }
    }

    let details = '';
    if (passed) {
      try {
        const content = readFileSync(join(this.context.projectPath, configPath), 'utf-8');
        details = `Vite конфигурация: ${configPath}`;

        // Проверим интеграцию с SvelteKit
        const hasSvelteKitPlugin =
          content.includes('@sveltejs/kit/vite') || content.includes('sveltekit()');

        if (hasSvelteKitPlugin) {
          details += '. SvelteKit плагин подключен';
        } else {
          details += '. Предупреждение: SvelteKit плагин не найден';
        }
      } catch (error) {
        details = `Ошибка чтения ${configPath}: ${error}`;
      }
    } else {
      details = 'Vite конфигурация не найдена';
    }

    return {
      check: {
        id: 'vite-config',
        name: 'Vite Configuration',
        description: 'Проверка конфигурации Vite для SvelteKit',
        category: 'sveltekit' as CheckCategory,
        score: 10,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['vite', 'config', 'sveltekit'],
      },
      passed,
      score: passed ? 10 : 0,
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте vite.config.ts для настройки сборки',
            'Подключите @sveltejs/kit/vite плагин',
            'Настройте оптимизации для production',
          ],
    };
  }

  private async checkTailwindConfig(): Promise<CheckResult> {
    const configPaths = [
      'tailwind.config.js',
      'tailwind.config.ts',
      'tailwind.config.cjs',
      'tailwind.config.mjs',
    ];

    let passed = false;
    let configFile = '';

    for (const path of configPaths) {
      if (existsSync(join(this.context.projectPath, path))) {
        passed = true;
        configFile = path;
        break;
      }
    }

    let details = '';
    if (passed) {
      try {
        const content = readFileSync(join(this.context.projectPath, configFile), 'utf-8');
        details = `Tailwind конфигурация: ${configFile}`;

        // Проверим настройки content/purge
        const hasContent = content.includes('content:') || content.includes('purge:');
        const hasSvelteFiles = content.includes('.svelte');

        if (hasContent && hasSvelteFiles) {
          details += '. Настройки purge для Svelte корректны';
        } else {
          details += '. Предупреждение: настройки purge могут быть неполными';
        }
      } catch (error) {
        details = `Ошибка чтения ${configFile}: ${error}`;
      }
    } else {
      details = 'Tailwind CSS конфигурация не найдена';
    }

    return {
      check: {
        id: 'tailwind-config',
        name: 'Tailwind CSS Configuration',
        description: 'Проверка конфигурации Tailwind CSS',
        category: 'sveltekit' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['tailwind', 'css', 'config'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте tailwind.config.js',
            'Настройте content paths для .svelte файлов',
            'Добавьте кастомные темы и цвета',
          ],
    };
  }

  private async checkPostCSSConfig(): Promise<CheckResult> {
    const configPaths = [
      'postcss.config.js',
      'postcss.config.ts',
      'postcss.config.cjs',
      'postcss.config.mjs',
    ];

    let passed = false;
    let configFile = '';

    for (const path of configPaths) {
      if (existsSync(join(this.context.projectPath, path))) {
        passed = true;
        configFile = path;
        break;
      }
    }

    let details = '';
    if (passed) {
      details = `PostCSS конфигурация: ${configFile}`;
    } else {
      details = 'PostCSS конфигурация не найдена';
    }

    return {
      check: {
        id: 'postcss-config',
        name: 'PostCSS Configuration',
        description: 'Проверка конфигурации PostCSS',
        category: 'sveltekit' as CheckCategory,
        score: 5,
        critical: false,
        level: 'low' as CheckLevel,
        tags: ['postcss', 'css', 'config'],
      },
      passed,
      score: passed ? 5 : 0,
      maxScore: 5,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте postcss.config.js для обработки CSS',
            'Добавьте плагины autoprefixer и cssnano',
          ],
    };
  }

  private async checkAppHTML(): Promise<CheckResult> {
    const appPath = join(this.context.projectPath, 'src', 'app.html');
    const passed = existsSync(appPath);
    let details = '';

    if (passed) {
      try {
        const content = readFileSync(appPath, 'utf-8');
        details = 'app.html найден';

        // Проверим основные элементы
        const hasHead = content.includes('%sveltekit.head%');
        const hasBody = content.includes('%sveltekit.body%');

        if (hasHead && hasBody) {
          details += '. Все SvelteKit плейсхолдеры присутствуют';
        } else {
          details += '. Предупреждение: отсутствуют SvelteKit плейсхолдеры';
        }
      } catch (error) {
        details = `Ошибка чтения app.html: ${error}`;
      }
    } else {
      details = 'src/app.html не найден';
    }

    return {
      check: {
        id: 'app-html',
        name: 'App HTML Template',
        description: 'Проверка главного HTML шаблона',
        category: 'sveltekit' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['html', 'template', 'sveltekit'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте src/app.html с базовым шаблоном',
            'Добавьте %sveltekit.head% и %sveltekit.body%',
            'Настройте meta теги и иконки',
          ],
    };
  }

  private async checkRoutesStructure(): Promise<CheckResult> {
    const routesPath = join(this.context.projectPath, 'src', 'routes');
    const passed = existsSync(routesPath);
    let details = '';

    if (passed) {
      details = 'Директория src/routes найдена';

      // Проверим наличие основных файлов
      const hasLayout = existsSync(join(routesPath, '+layout.svelte'));
      const hasPage = existsSync(join(routesPath, '+page.svelte'));

      if (hasLayout) details += '. +layout.svelte найден';
      if (hasPage) details += '. +page.svelte найден';

      if (!hasLayout && !hasPage) {
        details += '. Предупреждение: основные файлы роутинга отсутствуют';
      }
    } else {
      details = 'Директория src/routes не найдена';
    }

    return {
      check: {
        id: 'routes-structure',
        name: 'Routes Structure',
        description: 'Проверка структуры роутинга SvelteKit',
        category: 'sveltekit' as CheckCategory,
        score: 12,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['routes', 'structure', 'sveltekit'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте директорию src/routes',
            'Добавьте +page.svelte для главной страницы',
            'Создайте +layout.svelte для общего макета',
          ],
    };
  }

  private async checkLibStructure(): Promise<CheckResult> {
    const libPath = join(this.context.projectPath, 'src', 'lib');
    const passed = existsSync(libPath);
    let details = '';

    if (passed) {
      details = 'Директория src/lib найдена';

      // Проверим наличие основных компонентов
      const hasComponents = existsSync(join(libPath, 'components'));
      const hasStores = existsSync(join(libPath, 'stores'));
      const hasUtils = existsSync(join(libPath, 'utils'));

      let foundDirs = 0;
      if (hasComponents) {
        details += '. components/';
        foundDirs++;
      }
      if (hasStores) {
        details += '. stores/';
        foundDirs++;
      }
      if (hasUtils) {
        details += '. utils/';
        foundDirs++;
      }

      details += ` (${foundDirs} поддиректорий)`;
    } else {
      details = 'Директория src/lib не найдена';
    }

    return {
      check: {
        id: 'lib-structure',
        name: 'Lib Structure',
        description: 'Проверка структуры библиотек и компонентов',
        category: 'sveltekit' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['lib', 'structure', 'components'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте директорию src/lib для компонентов',
            'Организуйте код в поддиректории (components, stores, utils)',
            'Используйте $lib alias для импортов',
          ],
    };
  }

  private async checkSvelteConfig(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const svelteVersion = pkg.devDependencies?.svelte || pkg.dependencies?.svelte;

        if (svelteVersion) {
          passed = true;
          details = `Svelte версия: ${svelteVersion}`;

          // Проверим актуальность версии (5.x считается современной)
          const isModern = svelteVersion.includes('5.') || svelteVersion.includes('^5.');
          if (isModern) {
            details += '. Используется современная версия 5.x';
          } else {
            details += '. Рекомендуется обновление до 5.x';
          }
        } else {
          details = 'Svelte не найден в зависимостях';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'svelte-config',
        name: 'Svelte Configuration',
        description: 'Проверка версии и настройки Svelte',
        category: 'sveltekit' as CheckCategory,
        score: 10,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['svelte', 'version', 'config'],
      },
      passed,
      score: passed ? 10 : 0,
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : [
            'Установите svelte как dependency',
            'Используйте актуальную версию 5.x',
            'Настройте svelte/compiler если нужно',
          ],
    };
  }

  private async checkTypeScriptConfig(): Promise<CheckResult> {
    const tsconfigPaths = ['tsconfig.json', 'jsconfig.json'];

    let passed = false;
    let configFile = '';

    for (const path of tsconfigPaths) {
      if (existsSync(join(this.context.projectPath, path))) {
        passed = true;
        configFile = path;
        break;
      }
    }

    let details = '';
    if (passed) {
      try {
        const content = readFileSync(join(this.context.projectPath, configFile), 'utf-8');
        const config = JSON.parse(content);
        details = `TypeScript конфигурация: ${configFile}`;

        // Проверим SvelteKit специфичные настройки
        const hasLibAlias = config.compilerOptions?.paths?.['$lib/*'];
        const hasAppAlias = config.compilerOptions?.paths?.['$app/*'];

        if (hasLibAlias && hasAppAlias) {
          details += '. SvelteKit alias настроены';
        } else {
          details += '. Предупреждение: SvelteKit alias не настроены';
        }
      } catch (error) {
        details = `Ошибка чтения ${configFile}: ${error}`;
      }
    } else {
      details = 'TypeScript/JavaScript конфигурация не найдена';
    }

    return {
      check: {
        id: 'typescript-config',
        name: 'TypeScript Configuration',
        description: 'Проверка конфигурации TypeScript для SvelteKit',
        category: 'sveltekit' as CheckCategory,
        score: 12,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['typescript', 'config', 'sveltekit'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте tsconfig.json для TypeScript поддержки',
            'Настройте SvelteKit path aliases ($lib, $app)',
            'Включите strict mode для лучшей типизации',
          ],
    };
  }
}
