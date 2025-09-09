/**
 * Улучшенный калькулятор цикломатической и когнитивной сложности
 * Исправляет неадекватные значения сложности для сгенерированных файлов
 */
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { FileCategory, Framework } from './file-classifier.js';

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  halstead: HalsteadMetrics;
  maintainabilityIndex: number;
  nesting: NestingMetrics;
  functions: FunctionComplexity[];
}

export interface HalsteadMetrics {
  operators: number;
  operands: number;
  distinctOperators: number;
  distinctOperands: number;
  length: number;
  vocabulary: number;
  volume: number;
  difficulty: number;
  effort: number;
}

export interface NestingMetrics {
  maximum: number;
  average: number;
  functions: Array<{ name: string; maxNesting: number }>;
}

export interface FunctionComplexity {
  name: string;
  cyclomatic: number;
  cognitive: number;
  lines: number;
  parameters: number;
  startLine: number;
  endLine: number;
}

export interface ComplexityAnalysisResult {
  metrics: ComplexityMetrics;
  shouldAnalyze: boolean;
  category: FileCategory;
  framework?: Framework;
  warning?: string;
}

export class ImprovedComplexityCalculator {
  async calculateComplexity(
    filePath: string,
    content: string,
    category: FileCategory,
    framework?: Framework
  ): Promise<ComplexityAnalysisResult> {
    // Не анализируем сгенерированные, vendor и asset файлы
    if (!this.shouldAnalyzeComplexity(category)) {
      return this.getSkippedResult(category, 'File category excluded from complexity analysis');
    }

    // Проверка на минифицированный код
    if (this.isMinifiedCode(content)) {
      return this.getSkippedResult(category, 'Minified code detected');
    }

    try {
      // Парсинг AST с учетом типа файла
      const ast = this.parseToAST(content, filePath, framework);

      if (!ast) {
        return this.getSkippedResult(category, 'Failed to parse file');
      }

      // Расчет метрик
      const metrics = this.calculateAllMetrics(ast, content);

      return {
        metrics,
        shouldAnalyze: true,
        category,
        framework,
      };
    } catch (error: any) {
      console.warn(`⚠️ Ошибка при анализе сложности ${filePath}:`, error);

      return this.getSkippedResult(category, `Parse error: ${error?.message || 'Unknown error'}`);
    }
  }

  private shouldAnalyzeComplexity(category: FileCategory): boolean {
    const excludedCategories = [
      FileCategory.GENERATED,
      FileCategory.VENDOR,
      FileCategory.ASSET,
      FileCategory.DOCUMENTATION,
    ];

    return !excludedCategories.includes(category);
  }

  private isMinifiedCode(content: string): boolean {
    const lines = content.split('\n');

    // Эвристики для определения минифицированного кода
    if (lines.length < 10 && content.length > 5000) {
      return true;
    }

    // Средняя длина строки больше 200 символов
    const avgLineLength = content.length / lines.length;
    if (avgLineLength > 200) {
      return true;
    }

    // Отсутствие отступов
    const indentedLines = lines.filter(line => line.match(/^\s{2,}/));
    if (indentedLines.length / lines.length < 0.1) {
      return true;
    }

    // Характерные признаки сборщиков
    const minificationMarkers = [
      /^!function\([a-z]\)/,
      /webpackJsonp/,
      /__webpack_require__/,
      /^"use strict";var [a-z]=function\(/,
      /function\s+[a-z]\([a-z],[a-z],[a-z]\)\{/,
    ];

    return minificationMarkers.some(marker => marker.test(content));
  }

  private parseToAST(content: string, filePath: string, framework?: Framework): any {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    // Определяем плагины парсера на основе расширения файла и фреймворка
    const plugins = this.getParserPlugins(fileExtension, framework);

    try {
      return parser.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins,
      });
    } catch (error) {
      // Пробуем с менее строгими настройками
      try {
        return parser.parse(content, {
          sourceType: 'script',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          plugins: plugins.filter(p => p !== 'typescript'),
        });
      } catch (fallbackError: any) {
        throw new Error(`Unable to parse file: ${fallbackError?.message || 'Unknown error'}`);
      }
    }
  }

