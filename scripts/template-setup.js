#!/usr/bin/env node

/**
 * SHINOMONTAGKA Universal Template v2.0.0
 * Post-clone setup script for template initialization
 * 
 * This script runs automatically after cloning the template
 * to help users set up their new project quickly.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateSetup {
  constructor() {
    this.projectRoot = join(__dirname, '..');
    this.packageJsonPath = join(this.projectRoot, 'package.json');
    this.envExamplePath = join(this.projectRoot, '.env.example');
    this.envLocalPath = join(this.projectRoot, '.env.local');
  }

  /**
   * Main setup workflow
   */
  async run() {
    console.log('\n🚀 SHINOMONTAGKA Universal Template v2.0.0');
    console.log('   Enterprise-grade SvelteKit template setup\n');

    try {
      await this.welcome();
      await this.gatherProjectInfo();
      await this.updatePackageJson();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.runQualityCheck();
      await this.showCompletionSummary();
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Manual setup required. Please see README.md');
      process.exit(1);
    }
  }

  /**
   * Welcome message and prerequisites check
   */
  async welcome() {
    console.log('📋 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (major < 18) {
      throw new Error(`Node.js 18+ required. Current: ${nodeVersion}`);
    }
    console.log(`✅ Node.js ${nodeVersion} (compatible)`);

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm ${npmVersion}`);
    } catch {
      throw new Error('npm not found. Please install Node.js with npm');
    }

    console.log('✅ Prerequisites satisfied\n');
  }

  /**
   * Gather project information from user
   */
  async gatherProjectInfo() {
    console.log('📝 Project Configuration');
    console.log('   (Press Enter to skip and keep defaults)\n');

    this.projectInfo = {
      name: await this.prompt('Project name', 'my-awesome-app'),
      description: await this.prompt('Project description', 'Enterprise web application built with SHINOMONTAGKA template'),
      author: await this.prompt('Author name', 'Your Name'),
      email: await this.prompt('Author email', 'you@example.com'),
      repository: await this.prompt('Repository URL', 'https://github.com/yourusername/my-awesome-app'),
      homepage: await this.prompt('Homepage URL', 'https://my-awesome-app.com')
    };

    console.log('\n📦 Project Configuration:');
    Object.entries(this.projectInfo).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log();
  }

  /**
   * Update package.json with project information
   */
  async updatePackageJson() {
    console.log('📝 Updating package.json...');

    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    
    // Update project metadata
    packageJson.name = this.projectInfo.name;
    packageJson.description = this.projectInfo.description;
    packageJson.author = {
      name: this.projectInfo.author,
      email: this.projectInfo.email
    };
    packageJson.repository = {
      type: 'git',
      url: this.projectInfo.repository
    };
    packageJson.homepage = this.projectInfo.homepage;
    packageJson.version = '0.1.0'; // Reset version for new project

    // Remove template-specific fields
    delete packageJson.keywords;
    delete packageJson.template;

    writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated');
  }

  /**
   * Setup environment configuration
   */
  async setupEnvironment() {
    console.log('🔧 Setting up environment...');

    if (existsSync(this.envExamplePath)) {
      if (!existsSync(this.envLocalPath)) {
        // Copy .env.example to .env.local
        const envContent = readFileSync(this.envExamplePath, 'utf8');
        writeFileSync(this.envLocalPath, envContent);
        console.log('✅ .env.local created from .env.example');
      } else {
        console.log('⏭️  .env.local already exists');
      }
    } else {
      // Create basic .env.local
      const basicEnv = `# SHINOMONTAGKA Universal Template Environment
# Development environment configuration

# Application
VITE_APP_NAME="${this.projectInfo.name}"
VITE_APP_DESCRIPTION="${this.projectInfo.description}"
VITE_APP_VERSION="0.1.0"

# Environment
NODE_ENV=development
VITE_ENVIRONMENT=development

# API Configuration
VITE_API_BASE_URL=http://localhost:5173/api
VITE_API_TIMEOUT=30000

# Cache Configuration
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=3600

# Logging
VITE_LOG_LEVEL=debug
VITE_LOG_ENABLED=true

# Monitoring
VITE_MONITORING_ENABLED=true
VITE_PERFORMANCE_TRACKING=true

# Security
VITE_SECURITY_VALIDATION=true
VITE_SECURITY_SANITIZATION=true
`;
      writeFileSync(this.envLocalPath, basicEnv);
      console.log('✅ Basic .env.local created');
    }
  }

  /**
   * Install dependencies
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    console.log('   This may take a few minutes...\n');

    try {
      execSync('npm install', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      console.log('\n✅ Dependencies installed successfully');
    } catch (error) {
      throw new Error('Failed to install dependencies. Please run "npm install" manually.');
    }
  }

  /**
   * Run quality check
   */
  async runQualityCheck() {
    console.log('\n🧪 Running quality checks...');

    try {
      // Run type check
      console.log('   TypeScript validation...');
      execSync('npm run type-check', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      console.log('   ✅ TypeScript validation passed');

      // Run linting
      console.log('   Code quality check...');
      execSync('npm run lint', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      console.log('   ✅ Linting passed');

      // Run tests
      console.log('   Running tests...');
      execSync('npm run test:run', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      console.log('   ✅ Tests passed');

      console.log('\n✅ All quality checks passed!');
    } catch (error) {
      console.log('\n⚠️  Some quality checks failed (expected in new project)');
      console.log('   You can fix these later with: npm run qa');
    }
  }

  /**
   * Show completion summary
   */
  async showCompletionSummary() {
    console.log('\n🎉 Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start development: npm run dev');
    console.log('   2. Open browser: http://localhost:5173');
    console.log('   3. Read documentation: ./docs/README.md');
    console.log('   4. Run quality check: npm run qa');
    console.log('\n🚀 Happy coding with SHINOMONTAGKA Universal Template!');
    console.log('\n📚 Resources:');
    console.log('   • Architecture Guide: ./docs/architecture.md');
    console.log('   • API Reference: ./docs/api/README.md');
    console.log('   • Testing Guide: ./docs/testing.md');
    console.log('   • Deployment Guide: ./docs/deployment.md');
    console.log('\n💡 Need help? Check the documentation or GitHub issues');
  }

  /**
   * Simple prompt implementation
   */
  async prompt(question, defaultValue = '') {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const promptText = defaultValue 
        ? `${question} (${defaultValue}): `
        : `${question}: `;

      rl.question(promptText, (answer) => {
        rl.close();
        resolve(answer.trim() || defaultValue);
      });
    });
  }
}

// Check if running as main script
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new TemplateSetup();
  setup.run().catch(console.error);
}

export { TemplateSetup };
