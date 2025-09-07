/**
 * Dependencies Management Checker
 * Проверки управления зависимостями и пакетным менеджером
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { CheckCategory, CheckContext, CheckLevel, CheckResult } from '../types/index.js';

export class DependenciesChecker {
  private context: CheckContext;

  constructor(context: CheckContext) {
    this.context = context;
  }

  async checkAll(): Promise<CheckResult[]> {
    const checks = [
      this.checkPackageManager(),
      this.checkLockFile(),
      this.checkPackageJsonStructure(),
      this.checkDependencyVersions(),
      this.checkSecurityAudit(),
      this.checkDependencyUpdates(),
      this.checkBundleAnalysis(),
      this.checkPeerDependencies(),
      this.checkWorkspaceConfig(),
    ];

    return Promise.all(checks);
  }

  private async checkPackageManager(): Promise<CheckResult> {
    const lockFiles = [
      { file: 'pnpm-lock.yaml', manager: 'pnpm' },
      { file: 'yarn.lock', manager: 'yarn' },
      { file: 'package-lock.json', manager: 'npm' },
    ];

    let passed = false;
    let details = '';
    let packageManager = '';

    for (const { file, manager } of lockFiles) {
      if (existsSync(join(this.context.projectPath, file))) {
        passed = true;
        packageManager = manager;
        details = `Пакетный менеджер: ${manager}`;
        break;
      }
    }

    if (passed) {
      // Проверим наличие .npmrc для настроек
      const npmrcPath = join(this.context.projectPath, '.npmrc');
      if (existsSync(npmrcPath)) {
        try {
          const npmrcContent = readFileSync(npmrcPath, 'utf-8');
          details += '. .npmrc найден';

          // Проверим полезные настройки
          if (npmrcContent.includes('save-exact')) {
            details += '. Точные версии';
          }
          if (npmrcContent.includes('engine-strict')) {
            details += '. Строгие версии Node.js';
          }
          if (packageManager === 'pnpm' && npmrcContent.includes('shamefully-hoist')) {
            details += '. Hoisting настроен';
          }
        } catch (error) {
          details += '. Ошибка чтения .npmrc';
        }
      }

      // Дополнительные бонусы за современный менеджер
      if (packageManager === 'pnpm') {
        details += '. Современный и быстрый менеджер';
      } else if (packageManager === 'yarn') {
        details += '. Популярный менеджер с хорошей производительностью';
      }
    } else {
      details = 'Пакетный менеджер не определен (нет lock файлов)';
    }

    return {
      check: {
        id: 'package-manager',
        name: 'Package Manager',
        description: 'Проверка настройки пакетного менеджера',
        category: 'dependencies' as CheckCategory,
        score: 15,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['package-manager', 'pnpm', 'npm', 'yarn'],
      },
      passed,
      score: passed ? 15 : 0,
      maxScore: 15,
      details,
      recommendations: passed
        ? []
        : [
            'Выберите один пакетный менеджер для проекта',
            'Рекомендуется pnpm для лучшей производительности',
            'Создайте .npmrc с базовыми настройками',
            'Добавьте lock файл в git для воспроизводимых сборок',
          ],
    };
  }

  private async checkLockFile(): Promise<CheckResult> {
    const lockFiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];

    let passed = false;
    let lockFile = '';
    let details = '';

    for (const file of lockFiles) {
      if (existsSync(join(this.context.projectPath, file))) {
        passed = true;
        lockFile = file;
        break;
      }
    }

    if (passed) {
      try {
        const stats = require('fs').statSync(join(this.context.projectPath, lockFile));
        const sizeKB = Math.round(stats.size / 1024);
        details = `Lock файл: ${lockFile} (${sizeKB} KB)`;

        // Проверим актуальность (должен быть не старше package.json)
        const packageStats = require('fs').statSync(join(this.context.projectPath, 'package.json'));
        const isOutdated = stats.mtime < packageStats.mtime;

        if (isOutdated) {
          details += '. Предупреждение: устарел относительно package.json';
        } else {
          details += '. Актуальный';
        }

        // Размер lock файла может указывать на количество зависимостей
        if (sizeKB > 1000) {
          details += '. Большое количество зависимостей';
        } else if (sizeKB > 100) {
          details += '. Умеренное количество зависимостей';
        } else {
          details += '. Небольшое количество зависимостей';
        }
      } catch (error) {
        details = `Lock файл найден: ${lockFile}`;
      }
    } else {
      details = 'Lock файл отсутствует';
    }

    return {
      check: {
        id: 'lock-file',
        name: 'Lock File',
        description: 'Проверка наличия и актуальности lock файла',
        category: 'dependencies' as CheckCategory,
        score: 12,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['lock-file', 'reproducibility', 'dependencies'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Убедитесь что lock файл актуальный',
            'Добавьте lock файл в систему контроля версий',
            'Регулярно обновляйте зависимости через пакетный менеджер',
            'Не редактируйте lock файл вручную',
          ],
    };
  }

  private async checkPackageJsonStructure(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        passed = true;

        // Проверим основные поля
        const requiredFields = ['name', 'version', 'scripts'];
        const optionalFields = ['description', 'keywords', 'author', 'license', 'repository'];

        const hasRequired = requiredFields.every(field => pkg[field]);
        const optionalCount = optionalFields.filter(field => pkg[field]).length;

        details = `package.json структура`;

        if (hasRequired) {
          details += '. Обязательные поля присутствуют';
        } else {
          details += '. Предупреждение: отсутствуют обязательные поля';
        }

        details += `. Метаданные: ${optionalCount}/${optionalFields.length}`;

        // Проверим типы зависимостей
        const depTypes = [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies',
        ];
        const foundDepTypes = depTypes.filter(
          type => pkg[type] && Object.keys(pkg[type]).length > 0
        );

        if (foundDepTypes.length > 0) {
          details += `. Типы зависимостей: ${foundDepTypes.join(', ')}`;
        }

        // Проверим engines
        if (pkg.engines) {
          details += '. Требования к движкам указаны';
        }

        // Проверим private флаг для внутренних проектов
        if (pkg.private === true) {
          details += '. Приватный пакет';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'package-json-structure',
        name: 'Package.json Structure',
        description: 'Проверка структуры и полноты package.json',
        category: 'dependencies' as CheckCategory,
        score: 10,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['package-json', 'metadata', 'structure'],
      },
      passed,
      score: passed ? 10 : 0,
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : [
            'Убедитесь что все обязательные поля заполнены',
            'Добавьте описание, ключевые слова и лицензию',
            'Указывайте требования к версиям Node.js в engines',
            'Правильно разделяйте dependencies и devDependencies',
          ],
    };
  }

  private async checkDependencyVersions(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };

        if (Object.keys(allDeps).length > 0) {
          passed = true;

          // Анализ версий
          let exactVersions = 0;
          let caretVersions = 0;
          let tildeVersions = 0;
          let latestVersions = 0;
          let otherVersions = 0;

          for (const version of Object.values(allDeps)) {
            const versionStr = version as string;
            if (versionStr.match(/^\d+\.\d+\.\d+$/)) {
              exactVersions++;
            } else if (versionStr.startsWith('^')) {
              caretVersions++;
            } else if (versionStr.startsWith('~')) {
              tildeVersions++;
            } else if (versionStr === 'latest' || versionStr === '*') {
              latestVersions++;
            } else {
              otherVersions++;
            }
          }

          const totalDeps = Object.keys(allDeps).length;
          details = `Зависимости: ${totalDeps}`;

          // Статистика версий
          if (exactVersions > 0) details += `. Точные: ${exactVersions}`;
          if (caretVersions > 0) details += `. Caret (^): ${caretVersions}`;
          if (tildeVersions > 0) details += `. Tilde (~): ${tildeVersions}`;
          if (latestVersions > 0) details += `. Latest: ${latestVersions}`;
          if (otherVersions > 0) details += `. Другие: ${otherVersions}`;

          // Рекомендации по версионированию
          const caretPercent = (caretVersions / totalDeps) * 100;
          if (caretPercent > 70) {
            details += '. Хорошая стратегия версионирования';
          } else if (exactVersions > caretVersions) {
            details += '. Много точных версий (могут устареть)';
          }

          if (latestVersions > 0) {
            details += '. Предупреждение: использование latest нестабильно';
          }
        } else {
          details = 'Зависимости не найдены';
        }
      } catch (error) {
        details = `Ошибка анализа зависимостей: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'dependency-versions',
        name: 'Dependency Versions',
        description: 'Проверка стратегии версионирования зависимостей',
        category: 'dependencies' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['versioning', 'dependencies', 'semver'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Используйте caret (^) для совместимых обновлений',
            'Избегайте latest и * в production зависимостях',
            'Регулярно обновляйте зависимости для безопасности',
            'Тестируйте приложение после обновлений',
          ],
    };
  }

  private async checkSecurityAudit(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    // Проверим наличие audit скриптов
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const scripts = pkg.scripts || {};

        const hasAuditScript = scripts.audit || scripts['audit:fix'] || scripts['security:audit'];

        if (hasAuditScript) {
          passed = true;
          details = 'Скрипты аудита безопасности настроены';

          if (scripts.audit) details += '. audit';
          if (scripts['audit:fix']) details += '. audit:fix';
          if (scripts['security:audit']) details += '. security:audit';
        }

        // Проверим зависимости для аудита
        const devDeps = pkg.devDependencies || {};
        const hasAuditTools = devDeps.audit || devDeps.snyk || devDeps['@snyk/cli'];

        if (hasAuditTools) {
          if (!passed) {
            passed = true;
            details = 'Инструменты аудита установлены';
          } else {
            details += '. Специальные инструменты установлены';
          }
        }

        if (!passed) {
          details = 'Аудит безопасности не настроен';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'security-audit',
        name: 'Security Audit',
        description: 'Проверка настройки аудита безопасности зависимостей',
        category: 'dependencies' as CheckCategory,
        score: 12,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['security', 'audit', 'vulnerabilities'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Добавьте npm audit или pnpm audit в скрипты',
            'Настройте автоматический аудит в CI/CD',
            'Рассмотрите использование Snyk для расширенного аудита',
            'Регулярно проверяйте и исправляйте уязвимости',
          ],
    };
  }

  private async checkDependencyUpdates(): Promise<CheckResult> {
    const dependabotPath = join(this.context.projectPath, '.github', 'dependabot.yml');
    const renovatePath = join(this.context.projectPath, 'renovate.json');

    let passed = false;
    let details = '';

    // Проверим Dependabot
    if (existsSync(dependabotPath)) {
      passed = true;
      details = 'Dependabot настроен для автоматических обновлений';

      try {
        const content = readFileSync(dependabotPath, 'utf-8');
        if (content.includes('package-ecosystem: "npm"')) {
          details += '. NPM пакеты отслеживаются';
        }
        if (content.includes('schedule:')) {
          details += '. Расписание настроено';
        }
      } catch (error) {
        details += '. Ошибка чтения конфигурации';
      }
    }

    // Проверим Renovate
    if (existsSync(renovatePath)) {
      if (!passed) {
        passed = true;
        details = 'Renovate настроен для автоматических обновлений';
      } else {
        details += '. Также настроен Renovate';
      }
    }

    // Проверим npm-check-updates или аналоги
    const packagePath = join(this.context.projectPath, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const devDeps = pkg.devDependencies || {};
        const scripts = pkg.scripts || {};

        const hasUpdateTools =
          devDeps['npm-check-updates'] ||
          devDeps['@dependabot/cli'] ||
          scripts.update ||
          scripts['deps:update'];

        if (hasUpdateTools) {
          if (!passed) {
            passed = true;
            details = 'Инструменты обновления зависимостей установлены';
          } else {
            details += '. Локальные инструменты обновления установлены';
          }
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    }

    if (!passed) {
      details = 'Автоматические обновления зависимостей не настроены';
    }

    return {
      check: {
        id: 'dependency-updates',
        name: 'Dependency Updates',
        description: 'Проверка настройки автоматических обновлений зависимостей',
        category: 'dependencies' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['updates', 'dependabot', 'automation'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Настройте Dependabot для автоматических PR с обновлениями',
            'Создайте расписание обновлений (еженедельно рекомендуется)',
            'Установите npm-check-updates для локальных обновлений',
            'Настройте автоматическое слияние минорных обновлений',
          ],
    };
  }

  private async checkBundleAnalysis(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const devDeps = pkg.devDependencies || {};
        const scripts = pkg.scripts || {};

        // Проверим инструменты анализа бандла
        const bundleAnalysisTools = [
          'vite-bundle-analyzer',
          'rollup-plugin-analyzer',
          'webpack-bundle-analyzer',
          '@bundle-analyzer/vite-plugin',
        ];

        const foundTools: string[] = [];
        for (const tool of bundleAnalysisTools) {
          if (devDeps[tool]) {
            foundTools.push(tool);
            passed = true;
          }
        }

        // Проверим скрипты анализа
        const hasAnalyzeScript =
          scripts.analyze || scripts['bundle:analyze'] || scripts['build:analyze'];

        if (hasAnalyzeScript) {
          if (!passed) {
            passed = true;
            details = 'Скрипты анализа бандла настроены';
          } else {
            details = `Анализ бандла: ${foundTools.join(', ')}. Скрипты настроены`;
          }
        } else if (passed) {
          details = `Инструменты анализа: ${foundTools.join(', ')}`;
        }

        if (!passed) {
          details = 'Анализ размера бандла не настроен';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'bundle-analysis',
        name: 'Bundle Analysis',
        description: 'Проверка настройки анализа размера и состава бандла',
        category: 'dependencies' as CheckCategory,
        score: 6,
        critical: false,
        level: 'low' as CheckLevel,
        tags: ['bundle', 'analysis', 'performance'],
      },
      passed,
      score: passed ? 6 : 0,
      maxScore: 6,
      details,
      recommendations: passed
        ? []
        : [
            'Установите vite-bundle-analyzer для анализа бандла',
            'Добавьте скрипт "analyze" для генерации отчетов',
            'Регулярно анализируйте размер зависимостей',
            'Оптимизируйте импорты для уменьшения размера бандла',
          ],
    };
  }

  private async checkPeerDependencies(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    let passed = false;
    let details = '';

    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const peerDeps = pkg.peerDependencies || {};
        const devDeps = pkg.devDependencies || {};

        const peerDepCount = Object.keys(peerDeps).length;

        if (peerDepCount > 0) {
          passed = true;
          details = `Peer dependencies: ${peerDepCount}`;

          // Проверим что peer dependencies установлены как dev dependencies
          const peerNames = Object.keys(peerDeps);
          const installedPeers = peerNames.filter(name => devDeps[name]);

          if (installedPeers.length === peerNames.length) {
            details += '. Все peer deps установлены в devDependencies';
          } else if (installedPeers.length > 0) {
            details += `. ${installedPeers.length}/${peerNames.length} установлены в devDependencies`;
          } else {
            details += '. Предупреждение: peer deps не установлены в devDependencies';
          }
        } else {
          // Для большинства приложений peer dependencies не обязательны
          passed = true;
          details = 'Peer dependencies не используются (нормально для приложений)';
        }
      } catch (error) {
        details = `Ошибка чтения package.json: ${error}`;
      }
    } else {
      details = 'package.json не найден';
    }

    return {
      check: {
        id: 'peer-dependencies',
        name: 'Peer Dependencies',
        description: 'Проверка правильности настройки peer dependencies',
        category: 'dependencies' as CheckCategory,
        score: 4,
        critical: false,
        level: 'low' as CheckLevel,
        tags: ['peer-dependencies', 'compatibility'],
      },
      passed,
      score: passed ? 4 : 0,
      maxScore: 4,
      details,
      recommendations: passed
        ? []
        : [
            'Используйте peer dependencies для библиотек',
            'Устанавливайте peer dependencies в devDependencies для разработки',
            'Указывайте совместимые версии в peer dependencies',
            'Документируйте требования к peer dependencies',
          ],
    };
  }

  private async checkWorkspaceConfig(): Promise<CheckResult> {
    const packagePath = join(this.context.projectPath, 'package.json');
    const pnpmWorkspacePath = join(this.context.projectPath, 'pnpm-workspace.yaml');

    let passed = false;
    let details = '';

    // Проверим pnpm workspace
    if (existsSync(pnpmWorkspacePath)) {
      passed = true;
      details = 'pnpm workspace настроен';

      try {
        const content = readFileSync(pnpmWorkspacePath, 'utf-8');
        if (content.includes('packages:')) {
          details += '. Packages определены';
        }
      } catch (error) {
        details += '. Ошибка чтения конфигурации';
      }
    }

    // Проверим npm/yarn workspaces в package.json
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));

        if (pkg.workspaces) {
          if (!passed) {
            passed = true;
            details = 'npm/yarn workspaces настроены';
          } else {
            details += '. Также настроены npm/yarn workspaces';
          }
        }

        // Для одиночных проектов workspace не обязателен
        if (!passed) {
          passed = true;
          details = 'Workspace не используется (нормально для одиночных проектов)';
        }
      } catch (error) {
        if (!passed) {
          details = 'Ошибка чтения package.json';
        }
      }
    }

    return {
      check: {
        id: 'workspace-config',
        name: 'Workspace Configuration',
        description: 'Проверка настройки workspace для монорепозиториев',
        category: 'dependencies' as CheckCategory,
        score: 5,
        critical: false,
        level: 'low' as CheckLevel,
        tags: ['workspace', 'monorepo', 'pnpm'],
      },
      passed,
      score: passed ? 5 : 0,
      maxScore: 5,
      details,
      recommendations: passed
        ? []
        : [
            'Используйте workspace для монорепозиториев',
            'Настройте pnpm-workspace.yaml для pnpm',
            'Определите packages в workspaces для npm/yarn',
            'Оптимизируйте установку зависимостей в workspace',
          ],
    };
  }
}