  private getParserPlugins(extension?: string, framework?: Framework): parser.ParserPlugin[] {
    const basePlugins: parser.ParserPlugin[] = [
      'asyncGenerators',
      'bigInt',
      'classProperties',
      ['decorators', { decoratorsBeforeExport: true }],
      'doExpressions',
      'dynamicImport',
      'exportDefaultFrom',
      'functionSent',
      'functionBind',
      'importMeta',
      'nullishCoalescingOperator',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      'optionalChaining',
      'throwExpressions',
    ];

    // Добавляем специфичные плагины
    if (extension === 'ts' || extension === 'tsx') {
      basePlugins.push('typescript');
    }

    if (extension === 'jsx' || extension === 'tsx' || framework === Framework.REACT) {
      basePlugins.push('jsx');
    }

    return basePlugins;
  }

  private calculateAllMetrics(ast: any, content: string): ComplexityMetrics {
    // Расчет цикломатической сложности
    const cyclomatic = this.calculateCyclomaticComplexity(ast);

    // Расчет когнитивной сложности
    const cognitive = this.calculateCognitiveComplexity(ast);

    // Расчет метрик Холстеда
    const halstead = this.calculateHalsteadMetrics(ast);

    // Расчет индекса сопровождаемости
    const maintainabilityIndex = this.calculateMaintainabilityIndex(halstead, cyclomatic, content);

    // Анализ вложенности
    const nesting = this.calculateNestingMetrics(ast);

    // Анализ функций
    const functions = this.analyzeFunctions(ast);

    return {
      cyclomatic,
      cognitive,
      halstead,
      maintainabilityIndex,
      nesting,
      functions,
    };
  }

  private calculateCyclomaticComplexity(ast: any): number {
    let complexity = 1; // Базовая сложность

    traverse(ast, {
      // Условные конструкции
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,

      // Логические операторы
      LogicalExpression: (path: any) => {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          complexity++;
        }
      },

      // Циклы
      ForStatement: () => complexity++,
      ForInStatement: () => complexity++,
      ForOfStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,

      // Обработка исключений
      CatchClause: () => complexity++,

      // Switch конструкции
      SwitchCase: (path: any) => {
        // Не считаем default case
        if (path.node.test) complexity++;
      },

      // Функции (каждая функция добавляет 1 к общей сложности)
      FunctionDeclaration: () => complexity++,
      FunctionExpression: () => complexity++,
      ArrowFunctionExpression: () => complexity++,
    });

