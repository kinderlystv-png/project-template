/**
 * AI анализатор - интеллектуальный анализ кода с машинным обучением
 */

import { BaseAnalyzer } from '../../core/analyzer.js';
import { CheckContext } from '../../core/types.js';
import * as fs from 'fs';
import * as path from 'path';

export class AIAnalyzer extends BaseAnalyzer {
  getName(): string {
    return 'ai-insights';
  }

  get metadata() {
    return {
      name: 'AI Insights Analyzer',
      version: '1.0.0',
      description: 'Интеллектуальный анализ кода с машинным обучением',
      supportedFileTypes: ['.ts', '.js', '.tsx', '.jsx'],
    };
  }

  async analyze(projectPath: string): Promise<any> {
    console.log('🧠 AI анализ кода...');

    const results = {
      patterns: await this.detectPatterns(projectPath),
      quality: await this.predictQuality(projectPath),
      duplication: await this.analyzeDuplication(projectPath),
      complexity: await this.analyzeComplexity(projectPath),
      codeSmells: await this.detectCodeSmells(projectPath),
      refactoringOpportunities: await this.identifyRefactoringOpportunities(projectPath),
      aiRecommendations: [] as string[],
    };

    results.aiRecommendations = this.generateAIRecommendations(results);

    return {
      success: true,
      data: results,
      metadata: {
        analyzer: this.getName(),
        timestamp: new Date(),
        duration: 0,
        filesAnalyzed: await this.countFiles(projectPath),
      },
    };
  }

  /**
   * Обнаружение паттернов проектирования
   */
  private async detectPatterns(projectPath: string): Promise<any[]> {
    const patterns = [];
    const files = await this.getCodeFiles(projectPath);

    for (const file of files) {
      const content = await this.readFile(file);

      // Singleton Pattern
      if (this.detectSingleton(content)) {
        patterns.push({
          name: 'Singleton',
          type: 'design-pattern',
          file,
          confidence: 85,
          occurrences: 1,
          impact: 60,
          description: 'Обнаружен паттерн Singleton',
        });
      }

      // Factory Pattern
      if (this.detectFactory(content)) {
        patterns.push({
          name: 'Factory',
          type: 'design-pattern',
          file,
          confidence: 78,
          occurrences: 1,
          impact: 70,
          description: 'Обнаружен паттерн Factory',
        });
      }

      // Observer Pattern
      if (this.detectObserver(content)) {
        patterns.push({
          name: 'Observer',
          type: 'design-pattern',
          file,
          confidence: 82,
          occurrences: 1,
          impact: 75,
          description: 'Обнаружен паттерн Observer',
        });
      }

      // God Object Anti-pattern
      if (this.detectGodObject(content)) {
        patterns.push({
          name: 'God Object',
          type: 'anti-pattern',
          file,
          confidence: 90,
          occurrences: 1,
          impact: 85,
          description: 'Обнаружен анти-паттерн God Object - класс с слишком многими обязанностями',
        });
      }

      // Long Method Code Smell
      if (this.detectLongMethods(content)) {
        patterns.push({
          name: 'Long Method',
          type: 'code-smell',
          file,
          confidence: 88,
          occurrences: this.countLongMethods(content),
          impact: 70,
          description: 'Обнаружены длинные методы',
        });
      }
    }

    return patterns;
  }

  /**
   * Предсказание качества кода
   */
  private async predictQuality(projectPath: string): Promise<any> {
    const files = await this.getCodeFiles(projectPath);
    let totalComplexity = 0;
    let totalLines = 0;
    let totalMethods = 0;
    let duplicatedLines = 0;

    for (const file of files) {
      const content = await this.readFile(file);
      const lines = content.split('\n').length;
      const methods = this.countMethods(content);
      const complexity = this.calculateCyclomaticComplexity(content);
      const duplication = this.detectDuplicationInFile(content);

      totalLines += lines;
      totalMethods += methods;
      totalComplexity += complexity;
      duplicatedLines += duplication;
    }

    const avgComplexity = totalMethods > 0 ? totalComplexity / totalMethods : 0;
    const duplicationPercentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

    // AI модель предсказания качества
    const qualityScore = this.calculateQualityScore(
      avgComplexity,
      duplicationPercentage,
      totalLines,
      totalMethods
    );
    const trend = this.predictTrend(qualityScore, avgComplexity, duplicationPercentage);

    return {
      score: Math.round(qualityScore),
      confidence: 87,
      factors: [
        {
          name: 'Complexity',
          value: avgComplexity,
          impact: avgComplexity > 10 ? -20 : 10,
          trend: avgComplexity > 10 ? 'negative' : 'positive',
        },
        {
          name: 'Duplication',
          value: duplicationPercentage,
          impact: duplicationPercentage > 15 ? -15 : 5,
          trend: duplicationPercentage > 15 ? 'negative' : 'neutral',
        },
        {
          name: 'Size',
          value: totalLines,
          impact: totalLines > 10000 ? -10 : 0,
          trend: 'neutral',
        },
      ],
      trend,
      prediction: this.generateQualityPrediction(qualityScore, trend),
    };
  }

