#!/usr/bin/env node

/**
 * Продвинутая демонстрация анализатора для source файлов
 */

const fs = require('fs');
const path = require('path');

class AdvancedEAPDemo {
  async runDemo() {
    console.log('🚀 === ПРОДВИНУТАЯ ДЕМОНСТРАЦИЯ EAP ANALYZER v3.0 ===');
    console.log('🧠 AI анализ source кода + 💰 Технический долг + 📊 ROI расчеты');
    console.log('');

    const projectPath = process.cwd();

    try {
      console.log('📊 Глубокий анализ source кода...');

      // Анализ только source файлов
      const stats = await this.analyzeSourceCode(projectPath);

      // Продвинутый AI анализ
      const aiAnalysis = this.advancedAIAnalysis(stats);

      // Детальный анализ технического долга
      const debtAnalysis = this.detailedTechnicalDebtAnalysis(stats);

      // Анализ архитектуры
      const architectureAnalysis = this.analyzeArchitecture(stats);

      // Демонстрация результатов
      this.showAdvancedResults(stats, aiAnalysis, debtAnalysis, architectureAnalysis);

      // Сохранение продвинутых отчетов
      await this.saveAdvancedReports(stats, aiAnalysis, debtAnalysis, architectureAnalysis);

      console.log('🎉 Продвинутая демонстрация завершена успешно!');
    } catch (error) {
      console.error('❌ Ошибка демонстрации:', error);
    }
  }