    return Math.max(1, complexity);
  }

  private calculateCognitiveComplexity(ast: any): number {
    let complexity = 0;
    let nestingLevel = 0;
    const incrementStack: number[] = [];

    const calculator = this;

    traverse(ast, {
      enter(path: any) {
        const node = path.node;

        // Увеличиваем вложенность для составных конструкций
        if (calculator.isNestingNode && calculator.isNestingNode(node)) {
          nestingLevel++;
        }

        // Добавляем сложность с учетом вложенности
        if (calculator.isComplexityNode && calculator.isComplexityNode(node)) {
          complexity += 1 + nestingLevel;
        }

        // Специальные случаи
        if (t.isLogicalExpression(node)) {
          // Последовательные логические операторы не увеличивают сложность
          const parent = path.parent;
          if (!t.isLogicalExpression(parent) || parent.operator !== node.operator) {
            complexity += 1;
          }
        }

        if (t.isSequenceExpression(node)) {
          complexity += 1;
        }
      },

      exit(path: any) {
        if (calculator.isNestingNode && calculator.isNestingNode(path.node)) {
          nestingLevel--;
        }
      },
    });

    return complexity;
  }

  private isNestingNode(node: any): boolean {
    return (
      t.isIfStatement(node) ||
      t.isForStatement(node) ||
      t.isForInStatement(node) ||
      t.isForOfStatement(node) ||
      t.isWhileStatement(node) ||
      t.isDoWhileStatement(node) ||
      t.isTryStatement(node) ||
      t.isCatchClause(node) ||
      t.isSwitchStatement(node) ||
      t.isFunctionDeclaration(node) ||
      t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node)
    );
  }

  private isComplexityNode(node: any): boolean {
    return (
      t.isIfStatement(node) ||
      t.isConditionalExpression(node) ||
      t.isForStatement(node) ||
      t.isForInStatement(node) ||
      t.isForOfStatement(node) ||
      t.isWhileStatement(node) ||
      t.isDoWhileStatement(node) ||
      t.isCatchClause(node) ||
      t.isSwitchCase(node)
    );
  }

  private calculateHalsteadMetrics(ast: any): HalsteadMetrics {
    const operators = new Set<string>();
    const operands = new Set<string>();
    let operatorCount = 0;
    let operandCount = 0;

    traverse(ast, {
      enter(path: any) {
        const node = path.node;

        // Операторы
        if (
          t.isBinaryExpression(node) ||
          t.isUnaryExpression(node) ||
          t.isLogicalExpression(node)
        ) {
          operators.add(node.operator);
          operatorCount++;
        }

        if (t.isAssignmentExpression(node)) {
          operators.add(node.operator);
          operatorCount++;
        }

        if (t.isUpdateExpression(node)) {
          operators.add(node.operator);
          operatorCount++;
        }

        // Операнды
        if (t.isIdentifier(node) && !t.isFunction(path.parent)) {
          operands.add(node.name);
          operandCount++;
        }

        if (t.isLiteral(node) && 'value' in node && node.value !== null) {
          operands.add(String(node.value));
          operandCount++;
        }
      },
    });

    const distinctOperators = operators.size || 1;
    const distinctOperands = operands.size || 1;
    const length = operatorCount + operandCount;
    const vocabulary = distinctOperators + distinctOperands;
    const volume = length * Math.log2(vocabulary);
    const difficulty = (distinctOperators / 2) * (operandCount / distinctOperands);
    const effort = difficulty * volume;

    return {
      operators: operatorCount,
      operands: operandCount,
      distinctOperators,
      distinctOperands,
      length,
      vocabulary,
      volume,
      difficulty,
      effort,
    };
  }

  private calculateMaintainabilityIndex(
    halstead: HalsteadMetrics,
    cyclomatic: number,
    content: string
  ): number {
    const linesOfCode = content.split('\n').length;

    // Формула Microsoft для индекса сопровождаемости
    let mi =
      171 - 5.2 * Math.log(halstead.volume) - 0.23 * cyclomatic - 16.2 * Math.log(linesOfCode);

    // Нормализация в диапазон 0-100
    mi = Math.max(0, (mi * 100) / 171);

    return Math.round(mi);
  }

  private calculateNestingMetrics(ast: any): NestingMetrics {
    let maxNesting = 0;
    let currentNesting = 0;
    const nestingLevels: number[] = [];
    const functionNesting: Array<{ name: string; maxNesting: number }> = [];
    let currentFunction: string | null = null;
    let currentFunctionMaxNesting = 0;

    const calculator = this;

    traverse(ast, {
      enter(path: any) {
        const node = path.node;

        // Функции
        if (
          t.isFunctionDeclaration(node) ||
          t.isFunctionExpression(node) ||
          t.isArrowFunctionExpression(node)
        ) {
          if (currentFunction) {
            functionNesting.push({
              name: currentFunction,
              maxNesting: currentFunctionMaxNesting,
            });
          }

          currentFunction = calculator.getFunctionName
            ? calculator.getFunctionName(path)
            : 'anonymous';
          currentFunctionMaxNesting = 0;
          currentNesting = 0;
        }

        // Увеличение вложенности
        if (calculator.isNestingNode && calculator.isNestingNode(node) && !t.isFunction(node)) {
          currentNesting++;
          maxNesting = Math.max(maxNesting, currentNesting);
          currentFunctionMaxNesting = Math.max(currentFunctionMaxNesting, currentNesting);
          nestingLevels.push(currentNesting);
        }
      },

      exit(path: any) {
        if (
          calculator.isNestingNode &&
          calculator.isNestingNode(path.node) &&
          !t.isFunction(path.node)
        ) {
          currentNesting--;
        }

        if (t.isFunction(path.node) && currentFunction) {
          functionNesting.push({
            name: currentFunction,
            maxNesting: currentFunctionMaxNesting,
          });
          currentFunction = null;
          currentFunctionMaxNesting = 0;
        }
      },
    });

    const average =
      nestingLevels.length > 0
        ? nestingLevels.reduce((sum, level) => sum + level, 0) / nestingLevels.length
        : 0;

    return {
      maximum: maxNesting,
      average: Math.round(average * 100) / 100,
      functions: functionNesting,
    };
  }

  private analyzeFunctions(ast: any): FunctionComplexity[] {
    const functions: FunctionComplexity[] = [];
    const calculator = this;

    traverse(ast, {
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (path: any) => {
        const node = path.node;
        const name = calculator.getFunctionName ? calculator.getFunctionName(path) : 'anonymous';

        // Создаем под-AST для функции
        const functionComplexity = calculator.calculateCyclomaticComplexityForNode(node);
        const cognitiveComplexity = calculator.calculateCognitiveComplexityForNode(node);

        const lines = node.loc ? node.loc.end.line - node.loc.start.line + 1 : 0;
        const parameters = node.params ? node.params.length : 0;

        functions.push({
          name,
          cyclomatic: functionComplexity,
          cognitive: cognitiveComplexity,
          lines,
          parameters,
          startLine: node.loc?.start.line || 0,
          endLine: node.loc?.end.line || 0,
        });
      },
    });

    return functions;
  }

  private getFunctionName(path: any): string {
    const node = path.node;

    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }

    if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
      return 'anonymous';
    }

    return 'unknown';
  }

  private calculateCyclomaticComplexityForNode(node: any): number {
    let complexity = 1;

    traverse(
      node,
      {
        IfStatement: () => complexity++,
        ConditionalExpression: () => complexity++,
        LogicalExpression: (path: any) => {
          if (path.node.operator === '&&' || path.node.operator === '||') {
            complexity++;
          }
        },
        ForStatement: () => complexity++,
        ForInStatement: () => complexity++,
        ForOfStatement: () => complexity++,
        WhileStatement: () => complexity++,
        DoWhileStatement: () => complexity++,
        CatchClause: () => complexity++,
        SwitchCase: (path: any) => {
          if (path.node.test) complexity++;
        },
      },
      null,
      null,
      node
    );

    return complexity;
  }

  private calculateCognitiveComplexityForNode(node: any): number {
    let complexity = 0;
    let nestingLevel = 0;

    traverse(
      node,
      {
        enter: (path: any) => {
          const currentNode = path.node;

          if (this.isNestingNode(currentNode)) {
            nestingLevel++;
          }

          if (this.isComplexityNode(currentNode)) {
            complexity += 1 + nestingLevel;
          }
        },

        exit: (path: any) => {
          if (this.isNestingNode(path.node)) {
            nestingLevel--;
          }
        },
      },
      null,
      null,
      node
    );

    return complexity;
  }

  private getSkippedResult(category: FileCategory, reason: string): ComplexityAnalysisResult {
    return {
      metrics: {
        cyclomatic: -1,
        cognitive: -1,
        halstead: this.getEmptyHalstead(),
        maintainabilityIndex: 100,
        nesting: { maximum: 0, average: 0, functions: [] },
        functions: [],
      },
      shouldAnalyze: false,
      category,
      warning: reason,
    };
  }

  private getEmptyHalstead(): HalsteadMetrics {
    return {
      operators: 0,
      operands: 0,
      distinctOperators: 0,
      distinctOperands: 0,
      length: 0,
      vocabulary: 0,
      volume: 0,
      difficulty: 0,
      effort: 0,
    };
  }
}