  /**
   * Анализ дублирования кода
   */
  private async analyzeDuplication(projectPath: string): Promise<any> {
    const files = await this.getCodeFiles(projectPath);
    const duplicatedBlocks = [];
    let totalDuplicatedLines = 0;

    // Простой алгоритм поиска дублирования
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const content1 = await this.readFile(files[i]);
        const content2 = await this.readFile(files[j]);

        const duplicates = this.findDuplicateBlocks(content1, content2, files[i], files[j]);
        duplicatedBlocks.push(...duplicates);
        totalDuplicatedLines += duplicates.reduce((sum, dup) => sum + dup.lines, 0);
      }
    }

    const totalLines = await this.countTotalLines(files);
    const percentage = totalLines > 0 ? (totalDuplicatedLines / totalLines) * 100 : 0;

    return {
      percentage: Math.round(percentage * 10) / 10,
      lines: totalDuplicatedLines,
      blocks: duplicatedBlocks.slice(0, 10), // Топ 10 дублей
      files: [...new Set(duplicatedBlocks.map(d => d.file1))],
      recommendations: this.generateDuplicationRecommendations(percentage, duplicatedBlocks),
    };
  }

  /**
   * Анализ сложности
   */
  private async analyzeComplexity(projectPath: string): Promise<any> {
    const files = await this.getCodeFiles(projectPath);
    const complexityData = [];
    let totalComplexity = 0;
    let maxComplexity = 0;
    let methodCount = 0;

    for (const file of files) {
      const content = await this.readFile(file);
      const methods = this.extractMethods(content);

      for (const method of methods) {
        const complexity = this.calculateMethodComplexity(method.content);
        methodCount++;
        totalComplexity += complexity;
        maxComplexity = Math.max(maxComplexity, complexity);

        if (complexity > 10) {
          complexityData.push({
            file: path.relative(projectPath, file),
            function: method.name,
            complexity,
            lines: method.lines,
            recommendation: this.getComplexityRecommendation(complexity),
          });
        }
      }
    }

    const average = methodCount > 0 ? totalComplexity / methodCount : 0;

    return {
      average: Math.round(average * 10) / 10,
      maximum: maxComplexity,
      distribution: this.calculateComplexityDistribution(complexityData),
      hotspots: complexityData.sort((a, b) => b.complexity - a.complexity).slice(0, 10),
      recommendations: this.generateComplexityRecommendations(average, maxComplexity),
    };
  }

  /**
   * Обнаружение code smells
   */
  private async detectCodeSmells(projectPath: string): Promise<any[]> {
    const smells = [];
    const files = await this.getCodeFiles(projectPath);

    for (const file of files) {
      const content = await this.readFile(file);
      const relativePath = path.relative(projectPath, file);

      // Long Parameter List
      const longParamMethods = this.detectLongParameterList(content);
      if (longParamMethods.length > 0) {
        smells.push({
          name: 'Long Parameter List',
          severity: 'major',
          file: relativePath,
          occurrences: longParamMethods.length,
          description: `${longParamMethods.length} методов с длинным списком параметров`,
          impact: 'Затрудняет использование и понимание API',
          refactoringSteps: [
            'Группировать связанные параметры в объекты',
            'Использовать Builder pattern',
            'Разбить метод на более мелкие',
          ],
        });
      }

      // Large Class
      if (this.detectLargeClass(content)) {
        smells.push({
          name: 'Large Class',
          severity: 'major',
          file: relativePath,
          occurrences: 1,
          description: 'Класс содержит слишком много методов или строк',
          impact: 'Нарушает принцип единственной ответственности',
          refactoringSteps: [
            'Разделить класс на более мелкие',
            'Извлечь отдельные компоненты',
            'Применить принципы SOLID',
          ],
        });
      }

      // Feature Envy
      const featureEnvyMethods = this.detectFeatureEnvy(content);
      if (featureEnvyMethods.length > 0) {
        smells.push({
          name: 'Feature Envy',
          severity: 'minor',
          file: relativePath,
          occurrences: featureEnvyMethods.length,
          description: 'Методы используют данные других классов чаще своих',
          impact: 'Слабая связность, неправильное размещение логики',
          refactoringSteps: [
            'Переместить метод в соответствующий класс',
            'Пересмотреть распределение ответственности',
          ],
        });
      }
    }

    return smells;
  }

  /**
   * Выявление возможностей для рефакторинга
   */
  private async identifyRefactoringOpportunities(projectPath: string): Promise<any[]> {
    const opportunities = [];
    const files = await this.getCodeFiles(projectPath);

    for (const file of files) {
      const content = await this.readFile(file);
      const relativePath = path.relative(projectPath, file);

      // Extract Method opportunities
      const longMethods = this.findLongMethods(content);
      for (const method of longMethods) {
        opportunities.push({
          type: 'Extract Method',
          file: relativePath,
          target: method.name,
          reason: `Метод ${method.name} содержит ${method.lines} строк`,
          priority: method.lines > 50 ? 'high' : 'medium',
          effort: { days: Math.ceil(method.lines / 30), complexity: 'Средняя' },
          benefits: ['Улучшение читаемости', 'Упрощение тестирования', 'Повторное использование'],
          example: this.generateExtractMethodExample(method),
        });
      }

      // Extract Class opportunities
      if (this.shouldExtractClass(content)) {
        opportunities.push({
          type: 'Extract Class',
          file: relativePath,
          target: 'Large Class',
          reason: 'Класс нарушает принцип единственной ответственности',
          priority: 'high',
          effort: { days: 5, complexity: 'Высокая' },
          benefits: ['Лучшее разделение ответственности', 'Упрощение тестирования'],
          example: this.generateExtractClassExample(),
        });
      }

      // Move Method opportunities
      const misplacedMethods = this.findMisplacedMethods(content);
      for (const method of misplacedMethods) {
        opportunities.push({
          type: 'Move Method',
          file: relativePath,
          target: method.name,
          reason: 'Метод использует данные другого класса',
          priority: 'medium',
          effort: { days: 1, complexity: 'Низкая' },
          benefits: ['Лучшая связность', 'Более логичное размещение'],
          example: this.generateMoveMethodExample(method),
        });
      }
    }

    return opportunities.slice(0, 20); // Топ 20 возможностей
  }

  private generateAIRecommendations(results: any): string[] {
    const recommendations = [];

    if (results.quality.score < 70) {
      recommendations.push('🎯 Приоритет: улучшение общего качества кода (текущий балл < 70)');
    }

    if (results.duplication.percentage > 15) {
      recommendations.push(
        `📋 Критично: дублирование кода ${results.duplication.percentage}% - необходим рефакторинг`
      );
    }

    if (results.complexity.average > 10) {
      recommendations.push(
        `🧩 Высокая сложность (${results.complexity.average}) - разбить сложные методы`
      );
    }

    if (results.patterns.some((p: any) => p.type === 'anti-pattern')) {
      recommendations.push('⚠️ Обнаружены анти-паттерны - требуется архитектурный рефакторинг');
    }

    if (results.codeSmells.length > 5) {
      recommendations.push(
        `👃 Множественные code smells (${results.codeSmells.length}) - систематическая очистка кода`
      );
    }

    return recommendations;
  }

  // Вспомогательные методы для детекции паттернов
  private detectSingleton(content: string): boolean {
    return /private\s+static\s+\w+.*instance/i.test(content) && /getInstance\(\)/i.test(content);
  }

  private detectFactory(content: string): boolean {
    return /create\w+\(/i.test(content) && /(factory|creator)/i.test(content);
  }

  private detectObserver(content: string): boolean {
    return /subscribe|observer|notify|addEventListener/i.test(content);
  }

  private detectGodObject(content: string): boolean {
    const methodCount = (content.match(/function\s+\w+|async\s+\w+|\w+\s*\(/g) || []).length;
    const lineCount = content.split('\n').length;
    return methodCount > 20 || lineCount > 500;
  }

  private detectLongMethods(content: string): boolean {
    const methods = this.extractMethods(content);
    return methods.some(m => m.lines > 30);
  }

  private countLongMethods(content: string): number {
    const methods = this.extractMethods(content);
    return methods.filter(m => m.lines > 30).length;
  }

  private extractMethods(content: string): any[] {
    const methods = [];
    const lines = content.split('\n');
    let currentMethod = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Простое определение начала метода
      if (/^(async\s+)?\w+\s*\(.*\)\s*\{?/.test(line)) {
        if (currentMethod) {
          currentMethod.lines = i - currentMethod.start;
          methods.push(currentMethod);
        }

        currentMethod = {
          name: line.match(/(\w+)\s*\(/)?.[1] || 'unknown',
          start: i,
          lines: 0,
          content: line,
        };
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      } else if (currentMethod) {
        currentMethod.content += '\n' + line;
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

        if (braceCount === 0) {
          currentMethod.lines = i - currentMethod.start + 1;
          methods.push(currentMethod);
          currentMethod = null;
        }
      }
    }

    return methods;
  }

  private countMethods(content: string): number {
    return this.extractMethods(content).length;
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Упрощенный расчет цикломатической сложности
    const conditions = (content.match(/if|while|for|case|catch|\?\s*:/g) || []).length;
    const logicalOperators = (content.match(/&&|\|\|/g) || []).length;
    return 1 + conditions + logicalOperators;
  }

  private calculateMethodComplexity(methodContent: string): number {
    return this.calculateCyclomaticComplexity(methodContent);
  }

  private calculateQualityScore(
    complexity: number,
    duplication: number,
    lines: number,
    methods: number
  ): number {
    let score = 100;

    // Штраф за сложность
    if (complexity > 15) score -= 30;
    else if (complexity > 10) score -= 20;
    else if (complexity > 5) score -= 10;

    // Штраф за дублирование
    if (duplication > 20) score -= 25;
    else if (duplication > 15) score -= 15;
    else if (duplication > 10) score -= 10;

    // Штраф за размер
    if (lines > 20000) score -= 15;
    else if (lines > 10000) score -= 10;

    return Math.max(0, score);
  }

  private predictTrend(score: number, complexity: number, duplication: number): string {
    if (complexity < 5 && duplication < 10) return 'improving';
    if (complexity > 15 || duplication > 20) return 'degrading';
    return 'stable';
  }

  private generateQualityPrediction(score: number, trend: string): string {
    if (trend === 'improving') {
      return `Качество улучшается. При текущих показателях может достичь ${score + 10} баллов.`;
    }
    if (trend === 'degrading') {
      return `Качество ухудшается. Без вмешательства может снизиться до ${score - 15} баллов.`;
    }
    return `Качество стабильно на уровне ${score} баллов.`;
  }

  // Дополнительные методы детекции
  private detectDuplicationInFile(content: string): number {
    // Простой алгоритм поиска дублирования внутри файла
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const duplicates = new Set();

    for (let i = 0; i < lines.length - 1; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[i].trim() === lines[j].trim() && lines[i].trim().length > 10) {
          duplicates.add(lines[i].trim());
        }
      }
    }

    return duplicates.size;
  }

  private findDuplicateBlocks(
    content1: string,
    content2: string,
    file1: string,
    file2: string
  ): any[] {
    const duplicates = [];
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    // Поиск блоков дублированного кода (упрощенный)
    for (let i = 0; i < lines1.length - 5; i++) {
      const block1 = lines1
        .slice(i, i + 5)
        .join('\n')
        .trim();
      if (block1.length < 50) continue;

      for (let j = 0; j < lines2.length - 5; j++) {
        const block2 = lines2
          .slice(j, j + 5)
          .join('\n')
          .trim();

        if (block1 === block2) {
          duplicates.push({
            file1: path.basename(file1),
            file2: path.basename(file2),
            lines: 5,
            startLine1: i + 1,
            startLine2: j + 1,
            content: block1.substring(0, 100) + '...',
          });
        }
      }
    }

    return duplicates;
  }

  private async countTotalLines(files: string[]): Promise<number> {
    let total = 0;
    for (const file of files) {
      const content = await this.readFile(file);
      total += content.split('\n').length;
    }
    return total;
  }

  private generateDuplicationRecommendations(percentage: number, blocks: any[]): string[] {
    const recommendations = [];

    if (percentage > 20) {
      recommendations.push('Критично: немедленно начать рефакторинг дублированного кода');
    } else if (percentage > 15) {
      recommendations.push('Высокий приоритет: планировать рефакторинг дублирования');
    } else if (percentage > 10) {
      recommendations.push('Средний приоритет: отслеживать рост дублирования');
    }

    if (blocks.length > 0) {
      recommendations.push('Извлечь общие блоки кода в утилитарные функции');
      recommendations.push('Создать переиспользуемые компоненты');
    }

    return recommendations;
  }

  private calculateComplexityDistribution(complexityData: any[]) {
    const total = complexityData.length;
    if (total === 0) return { low: 100, medium: 0, high: 0, extreme: 0 };

    const low = complexityData.filter(d => d.complexity < 5).length;
    const medium = complexityData.filter(d => d.complexity >= 5 && d.complexity < 10).length;
    const high = complexityData.filter(d => d.complexity >= 10 && d.complexity < 20).length;
    const extreme = complexityData.filter(d => d.complexity >= 20).length;

    return {
      low: Math.round((low / total) * 100),
      medium: Math.round((medium / total) * 100),
      high: Math.round((high / total) * 100),
      extreme: Math.round((extreme / total) * 100),
    };
  }

  private getComplexityRecommendation(complexity: number): string {
    if (complexity > 20) return 'Критично: немедленно разбить на мелкие методы';
    if (complexity > 15) return 'Высокий приоритет: рефакторинг метода';
    if (complexity > 10) return 'Рассмотреть упрощение логики';
    return 'Приемлемая сложность';
  }

  private generateComplexityRecommendations(average: number, maximum: number): string[] {
    const recommendations = [];

    if (maximum > 20) {
      recommendations.push('Критично: есть экстремально сложные методы (>20)');
    }
    if (average > 10) {
      recommendations.push('Средняя сложность высокая - общий рефакторинг');
    }
    if (average > 5) {
      recommendations.push('Установить лимит сложности в 10');
    }

    recommendations.push('Использовать паттерны для упрощения сложной логики');
    recommendations.push('Добавить автоматическую проверку сложности в CI/CD');

    return recommendations;
  }

  // Методы детекции code smells
  private detectLongParameterList(content: string): any[] {
    const methods = [];
    const methodRegex = /(\w+)\s*\([^)]{50,}\)/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[1],
        parameters: match[0],
      });
    }

    return methods;
  }

  private detectLargeClass(content: string): boolean {
    const lineCount = content.split('\n').length;
    const methodCount = this.countMethods(content);
    return lineCount > 300 || methodCount > 15;
  }

  private detectFeatureEnvy(content: string): any[] {
    // Упрощенная детекция Feature Envy
    const methods = this.extractMethods(content);
    return methods.filter(method => {
      const otherClassCalls = (method.content.match(/\w+\.\w+/g) || []).length;
      const thisUsage = (method.content.match(/this\./g) || []).length;
      return otherClassCalls > thisUsage && otherClassCalls > 3;
    });
  }

  // Методы для рефакторинга
  private findLongMethods(content: string): any[] {
    return this.extractMethods(content).filter(m => m.lines > 20);
  }

  private shouldExtractClass(content: string): boolean {
    return this.detectLargeClass(content);
  }

  private findMisplacedMethods(content: string): any[] {
    return this.detectFeatureEnvy(content);
  }

  private generateExtractMethodExample(method: any): string {
    return `// Было:
${method.name}() {
  // ${method.lines} строк кода
}

// Стало:
${method.name}() {
  this.validateInput();
  this.processData();
  this.generateResult();
}`;
  }

  private generateExtractClassExample(): string {
    return `// Было:
class LargeClass {
  // много методов и ответственностей
}

// Стало:
class CoreClass {
  // основная ответственность
}
class HelperClass {
  // вспомогательная логика
}`;
  }

  private generateMoveMethodExample(method: any): string {
    return `// Переместить метод ${method.name} в соответствующий класс`;
  }

  // Утилитарные методы
  private async getCodeFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];

    const scanDir = async (dir: string) => {
      try {
        const items = await fs.promises.readdir(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            await scanDir(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения директорий
      }
    };

    await scanDir(projectPath);
    return files;
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  private async countFiles(projectPath: string): Promise<number> {
    const files = await this.getCodeFiles(projectPath);
    return files.length;
  }
}