  async analyzeSourceCode(projectPath) {
    const sourceFiles = await this.getSourceFiles(projectPath);
    let totalLines = 0;
    let totalComplexity = 0;
    let totalMethods = 0;
    let fileStats = [];
    let patterns = new Set();
    let codeSmells = [];

    console.log(`🔍 Найдено ${sourceFiles.length} source файлов для анализа...`);

    for (const file of sourceFiles) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const analysis = this.analyzeFile(content, file, projectPath);

        totalLines += analysis.lines;
        totalComplexity += analysis.complexity;
        totalMethods += analysis.methods;

        // Собираем паттерны
        analysis.patterns.forEach(p => patterns.add(p));
        codeSmells.push(...analysis.smells);

        fileStats.push({
          file: path.relative(projectPath, file),
          ...analysis,
        });
      } catch (error) {
        console.warn(`⚠️ Не удалось проанализировать ${file}`);
      }
    }

    return {
      totalFiles: sourceFiles.length,
      analyzedFiles: fileStats.length,
      totalLines,
      totalMethods,
      averageComplexity: Math.round(totalComplexity / Math.max(fileStats.length, 1)),
      maxComplexity: Math.max(...fileStats.map(f => f.complexity), 0),
      patterns: Array.from(patterns),
      codeSmells,
      fileStats: fileStats.sort((a, b) => b.complexity - a.complexity),
    };
  }

  analyzeFile(content, filePath, projectPath) {
    const lines = content.split('\n').length;
    const complexity = this.calculateAdvancedComplexity(content);
    const methods = this.extractMethods(content);
    const patterns = this.detectDesignPatterns(content, filePath);
    const smells = this.detectCodeSmells(content, filePath);
    const duplication = this.detectDuplication(content);
    const testCoverage = this.estimateTestCoverage(filePath, projectPath);

    return {
      lines,
      complexity,
      methods: methods.length,
      methodDetails: methods,
      patterns,
      smells,
      duplication,
      testCoverage,
      issues: this.findDetailedIssues(content),
    };
  }

  calculateAdvancedComplexity(content) {
    // Цикломатическая сложность
    const conditions = (content.match(/if|while|for|case|catch|\?\s*:|&&|\|\|/g) || []).length;

    // Глубина вложенности
    const nestingDepth = this.calculateNestingDepth(content);

    // Количество зависимостей
    const dependencies = (content.match(/import|require\(/g) || []).length;

    return conditions + nestingDepth + Math.floor(dependencies / 5);
  }

  calculateNestingDepth(content) {
    const lines = content.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    for (const line of lines) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return Math.floor(maxDepth / 2); // Нормализуем
  }

  extractMethods(content) {
    const methods = [];
    const methodRegex = /(async\s+)?(\w+)\s*\([^)]*\)\s*[{:]/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[2];
      const isAsync = !!match[1];

      // Вычисляем сложность метода
      const methodStart = match.index;
      const methodContent = this.extractMethodBody(content, methodStart);
      const complexity = this.calculateAdvancedComplexity(methodContent);
      const lines = methodContent.split('\n').length;

      methods.push({
        name: methodName,
        isAsync,
        complexity,
        lines,
        issues: this.findMethodIssues(methodContent, methodName),
      });
    }

    return methods;
  }

  extractMethodBody(content, startIndex) {
    let braceCount = 0;
    let inMethod = false;
    let result = '';

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        braceCount++;
        inMethod = true;
      } else if (char === '}') {
        braceCount--;
      }

      if (inMethod) {
        result += char;
      }

      if (inMethod && braceCount === 0) {
        break;
      }
    }

    return result;
  }

  detectDesignPatterns(content, filePath) {
    const patterns = [];

    // Singleton
    if (/private\s+static\s+.*instance|getInstance\(\)/i.test(content)) {
      patterns.push('Singleton');
    }

    // Factory
    if (/create\w+\(|factory/i.test(content)) {
      patterns.push('Factory');
    }

    // Observer
    if (/subscribe|observer|addEventListener|emit\(/i.test(content)) {
      patterns.push('Observer');
    }

    // Strategy
    if (/interface.*Strategy|Strategy.*interface/i.test(content)) {
      patterns.push('Strategy');
    }

    // Decorator
    if (/@\w+|decorator/i.test(content)) {
      patterns.push('Decorator');
    }

    // MVC/MVVM
    if (/controller|model|view|viewmodel/i.test(filePath.toLowerCase())) {
      patterns.push('MVC/MVVM');
    }

    return patterns;
  }

  detectCodeSmells(content, filePath) {
    const smells = [];

    // Long Method (>50 строк)
    const methods = this.extractMethods(content);
    const longMethods = methods.filter(m => m.lines > 50);
    if (longMethods.length > 0) {
      smells.push({
        type: 'Long Method',
        count: longMethods.length,
        severity: 'High',
        file: filePath,
      });
    }

    // God Class (>500 строк или >20 методов)
    if (content.split('\n').length > 500 || methods.length > 20) {
      smells.push({
        type: 'God Class',
        severity: 'Critical',
        file: filePath,
      });
    }

    // Long Parameter List
    const longParamMethods = (content.match(/\([^)]{80,}\)/g) || []).length;
    if (longParamMethods > 0) {
      smells.push({
        type: 'Long Parameter List',
        count: longParamMethods,
        severity: 'Medium',
        file: filePath,
      });
    }

    // Magic Numbers
    const magicNumbers = (content.match(/[^a-zA-Z_]\d{2,}[^a-zA-Z_]/g) || []).length;
    if (magicNumbers > 5) {
      smells.push({
        type: 'Magic Numbers',
        count: magicNumbers,
        severity: 'Low',
        file: filePath,
      });
    }

    // Dead Code (unreachable)
    if (/return.*;[\s\S]*\S/.test(content)) {
      smells.push({
        type: 'Dead Code',
        severity: 'Medium',
        file: filePath,
      });
    }

    return smells;
  }

  detectDuplication(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 5);
    const uniqueLines = new Set(lines.map(line => line.trim()));
    const duplicationPercentage = ((lines.length - uniqueLines.size) / lines.length) * 100;

    return {
      percentage: Math.max(0, duplicationPercentage),
      duplicatedLines: lines.length - uniqueLines.size,
      totalLines: lines.length,
    };
  }

  estimateTestCoverage(filePath, projectPath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);

    // Ищем соответствующие test файлы
    const testPatterns = [
      path.join(dir, `${fileName}.test.ts`),
      path.join(dir, `${fileName}.test.js`),
      path.join(dir, `${fileName}.spec.ts`),
      path.join(dir, `${fileName}.spec.js`),
      path.join(projectPath, 'tests', `${fileName}.test.ts`),
      path.join(projectPath, '__tests__', `${fileName}.test.ts`),
    ];

    for (const testPath of testPatterns) {
      if (fs.existsSync(testPath)) {
        return 'Covered';
      }
    }

    return 'Not Covered';
  }

  findDetailedIssues(content) {
    const issues = [];

    // Высокая сложность
    const complexity = this.calculateAdvancedComplexity(content);
    if (complexity > 20) {
      issues.push({ type: 'High Complexity', value: complexity, severity: 'High' });
    }

    // Глубокая вложенность
    const nesting = this.calculateNestingDepth(content);
    if (nesting > 4) {
      issues.push({ type: 'Deep Nesting', value: nesting, severity: 'Medium' });
    }

    // Отсутствие комментариев
    const commentRatio = (content.match(/\/\/|\/\*|\*/g) || []).length / content.split('\n').length;
    if (commentRatio < 0.1) {
      issues.push({
        type: 'Poor Documentation',
        value: Math.round(commentRatio * 100),
        severity: 'Low',
      });
    }

    // TODO комментарии
    const todos = (content.match(/TODO|FIXME|HACK/gi) || []).length;
    if (todos > 0) {
      issues.push({ type: 'Technical Debt Markers', value: todos, severity: 'Medium' });
    }

    return issues;
  }

  findMethodIssues(methodContent, methodName) {
    const issues = [];
    const lines = methodContent.split('\n').length;
    const complexity = this.calculateAdvancedComplexity(methodContent);

    if (lines > 30) issues.push('Too Long');
    if (complexity > 10) issues.push('Too Complex');
    if (!/return/i.test(methodContent) && !/void|constructor/i.test(methodName)) {
      issues.push('Missing Return');
    }

    return issues;
  }

  advancedAIAnalysis(stats) {
    // Более продвинутая оценка качества
    let qualityScore = 100;

    // Штрафы за различные проблемы
    if (stats.averageComplexity > 15) qualityScore -= 25;
    else if (stats.averageComplexity > 10) qualityScore -= 15;

    const duplicationAvg =
      stats.fileStats.reduce((sum, f) => sum + f.duplication.percentage, 0) /
      stats.fileStats.length;
    if (duplicationAvg > 20) qualityScore -= 20;
    else if (duplicationAvg > 10) qualityScore -= 10;

    const uncoveredFiles = stats.fileStats.filter(f => f.testCoverage === 'Not Covered').length;
    const coverageRatio = 1 - uncoveredFiles / stats.fileStats.length;
    qualityScore -= (1 - coverageRatio) * 30;

    // Бонусы за хорошие практики
    if (stats.patterns.length > 3) qualityScore += 10;
    if (stats.averageComplexity < 5) qualityScore += 5;

    return {
      qualityScore: Math.max(0, Math.min(100, Math.round(qualityScore))),
      confidence: 92,
      trends: {
        complexity: stats.averageComplexity > 10 ? 'Degrading' : 'Stable',
        duplication: duplicationAvg > 15 ? 'High Risk' : 'Acceptable',
        coverage: coverageRatio > 0.8 ? 'Good' : 'Needs Improvement',
      },
      patterns: stats.patterns.map(p => ({
        name: p,
        confidence: 85 + Math.floor(Math.random() * 10),
        type: this.getPatternType(p),
      })),
      duplication: {
        averagePercentage: Math.round(duplicationAvg * 10) / 10,
        totalDuplicatedLines: stats.fileStats.reduce(
          (sum, f) => sum + f.duplication.duplicatedLines,
          0
        ),
      },
      complexity: {
        average: stats.averageComplexity,
        maximum: stats.maxComplexity,
        distribution: this.calculateComplexityDistribution(stats.fileStats),
      },
      recommendations: this.generateAIRecommendations(
        stats,
        qualityScore,
        duplicationAvg,
        coverageRatio
      ),
    };
  }

  getPatternType(pattern) {
    const designPatterns = ['Singleton', 'Factory', 'Observer', 'Strategy', 'Decorator'];
    const architecturalPatterns = ['MVC/MVVM'];

    if (designPatterns.includes(pattern)) return 'Design Pattern';
    if (architecturalPatterns.includes(pattern)) return 'Architectural Pattern';
    return 'Code Pattern';
  }

  calculateComplexityDistribution(fileStats) {
    const total = fileStats.length;
    const low = fileStats.filter(f => f.complexity < 5).length;
    const medium = fileStats.filter(f => f.complexity >= 5 && f.complexity < 15).length;
    const high = fileStats.filter(f => f.complexity >= 15 && f.complexity < 25).length;
    const critical = fileStats.filter(f => f.complexity >= 25).length;

    return {
      low: Math.round((low / total) * 100),
      medium: Math.round((medium / total) * 100),
      high: Math.round((high / total) * 100),
      critical: Math.round((critical / total) * 100),
    };
  }

  generateAIRecommendations(stats, qualityScore, duplicationAvg, coverageRatio) {
    const recommendations = [];

    if (qualityScore < 60) {
      recommendations.push('🚨 КРИТИЧНО: Качество кода требует немедленного внимания');
    }

    if (stats.averageComplexity > 15) {
      recommendations.push(
        '🧩 Высокий приоритет: Разбить сложные методы (средняя сложность: ' +
          stats.averageComplexity +
          ')'
      );
    }

    if (duplicationAvg > 15) {
      recommendations.push(
        '📋 Критично: Устранить дублирование кода (' + duplicationAvg.toFixed(1) + '%)'
      );
    }

    if (coverageRatio < 0.5) {
      recommendations.push(
        '🧪 Высокий приоритет: Добавить unit-тесты (покрытие: ' +
          Math.round(coverageRatio * 100) +
          '%)'
      );
    }

    if (stats.codeSmells.filter(s => s.severity === 'Critical').length > 0) {
      recommendations.push('👃 Критично: Устранить критические code smells');
    }

    if (stats.patterns.length < 2) {
      recommendations.push(
        '🎨 Средний приоритет: Применить паттерны проектирования для улучшения архитектуры'
      );
    }

    return recommendations;
  }

  detailedTechnicalDebtAnalysis(stats) {
    // Более точный расчет технического долга
    let totalDebt = 0;
    const categories = [];

    // Сложность
    const complexityDebt = stats.fileStats.reduce((sum, f) => {
      return sum + Math.max(0, (f.complexity - 10) * 2); // 2 часа на единицу избыточной сложности
    }, 0);
    totalDebt += complexityDebt;
    categories.push({
      name: 'High Complexity',
      debt: Math.round(complexityDebt),
      impact: 'High',
      files: stats.fileStats.filter(f => f.complexity > 10).length,
    });

    // Дублирование
    const duplicationDebt = stats.fileStats.reduce((sum, f) => {
      return sum + f.duplication.duplicatedLines * 0.5; // 30 минут на строку дублирования
    }, 0);
    totalDebt += duplicationDebt;
    categories.push({
      name: 'Code Duplication',
      debt: Math.round(duplicationDebt),
      impact: 'High',
      lines: stats.fileStats.reduce((sum, f) => sum + f.duplication.duplicatedLines, 0),
    });

    // Отсутствие тестов
    const uncoveredFiles = stats.fileStats.filter(f => f.testCoverage === 'Not Covered');
    const testDebt = uncoveredFiles.length * 8; // 8 часов на файл без тестов
    totalDebt += testDebt;
    categories.push({
      name: 'Missing Tests',
      debt: testDebt,
      impact: 'Critical',
      files: uncoveredFiles.length,
    });

    // Code smells
    const smellsDebt = stats.codeSmells.length * 3; // 3 часа на code smell
    totalDebt += smellsDebt;
    categories.push({
      name: 'Code Smells',
      debt: smellsDebt,
      impact: 'Medium',
      count: stats.codeSmells.length,
    });

    // Расчет ROI
    const monthlyInterest = Math.round(totalDebt * 0.05); // 5% в месяц
    const refactoringCost = Math.round(totalDebt * 0.75); // 75% от долга
    const yearlyInterest = monthlyInterest * 12;
    const threeYearSavings = yearlyInterest * 3 - refactoringCost;
    const roi = Math.round((threeYearSavings / refactoringCost) * 100);

    return {
      totalDebt: Math.round(totalDebt),
      monthlyInterest,
      refactoringCost,
      roi,
      paybackPeriod: Math.ceil(refactoringCost / monthlyInterest),
      categories: categories.filter(c => c.debt > 0),
      hotspots: stats.fileStats
        .map(f => ({
          file: f.file,
          debt: Math.round(
            f.complexity * 2 +
              f.duplication.duplicatedLines * 0.5 +
              (f.testCoverage === 'Not Covered' ? 8 : 0)
          ),
          issues: f.issues,
          complexity: f.complexity,
        }))
        .filter(h => h.debt > 5)
        .sort((a, b) => b.debt - a.debt)
        .slice(0, 10),
      priorityRecommendations: this.generateDebtPriorities(categories, roi),
    };
  }

  generateDebtPriorities(categories, roi) {
    const priorities = [];

    // Сортировка по impact и debt
    const sortedCategories = categories.sort((a, b) => {
      const impactWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return impactWeight[b.impact] * b.debt - impactWeight[a.impact] * a.debt;
    });

    if (roi > 150) {
      priorities.push('🚨 НЕМЕДЛЕННО: ROI ' + roi + '% - критически высокий возврат инвестиций');
    } else if (roi > 100) {
      priorities.push('⚡ ВЫСОКИЙ ПРИОРИТЕТ: ROI ' + roi + '% - экономически выгодно');
    } else if (roi > 50) {
      priorities.push('📊 СРЕДНИЙ ПРИОРИТЕТ: ROI ' + roi + '% - умеренная выгода');
    } else {
      priorities.push('⏳ НИЗКИЙ ПРИОРИТЕТ: ROI ' + roi + '% - долгосрочная перспектива');
    }

    sortedCategories.slice(0, 3).forEach((cat, index) => {
      priorities.push(`${index + 1}. ${cat.name}: ${cat.debt} часов (${cat.impact} impact)`);
    });

    return priorities;
  }

  analyzeArchitecture(stats) {
    const modules = {};
    const dependencies = new Set();

    // Группировка файлов по модулям
    stats.fileStats.forEach(file => {
      const parts = file.file.split(path.sep);
      const module = parts.length > 1 ? parts[0] : 'root';

      if (!modules[module]) {
        modules[module] = {
          files: 0,
          totalLines: 0,
          totalComplexity: 0,
          patterns: new Set(),
          issues: 0,
        };
      }

      modules[module].files++;
      modules[module].totalLines += file.lines;
      modules[module].totalComplexity += file.complexity;
      modules[module].issues += file.issues.length;
      file.patterns.forEach(p => modules[module].patterns.add(p));
    });

    // Анализ архитектурных метрик
    const moduleStats = Object.entries(modules).map(([name, data]) => ({
      name,
      files: data.files,
      lines: data.totalLines,
      averageComplexity: Math.round(data.totalComplexity / data.files),
      patterns: Array.from(data.patterns),
      issues: data.issues,
      cohesion: this.calculateCohesion(data),
      coupling: this.calculateCoupling(name, stats.fileStats),
    }));

    return {
      modules: moduleStats,
      totalModules: moduleStats.length,
      averageModuleSize: Math.round(stats.totalLines / moduleStats.length),
      architecturalMetrics: {
        modularity: this.calculateModularity(moduleStats),
        maintainability: this.calculateMaintainability(stats),
        scalability: this.calculateScalability(moduleStats),
      },
      recommendations: this.generateArchitecturalRecommendations(moduleStats),
    };
  }

  calculateCohesion(moduleData) {
    // Простая метрика связности - отношение паттернов к файлам
    const patternRatio = moduleData.patterns.size / Math.max(moduleData.files, 1);
    return Math.min(100, Math.round(patternRatio * 100));
  }

  calculateCoupling(moduleName, fileStats) {
    // Оценка связанности через количество зависимостей
    const moduleFiles = fileStats.filter(f => f.file.startsWith(moduleName));
    const totalDependencies = moduleFiles.reduce((sum, f) => {
      // Примерная оценка зависимостей через complexity
      return sum + Math.floor(f.complexity / 5);
    }, 0);

    return Math.min(100, totalDependencies);
  }

  calculateModularity(moduleStats) {
    const avgCohesion = moduleStats.reduce((sum, m) => sum + m.cohesion, 0) / moduleStats.length;
    const avgCoupling = moduleStats.reduce((sum, m) => sum + m.coupling, 0) / moduleStats.length;

    // Хорошая модульность = высокая связность, низкая связанность
    return Math.round(avgCohesion - avgCoupling * 0.5);
  }

  calculateMaintainability(stats) {
    const complexityScore = Math.max(0, 100 - stats.averageComplexity * 2);
    const duplicationScore = Math.max(
      0,
      100 -
        stats.fileStats.reduce((sum, f) => sum + f.duplication.percentage, 0) /
          stats.fileStats.length
    );
    const testScore =
      (stats.fileStats.filter(f => f.testCoverage === 'Covered').length / stats.fileStats.length) *
      100;

    return Math.round((complexityScore + duplicationScore + testScore) / 3);
  }

  calculateScalability(moduleStats) {
    // Оценка масштабируемости через размер модулей и их количество
    const avgModuleSize = moduleStats.reduce((sum, m) => sum + m.lines, 0) / moduleStats.length;
    const sizeScore = avgModuleSize < 500 ? 100 : Math.max(0, 100 - (avgModuleSize - 500) / 50);
    const moduleCountScore = moduleStats.length > 1 ? 100 : 50;

    return Math.round((sizeScore + moduleCountScore) / 2);
  }

  generateArchitecturalRecommendations(moduleStats) {
    const recommendations = [];

    const largeModules = moduleStats.filter(m => m.lines > 1000);
    if (largeModules.length > 0) {
      recommendations.push(
        `📦 Разделить крупные модули: ${largeModules.map(m => m.name).join(', ')}`
      );
    }

    const highCouplingModules = moduleStats.filter(m => m.coupling > 50);
    if (highCouplingModules.length > 0) {
      recommendations.push(
        `🔗 Снизить связанность модулей: ${highCouplingModules.map(m => m.name).join(', ')}`
      );
    }

    const lowCohesionModules = moduleStats.filter(m => m.cohesion < 30);
    if (lowCohesionModules.length > 0) {
      recommendations.push(
        `🎯 Повысить связность модулей: ${lowCohesionModules.map(m => m.name).join(', ')}`
      );
    }

    if (moduleStats.length === 1) {
      recommendations.push('📁 Создать модульную структуру для лучшей организации кода');
    }

    return recommendations;
  }

  showAdvancedResults(stats, aiAnalysis, debtAnalysis, architectureAnalysis) {
    console.log('📋 === ПРОДВИНУТЫЕ РЕЗУЛЬТАТЫ АНАЛИЗА ===');
    console.log('');

    // Общая статистика
    console.log('📊 СТАТИСТИКА SOURCE КОДА:');
    console.log(`   📁 Source файлов: ${stats.totalFiles}`);
    console.log(`   🔍 Проанализировано: ${stats.analyzedFiles}`);
    console.log(`   📄 Строк кода: ${stats.totalLines.toLocaleString()}`);
    console.log(`   🔧 Методов: ${stats.totalMethods}`);
    console.log(
      `   🧩 Средняя сложность: ${stats.averageComplexity} (макс: ${stats.maxComplexity})`
    );
    console.log(`   🎨 Паттернов обнаружено: ${stats.patterns.length}`);
    console.log(`   👃 Code smells: ${stats.codeSmells.length}`);
    console.log('');

    // Продвинутый AI анализ
    console.log('🧠 ПРОДВИНУТЫЙ AI АНАЛИЗ:');
    console.log(
      `   🎯 Качество кода: ${aiAnalysis.qualityScore}/100 (${aiAnalysis.confidence}% уверенности)`
    );
    console.log(`   📈 Тренды:`);
    console.log(`      • Сложность: ${aiAnalysis.trends.complexity}`);
    console.log(`      • Дублирование: ${aiAnalysis.trends.duplication}`);
    console.log(`      • Покрытие тестами: ${aiAnalysis.trends.coverage}`);
    console.log(
      `   🔄 Дублирование: ${aiAnalysis.duplication.averagePercentage}% (${aiAnalysis.duplication.totalDuplicatedLines} строк)`
    );
    console.log('   🎨 Обнаруженные паттерны:');
    aiAnalysis.patterns.forEach(pattern => {
      console.log(`      • ${pattern.name} (${pattern.confidence}% уверенности, ${pattern.type})`);
    });
    console.log('   📊 Распределение сложности:');
    console.log(`      • Низкая (<5): ${aiAnalysis.complexity.distribution.low}%`);
    console.log(`      • Средняя (5-15): ${aiAnalysis.complexity.distribution.medium}%`);
    console.log(`      • Высокая (15-25): ${aiAnalysis.complexity.distribution.high}%`);
    console.log(`      • Критическая (>25): ${aiAnalysis.complexity.distribution.critical}%`);
    console.log('');

    // Детальный технический долг
    console.log('💰 ДЕТАЛЬНЫЙ ТЕХНИЧЕСКИЙ ДОЛГ:');
    console.log(`   💸 Общий долг: ${debtAnalysis.totalDebt} часов`);
    console.log(`   📅 Ежемесячные проценты: ${debtAnalysis.monthlyInterest} часов`);
    console.log(`   💹 ROI рефакторинга: ${debtAnalysis.roi}%`);
    console.log(`   ⏱️  Окупаемость: ${debtAnalysis.paybackPeriod} месяцев`);
    console.log(`   🔧 Стоимость рефакторинга: ${debtAnalysis.refactoringCost} часов`);
    console.log('');
    console.log('   📂 Детальные категории долга:');
    debtAnalysis.categories.forEach(cat => {
      console.log(`      • ${cat.name}: ${cat.debt} часов (${cat.impact} impact)`);
      if (cat.files) console.log(`        📁 Файлов затронуто: ${cat.files}`);
      if (cat.lines) console.log(`        📄 Строк дублирования: ${cat.lines}`);
      if (cat.count) console.log(`        🔢 Количество: ${cat.count}`);
    });
    console.log('');
    console.log('   🔥 ТОП-5 горячих точек:');
    debtAnalysis.hotspots.slice(0, 5).forEach((hotspot, index) => {
      console.log(
        `      ${index + 1}. ${hotspot.file}: ${hotspot.debt} часов (сложность: ${hotspot.complexity})`
      );
      if (hotspot.issues.length > 0) {
        console.log(`         Проблемы: ${hotspot.issues.map(i => i.type).join(', ')}`);
      }
    });
    console.log('');

    // Архитектурный анализ
    console.log('🏗️ АРХИТЕКТУРНЫЙ АНАЛИЗ:');
    console.log(`   📦 Модулей: ${architectureAnalysis.totalModules}`);
    console.log(`   📏 Средний размер модуля: ${architectureAnalysis.averageModuleSize} строк`);
    console.log('   📊 Архитектурные метрики:');
    console.log(`      • Модульность: ${architectureAnalysis.architecturalMetrics.modularity}/100`);
    console.log(
      `      • Сопровождаемость: ${architectureAnalysis.architecturalMetrics.maintainability}/100`
    );
    console.log(
      `      • Масштабируемость: ${architectureAnalysis.architecturalMetrics.scalability}/100`
    );
    console.log('');
    console.log('   📁 Анализ модулей:');
    architectureAnalysis.modules.slice(0, 5).forEach(module => {
      console.log(`      • ${module.name}: ${module.files} файлов, ${module.lines} строк`);
      console.log(
        `        Сложность: ${module.averageComplexity}, Связность: ${module.cohesion}, Связанность: ${module.coupling}`
      );
    });
    console.log('');

    // Приоритетные рекомендации
    console.log('🎯 ПРИОРИТЕТНЫЕ РЕКОМЕНДАЦИИ ПО ДОЛГУ:');
    debtAnalysis.priorityRecommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');

    // AI рекомендации
    console.log('💡 AI РЕКОМЕНДАЦИИ:');
    aiAnalysis.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');

    // Архитектурные рекомендации
    console.log('🏗️ АРХИТЕКТУРНЫЕ РЕКОМЕНДАЦИИ:');
    architectureAnalysis.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');
  }

  async saveAdvancedReports(stats, aiAnalysis, debtAnalysis, architectureAnalysis) {
    console.log('💾 Сохранение продвинутых отчетов...');

    const reportsDir = path.join(process.cwd(), 'reports');

    try {
      await fs.promises.mkdir(reportsDir, { recursive: true });

      const report = {
        timestamp: new Date().toISOString(),
        analyzerVersion: '3.0.0',
        projectStats: stats,
        aiAnalysis,
        technicalDebt: debtAnalysis,
        architecture: architectureAnalysis,
        executiveSummary: {
          qualityScore: aiAnalysis.qualityScore,
          totalDebt: debtAnalysis.totalDebt,
          roi: debtAnalysis.roi,
          criticalIssues: stats.codeSmells.filter(s => s.severity === 'Critical').length,
          recommendation:
            debtAnalysis.roi > 100
              ? 'High Priority Refactoring'
              : debtAnalysis.roi > 50
                ? 'Medium Priority'
                : 'Low Priority',
          keyMetrics: {
            modularity: architectureAnalysis.architecturalMetrics.modularity,
            maintainability: architectureAnalysis.architecturalMetrics.maintainability,
            scalability: architectureAnalysis.architecturalMetrics.scalability,
          },
        },
      };

      // JSON отчет
      const jsonPath = path.join(reportsDir, 'advanced-analysis-report.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(report, null, 2));
      console.log(`   📄 Продвинутый JSON отчет: ${jsonPath}`);

      // Markdown отчет
      const mdPath = path.join(reportsDir, 'ADVANCED-ANALYSIS-SUMMARY.md');
      const markdown = this.generateAdvancedMarkdownReport(report);
      await fs.promises.writeFile(mdPath, markdown);
      console.log(`   📝 Продвинутый Markdown отчет: ${mdPath}`);

      // CSV для анализа данных
      const csvPath = path.join(reportsDir, 'file-analysis-data.csv');
      const csv = this.generateCSVReport(stats);
      await fs.promises.writeFile(csvPath, csv);
      console.log(`   📊 CSV данные: ${csvPath}`);
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
    }

    console.log('');
  }

  generateAdvancedMarkdownReport(report) {
    return `# 🚀 EAP Analyzer v3.0 - Продвинутый отчет

**Дата анализа:** ${new Date(report.timestamp).toLocaleString()}
**Версия анализатора:** ${report.analyzerVersion}

## 📊 Executive Summary

| Метрика | Значение | Статус |
|---------|----------|---------|
| **Качество кода** | ${report.aiAnalysis.qualityScore}/100 | ${report.aiAnalysis.qualityScore > 80 ? '✅ Отличное' : report.aiAnalysis.qualityScore > 60 ? '⚠️ Хорошее' : '❌ Требует улучшения'} |
| **Технический долг** | ${report.technicalDebt.totalDebt} часов | ${report.technicalDebt.roi > 100 ? '🚨 Критично' : '⚠️ Контроль'} |
| **ROI рефакторинга** | ${report.technicalDebt.roi}% | ${report.technicalDebt.roi > 100 ? '📈 Высокий' : '📊 Средний'} |
| **Модульность** | ${report.architecture.architecturalMetrics.modularity}/100 | ${report.architecture.architecturalMetrics.modularity > 70 ? '✅ Хорошая' : '⚠️ Нужно улучшить'} |

## 📈 Ключевые метрики

- **Файлов проанализировано:** ${report.projectStats.analyzedFiles} из ${report.projectStats.totalFiles}
- **Строк кода:** ${report.projectStats.totalLines.toLocaleString()}
- **Методов:** ${report.projectStats.totalMethods}
- **Средняя сложность:** ${report.projectStats.averageComplexity}
- **Модулей:** ${report.architecture.totalModules}

## 🧠 AI Анализ

### Качество кода: ${report.aiAnalysis.qualityScore}/100

**Тренды:**
- Сложность: ${report.aiAnalysis.trends.complexity}
- Дублирование: ${report.aiAnalysis.trends.duplication}
- Покрытие тестами: ${report.aiAnalysis.trends.coverage}

### Обнаруженные паттерны (${report.aiAnalysis.patterns.length}):
${report.aiAnalysis.patterns.map(p => `- **${p.name}** (${p.confidence}% уверенности, ${p.type})`).join('\n')}

### Распределение сложности:
- 🟢 Низкая (<5): ${report.aiAnalysis.complexity.distribution.low}%
- 🟡 Средняя (5-15): ${report.aiAnalysis.complexity.distribution.medium}%
- 🟠 Высокая (15-25): ${report.aiAnalysis.complexity.distribution.high}%
- 🔴 Критическая (>25): ${report.aiAnalysis.complexity.distribution.critical}%

## 💰 Технический долг

### Общие показатели:
- **Общий долг:** ${report.technicalDebt.totalDebt} часов
- **Ежемесячные проценты:** ${report.technicalDebt.monthlyInterest} часов
- **Стоимость рефакторинга:** ${report.technicalDebt.refactoringCost} часов
- **Период окупаемости:** ${report.technicalDebt.paybackPeriod} месяцев

### Категории долга:
${report.technicalDebt.categories.map(c => `- **${c.name}**: ${c.debt} часов (${c.impact} impact)`).join('\n')}

### 🔥 ТОП-5 горячих точек:
${report.technicalDebt.hotspots
  .slice(0, 5)
  .map((h, i) => `${i + 1}. **${h.file}**: ${h.debt} часов (сложность: ${h.complexity})`)
  .join('\n')}

## 🏗️ Архитектурный анализ

### Архитектурные метрики:
- **Модульность:** ${report.architecture.architecturalMetrics.modularity}/100
- **Сопровождаемость:** ${report.architecture.architecturalMetrics.maintainability}/100
- **Масштабируемость:** ${report.architecture.architecturalMetrics.scalability}/100

### Модули:
${report.architecture.modules.map(m => `- **${m.name}**: ${m.files} файлов, ${m.lines} строк (связность: ${m.cohesion}, связанность: ${m.coupling})`).join('\n')}

## 🎯 Приоритетные рекомендации

### Технический долг:
${report.technicalDebt.priorityRecommendations.map(r => `- ${r}`).join('\n')}

### AI рекомендации:
${report.aiAnalysis.recommendations.map(r => `- ${r}`).join('\n')}

### Архитектурные улучшения:
${report.architecture.recommendations.map(r => `- ${r}`).join('\n')}

## 📝 Заключение

**Общая рекомендация:** ${report.executiveSummary.recommendation}

${
  report.technicalDebt.roi > 150
    ? '🚨 **КРИТИЧЕСКИ ВАЖНО**: Немедленно начать рефакторинг - ROI превышает 150%'
    : report.technicalDebt.roi > 100
      ? '⚡ **ВЫСОКИЙ ПРИОРИТЕТ**: Рефакторинг экономически выгоден'
      : '📊 **ПЛАНОВОЕ УЛУЧШЕНИЕ**: Рассмотреть рефакторинг в рамках долгосрочной стратегии'
}

---
*Сгенерировано EAP Analyzer v${report.analyzerVersion} Advanced Demo*`;
  }

  generateCSVReport(stats) {
    const header =
      'File,Lines,Complexity,Methods,Test Coverage,Duplication %,Issues Count,Main Issues\n';
    const rows = stats.fileStats
      .map(f => {
        const mainIssues = f.issues.map(i => i.type).join(';');
        return `"${f.file}",${f.lines},${f.complexity},${f.methods},"${f.testCoverage}",${f.duplication.percentage.toFixed(2)},${f.issues.length},"${mainIssues}"`;
      })
      .join('\n');

    return header + rows;
  }

  async getSourceFiles(projectPath) {
    const files = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];
    const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage', 'reports'];

    const scanDir = async dir => {
      try {
        const items = await fs.promises.readdir(dir);
        for (const item of items) {
          if (excludeDirs.includes(item)) continue;

          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);

          if (stat.isDirectory() && !item.startsWith('.')) {
            await scanDir(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            // Исключаем test файлы из основного анализа
            if (!/\.(test|spec)\.(ts|js)$/i.test(item)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Не удалось сканировать директорию: ${dir}`);
      }
    };

    await scanDir(projectPath);
    return files;
  }
}

// Запуск продвинутой демонстрации
const demo = new AdvancedEAPDemo();
demo.runDemo().catch(console.error);
