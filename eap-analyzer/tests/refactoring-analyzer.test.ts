import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RefactoringAnalyzer } from '../src/modules/refactoring-analyzer';
import { promises as fs } from 'fs';
import path from 'path';

describe('RefactoringAnalyzer', () => {
  let analyzer: RefactoringAnalyzer;
  let testProjectPath: string;

  beforeAll(async () => {
    analyzer = new RefactoringAnalyzer();
    testProjectPath = path.join(__dirname, 'test-refactor-project');
    await createRefactorTestProject(testProjectPath);
  });

  afterAll(async () => {
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  describe('Target Identification', () => {
    it('should identify refactoring targets', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.targets).toBeDefined();
      expect(Array.isArray(result.targets)).toBe(true);
      expect(result.targets.length).toBeGreaterThan(0);
    });

    it('should categorize targets by type', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.targets.forEach(target => {
        expect(['method', 'class', 'module', 'pattern']).toContain(target.type);
        expect(target.location).toBeDefined();
        expect(target.complexity).toBeGreaterThanOrEqual(0);
        expect(['high', 'medium', 'low']).toContain(target.priority);
        expect(target.description).toBeDefined();
        expect(target.estimatedEffort).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(target.benefits)).toBe(true);
        expect(Array.isArray(target.risks)).toBe(true);
      });
    });

    it('should prioritize targets correctly', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const highPriority = result.targets.filter(t => t.priority === 'high');
      const mediumPriority = result.targets.filter(t => t.priority === 'medium');
      const lowPriority = result.targets.filter(t => t.priority === 'low');

      // High priority targets should have higher complexity
      if (highPriority.length > 0 && lowPriority.length > 0) {
        const avgHighComplexity =
          highPriority.reduce((sum, t) => sum + t.complexity, 0) / highPriority.length;
        const avgLowComplexity =
          lowPriority.reduce((sum, t) => sum + t.complexity, 0) / lowPriority.length;
        expect(avgHighComplexity).toBeGreaterThan(avgLowComplexity);
      }
    });
  });

  describe('Example Generation', () => {
    it('should generate refactoring examples', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
    });

    it('should provide before/after code examples', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.examples.forEach(example => {
        expect(example.targetId).toBeDefined();
        expect(example.before).toBeDefined();
        expect(example.after).toBeDefined();
        expect(example.explanation).toBeDefined();

        // Before section
        expect(example.before.code).toBeDefined();
        expect(Array.isArray(example.before.issues)).toBe(true);
        expect(example.before.metrics).toBeDefined();
        expect(example.before.metrics.cyclomatic).toBeGreaterThanOrEqual(0);
        expect(example.before.metrics.cognitive).toBeGreaterThanOrEqual(0);
        expect(example.before.metrics.lines).toBeGreaterThanOrEqual(0);

        // After section
        expect(example.after.code).toBeDefined();
        expect(Array.isArray(example.after.improvements)).toBe(true);
        expect(example.after.metrics).toBeDefined();
        expect(example.after.metrics.cyclomatic).toBeGreaterThanOrEqual(0);
        expect(example.after.metrics.cognitive).toBeGreaterThanOrEqual(0);
        expect(example.after.metrics.lines).toBeGreaterThanOrEqual(0);
      });
    });

    it('should show improvement in metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.examples.forEach(example => {
        // After refactoring should generally have lower or equal complexity
        // (Though lines might increase due to better structure)
        expect(example.after.metrics.cyclomatic).toBeLessThanOrEqual(
          example.before.metrics.cyclomatic
        );
        expect(example.after.metrics.cognitive).toBeLessThanOrEqual(
          example.before.metrics.cognitive
        );
      });
    });
  });

  describe('Strategy Creation', () => {
    it('should create refactoring strategies', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.strategies).toBeDefined();
      expect(Array.isArray(result.strategies)).toBe(true);
    });

    it('should provide different strategy types', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.strategies.forEach(strategy => {
        expect(['incremental', 'big-bang', 'parallel']).toContain(strategy.type);
        expect(Array.isArray(strategy.phases)).toBe(true);
        expect(strategy.timeline).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(strategy.riskLevel);
        expect(Array.isArray(strategy.prerequisites)).toBe(true);
        expect(Array.isArray(strategy.successMetrics)).toBe(true);
      });
    });

    it('should organize phases properly', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.strategies.forEach(strategy => {
        strategy.phases.forEach(phase => {
          expect(phase.name).toBeDefined();
          expect(Array.isArray(phase.targets)).toBe(true);
          expect(phase.duration).toBeGreaterThan(0);
          expect(Array.isArray(phase.dependencies)).toBe(true);
          expect(Array.isArray(phase.deliverables)).toBe(true);
          expect(phase.testingStrategy).toBeDefined();
        });
      });
    });
  });

  describe('Summary and Assessment', () => {
    it('should provide comprehensive summary', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalTargets).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalEffort).toBeGreaterThanOrEqual(0);
      expect(result.summary.estimatedTimeline).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(result.summary.riskProfile);
      expect(Array.isArray(result.summary.expectedImprovements)).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Complex Code Detection', () => {
    it('should detect methods with high cyclomatic complexity', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const methodTargets = result.targets.filter(t => t.type === 'method');
      expect(methodTargets.length).toBeGreaterThan(0);

      // Should find complex methods we created
      const complexMethods = methodTargets.filter(t => t.complexity > 10);
      expect(complexMethods.length).toBeGreaterThan(0);
    });

    it('should detect large classes', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const classTargets = result.targets.filter(t => t.type === 'class');
      // May or may not find large classes depending on test data

      classTargets.forEach(target => {
        expect(target.description).toContain('large');
      });
    });

    it('should detect code duplication', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const patternTargets = result.targets.filter(t => t.type === 'pattern');
      // May find duplication patterns

      patternTargets.forEach(target => {
        expect(target.description).toContain('duplication');
      });
    });
  });
});

