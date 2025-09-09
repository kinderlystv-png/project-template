#!/usr/bin/env node

/**
 * Production Readiness Validator
 * Comprehensive check before deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class ProductionValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      tests: { passed: false, score: 0, details: {} },
      coverage: { passed: false, score: 0, details: {} },
      quality: { passed: false, score: 0, details: {} },
      security: { passed: false, score: 0, details: {} },
      build: { passed: false, score: 0, details: {} },
      documentation: { passed: false, score: 0, details: {} },
      dependencies: { passed: false, score: 0, details: {} },
    };
    this.overallScore = 0;
  }

  log(message, emoji = '📋') {
    console.log(`${emoji} ${message}`);
  }

  async run(command, silent = false) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
      });
    } catch (error) {
      if (!silent) console.error(`Command failed: ${command}`);
      throw error;
    }
  }

  async validateTests() {
    this.log('Running comprehensive test suite', '🧪');

    try {
      const output = await this.run('npm test', true);
      const testResults = this.parseTestOutput(output);

      this.results.tests = {
        passed: testResults.failedTests === 0,
        score: Math.min(100, (testResults.passedTests / testResults.totalTests) * 100),
        details: {
          total: testResults.totalTests,
          passed: testResults.passedTests,
          failed: testResults.failedTests,
          duration: testResults.duration,
        },
      };

      if (this.results.tests.passed) {
        this.log(`✅ All ${testResults.passedTests} tests passed`, '🧪');
      } else {
        this.log(`❌ ${testResults.failedTests} tests failed`, '🧪');
      }
    } catch (error) {
      this.results.tests = {
        passed: false,
        score: 0,
        details: { error: error.message },
      };
      this.log('❌ Test suite failed to run', '🧪');
    }
  }

  async validateCoverage() {
    this.log('Checking test coverage', '🎯');

    try {
      await this.run('npm run test:coverage', true);

      const coveragePath = join(this.projectRoot, 'coverage', 'coverage-summary.json');
      if (existsSync(coveragePath)) {
        const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
        const total = coverage.total;

        const linesCoverage = total.lines.pct;
        const functionsCoverage = total.functions.pct;
        const branchesCoverage = total.branches.pct;

        // Weighted score: lines 40%, functions 30%, branches 30%
        const coverageScore =
          linesCoverage * 0.4 + functionsCoverage * 0.3 + branchesCoverage * 0.3;

        this.results.coverage = {
          passed: linesCoverage >= 70 && functionsCoverage >= 70 && branchesCoverage >= 60,
          score: coverageScore,
          details: {
            lines: linesCoverage,
            functions: functionsCoverage,
            branches: branchesCoverage,
            statements: total.statements.pct,
          },
        };

        if (this.results.coverage.passed) {
          this.log(
            `✅ Coverage: ${linesCoverage.toFixed(1)}% lines, ${functionsCoverage.toFixed(1)}% functions`,
            '🎯'
          );
        } else {
          this.log(`❌ Coverage below thresholds: ${linesCoverage.toFixed(1)}% lines`, '🎯');
        }
      }
    } catch (error) {
      this.results.coverage = {
        passed: false,
        score: 0,
        details: { error: error.message },
      };
      this.log('❌ Coverage analysis failed', '🎯');
    }
  }

  async validateQuality() {
    this.log('Analyzing code quality', '📊');

    try {
      const output = await this.run('npx eap-analyzer analyze . --format json', true);
      const analysis = JSON.parse(output);

      const qualityScore = analysis.overallScore || 0;
      const criticalIssues = (analysis.recommendations || []).filter(
        r => r.priority === 'critical'
      ).length;
      const highIssues = (analysis.recommendations || []).filter(r => r.priority === 'high').length;

      this.results.quality = {
        passed: qualityScore >= 80 && criticalIssues === 0,
        score: qualityScore,
        details: {
          overallScore: qualityScore,
          criticalIssues,
          highIssues,
          totalRecommendations: (analysis.recommendations || []).length,
        },
      };

      if (this.results.quality.passed) {
        this.log(`✅ Quality score: ${qualityScore}/100`, '📊');
      } else {
        this.log(`❌ Quality issues: ${criticalIssues} critical, ${highIssues} high`, '📊');
      }
    } catch (error) {
      this.results.quality = {
        passed: false,
        score: 0,
        details: { error: error.message },
      };
      this.log('❌ Quality analysis failed', '📊');
    }
  }

  async validateSecurity() {
    this.log('Running security audit', '🔒');

    try {
      const auditOutput = await this.run('npm audit --json', true);
      const audit = JSON.parse(auditOutput);

      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const moderateVulns = audit.metadata?.vulnerabilities?.moderate || 0;

      // Security score based on vulnerability severity
      let securityScore = 100;
      securityScore -= criticalVulns * 30;
      securityScore -= highVulns * 20;
      securityScore -= moderateVulns * 5;
      securityScore = Math.max(0, securityScore);

      this.results.security = {
        passed: criticalVulns === 0 && highVulns === 0,
        score: securityScore,
        details: {
          critical: criticalVulns,
          high: highVulns,
          moderate: moderateVulns,
          low: audit.metadata?.vulnerabilities?.low || 0,
        },
      };

      if (this.results.security.passed) {
        this.log(`✅ No critical/high security vulnerabilities`, '🔒');
      } else {
        this.log(`❌ Security vulnerabilities: ${criticalVulns} critical, ${highVulns} high`, '🔒');
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
          const highVulns = audit.metadata?.vulnerabilities?.high || 0;

          this.results.security = {
            passed: criticalVulns === 0 && highVulns === 0,
            score: Math.max(0, 100 - criticalVulns * 30 - highVulns * 20),
            details: {
              critical: criticalVulns,
              high: highVulns,
              moderate: audit.metadata?.vulnerabilities?.moderate || 0,
            },
          };
        } catch (parseError) {
          this.results.security = {
            passed: false,
            score: 0,
            details: { error: error.message },
          };
        }
      }
    }
  }

  async validateBuild() {
    this.log('Testing build process', '🏗️');

    try {
      await this.run('npm run build', true);

      // Check essential build outputs
      const requiredFiles = ['dist/index.js', 'dist/cli.js', 'dist/types.d.ts'];

      const missingFiles = requiredFiles.filter(file => !existsSync(join(this.projectRoot, file)));

      // Test package creation
      await this.run('npm pack --dry-run', true);

      this.results.build = {
        passed: missingFiles.length === 0,
        score: missingFiles.length === 0 ? 100 : 50,
        details: {
          missingFiles,
          buildSuccess: true,
        },
      };

      if (this.results.build.passed) {
        this.log('✅ Build process successful', '🏗️');
      } else {
        this.log(`❌ Missing build files: ${missingFiles.join(', ')}`, '🏗️');
      }
    } catch (error) {
      this.results.build = {
        passed: false,
        score: 0,
        details: { error: error.message },
      };
      this.log('❌ Build process failed', '🏗️');
    }
  }

  async validateDocumentation() {
    this.log('Checking documentation', '📚');

    const requiredDocs = ['README.md', 'CHANGELOG.md', 'docs/README.md'];

    const missingDocs = requiredDocs.filter(doc => !existsSync(join(this.projectRoot, doc)));

    // Check README content quality
    let readmeScore = 0;
    const readmePath = join(this.projectRoot, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf8');

      // Basic quality checks
      const hasTitle = /^#\s+.+/m.test(readme);
      const hasDescription = readme.length > 200;
      const hasInstallation = /install/i.test(readme);
      const hasUsage = /usage|example/i.test(readme);
      const hasAPI = /api|reference/i.test(readme);

      readmeScore =
        [hasTitle, hasDescription, hasInstallation, hasUsage, hasAPI].filter(Boolean).length * 20;
    }

    this.results.documentation = {
      passed: missingDocs.length === 0 && readmeScore >= 80,
      score: missingDocs.length === 0 ? readmeScore : 0,
      details: {
        missingDocs,
        readmeScore,
      },
    };

    if (this.results.documentation.passed) {
      this.log('✅ Documentation complete', '📚');
    } else {
      this.log(`❌ Documentation issues: ${missingDocs.length} missing files`, '📚');
    }
  }

  async validateDependencies() {
    this.log('Validating dependencies', '📦');

    try {
      const packagePath = join(this.projectRoot, 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

      // Check for essential fields
      const requiredFields = [
        'name',
        'version',
        'description',
        'main',
        'types',
        'author',
        'license',
      ];
      const missingFields = requiredFields.filter(field => !pkg[field]);

      // Check dependency health
      const depCount = Object.keys(pkg.dependencies || {}).length;
      const devDepCount = Object.keys(pkg.devDependencies || {}).length;

      // Run outdated check
      let outdatedScore = 100;
      try {
        const outdated = await this.run('npm outdated --json', true);
        const outdatedPackages = Object.keys(JSON.parse(outdated || '{}'));
        outdatedScore = Math.max(0, 100 - outdatedPackages.length * 5);
      } catch (error) {
        // npm outdated returns non-zero when packages are outdated
        if (error.stdout) {
          const outdatedPackages = Object.keys(JSON.parse(error.stdout || '{}'));
          outdatedScore = Math.max(0, 100 - outdatedPackages.length * 5);
        }
      }

      this.results.dependencies = {
        passed: missingFields.length === 0 && outdatedScore >= 80,
        score: Math.min(100, (100 - missingFields.length * 10) * (outdatedScore / 100)),
        details: {
          missingFields,
          dependencyCount: depCount,
          devDependencyCount: devDepCount,
          outdatedScore,
        },
      };

      if (this.results.dependencies.passed) {
        this.log('✅ Dependencies properly configured', '📦');
      } else {
        this.log(`❌ Dependency issues: ${missingFields.length} missing fields`, '📦');
      }
    } catch (error) {
      this.results.dependencies = {
        passed: false,
        score: 0,
        details: { error: error.message },
      };
      this.log('❌ Dependency validation failed', '📦');
    }
  }

  parseTestOutput(output) {
    // Parse vitest output
    const lines = output.split('\n');
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let duration = '0ms';

    for (const line of lines) {
      if (line.includes('Test Files')) {
        const match = line.match(/(\d+) passed/);
        if (match) passedTests += parseInt(match[1]);
        const failMatch = line.match(/(\d+) failed/);
        if (failMatch) failedTests += parseInt(failMatch[1]);
      }
      if (line.includes('Tests')) {
        const match = line.match(/(\d+) passed/);
        if (match) totalTests = parseInt(match[1]);
      }
      if (line.includes('Time:')) {
        const match = line.match(/Time:\s*(\d+\w+)/);
        if (match) duration = match[1];
      }
    }

    return { totalTests, passedTests, failedTests, duration };
  }

  calculateOverallScore() {
    const weights = {
      tests: 0.25,
      coverage: 0.2,
      quality: 0.2,
      security: 0.15,
      build: 0.1,
      documentation: 0.05,
      dependencies: 0.05,
    };

    this.overallScore = Object.entries(weights).reduce((total, [category, weight]) => {
      return total + this.results[category].score * weight;
    }, 0);
  }

  generateReport() {
    this.calculateOverallScore();

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PRODUCTION READINESS REPORT');
    console.log('='.repeat(60));

    console.log(`\n📊 Overall Score: ${this.overallScore.toFixed(1)}/100`);

    if (this.overallScore >= 90) {
      console.log('🟢 EXCELLENT - Ready for production deployment!');
    } else if (this.overallScore >= 80) {
      console.log('🟡 GOOD - Minor improvements recommended');
    } else if (this.overallScore >= 70) {
      console.log('🟠 FAIR - Several issues need attention');
    } else {
      console.log('🔴 POOR - Significant improvements required');
    }

    console.log('\n📋 Detailed Results:');

    Object.entries(this.results).forEach(([category, result]) => {
      const icon = result.passed ? '✅' : '❌';
      const score = result.score.toFixed(1);
      console.log(`   ${icon} ${category.padEnd(12)} ${score.padStart(5)}/100`);

      if (!result.passed && result.details.error) {
        console.log(`      Error: ${result.details.error}`);
      }
    });

    // Recommendations
    const failedCategories = Object.entries(this.results)
      .filter(([_, result]) => !result.passed)
      .map(([category]) => category);

    if (failedCategories.length > 0) {
      console.log('\n🔧 Recommendations:');
      failedCategories.forEach(category => {
        console.log(`   • Fix ${category} issues before deployment`);
      });
    }

    console.log('\n' + '='.repeat(60));

    return this.overallScore >= 80;
  }

  async validate() {
    console.log('🔍 Starting production readiness validation...\n');

    const validations = [
      () => this.validateTests(),
      () => this.validateCoverage(),
      () => this.validateQuality(),
      () => this.validateSecurity(),
      () => this.validateBuild(),
      () => this.validateDocumentation(),
      () => this.validateDependencies(),
    ];

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        console.error(`Validation failed: ${error.message}`);
      }
    }

    const isReady = this.generateReport();

    if (!isReady) {
      process.exit(1);
    }
  }
}

// Run validation
const validator = new ProductionValidator();
validator.validate().catch(console.error);
