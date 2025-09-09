/**
 * Улучшенные определения паттернов с более точными критериями обнаружения
 */

export interface PatternDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  // Множественные условия для повышения точности
  matchers: PatternMatcher[];
  // Минимальное количество совпадений для уверенности
  minMatches: number;
  // Базовый уровень уверенности
  baseConfidence: number;
  // Модификаторы уверенности
  confidenceModifiers?: ConfidenceModifier[];
}

export interface PatternMatcher {
  type: 'file' | 'directory' | 'content' | 'import' | 'class' | 'function' | 'combined';
  pattern?: RegExp | string;
  patterns?: Array<RegExp | string>;
  weight: number; // Вес этого матчера в общей оценке
  required?: boolean; // Обязательное условие
}

export interface ConfidenceModifier {
  condition: (context: AnalysisContext) => boolean;
  modifier: number; // Множитель уверенности (0.5 - 2.0)
  description: string;
}

export interface AnalysisContext {
  files: string[];
  directories: string[];
  imports: Map<string, string[]>;
  classes: Map<string, ClassInfo>;
  functions: Map<string, FunctionInfo>;
  fileContents: Map<string, string>;
  projectSize: number;
}

export interface ClassInfo {
  name: string;
  extends?: string;
  implements?: string[];
  methods: string[];
  properties: string[];
  decorators?: string[];
}

export interface FunctionInfo {
  name: string;
  parameters: number;
  async: boolean;
  generator: boolean;
  complexity: number;
}

