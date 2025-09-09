"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactoringAnalyzer = void 0;
const fs_1 = require("fs");
class RefactoringAnalyzer {
    maxCyclomaticComplexity = 10;
    maxCognitiveComplexity = 15;
    maxMethodLines = 50;
    maxClassLines = 300;
    async analyze(directoryPath) {
        const targets = await this.identifyTargets(directoryPath);
        const examples = await this.generateExamples(targets.slice(0, 5)); // Top 5 targets
        const strategies = this.createStrategies(targets);
        return {
            targets,
            examples,
            strategies,
            summary: {
                totalTargets: targets.length,
                totalEffort: targets.reduce((sum, target) => sum + target.estimatedEffort, 0),
                estimatedTimeline: Math.ceil(targets.reduce((sum, target) => sum + target.estimatedEffort, 0) / 40), // 40 hours per week
                riskProfile: this.assessOverallRisk(targets),
                expectedImprovements: this.calculateExpectedImprovements(targets),
            },
            recommendations: this.generateRecommendations(targets, strategies),
        };
    }
    async identifyTargets(directoryPath) {
        const targets = [];
        try {
            const files = await this.getAllFiles(directoryPath, ['.ts', '.js', '.vue', '.svelte']);
            for (const file of files) {
                const content = await fs_1.promises.readFile(file, 'utf-8');
                targets.push(...(await this.analyzeFile(file, content)));
            }
        }
        catch (error) {
            console.error('Error identifying refactoring targets:', error);
        }
        return targets.sort((a, b) => b.complexity - a.complexity);
    }
    async analyzeFile(filePath, content) {
        const targets = [];
        // Method complexity analysis
        const methods = this.extractMethods(content);
        for (const method of methods) {
            if (method.complexity > this.maxCyclomaticComplexity) {
                targets.push({
                    type: 'method',
                    location: `${filePath}:${method.line}`,
                    complexity: method.complexity,
                    priority: method.complexity > 20 ? 'high' : method.complexity > 15 ? 'medium' : 'low',
                    description: `Method '${method.name}' has high cyclomatic complexity (${method.complexity})`,
                    estimatedEffort: Math.ceil(method.complexity * 0.5), // 0.5 hours per complexity point
                    benefits: [
                        'Improved readability',
                        'Easier testing',
                        'Reduced maintenance cost',
                        'Better error handling',
                    ],
                    risks: [
                        'Potential introduction of bugs',
                        'Regression in functionality',
                        'Integration complexity',
                    ],
                });
            }
        }
        // Class size analysis
        const classes = this.extractClasses(content);
        for (const cls of classes) {
            if (cls.lines > this.maxClassLines) {
                targets.push({
                    type: 'class',
                    location: `${filePath}:${cls.line}`,
                    complexity: Math.ceil(cls.lines / 10),
                    priority: cls.lines > 500 ? 'high' : cls.lines > 400 ? 'medium' : 'low',
                    description: `Class '${cls.name}' is too large (${cls.lines} lines)`,
                    estimatedEffort: Math.ceil(cls.lines / 50), // 1 hour per 50 lines
                    benefits: [
                        'Single responsibility principle',
                        'Better modularity',
                        'Improved testability',
                        'Enhanced reusability',
                    ],
                    risks: [
                        'Complex dependency management',
                        'Interface design challenges',
                        'Potential performance impact',
                    ],
                });
            }
        }
        // Code duplication analysis
        const duplications = this.findCodeDuplication(content);
        for (const duplication of duplications) {
            targets.push({
                type: 'pattern',
                location: `${filePath}:${duplication.lines.join(',')}`,
                complexity: duplication.similarity,
                priority: duplication.similarity > 80 ? 'high' : duplication.similarity > 60 ? 'medium' : 'low',
                description: `Code duplication detected (${duplication.similarity}% similarity)`,
                estimatedEffort: Math.ceil(duplication.lines.length * 0.25), // 15 minutes per duplicated line
                benefits: [
                    'DRY principle compliance',
                    'Reduced maintenance burden',
                    'Consistency improvements',
                    'Easier bug fixes',
                ],
                risks: ['Over-abstraction', 'Performance considerations', 'API design complexity'],
            });
        }
        return targets;
    }
    async generateExamples(targets) {
        const examples = [];
        for (const target of targets) {
            if (target.type === 'method') {
                examples.push(await this.generateMethodExample(target));
            }
            else if (target.type === 'class') {
                examples.push(await this.generateClassExample(target));
            }
            else if (target.type === 'pattern') {
                examples.push(await this.generatePatternExample(target));
            }
        }
        return examples;
    }
    async generateMethodExample(target) {
        const beforeCode = `// Original complex method
function processUserData(user, options) {
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
}`;
        const afterCode = `// Refactored using smaller, focused functions
class UserProcessor {
  processUserData(user, options) {
    if (!user) return null;

    let result = { ...user };

    if (options.validateEmail) {
      this.validateEmail(result);
    }

    if (options.validateAge) {
      this.validateAge(result);
    }

    if (options.formatName) {
      this.formatName(result);
    }

    if (options.calculateScore) {
      result.score = this.calculateScore(user);
    }

    return result;
  }

  private validateEmail(result) {
    if (!result.email || !result.email.includes('@')) {
      this.addError(result, 'Invalid email');
    }
  }

  private validateAge(result) {
    if (!result.age || result.age < 0 || result.age > 150) {
      this.addError(result, 'Invalid age');
    }
  }

  private formatName(result) {
    if (result.firstName) {
      result.firstName = result.firstName.trim().toLowerCase();
    }
    if (result.lastName) {
      result.lastName = result.lastName.trim().toLowerCase();
    }
  }

  private calculateScore(user) {
    let score = 0;
    score += (user.experience || 0) * 10;
    score += user.education === 'university' ? 50 : 20;
    score += (user.certifications?.length || 0) * 5;
    return score;
  }

  private addError(result, message) {
    result.errors = result.errors || [];
    result.errors.push(message);
  }
}`;
        return {
            targetId: target.location,
            before: {
                code: beforeCode,
                issues: [
                    'Single function doing too many things',
                    'High cyclomatic complexity',
                    'Difficult to test individual validations',
                    'Code duplication in error handling',
                ],
                metrics: {
                    cyclomatic: 12,
                    cognitive: 18,
                    lines: 45,
                },
            },
            after: {
                code: afterCode,
                improvements: [
                    'Single responsibility principle',
                    'Easier unit testing',
                    'Better code organization',
                    'Reusable validation methods',
                ],
                metrics: {
                    cyclomatic: 6,
                    cognitive: 8,
                    lines: 52,
                },
            },
            explanation: 'The complex method was broken down into smaller, focused methods within a class. Each validation and processing step is now isolated, making the code more testable and maintainable. While the total line count increased slightly, the cognitive complexity decreased significantly.',
        };
    }
    async generateClassExample(target) {
        const beforeCode = `// Monolithic class doing too many things
class UserManager {
  // Database operations
  async saveUser(user) { /* ... */ }
  async findUser(id) { /* ... */ }
  async deleteUser(id) { /* ... */ }

  // Validation
  validateEmail(email) { /* ... */ }
  validatePassword(password) { /* ... */ }

  // Email operations
  sendWelcomeEmail(user) { /* ... */ }
  sendPasswordResetEmail(user) { /* ... */ }

  // Authentication
  authenticateUser(credentials) { /* ... */ }
  generateToken(user) { /* ... */ }

  // Reporting
  generateUserReport(userId) { /* ... */ }
  exportUserData(format) { /* ... */ }

  // 200+ more lines...
}`;
        const afterCode = `// Separated concerns into focused classes
class UserRepository {
  async save(user) { /* ... */ }
  async findById(id) { /* ... */ }
  async delete(id) { /* ... */ }
}

class UserValidator {
  validateEmail(email) { /* ... */ }
  validatePassword(password) { /* ... */ }
}

class EmailService {
  sendWelcomeEmail(user) { /* ... */ }
  sendPasswordResetEmail(user) { /* ... */ }
}

class AuthenticationService {
  authenticateUser(credentials) { /* ... */ }
  generateToken(user) { /* ... */ }
}

class UserReportService {
  generateReport(userId) { /* ... */ }
  exportData(format) { /* ... */ }
}

class UserManager {
  constructor(
    private repository: UserRepository,
    private validator: UserValidator,
    private emailService: EmailService,
    private authService: AuthenticationService,
    private reportService: UserReportService
  ) {}

  async createUser(userData) {
    this.validator.validateEmail(userData.email);
    this.validator.validatePassword(userData.password);

    const user = await this.repository.save(userData);
    await this.emailService.sendWelcomeEmail(user);

    return user;
  }
}`;
        return {
            targetId: target.location,
            before: {
                code: beforeCode,
                issues: [
                    'Single class with too many responsibilities',
                    'Difficult to test individual components',
                    'High coupling between unrelated functionality',
                    'Violation of Single Responsibility Principle',
                ],
                metrics: {
                    cyclomatic: 25,
                    cognitive: 45,
                    lines: 350,
                },
            },
            after: {
                code: afterCode,
                improvements: [
                    'Each class has a single responsibility',
                    'Better testability through dependency injection',
                    'Improved modularity and reusability',
                    'Clearer code organization',
                ],
                metrics: {
                    cyclomatic: 8,
                    cognitive: 12,
                    lines: 80,
                },
            },
            explanation: 'The monolithic UserManager class was decomposed into multiple focused classes, each handling a specific aspect of user management. This follows the Single Responsibility Principle and makes the system more modular and testable.',
        };
    }
    async generatePatternExample(target) {
        const beforeCode = `// Duplicated validation logic
function validateUserEmail(email) {
  if (!email) return false;
  if (!email.includes('@')) return false;
  if (email.length < 5) return false;
  return true;
}

function validateAdminEmail(email) {
  if (!email) return false;
  if (!email.includes('@')) return false;
  if (email.length < 5) return false;
  if (!email.endsWith('@company.com')) return false;
  return true;
}

function validateGuestEmail(email) {
  if (!email) return false;
  if (!email.includes('@')) return false;
  if (email.length < 5) return false;
  if (email.includes('+')) return false;
  return true;
}`;
        const afterCode = `// DRY principle with base validation and extensions
class EmailValidator {
  private static validateBasic(email: string): boolean {
    return !!(email && email.includes('@') && email.length >= 5);
  }

  static validateUser(email: string): boolean {
    return this.validateBasic(email);
  }

  static validateAdmin(email: string): boolean {
    return this.validateBasic(email) && email.endsWith('@company.com');
  }

  static validateGuest(email: string): boolean {
    return this.validateBasic(email) && !email.includes('+');
  }
}

// Or using strategy pattern for more complex cases
interface EmailValidationStrategy {
  validate(email: string): boolean;
}

class BasicEmailValidator implements EmailValidationStrategy {
  validate(email: string): boolean {
    return !!(email && email.includes('@') && email.length >= 5);
  }
}

class AdminEmailValidator implements EmailValidationStrategy {
  constructor(private basicValidator: BasicEmailValidator) {}

  validate(email: string): boolean {
    return this.basicValidator.validate(email) && email.endsWith('@company.com');
  }
}`;
        return {
            targetId: target.location,
            before: {
                code: beforeCode,
                issues: [
                    'Code duplication across validation functions',
                    'Maintenance nightmare when basic rules change',
                    'No reusability of common validation logic',
                    'Violation of DRY principle',
                ],
                metrics: {
                    cyclomatic: 15,
                    cognitive: 12,
                    lines: 24,
                },
            },
            after: {
                code: afterCode,
                improvements: [
                    'Eliminated code duplication',
                    'Centralized basic validation logic',
                    'Easy to extend with new validation types',
                    'Follows DRY and Open/Closed principles',
                ],
                metrics: {
                    cyclomatic: 8,
                    cognitive: 6,
                    lines: 32,
                },
            },
            explanation: 'The duplicated validation logic was refactored to eliminate redundancy. The basic validation is now centralized, and specific validation types extend or compose this basic functionality. This makes the code more maintainable and extensible.',
        };
    }
    createStrategies(targets) {
        const strategies = [];
        // Incremental strategy for low-risk refactoring
        const lowRiskTargets = targets.filter(t => t.priority === 'low');
        if (lowRiskTargets.length > 0) {
            strategies.push(this.createIncrementalStrategy(lowRiskTargets));
        }
        // Focused strategy for high-priority items
        const highPriorityTargets = targets.filter(t => t.priority === 'high');
        if (highPriorityTargets.length > 0) {
            strategies.push(this.createFocusedStrategy(highPriorityTargets));
        }
        // Comprehensive strategy for major refactoring
        if (targets.length > 20) {
            strategies.push(this.createComprehensiveStrategy(targets));
        }
        return strategies;
    }
    createIncrementalStrategy(targets) {
        const phases = [
            {
                name: 'Quick Wins',
                targets: targets.slice(0, 5).map(t => t.location),
                duration: 2,
                dependencies: [],
                deliverables: ['Improved code quality metrics', 'Reduced technical debt'],
                testingStrategy: 'Unit tests for refactored components',
            },
            {
                name: 'Progressive Improvements',
                targets: targets.slice(5).map(t => t.location),
                duration: 4,
                dependencies: ['Quick Wins'],
                deliverables: ['Enhanced maintainability', 'Better code organization'],
                testingStrategy: 'Integration tests and regression testing',
            },
        ];
        return {
            type: 'incremental',
            phases,
            timeline: 6,
            riskLevel: 'low',
            prerequisites: ['Comprehensive test coverage', 'Team alignment on coding standards'],
            successMetrics: [
                'Reduced cyclomatic complexity',
                'Improved code coverage',
                'Faster development velocity',
            ],
        };
    }
    createFocusedStrategy(targets) {
        const phases = [
            {
                name: 'Critical Issues Resolution',
                targets: targets.filter(t => t.complexity > 20).map(t => t.location),
                duration: 3,
                dependencies: [],
                deliverables: ['Resolved critical complexity issues', 'Improved system stability'],
                testingStrategy: 'Comprehensive testing with performance validation',
            },
            {
                name: 'Architecture Improvements',
                targets: targets.filter(t => t.complexity <= 20).map(t => t.location),
                duration: 4,
                dependencies: ['Critical Issues Resolution'],
                deliverables: ['Better architecture', 'Enhanced modularity'],
                testingStrategy: 'System integration testing',
            },
        ];
        return {
            type: 'big-bang',
            phases,
            timeline: 7,
            riskLevel: 'medium',
            prerequisites: ['Feature freeze', 'Dedicated refactoring team', 'Rollback plan'],
            successMetrics: [
                'Zero critical complexity violations',
                'Improved performance',
                'Reduced bug reports',
            ],
        };
    }
    createComprehensiveStrategy(targets) {
        const phases = [
            {
                name: 'Foundation',
                targets: targets.filter(t => t.type === 'pattern').map(t => t.location),
                duration: 3,
                dependencies: [],
                deliverables: ['Eliminated code duplication', 'Established patterns'],
                testingStrategy: 'Pattern compliance testing',
            },
            {
                name: 'Component Refactoring',
                targets: targets.filter(t => t.type === 'method').map(t => t.location),
                duration: 6,
                dependencies: ['Foundation'],
                deliverables: ['Simplified methods', 'Improved readability'],
                testingStrategy: 'Unit testing for all refactored methods',
            },
            {
                name: 'Architecture Evolution',
                targets: targets.filter(t => t.type === 'class').map(t => t.location),
                duration: 8,
                dependencies: ['Component Refactoring'],
                deliverables: ['Modular architecture', 'Clear separation of concerns'],
                testingStrategy: 'Full system testing and performance validation',
            },
        ];
        return {
            type: 'parallel',
            phases,
            timeline: 12,
            riskLevel: 'high',
            prerequisites: [
                'Management buy-in',
                'Extended development timeline',
                'Parallel development branches',
            ],
            successMetrics: [
                'Architectural compliance',
                'Maintainability index > 80',
                'Development velocity increase > 30%',
            ],
        };
    }
    async getAllFiles(directory, extensions) {
        const files = [];
        try {
            const entries = await fs_1.promises.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = `${directory}/${entry.name}`;
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    files.push(...(await this.getAllFiles(fullPath, extensions)));
                }
                else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            console.error(`Error reading directory ${directory}:`, error);
        }
        return files;
    }
    extractMethods(content) {
        const methods = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            // Simple pattern matching for methods/functions
            const methodMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*:\s*function|(\w+)\s*\([^)]*\)\s*\{|async\s+(\w+))/);
            if (methodMatch) {
                const name = methodMatch[1] || methodMatch[2] || methodMatch[3] || methodMatch[4];
                if (name) {
                    const complexity = this.calculateMethodComplexity(content, index);
                    methods.push({ name, complexity, line: index + 1 });
                }
            }
        });
        return methods;
    }
    extractClasses(content) {
        const classes = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch) {
                const name = classMatch[1];
                const classLines = this.countClassLines(content, index);
                classes.push({ name, lines: classLines, line: index + 1 });
            }
        });
        return classes;
    }
    calculateMethodComplexity(content, startLine) {
        let complexity = 1; // Base complexity
        const lines = content.split('\n');
        let braceCount = 0;
        let inMethod = false;
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            if (!inMethod && line.includes('{')) {
                inMethod = true;
                braceCount++;
            }
            if (inMethod) {
                // Count decision points
                if (line.match(/\b(if|else if|while|for|case|catch|&&|\|\||\?)\b/)) {
                    complexity++;
                }
                // Track braces
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount === 0) {
                    break;
                }
            }
        }
        return complexity;
    }
    countClassLines(content, startLine) {
        const lines = content.split('\n');
        let braceCount = 0;
        let lineCount = 0;
        let inClass = false;
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            if (!inClass && line.includes('{')) {
                inClass = true;
                braceCount++;
            }
            if (inClass) {
                lineCount++;
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount === 0) {
                    break;
                }
            }
        }
        return lineCount;
    }
    findCodeDuplication(content) {
        const duplications = [];
        const lines = content.split('\n');
        const minDuplicationLines = 5;
        for (let i = 0; i < lines.length - minDuplicationLines; i++) {
            for (let j = i + minDuplicationLines; j < lines.length - minDuplicationLines; j++) {
                const similarity = this.calculateLineSimilarity(lines.slice(i, i + minDuplicationLines), lines.slice(j, j + minDuplicationLines));
                if (similarity > 70) {
                    // 70% similarity threshold
                    duplications.push({
                        lines: [i + 1, j + 1],
                        similarity,
                    });
                }
            }
        }
        return duplications;
    }
    calculateLineSimilarity(block1, block2) {
        if (block1.length !== block2.length)
            return 0;
        let similarLines = 0;
        for (let i = 0; i < block1.length; i++) {
            const similarity = this.stringSimilarity(block1[i].trim(), block2[i].trim());
            if (similarity > 80)
                similarLines++;
        }
        return (similarLines / block1.length) * 100;
    }
    stringSimilarity(str1, str2) {
        if (str1 === str2)
            return 100;
        if (str1.length === 0 || str2.length === 0)
            return 0;
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 100;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return ((longer.length - editDistance) / longer.length) * 100;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1)
            .fill(null)
            .map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
            }
        }
        return matrix[str2.length][str1.length];
    }
    assessOverallRisk(targets) {
        const highPriorityCount = targets.filter(t => t.priority === 'high').length;
        const totalEffort = targets.reduce((sum, target) => sum + target.estimatedEffort, 0);
        if (highPriorityCount > 10 || totalEffort > 200)
            return 'high';
        if (highPriorityCount > 5 || totalEffort > 100)
            return 'medium';
        return 'low';
    }
    calculateExpectedImprovements(targets) {
        const improvements = new Set();
        targets.forEach(target => {
            target.benefits.forEach(benefit => improvements.add(benefit));
        });
        return Array.from(improvements);
    }
    generateRecommendations(targets, strategies) {
        const recommendations = [];
        if (targets.length === 0) {
            recommendations.push('Code quality is excellent. Consider implementing automated quality gates to maintain current standards.');
            return recommendations;
        }
        const highPriorityTargets = targets.filter(t => t.priority === 'high');
        if (highPriorityTargets.length > 0) {
            recommendations.push(`Address ${highPriorityTargets.length} high-priority refactoring targets immediately to reduce technical debt.`);
        }
        const totalEffort = targets.reduce((sum, target) => sum + target.estimatedEffort, 0);
        if (totalEffort > 100) {
            recommendations.push('Consider dedicating a separate sprint or development cycle for major refactoring efforts.');
        }
        const methodTargets = targets.filter(t => t.type === 'method');
        if (methodTargets.length > 10) {
            recommendations.push('Implement coding standards and complexity limits to prevent future method complexity issues.');
        }
        const classTargets = targets.filter(t => t.type === 'class');
        if (classTargets.length > 5) {
            recommendations.push('Consider architectural review to identify patterns of over-sized classes and design solutions.');
        }
        const patternTargets = targets.filter(t => t.type === 'pattern');
        if (patternTargets.length > 5) {
            recommendations.push('Implement DRY principle enforcement and consider creating shared utility libraries.');
        }
        if (strategies.some(s => s.riskLevel === 'high')) {
            recommendations.push('Ensure comprehensive test coverage and consider feature flags for high-risk refactoring efforts.');
        }
        recommendations.push('Establish refactoring as part of regular development workflow to prevent technical debt accumulation.');
        return recommendations;
    }
}
exports.RefactoringAnalyzer = RefactoringAnalyzer;
//# sourceMappingURL=analyzer.js.map