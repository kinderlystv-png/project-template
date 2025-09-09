import { describe, it, expect, beforeAll } from 'vitest';
import { UltraEnhancedAnalyzer } from '../src/ultra-enhanced-analyzer';
import { promises as fs } from 'fs';
import path from 'path';

describe('UltraEnhancedAnalyzer Integration Tests', () => {
  let analyzer: UltraEnhancedAnalyzer;
  let testProjectPath: string;

  beforeAll(async () => {
    analyzer = new UltraEnhancedAnalyzer();

    // Create a temporary test project structure
    testProjectPath = path.join(__dirname, 'test-project');
    await createTestProject(testProjectPath);
  });

  describe('Comprehensive Analysis', () => {
    it('should perform complete ultra enhanced analysis', async () => {
      const result = await analyzer.analyze(testProjectPath);

      // Test overall structure
      expect(result).toHaveProperty('architecture');
      expect(result).toHaveProperty('technicalDebt');
      expect(result).toHaveProperty('refactoring');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('roadmap');

      // Test summary
      expect(result.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.overallScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.summary.riskLevel);
      expect(['maintain', 'incremental', 'major-refactor', 'rewrite']).toContain(
        result.summary.recommendedStrategy
      );

      // Test effort estimation
      expect(result.summary.estimatedEffort.totalHours).toBeGreaterThanOrEqual(0);
      expect(result.summary.estimatedEffort.timeline).toBeGreaterThanOrEqual(0);
      expect(result.summary.estimatedEffort.teamSize).toBeGreaterThanOrEqual(1);

      // Test insights structure
      expect(Array.isArray(result.insights.strengths)).toBe(true);
      expect(Array.isArray(result.insights.weaknesses)).toBe(true);
      expect(Array.isArray(result.insights.opportunities)).toBe(true);
      expect(Array.isArray(result.insights.threats)).toBe(true);

      // Test roadmap structure
      expect(Array.isArray(result.roadmap.immediate)).toBe(true);
      expect(Array.isArray(result.roadmap.shortTerm)).toBe(true);
      expect(Array.isArray(result.roadmap.longTerm)).toBe(true);
    });

    it('should generate comprehensive report', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const report = analyzer.generateReport(result);

      expect(report).toContain('Ultra Enhanced Analysis Report');
      expect(report).toContain('Executive Summary');
      expect(report).toContain('Key Metrics');
      expect(report).toContain('Priority Actions');
      expect(report).toContain('SWOT Analysis');
      expect(report).toContain('Roadmap');
      expect(report).toContain('Immediate');
      expect(report).toContain('Short-term');
      expect(report).toContain('Long-term');
    });
  });

  describe('Architecture Analysis Integration', () => {
    it('should detect architectural patterns', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { architecture } = result;

      expect(architecture.patterns).toBeDefined();
      expect(Array.isArray(architecture.patterns)).toBe(true);
      expect(architecture.modularity).toBeDefined();
      expect(architecture.scalability).toBeDefined();
      expect(architecture.dependencies).toBeDefined();
    });

    it('should calculate modularity metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { modularity } = result.architecture;

      expect(modularity.cohesion).toBeGreaterThanOrEqual(0);
      expect(modularity.cohesion).toBeLessThanOrEqual(1);
      expect(modularity.coupling).toBeGreaterThanOrEqual(0);
      expect(modularity.coupling).toBeLessThanOrEqual(1);
      expect(Array.isArray(modularity.components)).toBe(true);
    });
  });

  describe('Technical Debt Analysis Integration', () => {
    it('should assess technical debt comprehensively', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { technicalDebt } = result;

      expect(technicalDebt.totalDebt).toBeDefined();
      expect(technicalDebt.totalDebt.totalDays).toBeGreaterThanOrEqual(0);
      expect(technicalDebt.categories).toBeDefined();
      expect(Array.isArray(technicalDebt.categories)).toBe(true);
      expect(technicalDebt.heatmap).toBeDefined();
      expect(technicalDebt.payoffPlan).toBeDefined();
    });

    it('should generate debt heatmap', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { heatmap } = result.technicalDebt;

      expect(heatmap.files).toBeDefined();
      expect(Array.isArray(heatmap.files)).toBe(true);
      expect(heatmap.maxDebt).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Refactoring Analysis Integration', () => {
    it('should identify refactoring targets', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { refactoring } = result;

      expect(refactoring.targets).toBeDefined();
      expect(Array.isArray(refactoring.targets)).toBe(true);
      expect(refactoring.examples).toBeDefined();
      expect(Array.isArray(refactoring.examples)).toBe(true);
      expect(refactoring.strategies).toBeDefined();
      expect(Array.isArray(refactoring.strategies)).toBe(true);
    });

    it('should provide refactoring examples', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { examples } = result.refactoring;

      if (examples.length > 0) {
        const example = examples[0];
        expect(example.before).toBeDefined();
        expect(example.after).toBeDefined();
        expect(example.explanation).toBeDefined();
        expect(example.before.code).toBeDefined();
        expect(example.after.code).toBeDefined();
      }
    });
  });

  describe('Risk Assessment', () => {
    it('should properly assess different risk levels', async () => {
      const result = await analyzer.analyze(testProjectPath);

      // The risk level should be consistent with the metrics
      if (result.summary.riskLevel === 'critical') {
        expect(result.summary.overallScore).toBeLessThan(50);
      }
      if (result.summary.riskLevel === 'low') {
        expect(result.summary.overallScore).toBeGreaterThan(60);
      }
    });

    it('should provide appropriate strategy recommendations', async () => {
      const result = await analyzer.analyze(testProjectPath);

      // Strategy should align with overall score
      if (result.summary.overallScore >= 80) {
        expect(result.summary.recommendedStrategy).toBe('maintain');
      }
      if (result.summary.overallScore < 30) {
        expect(['major-refactor', 'rewrite']).toContain(result.summary.recommendedStrategy);
      }
    });
  });
});

