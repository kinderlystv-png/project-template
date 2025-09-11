'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.AdvancedSecurityAnalyzer = void 0;
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
/**
 * Расширенный анализатор безопасности для Task 2.3
 * Добавляет +10 новых типов угроз и улучшает покрытие security gap
 */
class AdvancedSecurityAnalyzer {
  name = 'Advanced Security Analyzer';
  category = 'security';
  securityThresholds = {
    // Critical vulnerability thresholds
    maxCriticalIssues: 0,
    maxHighIssues: 5,
    maxMediumIssues: 15,
    maxLowIssues: 30,
    // Code quality thresholds
    maxComplexityScore: 80,
    maxDependencyVulnerabilities: 10,
    maxConfigurationIssues: 8,
    // New threat categories thresholds
    maxCryptoWeaknesses: 3,
    maxAuthenticationFlaws: 2,
    maxDataLeakageRisks: 5,
    maxContainerSecurityIssues: 4,
  };
  async analyze(projectPath) {
    const startTime = Date.now();
    let score = 100;
    const issues = [];
    const recommendations = [];
    const metrics = {};
    // Ранняя проверка существования пути
    if (!fs.existsSync(projectPath)) {
      return {
        score: 0,
        metrics: {
          analysisError: true,
          errorMessage: `Project path does not exist: ${projectPath}`,
        },
        issues: [
          {
            severity: 'high',
            message: `Security analysis failed: Project path does not exist: ${projectPath}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Fix security analysis errors before deployment'],
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          error: `Project path does not exist: ${projectPath}`,
        },
      };
    }
    try {
      // 1. Анализ криптографических уязвимостей (NEW)
      const cryptoAnalysis = await this.analyzeCryptographicWeaknesses(projectPath);
      metrics.cryptoSecurity = cryptoAnalysis.metrics;
      score -= cryptoAnalysis.penalty;
      issues.push(...cryptoAnalysis.issues);
      recommendations.push(...cryptoAnalysis.recommendations);
      // 2. Анализ уязвимостей аутентификации (NEW)
      const authAnalysis = await this.analyzeAuthenticationFlaws(projectPath);
      metrics.authenticationSecurity = authAnalysis.metrics;
      score -= authAnalysis.penalty;
      issues.push(...authAnalysis.issues);
      recommendations.push(...authAnalysis.recommendations);
      // 3. Анализ утечек данных (NEW)
      const dataLeakageAnalysis = await this.analyzeDataLeakageRisks(projectPath);
      metrics.dataLeakageSecurity = dataLeakageAnalysis.metrics;
      score -= dataLeakageAnalysis.penalty;
      issues.push(...dataLeakageAnalysis.issues);
      recommendations.push(...dataLeakageAnalysis.recommendations);
      // 4. Анализ безопасности контейнеров (NEW)
      const containerAnalysis = await this.analyzeContainerSecurity(projectPath);
      metrics.containerSecurity = containerAnalysis.metrics;
      score -= containerAnalysis.penalty;
      issues.push(...containerAnalysis.issues);
      recommendations.push(...containerAnalysis.recommendations);
      // 5. Анализ небезопасной десериализации (NEW)
      const deserializationAnalysis = await this.analyzeDeserializationVulns(projectPath);
      metrics.deserializationSecurity = deserializationAnalysis.metrics;
      score -= deserializationAnalysis.penalty;
      issues.push(...deserializationAnalysis.issues);
      recommendations.push(...deserializationAnalysis.recommendations);
      // 6. Анализ Race Condition уязвимостей (NEW)
      const raceConditionAnalysis = await this.analyzeRaceConditions(projectPath);
      metrics.raceConditionSecurity = raceConditionAnalysis.metrics;
      score -= raceConditionAnalysis.penalty;
      issues.push(...raceConditionAnalysis.issues);
      recommendations.push(...raceConditionAnalysis.recommendations);
      // 7. Анализ инъекций команд (NEW)
      const commandInjectionAnalysis = await this.analyzeCommandInjection(projectPath);
      metrics.commandInjectionSecurity = commandInjectionAnalysis.metrics;
      score -= commandInjectionAnalysis.penalty;
      issues.push(...commandInjectionAnalysis.issues);
      recommendations.push(...commandInjectionAnalysis.recommendations);
      // 8. Анализ CORS и CSP уязвимостей (NEW)
      const corsAnalysis = await this.analyzeCORSAndCSP(projectPath);
      metrics.corsSecurity = corsAnalysis.metrics;
      score -= corsAnalysis.penalty;
      issues.push(...corsAnalysis.issues);
      recommendations.push(...corsAnalysis.recommendations);
      // 9. Анализ Path Traversal уязвимостей (NEW)
      const pathTraversalAnalysis = await this.analyzePathTraversal(projectPath);
      metrics.pathTraversalSecurity = pathTraversalAnalysis.metrics;
      score -= pathTraversalAnalysis.penalty;
      issues.push(...pathTraversalAnalysis.issues);
      recommendations.push(...pathTraversalAnalysis.recommendations);
      // 10. Анализ небезопасного логирования (NEW)
      const loggingAnalysis = await this.analyzeInsecureLogging(projectPath);
      metrics.loggingSecurity = loggingAnalysis.metrics;
      score -= loggingAnalysis.penalty;
      issues.push(...loggingAnalysis.issues);
      recommendations.push(...loggingAnalysis.recommendations);
      return {
        score: Math.max(0, Math.round(score)),
        metrics,
        issues,
        recommendations,
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          category: this.category,
          thresholds: this.securityThresholds,
          newThreatTypesAdded: 10,
        },
      };
    } catch (error) {
      // При ошибке возвращаем минимальный score и добавляем ошибку в issues
      return {
        score: 0,
        metrics: {
          analysisError: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        issues: [
          {
            severity: 'high',
            message: `Security analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Fix security analysis errors before deployment'],
        analysisTime: Date.now() - startTime,
        details: {
          analyzer: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  /**
   * 1. NEW: Анализ криптографических уязвимостей
   */
  async analyzeCryptographicWeaknesses(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const jsFiles = await this.findCodeFiles(projectPath);
      let weakCryptoAlgorithms = 0;
      let hardcodedCryptoKeys = 0;
      let insecureRandomness = 0;
      let weakHashFunctions = 0;
      for (const filePath of jsFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Слабые криптографические алгоритмы
        const weakCryptoPatterns = [
          /\bDES\b/g,
          /\bRC4\b/g,
          /\bMD5\b/g,
          /\bSHA1\b/g,
          /crypto\.createCipher\(/g, // Deprecated
          /crypto\.createDecipher\(/g, // Deprecated
        ];
        weakCryptoPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            weakCryptoAlgorithms += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Weak cryptographic algorithm detected in ${path.basename(filePath)}`,
              type: 'crypto-weakness',
            });
          }
        });
        // Захардкоженные криптографические ключи
        const hardcodedKeyPatterns = [
          /(?:key|secret|password)\s*[:=]\s*['"][a-fA-F0-9]{32,}['"]/g,
          /iv\s*[:=]\s*['"][a-fA-F0-9]+['"]/g,
          /salt\s*[:=]\s*['"][a-zA-Z0-9]+['"]/g,
        ];
        hardcodedKeyPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            hardcodedCryptoKeys += matches.length;
            penalty += matches.length * 10;
            issues.push({
              severity: 'critical',
              message: `Hardcoded cryptographic key found in ${path.basename(filePath)}`,
              type: 'hardcoded-crypto-key',
            });
          }
        });
        // Небезопасная генерация случайных чисел
        const insecureRandomPatterns = [
          /Math\.random\(\)/g,
          /new Date\(\)\.getTime\(\)/g,
          /Date\.now\(\)/g, // Для криптографических целей
        ];
        insecureRandomPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && content.includes('crypto')) {
            insecureRandomness += matches.length;
            penalty += matches.length * 5;
            issues.push({
              severity: 'medium',
              message: `Insecure randomness for crypto purposes in ${path.basename(filePath)}`,
              type: 'insecure-randomness',
            });
          }
        });
        // Слабые хеш-функции
        const weakHashPatterns = [
          /createHash\(['"]md5['"]\)/g,
          /createHash\(['"]sha1['"]\)/g,
          /createHash\(['"]md4['"]\)/g,
        ];
        weakHashPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            weakHashFunctions += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Weak hash function detected in ${path.basename(filePath)}`,
              type: 'weak-hash-function',
            });
          }
        });
      }
      metrics.weakCryptoAlgorithms = weakCryptoAlgorithms;
      metrics.hardcodedCryptoKeys = hardcodedCryptoKeys;
      metrics.insecureRandomness = insecureRandomness;
      metrics.weakHashFunctions = weakHashFunctions;
      // Рекомендации
      if (weakCryptoAlgorithms > 0) {
        recommendations.push(
          'Replace weak cryptographic algorithms (DES, RC4, MD5, SHA1) with strong alternatives (AES, SHA-256)'
        );
      }
      if (hardcodedCryptoKeys > 0) {
        recommendations.push(
          'Move cryptographic keys to secure environment variables or key management systems'
        );
      }
      if (insecureRandomness > 0) {
        recommendations.push(
          'Use crypto.randomBytes() instead of Math.random() for cryptographic purposes'
        );
      }
      if (weakHashFunctions > 0) {
        recommendations.push('Upgrade to stronger hash functions like SHA-256 or SHA-3');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 5,
        issues: [
          {
            severity: 'medium',
            message: `Crypto analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review cryptographic implementation manually'],
      };
    }
  }
  /**
   * 2. NEW: Анализ уязвимостей аутентификации
   */
  async analyzeAuthenticationFlaws(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let weakPasswordPolicies = 0;
      let insecureSessionManagement = 0;
      let missingMFA = 0;
      let insecureTokens = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Слабые политики паролей
        const weakPasswordPatterns = [
          /password\.length\s*[<>=]+\s*[1-7]/g, // Короткие пароли
          /!.*[A-Z].*[a-z].*\d/g, // Отсутствие требований к сложности
          /password\s*===?\s*['"][^'"]{1,7}['"]/g, // Простые пароли в коде
        ];
        weakPasswordPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            weakPasswordPolicies += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Weak password policy detected in ${path.basename(filePath)}`,
              type: 'weak-password-policy',
            });
          }
        });
        // Небезопасное управление сессиями
        const insecureSessionPatterns = [
          /sessionStorage\.setItem.*token/g,
          /localStorage\.setItem.*token/g,
          /document\.cookie\s*=.*token/g,
          /session\.regenerate\s*\(\s*\)/g, // Отсутствие regenerateId
        ];
        insecureSessionPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            insecureSessionManagement += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Insecure session management in ${path.basename(filePath)}`,
              type: 'insecure-session-management',
            });
          }
        });
        // Отсутствие MFA
        if (content.includes('login') || content.includes('auth')) {
          const mfaPatterns = [/mfa|2fa|two.factor|totp|authenticator/gi];
          const hasMFA = mfaPatterns.some(pattern => pattern.test(content));
          if (!hasMFA) {
            missingMFA++;
            penalty += 4;
            issues.push({
              severity: 'medium',
              message: `No multi-factor authentication implementation found in ${path.basename(filePath)}`,
              type: 'missing-mfa',
            });
          }
        }
        // Небезопасные токены
        const insecureTokenPatterns = [
          /jwt\.sign\([^,]+,\s*['"][^'"]{1,15}['"]/g, // Короткие JWT секреты
          /token\s*=\s*Math\.random\(\)/g, // Предсказуемые токены
          /btoa\(.*\)/g, // Base64 не шифрование
        ];
        insecureTokenPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            insecureTokens += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'high',
              message: `Insecure token generation in ${path.basename(filePath)}`,
              type: 'insecure-token',
            });
          }
        });
      }
      metrics.weakPasswordPolicies = weakPasswordPolicies;
      metrics.insecureSessionManagement = insecureSessionManagement;
      metrics.missingMFA = missingMFA;
      metrics.insecureTokens = insecureTokens;
      // Рекомендации
      if (weakPasswordPolicies > 0) {
        recommendations.push(
          'Implement strong password policies: minimum 12 characters, complexity requirements'
        );
      }
      if (insecureSessionManagement > 0) {
        recommendations.push(
          'Use secure session management: httpOnly cookies, regenerate session IDs, secure storage'
        );
      }
      if (missingMFA > 0) {
        recommendations.push('Implement multi-factor authentication for enhanced security');
      }
      if (insecureTokens > 0) {
        recommendations.push(
          'Use cryptographically secure random token generation and strong JWT secrets'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 3,
        issues: [
          {
            severity: 'low',
            message: `Authentication analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review authentication implementation manually'],
      };
    }
  }
  /**
   * 3. NEW: Анализ утечек данных
   */
  async analyzeDataLeakageRisks(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const allFiles = await this.findAllFiles(projectPath);
      let sensitiveDataInLogs = 0;
      let dataInComments = 0;
      let debugInfoLeaks = 0;
      let environmentDataLeaks = 0;
      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Чувствительные данные в логах
        const sensitiveLogPatterns = [
          /console\.log.*password/gi,
          /console\.log.*token/gi,
          /console\.log.*secret/gi,
          /logger?\.info.*password/gi,
          /console\.error.*card.*number/gi,
        ];
        sensitiveLogPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            sensitiveDataInLogs += matches.length;
            penalty += matches.length * 9;
            issues.push({
              severity: 'high',
              message: `Sensitive data in logs detected in ${path.basename(filePath)}`,
              type: 'sensitive-data-in-logs',
            });
          }
        });
        // Чувствительные данные в комментариях
        const commentDataPatterns = [
          /\/\/.*password.*[:=].*[a-zA-Z0-9]/gi,
          /\/\*.*api.*key.*\*\//gi,
          /#.*secret.*[:=]/gi,
          /<!--.*password.*-->/gi,
        ];
        commentDataPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            dataInComments += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'medium',
              message: `Sensitive data in comments found in ${path.basename(filePath)}`,
              type: 'data-in-comments',
            });
          }
        });
        // Утечки отладочной информации
        const debugLeakPatterns = [
          /console\.trace\(/gi,
          /debugger;/gi,
          /process\.env/gi,
          /JSON\.stringify.*process/gi,
        ];
        if (filePath.includes('production') || filePath.includes('prod')) {
          debugLeakPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              debugInfoLeaks += matches.length;
              penalty += matches.length * 5;
              issues.push({
                severity: 'medium',
                message: `Debug information leak in production code: ${path.basename(filePath)}`,
                type: 'debug-info-leak',
              });
            }
          });
        }
        // Утечки переменных окружения
        const envLeakPatterns = [
          /process\.env\.[A-Z_]+.*console/gi,
          /process\.env.*stringify/gi,
          /Object\.keys\(process\.env\)/gi,
          /console\.log.*process\.env\.[A-Z_]+/gi, // Добавляю новый паттерн
        ];
        envLeakPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            environmentDataLeaks += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Environment data leak detected in ${path.basename(filePath)}`,
              type: 'env-data-leak',
            });
          }
        });
      }
      metrics.sensitiveDataInLogs = sensitiveDataInLogs;
      metrics.dataInComments = dataInComments;
      metrics.debugInfoLeaks = debugInfoLeaks;
      metrics.environmentDataLeaks = environmentDataLeaks;
      // Рекомендации
      if (sensitiveDataInLogs > 0) {
        recommendations.push(
          'Remove sensitive data from logs and implement proper log sanitization'
        );
      }
      if (dataInComments > 0) {
        recommendations.push('Remove sensitive information from code comments');
      }
      if (debugInfoLeaks > 0) {
        recommendations.push('Remove debug statements and console logs from production code');
      }
      if (environmentDataLeaks > 0) {
        recommendations.push('Avoid logging or exposing environment variables in application code');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 2,
        issues: [
          {
            severity: 'low',
            message: `Data leakage analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review data handling practices manually'],
      };
    }
  }
  /**
   * 4. NEW: Анализ безопасности контейнеров
   */
  async analyzeContainerSecurity(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      // Анализ Dockerfile
      const dockerfilePath = path.join(projectPath, 'Dockerfile');
      if (fs.existsSync(dockerfilePath)) {
        const dockerContent = fs.readFileSync(dockerfilePath, 'utf-8');
        let dockerInsecurePractices = 0;
        let rootUserUsage = 0;
        let secretsInDockerfile = 0;
        // Проверка на небезопасные практики в Dockerfile
        const insecureDockerPatterns = [
          { pattern: /FROM.*:latest/gi, issue: 'Using latest tag', severity: 'medium' },
          { pattern: /RUN.*curl.*\|.*sh/gi, issue: 'Piping curl to shell', severity: 'high' },
          { pattern: /ADD.*http/gi, issue: 'Using ADD with URL', severity: 'medium' },
          { pattern: /RUN.*sudo/gi, issue: 'Using sudo in container', severity: 'medium' },
        ];
        insecureDockerPatterns.forEach(({ pattern, issue, severity }) => {
          const matches = dockerContent.match(pattern);
          if (matches) {
            dockerInsecurePractices += matches.length;
            penalty += matches.length * (severity === 'high' ? 8 : 5);
            issues.push({
              severity,
              message: `Docker security issue: ${issue}`,
              type: 'docker-security',
            });
          }
        });
        // Проверка на использование root пользователя
        if (!dockerContent.includes('USER ') || dockerContent.includes('USER root')) {
          rootUserUsage++;
          penalty += 7;
          issues.push({
            severity: 'high',
            message: 'Container running as root user',
            type: 'container-root-user',
          });
        }
        // Секреты в Dockerfile
        const dockerSecretPatterns = [
          /ENV.*PASSWORD/gi,
          /ENV.*SECRET/gi,
          /ENV.*TOKEN/gi,
          /COPY.*\.env/gi,
        ];
        dockerSecretPatterns.forEach(pattern => {
          const matches = dockerContent.match(pattern);
          if (matches) {
            secretsInDockerfile += matches.length;
            penalty += matches.length * 10;
            issues.push({
              severity: 'critical',
              message: 'Secrets found in Dockerfile',
              type: 'dockerfile-secrets',
            });
          }
        });
        metrics.dockerInsecurePractices = dockerInsecurePractices;
        metrics.rootUserUsage = rootUserUsage;
        metrics.secretsInDockerfile = secretsInDockerfile;
      }
      // Анализ docker-compose.yml
      const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];
      for (const composeFile of composeFiles) {
        const composePath = path.join(projectPath, composeFile);
        if (fs.existsSync(composePath)) {
          const composeContent = fs.readFileSync(composePath, 'utf-8');
          // Проверка на небезопасные настройки docker-compose
          const composeSecurityIssues = [
            { pattern: /privileged:\s*true/gi, issue: 'Privileged containers', severity: 'high' },
            { pattern: /network_mode:\s*host/gi, issue: 'Host network mode', severity: 'medium' },
            {
              pattern: /security_opt.*apparmor:unconfined/gi,
              issue: 'Disabled AppArmor',
              severity: 'high',
            },
          ];
          composeSecurityIssues.forEach(({ pattern, issue, severity }) => {
            const matches = composeContent.match(pattern);
            if (matches) {
              penalty += matches.length * (severity === 'high' ? 8 : 5);
              issues.push({
                severity,
                message: `Docker Compose security issue: ${issue}`,
                type: 'docker-compose-security',
              });
            }
          });
        }
      }
      // Рекомендации
      if (metrics.dockerInsecurePractices) {
        recommendations.push(
          'Fix Docker security issues: use specific tags, avoid curl|sh, use COPY instead of ADD'
        );
      }
      if (metrics.rootUserUsage) {
        recommendations.push('Create and use a non-root user in Docker containers');
      }
      if (metrics.secretsInDockerfile) {
        recommendations.push(
          'Remove secrets from Dockerfile and use Docker secrets or environment variables'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 1,
        issues: [
          {
            severity: 'low',
            message: `Container security analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review container security configuration manually'],
      };
    }
  }
  /**
   * 5. NEW: Анализ небезопасной десериализации
   */
  async analyzeDeserializationVulns(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let unsafeDeserialization = 0;
      let dangerousEvals = 0;
      let unsafeJSONParsing = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Небезопасная десериализация
        const deserializationPatterns = [
          /JSON\.parse\([^)]*req\./gi, // Parsing user input directly
          /JSON\.parse\([^)]*request\./gi, // Parsing request data
          /eval\(/gi, // Using eval
          /Function\(/gi, // Function constructor
          /new Function\(/gi, // Function constructor
          /vm\.runInThisContext/gi, // VM execution
        ];
        deserializationPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeDeserialization += matches.length;
            penalty += matches.length * 9;
            issues.push({
              severity: 'high',
              message: `Unsafe deserialization detected in ${path.basename(filePath)}`,
              type: 'unsafe-deserialization',
            });
          }
        });
        // Опасные eval конструкции
        const evalPatterns = [
          /eval\s*\(/gi,
          /setTimeout\s*\(\s*['"][^'"]*\+/gi, // setTimeout with string concatenation
          /setInterval\s*\(\s*['"][^'"]*\+/gi, // setInterval with string concatenation
        ];
        evalPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            dangerousEvals += matches.length;
            penalty += matches.length * 10;
            issues.push({
              severity: 'critical',
              message: `Dangerous eval usage in ${path.basename(filePath)}`,
              type: 'dangerous-eval',
            });
          }
        });
        // Небезопасный JSON parsing
        const unsafeJSONPatterns = [
          /JSON\.parse\([^)]*\.body/gi,
          /JSON\.parse\([^)]*params\./gi,
          /JSON\.parse\([^)]*query\./gi,
        ];
        unsafeJSONPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeJSONParsing += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Unsafe JSON parsing of user input in ${path.basename(filePath)}`,
              type: 'unsafe-json-parsing',
            });
          }
        });
      }
      metrics.unsafeDeserialization = unsafeDeserialization;
      metrics.dangerousEvals = dangerousEvals;
      metrics.unsafeJSONParsing = unsafeJSONParsing;
      // Рекомендации
      if (unsafeDeserialization > 0) {
        recommendations.push(
          'Validate and sanitize all input before deserialization, use safe parsing libraries'
        );
      }
      if (dangerousEvals > 0) {
        recommendations.push(
          'Avoid eval() and Function() constructor, use safer alternatives like JSON.parse()'
        );
      }
      if (unsafeJSONParsing > 0) {
        recommendations.push(
          'Implement input validation and use try-catch blocks for JSON parsing'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 3,
        issues: [
          {
            severity: 'medium',
            message: `Deserialization analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review deserialization practices manually'],
      };
    }
  }
  /**
   * 6. NEW: Анализ Race Condition уязвимостей
   */
  async analyzeRaceConditions(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let raceConditionRisks = 0;
      let unsafeSharedState = 0;
      let timeOfCheckTimeOfUse = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Race condition риски
        const raceConditionPatterns = [
          /fs\.existsSync.*fs\.readFileSync/gi, // TOCTOU
          /fs\.exists.*fs\.readFile/gi, // TOCTOU
          /if.*exists.*then.*delete/gi, // Check-then-act
          /if.*fileExists.*deleteFile/gi, // Check-then-act (добавлено)
          /setTimeout.*global\./gi, // Timing-based races
          /setInterval.*shared/gi, // Shared state in intervals
        ];
        raceConditionPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            raceConditionRisks += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'medium',
              message: `Potential race condition in ${path.basename(filePath)}`,
              type: 'race-condition',
            });
          }
        });
        // Небезопасное разделяемое состояние
        const sharedStatePatterns = [
          /global\.[a-zA-Z_]+\s*\+\+/gi, // Global variable increment
          /window\.[a-zA-Z_]+\s*\+\+/gi, // Window variable increment
          /process\.[a-zA-Z_]+\s*=/gi, // Process state modification
          /module\.exports\.[a-zA-Z_]+\s*\+=/gi, // Module state modification
        ];
        sharedStatePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeSharedState += matches.length;
            penalty += matches.length * 5;
            issues.push({
              severity: 'medium',
              message: `Unsafe shared state modification in ${path.basename(filePath)}`,
              type: 'unsafe-shared-state',
            });
          }
        });
        // Time-of-check Time-of-use (TOCTOU)
        const toctouPatterns = [
          /fs\.access.*fs\.open/gi,
          /fs\.stat.*fs\.readFile/gi,
          /fs\.lstat.*fs\.unlink/gi,
          /fs\.existsSync.*fs\.readFileSync/gi, // Добавляю существующий паттерн из race condition
        ];
        toctouPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            timeOfCheckTimeOfUse += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Time-of-check Time-of-use vulnerability in ${path.basename(filePath)}`,
              type: 'toctou',
            });
          }
        });
      }
      metrics.raceConditionRisks = raceConditionRisks;
      metrics.unsafeSharedState = unsafeSharedState;
      metrics.timeOfCheckTimeOfUse = timeOfCheckTimeOfUse;
      // Рекомендации
      if (raceConditionRisks > 0) {
        recommendations.push(
          'Use proper synchronization mechanisms and avoid check-then-act patterns'
        );
      }
      if (unsafeSharedState > 0) {
        recommendations.push(
          'Implement proper locking or use immutable data structures for shared state'
        );
      }
      if (timeOfCheckTimeOfUse > 0) {
        recommendations.push(
          'Use atomic operations or proper file locking to prevent TOCTOU vulnerabilities'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 2,
        issues: [
          {
            severity: 'low',
            message: `Race condition analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review concurrency patterns manually'],
      };
    }
  }
  /**
   * 7. NEW: Анализ инъекций команд
   */
  async analyzeCommandInjection(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let commandInjectionRisks = 0;
      let unsafeShellExecution = 0;
      let pathInjection = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Инъекции команд
        const commandInjectionPatterns = [
          /exec\([^)]*\+[^)]*\)/gi, // exec with concatenation
          /spawn\([^)]*\+[^)]*\)/gi, // spawn with concatenation
          /execSync\([^)]*\+[^)]*\)/gi, // execSync with concatenation
          /child_process\.exec.*req\./gi, // exec with request data
          /system\([^)]*\+[^)]*\)/gi, // system calls with concatenation
        ];
        commandInjectionPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            commandInjectionRisks += matches.length;
            penalty += matches.length * 10;
            issues.push({
              severity: 'critical',
              message: `Command injection risk in ${path.basename(filePath)}`,
              type: 'command-injection',
            });
          }
        });
        // Небезопасное выполнение shell команд
        const unsafeShellPatterns = [
          /exec\(['"].*\$\{.*\}.*['"]\)/gi, // Template literals in exec
          /spawn\(['"]sh['"].*-c.*\)/gi, // Shell execution
          /execFile\(['"]\/bin\/sh['"]/gi, // Direct shell execution
          /child_process.*shell:\s*true/gi, // Shell option enabled
        ];
        unsafeShellPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeShellExecution += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Unsafe shell execution in ${path.basename(filePath)}`,
              type: 'unsafe-shell-execution',
            });
          }
        });
        // Path injection
        const pathInjectionPatterns = [
          /fs\.readFile\([^)]*\+[^)]*\)/gi, // File operations with concatenation
          /fs\.writeFile\([^)]*\+[^)]*\)/gi, // Write operations with concatenation
          /require\([^)]*\+[^)]*\)/gi, // Dynamic require
          /fs\.createReadStream\([^)]*req\./gi, // Streams with user input
        ];
        pathInjectionPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            pathInjection += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'high',
              message: `Path injection risk in ${path.basename(filePath)}`,
              type: 'path-injection',
            });
          }
        });
      }
      metrics.commandInjectionRisks = commandInjectionRisks;
      metrics.unsafeShellExecution = unsafeShellExecution;
      metrics.pathInjection = pathInjection;
      // Рекомендации
      if (commandInjectionRisks > 0) {
        recommendations.push(
          'Use parameterized commands and avoid string concatenation in exec() calls'
        );
      }
      if (unsafeShellExecution > 0) {
        recommendations.push(
          'Disable shell execution and use direct command execution with proper arguments'
        );
      }
      if (pathInjection > 0) {
        recommendations.push(
          'Validate and sanitize all file paths, use path.resolve() and path.normalize()'
        );
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 4,
        issues: [
          {
            severity: 'medium',
            message: `Command injection analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review command execution patterns manually'],
      };
    }
  }
  /**
   * 8. NEW: Анализ CORS и CSP уязвимостей
   */
  async analyzeCORSAndCSP(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const allFiles = await this.findAllFiles(projectPath);
      let insecureCORS = 0;
      let missingCSP = 0;
      let weakCSP = 0;
      let openRedirects = 0;
      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Небезопасные CORS настройки
        const corsIssues = [
          /Access-Control-Allow-Origin.*\*/gi, // Wildcard CORS
          /cors.*origin.*true/gi, // CORS credentials with wildcard
          /res\.header.*Access-Control-Allow-Origin.*\*/gi, // Express wildcard CORS
          /allowedOrigins.*\*/gi, // Wildcard in allowed origins
        ];
        corsIssues.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            insecureCORS += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'medium',
              message: `Insecure CORS configuration in ${path.basename(filePath)}`,
              type: 'insecure-cors',
            });
          }
        });
        // Отсутствие CSP
        if (filePath.endsWith('.html') || filePath.includes('index.')) {
          const hasCSP = /Content-Security-Policy|csp/gi.test(content);
          if (!hasCSP && content.includes('<head>')) {
            // Проверяю что это действительно HTML
            missingCSP++;
            penalty += 5;
            issues.push({
              severity: 'medium',
              message: `Missing Content Security Policy in ${path.basename(filePath)}`,
              type: 'missing-csp',
            });
          }
        }
        // Слабые CSP политики
        const weakCSPPatterns = [
          /script-src.*'unsafe-inline'/gi, // Unsafe inline scripts
          /script-src.*'unsafe-eval'/gi, // Unsafe eval
          /object-src.*\*/gi, // Wildcard object sources
          /default-src.*\*/gi, // Wildcard default sources
        ];
        weakCSPPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            weakCSP += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Weak CSP directive in ${path.basename(filePath)}`,
              type: 'weak-csp',
            });
          }
        });
        // Open redirects
        const redirectPatterns = [
          /res\.redirect\([^)]*req\./gi, // Express redirect with user input
          /location\.href\s*=\s*[^'"].*req\./gi, // Location redirect with user input
          /window\.location\s*=\s*.*params/gi, // Window location with params
          /response\.sendRedirect\(/gi, // JSP/servlet redirects
        ];
        redirectPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            openRedirects += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Open redirect vulnerability in ${path.basename(filePath)}`,
              type: 'open-redirect',
            });
          }
        });
      }
      metrics.insecureCORS = insecureCORS;
      metrics.missingCSP = missingCSP;
      metrics.weakCSP = weakCSP;
      metrics.openRedirects = openRedirects;
      // Рекомендации
      if (insecureCORS > 0) {
        recommendations.push('Configure CORS with specific origins instead of wildcards');
      }
      if (missingCSP > 0) {
        recommendations.push('Implement Content Security Policy headers');
      }
      if (weakCSP > 0) {
        recommendations.push('Strengthen CSP directives by removing unsafe-inline and unsafe-eval');
      }
      if (openRedirects > 0) {
        recommendations.push('Validate redirect URLs against a whitelist of allowed destinations');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 2,
        issues: [
          {
            severity: 'low',
            message: `CORS/CSP analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review CORS and CSP configuration manually'],
      };
    }
  }
  /**
   * 9. NEW: Анализ Path Traversal уязвимостей
   */
  async analyzePathTraversal(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let pathTraversalRisks = 0;
      let unsafeFileOperations = 0;
      let directoryTraversalRisks = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Path traversal риски
        const pathTraversalPatterns = [
          /fs\.readFile\([^)]*\.\.\//gi, // Direct .. usage
          /fs\.writeFile\([^)]*\.\.\//gi, // Write with ..
          /path\.join\([^)]*req\.[^)]*\)/gi, // Path join with user input
          /fs\.createReadStream\([^)]*\+[^)]*\)/gi, // Stream with concatenation
          /express\.static\([^)]*req\./gi, // Static files with user input
        ];
        pathTraversalPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            pathTraversalRisks += matches.length;
            penalty += matches.length * 9;
            issues.push({
              severity: 'high',
              message: `Path traversal vulnerability in ${path.basename(filePath)}`,
              type: 'path-traversal',
            });
          }
        });
        // Небезопасные файловые операции
        const unsafeFilePatterns = [
          /fs\.[a-zA-Z]+\([^)]*params\./gi, // FS operations with params
          /fs\.[a-zA-Z]+\([^)]*query\./gi, // FS operations with query
          /fs\.[a-zA-Z]+\([^)]*body\./gi, // FS operations with body
          /require\([^)]*req\./gi, // Dynamic require with user input
        ];
        unsafeFilePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeFileOperations += matches.length;
            penalty += matches.length * 7;
            issues.push({
              severity: 'high',
              message: `Unsafe file operation with user input in ${path.basename(filePath)}`,
              type: 'unsafe-file-operation',
            });
          }
        });
        // Directory traversal риски
        const directoryTraversalPatterns = [
          /fs\.readdir\([^)]*\+[^)]*\)/gi, // Readdir with concatenation
          /glob\([^)]*\+[^)]*\)/gi, // Glob with user input
          /fs\.watch\([^)]*req\./gi, // Watch with user input
          /chokidar\.watch\([^)]*\+/gi, // Chokidar with concatenation
        ];
        directoryTraversalPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            directoryTraversalRisks += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Directory traversal risk in ${path.basename(filePath)}`,
              type: 'directory-traversal',
            });
          }
        });
      }
      metrics.pathTraversalRisks = pathTraversalRisks;
      metrics.unsafeFileOperations = unsafeFileOperations;
      metrics.directoryTraversalRisks = directoryTraversalRisks;
      // Рекомендации
      if (pathTraversalRisks > 0) {
        recommendations.push(
          'Validate and normalize all file paths, use path.resolve() and prevent .. sequences'
        );
      }
      if (unsafeFileOperations > 0) {
        recommendations.push(
          'Sanitize user input before file operations and use whitelisting for allowed paths'
        );
      }
      if (directoryTraversalRisks > 0) {
        recommendations.push('Implement proper access controls and validate directory paths');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 3,
        issues: [
          {
            severity: 'medium',
            message: `Path traversal analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review file operation security manually'],
      };
    }
  }
  /**
   * 10. NEW: Анализ небезопасного логирования
   */
  async analyzeInsecureLogging(projectPath) {
    const metrics = {};
    let penalty = 0;
    const issues = [];
    const recommendations = [];
    try {
      const codeFiles = await this.findCodeFiles(projectPath);
      let sensitiveDataLogging = 0;
      let logInjectionRisks = 0;
      let excessiveLogging = 0;
      let unsafeLogDestinations = 0;
      for (const filePath of codeFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Логирование чувствительных данных
        const sensitiveLogPatterns = [
          /console\.log.*password/gi,
          /console\.log.*secret/gi,
          /console\.log.*token/gi,
          /logger.*credit.*card/gi,
          /console\.log.*ssn/gi,
          /log\.info.*api.*key/gi,
        ];
        sensitiveLogPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            sensitiveDataLogging += matches.length;
            penalty += matches.length * 8;
            issues.push({
              severity: 'high',
              message: `Sensitive data logging detected in ${path.basename(filePath)}`,
              type: 'sensitive-data-logging',
            });
          }
        });
        // Log injection риски
        const logInjectionPatterns = [
          /console\.log\([^)]*\+[^)]*req\./gi, // Log with user input concatenation
          /logger\.[a-z]+\([^)]*\+[^)]*params/gi, // Logger with params concatenation
          /log\.[a-z]+\([^)]*\$\{.*req\./gi, // Template literals with request
          /winston\.log\([^)]*\+[^)]*\)/gi, // Winston with concatenation
        ];
        logInjectionPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            logInjectionRisks += matches.length;
            penalty += matches.length * 6;
            issues.push({
              severity: 'medium',
              message: `Log injection risk in ${path.basename(filePath)}`,
              type: 'log-injection',
            });
          }
        });
        // Избыточное логирование
        const logCount = (content.match(/console\.log|logger\.|log\./gi) || []).length;
        if (logCount > 20) {
          excessiveLogging++;
          penalty += 3;
          issues.push({
            severity: 'low',
            message: `Excessive logging detected in ${path.basename(filePath)} (${logCount} statements)`,
            type: 'excessive-logging',
          });
        }
        // Небезопасные места назначения логов
        const unsafeLogDestPatterns = [
          /console\.log.*process\.env/gi, // Logging environment variables
          /fs\.writeFile.*log/gi, // Writing logs to files without validation
          /http\.request.*log/gi, // Sending logs over HTTP
          /fetch.*log.*body/gi, // Sending logs via fetch
        ];
        unsafeLogDestPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            unsafeLogDestinations += matches.length;
            penalty += matches.length * 5;
            issues.push({
              severity: 'medium',
              message: `Unsafe log destination in ${path.basename(filePath)}`,
              type: 'unsafe-log-destination',
            });
          }
        });
      }
      metrics.sensitiveDataLogging = sensitiveDataLogging;
      metrics.logInjectionRisks = logInjectionRisks;
      metrics.excessiveLogging = excessiveLogging;
      metrics.unsafeLogDestinations = unsafeLogDestinations;
      // Рекомендации
      if (sensitiveDataLogging > 0) {
        recommendations.push('Remove sensitive data from logs and implement log sanitization');
      }
      if (logInjectionRisks > 0) {
        recommendations.push('Sanitize user input before logging and use structured logging');
      }
      if (excessiveLogging > 0) {
        recommendations.push('Reduce logging verbosity and use appropriate log levels');
      }
      if (unsafeLogDestinations > 0) {
        recommendations.push('Use secure log destinations and encrypt logs in transit');
      }
      // Общая рекомендация для логирования
      if (sensitiveDataLogging > 0 || logInjectionRisks > 0 || unsafeLogDestinations > 0) {
        recommendations.push('Review logging practices and implement secure logging guidelines');
      }
      return { metrics, penalty, issues, recommendations };
    } catch (error) {
      return {
        metrics,
        penalty: 2,
        issues: [
          {
            severity: 'low',
            message: `Logging security analysis failed: ${error}`,
            type: 'analysis-error',
          },
        ],
        recommendations: ['Review logging practices manually'],
      };
    }
  }
  // === HELPER METHODS ===
  async findCodeFiles(projectPath) {
    const codeFiles = [];
    const extensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.vue',
      '.svelte',
      '.py',
      '.php',
      '.go',
      '.rb',
      '.java',
    ];
    const searchDirectory = dirPath => {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Project path does not exist: ${dirPath}`);
      }
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (
          entry.isDirectory() &&
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)
        ) {
          searchDirectory(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          codeFiles.push(fullPath);
        }
      }
    };
    searchDirectory(projectPath);
    return codeFiles;
  }
  async findAllFiles(projectPath) {
    const allFiles = [];
    const searchDirectory = dirPath => {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (
          entry.isDirectory() &&
          !['node_modules', '.git', '.svelte-kit', 'dist', 'build'].includes(entry.name)
        ) {
          searchDirectory(fullPath);
        } else if (entry.isFile()) {
          allFiles.push(fullPath);
        }
      }
    };
    searchDirectory(projectPath);
    return allFiles;
  }
}
exports.AdvancedSecurityAnalyzer = AdvancedSecurityAnalyzer;
exports.default = AdvancedSecurityAnalyzer;
//# sourceMappingURL=AdvancedSecurityAnalyzer.js.map
