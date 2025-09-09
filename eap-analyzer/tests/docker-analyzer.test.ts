/**
 * Unit тесты для Docker Analyzer
 */

import './eap-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DockerAnalyzer } from '../src/analyzers/docker-analyzer';

describe('DockerAnalyzer', () => {
  let analyzer: DockerAnalyzer;

  beforeEach(() => {
    analyzer = new DockerAnalyzer();
  });

  describe('constructor', () => {
    it('должен создать экземпляр DockerAnalyzer', () => {
      expect(analyzer).toBeInstanceOf(DockerAnalyzer);
      expect(analyzer.name).toBe('Docker');
    });
  });

  describe('analyze', () => {
    it('должен анализировать проект с Docker конфигурацией', async () => {
      createMockProject({
        Dockerfile: `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
        `,
        'docker-compose.yml': `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
        `,
        '.dockerignore': `
node_modules
.git
*.log
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBeGreaterThan(70);
      expect(result.category).toBe('Docker');
      expect(result.details).toContain('Dockerfile found');
      expect(result.details).toContain('docker-compose.yml found');
      expect(result.details).toContain('.dockerignore found');
    });

    it('должен выявлять проблемы безопасности в Dockerfile', async () => {
      createMockProject({
        Dockerfile: `
FROM ubuntu:latest
RUN apt-get update && apt-get install -y nodejs npm
WORKDIR /app
COPY . .
RUN npm install
USER root
EXPOSE 3000
CMD ["npm", "start"]
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.issues).toContain('Using latest tag is not recommended');
      expect(result.issues).toContain('Running as root user');
      expect(result.recommendations).toContain('Use specific version tags');
      expect(result.recommendations).toContain('Create non-root user');
    });

    it('должен проверять оптимизацию Docker образа', async () => {
      createMockProject({
        Dockerfile: `
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.issues).toContain('No layer optimization');
      expect(result.recommendations).toContain('Copy package.json first');
      expect(result.recommendations).toContain('Use npm ci for production');
    });

    it('должен анализировать multi-stage build', async () => {
      createMockProject({
        Dockerfile: `
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["npm", "start"]
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBeGreaterThan(85);
      expect(result.details).toContain('Multi-stage build detected');
      expect(result.details).toContain('Non-root user configured');
    });

    it('должен проверять docker-compose конфигурацию', async () => {
      createMockProject({
        'docker-compose.yml': `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  db:
    image: postgres:13-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    secrets:
      - db_password

volumes:
  postgres_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBeGreaterThan(80);
      expect(result.details).toContain('Health check configured');
      expect(result.details).toContain('Secrets management found');
      expect(result.details).toContain('Volume management configured');
    });

    it('должен обрабатывать проект без Docker', async () => {
      createMockProject({
        'package.json': JSON.stringify({
          name: 'no-docker-project',
        }),
        'src/index.js': 'console.log("Hello");',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.score).toBe(0);
      expect(result.issues).toContain('No Docker configuration found');
      expect(result.recommendations).toContain('Consider adding Docker support');
    });

    it('должен проверять переменные окружения', async () => {
      createMockProject({
        Dockerfile: `
FROM node:18-alpine
ENV NODE_ENV=production
ENV API_KEY=secret123
WORKDIR /app
        `,
        'docker-compose.yml': `
version: '3.8'
services:
  app:
    build: .
    environment:
      - DATABASE_PASSWORD=hardcoded_password
        `,
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.issues).toContain('Hardcoded secrets detected');
      expect(result.recommendations).toContain('Use secrets or env files');
    });
  });

  describe('getCheckResults', () => {
    it('должен возвращать детальные результаты проверок', async () => {
      createMockProject({
        Dockerfile: 'FROM node:18-alpine\nWORKDIR /app',
        'docker-compose.yml': 'version: "3.8"\nservices:\n  app:\n    build: .',
      });

      await analyzer.analyze('/mock/project');
      const checks = analyzer.getCheckResults();

      expect(checks.length).toBeGreaterThan(0);

      const dockerfileCheck = checks.find(c => c.name.includes('Dockerfile'));
      const composeCheck = checks.find(c => c.name.includes('docker-compose'));

      expect(dockerfileCheck).toBeDefined();
      expect(composeCheck).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('должен корректно обрабатывать ошибки парсинга YAML', async () => {
      createMockProject({
        'docker-compose.yml': 'invalid: yaml: content: [',
      });

      const result = await analyzer.analyze('/mock/project');

      expect(result.issues).toContain('Invalid docker-compose.yml format');
    });

    it('должен обрабатывать ошибки доступа к файлам', async () => {
      // Тест для случая, когда проект недоступен
      const result = await analyzer.analyze('/nonexistent/path');

      expect(result.score).toBe(0);
      expect(result.issues).toContain('No Docker configuration found');
    });
  });
});
