/**
 * Enhanced Jest Checker - Расширенный анализатор Jest с глубоким анализом
 * Phase 1.1: Jest Integration Enhancement
 */

const fs = require('fs/promises');
const path = require('path');
const { BaseChecker } = require('../../../core/checker.js');

/**
 * Улучшенный анализатор Jest с расширенными возможностями
 */
class EnhancedJestChecker extends BaseChecker {
  name = 'enhanced-jest-checker';
  category = 'testing';
  description = 'Глубокий анализ Jest конфигурации, паттернов и best practices';

  constructor() {
    super();
    this.mockPatterns = ['jest.mock', 'jest.spyOn', 'mockImplementation', 'mockReturnValue'];
    this.testPatterns = [
      'describe',
      'test',
      'it',
      'beforeEach',
      'afterEach',
      'beforeAll',
      'afterAll',
    ];
  }

  async check(context) {
    const projectPath = context.projectPath;

    try {
      console.log('🔍 Запуск Enhanced Jest Analysis...');

      // 1. Базовые проверки
      const basicAnalysis = await this.performBasicAnalysis(projectPath);
      if (!basicAnalysis.hasJest) {
        return this.createResult(false, 0, 'Jest не установлен', basicAnalysis, [
          'Установите Jest: npm install -D jest',
          'Для TypeScript: npm install -D @types/jest ts-jest',
        ]);
      }

      // 2. Анализ конфигурации
      const configAnalysis = await this.analyzeJestConfiguration(projectPath);

      // 3. Анализ тестовых файлов и паттернов
      const testFilesAnalysis = await this.analyzeTestFiles(projectPath);

      // 4. Анализ mock паттернов
      const mockAnalysis = await this.analyzeMockPatterns(projectPath);

      // 5. Анализ покрытия кода
      const coverageAnalysis = await this.analyzeCoverageSetup(projectPath);

      // 6. Итоговая оценка
      const finalScore = this.calculateEnhancedScore({
        basic: basicAnalysis,
        config: configAnalysis,
        testFiles: testFilesAnalysis,
        mocks: mockAnalysis,
        coverage: coverageAnalysis,
      });

      const details = {
        ...basicAnalysis,
        ...configAnalysis,
        ...testFilesAnalysis,
        ...mockAnalysis,
        ...coverageAnalysis,
        finalScore,
      };

      const recommendations = this.generateEnhancedRecommendations(details);

      return this.createResult(
        finalScore >= 70,
        finalScore,
        `Enhanced Jest Analysis: ${this.getScoreDescription(finalScore)}`,
        details,
        recommendations
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        `Ошибка анализа Jest: ${error.message}`,
        { error: error.message },
        ['Проверьте структуру проекта и права доступа']
      );
    }
  }

  /**
   * Базовый анализ Jest установки
   */
  async performBasicAnalysis(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!(await this.fileExists(packageJsonPath))) {
      return { hasJest: false, reason: 'package.json not found' };
    }

