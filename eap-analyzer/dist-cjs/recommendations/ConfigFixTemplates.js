'use strict';
/**
 * ConfigFixTemplates - Шаблоны исправления для проблем конфигурации безопасности
 *
 * Phase 5.2.1: Конкретные fix templates для config security issues
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigFixTemplates = void 0;
class ConfigFixTemplates {
  /**
   * Генерирует fix для неправильной настройки CORS
   */
  static generateCORSFix(corsData) {
    const { file, currentConfig, issues } = corsData;
    const severity = issues.includes('wildcard-origin') ? 'high' : 'medium';
    return {
      id: 'cors-misconfiguration',
      title: 'Неправильная настройка CORS',
      description: `Небезопасная CORS конфигурация в ${file}`,
      severity,
      category: 'config',
      fixTemplate: {
        steps: [
          'Ограничьте allowed origins до конкретных доменов',
          'Настройте credentials правильно',
          'Добавьте проверку окружения (dev/prod)',
          'Настройте preflight requests',
          'Протестируйте CORS политику',
        ],
        beforeCode: `// НЕБЕЗОПАСНО ❌:
${this.getCORSBeforeExample(currentConfig)}`,
        afterCode: `// БЕЗОПАСНО ✅:
${this.getCORSAfterExample()}`,
        codeExample: this.getCORSImplementationGuide(),
      },
      documentation: {
        links: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
          'https://owasp.org/www-community/attacks/csrf',
          'https://web.dev/cross-origin-resource-sharing/',
        ],
        explanation: 'Неправильный CORS может привести к CSRF атакам и утечке данных',
      },
      estimatedTime: '30-45 минут',
      difficulty: 'easy',
    };
  }
  /**
   * Генерирует fix для exposure переменных окружения
   */
  static generateEnvExposureFix(envData) {
    const { file, exposedVars, framework } = envData;
    return {
      id: 'env-exposure',
      title: 'Exposure переменных окружения',
      description: `Секретные переменные доступны клиенту в ${file}`,
      severity: 'medium',
      category: 'config',
      fixTemplate: {
        steps: [
          'Разделите public и private переменные',
          'Используйте правильные префиксы',
          'Переместите секреты в server-only область',
          'Настройте фильтрацию в bundler',
          'Проверьте что секреты недоступны в браузере',
        ],
        beforeCode: this.getEnvExposureBefore(exposedVars),
        afterCode: this.getEnvExposureAfter(framework),
        codeExample: this.getEnvExposureGuide(framework),
      },
      documentation: {
        links: [
          'https://12factor.net/config',
          this.getFrameworkEnvDocs(framework),
          'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials',
        ],
        explanation: 'Клиентский код доступен для инспекции, секреты могут быть украдены',
      },
      estimatedTime: '45-90 минут',
      difficulty: 'medium',
    };
  }
  /**
   * Генерирует fix для небезопасных HTTP заголовков
   */
  static generateSecurityHeadersFix(headerData) {
    const { file, missingHeaders } = headerData;
    return {
      id: 'security-headers',
      title: 'Отсутствуют заголовки безопасности',
      description: `Не настроены security headers в ${file}`,
      severity: 'medium',
      category: 'config',
      fixTemplate: {
        steps: [
          'Добавьте Content Security Policy (CSP)',
          'Настройте X-Frame-Options',
          'Включите X-Content-Type-Options',
          'Добавьте Strict-Transport-Security',
          'Протестируйте заголовки',
        ],
        beforeCode: this.getSecurityHeadersBefore(),
        afterCode: this.getSecurityHeadersAfter(),
        codeExample: this.getSecurityHeadersGuide(missingHeaders),
      },
      documentation: {
        links: [
          'https://owasp.org/www-project-secure-headers/',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy',
          'https://securityheaders.com/',
        ],
        explanation: 'Security headers защищают от XSS, clickjacking и других атак',
      },
      estimatedTime: '1-2 часа',
      difficulty: 'medium',
    };
  }
  /**
   * Генерирует fix для небезопасных Docker настроек
   */
  static generateDockerSecurityFix(dockerData) {
    const { file, issues } = dockerData;
    return {
      id: 'docker-security',
      title: 'Небезопасная Docker конфигурация',
      description: `Проблемы безопасности Docker в ${file}`,
      severity: 'high',
      category: 'config',
      fixTemplate: {
        steps: [
          'Используйте non-root пользователя',
          'Минимизируйте поверхность атаки',
          'Обновите базовые образы',
          'Настройте health checks',
          'Ограничьте ресурсы',
        ],
        beforeCode: this.getDockerSecurityBefore(issues),
        afterCode: this.getDockerSecurityAfter(),
        codeExample: this.getDockerSecurityGuide(),
      },
      documentation: {
        links: [
          'https://docs.docker.com/develop/dev-best-practices/',
          'https://owasp.org/www-project-docker-top-10/',
          'https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html',
        ],
        explanation: 'Небезопасный Docker может привести к container escape и компрометации хоста',
      },
      estimatedTime: '2-3 часа',
      difficulty: 'medium',
    };
  }
  // Helper methods для генерации примеров
  static getCORSBeforeExample(currentConfig) {
    if (currentConfig?.origin === '*') {
      return `app.use(cors({
  origin: '*',                    // ❌ Разрешает все домены
  credentials: true              // ❌ Опасно с wildcard origin
}));`;
    }
    return `app.use(cors({
  origin: true,                  // ❌ Разрешает все домены
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // ❌ Слишком много методов
  allowedHeaders: '*'            // ❌ Разрешает все заголовки
}));`;
  }
  static getCORSAfterExample() {
    return `// Production-ready CORS:
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://yourdomain.com',
      'https://app.yourdomain.com'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],      // ✅ Только нужные методы
  allowedHeaders: [              // ✅ Только нужные заголовки
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  maxAge: 86400                  // ✅ Кеширование preflight
}));`;
  }
  static getCORSImplementationGuide() {
    return `// Полная CORS конфигурация:

// 1. Переменные окружения:
// .env.production:
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

// .env.development:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

// 2. Динамическая конфигурация:
const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions = {
  origin: (origin, callback) => {
    // Разрешаем requests без origin (мобильные приложения, Postman)
    if (!origin) return callback(null, true);
    
    if (origins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(\`CORS blocked origin: \${origin}\`);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Для старых браузеров
};

// 3. Применение:
app.use(cors(corsOptions));

// 4. Для специфичных роутов:
app.get('/api/public', cors({ origin: false }), handler);
app.post('/api/secure', cors(corsOptions), authMiddleware, handler);`;
  }
  static getEnvExposureBefore(exposedVars) {
    return `// НЕБЕЗОПАСНО ❌:
const config = {
  ${exposedVars.map(varName => `${varName.toLowerCase()}: process.env.${varName}`).join(',\n  ')}
};

// Эти переменные попадают в клиентский bundle!
export default config;`;
  }
  static getEnvExposureAfter(framework) {
    const examples = {
      vite: `// БЕЗОПАСНО ✅ (Vite):
// Только переменные с префиксом VITE_ попадают в клиент
const clientConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME
};

// Серверные секреты остаются на сервере:
const serverConfig = {
  dbPassword: process.env.DB_PASSWORD,
  jwtSecret: process.env.JWT_SECRET
};`,
      next: `// БЕЗОПАСНО ✅ (Next.js):
// Только переменные с префиксом NEXT_PUBLIC_ попадают в клиент
const clientConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID
};

// Серверные секреты (без префикса):
const serverConfig = {
  databaseUrl: process.env.DATABASE_URL,
  apiSecret: process.env.API_SECRET
};`,
      webpack: `// БЕЗОПАСНО ✅ (Webpack):
// Используйте DefinePlugin для явного экспорта
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
      // НЕ добавляйте секреты сюда!
    })
  ]
};`,
    };
    return examples[framework] || examples['vite'];
  }
  static getEnvExposureGuide(framework) {
    const guides = {
      vite: `// Vite Environment Variables Guide:

// 1. Публичные переменные (клиент):
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App

// 2. Приватные переменные (только сервер):
DB_PASSWORD=secret123
JWT_SECRET=super-secret-key

// 3. Использование:
// Клиент:
const apiUrl = import.meta.env.VITE_API_URL; // ✅ Работает
const secret = import.meta.env.JWT_SECRET;   // ❌ undefined

// Сервер:
const dbPass = process.env.DB_PASSWORD;      // ✅ Работает`,
      next: `// Next.js Environment Variables Guide:

// 1. Публичные переменные (клиент):
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=GA-123456

// 2. Приватные переменные (только сервер):
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=secret123

// 3. Использование:
// Клиент:
const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅ Работает
const dbUrl = process.env.DATABASE_URL;         // ❌ undefined

// Сервер (API routes, getServerSideProps):
const dbUrl = process.env.DATABASE_URL;         // ✅ Работает`,
    };
    return guides[framework] || guides['vite'];
  }
  static getSecurityHeadersBefore() {
    return `// НЕБЕЗОПАСНО ❌:
app.get('/', (req, res) => {
  res.send('<html>...</html>'); // Нет security headers
});

// Или в Express без middleware:
app.use(express.static('public')); // Статичные файлы без защиты`;
  }
  static getSecurityHeadersAfter() {
    return `// БЕЗОПАСНО ✅:
import helmet from 'helmet';

// Используйте Helmet для автоматической настройки:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Или настройте вручную:
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});`;
  }
  static getSecurityHeadersGuide(missingHeaders) {
    const headerGuide = {
      'Content-Security-Policy': 'Предотвращает XSS атаки, ограничивая источники контента',
      'X-Frame-Options': 'Защищает от clickjacking атак',
      'X-Content-Type-Options': 'Предотвращает MIME-type sniffing',
      'Strict-Transport-Security': 'Принуждает использовать HTTPS',
      'Referrer-Policy': 'Контролирует информацию в Referer заголовке',
    };
    return `// Отсутствующие заголовки:
${missingHeaders.map(header => `// ${header}: ${headerGuide[header] || 'Важен для безопасности'}`).join('\n')}

// Полная настройка с Helmet:
npm install helmet

app.use(helmet({
  ${
    missingHeaders.includes('Content-Security-Policy')
      ? `contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Минимизируйте unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },`
      : ''
  }
  ${
    missingHeaders.includes('Strict-Transport-Security')
      ? `hsts: {
    maxAge: 31536000,      // 1 год
    includeSubDomains: true,
    preload: true
  },`
      : ''
  }
  frameguard: { action: 'deny' },           // X-Frame-Options
  noSniff: true,                            // X-Content-Type-Options
  referrerPolicy: { policy: 'same-origin' } // Referrer-Policy
}));`;
  }
  static getDockerSecurityBefore(issues) {
    return `# НЕБЕЗОПАСНО ❌:
FROM node:latest                    # Последняя версия может быть нестабильной
USER root                          # Работает от root
COPY . .                          # Копирует все файлы
RUN npm install                   # Устанавливает devDependencies
EXPOSE 3000
CMD ["node", "index.js"]`;
  }
  static getDockerSecurityAfter() {
    return `# БЕЗОПАСНО ✅:
FROM node:18-alpine               # Конкретная версия + минимальный образ

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

# Копируем только необходимые файлы
COPY package*.json ./
RUN npm ci --only=production && \\
    npm cache clean --force

# Переключаемся на non-root пользователя
USER nextjs

# Копируем приложение
COPY --chown=nextjs:nodejs . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "index.js"]`;
  }
  static getDockerSecurityGuide() {
    return `# Docker Security Best Practices:

# 1. Используйте минимальные образы:
FROM node:18-alpine    # Вместо node:latest
FROM nginx:alpine      # Вместо nginx:latest

# 2. Multi-stage builds для уменьшения размера:
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]

# 3. .dockerignore для исключения лишних файлов:
node_modules
.git
.env
*.log
Dockerfile

# 4. Ограничения ресурсов в docker-compose:
services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp`;
  }
  static getFrameworkEnvDocs(framework) {
    const docs = {
      vite: 'https://vitejs.dev/guide/env-and-mode.html',
      next: 'https://nextjs.org/docs/basic-features/environment-variables',
      webpack: 'https://webpack.js.org/plugins/define-plugin/',
      generic: 'https://12factor.net/config',
    };
    return docs[framework] || docs['generic'];
  }
}
exports.ConfigFixTemplates = ConfigFixTemplates;
//# sourceMappingURL=ConfigFixTemplates.js.map
