/**
 * Тесты для AI Pattern Recognizer
 * Проверяем обнаружение различных архитектурных паттернов и антипаттернов
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PatternRecognizer,
  type FileStructure,
  type FunctionInfo,
  type ClassInfo,
} from '../../src/modules/ai-insights/pattern-recognizer';

describe('PatternRecognizer', () => {
  let recognizer: PatternRecognizer;

  beforeEach(() => {
    recognizer = new PatternRecognizer();
  });

  describe('Архитектурные паттерны', () => {
    it('должен обнаруживать MVC паттерн', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/controllers/UserController.js',
          'app.get("/users", (req, res) => { ... })'
        ),
        createMockFile('src/models/User.js', 'mongoose.Schema({ name: String })'),
        createMockFile(
          'src/views/UserView.jsx',
          'export function UserView() { return <div>...</div> }'
        ),
        createMockFile(
          'src/controllers/ProductController.js',
          'app.post("/products", (req, res) => { ... })'
        ),
        createMockFile('src/models/Product.js', 'class ProductModel { ... }'),
      ];

      const result = await recognizer.analyzePatterns(files);

      const mvcPattern = result.detectedPatterns.find(p => p.id === 'mvc-pattern');
      expect(mvcPattern).toBeDefined();
      expect(mvcPattern?.confidence).toBeGreaterThan(60);
      expect(mvcPattern?.type).toBe('architectural');
      expect(mvcPattern?.locations).toHaveLength(5);
    });

    it('должен обнаруживать микросервисную архитектуру', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'services/user-service/index.js',
          'const express = require("express"); const app = express();'
        ),
        createMockFile(
          'services/payment-service/index.js',
          'const fastify = require("fastify")();'
        ),
        createMockFile('Dockerfile', 'FROM node:18\nCOPY . .\nEXPOSE 3000'),
        createMockFile('docker-compose.yml', 'services:\n  user-service:\n    build: .'),
        createMockFile('gateway/nginx.conf', 'upstream user_service { server user-service:3000; }'),
      ];

      const result = await recognizer.analyzePatterns(files);

      const microservicesPattern = result.detectedPatterns.find(
        p => p.id === 'microservices-pattern'
      );
      expect(microservicesPattern).toBeDefined();
      expect(microservicesPattern?.confidence).toBeGreaterThan(50);
      expect(microservicesPattern?.impact).toBe('high');
    });

    it('должен обнаруживать компонентную архитектуру', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/components/Button.jsx',
          'export function Button({ children }) { return <button>{children}</button>; }'
        ),
        createMockFile(
          'src/components/Input.tsx',
          'export const Input: React.FC = () => <input />;'
        ),
        createMockFile(
          'src/components/Modal.vue',
          '<template><div class="modal">{{ content }}</div></template>'
        ),
        createMockFile(
          'src/components/Header.jsx',
          'React.Component class Header extends React.Component'
        ),
        createMockFile(
          'src/components/Footer.jsx',
          'function Footer() { return <footer>...</footer>; }'
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const componentPattern = result.detectedPatterns.find(p => p.id === 'component-pattern');
      expect(componentPattern).toBeDefined();
      expect(componentPattern?.confidence).toBeGreaterThan(30);
      expect(componentPattern?.type).toBe('architectural');
    });

    it('должен обнаруживать слоистую архитектуру', async () => {
      const files: FileStructure[] = [
        createMockFile('src/ui/components/App.js', 'import React from "react"'),
        createMockFile(
          'src/business/services/UserService.js',
          'class UserService { createUser() {} }'
        ),
        createMockFile(
          'src/data/repositories/UserRepository.js',
          'class UserRepository { save() {} }'
        ),
        createMockFile('src/ui/pages/HomePage.js', 'export function HomePage() {}'),
        createMockFile('src/data/dao/UserDAO.js', 'class UserDAO { findById() {} }'),
      ];

      const result = await recognizer.analyzePatterns(files);

      const layeredPattern = result.detectedPatterns.find(p => p.id === 'layered-architecture');
      expect(layeredPattern).toBeDefined();
      expect(layeredPattern?.confidence).toBeGreaterThan(50);
    });
  });

  describe('Паттерны проектирования', () => {
    it('должен обнаруживать Singleton паттерн', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/Database.js',
          `
          class Database {
            static instance = null;

            static getInstance() {
              if (!this.instance) {
                this.instance = new Database();
              }
              return this.instance;
            }

            private constructor() {}
          }
        `
        ),
        createMockFile(
          'src/Logger.js',
          'class Logger { static instance; static getInstance() { return this.instance; } }'
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const singletonPattern = result.detectedPatterns.find(p => p.id === 'singleton-pattern');
      expect(singletonPattern).toBeDefined();
      expect(singletonPattern?.type).toBe('design');
      expect(singletonPattern?.confidence).toBeGreaterThan(50);
    });

    it('должен обнаруживать Factory паттерн', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/CarFactory.js',
          `
          class CarFactory {
            createInstance(type) {
              switch(type) {
                case 'sedan': return new Sedan();
                case 'suv': return new SUV();
              }
            }
          }
        `
        ),
        createMockFile(
          'src/UserBuilder.js',
          'class UserBuilder { build() { return new User(); } }'
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const factoryPattern = result.detectedPatterns.find(p => p.id === 'factory-pattern');
      expect(factoryPattern).toBeDefined();
      expect(factoryPattern?.type).toBe('design');
    });

    it('должен обнаруживать Observer паттерн', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/EventEmitter.js',
          `
          class EventEmitter {
            subscribe(event, callback) { this.listeners.push(callback); }
            notify(event, data) { this.listeners.forEach(cb => cb(data)); }
          }
        `
        ),
        createMockFile('src/Component.js', 'element.addEventListener("click", handler);'),
      ];

      const result = await recognizer.analyzePatterns(files);

      const observerPattern = result.detectedPatterns.find(p => p.id === 'observer-pattern');
      expect(observerPattern).toBeDefined();
      expect(observerPattern?.type).toBe('design');
    });

    it('должен обнаруживать Strategy паттерн', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/PaymentStrategy.js',
          `
          class PaymentProcessor {
            setStrategy(strategy) { this.strategy = strategy; }
            processPayment() { return this.strategy.pay(); }
          }
        `
        ),
        createMockFile(
          'src/ValidationStrategy.js',
          'interface ValidationStrategy { validate(data); }'
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const strategyPattern = result.detectedPatterns.find(p => p.id === 'strategy-pattern');
      expect(strategyPattern).toBeDefined();
      expect(strategyPattern?.type).toBe('design');
    });
  });

  describe('Антипаттерны', () => {
    it('должен обнаруживать God Object', async () => {
      const largeClass: ClassInfo = {
        name: 'GodClass',
        startLine: 1,
        endLine: 1000,
        methods: 50,
        properties: 30,
        inheritance: [],
        interfaces: [],
      };

      const files: FileStructure[] = [
        {
          path: 'src/GodObject.js',
          content: 'x'.repeat(60000), // 60KB файл
          size: 60000,
          dependencies: [],
          exports: [],
          imports: [],
          functions: [],
          classes: [largeClass],
          complexity: 100,
        },
      ];

      const result = await recognizer.analyzePatterns(files);

      const godObjectPattern = result.detectedPatterns.find(p => p.id === 'god-object');
      expect(godObjectPattern).toBeDefined();
      expect(godObjectPattern?.type).toBe('antipattern');
      expect(godObjectPattern?.impact).toBe('high');
      expect(godObjectPattern?.confidence).toBeGreaterThan(30);
    });

    it('должен обнаруживать Spaghetti Code', async () => {
      const complexFunction: FunctionInfo = {
        name: 'complexFunction',
        startLine: 1,
        endLine: 100,
        parameters: 10,
        complexity: 25, // Высокая цикломатическая сложность
        async: false,
        pure: false,
      };

      const files: FileStructure[] = [
        {
          path: 'src/SpaghettiCode.js',
          content: 'function complex() { /* много вложенных if/for */ }',
          size: 5000,
          dependencies: [],
          exports: [],
          imports: [],
          functions: [complexFunction],
          classes: [],
          complexity: 60,
        },
      ];

      const result = await recognizer.analyzePatterns(files);

      const spaghettiPattern = result.detectedPatterns.find(p => p.id === 'spaghetti-code');
      expect(spaghettiPattern).toBeDefined();
      expect(spaghettiPattern?.type).toBe('antipattern');
      expect(spaghettiPattern?.impact).toBe('high');
    });

    it('должен обнаруживать Copy-Paste Programming', async () => {
      const duplicatedCode = `
        function calculateTax(amount) { return amount * 0.15; }
        function calculateTax(amount) { return amount * 0.15; }
        function calculateTax(amount) { return amount * 0.15; }
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
        let duplicatedLine = "this line appears multiple times";
      `;

      const files: FileStructure[] = [createMockFile('src/DuplicatedCode.js', duplicatedCode)];

      const result = await recognizer.analyzePatterns(files);

      const copyPastePattern = result.detectedPatterns.find(p => p.id === 'copy-paste-programming');
      expect(copyPastePattern).toBeDefined();
      expect(copyPastePattern?.type).toBe('antipattern');
      expect(copyPastePattern?.impact).toBe('medium');
    });

    it('должен обнаруживать Magic Numbers', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/MagicNumbers.js',
          `
          const tax = amount * 15;
          const limit = 100;
          const timeout = 5000;
          const buffer = new Array(1024);
          const maxRetries = 42;
          const threshold = 999;
          if (count > 777) { /* magic number */ }
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const magicNumbersPattern = result.detectedPatterns.find(p => p.id === 'magic-numbers');
      expect(magicNumbersPattern).toBeDefined();
      expect(magicNumbersPattern?.type).toBe('antipattern');
      expect(magicNumbersPattern?.impact).toBe('low');
    });
  });

  describe('Проблемы производительности', () => {
    it('должен обнаруживать N+1 Query Problem', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/UserService.js',
          `
          users.forEach(user => {
            const profile = database.query("SELECT * FROM profiles WHERE user_id = " + user.id);
            user.profile = profile;
          });
        `
        ),
        createMockFile(
          'src/OrderService.js',
          `
          for (const order of orders) {
            const items = db.find({ orderId: order.id });
            order.items = items;
          }
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const nPlusOnePattern = result.detectedPatterns.find(p => p.id === 'n-plus-one-queries');
      expect(nPlusOnePattern).toBeDefined();
      expect(nPlusOnePattern?.type).toBe('performance');
      expect(nPlusOnePattern?.impact).toBe('high');
    });

    it('должен обнаруживать потенциальные утечки памяти', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/MemoryLeak.js',
          `
          element.addEventListener('click', handler);
          // No removeEventListener

          setInterval(() => {
            console.log('running');
          }, 1000);
          // No clearInterval

          setTimeout(() => {
            doSomething();
          }, 5000);
          // No clearTimeout
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const memoryLeakPattern = result.detectedPatterns.find(p => p.id === 'memory-leaks');
      expect(memoryLeakPattern).toBeDefined();
      expect(memoryLeakPattern?.type).toBe('performance');
      expect(memoryLeakPattern?.impact).toBe('medium');
    });

    it('должен обнаруживать неэффективные циклы', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/InefficientLoops.js',
          `
          for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
              for (let k = 0; k < items.length; k++) {
                for (let l = 0; l < items.length; l++) {
                  // O(n^4) complexity
                  process(items[i], items[j], items[k], items[l]);
                }
              }
            }
          }

          for (const item of list) {
            if (searchList.indexOf(item.id) !== -1) {
              // Inefficient search in loop
              processItem(item);
            }
          }
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const inefficientLoopsPattern = result.detectedPatterns.find(
        p => p.id === 'inefficient-loops'
      );
      expect(inefficientLoopsPattern).toBeDefined();
      expect(inefficientLoopsPattern?.type).toBe('performance');
      expect(inefficientLoopsPattern?.impact).toBe('medium');
    });
  });

  describe('Проблемы безопасности', () => {
    it('должен обнаруживать SQL Injection уязвимости', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/SqlInjection.js',
          `
          const query = "SELECT * FROM users WHERE id = " + userId;
          const sql = \`INSERT INTO products (name) VALUES (\${productName})\`;
          database.query("DELETE FROM orders WHERE user_id = " + req.params.id);
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const sqlInjectionPattern = result.detectedPatterns.find(p => p.id === 'sql-injection');
      expect(sqlInjectionPattern).toBeDefined();
      expect(sqlInjectionPattern?.type).toBe('security');
      expect(sqlInjectionPattern?.impact).toBe('critical');
      expect(sqlInjectionPattern?.confidence).toBeGreaterThan(80);
    });

    it('должен обнаруживать XSS уязвимости', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/XssVulnerability.js',
          `
          element.innerHTML = userInput;
          document.write(userData);
          eval("console.log('" + userCode + "')");
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const xssPattern = result.detectedPatterns.find(p => p.id === 'xss-vulnerability');
      expect(xssPattern).toBeDefined();
      expect(xssPattern?.type).toBe('security');
      expect(xssPattern?.impact).toBe('critical');
    });

    it('должен обнаруживать захардкоженные секреты', async () => {
      const files: FileStructure[] = [
        createMockFile(
          'src/Secrets.js',
          `
          const password = "mySecretPassword123";
          const apiKey = "sk-1234567890abcdef";
          const token = "bearer_token_12345";
          const secret = "my-app-secret";
          const privateKey = "-----BEGIN PRIVATE KEY-----";
        `
        ),
      ];

      const result = await recognizer.analyzePatterns(files);

      const secretsPattern = result.detectedPatterns.find(p => p.id === 'hardcoded-secrets');
      expect(secretsPattern).toBeDefined();
      expect(secretsPattern?.type).toBe('security');
      expect(secretsPattern?.impact).toBe('critical');
      expect(secretsPattern?.confidence).toBeGreaterThan(90);
    });
  });

  describe('Анализ результатов', () => {
    it('должен правильно рассчитывать архитектурный счет', async () => {
      const files: FileStructure[] = [
        createMockFile('src/GoodArchitecture.js', 'class UserController { /* good code */ }'),
        createMockFile('src/GoodDesign.js', 'const factory = { create() {} };'),
      ];

      const result = await recognizer.analyzePatterns(files);

      expect(result.architecturalScore).toBeGreaterThanOrEqual(0);
      expect(result.architecturalScore).toBeLessThanOrEqual(100);
      expect(result.designQuality).toBeGreaterThanOrEqual(0);
      expect(result.designQuality).toBeLessThanOrEqual(100);
    });

    it('должен создавать корректную сводку', async () => {
      const files: FileStructure[] = [
        createMockFile('src/controllers/UserController.js', 'app.get("/users")'),
        createMockFile('src/models/User.js', 'mongoose.Schema'),
        createMockFile('src/BadCode.js', 'const password = "hardcoded123";'),
      ];

      const result = await recognizer.analyzePatterns(files);

      expect(result.summary).toBeDefined();
      expect(result.summary.goodPatterns).toBeGreaterThanOrEqual(0);
      expect(result.summary.problematicPatterns).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalConfidence).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalConfidence).toBeLessThanOrEqual(100);
      expect(result.summary.predominantArchitecture).toBeTruthy();
    });

    it('должен генерировать рекомендации', async () => {
      const files: FileStructure[] = [
        createMockFile('src/Security.js', 'const secret = "hardcoded";'),
        createMockFile('src/Performance.js', 'users.forEach(u => db.query("SELECT"))'),
      ];

      const result = await recognizer.analyzePatterns(files);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('КРИТИЧНО');
    });

    it('должен фильтровать паттерны по уровню уверенности', async () => {
      const files: FileStructure[] = [createMockFile('src/Minimal.js', 'console.log("hello");')];

      const result = await recognizer.analyzePatterns(files);

      // Все обнаруженные паттерны должны иметь confidence >= 60
      result.detectedPatterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(60);
      });
    });

    it('должен правильно категоризировать проблемы', async () => {
      const files: FileStructure[] = [
        createMockFile('src/Security.js', 'const password = "123";'),
        createMockFile('src/Performance.js', 'for() { db.query() }'),
      ];

      const result = await recognizer.analyzePatterns(files);

      expect(result.securityConcerns.length).toBeGreaterThan(0);
      expect(result.performanceIssues.length).toBeGreaterThan(0);

      result.securityConcerns.forEach(concern => {
        expect(concern.type).toBe('security');
      });

      result.performanceIssues.forEach(issue => {
        expect(issue.type).toBe('performance');
      });
    });
  });

  // Вспомогательная функция для создания мок-файлов
  function createMockFile(path: string, content: string): FileStructure {
    return {
      path,
      content,
      size: content.length,
      dependencies: [],
      exports: [],
      imports: [],
      functions: [],
      classes: [],
      complexity: 1,
    };
  }
});
