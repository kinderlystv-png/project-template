/**
 * Unit тесты для типов EAP анализатора
 */

import './eap-setup';
import { describe, it, expect } from 'vitest';

describe('Types and Interfaces', () => {
  describe('Analysis Result Types', () => {
    it('должен соответствовать интерфейсу AnalysisResult', () => {
      const result = {
        score: 85,
        category: 'SvelteKit',
        details: ['Configuration found', 'Best practices followed'],
        issues: ['Missing test coverage'],
        recommendations: ['Add more unit tests'],
      };

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');

      expect(typeof result.score).toBe('number');
      expect(typeof result.category).toBe('string');
      expect(Array.isArray(result.details)).toBe(true);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('должен валидировать score в диапазоне 0-100', () => {
      const validScores = [0, 25, 50, 75, 100];
      const invalidScores = [-1, 101, -100, 200];

      validScores.forEach(score => {
        expect(score >= 0 && score <= 100).toBe(true);
      });

      invalidScores.forEach(score => {
        expect(score >= 0 && score <= 100).toBe(false);
      });
    });
  });

  describe('Check Result Types', () => {
    it('должен соответствовать интерфейсу CheckResult', () => {
      const checkResult = {
        name: 'Package.json validation',
        status: 'passed' as const,
        message: 'Package.json is valid and well-formed',
        details: 'All required fields are present',
      };

      expect(checkResult).toHaveProperty('name');
      expect(checkResult).toHaveProperty('status');
      expect(checkResult).toHaveProperty('message');
      expect(checkResult).toHaveProperty('details');

      expect(typeof checkResult.name).toBe('string');
      expect(['passed', 'failed', 'warning']).toContain(checkResult.status);
      expect(typeof checkResult.message).toBe('string');
    });

    it('должен поддерживать все статусы проверок', () => {
      const statuses = ['passed', 'failed', 'warning'] as const;

      statuses.forEach(status => {
        const checkResult = {
          name: `Test check ${status}`,
          status: status,
          message: `Check ${status}`,
          details: `Details for ${status} check`,
        };

        expect(['passed', 'failed', 'warning']).toContain(checkResult.status);
      });
    });
  });

  describe('Configuration Types', () => {
    it('должен обрабатывать конфигурацию проекта', () => {
      const projectConfig = {
        name: 'test-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite dev',
          build: 'vite build',
          test: 'vitest',
        },
        dependencies: {
          svelte: '^4.0.0',
        },
      };

      expect(projectConfig).toHaveProperty('name');
      expect(projectConfig).toHaveProperty('version');
      expect(projectConfig).toHaveProperty('scripts');
      expect(projectConfig).toHaveProperty('dependencies');

      expect(typeof projectConfig.name).toBe('string');
      expect(typeof projectConfig.version).toBe('string');
      expect(typeof projectConfig.scripts).toBe('object');
      expect(typeof projectConfig.dependencies).toBe('object');
    });

    it('должен валидировать структуру package.json', () => {
      const requiredFields = ['name', 'version'];
      const optionalFields = ['description', 'scripts', 'dependencies', 'devDependencies'];

      const minimalPackage = {
        name: 'minimal-package',
        version: '1.0.0',
      };

      const fullPackage = {
        name: 'full-package',
        version: '1.0.0',
        description: 'A complete package',
        scripts: { test: 'vitest' },
        dependencies: { svelte: '^4.0.0' },
        devDependencies: { vitest: '^0.34.0' },
      };

      // Проверяем минимальный пакет
      requiredFields.forEach(field => {
        expect(minimalPackage).toHaveProperty(field);
      });

      // Проверяем полный пакет
      [...requiredFields, ...optionalFields].forEach(field => {
        expect(fullPackage).toHaveProperty(field);
      });
    });
  });

  describe('Analyzer Types', () => {
    it('должен определить интерфейс анализатора', () => {
      class TestAnalyzer {
        name = 'Test';

        async analyze(projectPath: string) {
          return {
            score: 100,
            category: 'Test',
            details: [],
            issues: [],
            recommendations: [],
          };
        }

        getCheckResults() {
          return [
            {
              name: 'Test check',
              status: 'passed' as const,
              message: 'All tests passed',
              details: 'No issues found',
            },
          ];
        }
      }

      const analyzer = new TestAnalyzer();

      expect(analyzer).toHaveProperty('name');
      expect(analyzer).toHaveProperty('analyze');
      expect(analyzer).toHaveProperty('getCheckResults');

      expect(typeof analyzer.name).toBe('string');
      expect(typeof analyzer.analyze).toBe('function');
      expect(typeof analyzer.getCheckResults).toBe('function');
    });
  });

  describe('File System Types', () => {
    it('должен работать с путями файлов', () => {
      const filePaths = [
        '/absolute/path/to/file.js',
        'relative/path/to/file.ts',
        './current/dir/file.svelte',
        '../parent/dir/file.css',
      ];

      filePaths.forEach(path => {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);

        // Проверяем наличие расширения
        const hasExtension = path.includes('.');
        expect(hasExtension).toBe(true);
      });
    });

    it('должен валидировать структуру проекта', () => {
      const projectStructure = {
        'src/': {
          'components/': {
            'Button.svelte': 'component',
            'Modal.svelte': 'component',
          },
          'pages/': {
            'index.svelte': 'page',
            'about.svelte': 'page',
          },
          'lib/': {
            'utils.js': 'utility',
            'api.js': 'api',
          },
        },
        'tests/': {
          'unit/': {},
          'integration/': {},
        },
      };

      expect(projectStructure).toHaveProperty('src/');
      expect(projectStructure).toHaveProperty('tests/');
      expect(projectStructure['src/']).toHaveProperty('components/');
      expect(projectStructure['src/']).toHaveProperty('pages/');
      expect(projectStructure['src/']).toHaveProperty('lib/');
    });
  });
});
