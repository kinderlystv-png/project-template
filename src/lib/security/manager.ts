import type {
  CSRFToken,
  DecryptionOptions,
  EncryptionResult,
  SanitizeOptions,
  SecurityEvent,
  SecurityEventHandler,
  SecurityPolicy,
} from './types.js';

export class SecurityManager {
  private policy: SecurityPolicy;
  private eventHandlers: SecurityEventHandler[] = [];
  private csrfTokens = new Map<string, CSRFToken>();
  private readonly crypto: Crypto;

  constructor(policy?: Partial<SecurityPolicy>) {
    this.crypto = window.crypto || (globalThis as { crypto: Crypto }).crypto;
    this.policy = this.createDefaultPolicy(policy);
    this.initialize();
  }

  private createDefaultPolicy(overrides?: Partial<SecurityPolicy>): SecurityPolicy {
    const defaultPolicy: SecurityPolicy = {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        reportOnly: false,
      },
      csrf: {
        enabled: true,
        tokenName: 'csrf_token',
        headerName: 'X-CSRF-Token',
        cookieName: 'csrf_token',
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
      },
      encryption: {
        algorithm: 'AES-GCM',
        keySize: 256,
        iterations: 100000,
        saltSize: 16,
        ivSize: 12,
      },
      validation: {
        maxInputLength: 10000,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        sanitizeHtml: true,
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img'],
        allowedAttributes: {
          a: ['href', 'title'],
          img: ['src', 'alt', 'width', 'height'],
        },
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
      },
    };

