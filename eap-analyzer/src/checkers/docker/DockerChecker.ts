/**
 * Унифицирова    super(
      'DockerChecker',
      AnalysisCategory.INFRASTRUCTURE,
      'Проверка Docker инфраструктуры и контейнеризации',
      'Docker Best Practices',
      SeverityLevel.HIGH,
      '2.0.0',
      {
        enabled: true,
        failOnError: false,
        thresholds: {
          'min_score': 70,
          'critical_checks': 2
        }
      }
    );ocker инфраструктуры
 * Соответствует новой архитектуре ЭАП с базовыми классами и интерфейсами
 */

import * as path from 'path';
import { BaseChecker } from '../../core/base/BaseChecker';
import { CheckInfo } from '../../core/interfaces/IChecker';
import { CheckResult } from '../../types/CheckResult';
import { Project } from '../../types/Project';
import { AnalysisCategory } from '../../types/AnalysisCategory';
import { SeverityLevel } from '../../types/SeverityLevel';

/**
 * Проверщик Docker инфраструктуры
 * Выполняет комплексную проверку контейнеризации проекта
 */
export class DockerChecker extends BaseChecker {
  constructor() {
    super(
      'DockerChecker',
      AnalysisCategory.INFRASTRUCTURE,
      'Проверка Docker инфраструктуры и контейнеризации',
      'Docker Best Practices',
      SeverityLevel.HIGH,
      '2.0.0',
      {
        enabled: true,
        failOnError: false,
        thresholds: {
          min_score: 70,
          critical_checks: 2,
        },
      }
    );
  }

  /**
   * @inheritdoc
   */
  async check(project: Project): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const startTime = Date.now();

    // Получаем все доступные проверки
    const checks = this.getAvailableChecks();

    for (const checkInfo of checks) {
      const result = await this.executeIndividualCheck(checkInfo, project);
      results.push(result);
    }

    // Обновляем статистику
    const duration = Date.now() - startTime;
    results.forEach(result => {
      if (result.stats) {
        result.stats.duration = duration / results.length; // Распределяем время
      }
    });

