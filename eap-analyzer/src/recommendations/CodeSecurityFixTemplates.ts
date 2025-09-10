/**
 * CodeSecurityFixTemplates - Шаблоны исправления для проблем безопасности кода
 * 
 * Phase 5.2.1: Конкретные fix templates для code security issues
 */

import { SecurityRecommendation, IssueContext } from './RecommendationEngine.js';

export class CodeSecurityFixTemplates {
  /**
   * Генерирует fix для hardcoded secrets
   */
  static generateSecretFix(secretData: {
    type: string;
    file: string;
    line: number;
    secretPattern: string;
    context: string;
  }): SecurityRecommendation {
    const { type, file, line, secretPattern } = secretData;

    return {
      id: `secret-${type}`,
      title: `Hardcoded Secret: ${type}`,
      description: `Найден захардкоженный секрет в ${file}:${line}`,
      severity: 'critical',
      category: 'code',
      fixTemplate: {
        steps: [
          '🚨 НЕМЕДЛЕННО удалите секрет из кода',
          '🔑 Ротируйте скомпрометированный секрет',
          '📁 Создайте .env файл для секретов',
          '🔧 Используйте переменные окружения',
          '✅ Добавьте .env в .gitignore'
        ],
        beforeCode: this.getSecretBeforeExample(type, secretPattern),
        afterCode: this.getSecretAfterExample(type),
        commands: [
          'echo ".env" >> .gitignore',
          `echo "${type.toUpperCase()}_SECRET=your_new_secret_here" >> .env`,
          'git add .gitignore',
          'git commit -m "Add .env to gitignore"',
          '# ВАЖНО: Ротируйте старый секрет в сервисе!'
        ],
        codeExample: this.getSecretImplementationExample(type)
      },
      documentation: {
        links: [
          'https://12factor.net/config',
          'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials',
          'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
        ],
        explanation: 'Секреты в коде доступны всем кто имеет доступ к репозиторию и Git истории'
      },
      estimatedTime: '45-60 минут (включая ротацию секрета)',
      difficulty: 'easy'
    };
  }

  /**
   * Генерирует fix для небезопасных функций
   */
  static generateUnsafeFunctionFix(functionData: {
    functionName: string;
    file: string;
    line: number;
    context: string;
    risk: string;
  }): SecurityRecommendation {
    const { functionName, file, line, risk } = functionData;

    return {
      id: `unsafe-${functionName}`,
      title: `Небезопасная функция: ${functionName}`,
      description: `Использование ${functionName} в ${file}:${line}`,
      severity: this.getUnsafeFunctionSeverity(functionName),
      category: 'code',
      fixTemplate: {
        steps: [
          'Изучите контекст использования функции',
          'Выберите безопасную альтернативу',
          'Добавьте валидацию входных данных',
          'Протестируйте новую реализацию',
          'Удалите небезопасную функцию'
        ],
        beforeCode: this.getUnsafeFunctionBefore(functionName),
        afterCode: this.getUnsafeFunctionAfter(functionName),
        codeExample: this.getUnsafeFunctionExplanation(functionName)
      },
      documentation: {
        links: [
          'https://owasp.org/www-community/vulnerabilities/',
          'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
          'https://developer.mozilla.org/en-US/docs/Web/Security'
        ],
        explanation: `${functionName}: ${risk}`
      },
      estimatedTime: this.getUnsafeFunctionFixTime(functionName),
      difficulty: this.getUnsafeFunctionDifficulty(functionName)
    };
  }

  /**
   * Генерирует fix для SQL injection
   */
  static generateSQLInjectionFix(sqlData: {
    query: string;
    file: string;
    line: number;
    type: 'concatenation' | 'template' | 'dynamic';
  }): SecurityRecommendation {
    const { query, file, line, type } = sqlData;

    return {
      id: 'sql-injection',
      title: 'SQL Injection уязвимость',
      description: `Потенциальная SQL injection в ${file}:${line}`,
      severity: 'critical',
      category: 'code',
      fixTemplate: {
        steps: [
          'Используйте параметризованные запросы',
          'Валидируйте все пользовательские входы',
          'Используйте ORM или query builder',
          'Примените принцип наименьших привилегий для БД',
          'Тестируйте на SQL injection'
        ],
        beforeCode: this.getSQLInjectionBefore(type, query),
        afterCode: this.getSQLInjectionAfter(type),
        codeExample: `// SQL Injection проверка:
// 1. Никогда не конкатенируйте пользовательский ввод в SQL
// 2. Используйте prepared statements
// 3. Валидируйте типы данных
// 4. Санитизируйте входы`
      },
      documentation: {
        links: [
          'https://owasp.org/www-community/attacks/SQL_Injection',
          'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
          'https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html'
        ],
        explanation: 'SQL Injection позволяет атакующему выполнить произвольные SQL команды'
      },
      estimatedTime: '1-2 часа',
      difficulty: 'medium'
    };
  }

