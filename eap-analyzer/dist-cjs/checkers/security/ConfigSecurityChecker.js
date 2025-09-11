'use strict';
/**
 * Config Security Checker
 * Анализ безопасности конфигурационных файлов
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigSecurityChecker = void 0;
const fs_1 = require('fs');
const path_1 = require('path');
const RecommendationEngine_1 = require('../../recommendations/RecommendationEngine');
class ConfigSecurityChecker {
  constructor() {
    // RecommendationEngine используется как статический класс
  }
  /**
   * Выполняет анализ безопасности конфигураций
   */
  async checkConfigSecurity(projectPath) {
    const result = {
      issues: [],
      checkedConfigs: [],
      summary: {
        corsIssues: 0,
        envExposure: 0,
        debugMode: 0,
        insecureConfigs: 0,
        missingSecurity: 0,
      },
    };
    try {
      // Проверяем различные типы конфигураций
      await this.checkViteConfig(projectPath, result);
      await this.checkEnvFiles(projectPath, result);
      await this.checkPackageJson(projectPath, result);
      await this.checkDockerConfig(projectPath, result);
      await this.checkNginxConfig(projectPath, result);
      // Подсчитываем статистику
      result.summary = this.calculateSummary(result.issues);
    } catch (error) {
      console.warn('ConfigSecurityChecker: Error during analysis:', error);
    }
    return result;
  }
  /**
   * Проверяет конфигурацию Vite
   */
  async checkViteConfig(projectPath, result) {
    const configFiles = ['vite.config.js', 'vite.config.ts', 'vite.config.complex.ts'];
    for (const configFile of configFiles) {
      const configPath = (0, path_1.join)(projectPath, configFile);
      if ((0, fs_1.existsSync)(configPath)) {
        result.checkedConfigs.push(configFile);
        try {
          const content = (0, fs_1.readFileSync)(configPath, 'utf-8');
          // Проверяем CORS настройки
          this.checkCorsConfig(content, configFile, result);
          // Проверяем режим разработки в production
          this.checkDevModeInProduction(content, configFile, result);
          // Проверяем expose настройки
          this.checkExposeConfig(content, configFile, result);
        } catch (error) {
          console.warn(`Failed to read ${configFile}:`, error);
        }
      }
    }
  }
  /**
   * Проверяет .env файлы
   */
  async checkEnvFiles(projectPath, result) {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];
    for (const envFile of envFiles) {
      const envPath = (0, path_1.join)(projectPath, envFile);
      if ((0, fs_1.existsSync)(envPath)) {
        result.checkedConfigs.push(envFile);
        try {
          const content = (0, fs_1.readFileSync)(envPath, 'utf-8');
          // Проверяем на exposure секретов
          this.checkEnvExposure(content, envFile, result);
          // Проверяем debug настройки
          this.checkDebugSettings(content, envFile, result);
        } catch (error) {
          console.warn(`Failed to read ${envFile}:`, error);
        }
      }
    }
  }
  /**
   * Проверяет package.json
   */
  async checkPackageJson(projectPath, result) {
    const packagePath = (0, path_1.join)(projectPath, 'package.json');
    if ((0, fs_1.existsSync)(packagePath)) {
      result.checkedConfigs.push('package.json');
      try {
        const content = (0, fs_1.readFileSync)(packagePath, 'utf-8');
        const packageJson = JSON.parse(content);
        // Проверяем scripts на небезопасные команды
        this.checkPackageScripts(packageJson, 'package.json', result);
        // Проверяем на наличие security-related dependencies
        this.checkSecurityDependencies(packageJson, 'package.json', result);
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }
  }
  /**
   * Проверяет Docker конфигурацию
   */
  async checkDockerConfig(projectPath, result) {
    const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'];
    for (const dockerFile of dockerFiles) {
      const dockerPath = (0, path_1.join)(projectPath, dockerFile);
      if ((0, fs_1.existsSync)(dockerPath)) {
        result.checkedConfigs.push(dockerFile);
        try {
          const content = (0, fs_1.readFileSync)(dockerPath, 'utf-8');
          this.checkDockerSecurity(content, dockerFile, result);
        } catch (error) {
          console.warn(`Failed to read ${dockerFile}:`, error);
        }
      }
    }
  }
  /**
   * Проверяет Nginx конфигурацию
   */
  async checkNginxConfig(projectPath, result) {
    const nginxFiles = ['nginx.conf', 'nginx/nginx.conf', 'config/nginx.conf'];
    for (const nginxFile of nginxFiles) {
      const nginxPath = (0, path_1.join)(projectPath, nginxFile);
      if ((0, fs_1.existsSync)(nginxPath)) {
        result.checkedConfigs.push(nginxFile);
        try {
          const content = (0, fs_1.readFileSync)(nginxPath, 'utf-8');
          this.checkNginxSecurity(content, nginxFile, result);
        } catch (error) {
          console.warn(`Failed to read ${nginxFile}:`, error);
        }
      }
    }
  }
  /**
   * Проверяет CORS конфигурацию
   */
  checkCorsConfig(content, file, result) {
    // Проверяем на небезопасные CORS настройки
    if (content.includes('cors: true') || content.includes("origin: '*'")) {
      result.issues.push({
        file,
        type: 'cors',
        severity: 'high',
        description: 'Overly permissive CORS configuration detected',
        recommendation: 'Configure specific origins instead of allowing all (*)',
        currentValue: 'cors: true or origin: "*"',
      });
    }
    // Проверяем на отсутствие CORS настроек в production
    if (!content.includes('cors') && content.includes('production')) {
      result.issues.push({
        file,
        type: 'missing-security',
        severity: 'medium',
        description: 'CORS configuration not found for production',
        recommendation: 'Configure appropriate CORS settings for production environment',
      });
    }
  }
  /**
   * Проверяет режим разработки в production
   */
  checkDevModeInProduction(content, file, result) {
    const devPatterns = [/dev:\s*true/, /development.*true/, /debug.*true/, /sourcemap.*true/];
    devPatterns.forEach(pattern => {
      if (pattern.test(content) && content.includes('production')) {
        result.issues.push({
          file,
          type: 'debug-mode',
          severity: 'medium',
          description: 'Development settings enabled in production configuration',
          recommendation: 'Disable development features in production builds',
        });
      }
    });
  }
  /**
   * Проверяет expose настройки
   */
  checkExposeConfig(content, file, result) {
    if (content.includes('host: true') || content.includes('host: "0.0.0.0"')) {
      result.issues.push({
        file,
        type: 'insecure-config',
        severity: 'medium',
        description: 'Server exposed to all interfaces (0.0.0.0)',
        recommendation: 'Bind to specific interface or use localhost for development',
        currentValue: 'host: true or 0.0.0.0',
      });
    }
  }
  /**
   * Проверяет .env файлы на exposure
   */
  checkEnvExposure(content, file, result) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Проверяем переменные, которые начинаются с VITE_ (они будут exposed)
      if (line.startsWith('VITE_') && this.containsSensitiveData(line)) {
        result.issues.push({
          file,
          type: 'env-exposure',
          severity: 'high',
          description: `Sensitive data in client-exposed environment variable (line ${index + 1})`,
          recommendation:
            'Remove VITE_ prefix from sensitive variables or move to server-only config',
          currentValue: line.split('=')[0],
        });
      }
      // Проверяем на hardcoded secrets
      if (this.containsHardcodedSecret(line)) {
        result.issues.push({
          file,
          type: 'env-exposure',
          severity: 'critical',
          description: `Hardcoded secret detected in environment file (line ${index + 1})`,
          recommendation: 'Use placeholder values in .env.example and real secrets in .env.local',
          currentValue: line.split('=')[0],
        });
      }
    });
  }
  /**
   * Проверяет debug настройки
   */
  checkDebugSettings(content, file, result) {
    if (content.includes('DEBUG=true') || content.includes('LOG_LEVEL=debug')) {
      result.issues.push({
        file,
        type: 'debug-mode',
        severity: 'low',
        description: 'Debug mode enabled in environment configuration',
        recommendation: 'Disable debug mode in production environment',
      });
    }
  }
  /**
   * Проверяет package.json scripts
   */
  checkPackageScripts(packageJson, file, result) {
    if (packageJson.scripts) {
      for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
        if (typeof scriptCommand === 'string') {
          // Проверяем на потенциально небезопасные команды
          if (scriptCommand.includes('rm -rf') || scriptCommand.includes('del /s')) {
            result.issues.push({
              file,
              type: 'insecure-config',
              severity: 'medium',
              description: `Potentially dangerous command in script "${scriptName}"`,
              recommendation: 'Review script commands for safety',
              currentValue: scriptCommand,
            });
          }
        }
      }
    }
  }
  /**
   * Проверяет security dependencies
   */
  checkSecurityDependencies(packageJson, file, result) {
    const securityPackages = ['helmet', 'cors', 'csurf', 'express-rate-limit'];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const missingPackages = securityPackages.filter(pkg => !allDeps[pkg]);
    if (missingPackages.length > 0 && allDeps['express']) {
      result.issues.push({
        file,
        type: 'missing-security',
        severity: 'medium',
        description: `Missing security packages for Express: ${missingPackages.join(', ')}`,
        recommendation: 'Consider adding security middleware packages for Express applications',
      });
    }
  }
  /**
   * Проверяет Docker security
   */
  checkDockerSecurity(content, file, result) {
    // Проверяем на root user
    if (!content.includes('USER ') || content.includes('USER root')) {
      result.issues.push({
        file,
        type: 'insecure-config',
        severity: 'high',
        description: 'Container running as root user',
        recommendation: 'Create and use non-root user in Docker container',
      });
    }
    // Проверяем на expose всех портов
    if (content.includes('EXPOSE 0.0.0.0') || content.includes('ports:\n    - "0.0.0.0:')) {
      result.issues.push({
        file,
        type: 'insecure-config',
        severity: 'medium',
        description: 'Port exposed to all interfaces',
        recommendation: 'Bind ports to specific interfaces when possible',
      });
    }
  }
  /**
   * Проверяет Nginx security
   */
  checkNginxSecurity(content, file, result) {
    // Проверяем на отсутствие security headers
    const securityHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection'];
    securityHeaders.forEach(header => {
      if (!content.includes(header)) {
        result.issues.push({
          file,
          type: 'missing-security',
          severity: 'medium',
          description: `Missing security header: ${header}`,
          recommendation: `Add ${header} header to Nginx configuration`,
        });
      }
    });
  }
  /**
   * Проверяет, содержит ли строка чувствительные данные
   */
  containsSensitiveData(line) {
    const sensitiveKeywords = [
      'password',
      'secret',
      'key',
      'token',
      'auth',
      'api_key',
      'private',
      'credential',
    ];
    const lowerLine = line.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerLine.includes(keyword));
  }
  /**
   * Проверяет, содержит ли строка hardcoded secret
   */
  containsHardcodedSecret(line) {
    const [key, value] = line.split('=');
    if (!value) return false;
    // Проверяем на patterns типичных секретов
    const secretPatterns = [
      /^[a-zA-Z0-9]{20,}$/, // Long alphanumeric strings
      /^[a-zA-Z0-9\/+]{40,}$/, // Base64-like strings
      /^sk_[a-zA-Z0-9]{24,}$/, // Stripe-like keys
      /^pk_[a-zA-Z0-9]{24,}$/, // Public keys
    ];
    return secretPatterns.some(pattern => pattern.test(value.trim()));
  }
  /**
   * Подсчитывает статистику
   */
  calculateSummary(issues) {
    const summary = {
      corsIssues: 0,
      envExposure: 0,
      debugMode: 0,
      insecureConfigs: 0,
      missingSecurity: 0,
    };
    issues.forEach(issue => {
      switch (issue.type) {
        case 'cors':
          summary.corsIssues++;
          break;
        case 'env-exposure':
          summary.envExposure++;
          break;
        case 'debug-mode':
          summary.debugMode++;
          break;
        case 'insecure-config':
          summary.insecureConfigs++;
          break;
        case 'missing-security':
          summary.missingSecurity++;
          break;
      }
    });
    return summary;
  }
  /**
   * Генерирует детальные рекомендации для найденных проблем конфигурации
   */
  generateDetailedRecommendations(issues) {
    const recommendations = [];
    for (const issue of issues) {
      const context = {
        type: issue.type,
        severity: issue.severity,
        file: issue.file,
        details: {
          description: issue.description,
          configKey: this.extractConfigKey(issue.description),
          configValue: issue.currentValue,
          framework: this.detectFramework(issue.file),
          issueType: 'config-security',
          category: this.getCategoryFromType(issue.type),
        },
      };
      const recommendation =
        RecommendationEngine_1.RecommendationEngine.generateRecommendation(context);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    return recommendations;
  }
  /**
   * Генерирует быстрые рекомендации для критических проблем конфигурации
   */
  generateQuickRecommendations(issues) {
    const criticalIssues = issues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    );
    return this.generateDetailedRecommendations(criticalIssues);
  }
  /**
   * Генерирует рекомендации по файлам конфигурации
   */
  generateRecommendationsByFile(issues) {
    const recommendationsByFile = new Map();
    const groupedIssues = this.groupIssuesByFile(issues);
    groupedIssues.forEach((fileIssues, file) => {
      const recommendations = this.generateDetailedRecommendations(fileIssues);
      recommendationsByFile.set(file, recommendations);
    });
    return recommendationsByFile;
  }
  /**
   * Группирует проблемы по файлам
   */
  groupIssuesByFile(issues) {
    const grouped = new Map();
    for (const issue of issues) {
      const existing = grouped.get(issue.file) || [];
      existing.push(issue);
      grouped.set(issue.file, existing);
    }
    return grouped;
  }
  /**
   * Извлекает ключ конфигурации из описания
   */
  extractConfigKey(description) {
    // Попытка извлечь ключ конфигурации из описания
    const keyMatch = description.match(/['"`]([^'"`]+)['"`]/);
    return keyMatch ? keyMatch[1] : '';
  }
  /**
   * Определяет фреймворк по пути к файлу
   */
  detectFramework(filePath) {
    if (filePath.includes('vite.config')) return 'vite';
    if (filePath.includes('next.config')) return 'nextjs';
    if (filePath.includes('svelte.config')) return 'svelte';
    if (filePath.includes('docker')) return 'docker';
    if (filePath.includes('nginx')) return 'nginx';
    if (filePath.includes('package.json')) return 'npm';
    return 'general';
  }
  /**
   * Определяет категорию по типу проблемы
   */
  getCategoryFromType(type) {
    const categoryMap = {
      cors: 'cors-config',
      'env-exposure': 'environment',
      'debug-mode': 'debug-security',
      'insecure-config': 'insecure-settings',
      'missing-security': 'security-headers',
    };
    return categoryMap[type] || 'general';
  }
}
exports.ConfigSecurityChecker = ConfigSecurityChecker;
//# sourceMappingURL=ConfigSecurityChecker.js.map
