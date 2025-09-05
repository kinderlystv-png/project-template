export interface SecurityPolicy {
  csp: ContentSecurityPolicy;
  csrf: CSRFProtection;
  encryption: EncryptionConfig;
  validation: ValidationConfig;
  headers: SecurityHeaders;
}

export interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  reportUri?: string;
  reportOnly?: boolean;
}

export interface CSRFProtection {
  enabled: boolean;
  tokenName: string;
  headerName: string;
  cookieName: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  httpOnly: boolean;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
  saltSize: number;
  ivSize: number;
}

export interface ValidationConfig {
  maxInputLength: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  sanitizeHtml: boolean;
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

export interface SecurityEvent {
  type: 'xss' | 'csrf' | 'injection' | 'unauthorized' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userAgent?: string;
  ip?: string;
  url: string;
  timestamp: Date;
  blocked: boolean;
  payload?: string;
}

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  removeEmpty?: boolean;
  stripComments?: boolean;
}

export interface EncryptionResult {
  encrypted: string;
  salt: string;
  iv: string;
}

export interface DecryptionOptions {
  encrypted: string;
  salt: string;
  iv: string;
  key?: string;
}

export interface CSRFToken {
  token: string;
  timestamp: number;
  expires: number;
}

export type SecurityEventHandler = (event: SecurityEvent) => void;
