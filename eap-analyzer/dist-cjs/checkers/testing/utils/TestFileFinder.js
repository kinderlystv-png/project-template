'use strict';
/**
 * Утилиты для поиска и анализа тестовых файлов
 */
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
exports.TestFileFinder = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const constants_1 = require('../constants');
const ResultBuilder_1 = require('./ResultBuilder');
/**
 * Класс для поиска и анализа тестовых файлов в проекте
 */
class TestFileFinder {
  /**
   * Находит все тестовые файлы в проекте
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках (для уточнения поиска)
   * @returns Массив найденных тестовых файлов
   */
  async findTestFiles(project, frameworks = []) {
    const testFiles = [];
    try {
      // Преобразуем строки в FrameworkInfo если необходимо
      const frameworkInfos = this.normalizeFrameworks(frameworks);
      // Определяем директории для поиска
      const searchDirs = await this.getSearchDirectories(project, frameworkInfos);
      // Ищем тестовые файлы в каждой директории
      for (const dir of searchDirs) {
        const dirPath = path.join(project.path, dir);
        if (await this.directoryExists(dirPath)) {
          const files = await this.scanDirectory(dirPath, project.path);
          testFiles.push(...files);
        }
      }
      // Также ищем в src директории
      const srcDir = path.join(project.path, 'src');
      if (await this.directoryExists(srcDir)) {
        const srcTestFiles = await this.scanDirectory(srcDir, project.path, true);
        testFiles.push(...srcTestFiles);
      }
      // Удаляем дубликаты
      return this.removeDuplicates(testFiles);
    } catch (error) {
      console.error(`Error finding test files: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }
  /**
   * Нормализует фреймворки - преобразует строки в FrameworkInfo
   * @param frameworks Массив фреймворков или их названий
   * @returns Массив FrameworkInfo
   */
  normalizeFrameworks(frameworks) {
    if (frameworks.length === 0) {
      return [];
    }
    // Проверяем тип первого элемента для определения типа массива
    if (typeof frameworks[0] === 'string') {
      return frameworks.map(name => ({
        name,
        enabled: true,
        type: 'unit',
      }));
    }
    return frameworks;
  }
  /**
   * Определяет директории для поиска тестовых файлов
   * @param project Проект для анализа
   * @param frameworks Информация о фреймворках
   * @returns Массив директорий для поиска
   */
  async getSearchDirectories(project, frameworks) {
    const directories = new Set();
    // Добавляем стандартные директории
    constants_1.TEST_DIRECTORIES.forEach(dir => directories.add(dir));
    // Анализируем конфигурации фреймворков для дополнительных директорий
    for (const framework of frameworks) {
      if (framework.configPath) {
        const additionalDirs = await this.extractTestDirsFromConfig(framework.configPath);
        additionalDirs.forEach(dir => directories.add(dir));
      }
    }
    // Проверяем package.json на предмет кастомных директорий
    const packageJsonDirs = await this.extractTestDirsFromPackageJson(project.path);
    packageJsonDirs.forEach(dir => directories.add(dir));
    return Array.from(directories);
  }
  /**
   * Сканирует директорию в поисках тестовых файлов
   * @param dirPath Путь к директории
   * @param projectPath Корневой путь проекта
   * @param onlyTestPatterns Искать только файлы с тестовыми паттернами
   * @returns Найденные тестовые файлы
   */
  async scanDirectory(dirPath, projectPath, onlyTestPatterns = false) {
    const testFiles = [];
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          // Рекурсивно сканируем поддиректории
          if (!this.shouldSkipDirectory(entry.name)) {
            const subFiles = await this.scanDirectory(fullPath, projectPath, onlyTestPatterns);
            testFiles.push(...subFiles);
          }
        } else if (entry.isFile()) {
          // Проверяем, является ли файл тестовым
          if (this.isTestFile(entry.name, onlyTestPatterns)) {
            const testFile = await this.createTestFileInfo(fullPath, projectPath);
            if (testFile) {
              testFiles.push(testFile);
            }
          }
        }
      }
    } catch (error) {
      console.error(
        `Error scanning directory ${dirPath}: ${error instanceof Error ? error.message : error}`
      );
    }
    return testFiles;
  }
  /**
   * Проверяет, является ли файл тестовым
   * @param fileName Имя файла
   * @param strictMode Использовать только строгие паттерны
   * @returns true, если файл является тестовым
   */
  isTestFile(fileName, strictMode = false) {
    // В строгом режиме ищем только файлы с явными тестовыми паттернами
    if (strictMode) {
      return constants_1.TEST_FILE_PATTERNS.some(pattern => pattern.test(fileName));
    }
    // В обычном режиме также проверяем файлы в тестовых директориях
    return (
      constants_1.TEST_FILE_PATTERNS.some(pattern => pattern.test(fileName)) ||
      fileName.toLowerCase().includes('test') ||
      fileName.toLowerCase().includes('spec')
    );
  }
  /**
   * Создает объект с информацией о тестовом файле
   * @param filePath Абсолютный путь к файлу
   * @param projectPath Корневой путь проекта
   * @returns Информация о тестовом файле
   */
  async createTestFileInfo(filePath, projectPath) {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(projectPath, filePath);
      const testFileInfo = {
        path: filePath,
        relativePath,
        type: this.determineTestType(relativePath),
        size: stats.size,
        estimatedTestCount: await this.estimateTestCount(filePath),
        estimatedTests: await this.estimateTestCount(filePath),
        patterns: this.extractTestPatterns(filePath),
      };
      return testFileInfo;
    } catch (error) {
      console.error(
        `Error creating test file info for ${filePath}: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }
  /**
   * Определяет тип теста на основе пути к файлу
   * @param relativePath Относительный путь к файлу
   * @returns Тип теста
   */
  determineTestType(relativePath) {
    const lowerPath = relativePath.toLowerCase();
    if (lowerPath.includes('e2e') || lowerPath.includes('end-to-end')) {
      return 'e2e';
    }
    if (lowerPath.includes('integration') || lowerPath.includes('int')) {
      return 'integration';
    }
    if (
      lowerPath.includes('performance') ||
      lowerPath.includes('perf') ||
      lowerPath.includes('benchmark')
    ) {
      return 'performance';
    }
    // По умолчанию считаем unit тестом
    return 'unit';
  }
  /**
   * Оценивает количество тестов в файле
   * @param filePath Путь к тестовому файлу
   * @returns Предполагаемое количество тестов
   */
  async estimateTestCount(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      // Простая эвристика: считаем вхождения it(), test(), describe()
      const testPatterns = [/\bit\s*\(/g, /\btest\s*\(/g, /\bdescribe\s*\(/g, /\bcontext\s*\(/g];
      let testCount = 0;
      for (const pattern of testPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          testCount += matches.length;
        }
      }
      // Минимум 1 тест на файл
      return Math.max(testCount, 1);
    } catch (error) {
      console.error(
        `Error estimating test count for ${filePath}: ${error instanceof Error ? error.message : error}`
      );
      return 1;
    }
  }
  /**
   * Извлекает паттерны тестов из файла
   * @param filePath Путь к тестовому файлу
   * @returns Массив найденных паттернов
   */
  extractTestPatterns(filePath) {
    const patterns = [];
    const fileName = path.basename(filePath);
    // Определяем паттерны по имени файла
    if (fileName.includes('.test.')) {
      patterns.push('test');
    }
    if (fileName.includes('.spec.')) {
      patterns.push('spec');
    }
    if (fileName.includes('e2e')) {
      patterns.push('e2e');
    }
    if (fileName.includes('integration')) {
      patterns.push('integration');
    }
    // Определяем фреймворк по структуре директории
    if (filePath.includes('vitest') || filePath.includes('vite')) {
      patterns.push('vitest');
    }
    if (filePath.includes('jest')) {
      patterns.push('jest');
    }
    if (filePath.includes('cypress')) {
      patterns.push('cypress');
    }
    if (filePath.includes('playwright')) {
      patterns.push('playwright');
    }
    return patterns.length > 0 ? patterns : ['unknown'];
  }
  /**
   * Извлекает тестовые директории из конфигурации фреймворка
   * @param configPath Путь к конфигурационному файлу
   * @returns Массив тестовых директорий
   */
  async extractTestDirsFromConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const directories = [];
      // Простая эвристика для извлечения директорий из конфигурации
      // В реальной реализации можно использовать более сложный парсинг
      // Ищем паттерны типа testDir: 'path' или include: ['path1', 'path2']
      const testDirMatch = content.match(/testDir\s*:\s*['"`]([^'"`]+)['"`]/);
      if (testDirMatch) {
        directories.push(testDirMatch[1]);
      }
      const includeMatch = content.match(/include\s*:\s*\[(.*?)\]/s);
      if (includeMatch) {
        const includes = includeMatch[1].match(/['"`]([^'"`]+)['"`]/g);
        if (includes) {
          includes.forEach(include => {
            const dir = include.replace(/['"`]/g, '').split('/')[0];
            if (dir && !directories.includes(dir)) {
              directories.push(dir);
            }
          });
        }
      }
      return directories;
    } catch (error) {
      console.error(
        `Error extracting test dirs from config ${configPath}: ${error instanceof Error ? error.message : error}`
      );
      return [];
    }
  }
  /**
   * Извлекает тестовые директории из package.json
   * @param projectPath Путь к проекту
   * @returns Массив тестовых директорий
   */
  async extractTestDirsFromPackageJson(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!(await this.fileExists(packageJsonPath))) {
        return [];
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const directories = [];
      // Проверяем jest конфигурацию
      if (packageJson.jest && packageJson.jest.testMatch) {
        const testMatch = Array.isArray(packageJson.jest.testMatch)
          ? packageJson.jest.testMatch
          : [packageJson.jest.testMatch];
        testMatch.forEach(pattern => {
          const dir = pattern.split('/')[0];
          if (dir && dir !== '**' && !directories.includes(dir)) {
            directories.push(dir);
          }
        });
      }
      return directories;
    } catch (error) {
      console.error(
        `Error extracting test dirs from package.json: ${error instanceof Error ? error.message : error}`
      );
      return [];
    }
  }
  /**
   * Удаляет дубликаты из массива тестовых файлов
   * @param testFiles Массив тестовых файлов
   * @returns Массив без дубликатов
   */
  removeDuplicates(testFiles) {
    const seen = new Set();
    return testFiles.filter(file => {
      if (seen.has(file.path)) {
        return false;
      }
      seen.add(file.path);
      return true;
    });
  }
  /**
   * Проверяет, нужно ли пропустить директорию при сканировании
   * @param dirName Имя директории
   * @returns true, если директорию нужно пропустить
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }
  /**
   * Находит расширенную информацию о тестовых файлах
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns Массив расширенной информации о тестовых файлах
   */
  async findExtendedTestFiles(project, frameworks = []) {
    const basicFiles = await this.findTestFiles(project, frameworks);
    const extendedFiles = [];
    for (const file of basicFiles) {
      try {
        const stats = await fs.stat(file.path);
        const content = await fs.readFile(file.path, 'utf-8');
        const testCount = this.countTestsInFile(content, file.framework);
        const extendedFile = {
          ...file,
          size: stats.size,
          lastModified: stats.mtime,
          testCount,
          status: 'unknown',
        };
        extendedFiles.push(extendedFile);
      } catch (error) {
        // Если не удается получить расширенную информацию, используем базовую
        extendedFiles.push({
          ...file,
          size: 0,
          lastModified: new Date(),
          testCount: 0,
          status: 'unknown',
        });
      }
    }
    return extendedFiles;
  }
  /**
   * Получает статистику по тестовым файлам
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns Статистика тестовых файлов
   */
  async getTestFileStats(project, frameworks = []) {
    const files = await this.findExtendedTestFiles(project, frameworks);
    const stats = {
      totalFiles: files.length,
      totalTests: files.reduce((sum, file) => sum + file.testCount, 0),
      byFramework: {},
      byDirectory: {},
      averageTestsPerFile: 0,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };
    // Статистика по фреймворкам
    files.forEach(file => {
      const framework = file.framework || 'unknown';
      stats.byFramework[framework] = (stats.byFramework[framework] || 0) + 1;
    });
    // Статистика по директориям
    files.forEach(file => {
      const dir = path.dirname(path.relative(project.path, file.path));
      stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
    });
    // Средние значения
    stats.averageTestsPerFile = files.length > 0 ? stats.totalTests / files.length : 0;
    return stats;
  }
  /**
   * Проверяет достаточность тестового покрытия
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns CheckResult с результатом проверки
   */
  async checkTestCoverage(project, frameworks = []) {
    const stats = await this.getTestFileStats(project, frameworks);
    return ResultBuilder_1.ResultBuilder.threshold(
      'test-coverage-check',
      'Проверка тестового покрытия',
      stats.totalTests,
      constants_1.TESTING_THRESHOLDS.MIN_UNIT_TESTS,
      true
    )
      .details({
        totalFiles: stats.totalFiles,
        totalTests: stats.totalTests,
        averageTestsPerFile: Math.round(stats.averageTestsPerFile * 100) / 100,
        byFramework: stats.byFramework,
        hasTests: stats.totalFiles > 0,
      })
      .build();
  }
  /**
   * Находит файлы, для которых отсутствуют тесты
   * @param project Проект для анализа
   * @returns Массив файлов без тестов
   */
  async findFilesWithoutTests(project) {
    const filesWithoutTests = [];
    try {
      // Находим все .ts и .js файлы в src
      const sourceFiles = await this.findSourceFiles(project);
      const testFiles = await this.findTestFiles(project);
      // Создаем маппинг тестовых файлов
      const testFileMap = new Set();
      testFiles.forEach(testFile => {
        const possibleSourceFiles = this.getPossibleSourceFiles(testFile.path);
        possibleSourceFiles.forEach(sourceFile => testFileMap.add(sourceFile));
      });
      // Проверяем какие source файлы не имеют тестов
      for (const sourceFile of sourceFiles) {
        if (!testFileMap.has(sourceFile)) {
          filesWithoutTests.push(sourceFile);
        }
      }
    } catch (error) {
      console.warn('Ошибка при поиске файлов без тестов:', error);
    }
    return filesWithoutTests;
  }
  /**
   * Создает CheckResult для анализа структуры тестов
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns CheckResult с результатом анализа структуры
   */
  async analyzeTestStructure(project, frameworks = []) {
    const stats = await this.getTestFileStats(project, frameworks);
    const filesWithoutTests = await this.findFilesWithoutTests(project);
    const hasGoodStructure =
      stats.totalFiles > 0 &&
      Object.keys(stats.byFramework).length > 0 &&
      stats.averageTestsPerFile >= 1;
    return ResultBuilder_1.ResultBuilder.threshold(
      'test-structure',
      'Структура тестов',
      stats.totalFiles,
      1
    )
      .message(
        hasGoodStructure
          ? `Обнаружено ${stats.totalFiles} тестовых файлов с хорошей структурой`
          : `Найдено только ${stats.totalFiles} тестовых файлов, требуется улучшение структуры`
      )
      .details({
        testFileStats: stats,
        filesWithoutTests: filesWithoutTests.slice(0, 10), // Ограничиваем список
        totalFilesWithoutTests: filesWithoutTests.length,
        structureScore: this.calculateStructureScore(stats, filesWithoutTests.length),
      })
      .recommendations(this.generateStructureRecommendations(stats, filesWithoutTests))
      .build();
  }
  /**
   * Подсчитывает количество тестов в файле
   * @param content Содержимое файла
   * @param framework Тестовый фреймворк
   * @returns Количество тестов
   */
  countTestsInFile(content, framework) {
    let testCount = 0;
    // Универсальные паттерны для тестов
    const testPatterns = [
      /\b(test|it)\s*\(/g,
      /\b(describe|suite)\s*\(/g,
      /\@Test\s/g, // Для Java/TypeScript декораторов
    ];
    // Специфичные паттерны для фреймворков
    if (framework === 'jest' || framework === 'vitest') {
      testPatterns.push(/\b(beforeEach|afterEach|beforeAll|afterAll)\s*\(/g);
    }
    testPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        testCount += matches.length;
      }
    });
    return testCount;
  }
  /**
   * Находит исходные файлы в проекте
   * @param project Проект
   * @returns Массив путей к исходным файлам
   */
  async findSourceFiles(project) {
    const sourceFiles = [];
    const srcDir = path.join(project.path, 'src');
    if (await this.directoryExists(srcDir)) {
      await this.scanForSourceFiles(srcDir, sourceFiles);
    }
    return sourceFiles;
  }
  /**
   * Рекурсивно сканирует директорию для поиска исходных файлов
   * @param dirPath Путь к директории
   * @param sourceFiles Массив для накопления результатов
   */
  async scanForSourceFiles(dirPath, sourceFiles) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.scanForSourceFiles(fullPath, sourceFiles);
        } else if (entry.isFile() && this.isSourceFile(entry.name)) {
          sourceFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Игнорируем ошибки доступа к директориям
    }
  }
  /**
   * Проверяет, является ли файл исходным файлом
   * @param fileName Имя файла
   * @returns true, если это исходный файл
   */
  isSourceFile(fileName) {
    const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx', '.vue', '.svelte'];
    const testPatterns = ['.test.', '.spec.', '__tests__'];
    // Файл должен иметь исходное расширение
    const hasSourceExtension = sourceExtensions.some(ext => fileName.endsWith(ext));
    if (!hasSourceExtension) return false;
    // Файл не должен быть тестовым
    const isTestFile = testPatterns.some(pattern => fileName.includes(pattern));
    return !isTestFile;
  }
  /**
   * Получает возможные исходные файлы для тестового файла
   * @param testFilePath Путь к тестовому файлу
   * @returns Массив возможных путей к исходным файлам
   */
  getPossibleSourceFiles(testFilePath) {
    const possiblePaths = [];
    const dir = path.dirname(testFilePath);
    const fileName = path.basename(testFilePath);
    // Убираем тестовые суффиксы
    let baseName = fileName
      .replace(/\.test\.(ts|js|tsx|jsx)$/, '.$1')
      .replace(/\.spec\.(ts|js|tsx|jsx)$/, '.$1');
    // Добавляем возможные пути
    possiblePaths.push(path.join(dir, baseName));
    // Если тест в __tests__, ищем файл на уровень выше
    if (dir.endsWith('__tests__')) {
      const parentDir = path.dirname(dir);
      possiblePaths.push(path.join(parentDir, baseName));
    }
    // Если тест в tests/, ищем в src/
    if (dir.includes('tests')) {
      const srcPath = dir.replace(/tests?/, 'src');
      possiblePaths.push(path.join(srcPath, baseName));
    }
    return possiblePaths;
  }
  /**
   * Вычисляет оценку структуры тестов
   * @param stats Статистика тестовых файлов
   * @param filesWithoutTestsCount Количество файлов без тестов
   * @returns Оценка от 0 до 1
   */
  calculateStructureScore(stats, filesWithoutTestsCount) {
    let score = 0;
    // Базовая оценка за наличие тестов
    if (stats.totalFiles > 0) score += 0.3;
    // Оценка за достаточное количество тестов
    if (stats.totalTests >= constants_1.TESTING_THRESHOLDS.MIN_UNIT_TESTS) score += 0.3;
    // Оценка за использование фреймворков
    if (Object.keys(stats.byFramework).length > 0) score += 0.2;
    // Оценка за покрытие файлов
    const coverageRatio =
      filesWithoutTestsCount === 0
        ? 1
        : Math.max(0, 1 - filesWithoutTestsCount / (stats.totalFiles + filesWithoutTestsCount));
    score += coverageRatio * 0.2;
    return Math.min(1, score);
  }
  /**
   * Генерирует рекомендации по улучшению покрытия
   * @param stats Статистика тестовых файлов
   * @returns Массив рекомендаций
   */
  generateCoverageRecommendations(stats) {
    const recommendations = [];
    if (stats.totalFiles === 0) {
      recommendations.push('Создайте первые тестовые файлы в директории tests/ или src/__tests__/');
    }
    if (stats.totalTests < constants_1.TESTING_THRESHOLDS.MIN_UNIT_TESTS) {
      recommendations.push(
        `Добавьте больше тестов (рекомендуется минимум ${constants_1.TESTING_THRESHOLDS.MIN_UNIT_TESTS})`
      );
    }
    if (stats.averageTestsPerFile < 2) {
      recommendations.push('Увеличьте количество тестов в файлах (рекомендуется 2+ теста на файл)');
    }
    if (Object.keys(stats.byFramework).length === 0) {
      recommendations.push('Настройте тестовый фреймворк (Jest, Vitest, или другой)');
    }
    return recommendations;
  }
  /**
   * Генерирует рекомендации по улучшению структуры
   * @param stats Статистика тестовых файлов
   * @param filesWithoutTests Файлы без тестов
   * @returns Массив рекомендаций
   */
  generateStructureRecommendations(stats, filesWithoutTests) {
    const recommendations = [];
    if (filesWithoutTests.length > 0) {
      recommendations.push(`Создайте тесты для ${filesWithoutTests.length} файлов без покрытия`);
    }
    if (Object.keys(stats.byDirectory).length === 1) {
      recommendations.push('Рассмотрите организацию тестов по модулям или компонентам');
    }
    if (stats.averageTestsPerFile > 10) {
      recommendations.push('Рассмотрите разделение больших тестовых файлов на меньшие');
    }
    return recommendations;
  }
  /**
   * Проверяет существование файла
   * @param filePath Путь к файлу
   * @returns true, если файл существует
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Проверяет существование директории
   * @param dirPath Путь к директории
   * @returns true, если директория существует
   */
  async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
exports.TestFileFinder = TestFileFinder;
//# sourceMappingURL=TestFileFinder.js.map