async function createTestProject(projectPath: string): Promise<void> {
  // Create test project structure with various complexity levels
  await fs.mkdir(projectPath, { recursive: true });

  // Create a complex method (high cyclomatic complexity)
  const complexMethod = `
export class ComplexUserProcessor {
  processUser(user: any, options: any) {
    if (!user) return null;

    let result = { ...user };

    if (options.validateEmail) {
      if (!user.email || !user.email.includes('@')) {
        result.errors = result.errors || [];
        result.errors.push('Invalid email');
      }
    }

    if (options.validateAge) {
      if (!user.age || user.age < 0 || user.age > 150) {
        result.errors = result.errors || [];
        result.errors.push('Invalid age');
      }
    }

    if (options.formatName) {
      if (user.firstName) {
        result.firstName = user.firstName.trim().toLowerCase();
      }
      if (user.lastName) {
        result.lastName = user.lastName.trim().toLowerCase();
      }
    }

    if (options.calculateScore) {
      let score = 0;
      if (user.experience) score += user.experience * 10;
      if (user.education) score += user.education === 'university' ? 50 : 20;
      if (user.certifications) score += user.certifications.length * 5;
      result.score = score;
    }

    return result;
  }
}
`;

  // Create a large class
  const largeClass = `
export class LargeUserManager {
  // Database operations
  async saveUser(user: any) { return user; }
  async findUser(id: string) { return null; }
  async deleteUser(id: string) { return true; }
  async updateUser(id: string, data: any) { return data; }
  async listUsers(filters: any) { return []; }

  // Validation methods
  validateEmail(email: string) { return email.includes('@'); }
  validatePassword(password: string) { return password.length > 8; }
  validateAge(age: number) { return age > 0 && age < 150; }
  validatePhone(phone: string) { return phone.length > 10; }

  // Email operations
  sendWelcomeEmail(user: any) { console.log('Welcome email sent'); }
  sendPasswordResetEmail(user: any) { console.log('Reset email sent'); }
  sendVerificationEmail(user: any) { console.log('Verification email sent'); }

  // Authentication
  authenticateUser(credentials: any) { return true; }
  generateToken(user: any) { return 'token'; }
  validateToken(token: string) { return true; }
  refreshToken(token: string) { return 'new-token'; }

  // Reporting
  generateUserReport(userId: string) { return {}; }
  exportUserData(format: string) { return 'data'; }
  generateStatistics() { return {}; }

  // Utility methods
  formatUserName(user: any) { return user.name; }
  calculateUserAge(birthDate: Date) { return 25; }
  getUserPermissions(user: any) { return []; }
  logUserActivity(user: any, action: string) { console.log(action); }

  // More methods to make it large...
  ${Array.from({ length: 50 }, (_, i) => `method${i}() { return ${i}; }`).join('\n  ')}
}
`;

  // Create duplicated code
  const duplicatedCode = `
export class DuplicatedValidation {
  validateUserEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    return true;
  }

  validateAdminEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (!email.endsWith('@company.com')) return false;
    return true;
  }

  validateGuestEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.includes('+')) return false;
    return true;
  }
}
`;

  // Write test files
  await fs.writeFile(path.join(projectPath, 'complex-method.ts'), complexMethod);
  await fs.writeFile(path.join(projectPath, 'large-class.ts'), largeClass);
  await fs.writeFile(path.join(projectPath, 'duplicated-code.ts'), duplicatedCode);

  // Create a simple, well-structured file
  const goodCode = `
export interface User {
  id: string;
  email: string;
  name: string;
}

export class UserService {
  private users: User[] = [];

  createUser(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: this.generateId() };
    this.users.push(newUser);
    return newUser;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
`;

  await fs.writeFile(path.join(projectPath, 'good-code.ts'), goodCode);
}