  /**
   * Генерирует fix для XSS уязвимостей
   */
  static generateXSSFix(xssData: {
    type: 'reflected' | 'stored' | 'dom';
    file: string;
    line: number;
    context: string;
  }): SecurityRecommendation {
    const { type, file, line } = xssData;

    return {
      id: `xss-${type}`,
      title: `XSS уязвимость: ${type}`,
      description: `Потенциальная ${type} XSS в ${file}:${line}`,
      severity: 'high',
      category: 'code',
      fixTemplate: {
        steps: [
          'Санитизируйте все пользовательские входы',
          'Используйте безопасные методы вывода',
          'Применяйте Content Security Policy',
          'Валидируйте данные на сервере',
          'Тестируйте на XSS атаки'
        ],
        beforeCode: this.getXSSBefore(type),
        afterCode: this.getXSSAfter(type),
        codeExample: this.getXSSExplanation(type)
      },
      documentation: {
        links: [
          'https://owasp.org/www-community/attacks/xss/',
          'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
        ],
        explanation: `${type} XSS позволяет выполнить JavaScript код в браузере жертвы`
      },
      estimatedTime: '2-3 часа',
      difficulty: 'medium'
    };
  }

  // Helper methods для генерации примеров кода

  private static getSecretBeforeExample(type: string, pattern: string): string {
    const examples: Record<string, string> = {
      'api_key': `// ОПАСНО ❌:
const API_KEY = "${pattern}";
const config = {
  apiKey: "${pattern}",
  headers: { 'Authorization': 'Bearer ${pattern}' }
};`,
      'password': `// ОПАСНО ❌:
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: '${pattern}'
};`,
      'token': `// ОПАСНО ❌:
const token = "${pattern}";
fetch('/api/data', {
  headers: { 'Authorization': \`Bearer ${pattern}\` }
});`
    };
    return examples[type] || `const secret = "${pattern}";`;
  }

  private static getSecretAfterExample(type: string): string {
    const examples: Record<string, string> = {
      'api_key': `// БЕЗОПАСНО ✅:
const API_KEY = process.env.API_KEY;
const config = {
  apiKey: process.env.API_KEY,
  headers: { 'Authorization': \`Bearer \${process.env.API_KEY}\` }
};

// .env файл:
API_KEY=your_secret_api_key_here`,
      'password': `// БЕЗОПАСНО ✅:
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

// .env файл:
DB_PASSWORD=your_secure_password_here`,
      'token': `// БЕЗОПАСНО ✅:
const token = process.env.AUTH_TOKEN;
fetch('/api/data', {
  headers: { 'Authorization': \`Bearer \${process.env.AUTH_TOKEN}\` }
});

// .env файл:
AUTH_TOKEN=your_auth_token_here`
    };
    return examples[type] || `const secret = process.env.YOUR_SECRET;`;
  }

  private static getSecretImplementationExample(type: string): string {
    return `// Полная реализация:
// 1. Создайте .env файл (НЕ коммитьте в Git!)
${type.toUpperCase()}_SECRET=your_actual_secret_here

// 2. Загружайте в приложении:
import 'dotenv/config'; // или require('dotenv').config();

// 3. Используйте:
const secret = process.env.${type.toUpperCase()}_SECRET;
if (!secret) {
  throw new Error('${type.toUpperCase()}_SECRET environment variable is required');
}

// 4. Для production используйте:
// - Docker secrets
// - Kubernetes secrets  
// - Cloud provider secret management (AWS Secrets Manager, etc.)`;
  }

  private static getUnsafeFunctionBefore(functionName: string): string {
    const examples: Record<string, string> = {
      'eval': `// ОПАСНО ❌:
const userCode = req.body.code;
const result = eval(userCode); // Выполняет любой JS код!`,
      'innerHTML': `// ОПАСНО ❌:
const userContent = req.body.html;
element.innerHTML = userContent; // XSS атака!`,
      'document.write': `// ОПАСНО ❌:
document.write(userInput); // Может переписать всю страницу`,
      'Function': `// ОПАСНО ❌:
const userFunction = new Function(userInput);
userFunction(); // Аналог eval`
    };
    return examples[functionName] || `${functionName}(userInput); // Небезопасно`;
  }

  private static getUnsafeFunctionAfter(functionName: string): string {
    const examples: Record<string, string> = {
      'eval': `// БЕЗОПАСНО ✅:
try {
  const result = JSON.parse(userInput); // Для JSON данных
  // или используйте безопасный парсер/интерпретатор
} catch (error) {
  throw new Error('Invalid JSON input');
}`,
      'innerHTML': `// БЕЗОПАСНО ✅:
// Для текста:
element.textContent = userContent;

// Для HTML - используйте DOMPurify:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userContent);`,
      'document.write': `// БЕЗОПАСНО ✅:
const element = document.createElement('div');
element.textContent = userInput;
document.body.appendChild(element);`,
      'Function': `// БЕЗОПАСНО ✅:
// Избегайте динамического создания функций
// Используйте готовые функции или безопасные альтернативы`
    };
    return examples[functionName] || `// Используйте безопасную альтернативу для ${functionName}`;
  }

