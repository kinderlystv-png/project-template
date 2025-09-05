#!/usr/bin/env node

/**
 * Quality Assurance Script
 * Автоматические проверки качества кода
 */

const { execSync } = require('child_process');
const fs = require('fs');

const QA_CHECKS = {
  typecheck: {
    name: 'TypeScript Type Checking',
    command: 'npm run type-check',
    critical: true,
  },
  lint: {
    name: 'ESLint Code Quality',
    command: 'npm run lint',
    critical: true,
  },
  format: {
    name: 'Prettier Code Formatting',
    command: 'npm run format:check',
    critical: false,
  },
  test: {
    name: 'Unit Tests',
    command: 'npm run test:run',
    critical: true,
  },
  coverage: {
    name: 'Test Coverage',
    command: 'npm run test:coverage',
    critical: false,
    threshold: 80,
  },
  security: {
    name: 'Security Audit',
    command: 'npm audit --audit-level moderate',
    critical: true,
  },
  dependencies: {
    name: 'Dependency Check',
    command: 'npm outdated',
    critical: false,
  },
};

class QualityAssurance {
  constructor() {
    this.results = {};
    this.totalChecks = Object.keys(QA_CHECKS).length;
    this.passedChecks = 0;
    this.failedChecks = 0;
    this.warnings = 0;
  }

  async runAllChecks() {
    console.log('🔍 Starting Quality Assurance Checks...\n');

    for (const [checkId, check] of Object.entries(QA_CHECKS)) {
      await this.runCheck(checkId, check);
    }

    this.generateReport();
    this.generateBadges();

    // Возвращаем код выхода
    return this.failedChecks === 0 ? 0 : 1;
  }

  async runCheck(checkId, check) {
    console.log(`\n🔄 Running: ${check.name}`);
    console.log(`   Command: ${check.command}`);

    const startTime = Date.now();

    try {
      const output = execSync(check.command, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const duration = Date.now() - startTime;

      let status = 'passed';
      let details = output.trim();

      // Специальная обработка для coverage
      if (checkId === 'coverage') {
        const coverage = this.parseCoverage(output);
        if (coverage < check.threshold) {
          status = check.critical ? 'failed' : 'warning';
          details = `Coverage ${coverage}% below threshold ${check.threshold}%`;
        }
      }

      this.results[checkId] = {
        name: check.name,
        status,
        duration,
        details,
        critical: check.critical,
      };

      if (status === 'passed') {
        this.passedChecks++;
        console.log(`   ✅ ${check.name} - PASSED (${duration}ms)`);
      } else if (status === 'warning') {
        this.warnings++;
        console.log(`   ⚠️  ${check.name} - WARNING (${duration}ms)`);
        console.log(`   ${details}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results[checkId] = {
        name: check.name,
        status: 'failed',
        duration,
        details: error.stdout || error.message,
        critical: check.critical,
      };

      if (check.critical) {
        this.failedChecks++;
        console.log(`   ❌ ${check.name} - FAILED (${duration}ms)`);
      } else {
        this.warnings++;
        console.log(`   ⚠️  ${check.name} - WARNING (${duration}ms)`);
      }

      if (error.stdout) {
        console.log(`   Error: ${error.stdout.slice(0, 200)}...`);
      }
    }
  }

  parseCoverage(output) {
    // Парсинг coverage из вывода vitest
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/All files\s+\|\s+([0-9.]+)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return 0;
  }

  generateReport() {
    console.log('\n📊 Quality Assurance Report');
    console.log('================================');

    console.log(`\n📈 Summary:`);
    console.log(`   Total checks: ${this.totalChecks}`);
    console.log(`   Passed: ${this.passedChecks}`);
    console.log(`   Failed: ${this.failedChecks}`);
    console.log(`   Warnings: ${this.warnings}`);

    const score = Math.round((this.passedChecks / this.totalChecks) * 100);
    console.log(`   Quality Score: ${score}%`);

    console.log(`\n📋 Detailed Results:`);

    for (const [, result] of Object.entries(this.results)) {
      const icon = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const critical = result.critical ? ' (Critical)' : '';

      console.log(
        `   ${icon} ${result.name}${critical} - ${result.status.toUpperCase()} (${result.duration}ms)`
      );

      if (result.status !== 'passed' && result.details) {
        console.log(`      ${result.details.split('\n')[0]}`);
      }
    }

    // Сохраняем отчет в файл
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalChecks,
        passed: this.passedChecks,
        failed: this.failedChecks,
        warnings: this.warnings,
        score,
      },
      results: this.results,
    };

    fs.writeFileSync('qa-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to qa-report.json`);

    // Рекомендации
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log(`\n💡 Recommendations:`);

    if (this.failedChecks > 0) {
      console.log(`   🔴 Fix ${this.failedChecks} critical issues before proceeding`);
    }

    if (this.warnings > 0) {
      console.log(`   🟡 Address ${this.warnings} warnings for better code quality`);
    }

    if (this.failedChecks === 0 && this.warnings === 0) {
      console.log(`   🎉 All checks passed! Your code quality is excellent.`);
    }

    // Специфичные рекомендации
    for (const [checkId, result] of Object.entries(this.results)) {
      if (result.status === 'failed' || result.status === 'warning') {
        switch (checkId) {
          case 'typecheck':
            console.log(`   📝 TypeScript: Run "npm run type-check" and fix type errors`);
            break;
          case 'lint':
            console.log(`   🔍 ESLint: Run "npm run lint:fix" to auto-fix issues`);
            break;
          case 'format':
            console.log(`   🎨 Prettier: Run "npm run format" to format code`);
            break;
          case 'test':
            console.log(`   🧪 Tests: Check test failures and fix failing tests`);
            break;
          case 'coverage':
            console.log(`   📊 Coverage: Add more tests to improve coverage`);
            break;
          case 'security':
            console.log(`   🛡️ Security: Run "npm audit fix" to fix vulnerabilities`);
            break;
          case 'dependencies':
            console.log(`   📦 Dependencies: Run "npm update" to update packages`);
            break;
        }
      }
    }
  }

  generateBadges() {
    const score = Math.round((this.passedChecks / this.totalChecks) * 100);
    const color =
      score >= 90 ? 'brightgreen' : score >= 70 ? 'yellow' : score >= 50 ? 'orange' : 'red';

    const badges = {
      quality: `https://img.shields.io/badge/quality-${score}%25-${color}`,
      tests:
        this.results.test?.status === 'passed'
          ? 'https://img.shields.io/badge/tests-passing-brightgreen'
          : 'https://img.shields.io/badge/tests-failing-red',
      typescript:
        this.results.typecheck?.status === 'passed'
          ? 'https://img.shields.io/badge/TypeScript-passing-blue'
          : 'https://img.shields.io/badge/TypeScript-failing-red',
    };

    fs.writeFileSync('qa-badges.json', JSON.stringify(badges, null, 2));
    console.log(`\n🏷️  Quality badges saved to qa-badges.json`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Quality Assurance Tool');
    console.log('Usage: node scripts/qa.js [options]');
    console.log('\nOptions:');
    console.log('  --help     Show this help message');
    console.log('  --ci       Run in CI mode (fail on any critical issue)');
    console.log('  --report   Generate detailed HTML report');
    return 0;
  }

  const qa = new QualityAssurance();
  const exitCode = await qa.runAllChecks();

  if (args.includes('--ci') && exitCode !== 0) {
    console.log('\n❌ CI Mode: Quality checks failed');
    process.exit(exitCode);
  }

  console.log('\n✅ Quality assurance completed');
  return exitCode;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { QualityAssurance };
