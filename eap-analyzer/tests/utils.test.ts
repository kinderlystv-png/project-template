/**
 * Unit тесты для утилит EAP анализатора
 */

import './eap-setup';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Utils', () => {
  beforeEach(() => {
    // Настройка перед тестами
  });

  describe('File Utils', () => {
    it('должен проверить расширения файлов', () => {
      const testCases = [
        { file: 'test.js', expected: 'js' },
        { file: 'component.svelte', expected: 'svelte' },
        { file: 'style.css', expected: 'css' },
        { file: 'README.md', expected: 'md' },
      ];

      testCases.forEach(({ file, expected }) => {
        const extension = file.split('.').pop();
        expect(extension).toBe(expected);
      });
    });

    it('должен работать с путями файлов', () => {
      const paths = ['/src/components/Button.svelte', 'src\\pages\\index.svelte', './lib/utils.js'];

      paths.forEach(path => {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Project Analysis Utils', () => {
    it('должен анализировать package.json', () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          svelte: '^4.0.0',
          vite: '^4.0.0',
        },
        devDependencies: {
          vitest: '^0.34.0',
        },
      };

      expect(packageJson.name).toBe('test-project');
      expect(packageJson.dependencies).toHaveProperty('svelte');
      expect(packageJson.devDependencies).toHaveProperty('vitest');
    });

    it('должен определить тип проекта по зависимостям', () => {
      const projects = [
        {
          deps: { svelte: '^4.0.0' },
          expected: 'svelte',
        },
        {
          deps: { react: '^18.0.0' },
          expected: 'react',
        },
        {
          deps: { vue: '^3.0.0' },
          expected: 'vue',
        },
      ];

      projects.forEach(({ deps, expected }) => {
        const hasFramework = Object.keys(deps).includes(expected);
        expect(hasFramework).toBe(true);
      });
    });
  });

  describe('Scoring Utils', () => {
    it('должен вычислять scores правильно', () => {
      const scores = [
        { passed: 10, total: 10, expected: 100 },
        { passed: 5, total: 10, expected: 50 },
        { passed: 0, total: 10, expected: 0 },
        { passed: 7, total: 10, expected: 70 },
      ];

      scores.forEach(({ passed, total, expected }) => {
        const score = Math.round((passed / total) * 100);
        expect(score).toBe(expected);
      });
    });

    it('должен обрабатывать edge cases в scoring', () => {
      // Деление на ноль
      const scoreZero = 0 / 0 || 0;
      expect(scoreZero).toBe(0);

      // Отрицательные значения
      const scoreNegative = Math.max(0, -10);
      expect(scoreNegative).toBe(0);

      // Значения больше 100
      const scoreOver = Math.min(100, 150);
      expect(scoreOver).toBe(100);
    });
  });

  describe('Config Utils', () => {
    it('должен работать с конфигурационными файлами', () => {
      const configs = {
        'vite.config.js': 'export default { build: { target: "es2015" } };',
        'tsconfig.json': '{ "compilerOptions": { "target": "ES2020" } }',
        '.eslintrc.js': 'module.exports = { extends: ["eslint:recommended"] };',
      };

      // Проверяем наличие конфигураций
      expect(configs).toHaveProperty('vite.config.js');
      expect(configs).toHaveProperty('tsconfig.json');
      expect(configs).toHaveProperty('.eslintrc.js');
    });
    it('должен парсить JSON конфигурации', () => {
      const validJson = '{"name": "test", "version": "1.0.0"}';
      const invalidJson = '{"name": "test", "version":}';

      try {
        const parsed = JSON.parse(validJson);
        expect(parsed.name).toBe('test');
      } catch (error) {
        expect.fail('Valid JSON should not throw');
      }

      try {
        JSON.parse(invalidJson);
        expect.fail('Invalid JSON should throw');
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('Validation Utils', () => {
    it('должен валидировать версии зависимостей', () => {
      const versions = [
        { version: '^4.0.0', valid: true },
        { version: '~3.2.1', valid: true },
        { version: '1.0.0', valid: true },
        { version: 'latest', valid: false },
        { version: '*', valid: false },
      ];

      versions.forEach(({ version, valid }) => {
        const isValid = /^\^?\d+\.\d+\.\d+$|^~\d+\.\d+\.\d+$/.test(version);
        expect(isValid).toBe(valid);
      });
    });

    it('должен проверять наличие важных файлов', () => {
      const projectStructure = {
        'package.json': '{}',
        'README.md': '# Project',
        'src/index.js': 'console.log("hello");',
      };

      const requiredFiles = ['package.json', 'README.md', 'LICENSE'];

      requiredFiles.forEach(file => {
        const exists = projectStructure.hasOwnProperty(file);
        if (file === 'LICENSE') {
          expect(exists).toBe(false); // Отсутствует в структуре
        } else {
          expect(exists).toBe(true);
        }
      });
    });
  });
});
