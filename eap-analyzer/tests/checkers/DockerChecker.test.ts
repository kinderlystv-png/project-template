/**
 * Тест для унифицированного DockerChecker
 */

import { DockerChecker } from '../../src/checkers/docker/DockerChecker';
import { Project } from '../../src/types/Project';
import { AnalysisCategory } from '../../src/types/AnalysisCategory';
import { SeverityLevel } from '../../src/types/SeverityLevel';

// Мок для Project
class MockProject implements Project {
  private files: Map<string, string> = new Map();

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

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/';
    return Array.from(this.files.keys())
      .filter(path => path.startsWith(prefix))
      .map(path => path.substring(prefix.length))
      .filter(name => !name.includes('/'));
  }

  async getStats(filePath: string): Promise<any> {
    return { size: this.files.get(filePath)?.length || 0 };
  }

  getPath(): string {
    return '/mock/project';
  }
}

describe('DockerChecker', () => {
  let checker: DockerChecker;

  beforeEach(() => {
    checker = new DockerChecker();
  });

  test('должен создаться с правильными параметрами', () => {
    expect(checker.getName()).toBe('DockerChecker');
    expect(checker.getCategory()).toBe(AnalysisCategory.INFRASTRUCTURE);
    expect(checker.getStandard()).toBe('Docker Best Practices');
    expect(checker.getSeverity()).toBe(SeverityLevel.HIGH);
    expect(checker.getVersion()).toBe('2.0.0');
  });

  test('должен возвращать список доступных проверок', () => {
    const checks = checker.getAvailableChecks();
    expect(checks).toHaveLength(8);
    expect(checks.map(c => c.id)).toEqual([
      'docker-dockerfile',
      'docker-compose',
      'docker-multistage',
      'docker-production',
      'docker-security',
      'docker-healthcheck',
      'docker-ignore',
      'docker-environments',
    ]);
  });

  test('должен определить применимость для проекта с Dockerfile', async () => {
    const project = new MockProject({
      Dockerfile: 'FROM node:18\nWORKDIR /app',
    });

    const applicable = await checker.isApplicable(project);
    expect(applicable).toBe(true);
  });

  test('должен определить неприменимость для проекта без Docker файлов', async () => {
    const project = new MockProject({
      'package.json': '{"name": "test"}',
    });

    const applicable = await checker.isApplicable(project);
    expect(applicable).toBe(false);
  });

  test('должен успешно проверить простой Dockerfile', async () => {
    const dockerfileContent = `
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 3000
CMD ["npm", "start"]
`;

    const project = new MockProject({
      Dockerfile: dockerfileContent,
    });

    const results = await checker.check(project);
    const dockerfileCheck = results.find(r => r.id === 'docker-dockerfile');

    expect(dockerfileCheck).toBeDefined();
    expect(dockerfileCheck?.passed).toBe(true);
    expect(dockerfileCheck?.score).toBeGreaterThan(0);
  });

  test('должен обнаружить отсутствие Dockerfile', async () => {
    const project = new MockProject({
      'docker-compose.yml': 'version: "3"\nservices:\n  app:\n    image: node',
    });

    const results = await checker.check(project);
    const dockerfileCheck = results.find(r => r.id === 'docker-dockerfile');

    expect(dockerfileCheck).toBeDefined();
    expect(dockerfileCheck?.passed).toBe(false);
    expect(dockerfileCheck?.score).toBe(0);
    expect(dockerfileCheck?.message).toContain('не найден');
  });

  test('должен проверить Docker Compose конфигурацию', async () => {
    const composeContent = `
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
`;

    const project = new MockProject({
      Dockerfile: 'FROM node:18',
      'docker-compose.yml': composeContent,
    });

    const results = await checker.check(project);
    const composeCheck = results.find(r => r.id === 'docker-compose');

    expect(composeCheck).toBeDefined();
    expect(composeCheck?.passed).toBe(true);
    expect(composeCheck?.score).toBe(15);
  });

  test('должен обнаружить multi-stage сборку', async () => {
    const multistageDockerfile = `
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
`;

    const project = new MockProject({
      Dockerfile: multistageDockerfile,
    });

    const results = await checker.check(project);
    const multistageCheck = results.find(r => r.id === 'docker-multistage');

    expect(multistageCheck).toBeDefined();
    expect(multistageCheck?.passed).toBe(true);
    expect(multistageCheck?.message).toContain('Multi-stage сборка обнаружена');
  });

  test('должен проверить безопасность контейнера', async () => {
    const secureDockerfile = `
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci && rm -rf /var/lib/apt/lists/*
USER nextjs
CMD ["npm", "start"]
`;

    const project = new MockProject({
      Dockerfile: secureDockerfile,
    });

    const results = await checker.check(project);
    const securityCheck = results.find(r => r.id === 'docker-security');

    expect(securityCheck).toBeDefined();
    expect(securityCheck?.passed).toBe(true);
  });

  test('должен корректно обработать ошибки при чтении файлов', async () => {
    const project = new MockProject();

    // Мокаем метод exists для генерации ошибки
    jest.spyOn(project, 'exists').mockRejectedValue(new Error('File system error'));

    const results = await checker.safeCheck(project);

    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true); // Должен быть помечен как пропущенный
    expect(results[0].message).toContain('не может работать');
  });

  test('должен вернуть корректную статистику для всех проверок', async () => {
    const project = new MockProject({
      Dockerfile: 'FROM node:18\nWORKDIR /app\nCMD ["npm", "start"]',
      'docker-compose.yml': 'version: "3"\nservices:\n  app:\n    build: .',
      '.dockerignore': 'node_modules\n*.log',
    });

    const results = await checker.check(project);

    expect(results).toHaveLength(8);

    results.forEach(result => {
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(typeof result.maxScore).toBe('number');
      expect(result.stats).toBeDefined();
      expect(typeof result.stats?.duration).toBe('number');
      expect(typeof result.stats?.filesChecked).toBe('number');
      expect(typeof result.stats?.issuesFound).toBe('number');
    });
  });
});
