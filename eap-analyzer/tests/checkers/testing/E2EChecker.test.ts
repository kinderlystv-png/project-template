import { describe, it, expect, beforeEach } from 'vitest';
import { E2EChecker } from '../../../src/checkers/testing/E2EChecker';
import { Project } from '../../../src/types/Project';
import { SeverityLevel } from '../../../src/types/SeverityLevel';
import { CheckResult } from '../../../src/types/CheckResult';

// Mock Project implementation
class MockProject implements Project {
  private files: Map<string, string> = new Map();
  public readonly path: string = '/mock/project';
  public readonly name: string = 'mock-project';

  constructor(files: Record<string, string> = {}) {
    Object.entries(files).forEach(([path, content]) => {
      this.files.set(path, content);
    });
  }

  async exists(filePath: string): Promise<boolean> {
    return this.files.has(filePath);
  }

  async readFile(filePath: string): Promise<string> {
    return this.files.get(filePath) || '';
  }

  async getFileList(pattern?: string): Promise<string[]> {
    const files = Array.from(this.files.keys());
    if (!pattern) return files;
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/'));
    return files.filter(file => regex.test(file));
  }

  async getFileStats(filePath: string): Promise<any> {
    return { size: 100, modified: new Date() };
  }

  getRelativePath(filePath: string): string {
    return filePath.replace(this.path + '/', '');
  }

  resolvePath(relativePath: string): string {
    return `${this.path}/${relativePath}`;
  }
}

describe('E2EChecker', () => {
  let checker: E2EChecker;

  beforeEach(() => {
    checker = new E2EChecker();
  });

  describe('check()', () => {
    it('should run analysis with Playwright configuration', async () => {
      const mockProject = new MockProject({
        'package.json': JSON.stringify({
          devDependencies: {
            '@playwright/test': '^1.40.0',
          },
          scripts: {
            'test:e2e': 'playwright test',
          },
        }),
        'playwright.config.ts': `
          import { defineConfig } from '@playwright/test';

          export default defineConfig({
            testDir: './e2e',
            use: {
              baseURL: 'http://localhost:3000',
              headless: true
            },
            projects: [
              { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
            ]
          });
        `,
        'e2e/example.spec.ts': `
          import { test, expect } from '@playwright/test';

          test('example test', async ({ page }) => {
            await page.goto('/');
            await expect(page).toHaveTitle(/Example/);
          });
        `,
      });

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });

    it('should handle project with no E2E framework', async () => {
      const mockProject = new MockProject({
        'package.json': JSON.stringify({
          dependencies: {
            react: '^18.0.0',
          },
        }),
      });

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });

    it('should run analysis with Cypress configuration', async () => {
      const mockProject = new MockProject({
        'package.json': JSON.stringify({
          devDependencies: {
            cypress: '^13.0.0',
          },
          scripts: {
            'cypress:open': 'cypress open',
            'cypress:run': 'cypress run',
          },
        }),
        'cypress.config.js': `
          module.exports = {
            e2e: {
              baseUrl: 'http://localhost:3000',
              supportFile: 'cypress/support/e2e.js',
              specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
            }
          };
        `,
        'cypress/e2e/spec.cy.js': `
          describe('example', () => {
            it('passes', () => {
              cy.visit('/');
            });
          });
        `,
      });

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });

    it('should handle missing package.json', async () => {
      const mockProject = new MockProject({});

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });

    it('should run analysis with WebdriverIO configuration', async () => {
      const mockProject = new MockProject({
        'package.json': JSON.stringify({
          devDependencies: {
            '@wdio/cli': '^8.0.0',
            '@wdio/local-runner': '^8.0.0',
            '@wdio/mocha-framework': '^8.0.0',
          },
        }),
        'wdio.conf.js': `
          exports.config = {
            runner: 'local',
            specs: ['./test/specs/**/*.js'],
            capabilities: [{
              browserName: 'chrome'
            }],
            framework: 'mocha'
          };
        `,
      });

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });

    it('should handle corrupted package.json', async () => {
      const mockProject = new MockProject({
        'package.json': 'invalid json',
      });

      const results: CheckResult[] = await checker.check(mockProject);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results).toBeDefined();
    });
  });

  describe('properties', () => {
    it('should have correct checker name', () => {
      expect(checker.constructor.name).toBe('E2EChecker');
    });
  });
});
