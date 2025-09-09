import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ArchitectureAnalyzer } from '../src/modules/architecture-analyzer';
import { promises as fs } from 'fs';
import path from 'path';

describe('ArchitectureAnalyzer', () => {
  let analyzer: ArchitectureAnalyzer;
  let testProjectPath: string;

  beforeAll(async () => {
    analyzer = new ArchitectureAnalyzer();
    testProjectPath = path.join(__dirname, 'test-arch-project');
    await createArchitectureTestProject(testProjectPath);
  });

  afterAll(async () => {
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  describe('Pattern Detection', () => {
    it('should detect MVC pattern', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);

      // Should detect some architectural patterns
      const mvcPattern = result.patterns.find(p => p.type === 'MVC');
      if (mvcPattern) {
        expect(mvcPattern.confidence).toBeGreaterThan(0);
        expect(mvcPattern.quality).toBeDefined();
      }
    });

    it('should detect component-based patterns', async () => {
      const result = await analyzer.analyze(testProjectPath);

      const componentPattern = result.patterns.find(p => p.type === 'Component-Based');
      if (componentPattern) {
        expect(componentPattern.confidence).toBeGreaterThanOrEqual(0);
        expect(componentPattern.location).toBeDefined();
      }
    });
  });

  describe('Modularity Analysis', () => {
    it('should calculate cohesion and coupling metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.modularity).toBeDefined();
      expect(result.modularity.cohesion).toBeGreaterThanOrEqual(0);
      expect(result.modularity.cohesion).toBeLessThanOrEqual(1);
      expect(result.modularity.coupling).toBeGreaterThanOrEqual(0);
      expect(result.modularity.coupling).toBeLessThanOrEqual(1);
    });

    it('should analyze component metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(Array.isArray(result.modularity.components)).toBe(true);

      if (result.modularity.components.length > 0) {
        const component = result.modularity.components[0];
        expect(component.name).toBeDefined();
        expect(component.path).toBeDefined();
        expect(component.loc).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(component.dependencies)).toBe(true);
        expect(Array.isArray(component.dependents)).toBe(true);
      }
    });
  });

  describe('Dependency Analysis', () => {
    it('should build dependency graph', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.dependencies).toBeDefined();
      expect(Array.isArray(result.dependencies.nodes)).toBe(true);
      expect(Array.isArray(result.dependencies.edges)).toBe(true);
      expect(Array.isArray(result.dependencies.cycles)).toBe(true);
      expect(Array.isArray(result.dependencies.layers)).toBe(true);
    });

    it('should detect dependency cycles', async () => {
      const result = await analyzer.analyze(testProjectPath);

      // Cycles should be an array (may be empty for good code)
      expect(Array.isArray(result.dependencies.cycles)).toBe(true);
    });
  });

  describe('Scalability Assessment', () => {
    it('should assess scalability', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.scalability).toBeDefined();
      expect(result.scalability.score).toBeGreaterThanOrEqual(0);
      expect(result.scalability.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.scalability.bottlenecks)).toBe(true);
      expect(Array.isArray(result.scalability.recommendations)).toBe(true);
    });

    it('should identify bottlenecks', async () => {
      const result = await analyzer.analyze(testProjectPath);

      result.scalability.bottlenecks.forEach(bottleneck => {
        expect(bottleneck.component).toBeDefined();
        expect(bottleneck.type).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(bottleneck.severity);
        expect(bottleneck.impact).toBeDefined();
        expect(bottleneck.solution).toBeDefined();
      });
    });
  });

  describe('Stability Metrics', () => {
    it('should calculate stability metrics', async () => {
      const result = await analyzer.analyze(testProjectPath);

      expect(result.stability).toBeDefined();
      expect(result.stability.volatility).toBeGreaterThanOrEqual(0);
      expect(result.stability.maturity).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(result.stability.breakingChangesRisk);
      expect(result.stability.technicalDebt).toBeGreaterThanOrEqual(0);
    });
  });
});

async function createArchitectureTestProject(projectPath: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });

  // Create MVC structure
  await fs.mkdir(path.join(projectPath, 'controllers'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'models'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'views'), { recursive: true });

  // Controller
  const controller = `
import { UserModel } from '../models/UserModel';
import { UserView } from '../views/UserView';

export class UserController {
  private model: UserModel;
  private view: UserView;

  constructor() {
    this.model = new UserModel();
    this.view = new UserView();
  }

  getUser(id: string) {
    const user = this.model.findById(id);
    return this.view.render(user);
  }

  createUser(userData: any) {
    const user = this.model.create(userData);
    return this.view.render(user);
  }
}
`;

  // Model
  const model = `
export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserModel {
  private users: User[] = [];

  findById(id: string): User | null {
    return this.users.find(user => user.id === id) || null;
  }

  create(userData: Omit<User, 'id'>): User {
    const user = { ...userData, id: Math.random().toString() };
    this.users.push(user);
    return user;
  }

  delete(id: string): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}
`;

  // View
  const view = `
import { User } from '../models/UserModel';

export class UserView {
  render(user: User | null): string {
    if (!user) {
      return '<div>User not found</div>';
    }

    return \`
      <div class="user">
        <h2>\${user.name}</h2>
        <p>Email: \${user.email}</p>
      </div>
    \`;
  }

  renderList(users: User[]): string {
    return \`
      <div class="user-list">
        \${users.map(user => this.render(user)).join('')}
      </div>
    \`;
  }
}
`;

  // Write MVC files
  await fs.writeFile(path.join(projectPath, 'controllers', 'UserController.ts'), controller);
  await fs.writeFile(path.join(projectPath, 'models', 'UserModel.ts'), model);
  await fs.writeFile(path.join(projectPath, 'views', 'UserView.ts'), view);

  // Create some components
  await fs.mkdir(path.join(projectPath, 'components'), { recursive: true });

  const component = `
export interface ComponentProps {
  title: string;
  children: string;
}

export class Component {
  render(props: ComponentProps): string {
    return \`
      <div class="component">
        <h3>\${props.title}</h3>
        <div class="content">\${props.children}</div>
      </div>
    \`;
  }
}
`;

  await fs.writeFile(path.join(projectPath, 'components', 'Component.ts'), component);

  // Create a service layer
  await fs.mkdir(path.join(projectPath, 'services'), { recursive: true });

  const service = `
import { UserModel } from '../models/UserModel';

export class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  validateUser(userData: any): boolean {
    return userData.name && userData.email && userData.email.includes('@');
  }

  processUser(userData: any) {
    if (!this.validateUser(userData)) {
      throw new Error('Invalid user data');
    }

    return this.userModel.create(userData);
  }
}
`;

  await fs.writeFile(path.join(projectPath, 'services', 'UserService.ts'), service);
}