    const content = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {}),
    };

    const hasJest = 'jest' in allDeps;
    const jestVersion = hasJest ? allDeps.jest : null;
    const hasTypeScript = '@types/jest' in allDeps || 'ts-jest' in allDeps;

    return {
      hasJest,
      jestVersion,
      hasTypeScript,
      packageJsonExists: true,
    };
  }

  /**
   * Анализ конфигурации Jest
   */
  async analyzeJestConfiguration(projectPath) {
    const configFiles = [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.mjs',
      'jest.config.json',
      'jest.config.cjs',
    ];

    let configFound = false;
    let configPath = null;
    let configContent = null;
    let configType = 'none';

    // Проверяем отдельные конфигурационные файлы
    for (const configFile of configFiles) {
      const fullPath = path.join(projectPath, configFile);
      if (await this.fileExists(fullPath)) {
        configFound = true;
        configPath = fullPath;
        configContent = await fs.readFile(fullPath, 'utf8');
        configType = 'separate-file';
        break;
      }
    }

    // Проверяем конфигурацию в package.json
    if (!configFound) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        if (packageJson.jest) {
          configFound = true;
          configPath = packageJsonPath;
          configContent = JSON.stringify(packageJson.jest, null, 2);
          configType = 'package-json';
        }
      }
    }

    // Анализируем конфигурацию
    const configAnalysis = configFound ? this.parseJestConfig(configContent) : {};

    return {
      hasJestConfig: configFound,
      configPath,
      configType,
      ...configAnalysis,
    };
  }

  /**
   * Парсинг конфигурации Jest
   */
  parseJestConfig(configContent) {
    const analysis = {
      hasTransform: false,
      hasTestEnvironment: false,
      hasSetupFiles: false,
      hasCoverage: false,
      hasWatchMode: false,
      hasModuleNameMapping: false,
    };

    if (configContent.includes('transform')) analysis.hasTransform = true;
    if (configContent.includes('testEnvironment')) analysis.hasTestEnvironment = true;
    if (configContent.includes('setupFilesAfterEnv') || configContent.includes('setupFiles')) {
      analysis.hasSetupFiles = true;
    }
    if (configContent.includes('collectCoverage') || configContent.includes('coverageThreshold')) {
      analysis.hasCoverage = true;
    }
    if (configContent.includes('watchMode')) analysis.hasWatchMode = true;
    if (configContent.includes('moduleNameMapper')) analysis.hasModuleNameMapping = true;

    return analysis;
  }

  /**
   * Анализ тестовых файлов
   */
  async analyzeTestFiles(projectPath) {
    const testFiles = await this.findTestFiles(projectPath);

    const analysis = {
      testFileCount: testFiles.length,
      testFiles: testFiles.slice(0, 10), // Первые 10 для детализации
      testStructures: {},
      totalTests: 0,
      totalDescribes: 0,
    };

    // Анализируем структуру тестов в файлах
    for (const testFile of testFiles.slice(0, 5)) {
      // Анализируем первые 5 файлов
      try {
        const content = await fs.readFile(testFile, 'utf8');
        const fileAnalysis = this.analyzeTestFileContent(content);
        analysis.testStructures[path.basename(testFile)] = fileAnalysis;
        analysis.totalTests += fileAnalysis.testCount;
        analysis.totalDescribes += fileAnalysis.describeCount;
      } catch (error) {
        // Игнорируем ошибки чтения отдельных файлов
      }
    }

    return analysis;
  }

  /**
   * Анализ содержимого тестового файла
   */
  analyzeTestFileContent(content) {
    const analysis = {
      testCount: 0,
      describeCount: 0,
      hasBeforeEach: false,
      hasAfterEach: false,
      hasAsyncTests: false,
      hasMocks: false,
    };

    // Подсчет тестов и describe блоков
    analysis.testCount = (content.match(/\b(test|it)\s*\(/g) || []).length;
    analysis.describeCount = (content.match(/\bdescribe\s*\(/g) || []).length;

    // Проверка lifecycle hooks
    analysis.hasBeforeEach = content.includes('beforeEach');
    analysis.hasAfterEach = content.includes('afterEach');

    // Проверка async тестов
    analysis.hasAsyncTests =
      content.includes('async ') && (content.includes('await ') || content.includes('Promise'));

    // Проверка использования моков
    analysis.hasMocks = this.mockPatterns.some(pattern => content.includes(pattern));

    return analysis;
  }

  /**
   * Анализ mock паттернов
   */
  async analyzeMockPatterns(projectPath) {
    const testFiles = await this.findTestFiles(projectPath);

    const mockAnalysis = {
      totalMockUsage: 0,
      mockPatternDistribution: {},
      filesWithMocks: 0,
      mockQualityScore: 0,
    };

    // Инициализируем счетчики паттернов
    this.mockPatterns.forEach(pattern => {
      mockAnalysis.mockPatternDistribution[pattern] = 0;
    });

    let totalFilesAnalyzed = 0;

    for (const testFile of testFiles.slice(0, 10)) {
      // Анализируем до 10 файлов
      try {
        const content = await fs.readFile(testFile, 'utf8');
        let fileMockCount = 0;

        this.mockPatterns.forEach(pattern => {
          const matches = (content.match(new RegExp(pattern, 'g')) || []).length;
          mockAnalysis.mockPatternDistribution[pattern] += matches;
          fileMockCount += matches;
        });

        if (fileMockCount > 0) {
          mockAnalysis.filesWithMocks++;
        }
        mockAnalysis.totalMockUsage += fileMockCount;
        totalFilesAnalyzed++;
      } catch (error) {
        // Игнорируем ошибки чтения файлов
      }
    }

    // Вычисляем качественную оценку использования моков
    if (totalFilesAnalyzed > 0) {
      const mockCoverage = mockAnalysis.filesWithMocks / totalFilesAnalyzed;
      const avgMocksPerFile = mockAnalysis.totalMockUsage / totalFilesAnalyzed;
      mockAnalysis.mockQualityScore = Math.min(
        100,
        mockCoverage * 60 + Math.min(avgMocksPerFile, 5) * 8
      );
    }

    return mockAnalysis;
  }

  /**
   * Анализ настроек покрытия кода
   */
  async analyzeCoverageSetup(projectPath) {
    const analysis = {
      hasCoverageConfig: false,
      coverageThreshold: null,
      coverageReports: [],
      coverageScore: 0,
    };

    // Проверяем конфигурацию в отдельных файлах
    const configFiles = ['jest.config.js', 'jest.config.ts'];
    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (await this.fileExists(configPath)) {
        const content = await fs.readFile(configPath, 'utf8');
        if (content.includes('collectCoverage') || content.includes('coverageThreshold')) {
          analysis.hasCoverageConfig = true;

          // Пытаемся извлечь threshold
          const thresholdMatch = content.match(/coverageThreshold[^}]*global[^}]*(\d+)/);
          if (thresholdMatch) {
            analysis.coverageThreshold = parseInt(thresholdMatch[1]);
          }
        }
        break;
      }
    }

    // Проверяем package.json
    if (!analysis.hasCoverageConfig) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);

        if (
          packageJson.jest &&
          (packageJson.jest.collectCoverage || packageJson.jest.coverageThreshold)
        ) {
          analysis.hasCoverageConfig = true;
          if (packageJson.jest.coverageThreshold && packageJson.jest.coverageThreshold.global) {
            const global = packageJson.jest.coverageThreshold.global;
            analysis.coverageThreshold = Math.max(
              global.branches || 0,
              global.functions || 0,
              global.lines || 0,
              global.statements || 0
            );
          }
        }

        // Проверяем скрипты на coverage
        if (packageJson.scripts) {
          if (
            packageJson.scripts['test:coverage'] ||
            packageJson.scripts.coverage ||
            (packageJson.scripts.test && packageJson.scripts.test.includes('--coverage'))
          ) {
            analysis.hasCoverageConfig = true;
          }
        }
      }
    }

    // Вычисляем оценку покрытия
    analysis.coverageScore = analysis.hasCoverageConfig
      ? analysis.coverageThreshold
        ? Math.min(100, 50 + analysis.coverageThreshold / 2)
        : 50
      : 0;

    return analysis;
  }

  /**
   * Поиск тестовых файлов
   */
  async findTestFiles(projectPath) {
    const testFiles = [];
    const searchDirs = ['src', 'test', 'tests', '__tests__', 'spec'];
    const extensions = [
      '.test.js',
      '.spec.js',
      '.test.ts',
      '.spec.ts',
      '.test.jsx',
      '.spec.jsx',
      '.test.tsx',
      '.spec.tsx',
    ];

    for (const dir of searchDirs) {
      const fullPath = path.join(projectPath, dir);
      if (await this.fileExists(fullPath)) {
        const files = await this.findFilesRecursive(fullPath, extensions);
        testFiles.push(...files);
      }
    }

    // Также ищем в корневой директории
    try {
      const entries = await fs.readdir(projectPath);
      for (const entry of entries) {
        if (extensions.some(ext => entry.endsWith(ext))) {
          testFiles.push(path.join(projectPath, entry));
        }
      }
    } catch (error) {
      // Игнорируем ошибки
    }

    return [...new Set(testFiles)]; // Убираем дубликаты
  }

  /**
   * Рекурсивный поиск файлов
   */
  async findFilesRecursive(dir, extensions) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.findFilesRecursive(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Игнорируем ошибки чтения директорий
    }
    return files;
  }

  /**
   * Вычисление улучшенной оценки
   */
  calculateEnhancedScore(analyses) {
    let score = 0;
    let maxScore = 0;

    // Базовая оценка (30 баллов)
    maxScore += 30;
    if (analyses.basic.hasJest) {
      score += 20;
      if (analyses.basic.hasTypeScript) score += 10;
    }

    // Конфигурация (25 баллов)
    maxScore += 25;
    if (analyses.config.hasJestConfig) {
      score += 10;
      if (analyses.config.hasTransform) score += 3;
      if (analyses.config.hasTestEnvironment) score += 3;
      if (analyses.config.hasSetupFiles) score += 3;
      if (analyses.config.hasModuleNameMapping) score += 3;
      if (analyses.config.configType === 'separate-file') score += 3;
    }

    // Тестовые файлы (25 баллов)
    maxScore += 25;
    if (analyses.testFiles.testFileCount > 0) {
      score += Math.min(15, analyses.testFiles.testFileCount * 2);
      if (analyses.testFiles.totalTests > 0) score += Math.min(10, analyses.testFiles.totalTests);
    }

    // Mock паттерны (10 баллов)
    maxScore += 10;
    score += Math.min(10, analyses.mocks.mockQualityScore / 10);

    // Покрытие кода (10 баллов)
    maxScore += 10;
    score += Math.min(10, analyses.coverage.coverageScore / 10);

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Генерация улучшенных рекомендаций
   */
  generateEnhancedRecommendations(details) {
    const recommendations = [];

    if (!details.hasJest) {
      recommendations.push('Установите Jest: npm install -D jest');
      if (!details.hasTypeScript) {
        recommendations.push('Для TypeScript проектов: npm install -D @types/jest ts-jest');
      }
    }

    if (!details.hasJestConfig) {
      recommendations.push('Создайте jest.config.js для лучшего контроля конфигурации');
    }

    if (details.testFileCount < 3) {
      recommendations.push('Увеличьте покрытие тестами - добавьте больше тестовых файлов');
    }

    if (details.mockQualityScore < 30) {
      recommendations.push(
        'Рассмотрите использование моков для изоляции тестов (jest.mock, jest.spyOn)'
      );
    }

    if (!details.hasCoverageConfig) {
      recommendations.push('Настройте сбор покрытия кода с помощью collectCoverage: true');
      recommendations.push('Установите минимальные пороги покрытия в coverageThreshold');
    }

    if (details.totalTests < 5) {
      recommendations.push('Добавьте больше unit тестов для критических частей приложения');
    }

    if (!details.hasTransform && details.hasTypeScript) {
      recommendations.push('Настройте transform для TypeScript: установите ts-jest');
    }

    return recommendations;
  }

  /**
   * Описание оценки
   */
  getScoreDescription(score) {
    if (score >= 90) return 'Отлично настроен';
    if (score >= 80) return 'Хорошо настроен';
    if (score >= 70) return 'Базово настроен';
    if (score >= 50) return 'Требует улучшений';
    return 'Критические проблемы';
  }

  /**
   * Проверка существования файла
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { EnhancedJestChecker };
