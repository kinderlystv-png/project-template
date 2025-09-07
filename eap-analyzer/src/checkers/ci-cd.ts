/**
 * CI/CD Pipeline Checker
 * Проверки настройки непрерывной интеграции и развертывания
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { CheckCategory, CheckContext, CheckLevel, CheckResult } from '../types/index.js';

export class CICDChecker {
  private context: CheckContext;

  constructor(context: CheckContext) {
    this.context = context;
  }

  async checkAll(): Promise<CheckResult[]> {
    const checks = [
      this.checkGitHubActions(),
      this.checkWorkflowStructure(),
      this.checkTestWorkflow(),
      this.checkBuildWorkflow(),
      this.checkDeploymentWorkflow(),
      this.checkSecurityWorkflow(),
      this.checkDependabotConfig(),
      this.checkGitHooks(),
    ];

    return Promise.all(checks);
  }

  private async checkGitHubActions(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    const passed = existsSync(actionsPath);

    let details = '';
    if (passed) {
      try {
        const workflows = readdirSync(actionsPath).filter(
          file => file.endsWith('.yml') || file.endsWith('.yaml')
        );
        details = `GitHub Actions настроен. Workflows: ${workflows.length}`;
        if (workflows.length > 0) {
          details += ` (${workflows.join(', ')})`;
        }
      } catch (error) {
        details = `Ошибка чтения .github/workflows: ${error}`;
      }
    } else {
      details = '.github/workflows директория не найдена';
    }

    return {
      check: {
        id: 'github-actions',
        name: 'GitHub Actions Setup',
        description: 'Проверка настройки GitHub Actions',
        category: 'cicd' as CheckCategory,
        score: 15,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['github-actions', 'ci-cd', 'automation'],
      },
      passed,
      score: passed ? 15 : 0,
      maxScore: 15,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте директорию .github/workflows',
            'Добавьте базовые workflows для CI/CD',
            'Настройте автоматические проверки кода',
          ],
    };
  }

  private async checkWorkflowStructure(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    let passed = false;
    let details = '';

    if (existsSync(actionsPath)) {
      try {
        const workflows = readdirSync(actionsPath).filter(
          file => file.endsWith('.yml') || file.endsWith('.yaml')
        );

        passed = workflows.length > 0;

        if (passed) {
          details = `Найдено ${workflows.length} workflow файлов`;

          // Проверим базовые workflows
          const hasCI = workflows.some(
            w => w.includes('ci') || w.includes('test') || w.includes('check')
          );
          const hasCD = workflows.some(
            w => w.includes('cd') || w.includes('deploy') || w.includes('release')
          );

          if (hasCI) details += '. CI workflow найден';
          if (hasCD) details += '. CD workflow найден';

          if (!hasCI && !hasCD) {
            details += '. Предупреждение: базовые CI/CD workflows не найдены';
          }
        } else {
          details = 'Workflow файлы не найдены';
        }
      } catch (error) {
        details = `Ошибка чтения workflows: ${error}`;
      }
    } else {
      details = '.github/workflows не существует';
    }

    return {
      check: {
        id: 'workflow-structure',
        name: 'Workflow Structure',
        description: 'Проверка структуры workflow файлов',
        category: 'cicd' as CheckCategory,
        score: 12,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['workflows', 'structure', 'ci-cd'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте базовые workflow файлы',
            'Добавьте ci.yml для проверок кода',
            'Создайте cd.yml для автоматического развертывания',
          ],
    };
  }

  private async checkTestWorkflow(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    let passed = false;
    let details = '';

    if (existsSync(actionsPath)) {
      try {
        const workflows = readdirSync(actionsPath);

        // Поиск workflow с тестами
        for (const workflow of workflows) {
          if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
            const content = readFileSync(join(actionsPath, workflow), 'utf-8');

            if (
              content.includes('npm test') ||
              content.includes('npm run test') ||
              content.includes('pnpm test') ||
              content.includes('vitest') ||
              content.includes('test:')
            ) {
              passed = true;
              details = `Тестовый workflow найден: ${workflow}`;

              // Проверим дополнительные настройки
              const hasMatrix = content.includes('strategy:') && content.includes('matrix:');
              const hasNodeVersions = content.includes('node-version');
              const hasCoverage = content.includes('coverage');

              if (hasMatrix) details += '. Матричные тесты настроены';
              if (hasNodeVersions) details += '. Тестирование на разных версиях Node.js';
              if (hasCoverage) details += '. Сбор покрытия кода настроен';

              break;
            }
          }
        }

        if (!passed) {
          details = 'Тестовые workflows не найдены';
        }
      } catch (error) {
        details = `Ошибка чтения workflow файлов: ${error}`;
      }
    } else {
      details = 'GitHub Actions не настроен';
    }

    return {
      check: {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Проверка workflow для автоматического тестирования',
        category: 'cicd' as CheckCategory,
        score: 15,
        critical: true,
        level: 'critical' as CheckLevel,
        tags: ['testing', 'automation', 'ci'],
      },
      passed,
      score: passed ? 15 : 0,
      maxScore: 15,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте workflow для автоматического тестирования',
            'Настройте запуск тестов на каждый push и PR',
            'Добавьте матричное тестирование для разных версий Node.js',
            'Настройте сбор и отправку покрытия кода',
          ],
    };
  }

  private async checkBuildWorkflow(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    let passed = false;
    let details = '';

    if (existsSync(actionsPath)) {
      try {
        const workflows = readdirSync(actionsPath);

        // Поиск workflow со сборкой
        for (const workflow of workflows) {
          if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
            const content = readFileSync(join(actionsPath, workflow), 'utf-8');

            if (
              content.includes('npm run build') ||
              content.includes('pnpm build') ||
              content.includes('vite build') ||
              content.includes('svelte-kit build')
            ) {
              passed = true;
              details = `Build workflow найден: ${workflow}`;

              // Проверим настройки сборки
              const hasArtifacts = content.includes('upload-artifact');
              const hasOptimization =
                content.includes('NODE_ENV=production') || content.includes('NODE_ENV: production');

              if (hasArtifacts) details += '. Артефакты сохраняются';
              if (hasOptimization) details += '. Production режим настроен';

              break;
            }
          }
        }

        if (!passed) {
          details = 'Build workflows не найдены';
        }
      } catch (error) {
        details = `Ошибка чтения workflow файлов: ${error}`;
      }
    } else {
      details = 'GitHub Actions не настроен';
    }

    return {
      check: {
        id: 'build-workflow',
        name: 'Build Workflow',
        description: 'Проверка workflow для автоматической сборки',
        category: 'cicd' as CheckCategory,
        score: 12,
        critical: false,
        level: 'high' as CheckLevel,
        tags: ['build', 'automation', 'ci'],
      },
      passed,
      score: passed ? 12 : 0,
      maxScore: 12,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте workflow для автоматической сборки',
            'Настройте сборку в production режиме',
            'Добавьте сохранение артефактов сборки',
            'Оптимизируйте процесс для SvelteKit',
          ],
    };
  }

  private async checkDeploymentWorkflow(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    let passed = false;
    let details = '';

    if (existsSync(actionsPath)) {
      try {
        const workflows = readdirSync(actionsPath);

        // Поиск deployment workflow
        for (const workflow of workflows) {
          if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
            const content = readFileSync(join(actionsPath, workflow), 'utf-8');

            if (
              content.includes('deploy') ||
              content.includes('pages') ||
              content.includes('vercel') ||
              content.includes('netlify') ||
              content.includes('docker push') ||
              content.includes('aws') ||
              content.includes('azure')
            ) {
              passed = true;
              details = `Deployment workflow найден: ${workflow}`;

              // Определим платформу развертывания
              if (content.includes('pages')) details += ' (GitHub Pages)';
              else if (content.includes('vercel')) details += ' (Vercel)';
              else if (content.includes('netlify')) details += ' (Netlify)';
              else if (content.includes('docker')) details += ' (Docker)';
              else if (content.includes('aws')) details += ' (AWS)';
              else if (content.includes('azure')) details += ' (Azure)';

              break;
            }
          }
        }

        if (!passed) {
          details = 'Deployment workflows не найдены';
        }
      } catch (error) {
        details = `Ошибка чтения workflow файлов: ${error}`;
      }
    } else {
      details = 'GitHub Actions не настроен';
    }

    return {
      check: {
        id: 'deployment-workflow',
        name: 'Deployment Workflow',
        description: 'Проверка workflow для автоматического развертывания',
        category: 'cicd' as CheckCategory,
        score: 10,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['deployment', 'automation', 'cd'],
      },
      passed,
      score: passed ? 10 : 0,
      maxScore: 10,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте workflow для автоматического развертывания',
            'Настройте развертывание на GitHub Pages, Vercel или Netlify',
            'Добавьте условия развертывания (только main branch)',
            'Настройте переменные окружения и секреты',
          ],
    };
  }

  private async checkSecurityWorkflow(): Promise<CheckResult> {
    const actionsPath = join(this.context.projectPath, '.github', 'workflows');
    let passed = false;
    let details = '';

    if (existsSync(actionsPath)) {
      try {
        const workflows = readdirSync(actionsPath);

        // Поиск security workflow
        for (const workflow of workflows) {
          if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
            const content = readFileSync(join(actionsPath, workflow), 'utf-8');

            if (
              content.includes('security') ||
              content.includes('codeql') ||
              content.includes('snyk') ||
              content.includes('audit') ||
              content.includes('npm audit') ||
              content.includes('pnpm audit')
            ) {
              passed = true;
              details = `Security workflow найден: ${workflow}`;

              // Проверим типы проверок безопасности
              if (content.includes('codeql')) details += '. CodeQL анализ';
              if (content.includes('audit')) details += '. Аудит зависимостей';
              if (content.includes('snyk')) details += '. Snyk сканирование';

              break;
            }
          }
        }

        if (!passed) {
          details = 'Security workflows не найдены';
        }
      } catch (error) {
        details = `Ошибка чтения workflow файлов: ${error}`;
      }
    } else {
      details = 'GitHub Actions не настроен';
    }

    return {
      check: {
        id: 'security-workflow',
        name: 'Security Workflow',
        description: 'Проверка workflow для автоматических проверок безопасности',
        category: 'cicd' as CheckCategory,
        score: 8,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['security', 'automation', 'scanning'],
      },
      passed,
      score: passed ? 8 : 0,
      maxScore: 8,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте workflow для проверок безопасности',
            'Добавьте CodeQL анализ кода',
            'Настройте аудит зависимостей (npm/pnpm audit)',
            'Рассмотрите интеграцию со Snyk или другими сканерами',
          ],
    };
  }

  private async checkDependabotConfig(): Promise<CheckResult> {
    const dependabotPath = join(this.context.projectPath, '.github', 'dependabot.yml');
    const passed = existsSync(dependabotPath);

    let details = '';
    if (passed) {
      try {
        const content = readFileSync(dependabotPath, 'utf-8');
        details = 'Dependabot настроен';

        // Проверим настройки
        const hasNpm =
          content.includes('package-ecosystem: "npm"') ||
          content.includes('package-ecosystem: npm');
        const hasSchedule = content.includes('schedule:');
        const hasDirectory = content.includes('directory:');

        if (hasNpm) details += '. NPM пакеты отслеживаются';
        if (hasSchedule) details += '. Расписание настроено';
        if (hasDirectory) details += '. Директория указана';

        if (!hasNpm) {
          details += '. Предупреждение: NPM пакеты не отслеживаются';
        }
      } catch (error) {
        details = `Ошибка чтения dependabot.yml: ${error}`;
      }
    } else {
      details = '.github/dependabot.yml не найден';
    }

    return {
      check: {
        id: 'dependabot-config',
        name: 'Dependabot Configuration',
        description: 'Проверка настройки Dependabot для автоматических обновлений',
        category: 'cicd' as CheckCategory,
        score: 6,
        critical: false,
        level: 'low' as CheckLevel,
        tags: ['dependabot', 'automation', 'dependencies'],
      },
      passed,
      score: passed ? 6 : 0,
      maxScore: 6,
      details,
      recommendations: passed
        ? []
        : [
            'Создайте .github/dependabot.yml',
            'Настройте автоматические обновления для npm пакетов',
            'Установите еженедельное расписание обновлений',
            'Добавьте настройки для Docker если используется',
          ],
    };
  }

  private async checkGitHooks(): Promise<CheckResult> {
    const huskyPath = join(this.context.projectPath, '.husky');
    const packagePath = join(this.context.projectPath, 'package.json');

    let passed = false;
    let details = '';

    // Проверим Husky
    if (existsSync(huskyPath)) {
      passed = true;
      details = 'Husky git hooks настроены';

      try {
        const hooks = readdirSync(huskyPath).filter(file => !file.startsWith('.'));
        if (hooks.length > 0) {
          details += `. Hooks: ${hooks.join(', ')}`;
        }
      } catch (error) {
        details += `. Ошибка чтения hooks: ${error}`;
      }
    }

    // Проверим lint-staged
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const hasLintStaged =
          pkg.devDependencies?.['lint-staged'] ||
          pkg.dependencies?.['lint-staged'] ||
          pkg['lint-staged'];

        if (hasLintStaged) {
          if (passed) {
            details += '. lint-staged настроен';
          } else {
            passed = true;
            details = 'lint-staged настроен';
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения package.json
      }
    }

    if (!passed) {
      details = 'Git hooks не настроены';
    }

    return {
      check: {
        id: 'git-hooks',
        name: 'Git Hooks',
        description: 'Проверка настройки git hooks для качества кода',
        category: 'cicd' as CheckCategory,
        score: 7,
        critical: false,
        level: 'medium' as CheckLevel,
        tags: ['git-hooks', 'husky', 'lint-staged'],
      },
      passed,
      score: passed ? 7 : 0,
      maxScore: 7,
      details,
      recommendations: passed
        ? []
        : [
            'Установите husky для git hooks',
            'Настройте pre-commit hooks для линтинга',
            'Добавьте lint-staged для проверки только измененных файлов',
            'Создайте commit-msg hook для проверки сообщений коммитов',
          ],
    };
  }
}
