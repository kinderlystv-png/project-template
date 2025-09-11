'use strict';
/**
 * Адаптер JestChecker для интеграции с AnalysisOrchestrator
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
exports.JestCheckerAdapter = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const checker_js_1 = require('../../../core/checker.js');
/**
 * Адаптер для Jest анализа, совместимый с AnalysisOrchestrator
 */
class JestCheckerAdapter extends checker_js_1.BaseChecker {
  name = 'jest-checker';
  category = 'quality';
  description = 'Анализирует конфигурацию и использование Jest фреймворка';
  /**
   * Выполняет проверку Jest конфигурации
   */
  async check(context) {
    const projectPath = context.projectPath;
    try {
      // 1. Проверяем наличие Jest в зависимостях
      const hasJest = await this.hasJestDependency(projectPath);
      if (!hasJest) {
        return this.createResult(
          false,
          0,
          'Jest не найден в зависимостях проекта',
          { checked: 'package.json', found: false },
          ['Выполните: npm install -D jest', 'Для TypeScript: npm install -D @types/jest']
        );
      }
      // 2. Проверяем конфигурацию Jest
      const hasConfig = await this.hasJestConfig(projectPath);
      if (!hasConfig) {
        return this.createResult(
          false,
          30,
          'Конфигурация Jest не найдена',
          { configFiles: [], found: false },
          ['Создайте jest.config.js или добавьте секцию jest в package.json']
        );
      }
      // 3. Проверяем тестовые файлы
      const testFiles = await this.findTestFiles(projectPath);
      if (testFiles.length === 0) {
        return this.createResult(
          false,
          40,
          'Тестовые файлы для Jest не найдены',
          { fileCount: 0, searchPatterns: ['*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts'] },
          ['Создайте тестовые файлы с расширением .test.js, .spec.js или их TypeScript аналоги']
        );
      }
      // 4. Проверяем скрипты в package.json
      const hasTestScript = await this.hasTestScript(projectPath);
      // 5. Проверяем покрытие кода
      const hasCoverage = await this.hasCoverageConfig(projectPath);
      // 6. Вычисляем итоговую оценку
      let score = 70; // Базовая оценка за наличие Jest, конфигурации и тестов
      const details = {
        hasJest: true,
        hasConfig: true,
        testFileCount: testFiles.length,
        hasTestScript,
        hasCoverage,
        testFiles: testFiles.slice(0, 5), // Первые 5 файлов
      };
      const recommendations = [];
      if (hasTestScript) {
        score += 10;
      } else {
        recommendations.push('Добавьте test скрипт в package.json: "test": "jest"');
      }
      if (hasCoverage) {
        score += 10;
      } else {
        recommendations.push('Настройте coverage в Jest для отслеживания покрытия кода');
      }
      // Бонус за количество тестов
      if (testFiles.length >= 5) {
        score += 5;
      }
      if (testFiles.length >= 10) {
        score += 5;
      }
      return this.createResult(
        true,
        Math.min(score, 100),
        `Jest настроен (найдено ${testFiles.length} тестовых файлов)`,
        details,
        recommendations
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Jest',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте структуру проекта и конфигурацию Jest']
      );
    }
  }
  /**
   * Проверяет наличие Jest в зависимостях
   */
  async hasJestDependency(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!this.fileExists(packageJsonPath)) {
        return false;
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };
      return 'jest' in allDependencies;
    } catch {
      return false;
    }
  }
  /**
   * Проверяет наличие конфигурации Jest
   */
  async hasJestConfig(projectPath) {
    const configFiles = ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.json'];
    // Проверяем отдельные конфигурационные файлы
    for (const configFile of configFiles) {
      if (this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
    }
    // Проверяем секцию jest в package.json
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        if (packageJson.jest) {
          return true;
        }
      }
    } catch {
      // Игнорируем ошибки
    }
    return false;
  }
  /**
   * Находит тестовые файлы
   */
  async findTestFiles(projectPath) {
    const testFiles = [];
    try {
      const searchDirs = ['src', 'test', 'tests', '__tests__', '.'];
      for (const dir of searchDirs) {
        const fullPath = path.join(projectPath, dir);
        if (this.fileExists(fullPath)) {
          const files = await this.findFilesRecursive(fullPath, [
            '.test.js',
            '.spec.js',
            '.test.ts',
            '.spec.ts',
            '.test.jsx',
            '.spec.jsx',
            '.test.tsx',
            '.spec.tsx',
          ]);
          testFiles.push(...files);
        }
      }
      return [...new Set(testFiles)]; // Убираем дубликаты
    } catch {
      return [];
    }
  }
  /**
   * Рекурсивно ищет файлы по расширениям
   */
  async findFilesRecursive(dir, extensions) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findFilesRecursive(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const hasExtension = extensions.some(ext => entry.name.endsWith(ext));
          if (hasExtension) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа к папкам
    }
    return files;
  }
  /**
   * Проверяет наличие test скрипта
   */
  async hasTestScript(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!this.fileExists(packageJsonPath)) {
        return false;
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      return !!(packageJson.scripts?.test && packageJson.scripts.test.includes('jest'));
    } catch {
      return false;
    }
  }
  /**
   * Проверяет настройку покрытия кода
   */
  async hasCoverageConfig(projectPath) {
    try {
      // Проверяем отдельные конфигурационные файлы
      const configFiles = ['jest.config.js', 'jest.config.ts'];
      for (const configFile of configFiles) {
        const configPath = path.join(projectPath, configFile);
        if (this.fileExists(configPath)) {
          try {
            const content = await fs.readFile(configPath, 'utf8');
            if (content.includes('collectCoverage') || content.includes('coverageThreshold')) {
              return true;
            }
          } catch {
            // Игнорируем ошибки чтения
          }
        }
      }
      // Проверяем package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        if (packageJson.jest?.collectCoverage || packageJson.jest?.coverageThreshold) {
          return true;
        }
        // Проверяем скрипты на coverage
        if (
          packageJson.scripts?.['test:coverage'] ||
          packageJson.scripts?.coverage ||
          (packageJson.scripts?.test && packageJson.scripts.test.includes('--coverage'))
        ) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}
exports.JestCheckerAdapter = JestCheckerAdapter;
//# sourceMappingURL=JestCheckerAdapter.js.map
