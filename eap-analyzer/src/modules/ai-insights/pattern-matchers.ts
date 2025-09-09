/**
 * Специализированные матчеры для точного обнаружения паттернов
 */

import * as path from 'path';

export class PatternMatchers {
  /**
   * Улучшенный матчер для файлов
   */
  static matchFile(filePath: string, patterns: Array<RegExp | string>): number {
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath).replace(/\\/g, '/');
    const fullPath = filePath.replace(/\\/g, '/');

    let matchScore = 0;

    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        // Точное совпадение имени файла
        if (fileName.toLowerCase().includes(pattern.toLowerCase())) {
          matchScore += 0.6;
        }
        // Совпадение в пути
        if (fullPath.toLowerCase().includes(pattern.toLowerCase())) {
          matchScore += 0.4;
        }
      } else {
        // RegExp паттерн
        if (pattern.test(fileName)) {
          matchScore += 0.7;
        }
        if (pattern.test(fullPath)) {
          matchScore += 0.3;
        }
      }
    }

    return Math.min(1, matchScore); // Нормализуем до 0-1
  }

  /**
   * Улучшенный матчер для директорий
   */
  static matchDirectory(directories: string[], patterns: Array<RegExp | string>): number {
    let matchScore = 0;
    let matchCount = 0;

    for (const dir of directories) {
      const normalizedDir = dir.replace(/\\/g, '/').toLowerCase();
      const baseName = path.basename(normalizedDir);

      for (const pattern of patterns) {
        let matched = false;

        if (typeof pattern === 'string') {
          if (
            baseName === pattern.toLowerCase() ||
            normalizedDir.includes('/' + pattern.toLowerCase()) ||
            normalizedDir.endsWith(pattern.toLowerCase())
          ) {
            matchScore += 1;
            matchCount++;
            matched = true;
          }
        } else {
          if (pattern.test(normalizedDir) || pattern.test(baseName)) {
            matchScore += 1;
            matchCount++;
            matched = true;
          }
        }

        if (matched) break; // Избегаем двойного подсчета одной директории
      }
    }

    // Учитываем количество совпадений и общее количество директорий
    if (matchCount === 0) return 0;

    const coverageScore = Math.min(matchCount, patterns.length) / patterns.length;
    const depthScore = matchScore / Math.max(directories.length, 1);

    return Math.min(1, coverageScore * 0.7 + depthScore * 0.3);
  }

  /**
   * Улучшенный матчер для контента
   */
  static matchContent(content: string, patterns: Array<RegExp | string>): number {
    if (!content || content.trim().length === 0) return 0;

    let matchScore = 0;
    let matchedPatterns = 0;
    const contentLength = content.length;

    for (const pattern of patterns) {
      let matches = 0;

      try {
        if (typeof pattern === 'string') {
          const regex = new RegExp(pattern, 'gi');
          matches = (content.match(regex) || []).length;
        } else {
          matches = (content.match(pattern) || []).length;
        }

        if (matches > 0) {
          matchedPatterns++;
          // Логарифмическая шкала для множественных совпадений
          // Нормализуем по длине контента
          const normalizedMatches = matches / Math.max(contentLength / 1000, 1);
          matchScore += Math.min(1, Math.log10(normalizedMatches + 1) / 2);
        }
      } catch (error) {
        // Игнорируем ошибки в regex
        console.warn(`Pattern matching error: ${error}`);
      }
    }

    if (matchedPatterns === 0) return 0;

    // Комбинируем покрытие паттернов и интенсивность совпадений
    const coverageScore = matchedPatterns / patterns.length;
    const intensityScore = matchScore / patterns.length;

    return Math.min(1, coverageScore * 0.7 + intensityScore * 0.3);
  }

  /**
   * Матчер для импортов
   */
  static matchImports(imports: string[], patterns: Array<RegExp | string>): number {
    if (imports.length === 0) return 0;

    let matchScore = 0;
    let matchedImports = 0;

    for (const imp of imports) {
      for (const pattern of patterns) {
        let matched = false;

        try {
          if (typeof pattern === 'string') {
            if (imp.toLowerCase().includes(pattern.toLowerCase())) {
              matchScore += 1;
              matchedImports++;
              matched = true;
            }
          } else {
            if (pattern.test(imp)) {
              matchScore += 1;
              matchedImports++;
              matched = true;
            }
          }
        } catch (error) {
          console.warn(`Import pattern matching error: ${error}`);
        }

        if (matched) break; // Считаем каждый импорт только один раз
      }
    }

    if (matchedImports === 0) return 0;

    // Учитываем процент совпавших паттернов и процент импортов
    const patternCoverage = Math.min(matchedImports, patterns.length) / patterns.length;
    const importCoverage = matchedImports / imports.length;

    return Math.min(1, patternCoverage * 0.8 + importCoverage * 0.2);
  }

  /**
   * Матчер для классов
   */
  static matchClasses(classes: Map<string, any>, patterns: Array<RegExp | string>): number {
    if (classes.size === 0) return 0;

    let matchScore = 0;
    let matchedClasses = 0;

    for (const [className, classInfo] of classes) {
      for (const pattern of patterns) {
        let matched = false;

        try {
          if (typeof pattern === 'string') {
            if (className.toLowerCase().includes(pattern.toLowerCase())) {
              matchScore += 1;
              matchedClasses++;
              matched = true;
            }
          } else {
            if (pattern.test(className)) {
              matchScore += 1;
              matchedClasses++;
              matched = true;
            }
          }
        } catch (error) {
          console.warn(`Class pattern matching error: ${error}`);
        }

        if (matched) break;
      }
    }

    if (matchedClasses === 0) return 0;

    const patternCoverage = Math.min(matchedClasses, patterns.length) / patterns.length;
    const classCoverage = matchedClasses / classes.size;

    return Math.min(1, patternCoverage * 0.7 + classCoverage * 0.3);
  }

  /**
   * Матчер для функций
   */
  static matchFunctions(functions: Map<string, any>, patterns: Array<RegExp | string>): number {
    if (functions.size === 0) return 0;

    let matchScore = 0;
    let matchedFunctions = 0;

    for (const [funcName, funcInfo] of functions) {
      for (const pattern of patterns) {
        let matched = false;

        try {
          if (typeof pattern === 'string') {
            if (funcName.toLowerCase().includes(pattern.toLowerCase())) {
              matchScore += 1;
              matchedFunctions++;
              matched = true;
            }
          } else {
            if (pattern.test(funcName)) {
              matchScore += 1;
              matchedFunctions++;
              matched = true;
            }
          }
        } catch (error) {
          console.warn(`Function pattern matching error: ${error}`);
        }

        if (matched) break;
      }
    }

    if (matchedFunctions === 0) return 0;

    const patternCoverage = Math.min(matchedFunctions, patterns.length) / patterns.length;
    const functionCoverage = matchedFunctions / functions.size;

    return Math.min(1, patternCoverage * 0.7 + functionCoverage * 0.3);
  }

  /**
   * Комбинированный матчер для сложных условий
   */
  static matchCombined(context: any, matchers: any[]): number {
    let totalScore = 0;
    let totalWeight = 0;
    let requiredMet = true;

    for (const matcher of matchers) {
      let score = 0;

      try {
        switch (matcher.type) {
          case 'file':
            if (context.files && context.files.length > 0) {
              for (const file of context.files) {
                const fileScore = this.matchFile(file, matcher.patterns || [matcher.pattern]);
                score = Math.max(score, fileScore);
              }
            }
            break;

          case 'directory':
            score = this.matchDirectory(
              context.directories || [],
              matcher.patterns || [matcher.pattern]
            );
            break;

          case 'content':
            if (context.fileContents) {
              for (const [_, content] of context.fileContents) {
                const contentScore = this.matchContent(
                  content,
                  matcher.patterns || [matcher.pattern]
                );
                score = Math.max(score, contentScore);
              }
            }
            break;

          case 'import':
            const allImports: string[] = [];
            if (context.imports) {
              for (const [_, imports] of context.imports) {
                allImports.push(...imports);
              }
            }
            score = this.matchImports(allImports, matcher.patterns || [matcher.pattern]);
            break;

          case 'class':
            score = this.matchClasses(
              context.classes || new Map(),
              matcher.patterns || [matcher.pattern]
            );
            break;

          case 'function':
            score = this.matchFunctions(
              context.functions || new Map(),
              matcher.patterns || [matcher.pattern]
            );
            break;
        }
      } catch (error) {
        console.warn(`Matcher evaluation error: ${error}`);
        score = 0;
      }

      // Проверяем обязательные условия
      if (matcher.required && score === 0) {
        requiredMet = false;
      }

      totalScore += score * matcher.weight;
      totalWeight += matcher.weight;
    }

    // Если не выполнены обязательные условия, возвращаем 0
    if (!requiredMet) return 0;

    // Нормализуем результат
    return totalWeight > 0 ? Math.min(1, totalScore / totalWeight) : 0;
  }

  /**
   * Вспомогательный метод для нормализации строк
   */
  static normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Проверка на существование паттерна в коде
   */
  static hasCodePattern(content: string, pattern: RegExp | string): boolean {
    try {
      if (typeof pattern === 'string') {
        return content.toLowerCase().includes(pattern.toLowerCase());
      } else {
        return pattern.test(content);
      }
    } catch (error) {
      console.warn(`Pattern test error: ${error}`);
      return false;
    }
  }

  /**
   * Подсчет вхождений паттерна
   */
  static countPatternOccurrences(content: string, pattern: RegExp | string): number {
    try {
      if (typeof pattern === 'string') {
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return (content.match(regex) || []).length;
      } else {
        const globalPattern = new RegExp(
          pattern.source,
          pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'
        );
        return (content.match(globalPattern) || []).length;
      }
    } catch (error) {
      console.warn(`Pattern count error: ${error}`);
      return 0;
    }
  }

  /**
   * Анализ качества совпадения
   */
  static analyzeMatchQuality(
    matches: number,
    totalPatterns: number,
    contentSize: number
  ): { quality: number; confidence: number; density: number } {
    const coverage = matches / Math.max(totalPatterns, 1);
    const density = matches / Math.max(contentSize / 1000, 1); // Плотность на 1000 символов
    const confidence = Math.min(1, coverage * 0.7 + Math.min(density / 10, 0.3));

    let quality = 'low';
    if (confidence > 0.7) quality = 'high';
    else if (confidence > 0.4) quality = 'medium';

    return {
      quality: confidence,
      confidence,
      density,
    };
  }
}
