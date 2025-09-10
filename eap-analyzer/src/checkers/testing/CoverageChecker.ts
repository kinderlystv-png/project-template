import { BaseChecker } from '../../core/base/BaseChecker';
import { CheckInfo } from '../../core/interfaces/IChecker';
import { CheckResult } from '../../types/CheckResult';
import { Project } from '../../types/Project';
import { AnalysisCategory } from '../../types/AnalysisCategory';
import { SeverityLevel } from '../../types/SeverityLevel';

/**
 * Конфигурация покрытия тестами
 */
interface CoverageConfig {
  enabled: boolean;
  provider: string | null;
  thresholds: {
    lines?: number;
    functions?: number;
    branches?: number;
    statements?: number;
  };
  outputDir?: string;
  exclude?: string[];
}

/**
 * Проверщик настроек покрытия кода тестами
 * Анализирует конфигурацию и пороги покрытия в различных тестовых фреймворках
 */
export class CoverageChecker extends BaseChecker {
  constructor() {
    super(
      'CoverageChecker',
      AnalysisCategory.TESTING,
      'Проверка настроек покрытия кода тестами',
      'Code Coverage Standards',
      SeverityLevel.MEDIUM,
      '2.0.0',
      {
        enabled: true,
        failOnError: false,
        thresholds: {
          min_lines_coverage: 80,
          min_functions_coverage: 80,
          min_branches_coverage: 70,
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

    try {
      const coverageConfig = await this.analyzeCoverageConfig(project);
      results.push(this.createCoverageResult(coverageConfig));

      // Проверяем наличие coverage отчетов
      results.push(await this.checkCoverageReports(project));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push(
        this.createResult(
          'coverage-check-error',
          'Coverage Check Error',
          'Ошибка при проверке настроек покрытия',
          false,
          `Ошибка: ${errorMessage}`,
          0,
          10,
          SeverityLevel.MEDIUM,
          { error: errorMessage }
        )
      );
    }

    const duration = Date.now() - startTime;
    results.forEach(result => {
      if (result.stats) {
        result.stats.duration = duration / results.length;
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
        id: 'coverage-enabled',
        name: 'Coverage Enabled Check',
        description: 'Проверка включения сбора покрытия',
        severity: SeverityLevel.HIGH,
        maxScore: 30,
        tags: [AnalysisCategory.TESTING, 'coverage', 'configuration'],
      },
      {
        id: 'coverage-thresholds',
        name: 'Coverage Thresholds Check',
        description: 'Проверка настройки порогов покрытия',
        severity: SeverityLevel.MEDIUM,
        maxScore: 25,
        tags: [AnalysisCategory.TESTING, 'coverage', 'thresholds'],
      },
      {
        id: 'coverage-reports',
        name: 'Coverage Reports Check',
        description: 'Проверка генерации отчетов покрытия',
        severity: SeverityLevel.LOW,
        maxScore: 15,
        tags: [AnalysisCategory.TESTING, 'coverage', 'reports'],
      },
    ];
  }

  /**
   * @inheritdoc
   */
  async isApplicable(project: Project): Promise<boolean> {
    try {
      // Проверяем наличие тестовых конфигураций
      const hasTestConfigs =
        (await project.exists('vitest.config.ts')) ||
        (await project.exists('vitest.config.js')) ||
        (await project.exists('jest.config.ts')) ||
        (await project.exists('jest.config.js')) ||
        (await project.exists('.nycrc')) ||
        (await project.exists('.nycrc.json'));

      if (hasTestConfigs) return true;

      // Проверяем package.json на наличие тестовых настроек
      if (await project.exists('package.json')) {
        const packageContent = await project.readFile('package.json');
        const packageJson = JSON.parse(packageContent);

        return !!(
          packageJson.jest ||
          packageJson.vitest ||
          packageJson.nyc ||
          packageJson.devDependencies?.['c8'] ||
          packageJson.devDependencies?.['nyc']
        );
      }

      return false;
    } catch (error) {
      this.log(`Ошибка при проверке применимости: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Анализирует конфигурацию покрытия в проекте
   */
  private async analyzeCoverageConfig(project: Project): Promise<CoverageConfig> {
    const config: CoverageConfig = {
      enabled: false,
      provider: null,
      thresholds: {},
    };

    // Проверяем Vitest coverage
    await this.checkVitestCoverage(project, config);

    // Проверяем Jest coverage
    if (!config.enabled) {
      await this.checkJestCoverage(project, config);
    }

    // Проверяем NYC coverage
    if (!config.enabled) {
      await this.checkNYCCoverage(project, config);
    }

    return config;
  }

  /**
   * Проверяет настройки покрытия в Vitest
   */
  private async checkVitestCoverage(project: Project, config: CoverageConfig): Promise<void> {
    const configFiles = [
      'vitest.config.ts',
      'vitest.config.js',
      'vite.config.ts',
      'vite.config.js',
    ];

    for (const configFile of configFiles) {
      if (await project.exists(configFile)) {
        const content = await project.readFile(configFile);

        if (content.includes('coverage')) {
          config.enabled = true;
          config.provider = 'c8';

          // Парсим настройки покрытия
          this.parseVitestCoverageConfig(content, config);
          break;
        }
      }
    }
  }

  /**
   * Проверяет настройки покрытия в Jest
   */
  private async checkJestCoverage(project: Project, config: CoverageConfig): Promise<void> {
    const configFiles = ['jest.config.ts', 'jest.config.js', 'jest.config.json'];

    for (const configFile of configFiles) {
      if (await project.exists(configFile)) {
        const content = await project.readFile(configFile);

        if (content.includes('collectCoverage') && content.includes('true')) {
          config.enabled = true;
          config.provider = 'istanbul';

          // Парсим настройки покрытия
          this.parseJestCoverageConfig(content, config);
          break;
        }
      }
    }

    // Проверяем package.json для Jest
    if (!config.enabled && (await project.exists('package.json'))) {
      const packageContent = await project.readFile('package.json');
      const packageJson = JSON.parse(packageContent);

      if (packageJson.jest?.collectCoverage) {
        config.enabled = true;
        config.provider = 'istanbul';
        this.parseJestPackageConfig(packageJson.jest, config);
      }
    }
  }

  /**
   * Проверяет настройки NYC coverage
   */
  private async checkNYCCoverage(project: Project, config: CoverageConfig): Promise<void> {
    const configFiles = ['.nycrc', '.nycrc.json', '.nycrc.yml'];

    for (const configFile of configFiles) {
      if (await project.exists(configFile)) {
        config.enabled = true;
        config.provider = 'nyc';

        const content = await project.readFile(configFile);
        this.parseNYCConfig(content, config);
        break;
      }
    }
  }

  /**
   * Парсит конфигурацию покрытия Vitest
   */
  private parseVitestCoverageConfig(content: string, config: CoverageConfig): void {
    // Ищем threshold настройки
    const thresholdMatch = content.match(/threshold\s*:\s*{([^}]+)}/);
    if (thresholdMatch) {
      const thresholdContent = thresholdMatch[1];

      const linesMatch = thresholdContent.match(/lines\s*:\s*(\d+)/);
      if (linesMatch) config.thresholds.lines = parseInt(linesMatch[1], 10);

      const functionsMatch = thresholdContent.match(/functions\s*:\s*(\d+)/);
      if (functionsMatch) config.thresholds.functions = parseInt(functionsMatch[1], 10);

      const branchesMatch = thresholdContent.match(/branches\s*:\s*(\d+)/);
      if (branchesMatch) config.thresholds.branches = parseInt(branchesMatch[1], 10);

      const statementsMatch = thresholdContent.match(/statements\s*:\s*(\d+)/);
      if (statementsMatch) config.thresholds.statements = parseInt(statementsMatch[1], 10);
    }

    // Ищем outputDir
    const outputMatch = content.match(/reportsDirectory\s*:\s*['"`]([^'"`]+)['"`]/);
    if (outputMatch) {
      config.outputDir = outputMatch[1];
    }
  }

  /**
   * Парсит конфигурацию покрытия Jest
   */
  private parseJestCoverageConfig(content: string, config: CoverageConfig): void {
    // Ищем coverageThreshold
    const thresholdMatch = content.match(/coverageThreshold\s*:\s*{\s*global\s*:\s*{([^}]+)}/);
    if (thresholdMatch) {
      const thresholdContent = thresholdMatch[1];

      const linesMatch = thresholdContent.match(/lines\s*:\s*(\d+)/);
      if (linesMatch) config.thresholds.lines = parseInt(linesMatch[1], 10);

      const functionsMatch = thresholdContent.match(/functions\s*:\s*(\d+)/);
      if (functionsMatch) config.thresholds.functions = parseInt(functionsMatch[1], 10);

      const branchesMatch = thresholdContent.match(/branches\s*:\s*(\d+)/);
      if (branchesMatch) config.thresholds.branches = parseInt(branchesMatch[1], 10);

      const statementsMatch = thresholdContent.match(/statements\s*:\s*(\d+)/);
      if (statementsMatch) config.thresholds.statements = parseInt(statementsMatch[1], 10);
    }

    // Ищем coverageDirectory
    const outputMatch = content.match(/coverageDirectory\s*:\s*['"`]([^'"`]+)['"`]/);
    if (outputMatch) {
      config.outputDir = outputMatch[1];
    }
  }

  /**
   * Парсит конфигурацию покрытия из package.json для Jest
   */
  private parseJestPackageConfig(jestConfig: any, config: CoverageConfig): void {
    if (jestConfig.coverageThreshold?.global) {
      const global = jestConfig.coverageThreshold.global;
      config.thresholds = {
        lines: global.lines,
        functions: global.functions,
        branches: global.branches,
        statements: global.statements,
      };
    }

    if (jestConfig.coverageDirectory) {
      config.outputDir = jestConfig.coverageDirectory;
    }
  }

  /**
   * Парсит конфигурацию NYC
   */
  private parseNYCConfig(content: string, config: CoverageConfig): void {
    try {
      const nycConfig = JSON.parse(content);

      if (nycConfig.lines) config.thresholds.lines = nycConfig.lines;
      if (nycConfig.functions) config.thresholds.functions = nycConfig.functions;
      if (nycConfig.branches) config.thresholds.branches = nycConfig.branches;
      if (nycConfig.statements) config.thresholds.statements = nycConfig.statements;

      if (nycConfig['report-dir']) config.outputDir = nycConfig['report-dir'];
    } catch (error) {
      this.log(`Ошибка парсинга NYC конфигурации: ${error}`, 'warn');
    }
  }

  /**
   * Проверяет наличие отчетов покрытия
   */
  private async checkCoverageReports(project: Project): Promise<CheckResult> {
    const commonReportDirs = ['coverage', 'coverage-report', 'htmlcov'];
    let reportsFound = false;
    let reportDir = '';

    for (const dir of commonReportDirs) {
      if (await project.exists(dir)) {
        reportsFound = true;
        reportDir = dir;
        break;
      }
    }

    const score = reportsFound ? 15 : 0;
    const recommendations = reportsFound
      ? []
      : ['Настройте генерацию HTML отчетов покрытия для визуального анализа'];

    return this.createResult(
      'coverage-reports',
      'Coverage Reports Check',
      'Проверка генерации отчетов покрытия',
      reportsFound,
      reportsFound
        ? `Отчеты покрытия найдены в директории: ${reportDir}`
        : 'Отчеты покрытия не найдены',
      score,
      15,
      SeverityLevel.LOW,
      {
        reportsFound,
        reportDir,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      }
    );
  }

  /**
   * Создает результат проверки конфигурации покрытия
   */
  private createCoverageResult(config: CoverageConfig): CheckResult {
    const issues: string[] = [];
    let score = 100;
    const recommendations: string[] = [];

    // Проверяем включение покрытия
    if (!config.enabled) {
      issues.push('Сбор покрытия кода не включен');
      score = 0;
      recommendations.push('Включите сбор покрытия в конфигурации тестового фреймворка');
      recommendations.push('Настройте минимальные пороги покрытия (80%+ рекомендуется)');
    } else {
      // Проверяем пороги
      const minThreshold = 80;

      if (!config.thresholds.lines && !config.thresholds.functions && !config.thresholds.branches) {
        issues.push('Пороги покрытия не настроены');
        score -= 40;
        recommendations.push('Установите минимальные пороги покрытия для контроля качества');
      } else {
        if (config.thresholds.lines && config.thresholds.lines < minThreshold) {
          issues.push(
            `Порог покрытия строк (${config.thresholds.lines}%) ниже рекомендуемого (${minThreshold}%)`
          );
          score -= 15;
        }

        if (config.thresholds.functions && config.thresholds.functions < minThreshold) {
          issues.push(
            `Порог покрытия функций (${config.thresholds.functions}%) ниже рекомендуемого (${minThreshold}%)`
          );
          score -= 15;
        }

        if (config.thresholds.branches && config.thresholds.branches < 70) {
          issues.push(
            `Порог покрытия ветвлений (${config.thresholds.branches}%) ниже рекомендуемого (70%)`
          );
          score -= 10;
        }
      }

      // Проверяем директорию отчетов
      if (!config.outputDir) {
        issues.push('Директория для отчетов покрытия не указана');
        score -= 10;
        recommendations.push('Укажите директорию для сохранения отчетов покрытия');
      }
    }

    return this.createResult(
      'coverage-configuration',
      'Coverage Configuration Check',
      'Проверка конфигурации покрытия кода',
      config.enabled && Object.keys(config.thresholds).length > 0,
      config.enabled
        ? `Покрытие настроено (${config.provider}), пороги: ${JSON.stringify(config.thresholds)}`
        : 'Покрытие кода не настроено',
      Math.max(0, score),
      100,
      config.enabled ? SeverityLevel.LOW : SeverityLevel.HIGH,
      {
        enabled: config.enabled,
        provider: config.provider,
        thresholds: config.thresholds,
        outputDir: config.outputDir,
        issues: issues.length > 0 ? issues : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      }
    );
  }
}
