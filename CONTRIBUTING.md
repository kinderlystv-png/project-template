# 🤝 Contributing to SHINOMONTAGKA Universal Template

Thank you for your interest in contributing to SHINOMONTAGKA Universal Template! This guide will help you get started with contributing to this enterprise-grade SvelteKit template.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## 📜 Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you're expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** and inclusive
- **Be constructive** in discussions
- **Focus on the issue**, not the person
- **Help others learn** and grow

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (LTS version recommended)
- **npm 10+** or **pnpm 8+**
- **Git** for version control
- **VS Code** (recommended) with recommended extensions

### Development Environment

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/project-template.git
   cd project-template
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Run tests** to ensure everything works:
   ```bash
   npm run test
   ```

## 🔧 Development Setup

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree"
  ]
}
```

### Environment Configuration

Create a `.env.local` file for local development:

```bash
# Development environment
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_DEBUG=true
```

### Quality Tools Setup

The project includes several quality tools that run automatically:

- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Vitest** - Testing framework
- **Husky** - Git hooks

## 🔄 Contributing Process

### 1. Choose What to Contribute

#### Good First Issues

Look for issues labeled with:

- `good first issue` - Perfect for new contributors
- `documentation` - Documentation improvements
- `enhancement` - New features or improvements
- `bug` - Bug fixes

#### Areas We Need Help With

- 📚 **Documentation** - Improving guides and examples
- 🧪 **Testing** - Adding test coverage
- 🎨 **UI/UX** - Component improvements
- ⚡ **Performance** - Optimization opportunities
- 🛡️ **Security** - Security enhancements
- 🌐 **Accessibility** - A11y improvements

### 2. Discuss Before Building

For significant changes:

1. **Open an issue** to discuss the approach
2. **Get feedback** from maintainers
3. **Plan the implementation** together
4. **Start development** once aligned

### 3. Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Run quality checks
npm run qa

# 4. Push changes
git push origin feature/your-feature-name

# 5. Open Pull Request
```

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good - Explicit types and interfaces
interface CacheOptions {
  ttl: number;
  maxSize: number;
  compression: boolean;
}

class CacheManager implements CacheInterface {
  private options: CacheOptions;

  constructor(options: CacheOptions) {
    this.options = options;
  }

  public set<T>(key: string, value: T): void {
    // Implementation
  }
}

// ❌ Bad - No types, unclear naming
class Cache {
  private opts;

  constructor(opts) {
    this.opts = opts;
  }

  set(k, v) {
    // Implementation
  }
}
```

### Code Organization

```typescript
// File structure for new modules
src/lib/newModule/
├── index.ts          // Public API exports
├── types.ts          // TypeScript interfaces
├── implementation.ts  // Main implementation
├── utils.ts          // Utility functions
└── __tests__/        // Tests
    ├── unit.test.ts
    └── integration.test.ts
```

### Naming Conventions

- **Files:** `kebab-case.ts`
- **Classes:** `PascalCase`
- **Functions/Variables:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Interfaces:** `PascalCase` (prefix with `I` if needed)
- **Types:** `PascalCase`

### Code Style

```typescript
// ✅ Good - Clear, documented, and typed
/**
 * Calculates cache hit ratio based on statistics
 * @param hits - Number of cache hits
 * @param misses - Number of cache misses
 * @returns Hit ratio as percentage (0-100)
 */
export function calculateHitRatio(hits: number, misses: number): number {
  const total = hits + misses;
  return total === 0 ? 0 : Math.round((hits / total) * 100);
}

// ❌ Bad - Unclear and untyped
export function calc(h, m) {
  return h + m === 0 ? 0 : (h / (h + m)) * 100;
}
```

## 🧪 Testing Guidelines

### Test Structure

Every contribution should include appropriate tests:

```typescript
// Example test structure
describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ ttl: 1000, maxSize: 100 });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set()', () => {
    it('should store value with key', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('should handle TTL expiration', async () => {
      cache.set('key', 'value', { ttl: 10 });
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(cache.get('key')).toBeNull();
    });
  });
});
```

### Testing Requirements

- **Unit tests** for all new functions/classes
- **Integration tests** for module interactions
- **Component tests** for UI components
- **E2E tests** for critical user flows (when applicable)
- **Performance tests** for optimization features

### Test Commands

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# UI testing interface
npm run test:ui

# Run specific test file
npm run test -- cache.test.ts
```

