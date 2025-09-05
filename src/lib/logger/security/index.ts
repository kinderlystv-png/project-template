import type { LogContext, LogEntry } from '../types/types';

export class Sanitizer {
  private patterns: RegExp[];
  private readonly redactedValue = '[REDACTED]';

  // Стандартные паттерны для чувствительных данных
  private static readonly DEFAULT_PATTERNS = [
    // Пароли
    /password["\s]*[:=]\s*["']?([^"',\s]+)/gi,
    // Токены
    /(?:token|bearer|api[_-]?key)["\s]*[:=]\s*["']?([^"',\s]+)/gi,
    // Кредитные карты
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    // Email (опционально)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Телефоны
    /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
    // SSN (US)
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // IP адреса (опционально)
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  ];

  constructor(customPatterns: RegExp[] = []) {
    this.patterns = [...Sanitizer.DEFAULT_PATTERNS, ...customPatterns];
  }

  sanitize(entry: LogEntry): LogEntry {
    const sanitized = { ...entry };

    // Санитизация message
    sanitized.message = this.sanitizeString(entry.message);

    // Санитизация context
    if (sanitized.context) {
      sanitized.context = this.sanitizeObject(sanitized.context) as LogContext;
    }

    // Отмечаем как санитизированное
    sanitized.sanitized = true;

    return sanitized;
  }

  private sanitizeString(str: string): string {
    let sanitized = str;
    for (const pattern of this.patterns) {
      sanitized = sanitized.replace(pattern, this.redactedValue);
    }
    return sanitized;
  }

  private sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Проверяем название ключа на чувствительные данные
      const lowerKey = key.toLowerCase();
      if (this.isSensitiveKey(lowerKey)) {
        sanitized[key] = this.redactedValue;
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'passwd',
      'pwd',
      'secret',
      'token',
      'apikey',
      'api_key',
      'auth',
      'credential',
      'private',
      'ssn',
      'social',
      'card',
      'cvv',
      'cvc',
      'pin',
    ];

    return sensitiveKeys.some(sensitive => key.includes(sensitive));
  }

  /**
   * Добавляет дополнительные паттерны для санитизации
   */
  addPatterns(patterns: RegExp[]): void {
    this.patterns.push(...patterns);
  }

  /**
   * Проверяет, была ли строка санитизирована
   */
  containsRedactedData(str: string): boolean {
    return str.includes(this.redactedValue);
  }
}

/**
 * GDPR совместимые утилиты
 */
export class GDPRCompliance {
  private static readonly PII_PATTERNS = [
    // Имена (базовая проверка)
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    // Даты рождения
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    // Адреса
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/g,
  ];

  /**
   * Анонимизирует персональные данные в соответствии с GDPR
   */
  static anonymize(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.anonymizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.anonymize(item));
    }

    if (data && typeof data === 'object') {
      const anonymized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (this.isPIIField(key)) {
          anonymized[key] = '[ANONYMIZED]';
        } else {
          anonymized[key] = this.anonymize(value);
        }
      }
      return anonymized;
    }

    return data;
  }

  private static anonymizeString(str: string): string {
    let anonymized = str;
    for (const pattern of this.PII_PATTERNS) {
      anonymized = anonymized.replace(pattern, '[ANONYMIZED]');
    }
    return anonymized;
  }

  private static isPIIField(key: string): boolean {
    const piiFields = [
      'name',
      'firstname',
      'lastname',
      'fullname',
      'email',
      'phone',
      'address',
      'birthday',
      'birthdate',
      'ssn',
      'passport',
      'license',
    ];

    const lowerKey = key.toLowerCase();
    return piiFields.some(field => lowerKey.includes(field));
  }
}

/**
 * Простое шифрование для логов (не для продакшн использования)
 */
export class LogEncryption {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  /**
   * Простое XOR шифрование (только для демонстрации)
   * В продакшне используйте более надежные методы
   */
  encrypt(data: string): string {
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyCode = this.key.charCodeAt(i % this.key.length);
      encrypted += String.fromCharCode(charCode ^ keyCode);
    }
    return btoa(encrypted); // Base64 encoding
  }

  /**
   * Расшифровка XOR
   */
  decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData); // Base64 decoding
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyCode = this.key.charCodeAt(i % this.key.length);
        decrypted += String.fromCharCode(charCode ^ keyCode);
      }
      return decrypted;
    } catch {
      return '[DECRYPTION_ERROR]';
    }
  }
}
