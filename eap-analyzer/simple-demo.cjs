#!/usr/bin/env node

/**
 * Простая демонстрация анализатора без TypeScript
 */

const fs = require('fs');
const path = require('path');

class SimpleEAPDemo {
  async runDemo() {
    console.log('🚀 === ДЕМОНСТРАЦИЯ EAP ANALYZER v3.0 ===');
    console.log('🧠 AI анализ + 💰 Технический долг + 📊 ROI расчеты');
    console.log('');

    const projectPath = process.cwd();
    
    try {
      console.log('📊 Анализ структуры проекта...');
      
      // Базовый анализ файлов
      const stats = await this.analyzeProjectStructure(projectPath);
      
      // Имитация AI анализа
      const aiAnalysis = this.simulateAIAnalysis(stats);
      
      // Имитация анализа технического долга
      const debtAnalysis = this.simulateTechnicalDebtAnalysis(stats);
      
      // Демонстрация результатов
      this.showResults(stats, aiAnalysis, debtAnalysis);
      
      // Сохранение отчетов
      await this.saveSimpleReports(stats, aiAnalysis, debtAnalysis);
      
      console.log('🎉 Демонстрация завершена успешно!');
      
    } catch (error) {
      console.error('❌ Ошибка демонстрации:', error);
    }
  }

  async analyzeProjectStructure(projectPath) {
    const files = await this.getCodeFiles(projectPath);
    let totalLines = 0;
    let totalComplexity = 0;
    let fileStats = [];

    for (const file of files.slice(0, 20)) { // Анализируем первые 20 файлов
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        const complexity = this.calculateComplexity(content);
        
        totalLines += lines;
        totalComplexity += complexity;
        
        fileStats.push({
          file: path.relative(projectPath, file),
          lines,
          complexity,
          issues: this.findIssues(content)
        });
      } catch (error) {
        // Игнорируем ошибки чтения файлов
      }
    }

