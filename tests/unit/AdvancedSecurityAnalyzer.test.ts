import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdvancedSecurityAnalyzer } from '../../eap-analyzer/src/checkers/security/AdvancedSecurityAnalyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AdvancedSecurityAnalyzer', () => {
  let analyzer: AdvancedSecurityAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new AdvancedSecurityAnalyzer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eap-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Task 2.3 - Advanced Security Analysis (+10 New Threat Types)', () => {
    it('should have correct analyzer configuration', () => {
      expect(analyzer.name).toBe('Advanced Security Analyzer');
      expect(analyzer.category).toBe('security');
    });

    it('should analyze cryptographic weaknesses (NEW THREAT TYPE 1)', async () => {
      const testFile = path.join(tempDir, 'crypto-test.js');
      fs.writeFileSync(
        testFile,
        `
        const crypto = require('crypto');

        // Weak crypto algorithms
        const weakHash = crypto.createHash('md5');
        const weakCipher = crypto.createCipher('des', 'key');

        // Hardcoded crypto keys
        const secret = "a1b2c3d4e5f6789012345678901234567890";
        const iv = "1234567890123456";

        // Insecure randomness for crypto
        const token = Math.random() + crypto.randomBytes(16);
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.cryptoSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'crypto-weakness')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'hardcoded-crypto-key')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'insecure-randomness')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('cryptographic algorithms'))).toBe(
        true
      );
    });

    it('should analyze authentication flaws (NEW THREAT TYPE 2)', async () => {
      const testFile = path.join(tempDir, 'auth-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Weak password policy
        if (password.length >= 6) { /* allow login */ }

        // Insecure session management
        sessionStorage.setItem('token', userToken);
        localStorage.setItem('authToken', token);

        // Insecure token generation
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(payload, 'secret');

        // Missing MFA
        function login(username, password) {
          if (validateCredentials(username, password)) {
            return generateToken();
          }
        }
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.authenticationSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'weak-password-policy')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'insecure-session-management')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'insecure-token')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('password policies'))).toBe(true);
    });

    it('should analyze data leakage risks (NEW THREAT TYPE 3)', async () => {
      const testFile = path.join(tempDir, 'leakage-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Sensitive data in logs
        console.log('User password:', user.password);
        console.log('API token:', apiToken);

        // Data in comments
        // password: admin123
        /* API key: abc123def456 */

        // Debug info leaks
        console.trace();
        debugger;
        console.log(JSON.stringify(process.env));

        // Environment data leaks
        console.log(process.env.DATABASE_PASSWORD);
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.dataLeakageSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'sensitive-data-in-logs')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'data-in-comments')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'env-data-leak')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('sensitive data from logs'))).toBe(
        true
      );
    });

    it('should analyze container security issues (NEW THREAT TYPE 4)', async () => {
      const dockerFile = path.join(tempDir, 'Dockerfile');
      fs.writeFileSync(
        dockerFile,
        `
        FROM node:latest
        RUN curl https://get.docker.com | sh
        ADD https://example.com/script.sh /app/
        RUN sudo apt-get update
        ENV PASSWORD=admin123
        COPY .env /app/
      `
      );

      const composeFile = path.join(tempDir, 'docker-compose.yml');
      fs.writeFileSync(
        composeFile,
        `
        version: '3'
        services:
          app:
            privileged: true
            network_mode: host
            security_opt:
              - apparmor:unconfined
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.containerSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'docker-security')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'dockerfile-secrets')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'docker-compose-security')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('Docker security'))).toBe(true);
    });

    it('should analyze deserialization vulnerabilities (NEW THREAT TYPE 5)', async () => {
      const testFile = path.join(tempDir, 'deserial-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Unsafe deserialization
        const data = JSON.parse(req.body.data);
        const userInput = JSON.parse(request.params.input);

        // Dangerous eval usage
        eval(userCode);
        new Function(dynamicCode)();
        setTimeout("alert('xss')", 1000);

        // VM execution
        const vm = require('vm');
        vm.runInThisContext(userScript);
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.deserializationSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'unsafe-deserialization')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'dangerous-eval')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('deserialization'))).toBe(true);
    });

    it('should analyze race condition vulnerabilities (NEW THREAT TYPE 6)', async () => {
      const testFile = path.join(tempDir, 'race-test.js');
      fs.writeFileSync(
        testFile,
        `
        const fs = require('fs');

        // TOCTOU vulnerabilities
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath);
        }

        // Unsafe shared state
        global.counter++;
        window.sharedValue += 1;

        // Race conditions in timers with shared access
        setTimeout(() => {
          global.processedItems++;
        }, 100);

        // TOCTOU pattern
        fs.access('file.txt', (err) => {
          if (!err) fs.open('file.txt', 'r', callback);
        });
      `
      );
      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.raceConditionSecurity).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      // Проверим, что анализ race conditions выполнен
      expect(typeof result.metrics.raceConditionSecurity).toBe('object');
    });

    it('should analyze command injection vulnerabilities (NEW THREAT TYPE 7)', async () => {
      const testFile = path.join(tempDir, 'command-test.js');
      fs.writeFileSync(
        testFile,
        `
        const { exec, spawn } = require('child_process');

        // Command injection risks
        exec('ls ' + req.params.directory);
        spawn('grep', ['-r', userInput + ' /var/log']);

        // Unsafe shell execution
        exec('sh -c "echo ' + userInput + '"');
        spawn('sh', ['-c', 'ls ' + directory], { shell: true });

        // Path injection
        fs.readFile('/app/' + req.params.file);
        require('./' + userModule);
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.commandInjectionSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'command-injection')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'unsafe-shell-execution')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'path-injection')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('parameterized commands'))).toBe(true);
    });

    it('should analyze CORS and CSP vulnerabilities (NEW THREAT TYPE 8)', async () => {
      const testFile = path.join(tempDir, 'cors-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Insecure CORS
        res.header('Access-Control-Allow-Origin', '*');
        app.use(cors({ origin: true, credentials: true }));

        // Open redirects
        res.redirect(req.query.returnUrl);
        window.location = params.redirect;
      `
      );

      const htmlFile = path.join(tempDir, 'index.html');
      fs.writeFileSync(
        htmlFile,
        `
        <!DOCTYPE html>
        <html>
        <head>
          <!-- Missing CSP header -->
          <meta name="viewport" content="width=device-width">
          <title>Test Page</title>
        </head>
        <body>
          <script>
            // Weak CSP would be detected if present
            console.log('test');
          </script>
        </body>
        </html>
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.corsSecurity).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      // Проверим, что CORS анализ выполнен
      expect(typeof result.metrics.corsSecurity).toBe('object');
    });

    it('should analyze path traversal vulnerabilities (NEW THREAT TYPE 9)', async () => {
      const testFile = path.join(tempDir, 'path-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Path traversal risks
        fs.readFile('../../../etc/passwd');
        fs.writeFile('../../config/' + filename);

        // Unsafe file operations
        fs.readFile(req.params.filename);
        fs.createReadStream('/app/' + userPath);

        // Directory traversal
        fs.readdir(baseDir + '/' + req.query.dir);
        require(userInput);
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.pathTraversalSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'path-traversal')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'unsafe-file-operation')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'directory-traversal')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('file paths'))).toBe(true);
    });

    it('should analyze insecure logging practices (NEW THREAT TYPE 10)', async () => {
      const testFile = path.join(tempDir, 'logging-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Sensitive data logging
        console.log('User password:', user.password);
        logger.info('Credit card number:', cardNumber);

        // Log injection risks
        console.log('User input: ' + req.body.message);
        logger.error('Failed login for: ' + username);

        // Unsafe log destinations
        fs.writeFile('/tmp/app.log', logMessage);
        fetch('/api/logs', { body: JSON.stringify(logData) });

        // Excessive logging (20+ statements)
        ${Array.from({ length: 25 }, (_, i) => `console.log('Debug ${i}');`).join('\n')}
      `
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.metrics.loggingSecurity).toBeDefined();
      expect(result.issues.some(issue => issue.type === 'sensitive-data-logging')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'log-injection')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'excessive-logging')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'unsafe-log-destination')).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('logging practices'))).toBe(true);
    });

    it('should handle comprehensive security analysis with multiple threat types', async () => {
      // Create files with multiple security issues
      const jsFile = path.join(tempDir, 'vulnerable.js');
      fs.writeFileSync(
        jsFile,
        `
        const crypto = require('crypto');

        // Multiple vulnerabilities combined
        const weakHash = crypto.createHash('md5'); // Crypto weakness
        console.log('User password:', password); // Data leakage
        exec('ls ' + userInput); // Command injection
        if (fs.existsSync(file)) fs.readFile(file); // Race condition
        eval(userCode); // Deserialization
      `
      );

      const dockerFile = path.join(tempDir, 'Dockerfile');
      fs.writeFileSync(
        dockerFile,
        `
        FROM node:latest
        ENV SECRET=hardcoded123
        RUN curl | sh
      `
      );

      const result = await analyzer.analyze(tempDir);

      // Should detect multiple threat types
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(5);
      expect(result.recommendations.length).toBeGreaterThan(3);
      expect(result.details?.newThreatTypesAdded).toBe(10);
      expect(result.analysisTime).toBeGreaterThan(0);
    });

    it('should provide detailed metrics for security gap reduction', async () => {
      const testFile = path.join(tempDir, 'security-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Create a file with various security issues
        const crypto = require('crypto');
        const weakCipher = crypto.createCipher('des', 'key');
        console.log('Password:', userPassword);
        exec('ls ' + userInput);
      `
      );

      const result = await analyzer.analyze(tempDir);

      // Check that all new threat categories have metrics
      expect(result.metrics.cryptoSecurity).toBeDefined();
      expect(result.metrics.authenticationSecurity).toBeDefined();
      expect(result.metrics.dataLeakageSecurity).toBeDefined();
      expect(result.metrics.containerSecurity).toBeDefined();
      expect(result.metrics.deserializationSecurity).toBeDefined();
      expect(result.metrics.raceConditionSecurity).toBeDefined();
      expect(result.metrics.commandInjectionSecurity).toBeDefined();
      expect(result.metrics.corsSecurity).toBeDefined();
      expect(result.metrics.pathTraversalSecurity).toBeDefined();
      expect(result.metrics.loggingSecurity).toBeDefined();

      // Should provide actionable recommendations
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle analysis errors gracefully', async () => {
      // Test with non-existent directory
      const result = await analyzer.analyze('/non-existent-path');

      expect(result.score).toBe(0);
      expect(result.issues.some(issue => issue.type === 'analysis-error')).toBe(true);
      expect(result.recommendations).toContain('Fix security analysis errors before deployment');
      expect(result.details?.error).toBeDefined();
    });

    it('should meet Task 2.3 performance requirements', async () => {
      // Create a moderate-sized project
      for (let i = 0; i < 10; i++) {
        const testFile = path.join(tempDir, `test-${i}.js`);
        fs.writeFileSync(
          testFile,
          `
          const crypto = require('crypto');
          console.log('Test file ${i}');
          const hash = crypto.createHash('md5');
        `
        );
      }

      const startTime = Date.now();
      const result = await analyzer.analyze(tempDir);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(result.analysisTime).toBeLessThan(5000);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration with existing security architecture', () => {
    it('should complement existing CodeSecurityChecker', async () => {
      const testFile = path.join(tempDir, 'integration-test.js');
      fs.writeFileSync(
        testFile,
        `
        // Traditional security issues (CodeSecurityChecker territory)
        const apiKey = 'sk-1234567890abcdef';
        const query = 'SELECT * FROM users WHERE id = ' + userId;

        // New advanced threats (AdvancedSecurityAnalyzer territory)
        const weakHash = crypto.createHash('md5');
        exec('ls ' + userInput);
        console.log('Password:', password);
      `
      );

      const result = await analyzer.analyze(tempDir);

      // Should focus on advanced threats while maintaining compatibility
      expect(
        result.issues.some(issue =>
          ['crypto-weakness', 'command-injection', 'sensitive-data-logging'].includes(issue.type)
        )
      ).toBe(true);

      expect(result.details?.analyzer).toBe('Advanced Security Analyzer');
      expect(result.details?.category).toBe('security');
    });

    it('should provide security gap reduction metrics for Task 2.3 goals', async () => {
      // Create comprehensive test scenarios
      const vulnerableFile = path.join(tempDir, 'comprehensive.js');
      fs.writeFileSync(
        vulnerableFile,
        `
        // Dependencies security issues
        const oldLibrary = require('vulnerable-lib@1.0.0');

        // Code security issues
        const crypto = require('crypto');
        const weakCipher = crypto.createCipher('des', 'key');
        exec('rm -rf ' + userPath);

        // Config security issues
        const config = {
          password: 'hardcoded123',
          apiKey: process.env.SECRET_KEY,
          debug: true
        };
      `
      );

      const result = await analyzer.analyze(tempDir);

      // Should provide metrics that support achieving:
      // Dependencies Security: 70% → 80%
      // Code Security: 75% → 85%
      // Config Security: 65% → 75%
      expect(result.metrics).toHaveProperty('cryptoSecurity');
      expect(result.metrics).toHaveProperty('commandInjectionSecurity');
      expect(result.metrics).toHaveProperty('dataLeakageSecurity');

      // Should penalize security issues appropriately
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);

      // Should provide actionable recommendations for gap reduction
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
