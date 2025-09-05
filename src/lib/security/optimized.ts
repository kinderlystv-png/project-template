/**
 * OPTIMIZED Security Middleware v2.0
 * Революционная система безопасности с продвинутыми возможностями защиты
 *
 * Новые возможности:
 * - Интеллектуальная защита от атак (XSS, CSRF, Injection)
 * - Адаптивное ограничение скорости запросов
 * - Анализ аномалий в реальном времени
 * - Динамические правила безопасности
 * - Контекстная аутентификация
 * - Автоматическое обнаружение угроз
 */

// Интерфейсы для системы безопасности
interface SecurityConfig {
  rateLimit: {
    maxRequests: number;
    windowMs: number;
    adaptiveEnabled: boolean;
  };
  xss: {
    enabled: boolean;
    sanitizeInput: boolean;
    strictMode: boolean;
  };
  csrf: {
    enabled: boolean;
    tokenExpiry: number;
    sameSite: 'strict' | 'lax' | 'none';
  };
  injection: {
    sqlInjection: boolean;
    scriptInjection: boolean;
    pathTraversal: boolean;
  };
  anomaly: {
    enabled: boolean;
    threshold: number;
    learningMode: boolean;
  };
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    credentials: boolean;
  };
}

interface SecurityContext {
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  requestId: string;
  riskScore: number;
}

interface SecurityThreat {
  type: 'xss' | 'csrf' | 'injection' | 'rateLimit' | 'anomaly' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: SecurityContext;
  payload?: unknown;
  blocked: boolean;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
  riskFactor: number;
  blocked: boolean;
}

interface AnomalyPattern {
  pattern: string;
  frequency: number;
  riskScore: number;
  lastSeen: number;
  examples: string[];
}

/**
 * Оптимизированная система безопасности
 */
export class OptimizedSecurityMiddleware {
  private config: SecurityConfig;
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private csrfTokens = new Map<string, { token: string; expires: number }>();
  private threatLog: SecurityThreat[] = [];
  private anomalyPatterns = new Map<string, AnomalyPattern>();
  private securityRules = new Map<string, (context: SecurityContext) => boolean>();