    return results;
  }

  /**
   * @inheritdoc
   */
  getAvailableChecks(): CheckInfo[] {
    return [
      {
        id: 'docker-dockerfile',
        name: 'Dockerfile Analysis',
        description: 'Проверка наличия и качества Dockerfile',
        severity: SeverityLevel.CRITICAL,
        maxScore: 15,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'containerization'],
      },
      {
        id: 'docker-compose',
        name: 'Docker Compose Configuration',
        description: 'Проверка конфигурации docker-compose',
        severity: SeverityLevel.HIGH,
        maxScore: 15,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'orchestration'],
      },
      {
        id: 'docker-multistage',
        name: 'Multi-stage Build',
        description: 'Проверка использования multi-stage сборки',
        severity: SeverityLevel.MEDIUM,
        maxScore: 10,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'optimization'],
      },
      {
        id: 'docker-production',
        name: 'Production Readiness',
        description: 'Готовность к production развертыванию',
        severity: SeverityLevel.HIGH,
        maxScore: 15,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'production'],
      },
      {
        id: 'docker-security',
        name: 'Container Security',
        description: 'Безопасность контейнера',
        severity: SeverityLevel.HIGH,
        maxScore: 10,
        tags: [AnalysisCategory.SECURITY, 'container'],
      },
      {
        id: 'docker-healthcheck',
        name: 'Health Check',
        description: 'Проверка настройки health check',
        severity: SeverityLevel.MEDIUM,
        maxScore: 10,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'monitoring'],
      },
      {
        id: 'docker-ignore',
        name: 'Docker Ignore',
        description: 'Наличие .dockerignore файла',
        severity: SeverityLevel.LOW,
        maxScore: 5,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'optimization'],
      },
      {
        id: 'docker-environments',
        name: 'Environment Configurations',
        description: 'Конфигурации для разных окружений',
        severity: SeverityLevel.MEDIUM,
        maxScore: 10,
        tags: [AnalysisCategory.INFRASTRUCTURE, 'environments'],
      },
    ];
  }

  /**
   * @inheritdoc
   */
  async isApplicable(project: Project): Promise<boolean> {
    // Проверяем, есть ли хотя бы один Docker-файл
    const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'];

    for (const file of dockerFiles) {
      if (await project.exists(file)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Выполнение отдельной проверки
   */
  private async executeIndividualCheck(
    checkInfo: CheckInfo,
    project: Project
  ): Promise<CheckResult> {
    try {
      switch (checkInfo.id) {
        case 'docker-dockerfile':
          return await this.checkDockerfile(checkInfo, project);
        case 'docker-compose':
          return await this.checkDockerCompose(checkInfo, project);
        case 'docker-multistage':
          return await this.checkMultiStage(checkInfo, project);
        case 'docker-production':
          return await this.checkProductionReady(checkInfo, project);
        case 'docker-security':
          return await this.checkSecurity(checkInfo, project);
        case 'docker-healthcheck':
          return await this.checkHealthCheck(checkInfo, project);
        case 'docker-ignore':
          return await this.checkDockerIgnore(checkInfo, project);
        case 'docker-environments':
          return await this.checkEnvironments(checkInfo, project);
        default:
          return this.createResult(
            checkInfo.id,
            checkInfo.name,
            checkInfo.description,
            false,
            'Неизвестная проверка',
            0,
            checkInfo.maxScore,
            SeverityLevel.LOW
          );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        `Ошибка выполнения проверки: ${errorMessage}`,
        0,
        checkInfo.maxScore,
        SeverityLevel.CRITICAL,
        { error: errorMessage }
      );
    }
  }

  /**
   * Проверка Dockerfile
   */
  private async checkDockerfile(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    if (!(await project.exists('Dockerfile'))) {
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        'Dockerfile не найден',
        0,
        checkInfo.maxScore,
        SeverityLevel.CRITICAL,
        { recommendations: ['Создайте Dockerfile для контейнеризации приложения'] }
      );
    }

    const content = await project.readFile('Dockerfile');
    if (!content.trim()) {
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        'Dockerfile пуст',
        0,
        checkInfo.maxScore,
        SeverityLevel.CRITICAL
      );
    }

    // Анализ содержимого Dockerfile
    const hasFrom = content.includes('FROM');
    const hasWorkdir = content.includes('WORKDIR');
    const hasCopy = content.includes('COPY') || content.includes('ADD');
    const hasRun = content.includes('RUN');
    const hasExpose = content.includes('EXPOSE');
    const hasCmd = content.includes('CMD') || content.includes('ENTRYPOINT');

    const elements = [hasFrom, hasWorkdir, hasCopy, hasRun, hasExpose, hasCmd];
    const score = elements.filter(Boolean).length;
    const percentage = (score / elements.length) * 100;

    const passed = score >= 4; // Минимум 4 из 6 элементов
    const finalScore = passed ? Math.round((score / elements.length) * checkInfo.maxScore) : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      passed,
      `Качество Dockerfile: ${score}/6 элементов (${Math.round(percentage)}%)`,
      finalScore,
      checkInfo.maxScore,
      passed ? SeverityLevel.LOW : SeverityLevel.HIGH,
      {
        elements: {
          FROM: hasFrom,
          WORKDIR: hasWorkdir,
          'COPY/ADD': hasCopy,
          RUN: hasRun,
          EXPOSE: hasExpose,
          'CMD/ENTRYPOINT': hasCmd,
        },
        score,
        percentage: Math.round(percentage),
      }
    );
  }

  /**
   * Проверка Docker Compose
   */
  private async checkDockerCompose(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
    ];

    let foundFiles = 0;
    let foundServices = 0;
    const details: string[] = [];

    for (const file of composeFiles) {
      if (await project.exists(file)) {
        foundFiles++;
        const content = await project.readFile(file);
        if (content.includes('services:')) {
          foundServices++;
          details.push(file);
        }
      }
    }

    const passed = foundFiles > 0 && foundServices > 0;
    const score = passed ? checkInfo.maxScore : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      passed,
      passed
        ? `Найдено ${foundFiles} compose файлов с ${foundServices} сервисами`
        : 'Docker Compose конфигурация не найдена',
      score,
      checkInfo.maxScore,
      passed ? SeverityLevel.LOW : SeverityLevel.HIGH,
      {
        foundFiles,
        foundServices,
        files: details,
        recommendations: passed
          ? []
          : [
              'Создайте docker-compose.yml для оркестрации сервисов',
              'Определите все необходимые сервисы и их зависимости',
            ],
      }
    );
  }

  /**
   * Проверка multi-stage сборки
   */
  private async checkMultiStage(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    if (!(await project.exists('Dockerfile'))) {
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        'Dockerfile не найден для проверки multi-stage',
        0,
        checkInfo.maxScore,
        SeverityLevel.MEDIUM
      );
    }

    const content = await project.readFile('Dockerfile');

    // Анализ multi-stage индикаторов
    const fromMatches = content.match(/FROM\s+\S+/g) || [];
    const hasAlias = content.includes(' AS ') || content.includes(' as ');
    const hasCopyFrom = content.includes('COPY --from=');

    const isMultiStage = fromMatches.length > 1 && (hasAlias || hasCopyFrom);
    const score = isMultiStage ? checkInfo.maxScore : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      isMultiStage,
      isMultiStage
        ? `Multi-stage сборка обнаружена (${fromMatches.length} этапов)`
        : 'Multi-stage сборка не используется',
      score,
      checkInfo.maxScore,
      isMultiStage ? SeverityLevel.LOW : SeverityLevel.MEDIUM,
      {
        fromCount: fromMatches.length,
        hasAlias,
        hasCopyFrom,
        fromStatements: fromMatches,
        recommendations: isMultiStage
          ? []
          : [
              'Используйте multi-stage сборку для оптимизации размера образа',
              'Разделите build и runtime этапы',
            ],
      }
    );
  }

  /**
   * Проверка готовности к production
   */
  private async checkProductionReady(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    const prodFiles = [
      'docker-compose.prod.yml',
      'docker-compose.production.yml',
      'Dockerfile.prod',
      'Dockerfile.production',
    ];

    let foundProdFiles = 0;
    const foundFiles: string[] = [];

    for (const file of prodFiles) {
      if (await project.exists(file)) {
        foundProdFiles++;
        foundFiles.push(file);
      }
    }

    // Проверка ENV переменных в Dockerfile
    let hasEnvConfig = false;
    if (await project.exists('Dockerfile')) {
      const content = await project.readFile('Dockerfile');
      hasEnvConfig = content.includes('ENV NODE_ENV') || content.includes('ENV ENVIRONMENT');
    }

    const passed = foundProdFiles > 0 || hasEnvConfig;
    const score = passed ? checkInfo.maxScore : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      passed,
      `Production готовность: файлы (${foundProdFiles}), ENV конфигурация (${hasEnvConfig})`,
      score,
      checkInfo.maxScore,
      passed ? SeverityLevel.LOW : SeverityLevel.HIGH,
      {
        productionFiles: foundFiles,
        hasEnvConfig,
        foundProdFiles,
        recommendations: passed
          ? []
          : [
              'Создайте docker-compose.prod.yml для production',
              'Настройте ENV переменные для разных окружений',
            ],
      }
    );
  }

  /**
   * Проверка безопасности контейнера
   */
  private async checkSecurity(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    if (!(await project.exists('Dockerfile'))) {
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        'Dockerfile не найден для проверки безопасности',
        0,
        checkInfo.maxScore,
        SeverityLevel.HIGH
      );
    }

    const content = await project.readFile('Dockerfile');

    // Проверка security best practices
    const hasUser = content.includes('USER ') && !content.includes('USER root');
    const hasSecurityUpdates = content.includes('apt-get update') || content.includes('apk update');
    const hasNoCache =
      content.includes('--no-cache') || content.includes('rm -rf /var/lib/apt/lists/*');
    const noRootUser = !content.includes('USER 0') && !content.includes('USER root');

    const securityFeatures = [hasUser, hasSecurityUpdates, hasNoCache, noRootUser];
    const securityScore = securityFeatures.filter(Boolean).length;
    const passed = securityScore >= 2;
    const score = passed
      ? Math.round((securityScore / securityFeatures.length) * checkInfo.maxScore)
      : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      passed,
      `Безопасность: ${securityScore}/4 функций`,
      score,
      checkInfo.maxScore,
      passed ? SeverityLevel.LOW : SeverityLevel.HIGH,
      {
        securityFeatures: {
          nonRootUser: hasUser,
          securityUpdates: hasSecurityUpdates,
          cacheCleanup: hasNoCache,
          noExplicitRoot: noRootUser,
        },
        score: securityScore,
        total: securityFeatures.length,
        recommendations: passed
          ? []
          : [
              'Создайте non-root пользователя в Dockerfile',
              'Очищайте кэш пакетов после установки',
              'Избегайте явного использования root пользователя',
            ],
      }
    );
  }

  /**
   * Проверка health check
   */
  private async checkHealthCheck(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    if (!(await project.exists('Dockerfile'))) {
      return this.createResult(
        checkInfo.id,
        checkInfo.name,
        checkInfo.description,
        false,
        'Dockerfile не найден для проверки health check',
        0,
        checkInfo.maxScore,
        SeverityLevel.MEDIUM
      );
    }

    const content = await project.readFile('Dockerfile');
    const hasHealthCheck = content.includes('HEALTHCHECK');
    const score = hasHealthCheck ? checkInfo.maxScore : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      hasHealthCheck,
      hasHealthCheck ? 'HEALTHCHECK настроен' : 'HEALTHCHECK не найден',
      score,
      checkInfo.maxScore,
      hasHealthCheck ? SeverityLevel.LOW : SeverityLevel.MEDIUM,
      {
        hasHealthCheck,
        recommendations: hasHealthCheck
          ? []
          : [
              'Добавьте HEALTHCHECK в Dockerfile',
              'Настройте проверку работоспособности приложения',
            ],
      }
    );
  }

  /**
   * Проверка .dockerignore
   */
  private async checkDockerIgnore(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    const hasDockerIgnore = await project.exists('.dockerignore');
    const score = hasDockerIgnore ? checkInfo.maxScore : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      hasDockerIgnore,
      hasDockerIgnore ? '.dockerignore найден' : '.dockerignore отсутствует',
      score,
      checkInfo.maxScore,
      hasDockerIgnore ? SeverityLevel.LOW : SeverityLevel.LOW, // Не критично
      {
        hasDockerIgnore,
        recommendations: hasDockerIgnore
          ? []
          : [
              'Создайте .dockerignore для исключения ненужных файлов',
              'Оптимизируйте контекст сборки',
            ],
      }
    );
  }

  /**
   * Проверка окружений
   */
  private async checkEnvironments(checkInfo: CheckInfo, project: Project): Promise<CheckResult> {
    const envFiles = [
      'docker-compose.dev.yml',
      'docker-compose.test.yml',
      'docker-compose.prod.yml',
      'docker-compose.staging.yml',
    ];

    let foundEnvFiles = 0;
    const foundFiles: string[] = [];

    for (const file of envFiles) {
      if (await project.exists(file)) {
        foundEnvFiles++;
        foundFiles.push(file);
      }
    }

    const passed = foundEnvFiles >= 2; // Минимум 2 окружения
    const score = passed ? Math.round((foundEnvFiles / envFiles.length) * checkInfo.maxScore) : 0;

    return this.createResult(
      checkInfo.id,
      checkInfo.name,
      checkInfo.description,
      passed,
      `Окружения: ${foundEnvFiles} из ${envFiles.length}`,
      score,
      checkInfo.maxScore,
      passed ? SeverityLevel.LOW : SeverityLevel.MEDIUM,
      {
        foundEnvFiles,
        totalPossible: envFiles.length,
        files: foundFiles,
        recommendations: passed
          ? []
          : [
              'Создайте конфигурации для dev, test, prod окружений',
              'Используйте override файлы для специфичных настроек',
            ],
      }
    );
  }
}