  private static getUnsafeFunctionExplanation(functionName: string): string {
    const explanations: Record<string, string> = {
      'eval': 'eval() выполняет произвольный JavaScript код и может привести к code injection',
      'innerHTML': 'innerHTML может выполнить JavaScript через <script> теги или event handlers',
      'document.write': 'document.write может полностью переписать DOM и нарушить функциональность',
      'Function': 'new Function() создает функции из строк, что эквивалентно eval()'
    };
    return explanations[functionName] || `${functionName} может быть использован для атак`;
  }

  private static getSQLInjectionBefore(type: string, query: string): string {
    const examples: Record<string, string> = {
      'concatenation': `// ОПАСНО ❌:
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query); // SQL injection!`,
      'template': `// ОПАСНО ❌:
const username = req.body.username;
const query = \`SELECT * FROM users WHERE name = '\${username}'\`;
db.query(query); // SQL injection!`,
      'dynamic': `// ОПАСНО ❌:
const orderBy = req.query.sort;
const query = "SELECT * FROM products ORDER BY " + orderBy;
db.query(query); // SQL injection!`
    };
    return examples[type] || query;
  }

  private static getSQLInjectionAfter(type: string): string {
    const examples: Record<string, string> = {
      'concatenation': `// БЕЗОПАСНО ✅:
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]); // Параметризованный запрос`,
      'template': `// БЕЗОПАСНО ✅:
const username = req.body.username;
const query = "SELECT * FROM users WHERE name = ?";
db.query(query, [username]); // Параметризованный запрос`,
      'dynamic': `// БЕЗОПАСНО ✅:
const allowedColumns = ['name', 'price', 'created_at'];
const orderBy = allowedColumns.includes(req.query.sort) ? req.query.sort : 'id';
const query = \`SELECT * FROM products ORDER BY \${orderBy}\`;
db.query(query); // Whitelist валидация`
    };
    return examples[type] || 'Используйте параметризованные запросы';
  }

  private static getXSSBefore(type: string): string {
    const examples: Record<string, string> = {
      'reflected': `// ОПАСНО ❌:
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(\`<h1>Search results for: \${query}</h1>\`); // XSS!
});`,
      'stored': `// ОПАСНО ❌:
const comment = req.body.comment;
await db.comments.create({ text: comment });
// Позже выводим без санитизации:
res.send(\`<div>\${comment}</div>\`); // XSS!`,
      'dom': `// ОПАСНО ❌:
const hash = window.location.hash.substring(1);
document.getElementById('content').innerHTML = hash; // DOM XSS!`
    };
    return examples[type] || 'Небезопасный вывод пользовательских данных';
  }

  private static getXSSAfter(type: string): string {
    const examples: Record<string, string> = {
      'reflected': `// БЕЗОПАСНО ✅:
app.get('/search', (req, res) => {
  const query = escapeHtml(req.query.q);
  res.send(\`<h1>Search results for: \${query}</h1>\`);
});`,
      'stored': `// БЕЗОПАСНО ✅:
const comment = DOMPurify.sanitize(req.body.comment);
await db.comments.create({ text: comment });
// Или санитизируйте при выводе:
res.send(\`<div>\${escapeHtml(comment)}</div>\`);`,
      'dom': `// БЕЗОПАСНО ✅:
const hash = window.location.hash.substring(1);
document.getElementById('content').textContent = hash; // Только текст`
    };
    return examples[type] || 'Санитизируйте все пользовательские данные';
  }

  private static getXSSExplanation(type: string): string {
    const explanations: Record<string, string> = {
      'reflected': 'Reflected XSS: вредоносный код отражается от сервера обратно пользователю',
      'stored': 'Stored XSS: вредоносный код сохраняется в БД и выполняется у всех пользователей',
      'dom': 'DOM XSS: вредоносный код выполняется через манипуляции с DOM на клиенте'
    };
    return explanations[type] || 'XSS позволяет выполнить JavaScript в браузере жертвы';
  }

  private static getUnsafeFunctionSeverity(functionName: string): 'critical' | 'high' | 'medium' {
    const critical = ['eval', 'Function'];
    const high = ['innerHTML', 'document.write', 'outerHTML'];
    
    if (critical.includes(functionName)) return 'critical';
    if (high.includes(functionName)) return 'high';
    return 'medium';
  }

  private static getUnsafeFunctionFixTime(functionName: string): string {
    const timeMap: Record<string, string> = {
      'eval': '2-4 часа',
      'innerHTML': '30-60 минут',
      'document.write': '30-60 минут',
      'Function': '2-4 часа'
    };
    return timeMap[functionName] || '1-2 часа';
  }

  private static getUnsafeFunctionDifficulty(functionName: string): 'easy' | 'medium' | 'hard' {
    const hard = ['eval', 'Function'];
    const medium = ['innerHTML'];
    
    if (hard.includes(functionName)) return 'hard';
    if (medium.includes(functionName)) return 'medium';
    return 'easy';
  }
}
