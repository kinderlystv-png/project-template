# Deployment Guide

## 🚀 Руководство по развертыванию

Этот шаблон поддерживает различные стратегии развертывания для разных типов проектов и окружений.

## 🏗️ Типы развертывания

### 1. Static Site Generation (SSG)

Для полностью статических сайтов без серверной логики.

```bash
# Сборка статического сайта
npm run build

# Предварительный просмотр
npm run preview
```

### 2. Server-Side Rendering (SSR)

Для приложений с серверной логикой и динамическим контентом.

```bash
# Сборка SSR приложения
npm run build

# Запуск production сервера
node build
```

### 3. Single Page Application (SPA)

Для клиентских приложений.

```bash
# Настройка SPA режима в svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'
    })
  }
};
```

## ☁️ Платформы развертывания

### 1. Vercel

#### Автоматическое развертывание

```json
// vercel.json
{
  "framework": "svelte",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "VITE_API_URL": "@api_url",
      "VITE_APP_VERSION": "@app_version"
    }
  }
}
```

#### GitHub Integration

1. Подключите репозиторий к Vercel
2. Настройте environment variables
3. Автоматическое развертывание при push

### 2. Netlify

#### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_ENV = "production"
  VITE_API_URL = "https://api.example.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.preview]
  command = "npm run build:preview"

[context.branch-deploy]
  command = "npm run build:staging"
```

#### Deploy Commands

```bash
# Manual deploy
npm install -g netlify-cli
netlify deploy --prod

# Preview deploy
netlify deploy
```

### 3. GitHub Pages

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 4. Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sveltekit -u 1001

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Change ownership
RUN chown -R sveltekit:nodejs /app
USER sveltekit

EXPOSE 3000

CMD ["node", "build"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.example.com
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 5. AWS Deployment

#### S3 + CloudFront (Static)

```bash
# Install AWS CLI
npm install -g aws-cli

# Build and deploy
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### ECS (Container)

```json
// ecs-task-definition.json
{
  "family": "sveltekit-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "sveltekit-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/sveltekit-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sveltekit-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🔧 Конфигурация окружения

### Environment Variables

```bash
# .env.production
NODE_ENV=production
VITE_API_URL=https://api.production.com
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id

# .env.staging
NODE_ENV=staging
VITE_API_URL=https://api.staging.com
VITE_APP_VERSION=1.0.0-staging
VITE_DEBUG=true

# .env.development
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_APP_VERSION=1.0.0-dev
VITE_DEBUG=true
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "build:analyze": "vite build && npx vite-bundle-analyzer",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging"
  }
}
```

## 📊 Мониторинг и логирование

### Health Check Endpoint

```typescript
// src/routes/health/+server.ts
import { json } from '@sveltejs/kit';
import { version } from '../../../package.json';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  };

  return json(health);
}
```

### Error Tracking

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.NODE_ENV,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: 0.1,
  });
}
```

### Analytics

```typescript
// src/lib/analytics/gtag.ts
export function initAnalytics() {
  if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_ID) {
    // Google Analytics initialization
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_ANALYTICS_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_ANALYTICS_ID);
  }
}
```

## 🔒 Безопасность

### Security Headers

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};
```

### Content Security Policy

```typescript
// vite.config.ts - для статических сайтов
export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' data:;"
          );
          next();
        });
      },
    },
  ],
});
```

## 🔄 CI/CD Pipeline

### Complete GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: build/

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
```

## 📈 Performance Optimization

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte', '@sveltejs/kit'],
          utils: ['lodash', 'date-fns'],
          ui: ['./src/lib/components/ui'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### Asset Optimization

```bash
# Optimize images
npm install -g imagemin-cli
imagemin static/images/**/* --out-dir=static/images/optimized

# Compress assets
gzip -9 build/**/*.{js,css,html,json}
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .svelte-kit
npm run dev
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Environment Variables

```typescript
// Debug environment variables
console.log('Environment:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
```

### Debug Mode

```bash
# Enable debug output
DEBUG=vite:* npm run build
DEBUG=sveltekit:* npm run build
```

## 📊 Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Build optimization verified
- [ ] Security headers implemented
- [ ] Analytics configured
- [ ] Error tracking setup

### Post-deployment

- [ ] Health check endpoint responding
- [ ] Performance metrics within targets
- [ ] Error rates within acceptable limits
- [ ] Analytics tracking working
- [ ] User acceptance testing completed

### Rollback Plan

- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Database migration rollback ready
- [ ] CDN cache invalidation plan

## 📚 Дополнительные ресурсы

- [SvelteKit Deployment](https://kit.svelte.dev/docs/adapters)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [AWS Deployment Guide](https://aws.amazon.com/getting-started/)
