import { TestingFrameworkChecker } from '../../src/checkers/testing/TestingFrameworkChecker';
import { Project } from '../../src/types/Project';

// Mock Project implementation
class MockProject implements Project {
  private files: Map<string, string> = new Map();
  public readonly path: string = '/mock/project';
  public readonly name: string = 'mock-project';

  constructor(files: Record<string, string> = {}) {
    Object.entries(files).forEach(([path, content]) => {
      this.files.set(path, content);
    });
  }

  async exists(filePath: string): Promise<boolean> {
    return this.files.has(filePath);
  }

  async readFile(filePath: string): Promise<string> {
    return this.files.get(filePath) || '';
  }

  async getFileList(pattern?: string): Promise<string[]> {
    const files = Array.from(this.files.keys());
    if (!pattern) return files;
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/'));
    return files.filter(file => regex.test(file));
  }

  async getFileStats(filePath: string): Promise<any> {
    return { size: 100, modified: new Date() };
  }

  getRelativePath(filePath: string): string {
    return filePath.replace(this.path + '/', '');
  }

  resolvePath(relativePath: string): string {
    return `${this.path}/${relativePath}`;
  }
}

async function debugChecker() {
  const checker = new TestingFrameworkChecker();

  const mockProject = new MockProject({
    'package.json': JSON.stringify({
      devDependencies: {
        vitest: '^0.34.0'
      }
    })
  });

  const results = await checker.check(mockProject);

  console.log('Number of results:', results.length);
  results.forEach((result, index) => {
    console.log(`Result ${index}:`, {
      name: result.name,
      passed: result.passed,
      severity: result.severity,
      message: result.message
    });
  });
}

debugChecker().catch(console.error);