    return {
      totalFiles: files.length,
      analyzedFiles: fileStats.length,
      totalLines,
      averageComplexity: Math.round(totalComplexity / fileStats.length),
      fileStats: fileStats.sort((a, b) => b.complexity - a.complexity)
    };
  }

  simulateAIAnalysis(stats) {
    const qualityScore = Math.max(40, 100 - (stats.averageComplexity * 2));
    
    return {
      qualityScore: Math.round(qualityScore),
      confidence: 87,
      patterns: [
        { name: 'Factory Pattern', confidence: 85, type: 'design-pattern' },
        { name: 'Long Method', confidence: 92, type: 'code-smell' },
        { name: 'Complex Class', confidence: 78, type: 'code-smell' }
      ],
      duplication: {
        percentage: Math.random() * 15 + 5, // 5-20%
        blocks: Math.floor(Math.random() * 10) + 3
      },
      recommendations: [
        '🎯 Разбить сложные методы на более мелкие',
        '📋 Уменьшить дублирование кода через рефакторинг',
        '🧩 Применить паттерны проектирования для упрощения архитектуры'
      ]
    };
  }

  simulateTechnicalDebtAnalysis(stats) {
    const totalDebt = stats.totalLines * 0.1 + stats.averageComplexity * 5; // Примерная формула
    const monthlyInterest = Math.round(totalDebt * 0.05);
    const refactoringCost = Math.round(totalDebt * 0.7);
    const roi = Math.round(((monthlyInterest * 36 - refactoringCost) / refactoringCost) * 100);

    return {
      totalDebt: Math.round(totalDebt),
      monthlyInterest,
      refactoringCost,
      roi,
      paybackPeriod: Math.ceil(refactoringCost / monthlyInterest),
      categories: [
        { name: 'Code Duplication', debt: Math.round(totalDebt * 0.3), impact: 'High' },
        { name: 'Complex Methods', debt: Math.round(totalDebt * 0.25), impact: 'Medium' },
        { name: 'Large Classes', debt: Math.round(totalDebt * 0.2), impact: 'High' },
        { name: 'Missing Tests', debt: Math.round(totalDebt * 0.25), impact: 'High' }
      ],
      hotspots: stats.fileStats.slice(0, 5).map(file => ({
        file: file.file,
        debt: Math.round(file.complexity * 2 + file.lines * 0.1),
        issues: file.issues
      }))
    };
  }

  showResults(stats, aiAnalysis, debtAnalysis) {
    console.log('📋 === РЕЗУЛЬТАТЫ АНАЛИЗА ===');
    console.log('');
    
    // Общая статистика
    console.log('📊 ОБЩАЯ СТАТИСТИКА:');
    console.log(`   📁 Файлов найдено: ${stats.totalFiles}`);
    console.log(`   🔍 Файлов проанализировано: ${stats.analyzedFiles}`);
    console.log(`   📄 Всего строк: ${stats.totalLines.toLocaleString()}`);
    console.log(`   🧩 Средняя сложность: ${stats.averageComplexity}`);
    console.log('');

    // AI анализ
    console.log('🧠 AI АНАЛИЗ И ИНСАЙТЫ:');
    console.log(`   🎯 Качество кода: ${aiAnalysis.qualityScore}/100 (${aiAnalysis.confidence}% уверенности)`);
    console.log(`   🔄 Дублирование: ${aiAnalysis.duplication.percentage.toFixed(1)}% (${aiAnalysis.duplication.blocks} блоков)`);
    console.log('   🎨 Обнаруженные паттерны:');
    aiAnalysis.patterns.forEach(pattern => {
      console.log(`      • ${pattern.name} (${pattern.confidence}% уверенности, ${pattern.type})`);
    });
    console.log('');

    // Технический долг
    console.log('💰 ТЕХНИЧЕСКИЙ ДОЛГ И ROI:');
    console.log(`   💸 Общий долг: ${debtAnalysis.totalDebt} часов`);
    console.log(`   📅 Ежемесячные проценты: ${debtAnalysis.monthlyInterest} часов`);
    console.log(`   💹 ROI рефакторинга: ${debtAnalysis.roi}%`);
    console.log(`   ⏱️  Окупаемость: ${debtAnalysis.paybackPeriod} месяцев`);
    console.log(`   🔧 Стоимость рефакторинга: ${debtAnalysis.refactoringCost} часов`);
    console.log('');
    
    console.log('   📂 Категории долга:');
    debtAnalysis.categories.forEach(cat => {
      console.log(`      • ${cat.name}: ${cat.debt} часов (${cat.impact} impact)`);
    });
    console.log('');
    
    console.log('   🔥 Горячие точки:');
    debtAnalysis.hotspots.forEach(hotspot => {
      console.log(`      • ${hotspot.file}: ${hotspot.debt} часов (${hotspot.issues.length} проблем)`);
    });
    console.log('');

    // Рекомендации
    console.log('💡 AI РЕКОМЕНДАЦИИ:');
    aiAnalysis.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');
    
    // ROI рекомендация
    if (debtAnalysis.roi > 100) {
      console.log('✅ РЕКОМЕНДАЦИЯ: Высокий приоритет рефакторинга - ROI > 100%');
    } else if (debtAnalysis.roi > 50) {
      console.log('⚠️ РЕКОМЕНДАЦИЯ: Средний приоритет рефакторинга - ROI > 50%');
    } else {
      console.log('❌ РЕКОМЕНДАЦИЯ: Низкий приоритет - рассмотреть долгосрочную стратегию');
    }
    console.log('');
  }

  async saveSimpleReports(stats, aiAnalysis, debtAnalysis) {
    console.log('💾 Сохранение отчетов...');
    
    const reportsDir = path.join(process.cwd(), 'reports');
    
    try {
      await fs.promises.mkdir(reportsDir, { recursive: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        projectStats: stats,
        aiAnalysis,
        technicalDebt: debtAnalysis,
        summary: {
          qualityScore: aiAnalysis.qualityScore,
          totalDebt: debtAnalysis.totalDebt,
          roi: debtAnalysis.roi,
          recommendation: debtAnalysis.roi > 100 ? 'High Priority' : debtAnalysis.roi > 50 ? 'Medium Priority' : 'Low Priority'
        }
      };
      
      // JSON отчет
      const jsonPath = path.join(reportsDir, 'simple-analysis-report.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(report, null, 2));
      console.log(`   📄 JSON отчет: ${jsonPath}`);
      
      // Markdown отчет
      const mdPath = path.join(reportsDir, 'SIMPLE-ANALYSIS-SUMMARY.md');
      const markdown = this.generateMarkdownReport(report);
      await fs.promises.writeFile(mdPath, markdown);
      console.log(`   📝 Markdown отчет: ${mdPath}`);
      
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
    }
    
    console.log('');
  }

  generateMarkdownReport(report) {
    return `# 🚀 EAP Analyzer v3.0 - Простой отчет

**Дата анализа:** ${new Date(report.timestamp).toLocaleString()}

## 📊 Общая статистика

- **Файлов проанализировано:** ${report.projectStats.analyzedFiles} из ${report.projectStats.totalFiles}
- **Всего строк кода:** ${report.projectStats.totalLines.toLocaleString()}
- **Средняя сложность:** ${report.projectStats.averageComplexity}

## 🧠 AI Анализ

- **Качество кода:** ${report.aiAnalysis.qualityScore}/100
- **Дублирование:** ${report.aiAnalysis.duplication.percentage.toFixed(1)}%
- **Обнаруженные паттерны:** ${report.aiAnalysis.patterns.length}

### Паттерны:
${report.aiAnalysis.patterns.map(p => `- ${p.name} (${p.confidence}% уверенности)`).join('\n')}

## 💰 Технический долг

- **Общий долг:** ${report.technicalDebt.totalDebt} часов
- **ROI рефакторинга:** ${report.technicalDebt.roi}%
- **Период окупаемости:** ${report.technicalDebt.paybackPeriod} месяцев

### Категории долга:
${report.technicalDebt.categories.map(c => `- ${c.name}: ${c.debt} часов`).join('\n')}

### Горячие точки:
${report.technicalDebt.hotspots.map(h => `- ${h.file}: ${h.debt} часов`).join('\n')}

## 💡 Рекомендации

${report.aiAnalysis.recommendations.map(r => `- ${r}`).join('\n')}

**Общая рекомендация:** ${report.summary.recommendation}

---
*Сгенерировано EAP Analyzer v3.0 Simple Demo*`;
  }

  async getCodeFiles(projectPath) {
    const files = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];
    
    const scanDir = async (dir) => {
      try {
        const items = await fs.promises.readdir(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
            await scanDir(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    };
    
    await scanDir(projectPath);
    return files;
  }

  calculateComplexity(content) {
    const conditions = (content.match(/if|while|for|case|catch|\?\s*:/g) || []).length;
    const logicalOperators = (content.match(/&&|\|\|/g) || []).length;
    return 1 + conditions + logicalOperators;
  }

  findIssues(content) {
    const issues = [];
    
    // Длинные методы (>30 строк)
    const methods = content.split(/function|async\s+function|\w+\s*\(/g);
    methods.forEach((method, index) => {
      if (method.split('\n').length > 30) {
        issues.push('Long Method');
      }
    });
    
    // Дублирование
    if (/(.{20,})\1/.test(content.replace(/\s+/g, ' '))) {
      issues.push('Code Duplication');
    }
    
    // Магические числа
    if (/[^a-zA-Z_]\d{2,}[^a-zA-Z_]/.test(content)) {
      issues.push('Magic Numbers');
    }
    
    // Глубокая вложенность
    if (/\s{16,}/.test(content)) {
      issues.push('Deep Nesting');
    }

    return [...new Set(issues)]; // Убираем дубли
  }
}

// Запуск демонстрации
const demo = new SimpleEAPDemo();
demo.runDemo().catch(console.error);
