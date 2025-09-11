'use strict';
/**
 * WebSecurityFixTemplates - Шаблоны исправлений для веб-уязвимостей
 *
 * Phase 5.2.2 - Задача 1.2
 * Генерация практических рекомендаций для XSS, CSRF и других веб-уязвимостей
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebSecurityFixTemplates = void 0;
class WebSecurityFixTemplates {
  /**
   * Генерирует рекомендации для XSS уязвимостей
   */
  static generateXSSFixes(vulnerabilities) {
    const recommendations = [];
    for (const vuln of vulnerabilities) {
      switch (vuln.type) {
        case 'html_output':
          recommendations.push(this.createDangerousHTMLFix(vuln));
          break;
        case 'inner_html':
        case 'outer_html':
          recommendations.push(this.createUnsafeJSFix(vuln));
          break;
        case 'url_param':
          recommendations.push(this.createUnescapedInputFix(vuln));
          break;
        case 'dynamic_content':
          recommendations.push(this.createDOMManipulationFix(vuln));
          break;
        default:
          recommendations.push(this.createGenericXSSFix(vuln));
      }
    }
    return recommendations;
  }
  /**
   * Генерирует рекомендации для CSRF проблем
   */
  static generateCSRFFixes(issues) {
    const recommendations = [];
    for (const issue of issues) {
      switch (issue.type) {
        case 'form_no_token':
          recommendations.push(this.createUnprotectedFormFix(issue));
          break;
        case 'api_no_protection':
          recommendations.push(this.createMissingCSRFTokenFix(issue));
          break;
        case 'cookie_no_samesite':
          recommendations.push(this.createCookieSecurityFix(issue));
          break;
        case 'missing_middleware':
          recommendations.push(this.createStateChangingGETFix(issue));
          break;
        default:
          recommendations.push(this.createGenericCSRFFix(issue));
      }
    }
    return recommendations;
  }
  /**
   * Генерирует полный набор рекомендаций для веб-безопасности
   */
  static generateWebRecommendations(webSecurityResult) {
    const recommendations = [];
    // XSS рекомендации
    if (webSecurityResult.xss?.vulnerabilities?.length > 0) {
      recommendations.push(...this.generateXSSFixes(webSecurityResult.xss.vulnerabilities));
    }
    // CSRF рекомендации
    if (webSecurityResult.csrf?.issues?.length > 0) {
      recommendations.push(...this.generateCSRFFixes(webSecurityResult.csrf.issues));
    }
    // Добавляем общие рекомендации по веб-безопасности
    recommendations.push(
      ...this.generateGeneralWebSecurityRecommendations(webSecurityResult.summary)
    );
    // Сортируем по приоритету (критичность + количество проблем)
    return this.prioritizeRecommendations(recommendations);
  }
  // =================================================================
  // XSS FIX TEMPLATES
  // =================================================================
  static createDangerousHTMLFix(vuln) {
    return {
      id: `xss-dangerous-html-${vuln.line}`,
      title: 'Небезопасное использование {@html}',
      description: `В файле ${vuln.file} на строке ${vuln.line} используется {@html} без санитизации`,
      severity: vuln.severity,
      category: 'xss',
      priority: vuln.severity === 'critical' ? 10 : vuln.severity === 'high' ? 8 : 6,
      estimatedTime: '45 minutes',
      codeExample: {
        before: `{@html userInput}`,
        after: `{@html DOMPurify.sanitize(userInput)}`,
        description: 'Используйте DOMPurify для санитизации HTML перед выводом',
      },
      steps: [
        'Установите DOMPurify: npm install dompurify @types/dompurify',
        'Импортируйте в компонент: import DOMPurify from "dompurify"',
        'Замените {@html content} на {@html DOMPurify.sanitize(content)}',
        'Настройте белый список разрешенных тегов если нужно',
        'Протестируйте с различными входными данными',
      ],
      resources: [
        {
          title: 'DOMPurify Documentation',
          url: 'https://github.com/cure53/DOMPurify',
          type: 'documentation',
        },
        {
          title: 'Svelte Security Best Practices',
          url: 'https://svelte.dev/docs/svelte-components#security',
          type: 'documentation',
        },
      ],
      tags: ['xss', 'sanitization', 'dompurify', 'html'],
    };
  }
  static createUnsafeJSFix(vuln) {
    return {
      id: `xss-unsafe-js-${vuln.line}`,
      title: 'Небезопасное выполнение JavaScript',
      description: `Обнаружено потенциально небезопасное выполнение JS кода в ${vuln.file}:${vuln.line}`,
      severity: vuln.severity,
      category: 'xss',
      priority: vuln.severity === 'critical' ? 9 : 7,
      estimatedTime: '1 hour',
      codeExample: {
        before: `eval(userInput)
// или
new Function(userInput)()
// или
innerHTML = userInput`,
        after: `// Используйте безопасные альтернативы:
textContent = userInput // для текста
// или валидация + whitelist для кода`,
        description: 'Избегайте eval(), new Function() и innerHTML с пользовательскими данными',
      },
      steps: [
        'Найдите все места использования eval(), new Function(), innerHTML',
        'Замените innerHTML на textContent для текстового контента',
        'Для HTML используйте санитизацию через DOMPurify',
        'Для выполнения кода создайте whitelist разрешенных функций',
        'Добавьте валидацию входных данных',
      ],
      resources: [
        {
          title: 'JavaScript Security Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/Security',
          type: 'documentation',
        },
      ],
      tags: ['xss', 'javascript', 'eval', 'injection'],
    };
  }
  static createUnescapedInputFix(vuln) {
    return {
      id: `xss-unescaped-${vuln.line}`,
      title: 'Неэкранированный пользовательский ввод',
      description: `Пользовательский ввод выводится без экранирования в ${vuln.file}:${vuln.line}`,
      severity: vuln.severity,
      category: 'xss',
      priority: vuln.severity === 'critical' ? 8 : 6,
      estimatedTime: '30 minutes',
      codeExample: {
        before: `<div>{userInput}</div>`,
        after: `<div>{@html escapeHtml(userInput)}</div>
// или лучше:
<div>{userInput}</div> <!-- Svelte автоматически экранирует -->`,
        description: 'Svelte автоматически экранирует текст, но проверьте {@html} конструкции',
      },
      steps: [
        'Убедитесь что используете обычный {text} вместо {@html text}',
        'Если нужен HTML, используйте DOMPurify.sanitize()',
        'Добавьте валидацию входных данных на сервере',
        'Настройте Content Security Policy (CSP)',
        "Протестируйте с XSS payload'ами",
      ],
      resources: [
        {
          title: 'OWASP XSS Prevention Cheat Sheet',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
          type: 'documentation',
        },
      ],
      tags: ['xss', 'escaping', 'validation'],
    };
  }
  static createDOMManipulationFix(vuln) {
    return {
      id: `xss-dom-${vuln.line}`,
      title: 'Небезопасная манипуляция DOM',
      description: `Небезопасная манипуляция DOM обнаружена в ${vuln.file}:${vuln.line}`,
      severity: vuln.severity,
      category: 'xss',
      priority: 7,
      estimatedTime: '1 hour',
      codeExample: {
        before: `element.innerHTML = userInput;
document.write(userInput);`,
        after: `element.textContent = userInput;
// или для HTML:
element.innerHTML = DOMPurify.sanitize(userInput);`,
        description: 'Используйте textContent вместо innerHTML для текста',
      },
      steps: [
        'Замените innerHTML на textContent где возможно',
        'Для HTML контента используйте DOMPurify',
        'Избегайте document.write() полностью',
        'Используйте createElement() для динамических элементов',
        'Валидируйте все пользовательские данные',
      ],
      resources: [
        {
          title: 'DOM XSS Prevention',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html',
          type: 'documentation',
        },
      ],
      tags: ['xss', 'dom', 'manipulation'],
    };
  }
  static createGenericXSSFix(vuln) {
    return {
      id: `xss-generic-${vuln.line}`,
      title: 'Общая XSS уязвимость',
      description: `Потенциальная XSS уязвимость в ${vuln.file}:${vuln.line}`,
      severity: vuln.severity,
      category: 'xss',
      priority: 5,
      estimatedTime: '1 hour',
      steps: [
        'Проанализируйте контекст использования пользовательских данных',
        'Добавьте соответствующее экранирование или санитизацию',
        'Настройте Content Security Policy',
        'Проведите тестирование безопасности',
      ],
      resources: [
        {
          title: 'OWASP XSS Guide',
          url: 'https://owasp.org/www-community/attacks/xss/',
          type: 'documentation',
        },
      ],
      tags: ['xss', 'security'],
    };
  }
  // =================================================================
  // CSRF FIX TEMPLATES
  // =================================================================
  static createUnprotectedFormFix(issue) {
    return {
      id: `csrf-form-${issue.file}-${issue.line}`,
      title: 'Форма без CSRF защиты',
      description: `Форма в ${issue.file}:${issue.line} не защищена от CSRF атак`,
      severity: issue.severity,
      category: 'csrf',
      priority: issue.severity === 'high' ? 9 : 7,
      estimatedTime: '1 hour',
      codeExample: {
        before: `<form method="POST" action="/api/update">
  <input name="email" />
  <button type="submit">Update</button>
</form>`,
        after: `<form method="POST" action="/api/update">
  <input type="hidden" name="csrf_token" value={csrfToken} />
  <input name="email" />
  <button type="submit">Update</button>
</form>`,
        description: 'Добавьте CSRF токен в каждую форму',
      },
      steps: [
        'Установите CSRF middleware (например, csurf для Express)',
        'Генерируйте CSRF токен на сервере',
        'Передайте токен в шаблон/компонент',
        'Добавьте скрытое поле с токеном в форму',
        'Проверьте токен на сервере при обработке формы',
        'Протестируйте защиту',
      ],
      resources: [
        {
          title: 'OWASP CSRF Prevention Cheat Sheet',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
          type: 'documentation',
        },
        {
          title: 'SvelteKit CSRF Protection',
          url: 'https://kit.svelte.dev/docs/form-actions#csrf',
          type: 'documentation',
        },
      ],
      tags: ['csrf', 'forms', 'tokens'],
    };
  }
  static createMissingCSRFTokenFix(issue) {
    return {
      id: `csrf-token-${issue.file}-${issue.line}`,
      title: 'Отсутствует CSRF токен',
      description: `API endpoint в ${issue.file}:${issue.line} не проверяет CSRF токен`,
      severity: issue.severity,
      category: 'csrf',
      priority: 8,
      estimatedTime: '45 minutes',
      codeExample: {
        before: `// API route без CSRF проверки
export async function POST({ request }) {
  const data = await request.formData();
  // обработка без проверки токена
}`,
        after: `// API route с CSRF проверкой
export async function POST({ request, cookies }) {
  const token = cookies.get('csrf-token');
  const formToken = (await request.formData()).get('csrf_token');

  if (!token || token !== formToken) {
    throw error(403, 'Invalid CSRF token');
  }
  // безопасная обработка
}`,
        description: 'Добавьте проверку CSRF токена в API endpoints',
      },
      steps: [
        'Настройте генерацию CSRF токенов',
        'Добавьте проверку токена в middleware',
        'Обновите все state-changing endpoints',
        'Убедитесь что GET запросы не изменяют данные',
        'Протестируйте с различными токенами',
      ],
      resources: [
        {
          title: 'CSRF Token Patterns',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#token-based-mitigation',
          type: 'documentation',
        },
      ],
      tags: ['csrf', 'api', 'tokens', 'middleware'],
    };
  }
  static createCookieSecurityFix(issue) {
    return {
      id: `csrf-cookie-${issue.file}-${issue.line}`,
      title: 'Небезопасные настройки cookies',
      description: `Cookie в ${issue.file}:${issue.line} не имеет защитных флагов`,
      severity: issue.severity,
      category: 'csrf',
      priority: 7,
      estimatedTime: '30 minutes',
      codeExample: {
        before: `// Небезопасный cookie
cookies.set('session', sessionId);`,
        after: `// Безопасный cookie
cookies.set('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7 // 1 week
});`,
        description: 'Добавьте защитные флаги для всех cookies',
      },
      steps: [
        'Добавьте httpOnly: true для предотвращения XSS',
        'Используйте secure: true для HTTPS',
        'Установите sameSite: "strict" или "lax"',
        'Ограничьте время жизни cookies',
        'Проверьте все места установки cookies',
      ],
      resources: [
        {
          title: 'Cookie Security Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security',
          type: 'documentation',
        },
      ],
      tags: ['csrf', 'cookies', 'samesite', 'security'],
    };
  }
  static createStateChangingGETFix(issue) {
    return {
      id: `csrf-get-${issue.file}-${issue.line}`,
      title: 'GET запрос изменяет состояние',
      description: `GET запрос в ${issue.file}:${issue.line} изменяет данные, что делает возможными CSRF атаки`,
      severity: issue.severity,
      category: 'csrf',
      priority: 9,
      estimatedTime: '1 hour',
      codeExample: {
        before: `// Опасно: GET изменяет данные
<a href="/api/delete-user/{userId}">Delete User</a>`,
        after: `// Безопасно: POST с формой и CSRF токеном
<form method="POST" action="/api/delete-user">
  <input type="hidden" name="csrf_token" value={csrfToken} />
  <input type="hidden" name="userId" value={userId} />
  <button type="submit">Delete User</button>
</form>`,
        description: 'Используйте POST/PUT/DELETE для изменения данных',
      },
      steps: [
        'Измените все state-changing GET на POST/PUT/DELETE',
        'Добавьте CSRF защиту в формы',
        'Обновите клиентский код для использования форм',
        'Убедитесь что GET запросы только читают данные',
        'Обновите документацию API',
      ],
      resources: [
        {
          title: 'HTTP Methods Best Practices',
          url: 'https://restfulapi.net/http-methods/',
          type: 'documentation',
        },
      ],
      tags: ['csrf', 'http-methods', 'rest', 'api-design'],
    };
  }
  static createGenericCSRFFix(issue) {
    return {
      id: `csrf-generic-${issue.file}-${issue.line}`,
      title: 'Общая CSRF проблема',
      description: `Потенциальная CSRF уязвимость в ${issue.file}:${issue.line}`,
      severity: issue.severity,
      category: 'csrf',
      priority: 6,
      estimatedTime: '1 hour',
      steps: [
        'Проанализируйте контекст state-changing операций',
        'Добавьте соответствующую CSRF защиту',
        'Настройте SameSite cookies',
        'Проведите тестирование безопасности',
      ],
      resources: [
        {
          title: 'OWASP CSRF Guide',
          url: 'https://owasp.org/www-community/attacks/csrf',
          type: 'documentation',
        },
      ],
      tags: ['csrf', 'security'],
    };
  }
  // =================================================================
  // GENERAL WEB SECURITY
  // =================================================================
  static generateGeneralWebSecurityRecommendations(summary) {
    const recommendations = [];
    // Content Security Policy
    recommendations.push({
      id: 'web-csp-setup',
      title: 'Настройка Content Security Policy (CSP)',
      description: 'Добавьте CSP заголовки для предотвращения XSS атак',
      severity: 'high',
      category: 'config',
      priority: 8,
      estimatedTime: '2 hours',
      codeExample: {
        before: `// Без CSP заголовков`,
        after: `// В svelte.config.js или server config
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
};`,
        description: 'Настройте CSP для вашего приложения',
      },
      steps: [
        'Определите необходимые источники для scripts, styles, images',
        'Настройте CSP заголовки в server/middleware',
        'Постепенно ужесточайте политику',
        'Используйте CSP report-uri для мониторинга нарушений',
        'Тестируйте функциональность после каждого изменения',
      ],
      resources: [
        {
          title: 'CSP Quick Reference',
          url: 'https://content-security-policy.com/',
          type: 'documentation',
        },
      ],
      tags: ['csp', 'headers', 'xss-prevention'],
    });
    // Input Validation
    if ((summary.totalIssues || summary.totalVulnerabilities || 0) > 5) {
      recommendations.push({
        id: 'web-input-validation',
        title: 'Усиление валидации входных данных',
        description: 'Добавьте комплексную валидацию пользовательских данных',
        severity: 'high',
        category: 'config',
        priority: 7,
        estimatedTime: '3 hours',
        steps: [
          'Настройте схемы валидации (Zod, Yup, Joi)',
          'Валидируйте все входные данные на клиенте И сервере',
          'Добавьте санитизацию для HTML контента',
          'Настройте rate limiting для API endpoints',
          'Логируйте подозрительные запросы',
        ],
        resources: [
          {
            title: 'Input Validation Guide',
            url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
            type: 'documentation',
          },
        ],
        tags: ['validation', 'sanitization', 'api-security'],
      });
    }
    return recommendations;
  }
  // =================================================================
  // PRIORITIZATION & UTILITIES
  // =================================================================
  static prioritizeRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      // Сначала по priority (убывание)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Потом по severity
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      return bSeverity - aSeverity;
    });
  }
  /**
   * Группирует рекомендации по категориям для лучшего представления
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
   * Генерирует краткую сводку рекомендаций
   */
  static generateRecommendationsSummary(recommendations) {
    const critical = recommendations.filter(r => r.severity === 'critical').length;
    const high = recommendations.filter(r => r.severity === 'high').length;
    const topPriorities = recommendations.slice(0, 3);
    // Примерный расчет времени
    const totalMinutes = recommendations.reduce((sum, rec) => {
      const time = rec.estimatedTime;
      if (time.includes('hour')) {
        const hours = parseInt(time) || 1;
        return sum + hours * 60;
      } else if (time.includes('minute')) {
        const minutes = parseInt(time) || 30;
        return sum + minutes;
      }
      return sum + 60; // default 1 hour
    }, 0);
    const estimatedTotalTime =
      totalMinutes >= 60 ? `${Math.ceil(totalMinutes / 60)} hours` : `${totalMinutes} minutes`;
    return {
      total: recommendations.length,
      critical,
      high,
      estimatedTotalTime,
      topPriorities,
    };
  }
}
exports.WebSecurityFixTemplates = WebSecurityFixTemplates;
//# sourceMappingURL=WebSecurityFixTemplates.js.map