    return this.deepMerge(defaultPolicy, overrides || {});
  }

  private initialize(): void {
    this.setupCSP();
    this.setupEventListeners();
    this.setupXSSProtection();
  }

  private setupCSP(): void {
    if (typeof document === 'undefined') return;

    const csp = this.policy.csp;
    const directives: string[] = [];

    Object.entries(csp).forEach(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        const kebabDirective = directive.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        directives.push(`${kebabDirective} ${sources.join(' ')}`);
      }
    });

    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = csp.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    meta.content = directives.join('; ');
    document.head.appendChild(meta);
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Обнаружение XSS попыток
    window.addEventListener('error', event => {
      if (this.detectXSS(event.message || '')) {
        this.reportSecurityEvent({
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS attempt detected in error message',
          url: window.location.href,
          timestamp: new Date(),
          blocked: true,
          payload: event.message,
        });
      }
    });

    // Мониторинг подозрительных DOM изменений
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (this.detectSuspiciousElement(element)) {
                  this.reportSecurityEvent({
                    type: 'suspicious',
                    severity: 'medium',
                    description: 'Suspicious DOM element detected',
                    url: window.location.href,
                    timestamp: new Date(),
                    blocked: false,
                    payload: element.outerHTML,
                  });
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  private setupXSSProtection(): void {
    if (typeof document === 'undefined') return;

    // Переопределяем innerHTML для дополнительной защиты
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!;
    const self = this;

    Object.defineProperty(Element.prototype, 'innerHTML', {
      get: originalInnerHTML.get,
      set(value: string) {
        const sanitized = self.sanitizeHTML(value);
        originalInnerHTML.set!.call(this, sanitized);
      },
      configurable: originalInnerHTML.configurable,
      enumerable: originalInnerHTML.enumerable,
    });
  }

  // Публичные методы

  sanitizeHTML(html: string, options?: SanitizeOptions): string {
    const config = {
      allowedTags: options?.allowedTags || this.policy.validation.allowedTags,
      allowedAttributes: options?.allowedAttributes || this.policy.validation.allowedAttributes,
      removeEmpty: options?.removeEmpty ?? true,
      stripComments: options?.stripComments ?? true,
    };

    // Удаляем script теги
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Удаляем обработчики событий
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');

    // Удаляем javascript: протокол
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Удаляем data: URLs (кроме изображений)
    sanitized = sanitized.replace(/data:(?!image\/)[^;]*;[^"']*/gi, '');

    if (config.stripComments) {
      sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Простая фильтрация тегов (для полноценной санитизации используйте DOMPurify)
    const allowedTagsRegex = new RegExp(
      `<(?!/?(?:${config.allowedTags.join('|')})\\s*/?>)[^>]+>`,
      'gi'
    );
    sanitized = sanitized.replace(allowedTagsRegex, '');

    return sanitized;
  }

  validateInput(input: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.length > this.policy.validation.maxInputLength) {
      errors.push(`Input exceeds maximum length of ${this.policy.validation.maxInputLength}`);
    }

    if (this.detectXSS(input)) {
      errors.push('Input contains potential XSS payload');
    }

    if (this.detectSQLInjection(input)) {
      errors.push('Input contains potential SQL injection');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.policy.validation.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    if (file.size > this.policy.validation.maxFileSize) {
      errors.push(`File size exceeds maximum of ${this.policy.validation.maxFileSize} bytes`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  generateCSRFToken(): string {
    const tokenBytes = new Uint8Array(32);
    this.crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    const csrfToken: CSRFToken = {
      token,
      timestamp: Date.now(),
      expires: Date.now() + 60 * 60 * 1000, // 1 час
    };

    this.csrfTokens.set(token, csrfToken);

    // Устанавливаем в cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${this.policy.csrf.cookieName}=${token}; SameSite=${this.policy.csrf.sameSite}; ${this.policy.csrf.secure ? 'Secure;' : ''} ${this.policy.csrf.httpOnly ? 'HttpOnly;' : ''}`;
    }

    return token;
  }

  validateCSRFToken(token: string): boolean {
    const csrfToken = this.csrfTokens.get(token);

    if (!csrfToken) {
      this.reportSecurityEvent({
        type: 'csrf',
        severity: 'high',
        description: 'Invalid CSRF token',
        url: window.location.href,
        timestamp: new Date(),
        blocked: true,
        payload: token,
      });
      return false;
    }

    if (Date.now() > csrfToken.expires) {
      this.csrfTokens.delete(token);
      this.reportSecurityEvent({
        type: 'csrf',
        severity: 'medium',
        description: 'Expired CSRF token',
        url: window.location.href,
        timestamp: new Date(),
        blocked: true,
        payload: token,
      });
      return false;
    }

    return true;
  }

  async encrypt(data: string, password?: string): Promise<EncryptionResult> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Генерируем соль и IV
    const salt = this.crypto.getRandomValues(new Uint8Array(this.policy.encryption.saltSize));
    const iv = this.crypto.getRandomValues(new Uint8Array(this.policy.encryption.ivSize));

    // Получаем ключ
    const key = password
      ? await this.deriveKey(password, salt)
      : await this.crypto.subtle.generateKey(
          { name: this.policy.encryption.algorithm, length: this.policy.encryption.keySize },
          true,
          ['encrypt', 'decrypt']
        );

    // Шифруем данные
    const encrypted = await this.crypto.subtle.encrypt(
      { name: this.policy.encryption.algorithm, iv },
      key,
      dataBuffer
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      salt: this.arrayBufferToBase64(salt.buffer),
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }

  async decrypt(options: DecryptionOptions): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(options.encrypted);
    const salt = new Uint8Array(this.base64ToArrayBuffer(options.salt));
    const iv = this.base64ToArrayBuffer(options.iv);

    // Получаем ключ
    const key = options.key
      ? await this.deriveKey(options.key, salt)
      : await this.crypto.subtle.generateKey(
          { name: this.policy.encryption.algorithm, length: this.policy.encryption.keySize },
          true,
          ['encrypt', 'decrypt']
        );

    // Расшифровываем данные
    const decrypted = await this.crypto.subtle.decrypt(
      { name: this.policy.encryption.algorithm, iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Обработчики событий безопасности

  onSecurityEvent(handler: SecurityEventHandler): void {
    this.eventHandlers.push(handler);
  }

  private reportSecurityEvent(event: SecurityEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in security event handler:', error);
      }
    });

    // Логируем критические события
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn('Security event:', event);
    }
  }

  // Приватные методы для обнаружения угроз

  private detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /expression\s*\(/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  private detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)|(--)|(\/\*)|(\*\/)|(\b(or|and)\b\s+\w+\s*=\s*\w+)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private detectSuspiciousElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const suspiciousTags = ['script', 'iframe', 'object', 'embed', 'form'];

    if (suspiciousTags.includes(tagName)) {
      return true;
    }

    // Проверяем атрибуты
    const attributes = element.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
        return true;
      }
    }

    return false;
  }

  // Утилиты

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await this.crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    return this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.policy.encryption.iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: this.policy.encryption.algorithm, length: this.policy.encryption.keySize },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          (result as Record<string, unknown>)[key] = this.deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          );
        } else {
          (result as Record<string, unknown>)[key] = source[key];
        }
      }
    }

    return result;
  }

  // Получение конфигурации
  getPolicy(): SecurityPolicy {
    return { ...this.policy };
  }

  updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = this.deepMerge(this.policy, updates);
  }
}