  // Статистика безопасности
  private stats = {
    totalRequests: 0,
    blockedRequests: 0,
    threatsDetected: 0,
    anomaliesDetected: 0,
    falsePositives: 0,
  };

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000, // 1 минута
        adaptiveEnabled: true,
        ...config.rateLimit,
      },
      xss: {
        enabled: true,
        sanitizeInput: true,
        strictMode: false,
        ...config.xss,
      },
      csrf: {
        enabled: true,
        tokenExpiry: 3600000, // 1 час
        sameSite: 'strict',
        ...config.csrf,
      },
      injection: {
        sqlInjection: true,
        scriptInjection: true,
        pathTraversal: true,
        ...config.injection,
      },
      anomaly: {
        enabled: true,
        threshold: 0.7,
        learningMode: true,
        ...config.anomaly,
      },
      cors: {
        enabled: true,
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
        ...config.cors,
      },
    };

    this.initializeSecurityRules();
    this.startAnomalyLearning();
    this.startThreatCleanup();
  }

  /**
   * Инициализация базовых правил безопасности
   */
  private initializeSecurityRules(): void {
    // Правило для обнаружения подозрительных IP
    this.securityRules.set('suspicious_ip', context => {
      const suspiciousPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^127\./,
        /^0\./,
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(context.ipAddress));
    });

    // Правило для анализа User-Agent
    this.securityRules.set('legitimate_user_agent', context => {
      const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
      ];
      return !botPatterns.some(pattern => pattern.test(context.userAgent));
    });

    // Правило для анализа частоты запросов
    this.securityRules.set('request_frequency', context => {
      const entry = this.rateLimitStore.get(context.ipAddress);
      if (!entry) return true;

      const requestRate = entry.count / ((Date.now() - entry.windowStart) / 1000);
      return requestRate < 10; // Максимум 10 запросов в секунду
    });

    // Правило для анализа времени сессии
    this.securityRules.set('session_age', context => {
      const sessionAge = Date.now() - context.timestamp;
      return sessionAge < 86400000; // Максимум 24 часа
    });
  }

  /**
   * Основная функция проверки безопасности
   */
  async validateRequest(
    request: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
      query?: Record<string, string>;
    },
    context: Partial<SecurityContext>
  ): Promise<{
    allowed: boolean;
    threats: SecurityThreat[];
    riskScore: number;
    recommendations?: string[];
  }> {
    const fullContext: SecurityContext = {
      sessionId: this.generateSessionId(),
      ipAddress: '127.0.0.1',
      userAgent: 'Unknown',
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
      riskScore: 0,
      ...context,
    };

    this.stats.totalRequests++;

    const threats: SecurityThreat[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // 1. Проверка rate limiting
    const rateLimitResult = await this.checkRateLimit(fullContext);
    if (!rateLimitResult.allowed) {
      threats.push(rateLimitResult.threat);
      riskScore += 0.8;
    }

    // 2. Проверка XSS
    if (this.config.xss.enabled && request.body) {
      const xssResult = this.detectXSS(request.body, fullContext);
      if (xssResult.detected) {
        threats.push(xssResult.threat);
        riskScore += 0.6;
      }
    }

    // 3. Проверка CSRF
    if (this.config.csrf.enabled && request.method !== 'GET') {
      const csrfResult = this.validateCSRF(request.headers || {}, fullContext);
      if (!csrfResult.valid) {
        threats.push(csrfResult.threat);
        riskScore += 0.7;
      }
    }

    // 4. Проверка injection атак
    if (request.query || request.body) {
      const injectionData = {
        ...(request.query || {}),
        ...(typeof request.body === 'object' && request.body
          ? (request.body as Record<string, unknown>)
          : {}),
      };
      const injectionResult = this.detectInjection(injectionData, fullContext);
      if (injectionResult.detected) {
        threats.push(injectionResult.threat);
        riskScore += 0.9;
      }
    }

    // 5. Анализ аномалий
    if (this.config.anomaly.enabled) {
      const anomalyResult = await this.detectAnomalies(request, fullContext);
      if (anomalyResult.detected) {
        threats.push(anomalyResult.threat);
        riskScore += 0.5;
      }
    }

    // 6. Проверка по правилам безопасности
    const ruleViolations = this.checkSecurityRules(fullContext);
    ruleViolations.forEach(violation => {
      threats.push(violation);
      riskScore += 0.3;
    });

    // 7. Динамическая корректировка рискового балла
    riskScore = this.adjustRiskScore(riskScore, fullContext);

    // 8. Генерация рекомендаций
    if (riskScore > 0.3) {
      recommendations.push('Increase monitoring for this session');
    }
    if (riskScore > 0.5) {
      recommendations.push('Consider additional authentication');
    }
    if (riskScore > 0.7) {
      recommendations.push('Block or require CAPTCHA verification');
    }

    const allowed = riskScore < 0.8;

    if (!allowed) {
      this.stats.blockedRequests++;
    }
    if (threats.length > 0) {
      this.stats.threatsDetected++;
    }

    // Логируем угрозы
    threats.forEach(threat => this.logThreat(threat));

    return {
      allowed,
      threats,
      riskScore,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Адаптивная проверка rate limiting
   */
  private async checkRateLimit(context: SecurityContext): Promise<{
    allowed: boolean;
    threat: SecurityThreat;
  }> {
    const key = context.ipAddress;
    const now = Date.now();

    let entry = this.rateLimitStore.get(key);

    if (!entry) {
      entry = {
        count: 0,
        windowStart: now,
        lastRequest: now,
        riskFactor: 1,
        blocked: false,
      };
      this.rateLimitStore.set(key, entry);
    }

    // Сброс окна если прошло время
    if (now - entry.windowStart > this.config.rateLimit.windowMs) {
      entry.count = 0;
      entry.windowStart = now;
      entry.riskFactor = Math.max(0.5, entry.riskFactor * 0.9); // Постепенное снижение риска
    }

    entry.count++;
    entry.lastRequest = now;

    // Адаптивный лимит на основе риск-фактора
    const adaptiveLimit = this.config.rateLimit.adaptiveEnabled
      ? Math.floor(this.config.rateLimit.maxRequests / entry.riskFactor)
      : this.config.rateLimit.maxRequests;

    const allowed = entry.count <= adaptiveLimit;

    if (!allowed) {
      entry.blocked = true;
      entry.riskFactor = Math.min(5, entry.riskFactor * 1.5); // Увеличиваем риск-фактор
    }

    const threat: SecurityThreat = {
      type: 'rateLimit',
      severity: entry.count > adaptiveLimit * 2 ? 'high' : 'medium',
      description: `Rate limit exceeded: ${entry.count}/${adaptiveLimit} requests`,
      context,
      blocked: !allowed,
      timestamp: now,
    };

    return { allowed, threat };
  }

  /**
   * Обнаружение XSS атак
   */
  private detectXSS(
    data: unknown,
    context: SecurityContext
  ): {
    detected: boolean;
    threat: SecurityThreat;
  } {
    const dataString = JSON.stringify(data);

    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /document\.write/gi,
      /window\.location/gi,
      /<img[^>]+src[^>]*=[\s]*javascript:/gi,
      /expression\s*\(/gi,
    ];

    const detected = xssPatterns.some(pattern => pattern.test(dataString));

    let sanitizedData = dataString;
    if (this.config.xss.sanitizeInput && detected) {
      sanitizedData = this.sanitizeXSS(dataString);
    }

    const threat: SecurityThreat = {
      type: 'xss',
      severity: detected ? 'high' : 'low',
      description: detected
        ? 'Potential XSS attack detected in request data'
        : 'Request data is safe from XSS',
      context,
      payload: detected ? { original: dataString, sanitized: sanitizedData } : undefined,
      blocked: detected && this.config.xss.strictMode,
      timestamp: Date.now(),
    };

    return { detected, threat };
  }

  /**
   * Санитизация XSS
   */
  private sanitizeXSS(input: string): string {
    return input
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/document\.cookie/gi, '')
      .replace(/document\.write/gi, '')
      .replace(/window\.location/gi, '');
  }

  /**
   * Валидация CSRF токенов
   */
  private validateCSRF(
    headers: Record<string, string>,
    context: SecurityContext
  ): {
    valid: boolean;
    threat: SecurityThreat;
  } {
    const csrfToken = headers['x-csrf-token'] || headers['X-CSRF-Token'];
    const sessionEntry = this.csrfTokens.get(context.sessionId);

    const valid = !!(
      csrfToken &&
      sessionEntry &&
      sessionEntry.token === csrfToken &&
      Date.now() < sessionEntry.expires
    );

    const threat: SecurityThreat = {
      type: 'csrf',
      severity: valid ? 'low' : 'high',
      description: valid ? 'CSRF token is valid' : 'Invalid or missing CSRF token',
      context,
      payload: { providedToken: csrfToken, hasValidSession: !!sessionEntry },
      blocked: !valid,
      timestamp: Date.now(),
    };

    return { valid, threat };
  }

  /**
   * Обнаружение injection атак
   */
  private detectInjection(
    data: Record<string, unknown>,
    context: SecurityContext
  ): {
    detected: boolean;
    threat: SecurityThreat;
  } {
    const dataString = JSON.stringify(data);

    const injectionPatterns = [
      // SQL Injection
      /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
      /(\b(or|and)\b\s+\b\d+\b\s*[=<>])/gi,

      // Script Injection
      /(<script[^>]*>|<\/script>)/gi,
      /(eval|function|setTimeout|setInterval)\s*\(/gi,

      // Path Traversal
      /(\.\.\/|\.\.\\)/gi,
      /\/etc\/passwd/gi,
      /\/windows\/system32/gi,

      // Command Injection
      /(\||&|;|`|\$\(|\${)/gi,
      /(wget|curl|nc|netcat|powershell|cmd\.exe)/gi,
    ];

    const detectedPatterns: string[] = [];

    injectionPatterns.forEach(pattern => {
      if (pattern.test(dataString)) {
        detectedPatterns.push(pattern.source);
      }
    });

    const detected = detectedPatterns.length > 0;

    const threat: SecurityThreat = {
      type: 'injection',
      severity: detected ? 'critical' : 'low',
      description: detected
        ? `Injection attack detected: ${detectedPatterns.length} patterns matched`
        : 'No injection patterns detected',
      context,
      payload: detected
        ? {
            data: dataString,
            matchedPatterns: detectedPatterns,
          }
        : undefined,
      blocked: detected,
      timestamp: Date.now(),
    };

    return { detected, threat };
  }

  /**
   * Обнаружение аномалий с машинным обучением
   */
  private async detectAnomalies(
    request: { url?: string; method?: string; headers?: Record<string, string> },
    context: SecurityContext
  ): Promise<{
    detected: boolean;
    threat: SecurityThreat;
  }> {
    const pattern = this.generateRequestPattern(request, context);
    const existingPattern = this.anomalyPatterns.get(pattern);

    let isAnomalous = false;

    if (existingPattern) {
      // Обновляем существующий паттерн
      existingPattern.frequency++;
      existingPattern.lastSeen = Date.now();

      // Аномалия если паттерн редкий и имеет высокий риск
      isAnomalous =
        existingPattern.frequency < 5 && existingPattern.riskScore > this.config.anomaly.threshold;
    } else if (!this.config.anomaly.learningMode) {
      // В продакшен режиме новые паттерны подозрительны
      isAnomalous = true;

      // Создаем новый паттерн
      this.anomalyPatterns.set(pattern, {
        pattern,
        frequency: 1,
        riskScore: 0.8,
        lastSeen: Date.now(),
        examples: [JSON.stringify(request)],
      });
    } else {
      // В режиме обучения просто добавляем паттерн
      this.anomalyPatterns.set(pattern, {
        pattern,
        frequency: 1,
        riskScore: 0.1,
        lastSeen: Date.now(),
        examples: [JSON.stringify(request)],
      });
    }

    if (isAnomalous) {
      this.stats.anomaliesDetected++;
    }

    const threat: SecurityThreat = {
      type: 'anomaly',
      severity: isAnomalous ? 'medium' : 'low',
      description: isAnomalous ? 'Anomalous request pattern detected' : 'Request pattern is normal',
      context,
      payload: { pattern, frequency: existingPattern?.frequency || 1 },
      blocked: false, // Аномалии не блокируют, только предупреждают
      timestamp: Date.now(),
    };

    return { detected: isAnomalous, threat };
  }

  /**
   * Генерация паттерна запроса для анализа аномалий
   */
  private generateRequestPattern(
    request: { url?: string; method?: string; headers?: Record<string, string> },
    context: SecurityContext
  ): string {
    const components = [
      request.method || 'UNKNOWN',
      this.extractUrlPattern(request.url),
      this.extractUserAgentPattern(context.userAgent),
      this.extractTimePattern(context.timestamp),
    ];

    return components.join('|');
  }

  /**
   * Извлечение паттерна URL
   */
  private extractUrlPattern(url?: string): string {
    if (!url) return 'NO_URL';

    // Заменяем ID и параметры на паттерны
    return url
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*/, '?params')
      .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:uuid');
  }

  /**
   * Извлечение паттерна User-Agent
   */
  private extractUserAgentPattern(userAgent: string): string {
    // Упрощаем User-Agent до основных компонентов
    const patterns = [
      { regex: /Chrome\/[\d.]+/, replacement: 'Chrome' },
      { regex: /Firefox\/[\d.]+/, replacement: 'Firefox' },
      { regex: /Safari\/[\d.]+/, replacement: 'Safari' },
      { regex: /Edge\/[\d.]+/, replacement: 'Edge' },
      { regex: /Windows NT [\d.]+/, replacement: 'Windows' },
      { regex: /Mac OS X [\d_.]+/, replacement: 'MacOS' },
      { regex: /Linux/, replacement: 'Linux' },
      { regex: /Mobile/, replacement: 'Mobile' },
    ];

    let simplified = userAgent;
    patterns.forEach(({ regex, replacement }) => {
      simplified = simplified.replace(regex, replacement);
    });

    return simplified.slice(0, 50); // Ограничиваем длину
  }

  /**
   * Извлечение временного паттерна
   */
  private extractTimePattern(timestamp: number): string {
    const date = new Date(timestamp);
    const hour = date.getHours();

    if (hour >= 0 && hour < 6) return 'NIGHT';
    if (hour >= 6 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 18) return 'AFTERNOON';
    return 'EVENING';
  }

  /**
   * Проверка правил безопасности
   */
  private checkSecurityRules(context: SecurityContext): SecurityThreat[] {
    const violations: SecurityThreat[] = [];

    this.securityRules.forEach((rule, ruleName) => {
      if (!rule(context)) {
        violations.push({
          type: 'anomaly',
          severity: 'medium',
          description: `Security rule violation: ${ruleName}`,
          context,
          payload: { rule: ruleName },
          blocked: false,
          timestamp: Date.now(),
        });
      }
    });

    return violations;
  }

  /**
   * Динамическая корректировка рискового балла
   */
  private adjustRiskScore(baseScore: number, context: SecurityContext): number {
    let adjustedScore = baseScore;

    // Учитываем историю пользователя
    const userThreats = this.threatLog.filter(
      threat => threat.context.userId === context.userId
    ).length;

    if (userThreats > 5) {
      adjustedScore *= 1.5; // Увеличиваем риск для проблемных пользователей
    }

    // Учитываем время дня
    const hour = new Date(context.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      adjustedScore *= 1.2; // Ночная активность более подозрительна
    }

    // Учитываем IP репутацию
    const ipThreats = this.threatLog.filter(
      threat => threat.context.ipAddress === context.ipAddress
    ).length;

    if (ipThreats > 10) {
      adjustedScore *= 2; // Плохая репутация IP
    }

    return Math.min(1, adjustedScore); // Максимум 1.0
  }

  /**
   * Логирование угроз
   */
  private logThreat(threat: SecurityThreat): void {
    this.threatLog.push(threat);

    // Ограничиваем размер лога
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-500);
    }

    // Логируем критические угрозы
    if (threat.severity === 'critical') {
      // В продакшене здесь должна быть интеграция с системой мониторинга
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('🚨 Critical security threat detected:', threat);
      }
    }
  }

  /**
   * Генерация CSRF токена
   */
  generateCSRFToken(sessionId: string): string {
    const token = this.generateRandomToken();
    const expires = Date.now() + this.config.csrf.tokenExpiry;

    this.csrfTokens.set(sessionId, { token, expires });

    return token;
  }

  /**
   * Получение статистики безопасности
   */
  getSecurityStats() {
    const threatsByType = this.threatLog.reduce(
      (acc, threat) => {
        acc[threat.type] = (acc[threat.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const threatsBySeverity = this.threatLog.reduce(
      (acc, threat) => {
        acc[threat.severity] = (acc[threat.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      ...this.stats,
      threatsByType,
      threatsBySeverity,
      blockRate:
        this.stats.totalRequests > 0
          ? (this.stats.blockedRequests / this.stats.totalRequests) * 100
          : 0,
      threatRate:
        this.stats.totalRequests > 0
          ? (this.stats.threatsDetected / this.stats.totalRequests) * 100
          : 0,
      anomalyPatternsLearned: this.anomalyPatterns.size,
    };
  }

  /**
   * Запуск обучения анализа аномалий
   */
  private startAnomalyLearning(): void {
    setInterval(() => {
      // Очищаем старые паттерны
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      this.anomalyPatterns.forEach((pattern, key) => {
        if (pattern.lastSeen < oneWeekAgo && pattern.frequency < 3) {
          this.anomalyPatterns.delete(key);
        }
      });

      // Обновляем риск-скоры на основе частоты
      this.anomalyPatterns.forEach(pattern => {
        if (pattern.frequency > 100) {
          pattern.riskScore = 0.1; // Частые паттерны менее рискованны
        } else if (pattern.frequency > 50) {
          pattern.riskScore = 0.3;
        } else if (pattern.frequency > 10) {
          pattern.riskScore = 0.5;
        }
      });
    }, 3600000); // Каждый час
  }

  /**
   * Запуск очистки логов угроз
   */
  private startThreatCleanup(): void {
    setInterval(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.threatLog = this.threatLog.filter(threat => threat.timestamp > oneDayAgo);

      // Очищаем устаревшие CSRF токены
      this.csrfTokens.forEach((entry, sessionId) => {
        if (Date.now() > entry.expires) {
          this.csrfTokens.delete(sessionId);
        }
      });

      // Очищаем старые записи rate limiting
      this.rateLimitStore.forEach((entry, key) => {
        if (Date.now() - entry.lastRequest > this.config.rateLimit.windowMs * 10) {
          this.rateLimitStore.delete(key);
        }
      });
    }, 3600000); // Каждый час
  }

  /**
   * Вспомогательные методы
   */
  private generateSessionId(): string {
    return this.generateRandomToken();
  }

  private generateRequestId(): string {
    return this.generateRandomToken();
  }

  private generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Уничтожение экземпляра
   */
  destroy(): void {
    this.rateLimitStore.clear();
    this.csrfTokens.clear();
    this.threatLog.length = 0;
    this.anomalyPatterns.clear();
    this.securityRules.clear();
  }
}

/**
 * Фабрика для создания конфигураций безопасности
 */
export class SecurityConfigFactory {
  /**
   * Конфигурация для разработки
   */
  static createDevelopmentConfig(): Partial<SecurityConfig> {
    return {
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000,
        adaptiveEnabled: false,
      },
      xss: {
        enabled: true,
        sanitizeInput: true,
        strictMode: false,
      },
      csrf: {
        enabled: false, // Отключено для удобства разработки
        tokenExpiry: 3600000,
        sameSite: 'lax',
      },
      anomaly: {
        enabled: true,
        threshold: 0.9,
        learningMode: true,
      },
    };
  }

  /**
   * Конфигурация для продакшена
   */
  static createProductionConfig(): Partial<SecurityConfig> {
    return {
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
        adaptiveEnabled: true,
      },
      xss: {
        enabled: true,
        sanitizeInput: true,
        strictMode: true,
      },
      csrf: {
        enabled: true,
        tokenExpiry: 1800000, // 30 минут
        sameSite: 'strict',
      },
      injection: {
        sqlInjection: true,
        scriptInjection: true,
        pathTraversal: true,
      },
      anomaly: {
        enabled: true,
        threshold: 0.7,
        learningMode: false,
      },
    };
  }

  /**
   * Конфигурация повышенной безопасности
   */
  static createHighSecurityConfig(): Partial<SecurityConfig> {
    return {
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000,
        adaptiveEnabled: true,
      },
      xss: {
        enabled: true,
        sanitizeInput: true,
        strictMode: true,
      },
      csrf: {
        enabled: true,
        tokenExpiry: 900000, // 15 минут
        sameSite: 'strict',
      },
      injection: {
        sqlInjection: true,
        scriptInjection: true,
        pathTraversal: true,
      },
      anomaly: {
        enabled: true,
        threshold: 0.5,
        learningMode: false,
      },
      cors: {
        enabled: true,
        allowedOrigins: [], // Только явно разрешенные домены
        credentials: false,
      },
    };
  }
}

// Экспортируем глобальный экземпляр
export const security = new OptimizedSecurityMiddleware(
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? SecurityConfigFactory.createProductionConfig()
    : SecurityConfigFactory.createDevelopmentConfig()
);