## 📚 Documentation

### Documentation Standards

All contributions should include appropriate documentation:

#### Code Documentation

````typescript
/**
 * Advanced cache manager with multi-level support
 *
 * @example
 * ```typescript
 * const cache = new CacheManager({
 *   ttl: 3600,
 *   maxSize: 1000,
 *   compression: true
 * });
 *
 * cache.set('user:123', userData);
 * const user = cache.get('user:123');
 * ```
 */
export class CacheManager {
  /**
   * Store value in cache with optional TTL
   * @param key - Unique identifier for the cached value
   * @param value - Data to store in cache
   * @param options - Additional caching options
   */
  public set<T>(key: string, value: T, options?: CacheSetOptions): void {
    // Implementation
  }
}
````

#### README Updates

When adding new features, update relevant documentation:

- **Main README.md** - If it affects the main API
- **docs/api/README.md** - For API changes
- **docs/architecture.md** - For architectural changes
- **docs/testing.md** - For testing utilities

#### Examples and Guides

Provide practical examples:

```typescript
// ✅ Good - Complete working example
// Example: Setting up cache with compression
import { CacheManager } from '$lib/cache';

const cache = new CacheManager({
  ttl: 3600, // 1 hour
  maxSize: 1000, // Maximum items
  compression: true, // Enable compression
  stats: true, // Track statistics
});

// Store user data
cache.set('user:123', {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com',
});

// Retrieve user data
const user = cache.get('user:123');
```

## 🐛 Issue Guidelines

### Reporting Bugs

Use the bug report template and include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment information** (OS, Node version, etc.)
5. **Code samples** or screenshots if applicable
6. **Error messages** or logs

### Feature Requests

Use the feature request template and include:

1. **Problem description** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - Other approaches you've thought about
4. **Additional context** - Any other relevant information

### Issue Labels

We use these labels to organize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `status: needs-review` - Waiting for review

## 🔀 Pull Request Process

### PR Guidelines

1. **Fork the repository** and create your branch from `main`
2. **Follow naming convention:** `feature/description` or `fix/description`
3. **Make targeted changes** - Keep PRs focused and small
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Run quality checks** before submitting

### PR Template

Use this template for your PR description:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Quality checks passing

## Screenshots (if applicable)

Add screenshots to help explain your changes

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated checks** must pass (tests, linting, type checking)
2. **Code review** by at least one maintainer
3. **Documentation review** if docs are affected
4. **Final approval** and merge by maintainer

### After Your PR is Merged

1. **Delete your feature branch**
2. **Pull latest changes** to your fork
3. **Consider contributing more!**

## 👥 Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code contributions and reviews

### Getting Help

If you need help:

1. **Check existing documentation** in the `/docs` folder
2. **Search existing issues** for similar problems
3. **Ask in GitHub Discussions** for general questions
4. **Create an issue** for specific bugs or features

### Recognition

Contributors are recognized in:

- **Contributors section** in README
- **Release notes** for significant contributions
- **GitHub contributors graph**

## 🎯 Development Tips

### Performance Considerations

- **Lazy load** heavy modules
- **Use caching** appropriately
- **Optimize bundle size** with tree shaking
- **Monitor memory usage** in long-running processes

### Security Best Practices

- **Validate all inputs** at boundaries
- **Sanitize user data** before processing
- **Use TypeScript** for type safety
- **Keep dependencies updated**

### Architecture Alignment

- **Follow SOLID principles**
- **Use dependency injection** where appropriate
- **Implement proper error handling**
- **Add appropriate logging**

## 📞 Contact

For questions about contributing:

- **GitHub Issues** - For specific technical questions
- **GitHub Discussions** - For general discussions
- **Maintainer Contact** - Through GitHub profile

---

## 🙏 Thank You!

Your contributions help make SHINOMONTAGKA Universal Template better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping other users, your efforts are appreciated!

**Happy coding!** 🚀
