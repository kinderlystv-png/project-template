'use strict';
/**
 * Адаптер VitestChecker для интеграции с AnalysisOrchestrator
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
exports.VitestCheckerAdapter = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const checker_js_1 = require('../../../core/checker.js');
/**
 * Адаптер для Vitest анализа, совместимый с AnalysisOrchestrator
 */
class VitestCheckerAdapter extends checker_js_1.BaseChecker {
  name = 'vitest-checker';
  category = 'quality';
  description = 'Анализирует конфигурацию и использование Vitest фреймворка';
  /**
   * Выполняет проверку Vitest конфигурации
   */
  async check(context) {
    const projectPath = context.projectPath;
    try {
      // 1. Проверяем наличие Vitest в зависимостях
      const hasVitest = await this.hasVitestDependency(projectPath);
      if (!hasVitest) {
        return this.createResult(
          false,
          0,
          'Vitest не найден в зависимостях проекта',
          { checked: 'package.json', found: false },
          ['Выполните: npm install -D vitest']
        );
      }
      // 2. Проверяем конфигурацию Vitest
      const hasConfig = await this.hasVitestConfig(projectPath);
      if (!hasConfig) {
        return this.createResult(
          false,
          30,
          'Конфигурация Vitest не найдена',
          { configFiles: [], found: false },
          ['Создайте vitest.config.ts для настройки тестовой среды']
        );
      }
      // 3. Проверяем тестовые файлы
      const testFiles = await this.findTestFiles(projectPath);
      if (testFiles.length === 0) {
        return this.createResult(
          false,
          40,
          'Тестовые файлы для Vitest не найдены',
          { fileCount: 0, searchPatterns: ['*.test.ts', '*.spec.ts'] },
          ['Создайте тестовые файлы с расширением .test.ts или .spec.ts']
        );
      }
      // 4. Проверяем скрипты в package.json
      const hasTestScript = await this.hasTestScript(projectPath);
      let score = 70;
      const details = {
        hasVitest: true,
        hasConfig: true,
        testFileCount: testFiles.length,
        hasTestScript,
        testFiles: testFiles.slice(0, 5), // Первые 5 файлов
      };
      if (hasTestScript) {
        score = 90;
      }
      return this.createResult(
        true,
        score,
        `Vitest настроен (найдено ${testFiles.length} тестовых файлов)`,
        details,
        hasTestScript ? [] : ['Добавьте test скрипт в package.json: "test": "vitest"']
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Vitest',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте структуру проекта и конфигурацию Vitest']
      );
    }
  }
  /**
   * Проверяет наличие Vitest в зависимостях
   */
  async hasVitestDependency(projectPath) {
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
      return 'vitest' in allDependencies;
    } catch {
      return false;
    }
  }
  /**
   * Проверяет наличие конфигурации Vitest
   */
  async hasVitestConfig(projectPath) {
    const configFiles = [
      'vitest.config.ts',
      'vitest.config.js',
      'vitest.config.mts',
      'vitest.config.mjs',
      'vite.config.ts',
      'vite.config.js',
    ];
    for (const configFile of configFiles) {
      if (this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
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
            '.test.ts',
            '.spec.ts',
            '.test.js',
            '.spec.js',
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
      return !!(packageJson.scripts?.test && packageJson.scripts.test.includes('vitest'));
    } catch {
      return false;
    }
  }
}
exports.VitestCheckerAdapter = VitestCheckerAdapter;
//# sourceMappingURL=VitestCheckerAdapter.js.map
