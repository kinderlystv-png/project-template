import { BaseChecker } from '../../core/base/BaseChecker';
import { CheckInfo } from '../../core/interfaces/IChecker';
import { CheckResult } from '../../types/CheckResult';
import { Project } from '../../types/Project';
import { AnalysisCategory } from '../../types/AnalysisCategory';
import { SeverityLevel } from '../../types/SeverityLevel';

/**
 * Информация о тестовом фреймворке
 */
interface TestFrameworkInfo {
  name: string;
  installed: boolean;
  configExists: boolean;
  testFilesExist: boolean;
  testCount: number;
  testDirs: string[];
  version?: string;
}

/**
 * Проверщик тестовых фреймворков
 * Выполняет анализ настройки и использования тестовых фреймворков в проекте
 */
export class TestingFrameworkChecker extends BaseChecker {
  constructor() {
    super(
      'TestingFrameworkChecker',
      AnalysisCategory.TESTING,
      'Проверка настройки и использования тестовых фреймворков',
      'Testing Best Practices',
      SeverityLevel.HIGH,
      '2.0.0',
      {
        enabled: true,
        failOnError: false,
        thresholds: {
          min_test_files: 3,
          min_coverage: 70,
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
      // Получаем информацию о тестовых фреймворках
      const frameworks = await this.analyzeTestFrameworks(project);

      if (frameworks.length === 0) {
        results.push(this.createNoFrameworkResult());
      } else {
        // Создаем результат для каждого найденного фреймворка
        for (const framework of frameworks) {
          results.push(this.createFrameworkResult(framework));
        }
      }

      // Добавляем общую проверку тестового покрытия
      results.push(await this.checkTestCoverage(project));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push(
        this.createResult(
          'testing-framework-error',
          'Testing Framework Check Error',
          'Ошибка при проверке тестовых фреймворков',
          false,
          `Ошибка: ${errorMessage}`,
          0,
          10,
          SeverityLevel.CRITICAL,
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
        id: 'vitest-framework',
        name: 'Vitest Framework Check',
        description: 'Проверка настройки Vitest',
        severity: SeverityLevel.HIGH,
        maxScore: 25,
        tags: [AnalysisCategory.TESTING, 'vitest', 'unit-testing'],
      },
      {
        id: 'jest-framework',
        name: 'Jest Framework Check',
        description: 'Проверка настройки Jest',
        severity: SeverityLevel.HIGH,
        maxScore: 25,
        tags: [AnalysisCategory.TESTING, 'jest', 'unit-testing'],
      },
      {
        id: 'test-coverage',
        name: 'Test Coverage Check',
        description: 'Проверка настройки покрытия тестами',
        severity: SeverityLevel.MEDIUM,
        maxScore: 20,
        tags: [AnalysisCategory.TESTING, 'coverage'],
      },
      {
        id: 'test-structure',
        name: 'Test Structure Check',
        description: 'Проверка структуры тестовых файлов',
        severity: SeverityLevel.LOW,
        maxScore: 15,
        tags: [AnalysisCategory.TESTING, 'structure'],
      },
    ];
  }

  /**
   * @inheritdoc
   */
  async isApplicable(project: Project): Promise<boolean> {
    try {
      // Проверяем наличие package.json
      if (!(await project.exists('package.json'))) {
        return false;
      }

      const packageContent = await project.readFile('package.json');
      const packageJson = JSON.parse(packageContent);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Проверяем наличие тестовых фреймворков или файлов
      const hasTestFramework = this.hasAnyTestFramework(allDeps);
      if (hasTestFramework) return true;

      // Проверяем наличие тестовых файлов
      const files = await project.getFileList();
      return this.hasTestFiles(files);
    } catch (error) {
      this.log(`Ошибка при проверке применимости: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Анализирует тестовые фреймворки в проекте
   */
  private async analyzeTestFrameworks(project: Project): Promise<TestFrameworkInfo[]> {
    const frameworks: TestFrameworkInfo[] = [];

    const packageContent = await project.readFile('package.json');
    const packageJson = JSON.parse(packageContent);
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const files = await project.getFileList();
    const testFiles = this.getTestFiles(files);

    // Проверяем Vitest
    if (allDeps.vitest) {
      const vitestInfo = await this.analyzeVitest(project, testFiles, allDeps.vitest);
      frameworks.push(vitestInfo);
    }

    // Проверяем Jest
    if (allDeps.jest) {
      const jestInfo = await this.analyzeJest(project, testFiles, allDeps.jest);
      frameworks.push(jestInfo);
    }

    // Проверяем другие фреймворки
    if (allDeps.mocha) {
      const mochaInfo = await this.analyzeMocha(project, testFiles, allDeps.mocha);
      frameworks.push(mochaInfo);
    }

    return frameworks;
  }

  /**
   * Анализирует настройку Vitest
   */
  private async analyzeVitest(
    project: Project,
    testFiles: string[],
    version: string
  ): Promise<TestFrameworkInfo> {
    const configExists =
      (await project.exists('vitest.config.ts')) ||
      (await project.exists('vitest.config.js')) ||
      (await project.exists('vite.config.ts')) ||
      (await project.exists('vite.config.js'));

    const vitestFiles = testFiles.filter(
      file => file.includes('.test.') || file.includes('.spec.')
    );

    const testDirs = [
      ...new Set(vitestFiles.map(file => file.split('/').slice(0, -1).join('/'))),
    ].filter(dir => dir);

    return {
      name: 'Vitest',
      installed: true,
      configExists,
      testFilesExist: vitestFiles.length > 0,
      testCount: vitestFiles.length,
      testDirs,
      version,
    };
  }

  /**
   * Анализирует настройку Jest
   */
  private async analyzeJest(
    project: Project,
    testFiles: string[],
    version: string
  ): Promise<TestFrameworkInfo> {
    const configExists =
      (await project.exists('jest.config.ts')) ||
      (await project.exists('jest.config.js')) ||
      (await project.exists('jest.config.json'));

    // Проверяем конфигурацию в package.json
    const packageContent = await project.readFile('package.json');
    const packageJson = JSON.parse(packageContent);
    const hasPackageConfig = packageJson.jest !== undefined;

    const jestFiles = testFiles.filter(
      file =>
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.endsWith('.test.js') ||
        file.endsWith('.test.ts')
    );

    const testDirs = [
      ...new Set(jestFiles.map(file => file.split('/').slice(0, -1).join('/'))),
    ].filter(dir => dir);

    return {
      name: 'Jest',
      installed: true,
      configExists: configExists || hasPackageConfig,
      testFilesExist: jestFiles.length > 0,
      testCount: jestFiles.length,
      testDirs,
      version,
    };
  }

  /**
   * Анализирует настройку Mocha
   */
  private async analyzeMocha(
    project: Project,
    testFiles: string[],
    version: string
  ): Promise<TestFrameworkInfo> {
    const configExists =
      (await project.exists('.mocharc.json')) ||
      (await project.exists('.mocharc.yml')) ||
      (await project.exists('mocha.opts'));

    const mochaFiles = testFiles.filter(file => file.includes('.test.') || file.includes('.spec.'));

    const testDirs = [
      ...new Set(mochaFiles.map(file => file.split('/').slice(0, -1).join('/'))),
    ].filter(dir => dir);

    return {
      name: 'Mocha',
      installed: true,
      configExists,
      testFilesExist: mochaFiles.length > 0,
      testCount: mochaFiles.length,
      testDirs,
      version,
    };
  }

  /**
   * Проверяет настройку покрытия тестами
   */
  private async checkTestCoverage(project: Project): Promise<CheckResult> {
    let coverageEnabled = false;
    let coverageThresholds = false;
    const recommendations: string[] = [];

    try {
      // Проверяем Vitest coverage
      if (
        (await project.exists('vitest.config.ts')) ||
        (await project.exists('vitest.config.js'))
      ) {
        const configPath = (await project.exists('vitest.config.ts'))
          ? 'vitest.config.ts'
          : 'vitest.config.js';
        const configContent = await project.readFile(configPath);

        if (configContent.includes('coverage')) {
          coverageEnabled = true;
          if (configContent.includes('threshold')) {
            coverageThresholds = true;
          }
        }
      }

      // Проверяем Jest coverage
      if ((await project.exists('jest.config.ts')) || (await project.exists('jest.config.js'))) {
        const configPath = (await project.exists('jest.config.ts'))
          ? 'jest.config.ts'
          : 'jest.config.js';
        const configContent = await project.readFile(configPath);

        if (configContent.includes('collectCoverage')) {
          coverageEnabled = true;
          if (configContent.includes('coverageThreshold')) {
            coverageThresholds = true;
          }
        }
      }

      let score = coverageEnabled ? 50 : 0;
      if (coverageThresholds) score += 30;

      if (!coverageEnabled) {
        recommendations.push('Включите сбор покрытия кода тестами');
        recommendations.push('Настройте минимальные пороги покрытия (80%+ рекомендуется)');
      } else if (!coverageThresholds) {
        recommendations.push('Установите пороги покрытия для автоматического контроля качества');
      }

      return this.createResult(
        'test-coverage',
        'Test Coverage Configuration',
        'Проверка настройки покрытия тестами',
        coverageEnabled,
        coverageEnabled
          ? coverageThresholds
            ? 'Покрытие настроено с порогами'
            : 'Покрытие настроено без порогов'
          : 'Покрытие не настроено',
        score,
        80,
        coverageEnabled ? SeverityLevel.LOW : SeverityLevel.MEDIUM,
        {
          coverageEnabled,
          coverageThresholds,
          recommendations,
        }
      );
    } catch (error) {
      return this.createResult(
        'test-coverage-error',
        'Test Coverage Check Error',
        'Ошибка при проверке покрытия',
        false,
        `Ошибка: ${error}`,
        0,
        80,
        SeverityLevel.LOW,
        { error: String(error) }
      );
    }
  }

  /**
   * Создает результат для конкретного фреймворка
   */
  private createFrameworkResult(framework: TestFrameworkInfo): CheckResult {
    const issues: string[] = [];
    let score = 100;

    // Проверяем конфигурацию
    if (!framework.configExists) {
      issues.push(`Конфигурационный файл для ${framework.name} не найден`);
      score -= 25;
    }

    // Проверяем наличие тестовых файлов
    if (!framework.testFilesExist) {
      issues.push(`Тестовые файлы для ${framework.name} не найдены`);
      score -= 40;
    } else if (framework.testCount < 3) {
      issues.push(`Найдено только ${framework.testCount} тестовых файлов, рекомендуется больше`);
      score -= 15;
    }

    // Проверяем структуру тестов
    if (framework.testDirs.length === 0) {
      issues.push('Тесты не организованы в директории');
      score -= 10;
    }

    const recommendations: string[] = [];

    if (!framework.configExists) {
      recommendations.push(`Создайте конфигурационный файл для ${framework.name}`);
    }

    if (framework.testCount < 5) {
      recommendations.push('Добавьте больше тестов для лучшего покрытия');
    }

    if (framework.testDirs.length === 0) {
      recommendations.push('Организуйте тесты в логические директории');
    }

    return this.createResult(
      `${framework.name.toLowerCase()}-framework`,
      `${framework.name} Framework Check`,
      `Проверка настройки ${framework.name}`,
      score >= 70,
      `${framework.name}: ${framework.testCount} тестов, конфигурация ${framework.configExists ? 'найдена' : 'не найдена'}`,
      Math.max(0, score),
      100,
      score >= 70 ? SeverityLevel.LOW : SeverityLevel.MEDIUM,
      {
        framework: framework.name,
        version: framework.version,
        testCount: framework.testCount,
        testDirs: framework.testDirs.length,
        configExists: framework.configExists,
        issues: issues.length > 0 ? issues : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      }
    );
  }

  /**
   * Создает результат для случая отсутствия тестовых фреймворков
   */
  private createNoFrameworkResult(): CheckResult {
    return this.createResult(
      'no-testing-framework',
      'No Testing Framework',
      'Тестовый фреймворк не обнаружен',
      false,
      'В проекте не найдено тестовых фреймворков',
      0,
      100,
      SeverityLevel.CRITICAL,
      {
        recommendations: [
          'Установите тестовый фреймворк (Vitest рекомендуется для современных проектов)',
          'Добавьте Jest для совместимости с существующими проектами',
          'Создайте тестовые файлы для критически важной логики',
        ],
      }
    );
  }

  /**
   * Проверяет наличие тестовых фреймворков в зависимостях
   */
  private hasAnyTestFramework(dependencies: Record<string, string>): boolean {
    const testFrameworks = [
      'vitest',
      'jest',
      'mocha',
      '@testing-library/react',
      '@testing-library/vue',
    ];
    return testFrameworks.some(framework => dependencies[framework]);
  }

  /**
   * Проверяет наличие тестовых файлов
   */
  private hasTestFiles(files: string[]): boolean {
    return files.some(
      file =>
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.endsWith('Test.js') ||
        file.endsWith('Test.ts')
    );
  }

  /**
   * Получает список тестовых файлов
   */
  private getTestFiles(files: string[]): string[] {
    return files.filter(
      file =>
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.endsWith('Test.js') ||
        file.endsWith('Test.ts')
    );
  }
}
