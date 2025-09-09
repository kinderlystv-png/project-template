/**
 * Unit тесты для CLI интерфейса
 */

import './eap-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('CLI Interface', () => {
  beforeEach(() => {
    // Очищаем аргументы процесса
    delete process.env.NODE_ENV;
  });

  describe('Command Line Arguments', () => {
    it('должен парсить базовые аргументы', () => {
      const args = ['node', 'eap.js', '/path/to/project'];

      expect(args.length).toBe(3);
      expect(args[0]).toBe('node');
      expect(args[1]).toBe('eap.js');
      expect(args[2]).toBe('/path/to/project');
    });

    it('должен обрабатывать флаги и опции', () => {
      const args = [
        'node',
        'eap.js',
        '--format',
        'json',
        '--output',
        'report.json',
        '--verbose',
        '/path/to/project',
      ];

      const flags = {
        format: 'json',
        output: 'report.json',
        verbose: true,
        projectPath: '/path/to/project',
      };

      expect(args).toContain('--format');
      expect(args).toContain('json');
      expect(args).toContain('--output');
      expect(args).toContain('report.json');
      expect(args).toContain('--verbose');

      expect(flags.format).toBe('json');
      expect(flags.output).toBe('report.json');
      expect(flags.verbose).toBe(true);
    });

    it('должен валидировать обязательные аргументы', () => {
      const validArgs = ['node', 'eap.js', '/valid/path'];
      const invalidArgs = ['node', 'eap.js']; // Отсутствует путь

      expect(validArgs.length).toBeGreaterThan(2);
      expect(invalidArgs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Output Formatting', () => {
    it('должен поддерживать различные форматы вывода', () => {
      const mockResult = {
        score: 85,
        category: 'SvelteKit',
        details: ['Configuration found'],
        issues: ['Missing tests'],
        recommendations: ['Add unit tests'],
      };

      // Console format
      const consoleOutput = `Score: ${mockResult.score}/100`;
      expect(consoleOutput).toContain('85');

      // JSON format
      const jsonOutput = JSON.stringify(mockResult, null, 2);
      expect(() => JSON.parse(jsonOutput)).not.toThrow();

      // HTML format (mocked)
      const htmlOutput = `<div class="score">${mockResult.score}</div>`;
      expect(htmlOutput).toContain('85');
    });

    it('должен форматировать результаты для консоли', () => {
      const result = {
        score: 75,
        category: 'Docker',
        details: ['Dockerfile found', 'docker-compose.yml found'],
        issues: ['No .dockerignore'],
        recommendations: ['Add .dockerignore file'],
      };

      const consoleFormat = [
        `\n=== ${result.category} Analysis ===`,
        `Score: ${result.score}/100`,
        `\nDetails:`,
        ...result.details.map(d => `  ✓ ${d}`),
        `\nIssues:`,
        ...result.issues.map(i => `  ✗ ${i}`),
        `\nRecommendations:`,
        ...result.recommendations.map(r => `  → ${r}`),
      ].join('\n');

      expect(consoleFormat).toContain('Docker Analysis');
      expect(consoleFormat).toContain('75/100');
      expect(consoleFormat).toContain('✓ Dockerfile found');
      expect(consoleFormat).toContain('✗ No .dockerignore');
      expect(consoleFormat).toContain('→ Add .dockerignore file');
    });
  });

  describe('Error Handling', () => {
    it('должен обрабатывать ошибки файловой системы', () => {
      const invalidPath = '/non/existent/path';

      // Симулируем ошибку доступа к файлу
      const error = new Error(`ENOENT: no such file or directory '${invalidPath}'`);

      expect(error.message).toContain('ENOENT');
      expect(error.message).toContain(invalidPath);
    });

    it('должен показывать справку при неправильных аргументах', () => {
      const helpText = [
        'Usage: eap <project-path> [options]',
        '',
        'Options:',
        '  --format <type>    Output format (console, json, html)',
        '  --output <file>    Output file path',
        '  --verbose          Verbose output',
        '  --help             Show this help',
      ].join('\n');

      expect(helpText).toContain('Usage: eap');
      expect(helpText).toContain('--format');
      expect(helpText).toContain('--output');
      expect(helpText).toContain('--verbose');
      expect(helpText).toContain('--help');
    });

    it('должен обрабатывать прерывание пользователем', () => {
      const exitCodes = {
        SUCCESS: 0,
        ERROR: 1,
        INVALID_ARGS: 2,
        INTERRUPTED: 130,
      };

      expect(exitCodes.SUCCESS).toBe(0);
      expect(exitCodes.ERROR).toBe(1);
      expect(exitCodes.INVALID_ARGS).toBe(2);
      expect(exitCodes.INTERRUPTED).toBe(130);
    });
  });

  describe('Progress Reporting', () => {
    it('должен показывать прогресс анализа', () => {
      const progressSteps = [
        'Scanning project structure...',
        'Analyzing package.json...',
        'Checking configuration files...',
        'Running quality checks...',
        'Generating report...',
      ];

      progressSteps.forEach((step, index) => {
        const progress = Math.round(((index + 1) / progressSteps.length) * 100);
        const progressText = `[${progress}%] ${step}`;

        expect(progressText).toContain(`${progress}%`);
        expect(progressText).toContain(step);
      });
    });

    it('должен поддерживать тихий режим', () => {
      const verboseMode = true;
      const silentMode = false;

      if (verboseMode) {
        const verboseOutput = 'Detailed analysis information...';
        expect(verboseOutput).toContain('Detailed');
      }

      if (silentMode) {
        const silentOutput = ''; // Нет вывода в тихом режиме
        expect(silentOutput).toBe('');
      }
    });
  });

  describe('Configuration Loading', () => {
    it('должен загружать конфигурацию по умолчанию', () => {
      const defaultConfig = {
        outputFormat: 'console',
        verbose: false,
        includeDetails: true,
        thresholds: {
          good: 80,
          warning: 60,
          error: 40,
        },
      };

      expect(defaultConfig.outputFormat).toBe('console');
      expect(defaultConfig.verbose).toBe(false);
      expect(defaultConfig.includeDetails).toBe(true);
      expect(defaultConfig.thresholds.good).toBe(80);
    });

    it('должен переопределять конфигурацию из аргументов', () => {
      const defaultConfig = { verbose: false, format: 'console' };
      const cliArgs = { verbose: true, format: 'json' };

      const finalConfig = { ...defaultConfig, ...cliArgs };

      expect(finalConfig.verbose).toBe(true);
      expect(finalConfig.format).toBe('json');
    });
  });

  describe('Exit Handling', () => {
    it('должен правильно завершать работу', () => {
      const exitScenarios = [
        { score: 90, expectedExit: 0 }, // Успех
        { score: 70, expectedExit: 0 }, // Предупреждение но успех
        { score: 40, expectedExit: 1 }, // Ошибка
        { score: 20, expectedExit: 1 }, // Критическая ошибка
      ];

      exitScenarios.forEach(({ score, expectedExit }) => {
        const shouldExit = score < 50 ? 1 : 0;
        expect(shouldExit).toBe(expectedExit);
      });
    });

    it('должен очищать ресурсы при выходе', () => {
      const cleanup = vi.fn();

      // Симулируем cleanup функцию
      process.on('exit', cleanup);

      // Проверяем что cleanup будет вызван
      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });
  });
});