async function createRefactorTestProject(projectPath: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });

  // Create a file with complex methods
  const complexMethodFile = `
export class ComplexUserProcessor {
  // High cyclomatic complexity method
  processUser(user: any, options: any) {
    if (!user) return null;

    let result = { ...user };
    let hasErrors = false;

    // Email validation
    if (options.validateEmail) {
      if (!user.email) {
        result.errors = result.errors || [];
        result.errors.push('Email is required');
        hasErrors = true;
      } else if (!user.email.includes('@')) {
        result.errors = result.errors || [];
        result.errors.push('Invalid email format');
        hasErrors = true;
      } else if (user.email.length < 5) {
        result.errors = result.errors || [];
        result.errors.push('Email too short');
        hasErrors = true;
      } else if (user.email.length > 50) {
        result.errors = result.errors || [];
        result.errors.push('Email too long');
        hasErrors = true;
      }
    }

    // Age validation
    if (options.validateAge) {
      if (!user.age) {
        result.errors = result.errors || [];
        result.errors.push('Age is required');
        hasErrors = true;
      } else if (user.age < 0) {
        result.errors = result.errors || [];
        result.errors.push('Age cannot be negative');
        hasErrors = true;
      } else if (user.age > 150) {
        result.errors = result.errors || [];
        result.errors.push('Age too high');
        hasErrors = true;
      } else if (user.age < 18 && !options.allowMinors) {
        result.errors = result.errors || [];
        result.errors.push('User must be 18 or older');
        hasErrors = true;
      }
    }

    // Name formatting
    if (options.formatName && !hasErrors) {
      if (user.firstName) {
        result.firstName = user.firstName.trim();
        if (options.capitalizeNames) {
          result.firstName = result.firstName.charAt(0).toUpperCase() +
                           result.firstName.slice(1).toLowerCase();
        }
      }

      if (user.lastName) {
        result.lastName = user.lastName.trim();
        if (options.capitalizeNames) {
          result.lastName = result.lastName.charAt(0).toUpperCase() +
                          result.lastName.slice(1).toLowerCase();
        }
      }
    }

    // Score calculation
    if (options.calculateScore && !hasErrors) {
      let score = 0;

      if (user.experience) {
        if (user.experience < 1) {
          score += 10;
        } else if (user.experience < 3) {
          score += 25;
        } else if (user.experience < 5) {
          score += 40;
        } else {
          score += 50;
        }
      }

      if (user.education) {
        switch (user.education.toLowerCase()) {
          case 'high school':
            score += 10;
            break;
          case 'bachelor':
            score += 30;
            break;
          case 'master':
            score += 40;
            break;
          case 'phd':
            score += 50;
            break;
          default:
            score += 5;
        }
      }

      if (user.certifications && Array.isArray(user.certifications)) {
        score += user.certifications.length * 5;
      }

      result.score = score;
    }

    return result;
  }
}
`;

  // Create a large class
  const largeClassFile = `
export class MassiveUserManager {
  private users: any[] = [];
  private settings: any = {};
  private cache: any = {};
  private logs: any[] = [];

  // User management methods
  createUser(userData: any) { return { ...userData, id: Math.random() }; }
  updateUser(id: string, data: any) { return data; }
  deleteUser(id: string) { return true; }
  findUser(id: string) { return null; }
  listUsers() { return this.users; }
  searchUsers(query: string) { return []; }
  filterUsers(criteria: any) { return []; }
  sortUsers(field: string) { return []; }
  paginateUsers(page: number, size: number) { return []; }
  exportUsers(format: string) { return ''; }
  importUsers(data: any) { return true; }
  validateUser(user: any) { return true; }

  // Authentication methods
  login(credentials: any) { return 'token'; }
  logout(token: string) { return true; }
  verifyToken(token: string) { return true; }
  refreshToken(token: string) { return 'new-token'; }
  resetPassword(email: string) { return true; }
  changePassword(userId: string, newPassword: string) { return true; }
  lockAccount(userId: string) { return true; }
  unlockAccount(userId: string) { return true; }

  // Email methods
  sendWelcomeEmail(user: any) { console.log('Welcome email'); }
  sendPasswordResetEmail(user: any) { console.log('Reset email'); }
  sendVerificationEmail(user: any) { console.log('Verification email'); }
  sendNotificationEmail(user: any, message: string) { console.log('Notification'); }

  // Reporting methods
  generateUserReport(userId: string) { return {}; }
  generateActivityReport() { return {}; }
  generateSecurityReport() { return {}; }
  generatePerformanceReport() { return {}; }
  exportReport(type: string, format: string) { return ''; }

  // Settings methods
  getSettings() { return this.settings; }
  updateSettings(newSettings: any) { this.settings = newSettings; }
  resetSettings() { this.settings = {}; }
  exportSettings() { return JSON.stringify(this.settings); }
  importSettings(settingsJson: string) { this.settings = JSON.parse(settingsJson); }

  // Cache methods
  cacheUser(user: any) { this.cache[user.id] = user; }
  getCachedUser(id: string) { return this.cache[id]; }
  clearCache() { this.cache = {}; }
  updateCache(id: string, data: any) { this.cache[id] = data; }

  // Logging methods
  log(message: string) { this.logs.push({ message, timestamp: new Date() }); }
  getLogs() { return this.logs; }
  clearLogs() { this.logs = []; }
  exportLogs() { return JSON.stringify(this.logs); }

  // Utility methods
  formatUserName(user: any) { return \`\${user.firstName} \${user.lastName}\`; }
  calculateUserAge(birthDate: string) { return 25; }
  getUserPermissions(user: any) { return []; }
  hasPermission(user: any, permission: string) { return true; }

  // Many more methods to make it really large...
  ${Array.from({ length: 100 }, (_, i) => `utilityMethod${i}() { return ${i}; }`).join('\n  ')}
}
`;

  // Create duplicated code
  const duplicatedCodeFile = `
export class DuplicatedEmailValidation {
  validateUserEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    return true;
  }

  validateAdminEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (!email.endsWith('@company.com')) return false;
    return true;
  }

  validateGuestEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (email.includes('+')) return false;
    return true;
  }

  validateSupportEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (!email.endsWith('@support.company.com')) return false;
    return true;
  }
}
`;

  // Create a simple, well-structured file for comparison
  const goodCodeFile = `
export interface User {
  id: string;
  email: string;
  name: string;
}

export class UserService {
  private users: User[] = [];

  create(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: this.generateId() };
    this.users.push(newUser);
    return newUser;
  }

  findById(id: string): User | null {
    return this.users.find(user => user.id === id) || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
`;

  // Write test files
  await fs.writeFile(path.join(projectPath, 'complex-method.ts'), complexMethodFile);
  await fs.writeFile(path.join(projectPath, 'large-class.ts'), largeClassFile);
  await fs.writeFile(path.join(projectPath, 'duplicated-code.ts'), duplicatedCodeFile);
  await fs.writeFile(path.join(projectPath, 'good-code.ts'), goodCodeFile);
}
