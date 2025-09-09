/**
 * Unit тесты для EMT Analyzer
 */

import './eap-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMTAnalyzer } from '../src/analyzers/emt-analyzer';

describe('EMTAnalyzer', () => {
  let analyzer: EMTAnalyzer;

  beforeEach(() => {
    analyzer = new EMTAnalyzer();
  });

  describe('constructor', () => {
    it('должен создать экземпляр EMTAnalyzer', () => {
      expect(analyzer).toBeInstanceOf(EMTAnalyzer);
    });

    it('должен иметь правильное имя', () => {
      expect(analyzer.name).toBe('EMT');
    });
  });

  describe('analyze', () => {
    it('должен вернуть результат анализа для EMT проекта', async () => {
      // Создаём мок EMT проекта
      createMockProject({
        'package.json': JSON.stringify({
          name: 'test-emt',
          dependencies: {
            '@emt/core': '^1.0.0',
          },
        }),
        'emt.config.js': 'module.exports = { framework: "svelte" };',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.category).toBe('EMT');
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('должен правильно обрабатывать проект без EMT', async () => {
      // Создаём мок обычного проекта
      createMockProject({
        'package.json': JSON.stringify({
          name: 'regular-project',
          dependencies: {
            react: '^18.0.0',
          },
        }),
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.issues).toContain('No EMT framework detected');
    });

    it('должен обнаружить конфигурационные файлы EMT', async () => {
      createMockProject({
        'package.json': JSON.stringify({
          name: 'emt-project',
          dependencies: {
            '@emt/core': '^2.0.0',
          },
        }),
        'emt.config.js': 'module.exports = { framework: "svelte", build: { optimize: true } };',
        'src/routes/.gitkeep': '', // Создаем директорию routes
        'src/routes/index.js': 'export default { path: "/", component: "Home" };',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBeGreaterThan(50);
      expect(result.details).toContain('EMT configuration found');
      expect(result.details).toContain('EMT routes configuration found');
    });

    it('должен проверить структуру директорий EMT', async () => {
      createMockProject({
        'package.json': JSON.stringify({
          dependencies: { '@emt/core': '^1.0.0' },
        }),
        'src/components/Button.svelte': '<button><slot /></button>',
        'src/services/api.js': 'export const api = {};',
        'src/utils/helpers.js': 'export const helper = () => {};',
        'src/types/index.ts': 'export interface User {}',
        'src/config/app.js': 'export const config = {};',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBeGreaterThan(30);
      expect(result.recommendations).toContain('EMT project structure is well organized');
    });

    it('должен выявить проблемы с версиями зависимостей', async () => {
      createMockProject({
        'package.json': JSON.stringify({
          dependencies: {
            '@emt/core': '^0.5.0', // Устаревшая версия
            '@emt/ui': '1.0.0-beta.1', // Бета-версия
          },
        }),
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.issues).toContain('Outdated EMT version detected');
      expect(result.issues).toContain('Beta dependencies detected');
      expect(result.recommendations).toContain('Update to latest stable EMT version');
    });
  });

  describe('getCheckResults', () => {
    it('должен возвращать детальные результаты проверок', async () => {
      createMockProject({
        'package.json': JSON.stringify({
          dependencies: { '@emt/core': '^2.0.0' },
        }),
        'emt.config.js': 'module.exports = {};',
      });

      await analyzer.analyze('/mock/project');
      const checks = analyzer.getCheckResults();

      expect(checks).toBeDefined();
      expect(checks.length).toBeGreaterThan(0);

      // Проверяем структуру результатов
      checks.forEach(check => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(['passed', 'failed', 'warning']).toContain(check.status);
      });
    });
  });

  describe('error handling', () => {
    it('должен корректно обрабатывать ошибки чтения файлов', async () => {
      // Тест для недоступного проекта
      const result = await analyzer.analyze('/nonexistent/path');

      expect(result).toBeDefined();
      expect(result.score).toBe(0); // Нет EMT в недоступном проекте
    });

    it('должен обрабатывать невалидный JSON в package.json', async () => {
      createMockProject({
        'package.json': 'invalid json content',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBe(0);
      expect(result.issues).toContain('Invalid package.json format');
    });
  });
});
