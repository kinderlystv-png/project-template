'use strict';
/**
 * RecommendationEngine - Система практических рекомендаций по безопасности
 *
 * Phase 5.2.1: Создание системы конкретных fix templates
 * Phase 5.2.2: Интеграция веб-безопасности (XSS, CSRF)
 *
 * Преобразует найденные уязвимости в практические рекомендации
 * с примерами кода и пошаговыми инструкциями
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.RecommendationEngine = void 0;
const WebSecurityFixTemplates_js_1 = require('../checkers/security/WebSecurityFixTemplates.js');
class RecommendationEngine {
  /**
   * Генерирует детальную рекомендацию для конкретной уязвимости
   */
  static generateRecommendation(issueContext) {
    const { type, severity, details } = issueContext;
    // Определяем категорию и создаем рекомендацию
    if (type.includes('dependency') || type.includes('npm')) {
      return this.generateDependencyRecommendation(issueContext);
    } else if (type.includes('code') || type.includes('secret') || type.includes('unsafe')) {
      return this.generateCodeSecurityRecommendation(issueContext);
    } else if (type.includes('config') || type.includes('cors') || type.includes('env')) {
      return this.generateConfigRecommendation(issueContext);
    } else if (type.includes('xss') || type.includes('csrf') || type.includes('web')) {
      return this.generateWebSecurityRecommendation(issueContext);
    }
    // Fallback general recommendation
    return this.generateGeneralRecommendation(issueContext);
  }
  /**
   * Генерирует рекомендации для уязвимостей зависимостей
   */
  static generateDependencyRecommendation(context) {
    const { details } = context;
    if (context.type === 'outdated-dependency') {
      return {
        id: 'dep-outdated',
        title: 'Обновление устаревшей зависимости',
        description: `Пакет ${details.packageName} устарел и содержит известные уязвимости`,
        severity: details.severity || 'medium',
        category: 'dependencies',
        fixTemplate: {
          steps: [
            'Проверьте breaking changes в новой версии',
            'Обновите пакет до последней стабильной версии',
            'Запустите тесты для проверки совместимости',
            'Проверьте npm audit на новые уязвимости',
          ],
          commands: [
            `npm outdated ${details.packageName}`,
            `npm update ${details.packageName}`,
            'npm audit',
            'npm test',
          ],
          beforeCode: `"${details.packageName}": "${details.currentVersion}"`,
          afterCode: `"${details.packageName}": "${details.latestVersion}"`,
        },
        documentation: {
          links: [
            `https://www.npmjs.com/package/${details.packageName}`,
            'https://docs.npmjs.com/updating-packages-downloaded-from-the-registry',
          ],
          explanation: 'Устаревшие пакеты часто содержат исправленные уязвимости в новых версиях',
        },
        estimatedTime: '15-30 минут',
        difficulty: 'easy',
      };
    }
    if (context.type === 'critical-vulnerability') {
      return {
        id: 'dep-critical-vuln',
        title: 'Критическая уязвимость в зависимости',
        description: `Найдена критическая уязвимость в ${details.packageName}`,
        severity: 'critical',
        category: 'dependencies',
        fixTemplate: {
          steps: [
            'НЕМЕДЛЕННО обновите пакет',
            'Если обновление невозможно - найдите альтернативный пакет',
            'Проверьте все зависимые компоненты',
            'Запустите полное тестирование',
          ],
          commands: ['npm audit fix --force', `npm update ${details.packageName}`, 'npm audit'],
          codeExample: `
// Если автоматическое обновление невозможно:
// 1. Найдите альтернативу на npmjs.com
// 2. Или временно pin версию с workaround
"overrides": {
  "${details.packageName}": "${details.fixedVersion}"
}`,
        },
        documentation: {
          links: [
            `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${details.cveId}`,
            'https://snyk.io/vuln/npm',
          ],
          explanation: 'Критические уязвимости могут привести к компрометации системы',
        },
        estimatedTime: '1-2 часа',
        difficulty: 'medium',
      };
    }
    return this.generateGeneralRecommendation(context);
  }
  /**
   * Генерирует рекомендации для проблем безопасности кода
   */
  static generateCodeSecurityRecommendation(context) {
    const { details, file, line } = context;
    if (context.type === 'hardcoded-secret') {
      return {
        id: 'code-hardcoded-secret',
        title: 'Секрет в коде (hardcoded secret)',
        description: 'Найден секрет или API ключ, захардкоженный в коде',
        severity: 'critical',
        category: 'code',
        fixTemplate: {
          steps: [
            'Удалите секрет из кода немедленно',
            'Создайте переменную окружения',
            'Добавьте .env в .gitignore',
            'Ротируйте скомпрометированный секрет',
            'Используйте безопасное хранение секретов',
          ],
          beforeCode: `// ПЛОХО:
const API_KEY = "${details.secretValue}";
const config = {
  apiKey: "${details.secretValue}"
};`,
          afterCode: `// ХОРОШО:
const API_KEY = process.env.API_KEY;
const config = {
  apiKey: process.env.API_KEY
};

// .env файл:
API_KEY=your_secret_key_here`,
          commands: [
            'echo "API_KEY=your_secret_key_here" >> .env',
            'echo ".env" >> .gitignore',
            'git add .gitignore',
            'git commit -m "Add .env to gitignore"',
          ],
        },
        documentation: {
          links: [
            'https://12factor.net/config',
            'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials',
          ],
          explanation: 'Секреты в коде могут быть скомпрометированы через Git историю',
        },
        estimatedTime: '20-40 минут',
        difficulty: 'easy',
      };
    }
    if (context.type === 'unsafe-function') {
      return {
        id: 'code-unsafe-function',
        title: 'Небезопасная функция',
        description: `Использование небезопасной функции: ${details.functionName}`,
        severity: details.severity || 'high',
        category: 'code',
        fixTemplate: {
          steps: [
            'Замените небезопасную функцию на безопасную альтернативу',
            'Добавьте валидацию входных данных',
            'Используйте санитизацию для пользовательского ввода',
          ],
          beforeCode: this.getUnsafeFunctionExample(details.functionName, 'before'),
          afterCode: this.getUnsafeFunctionExample(details.functionName, 'after'),
          codeExample: this.getUnsafeFunctionExample(details.functionName, 'explanation'),
        },
        documentation: {
          links: [
            'https://owasp.org/www-community/vulnerabilities/',
            'https://nodejs.org/en/docs/guides/security/',
          ],
          explanation: 'Небезопасные функции могут привести к XSS, injection атакам',
        },
        estimatedTime: '30-60 минут',
        difficulty: 'medium',
      };
    }
    return this.generateGeneralRecommendation(context);
  }
  /**
   * Генерирует рекомендации для проблем конфигурации
   */
  static generateConfigRecommendation(context) {
    const { details } = context;
    if (context.type === 'cors-misconfiguration') {
      return {
        id: 'config-cors',
        title: 'Неправильная настройка CORS',
        description: 'CORS настроен слишком permissive для production',
        severity: 'high',
        category: 'config',
        fixTemplate: {
          steps: [
            'Ограничьте allowed origins до конкретных доменов',
            'Удалите wildcard (*) в production',
            'Настройте credentials handling правильно',
            'Добавьте проверку окружения',
          ],
          beforeCode: `// ПЛОХО - слишком открытый CORS:
app.use(cors({
  origin: '*',
  credentials: true
}));`,
          afterCode: `// ХОРОШО - ограниченный CORS:
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://yourdomain.com', 'https://app.yourdomain.com']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));`,
        },
        documentation: {
          links: [
            'https://owasp.org/www-community/attacks/csrf',
            'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
          ],
          explanation: 'Неправильный CORS может привести к CSRF атакам',
        },
        estimatedTime: '15-30 минут',
        difficulty: 'easy',
      };
    }
    if (context.type === 'env-exposure') {
      return {
        id: 'config-env-exposure',
        title: 'Exposure переменных окружения',
        description: 'Секретные переменные могут быть доступны на клиенте',
        severity: 'medium',
        category: 'config',
        fixTemplate: {
          steps: [
            'Проверьте какие env переменные экспортируются в клиент',
            'Используйте префиксы для public переменных',
            'Переместите секреты в server-only переменные',
            'Настройте правильную фильтрацию в bundler',
          ],
          beforeCode: `// ПЛОХО - секреты доступны клиенту:
const config = {
  apiKey: process.env.SECRET_API_KEY,
  dbPassword: process.env.DB_PASSWORD
};`,
          afterCode: `// ХОРОШО - разделение public/private:
// client.config.js
const publicConfig = {
  apiUrl: process.env.PUBLIC_API_URL,
  appName: process.env.PUBLIC_APP_NAME
};

// server.config.js
const privateConfig = {
  secretKey: process.env.SECRET_API_KEY,
  dbPassword: process.env.DB_PASSWORD
};`,
        },
        documentation: {
          links: [
            'https://vitejs.dev/guide/env-and-mode.html',
            'https://nextjs.org/docs/basic-features/environment-variables',
          ],
          explanation: 'Клиентский код может быть проинспектирован пользователями',
        },
        estimatedTime: '30-45 минут',
        difficulty: 'medium',
      };
    }
    return this.generateGeneralRecommendation(context);
  }
  /**
   * Генерирует общую рекомендацию для неизвестных типов
   */
  static generateGeneralRecommendation(context) {
    return {
      id: 'general-security',
      title: 'Общая рекомендация по безопасности',
      description: `Обнаружена потенциальная проблема безопасности: ${context.type}`,
      severity: context.severity || 'medium',
      category: 'code',
      fixTemplate: {
        steps: [
          'Изучите детали найденной проблемы',
          'Проконсультируйтесь с документацией по безопасности',
          'Примените best practices для вашего случая',
          'Протестируйте исправление',
        ],
      },
      documentation: {
        links: ['https://owasp.org/www-project-top-ten/', 'https://cheatsheetseries.owasp.org/'],
        explanation: 'Следуйте общим принципам безопасной разработки',
      },
      estimatedTime: '1-2 часа',
      difficulty: 'medium',
    };
  }
  /**
   * Генерирует рекомендации для веб-безопасности (XSS, CSRF)
   */
  static generateWebSecurityRecommendation(context) {
    const { details, type } = context;
    // Конвертируем из WebSecurityRecommendation в SecurityRecommendation
    if (details.webRecommendation) {
      const webRec = details.webRecommendation;
      return {
        id: webRec.id,
        title: webRec.title,
        description: webRec.description,
        severity: webRec.severity,
        category: webRec.category,
        priority: webRec.priority,
        fixTemplate: {
          steps: webRec.steps,
          beforeCode: webRec.codeExample?.before,
          afterCode: webRec.codeExample?.after,
          codeExample: webRec.codeExample?.description,
        },
        documentation: {
          links: webRec.resources.map(r => r.url),
          explanation: webRec.description,
        },
        estimatedTime: webRec.estimatedTime,
        difficulty: this.mapWebDifficulty(webRec.estimatedTime),
        tags: webRec.tags,
      };
    }
    // Fallback для веб-уязвимостей без готовой рекомендации
    if (type.includes('xss')) {
      return {
        id: 'web-xss-generic',
        title: 'XSS уязвимость',
        description: 'Обнаружена потенциальная XSS уязвимость',
        severity: context.severity || 'medium',
        category: 'xss',
        fixTemplate: {
          steps: [
            'Проанализируйте контекст пользовательского ввода',
            'Добавьте соответствующее экранирование или санитизацию',
            'Настройте Content Security Policy',
            "Протестируйте с XSS payload'ами",
          ],
        },
        documentation: {
          links: ['https://owasp.org/www-community/attacks/xss/'],
          explanation: 'XSS позволяет выполнить вредоносный код в браузере пользователя',
        },
        estimatedTime: '1-2 hours',
        difficulty: 'medium',
      };
    }
    if (type.includes('csrf')) {
      return {
        id: 'web-csrf-generic',
        title: 'CSRF уязвимость',
        description: 'Обнаружена потенциальная CSRF уязвимость',
        severity: context.severity || 'medium',
        category: 'csrf',
        fixTemplate: {
          steps: [
            'Добавьте CSRF токены в формы',
            'Настройте SameSite cookies',
            'Проверьте Referer заголовки',
            'Используйте POST вместо GET для изменения состояния',
          ],
        },
        documentation: {
          links: ['https://owasp.org/www-community/attacks/csrf'],
          explanation: 'CSRF позволяет выполнить действия от имени пользователя без его ведома',
        },
        estimatedTime: '1-2 hours',
        difficulty: 'medium',
      };
    }
    return this.generateGeneralRecommendation(context);
  }
  /**
   * Преобразует время веб-рекомендации в сложность
   */
  static mapWebDifficulty(estimatedTime) {
    if (estimatedTime.includes('30 minutes') || estimatedTime.includes('15 minutes')) {
      return 'easy';
    } else if (estimatedTime.includes('hour') && !estimatedTime.includes('2 hour')) {
      return 'medium';
    } else {
      return 'hard';
    }
  }
  /**
   * Генерирует рекомендации для веб-безопасности на основе WebSecurityResult
   */
  static generateWebRecommendations(webResult) {
    const recommendations = [];
    // Получаем рекомендации из WebSecurityFixTemplates
    const webRecommendations =
      WebSecurityFixTemplates_js_1.WebSecurityFixTemplates.generateWebRecommendations(webResult);
    // Конвертируем каждую веб-рекомендацию в SecurityRecommendation
    webRecommendations.forEach(webRec => {
      const securityRec = {
        id: webRec.id,
        title: webRec.title,
        description: webRec.description,
        severity: webRec.severity,
        category: webRec.category,
        priority: webRec.priority,
        fixTemplate: {
          steps: webRec.steps,
          beforeCode: webRec.codeExample?.before,
          afterCode: webRec.codeExample?.after,
          codeExample: webRec.codeExample?.description,
        },
        documentation: {
          links: webRec.resources.map(r => r.url),
          explanation: webRec.description,
        },
        estimatedTime: webRec.estimatedTime,
        difficulty: this.mapWebDifficulty(webRec.estimatedTime),
        tags: webRec.tags,
      };
      recommendations.push(securityRec);
    });
    return recommendations;
  }
  /**
   * Возвращает примеры кода для небезопасных функций
   */
  static getUnsafeFunctionExample(functionName, type) {
    const examples = {
      eval: {
        before: '// ПЛОХО:\nconst result = eval(userInput);',
        after:
          '// ХОРОШО:\nconst result = JSON.parse(userInput); // для JSON\n// или используйте безопасную альтернативу',
        explanation: 'eval() выполняет произвольный код и крайне опасен',
      },
      innerHTML: {
        before: '// ПЛОХО:\nelement.innerHTML = userInput;',
        after:
          '// ХОРОШО:\nelement.textContent = userInput;\n// или используйте DOMPurify для HTML',
        explanation: 'innerHTML может выполнить XSS атаки',
      },
      'document.write': {
        before: '// ПЛОХО:\ndocument.write(userContent);',
        after:
          "// ХОРОШО:\nconst element = document.createElement('div');\nelement.textContent = userContent;",
        explanation: 'document.write может переписать всю страницу',
      },
    };
    return (
      examples[functionName]?.[type] || `// Замените ${functionName} на безопасную альтернативу`
    );
  }
  /**
   * Реализация метода с перегрузками
   */
  static generateRecommendations(input) {
    // Если это WebSecurityResult, используем специальный метод
    if (
      input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      'xss' in input &&
      'csrf' in input
    ) {
      return this.generateWebRecommendations(input);
    }
    // Иначе обрабатываем как массив IssueContext
    return input.map(issue => this.generateRecommendation(issue));
  }
  /**
   * Группирует рекомендации по категориям
   */
  static groupRecommendationsByCategory(recommendations) {
    return recommendations.reduce((groups, rec) => {
      if (!groups[rec.category]) {
        groups[rec.category] = [];
      }
      groups[rec.category].push(rec);
      return groups;
    }, {});
  }
  /**
   * Сортирует рекомендации по приоритету
   */
  static sortByPriority(recommendations) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }
}
exports.RecommendationEngine = RecommendationEngine;
//# sourceMappingURL=RecommendationEngine.js.map
