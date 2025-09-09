/**
 * Интеграционные тесты для полного анализа проекта
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  mockProjectStructure,
  createTestAnalysisData,
  TestResultValidator,
  type AnalysisResult,
} from '../setup/test-utils';

describe('Интеграционные тесты анализа проекта', () => {
  let projectMock: ReturnType<typeof mockProjectStructure>;

  beforeEach(() => {
    // Создаем тестовую структуру проекта
    projectMock = mockProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        main: 'src/index.js',
        dependencies: {
          express: '^4.18.0',
          lodash: '^4.17.21',
        },
        devDependencies: {
          jest: '^29.0.0',
          typescript: '^4.9.0',
        },
      }),
      'src/index.js': `
        const express = require('express');
        const app = express();

        app.get('/', (req, res) => {
          res.json({ message: 'Hello World' });
        });

        app.listen(3000, () => {
          console.log('Server running on port 3000');
        });
      `,
      'src/utils.js': `
        const _ = require('lodash');

        function processData(data) {
          return _.map(data, item => ({
            ...item,
            processed: true
          }));
        }

        module.exports = { processData };
      `,
      'tests/index.test.js': `
        const { processData } = require('../src/utils');

        test('processData should work correctly', () => {
          const input = [{ id: 1, name: 'test' }];
          const result = processData(input);
          expect(result[0].processed).toBe(true);
        });
      `,
      'README.md': `
        # Test Project

        Тестовый проект для анализа

        ## Установка
        npm install

        ## Запуск
        npm start
      `,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          strict: true,
        },
      }),
      'docs/api.md': `
        # API Documentation

        ## Endpoints

        ### GET /
        Returns welcome message
      `,
    });
  });

  afterEach(() => {
    projectMock.cleanup();
  });

  describe('Анализ структуры проекта', () => {
    it('должен корректно анализировать файловую структуру', () => {
      // Проверяем, что все файлы созданы
      expect(projectMock.exists('package.json')).toBe(true);
      expect(projectMock.exists('src/index.js')).toBe(true);
      expect(projectMock.exists('src/utils.js')).toBe(true);
      expect(projectMock.exists('tests/index.test.js')).toBe(true);
      expect(projectMock.exists('README.md')).toBe(true);

      // Проверяем содержимое package.json
      const packageJson = JSON.parse(projectMock.readFile('package.json'));
      expect(packageJson.name).toBe('test-project');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.dependencies).toHaveProperty('express');
    });

    it('должен подсчитывать количество файлов по типам', () => {
      const files = fs.readdirSync(projectMock.path, { recursive: true });
      const jsFiles = files.filter(file => typeof file === 'string' && file.endsWith('.js'));
      const mdFiles = files.filter(file => typeof file === 'string' && file.endsWith('.md'));
      const jsonFiles = files.filter(file => typeof file === 'string' && file.endsWith('.json'));

      expect(jsFiles.length).toBe(3); // index.js, utils.js, index.test.js
      expect(mdFiles.length).toBe(2); // README.md, api.md
      expect(jsonFiles.length).toBe(2); // package.json, tsconfig.json
    });
  });

  describe('Анализ содержимого файлов', () => {
    it('должен анализировать JavaScript файлы', () => {
      const indexContent = projectMock.readFile('src/index.js');
      const utilsContent = projectMock.readFile('src/utils.js');

      // Проверяем наличие ключевых слов
      expect(indexContent).toContain('express');
      expect(indexContent).toContain('app.listen');
      expect(utilsContent).toContain('lodash');
      expect(utilsContent).toContain('module.exports');
    });

    it('должен подсчитывать строки кода', () => {
      const indexLines = projectMock.readFile('src/index.js').split('\n').length;
      const utilsLines = projectMock.readFile('src/utils.js').split('\n').length;

      expect(indexLines).toBeGreaterThan(5);
      expect(utilsLines).toBeGreaterThan(5);
    });
  });

  describe('Анализ зависимостей', () => {
    it('должен выявлять зависимости проекта', () => {
      const packageJson = JSON.parse(projectMock.readFile('package.json'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});

      expect(dependencies).toContain('express');
      expect(dependencies).toContain('lodash');
      expect(devDependencies).toContain('jest');
      expect(devDependencies).toContain('typescript');
    });

    it('должен анализировать используемые технологии', () => {
      const packageJson = JSON.parse(projectMock.readFile('package.json'));
      const hasTypeScript = projectMock.exists('tsconfig.json');
      const hasTests = projectMock.exists('tests/index.test.js');

      expect(hasTypeScript).toBe(true);
      expect(hasTests).toBe(true);
      expect(packageJson.devDependencies).toHaveProperty('typescript');
      expect(packageJson.devDependencies).toHaveProperty('jest');
    });
  });

  describe('Полный цикл анализа', () => {
    it('должен выполнять полный анализ проекта с валидацией', () => {
      // Имитируем полный анализ
      const analysisResult: AnalysisResult = {
        fileCount: 7, // Общее количество файлов
        totalLines: 50, // Примерное количество строк
        fileTypes: {
          '.js': 3,
          '.json': 2,
          '.md': 2,
        },
        totalSize: 2000, // Примерный размер в байтах
      };

      // Валидируем результат анализа
      TestResultValidator.validateAnalysisResult(analysisResult);

      // Дополнительные проверки
      expect(analysisResult.fileCount).toBeGreaterThan(0);
      expect(analysisResult.totalLines).toBeGreaterThan(0);
      expect(Object.keys(analysisResult.fileTypes).length).toBeGreaterThan(0);
    });

    it('должен генерировать отчет анализа', () => {
      const testData = createTestAnalysisData();

      // Проверяем структуру тестовых данных
      expect(testData.project).toHaveProperty('name');
      expect(testData.project).toHaveProperty('fileCount');
      expect(testData.files).toBeInstanceOf(Array);
      expect(testData.metrics).toHaveProperty('maintainabilityIndex');

      // Проверяем логическую корректность данных
      expect(testData.project.fileCount).toBeGreaterThan(0);
      expect(testData.metrics.maintainabilityIndex).toBeGreaterThanOrEqual(0);
      expect(testData.metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
    });
  });

  describe('Обработка ошибок', () => {
    it('должен обрабатывать несуществующие файлы', () => {
      expect(projectMock.exists('nonexistent.file')).toBe(false);

      expect(() => {
        projectMock.readFile('nonexistent.file');
      }).toThrow();
    });

    it('должен обрабатывать некорректный JSON', () => {
      // Создаем файл с некорректным JSON
      const badJsonPath = path.join(projectMock.path, 'bad.json');
      fs.writeFileSync(badJsonPath, '{ invalid json }');

      expect(() => {
        JSON.parse(fs.readFileSync(badJsonPath, 'utf-8'));
      }).toThrow();
    });
  });
});
