'use strict';
/**
 * Dependencies Security Checker
 * Анализ безопасности зависимостей проекта
 *
 * Phase 5.2.1: Интеграция с RecommendationEngine для практических рекомендаций
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DependenciesSecurityChecker = void 0;
const child_process_1 = require('child_process');
const util_1 = require('util');
const fs_1 = require('fs');
const path_1 = require('path');
const DependencyFixTemplates_js_1 = require('../../recommendations/DependencyFixTemplates.js');
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DependenciesSecurityChecker {
  /**
   * Выполняет проверку безопасности зависимостей
   */
  async checkDependencies(projectPath) {
    const result = {
      vulnerabilities: [],
      auditSummary: { total: 0, low: 0, moderate: 0, high: 0, critical: 0 },
      hasPackageLock: false,
      outdatedPackages: [],
    };
    try {
      // Проверяем наличие package.json
      const packageJsonPath = (0, path_1.join)(projectPath, 'package.json');
      if (!(0, fs_1.existsSync)(packageJsonPath)) {
        return result;
      }
      // Проверяем наличие lock файлов
      result.hasPackageLock = this.checkLockFiles(projectPath);
      // Запускаем npm audit
      const auditResult = await this.runNpmAudit(projectPath);
      if (auditResult) {
        result.vulnerabilities = auditResult.vulnerabilities;
        result.auditSummary = auditResult.summary;
      }
      // Проверяем устаревшие пакеты (базовый анализ)
      result.outdatedPackages = await this.checkOutdatedPackages(projectPath);
    } catch (error) {
      console.warn('DependenciesSecurityChecker: Error during analysis:', error);
    }
    return result;
  }
  /**
   * Проверяет наличие lock файлов
   */
  checkLockFiles(projectPath) {
    const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
    return lockFiles.some(file => (0, fs_1.existsSync)((0, path_1.join)(projectPath, file)));
  }
  /**
   * Запускает npm audit
   */
  async runNpmAudit(projectPath) {
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: projectPath,
        timeout: 30000,
      });
      const auditData = JSON.parse(stdout);
      const vulnerabilities = [];
      const summary = { total: 0, low: 0, moderate: 0, high: 0, critical: 0 };
      // Парсим результаты npm audit
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
          const vuln = vulnData;
          vulnerabilities.push({
            name: packageName,
            version: vuln.version || 'unknown',
            severity: vuln.severity || 'moderate',
            description: vuln.title || 'Security vulnerability detected',
            recommendation: vuln.recommendation || 'Update to latest version',
          });
          // Подсчитываем статистику
          summary[vuln.severity]++;
          summary.total++;
        }
      }
      return { vulnerabilities, summary };
    } catch (error) {
      // npm audit может возвращать ненулевой код при наличии уязвимостей
      if (error instanceof Error && 'stdout' in error) {
        try {
          const auditData = JSON.parse(error.stdout);
          // Обрабатываем так же, как в try блоке
          return this.parseAuditData(auditData);
        } catch (parseError) {
          console.warn('Failed to parse npm audit output:', parseError);
        }
      }
      console.warn('npm audit failed:', error);
      return null;
    }
  }
  /**
   * Парсит данные npm audit
   */
  parseAuditData(auditData) {
    const vulnerabilities = [];
    const summary = { total: 0, low: 0, moderate: 0, high: 0, critical: 0 };
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
        const vuln = vulnData;
        vulnerabilities.push({
          name: packageName,
          version: vuln.version || 'unknown',
          severity: vuln.severity || 'moderate',
          description: vuln.title || 'Security vulnerability detected',
          recommendation: vuln.recommendation || 'Update to latest version',
        });
        summary[vuln.severity]++;
        summary.total++;
      }
    }
    return { vulnerabilities, summary };
  }
  /**
   * Проверяет устаревшие пакеты (базовая проверка)
   */
  async checkOutdatedPackages(projectPath) {
    try {
      const packageJsonPath = (0, path_1.join)(projectPath, 'package.json');
      const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
      const outdated = [];
      // Простая проверка на очень старые версии
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      for (const [name, version] of Object.entries(dependencies)) {
        if (typeof version === 'string') {
          // Флагуем пакеты с версиями старше 2 лет (очень базовая эвристика)
          if (this.isLikelyOutdated(name, version)) {
            outdated.push(`${name}@${version}`);
          }
        }
      }
      return outdated;
    } catch (error) {
      console.warn('Failed to check outdated packages:', error);
      return [];
    }
  }
  /**
   * Простая эвристика для определения устаревших пакетов
   */
  isLikelyOutdated(name, version) {
    // Очень простая проверка - флагуем мажорные версии 0.x как потенциально устаревшие
    const normalizedVersion = version.replace(/[\^~]/, '');
    return (
      normalizedVersion.startsWith('0.') ||
      normalizedVersion.includes('-beta') ||
      normalizedVersion.includes('-alpha')
    );
  }
  /**
   * Генерирует детальные рекомендации для найденных уязвимостей
   * Phase 5.2.1: Интеграция с RecommendationEngine
   */
  generateDetailedRecommendations(securityResult) {
    const recommendations = [];
    // Проверяем наличие данных
    if (!securityResult) {
      console.warn('DependenciesSecurityChecker: securityResult is undefined');
      return recommendations;
    }
    const vulnerabilities = securityResult.vulnerabilities || [];
    const outdatedPackages = securityResult.outdatedPackages || [];
    // 1. Рекомендации для npm audit уязвимостей
    if (vulnerabilities.length > 0) {
      if (vulnerabilities.length > 5) {
        // Bulk fix для множественных уязвимостей
        const bulkRecommendation =
          DependencyFixTemplates_js_1.DependencyFixTemplates.generateBulkAuditFix(
            vulnerabilities.map(v => ({
              packageName: v.name,
              severity: v.severity,
              description: v.description,
            }))
          );
        recommendations.push(bulkRecommendation);
      } else {
        // Индивидуальные рекомендации для каждой уязвимости
        vulnerabilities.forEach(vuln => {
          const recommendation =
            DependencyFixTemplates_js_1.DependencyFixTemplates.generateNpmAuditFix({
              packageName: vuln.name,
              currentVersion: vuln.version,
              severity: vuln.severity,
              title: `${vuln.name} vulnerability`,
              description: vuln.description,
            });
          recommendations.push(recommendation);
        });
      }
    }
    // 2. Рекомендации для устаревших пакетов
    outdatedPackages.forEach(packageInfo => {
      const [name, version] = packageInfo.split('@');
      if (name && version) {
        const recommendation =
          DependencyFixTemplates_js_1.DependencyFixTemplates.generateOutdatedPackageFix({
            name,
            current: version,
            wanted: version, // В базовой версии используем текущую
            latest: 'latest',
            location: 'dependencies',
          });
        recommendations.push(recommendation);
      }
    });
    // 3. Рекомендация по отсутствующим lock файлам
    if (!securityResult.hasPackageLock) {
      const lockFileRecommendation = this.generateLockFileRecommendation();
      recommendations.push(lockFileRecommendation);
    }
    return recommendations;
  }
  /**
   * Генерирует рекомендацию по использованию lock файлов
   */
  generateLockFileRecommendation() {
    return {
      id: 'missing-lock-file',
      title: 'Отсутствует lock файл',
      description: 'Проект не имеет package-lock.json или yarn.lock файла',
      severity: 'medium',
      category: 'dependencies',
      fixTemplate: {
        steps: [
          'Удалите node_modules папку',
          'Запустите npm install для создания package-lock.json',
          'Коммитьте lock файл в Git',
          'Используйте npm ci в CI/CD',
        ],
        commands: [
          'rm -rf node_modules',
          'npm install',
          'git add package-lock.json',
          'git commit -m "Add package-lock.json for reproducible builds"',
        ],
        codeExample: `// В CI/CD используйте:
npm ci  # Вместо npm install

// Это обеспечивает:
// - Точно такие же версии как в разработке
// - Быструю установку
// - Защиту от supply chain атак`,
      },
      documentation: {
        links: [
          'https://docs.npmjs.com/cli/v8/configuring-npm/package-lock-json',
          'https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable',
        ],
        explanation:
          'Lock файлы обеспечивают воспроизводимые установки и защищают от supply chain атак',
      },
      estimatedTime: '15 минут',
      difficulty: 'easy',
    };
  }
  /**
   * Генерирует краткий список рекомендаций для быстрого просмотра
   */
  generateQuickRecommendations(securityResult) {
    const quickTips = [];
    // Проверяем, что securityResult и его поля определены
    if (!securityResult) {
      return ['⚠️ Не удалось получить данные для анализа зависимостей'];
    }
    const auditSummary = securityResult.auditSummary || {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
    };
    const outdatedPackages = securityResult.outdatedPackages || [];
    if (auditSummary.critical > 0) {
      quickTips.push(
        `🚨 КРИТИЧНО: Найдено ${auditSummary.critical} критических уязвимостей. Запустите: npm audit fix`
      );
    }
    if (auditSummary.high > 0) {
      quickTips.push(
        `⚠️ ВЫСОКИЙ: ${auditSummary.high} высокоприоритетных уязвимостей. Обновите пакеты в течение дня`
      );
    }
    if (!securityResult.hasPackageLock) {
      quickTips.push('📦 Создайте package-lock.json для воспроизводимых установок');
    }
    if (outdatedPackages.length > 0) {
      quickTips.push(
        `📅 ${outdatedPackages.length} устаревших пакетов найдено. Запустите: npm outdated`
      );
    }
    if (quickTips.length === 0) {
      quickTips.push('✅ Зависимости выглядят безопасно! Регулярно запускайте npm audit');
    }
    return quickTips;
  }
}
exports.DependenciesSecurityChecker = DependenciesSecurityChecker;
//# sourceMappingURL=DependenciesSecurityChecker.js.map