// Улучшенные определения архитектурных паттернов
export const ARCHITECTURAL_PATTERNS: PatternDefinition[] = [
  {
    id: 'mvc',
    name: 'MVC Architecture',
    category: 'architectural',
    description: 'Model-View-Controller pattern',
    minMatches: 3,
    baseConfidence: 0.7,
    matchers: [
      {
        type: 'directory',
        patterns: [/models?$/i, /views?$/i, /controllers?$/i],
        weight: 0.4,
        required: false,
      },
      {
        type: 'file',
        patterns: [
          /\.(model|entity|schema)\.(ts|js)$/i,
          /\.(view|template|component)\.(ts|js|jsx|tsx)$/i,
          /\.(controller|handler|service)\.(ts|js)$/i,
        ],
        weight: 0.3,
        required: false,
      },
      {
        type: 'class',
        patterns: [/Model$/i, /View$/i, /Controller$/i, /Service$/i],
        weight: 0.2,
        required: false,
      },
      {
        type: 'import',
        patterns: [/express|koa|fastify/i, /mongoose|sequelize|typeorm/i, /react|vue|angular/i],
        weight: 0.1,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx =>
          ctx.directories.some(d => /^(src\/)?(models?|views?|controllers?)$/i.test(d)),
        modifier: 1.3,
        description: 'Clear MVC directory structure',
      },
      {
        condition: ctx => ctx.projectSize > 50,
        modifier: 1.1,
        description: 'Large enough project for MVC',
      },
    ],
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    category: 'architectural',
    description: 'Distributed microservices pattern',
    minMatches: 2,
    baseConfidence: 0.6,
    matchers: [
      {
        type: 'directory',
        patterns: [/services$/i, /microservices$/i, /apis$/i],
        weight: 0.3,
        required: false,
      },
      {
        type: 'file',
        patterns: [
          /docker-compose\.(yml|yaml)$/i,
          /Dockerfile$/i,
          /\.proto$/,
          /service\.(ts|js)$/i,
        ],
        weight: 0.3,
        required: false,
      },
      {
        type: 'import',
        patterns: [/grpc|@grpc/i, /kafka|rabbitmq|nats/i, /consul|eureka/i, /kubernetes|k8s/i],
        weight: 0.4,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => ctx.files.some(f => /docker-compose/i.test(f)),
        modifier: 1.5,
        description: 'Docker Compose found',
      },
      {
        condition: ctx => ctx.files.filter(f => /Dockerfile/i.test(f)).length > 2,
        modifier: 1.4,
        description: 'Multiple Dockerfiles indicate microservices',
      },
    ],
  },
  {
    id: 'component-based',
    name: 'Component-Based Architecture',
    category: 'architectural',
    description: 'Component-based frontend architecture',
    minMatches: 2,
    baseConfidence: 0.65,
    matchers: [
      {
        type: 'directory',
        patterns: [/components$/i, /ui$/i, /shared$/i, /common$/i],
        weight: 0.3,
        required: false,
      },
      {
        type: 'file',
        patterns: [
          /\.(component|widget)\.(tsx?|jsx?)$/i,
          /^[A-Z][a-zA-Z]+\.(tsx?|jsx?)$/,
          /\/(components|ui)\//i,
        ],
        weight: 0.4,
        required: false,
      },
      {
        type: 'import',
        patterns: [
          /^react|^vue|^@angular|^svelte/i,
          /styled-components|emotion/i,
          /material-ui|antd|bootstrap/i,
        ],
        weight: 0.3,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => ctx.directories.filter(d => /components?/i.test(d)).length > 0,
        modifier: 1.4,
        description: 'Components directory found',
      },
      {
        condition: ctx => ctx.files.filter(f => /\.(tsx|jsx)$/i.test(f)).length > 10,
        modifier: 1.2,
        description: 'Many JSX/TSX files',
      },
    ],
  },
  {
    id: 'layered',
    name: 'Layered Architecture',
    category: 'architectural',
    description: 'Layered architecture with clear separation',
    minMatches: 2,
    baseConfidence: 0.6,
    matchers: [
      {
        type: 'directory',
        patterns: [
          /^(src\/)?(presentation|ui|frontend)$/i,
          /^(src\/)?(business|logic|services)$/i,
          /^(src\/)?(data|dao|repository|persistence)$/i,
        ],
        weight: 0.5,
        required: false,
      },
      {
        type: 'file',
        patterns: [/\/(presentation|ui)\//i, /\/(business|logic)\//i, /\/(data|repository)\//i],
        weight: 0.3,
        required: false,
      },
      {
        type: 'class',
        patterns: [/Repository$/i, /Service$/i, /Controller$/i, /DAO$/i],
        weight: 0.2,
        required: false,
      },
    ],
  },
];

// Улучшенные определения паттернов проектирования
export const DESIGN_PATTERNS: PatternDefinition[] = [
  {
    id: 'singleton',
    name: 'Singleton Pattern',
    category: 'design',
    description: 'Ensures a class has only one instance',
    minMatches: 2,
    baseConfidence: 0.7,
    matchers: [
      {
        type: 'content',
        patterns: [
          /private\s+static\s+\w+\s*:\s*\w+/,
          /private\s+constructor\s*\(/,
          /static\s+(getInstance|instance|shared)\s*\(/,
        ],
        weight: 0.5,
        required: false,
      },
      {
        type: 'class',
        patterns: [/Singleton$/i, /Manager$/i, /Service$/i, /Instance$/i],
        weight: 0.3,
        required: false,
      },
      {
        type: 'function',
        patterns: [/^getInstance$/i, /^getShared/i, /^create.*Instance$/i],
        weight: 0.2,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          // Проверяем наличие приватного конструктора и getInstance
          for (const [_, content] of ctx.fileContents) {
            if (content.includes('private constructor') && content.includes('getInstance')) {
              return true;
            }
          }
          return false;
        },
        modifier: 1.5,
        description: 'Classic singleton implementation found',
      },
    ],
  },
  {
    id: 'factory',
    name: 'Factory Pattern',
    category: 'design',
    description: 'Creates objects without specifying their concrete classes',
    minMatches: 2,
    baseConfidence: 0.65,
    matchers: [
      {
        type: 'class',
        patterns: [/Factory$/i, /Creator$/i, /Builder$/i, /Provider$/i],
        weight: 0.4,
        required: false,
      },
      {
        type: 'function',
        patterns: [/^create[A-Z]/, /^make[A-Z]/, /^build[A-Z]/, /^get.*Factory$/i],
        weight: 0.35,
        required: false,
      },
      {
        type: 'content',
        patterns: [
          /abstract\s+class.*Factory/i,
          /interface\s+\w+Factory/i,
          /create\s*\(.*type\s*:\s*string/i,
        ],
        weight: 0.25,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          let factoryCount = 0;
          for (const [_, content] of ctx.fileContents) {
            if (/class\s+\w+Factory/i.test(content)) factoryCount++;
          }
          return factoryCount >= 2;
        },
        modifier: 1.3,
        description: 'Multiple factory classes found',
      },
    ],
  },
  {
    id: 'observer',
    name: 'Observer Pattern',
    category: 'design',
    description: 'Defines a one-to-many dependency between objects',
    minMatches: 2,
    baseConfidence: 0.65,
    matchers: [
      {
        type: 'class',
        patterns: [/Observer$/i, /Subscriber$/i, /Listener$/i, /EventEmitter$/i],
        weight: 0.35,
        required: false,
      },
      {
        type: 'function',
        patterns: [
          /^(add|remove|on|off)Listener$/i,
          /^subscribe$/i,
          /^unsubscribe$/i,
          /^notify/i,
          /^emit/i,
          /^trigger/i,
        ],
        weight: 0.35,
        required: false,
      },
      {
        type: 'content',
        patterns: [
          /addEventListener|removeEventListener/,
          /\.on\s*\(|\.off\s*\(/,
          /\.subscribe\s*\(|\.unsubscribe\s*\(/,
          /EventEmitter|Subject|Observable/,
        ],
        weight: 0.3,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          for (const [_, content] of ctx.fileContents) {
            if (
              content.includes('EventEmitter') ||
              content.includes('Observable') ||
              content.includes('Subject')
            ) {
              return true;
            }
          }
          return false;
        },
        modifier: 1.4,
        description: 'Event system implementation found',
      },
    ],
  },
  {
    id: 'strategy',
    name: 'Strategy Pattern',
    category: 'design',
    description: 'Defines a family of algorithms and makes them interchangeable',
    minMatches: 2,
    baseConfidence: 0.65,
    matchers: [
      {
        type: 'class',
        patterns: [/Strategy$/i, /Algorithm$/i, /Policy$/i, /Handler$/i],
        weight: 0.35,
        required: false,
      },
      {
        type: 'content',
        patterns: [
          /interface\s+\w+Strategy/i,
          /abstract\s+class.*Strategy/i,
          /setStrategy\s*\(/,
          /execute.*Strategy/i,
        ],
        weight: 0.35,
        required: false,
      },
      {
        type: 'function',
        patterns: [/^setStrategy$/i, /^useStrategy$/i, /^execute$/i, /^process$/i],
        weight: 0.3,
        required: false,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          let strategyCount = 0;
          for (const [_, content] of ctx.fileContents) {
            if (/class\s+\w+Strategy/i.test(content)) strategyCount++;
          }
          return strategyCount >= 2;
        },
        modifier: 1.3,
        description: 'Multiple strategy implementations found',
      },
    ],
  },
];

// Определения антипаттернов
export const ANTIPATTERNS: PatternDefinition[] = [
  {
    id: 'god-object',
    name: 'God Object Antipattern',
    category: 'antipattern',
    description: 'Classes that know too much or do too much',
    minMatches: 1,
    baseConfidence: 0.8,
    matchers: [
      {
        type: 'class',
        patterns: [/.*/], // Любой класс будет проверен по размеру
        weight: 1.0,
        required: true,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          for (const [_, classInfo] of ctx.classes) {
            if (classInfo.methods.length > 20 || classInfo.properties.length > 15) {
              return true;
            }
          }
          return false;
        },
        modifier: 2.0,
        description: 'Very large classes found',
      },
    ],
  },
  {
    id: 'magic-numbers',
    name: 'Magic Numbers Antipattern',
    category: 'antipattern',
    description: 'Numeric literals without explanation',
    minMatches: 1,
    baseConfidence: 0.5,
    matchers: [
      {
        type: 'content',
        patterns: [/(?<![a-zA-Z_$])\b(?!0[xX])\d{2,}\b(?![a-zA-Z_$])/g],
        weight: 1.0,
        required: true,
      },
    ],
    confidenceModifiers: [
      {
        condition: ctx => {
          let magicCount = 0;
          for (const [_, content] of ctx.fileContents) {
            const matches =
              content.match(/(?<![a-zA-Z_$])\b(?!0[xX])\d{2,}\b(?![a-zA-Z_$])/g) || [];
            magicCount += matches.length;
          }
          return magicCount > 20;
        },
        modifier: 1.5,
        description: 'Many magic numbers found',
      },
    ],
  },
];

// Определения проблем безопасности
export const SECURITY_PATTERNS: PatternDefinition[] = [
  {
    id: 'sql-injection',
    name: 'SQL Injection Vulnerability',
    category: 'security',
    description: 'Potential SQL injection vulnerabilities',
    minMatches: 1,
    baseConfidence: 0.8,
    matchers: [
      {
        type: 'content',
        patterns: [
          /(SELECT|INSERT|UPDATE|DELETE).*\+.*\$|\${/i,
          /query\s*\(\s*["'`][^"'`]*\+/i,
          /execute\s*\(\s*["'`][^"'`]*\+/i,
        ],
        weight: 1.0,
        required: true,
      },
    ],
  },
  {
    id: 'xss-vulnerability',
    name: 'XSS Vulnerability',
    category: 'security',
    description: 'Cross-Site Scripting vulnerabilities',
    minMatches: 1,
    baseConfidence: 0.7,
    matchers: [
      {
        type: 'content',
        patterns: [/innerHTML\s*=(?![^<]*sanitiz)/i, /document\.write\s*\(/i, /eval\s*\(/i],
        weight: 1.0,
        required: true,
      },
    ],
  },
  {
    id: 'hardcoded-secrets',
    name: 'Hardcoded Secrets',
    category: 'security',
    description: 'Hardcoded passwords, keys, or secrets',
    minMatches: 1,
    baseConfidence: 0.9,
    matchers: [
      {
        type: 'content',
        patterns: [
          /password\s*[:=]\s*["'][^"']{3,}["']/i,
          /(api[_-]?key|secret|token)\s*[:=]\s*["'][^"']{8,}["']/i,
          /private[_-]?key\s*[:=]\s*["']/i,
        ],
        weight: 1.0,
        required: true,
      },
    ],
  },
];

// Экспортируем все паттерны
export const ALL_PATTERNS = [
  ...ARCHITECTURAL_PATTERNS,
  ...DESIGN_PATTERNS,
  ...ANTIPATTERNS,
  ...SECURITY_PATTERNS,
];
