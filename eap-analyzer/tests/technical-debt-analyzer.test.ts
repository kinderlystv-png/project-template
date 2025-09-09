import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TechnicalDebtAnalyzer } from '../src/modules/technical-debt';
import { promises as fs } from 'fs';
import path from 'path';

describe('TechnicalDebtAnalyzer', () => {
  let analyzer: TechnicalDebtAnalyzer;
  let testProjectPath: string;

  beforeAll(async () => {
    analyzer = new TechnicalDebtAnalyzer();
    testProjectPath = path.join(__dirname, 'test-debt-project');
    await createDebtTestProject(testProjectPath);
  });

  afterAll(async () => {
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  describe('Debt Assessment', () => {
    it('should assess total technical debt', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.totalDebt).toBeDefined();
      expect(result.totalDebt.totalDays).toBeGreaterThanOrEqual(0);
      expect(result.totalDebt.totalCost).toBeGreaterThanOrEqual(0);
      expect(result.totalDebt.monthlyInterest).toBeGreaterThanOrEqual(0);
      expect(result.totalDebt.breakEvenPoint).toBeGreaterThanOrEqual(0);
    });

    it('should categorize technical debt', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(Array.isArray(result.categories)).toBe(true);

      result.categories.forEach(category => {
        expect(['intentional', 'unintentional', 'strategic', 'tactical']).toContain(category.type);
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.amount).toBeGreaterThanOrEqual(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(category.priority);
        expect(Array.isArray(category.items)).toBe(true);
      });
    });

    it('should identify debt items with proper metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const allItems = result.categories.flatMap(cat => cat.items);

      allItems.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.file).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.effort).toBeGreaterThanOrEqual(0);
        expect(item.impact).toBeGreaterThanOrEqual(1);
        expect(item.impact).toBeLessThanOrEqual(10);
        expect(item.risk).toBeGreaterThanOrEqual(1);
        expect(item.risk).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Heatmap Generation', () => {
    it('should generate debt heatmap', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.heatmap).toBeDefined();
      expect(Array.isArray(result.heatmap.files)).toBe(true);
      expect(Array.isArray(result.heatmap.modules)).toBe(true);
      expect(result.heatmap.maxDebt).toBeGreaterThanOrEqual(0);
    });

    it('should provide heatmap entries with valid data', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.heatmap.files.forEach(entry => {
        expect(entry.path).toBeDefined();
        expect(entry.debtScore).toBeGreaterThanOrEqual(0);
        expect(entry.debtScore).toBeLessThanOrEqual(100);
        expect(entry.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
        expect(entry.issues).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Timeline Analysis', () => {
    it('should analyze debt timeline', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.timeline).toBeDefined();
      expect(Array.isArray(result.timeline.history)).toBe(true);
      expect(['increasing', 'stable', 'decreasing']).toContain(result.timeline.trend);
      expect(result.timeline.projection).toBeDefined();
    });

    it('should provide timeline projections', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { projection } = result.timeline;

      expect(Array.isArray(projection.months)).toBe(true);
      expect(Array.isArray(projection.pessimistic)).toBe(true);
      expect(Array.isArray(projection.realistic)).toBe(true);
      expect(Array.isArray(projection.optimistic)).toBe(true);

      // All arrays should have the same length
      expect(projection.pessimistic.length).toBe(projection.months.length);
      expect(projection.realistic.length).toBe(projection.months.length);
      expect(projection.optimistic.length).toBe(projection.months.length);
    });
  });

  describe('Payoff Strategy', () => {
    it('should create payoff strategy', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.payoffPlan).toBeDefined();
      expect(Array.isArray(result.payoffPlan.quickWins)).toBe(true);
      expect(Array.isArray(result.payoffPlan.highImpact)).toBe(true);
      expect(Array.isArray(result.payoffPlan.riskMitigation)).toBe(true);
      expect(Array.isArray(result.payoffPlan.phases)).toBe(true);
      expect(result.payoffPlan.estimatedROI).toBeGreaterThanOrEqual(0);
    });

    it('should organize refactoring phases', async () => {
      const result = await analyzer.analyze(testProjectPath);
      const { phases } = result.payoffPlan;

      phases.forEach(phase => {
        expect(phase.phase).toBeGreaterThan(0);
        expect(phase.name).toBeDefined();
        expect(phase.duration).toBeGreaterThan(0);
        expect(Array.isArray(phase.items)).toBe(true);
        expect(phase.effort).toBeGreaterThanOrEqual(0);
        expect(phase.expectedImprovement).toBeGreaterThanOrEqual(0);
        expect(phase.expectedImprovement).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Debt Categorization', () => {
    it('should properly categorize different types of debt', async () => {
      const result = await analyzer.analyze(testProjectPath);

      // Should find some debt categories
      expect(result.categories.length).toBeGreaterThan(0);

      // Check for specific debt types our analyzer creates
      const hasSimplifiedImplementation = result.categories.some(cat =>
        cat.items.some(item => item.type.includes('simplified-implementation'))
      );
      const hasPoorSeparation = result.categories.some(cat =>
        cat.items.some(item => item.type.includes('poor-separation'))
      );
      const hasDuplication = result.categories.some(cat =>
        cat.items.some(item => item.type.includes('duplication'))
      );

      // At least one type should be detected
      expect(hasSimplifiedImplementation || hasPoorSeparation || hasDuplication).toBe(true);
    });
  });
});

