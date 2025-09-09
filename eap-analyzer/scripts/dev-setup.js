#!/usr/bin/env node

/**
 * EAP Development Environment Setup
 * Automates local development workflow and quality checks
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class DevEnvironment {
  constructor() {
    this.projectRoot = process.cwd();
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
    };
  }

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  async run(command, description) {
    this.log(`🔄 ${description}...`, 'blue');
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      this.log(`✅ ${description} completed`, 'green');
      return output;
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async setup() {
    this.log('🚀 Setting up EAP development environment', 'bold');

    // 1. Install dependencies
    await this.run('npm ci', 'Installing dependencies');

    // 2. Setup git hooks
    this.setupGitHooks();

    // 3. Create development config
    this.createDevConfig();

    // 4. Setup IDE configuration
    this.setupIDE();

    this.log('✨ Development environment setup complete!', 'green');
  }

  setupGitHooks() {
    const preCommitHook = `#!/bin/sh
# EAP Pre-commit hook

echo "🔍 Running pre-commit checks..."

# 1. Lint staged files
echo "📝 Linting staged files..."
npx lint-staged

# 2. Run affected tests
echo "🧪 Running tests for changed files..."
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.ts$' || true)

if [ -n "$CHANGED_FILES" ]; then
  # Run tests for changed modules
  for file in $CHANGED_FILES; do
    if [[ $file == src/* ]]; then
      test_file=$(echo "$file" | sed 's|^src/|tests/|' | sed 's|\\.ts$|.test.ts|')
      if [ -f "$test_file" ]; then
        echo "Testing: $test_file"
        npx vitest run "$test_file" --silent
      fi
    fi
  done
fi

# 3. Quick quality check
echo "📊 Running quality analysis..."
npx eap-analyzer analyze . --quick

echo "✅ Pre-commit checks passed!"
`;

    const commitMsgHook = `#!/bin/sh
# EAP Commit message hook

commit_msg_file=$1
commit_msg=$(cat $commit_msg_file)

# Check commit message format (conventional commits)
if ! echo "$commit_msg" | grep -qE '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\\(.+\\))?: .{1,50}'; then
  echo "❌ Commit message must follow conventional commits format:"
  echo "   feat: add new feature"
  echo "   fix: bug fix"
  echo "   docs: documentation changes"
  echo "   style: formatting changes"
  echo "   refactor: code refactoring"
  echo "   test: adding tests"
  echo "   chore: maintenance tasks"
  echo "   perf: performance improvements"
  echo "   ci: CI/CD changes"
  echo "   build: build system changes"
  exit 1
fi

echo "✅ Commit message format is valid"
`;

    // Write hooks
    const hooksDir = join(this.projectRoot, '.git', 'hooks');
    if (existsSync(hooksDir)) {
      writeFileSync(join(hooksDir, 'pre-commit'), preCommitHook, { mode: 0o755 });
      writeFileSync(join(hooksDir, 'commit-msg'), commitMsgHook, { mode: 0o755 });
      this.log('✅ Git hooks configured', 'green');
    }
  }

  createDevConfig() {
    const devConfig = {
      development: {
        watch: true,
        verbose: true,
        autoFix: true,
        quickMode: false,
        coverage: {
          threshold: 70,
          reportDir: './coverage',
        },
        quality: {
          threshold: 80,
          failOnRegression: true,
        },
      },
      testing: {
        timeout: 30000,
        retries: 2,
        parallel: true,
        coverage: true,
      },
      analysis: {
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/coverage/**',
          '**/*.test.ts',
          '**/*.spec.ts',
        ],
        includePatterns: ['src/**/*.ts', '*.ts', '*.js'],
      },
    };

    writeFileSync(join(this.projectRoot, 'dev.config.json'), JSON.stringify(devConfig, null, 2));
    this.log('✅ Development configuration created', 'green');
  }

  setupIDE() {
    // VS Code settings
    const vscodeSettings = {
      'typescript.preferences.includePackageJsonAutoImports': 'on',
      'editor.formatOnSave': true,
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': true,
        'source.organizeImports': true,
      },
      'files.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/coverage': true,
        '**/*.js.map': true,
      },
      'search.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/coverage': true,
      },
      'vitest.enable': true,
      'vitest.commandLine': 'npx vitest',
      'typescript.suggest.autoImports': true,
      'npm.enableScriptExplorer': true,
    };

    const vscodeDir = join(this.projectRoot, '.vscode');
    if (!existsSync(vscodeDir)) {
      execSync(`mkdir -p "${vscodeDir}"`);
    }

    writeFileSync(join(vscodeDir, 'settings.json'), JSON.stringify(vscodeSettings, null, 2));

    // VS Code tasks
    const vscodeTasks = {
      version: '2.0.0',
      tasks: [
        {
          label: 'dev:test',
          type: 'shell',
          command: 'npm',
          args: ['run', 'test:watch'],
          group: 'test',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new',
          },
          isBackground: true,
        },
        {
          label: 'dev:quality',
          type: 'shell',
          command: 'npx',
          args: ['eap-analyzer', 'analyze', '.', '--watch'],
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new',
          },
          isBackground: true,
        },
        {
          label: 'dev:setup',
          type: 'shell',
          command: 'node',
          args: ['scripts/dev-setup.js'],
          group: 'build',
        },
      ],
    };

    writeFileSync(join(vscodeDir, 'tasks.json'), JSON.stringify(vscodeTasks, null, 2));

    this.log('✅ IDE configuration setup', 'green');
  }

  async watch() {
    this.log('👀 Starting development watch mode', 'bold');

    // Start multiple processes
    const processes = [
      { command: 'npm run test:watch', name: 'Tests', color: 'blue' },
      { command: 'npx eap-analyzer analyze . --watch', name: 'Quality', color: 'yellow' },
    ];

    processes.forEach(proc => {
      this.log(`🔄 Starting ${proc.name} watcher...`, proc.color);
      execSync(proc.command, {
        stdio: 'inherit',
        detached: true,
      });
    });
  }

  async preCommit() {
    this.log('🔍 Running pre-commit checks', 'bold');

    try {
      // 1. Lint staged files
      await this.run('npx lint-staged', 'Linting staged files');

      // 2. Run quick tests
      await this.run('npm test -- --run --silent', 'Running tests');

      // 3. Quick quality check
      const analysis = await this.run(
        'npx eap-analyzer analyze . --quick --format json',
        'Quality analysis'
      );

      const result = JSON.parse(analysis);
      if (result.overallScore < 80) {
        throw new Error(`Quality score (${result.overallScore}) below threshold (80)`);
      }

      this.log('✅ All pre-commit checks passed!', 'green');
    } catch (error) {
      this.log('❌ Pre-commit checks failed', 'red');
      process.exit(1);
    }
  }

  async quality() {
    this.log('📊 Running comprehensive quality analysis', 'bold');

    // Run full analysis
    const output = await this.run(
      'npx eap-analyzer analyze . --format json',
      'Analyzing code quality'
    );

    const result = JSON.parse(output);

    // Display results
    this.log(`\n📈 Quality Report:`, 'bold');
    this.log(
      `   Overall Score: ${result.overallScore}/100`,
      result.overallScore >= 80 ? 'green' : 'yellow'
    );

    if (result.recommendations) {
      const critical = result.recommendations.filter(r => r.priority === 'critical');
      const high = result.recommendations.filter(r => r.priority === 'high');

      if (critical.length > 0) {
        this.log(`\n🚨 Critical Issues (${critical.length}):`, 'red');
        critical.forEach(issue => {
          this.log(`   • ${issue.message}`, 'red');
        });
      }

      if (high.length > 0) {
        this.log(`\n⚠️  High Priority Issues (${high.length}):`, 'yellow');
        high.forEach(issue => {
          this.log(`   • ${issue.message}`, 'yellow');
        });
      }
    }

    return result;
  }

  async coverage() {
    this.log('🎯 Running test coverage analysis', 'bold');

    await this.run('npm run test:coverage', 'Generating coverage report');

    // Read coverage summary
    const coveragePath = join(this.projectRoot, 'coverage', 'coverage-summary.json');
    if (existsSync(coveragePath)) {
      const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;

      this.log(`\n📊 Coverage Report:`, 'bold');
      this.log(`   Lines: ${total.lines.pct}%`, total.lines.pct >= 80 ? 'green' : 'yellow');
      this.log(
        `   Functions: ${total.functions.pct}%`,
        total.functions.pct >= 80 ? 'green' : 'yellow'
      );
      this.log(
        `   Branches: ${total.branches.pct}%`,
        total.branches.pct >= 70 ? 'green' : 'yellow'
      );
      this.log(
        `   Statements: ${total.statements.pct}%`,
        total.statements.pct >= 80 ? 'green' : 'yellow'
      );
    }
  }
}

// CLI Interface
const dev = new DevEnvironment();
const command = process.argv[2];

switch (command) {
  case 'setup':
    dev.setup().catch(console.error);
    break;
  case 'watch':
    dev.watch().catch(console.error);
    break;
  case 'pre-commit':
    dev.preCommit().catch(console.error);
    break;
  case 'quality':
    dev.quality().catch(console.error);
    break;
  case 'coverage':
    dev.coverage().catch(console.error);
    break;
  default:
    console.log(`
🛠️  EAP Development Tools

Usage: node scripts/dev-setup.js <command>

Commands:
  setup      - Setup development environment
  watch      - Start development watchers
  pre-commit - Run pre-commit checks
  quality    - Analyze code quality
  coverage   - Generate coverage report

Examples:
  node scripts/dev-setup.js setup
  node scripts/dev-setup.js watch
  node scripts/dev-setup.js quality
`);
    break;
}