async function createDebtTestProject(projectPath: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });

  // Create files with various types of technical debt

  // File with high complexity (intentional debt)
  const complexFile = `
// TODO: Refactor this complex method - intentional debt for quick delivery
export class ComplexProcessor {
  processData(data: any, options: any) {
    // High cyclomatic complexity
    if (!data) return null;

    let result = {};

    if (options.type === 'user') {
      if (data.email) {
        if (data.email.includes('@')) {
          if (data.email.length > 5) {
            result.email = data.email.toLowerCase();
          } else {
            result.error = 'Email too short';
          }
        } else {
          result.error = 'Invalid email format';
        }
      }

      if (data.age) {
        if (data.age > 0) {
          if (data.age < 150) {
            result.age = data.age;
          } else {
            result.error = 'Age too high';
          }
        } else {
          result.error = 'Age must be positive';
        }
      }
    } else if (options.type === 'product') {
      if (data.price) {
        if (data.price > 0) {
          result.price = data.price;
        } else {
          result.error = 'Price must be positive';
        }
      }
    }

    return result;
  }
}
`;

  // File with documentation debt
  const undocumentedFile = `
export class UndocumentedService {
  // No documentation - unintentional debt
  calculate(x, y, z) {
    return (x * y) / z + Math.sqrt(x) - Math.pow(y, 2);
  }

  process(items) {
    return items.map(item => {
      if (item.type === 'A') {
        return item.value * 1.5;
      } else if (item.type === 'B') {
        return item.value * 2.0;
      } else {
        return item.value;
      }
    });
  }

  validate(input) {
    // Magic numbers and no documentation
    return input.length > 3 && input.length < 50 && input.match(/^[a-zA-Z0-9]+$/);
  }
}
`;

  // File with code duplication
  const duplicatedFile = `
export class DuplicatedLogic {
  validateUserEmail(email) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    return true;
  }

  validateAdminEmail(email) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (!email.endsWith('@company.com')) return false;
    return true;
  }

  validateGuestEmail(email) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (email.includes('+')) return false;
    return true;
  }
}
`;

  // File with performance debt
  const performanceDebtFile = `
export class PerformanceDebt {
  // Inefficient nested loops - performance debt
  findDuplicates(list1, list2) {
    const duplicates = [];

    for (let i = 0; i < list1.length; i++) {
      for (let j = 0; j < list2.length; j++) {
        if (list1[i].id === list2[j].id) {
          duplicates.push(list1[i]);
        }
      }
    }

    return duplicates;
  }

  // Memory leak potential
  processLargeDataset(data) {
    const results = [];

    data.forEach(item => {
      // Creating unnecessary intermediate objects
      const temp = {
        ...item,
        processed: true,
        timestamp: new Date(),
        metadata: { ...item, extra: 'data' }
      };

      results.push(temp);
    });

    return results;
  }
}
`;

  // File with security debt
  const securityDebtFile = `
export class SecurityDebt {
  // SQL injection vulnerability - security debt
  getUserById(id) {
    const query = \`SELECT * FROM users WHERE id = '\${id}'\`;
    // This should use parameterized queries
    return this.database.query(query);
  }

  // Weak password validation
  validatePassword(password) {
    return password.length > 6; // Too weak
  }

  // Hardcoded credentials
  connectToDatabase() {
    return {
      host: 'localhost',
      user: 'admin',
      password: 'password123', // Hardcoded - security debt
      database: 'production'
    };
  }
}
`;

  // Write all test files
  await fs.writeFile(path.join(projectPath, 'complex-file.ts'), complexFile);
  await fs.writeFile(path.join(projectPath, 'undocumented-file.ts'), undocumentedFile);
  await fs.writeFile(path.join(projectPath, 'duplicated-file.ts'), duplicatedFile);
  await fs.writeFile(path.join(projectPath, 'performance-debt.ts'), performanceDebtFile);
  await fs.writeFile(path.join(projectPath, 'security-debt.ts'), securityDebtFile);
}
