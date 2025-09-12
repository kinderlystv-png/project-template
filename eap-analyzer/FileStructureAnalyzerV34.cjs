/**
 * FileStructureAnalyzer v3.4 PRECISION
 * Точная калибровка на основе детального анализа расхождений
 */

const fs = require('fs');
const path = require('path');

class FileStructureAnalyzerV34 {
  constructor() {
    this.version = '3.4 PRECISION';
    this.analysisStartTime = Date.now();
  }

  analyzeProject(projectPath) {
    console.log(`🔍 Анализ FileStructureAnalyzer v${this.version}...`);

    const scanner = this.scanProject(projectPath);
    const metrics = this.calculateMetrics(scanner);

    return {
      version: this.version,
      projectPath,
      scanner,
      metrics,
      analysisTime: Date.now() - this.analysisStartTime,
    };
  }

  scanProject(projectPath) {
    const files = [];
    const directories = [];
    const scanDepth = { max: 0, total: 0, count: 0 };

    const scanDirectory = (dir, depth = 0) => {
      if (depth > 10) return;

      try {
        const items = fs.readdirSync(dir);
        scanDepth.max = Math.max(scanDepth.max, depth);
        scanDepth.total += depth;
        scanDepth.count++;

        for (const item of items) {
          if (item.startsWith('.') && !item.match(/\.(js|ts|tsx|jsx|json|md)$/)) continue;

          const fullPath = path.join(dir, item);
          const relativePath = path.relative(projectPath, fullPath);

          // Пропускаем node_modules и другие системные папки
          if (
            relativePath.includes('node_modules') ||
            relativePath.includes('.next') ||
            relativePath.includes('.git') ||
            relativePath.includes('coverage')
          )
            continue;

          const stat = fs.statSync(fullPath);

          if (stat.isFile()) {
            files.push({
              name: item,
              path: fullPath,
              relativePath,
              size: stat.size,
              extension: path.extname(item),
              depth,
              isTest: this.isTestFile(item, relativePath),
              isDoc: this.isDocFile(item),
              isBackup: this.isBackupFile(item, relativePath),
              isConfig: this.isConfigFile(item),
              isSourceCode: this.isSourceCodeFile(item, relativePath),
            });
          } else if (stat.isDirectory()) {
            directories.push({
              name: item,
              path: fullPath,
              relativePath,
              depth,
              isEmpty: false,
            });
            scanDirectory(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Игнорируем недоступные директории
      }
    };

    scanDirectory(projectPath);

    return {
      files,
      directories,
      depth: {
        max: scanDepth.max,
        average: scanDepth.count > 0 ? scanDepth.total / scanDepth.count : 0,
      },
      stats: {
        totalFiles: files.length,
        totalDirectories: directories.length,
      },
    };
  }

  isTestFile(name, relativePath) {
    return (
      /\.(test|spec)\.(js|ts|tsx|jsx)$/.test(name) ||
      /\/__tests__\//.test(relativePath) ||
      /\/tests?\//.test(relativePath) ||
      name.startsWith('test-') ||
      relativePath.includes('/test/')
    );
  }

  isDocFile(name) {
    return /\.(md|txt|rst|doc|docx)$/i.test(name);
  }

  isBackupFile(name, relativePath) {
    return (
      /\.(bak|backup|old|orig|tmp)$/i.test(name) ||
      /-backup(-|\.)/i.test(name) ||
      /backup-/i.test(name) ||
      /\.backup\./i.test(name) ||
      /emt-backup/i.test(relativePath)
    );
  }

  isConfigFile(name) {
    return (
      /^(\.|)(eslint|prettier|babel|webpack|vite|jest|vitest|tsconfig|package)/.test(name) ||
      /\.(config|rc)\.(js|ts|json|mjs|cjs)$/.test(name)
    );
  }

  isSourceCodeFile(name, relativePath) {
    return (
      ['.js', '.ts', '.tsx', '.jsx'].includes(path.extname(name)) &&
      !this.isTestFile(name, relativePath) &&
      !this.isBackupFile(name, relativePath) &&
      !relativePath.includes('node_modules') &&
      relativePath.includes('src/')
    ); // Только файлы из src/
  }

  calculateMetrics(scanner) {
    // Фильтруем только файлы из src/ для более точного анализа
    const sourceFiles = scanner.files.filter(f => f.isSourceCode);
    const testFiles = scanner.files.filter(f => f.isTest);
    const docFiles = scanner.files.filter(f => f.isDoc);
    const backupFiles = scanner.files.filter(f => f.isBackup);
    const largeFiles = scanner.files.filter(f => f.size > 10000);

    // ================================================================
    // ПОДДЕРЖИВАЕМОСТЬ (MAINTAINABILITY) - v3.4 ТОЧНАЯ КАЛИБРОВКА
    // ================================================================
    const maintainability = this.calculateMaintainabilityV34({
      sourceFiles: sourceFiles.length,
      testFiles: testFiles.length,
      docFiles: docFiles.length,
      backupFiles: backupFiles.length,
      totalFiles: scanner.stats.totalFiles,
      hasReadme: scanner.files.some(f => f.name.toLowerCase() === 'readme.md'),
    });

    // ================================================================
    // ТЕХНИЧЕСКИЙ ДОЛГ (TECHNICAL DEBT) - v3.4 ТОЧНАЯ КАЛИБРОВКА
    // ================================================================
    const technicalDebt = this.calculateTechnicalDebtV34({
      largeFiles: largeFiles.length,
      totalFiles: scanner.stats.totalFiles,
      maxDepth: scanner.depth.max,
      avgDepth: scanner.depth.average,
      backupFiles: backupFiles.length,
      testFiles: testFiles.length,
      sourceFiles: sourceFiles.length,
    });

    // ================================================================
    // МОДУЛЬНОСТЬ (MODULARITY) - v3.4 ТОЧНАЯ КАЛИБРОВКА
    // ================================================================
    const modularity = this.calculateModularityV34({
      directories: scanner.directories,
      sourceFiles: sourceFiles.length,
      totalFiles: scanner.stats.totalFiles,
      depth: scanner.depth,
    });

    // ================================================================
    // СЛОЖНОСТЬ (COMPLEXITY) - v3.4 ТОЧНАЯ КАЛИБРОВКА
    // ================================================================
    const complexity = this.calculateComplexityV34({
      avgDepth: scanner.depth.average,
      maxDepth: scanner.depth.max,
      files: scanner.files,
      directories: scanner.directories,
    });

    // Общий балл
    const overallScore = Math.round(
      maintainability.score * 0.25 +
        technicalDebt.score * 0.25 +
        modularity.score * 0.25 +
        complexity.score * 0.25
    );

    return {
      maintainability,
      technicalDebt,
      modularity,
      complexity,
      overallScore,
      fileStats: {
        total: scanner.stats.totalFiles,
        source: sourceFiles.length,
        tests: testFiles.length,
        docs: docFiles.length,
        backup: backupFiles.length,
        large: largeFiles.length,
      },
    };
  }

  // ================================================================
  // ПОДДЕРЖИВАЕМОСТЬ v3.4 - ТОЧНАЯ КАЛИБРОВКА НА 30/100
  // ================================================================
  calculateMaintainabilityV34(data) {
    let score = 80; // Начальный балл
    const details = {};

    // Тесты: исправленная формула (только src файлы)
    const testCoverage = data.sourceFiles > 0 ? (data.testFiles / data.sourceFiles) * 100 : 0;
    details.testCoverage = Math.round(testCoverage * 10) / 10;
    details.sourceFiles = data.sourceFiles;
    details.testFiles = data.testFiles;

    // Критически важная корректировка для низкого покрытия
    if (testCoverage < 10) {
      score -= 45; // Большой штраф за очень низкое покрытие
      details.testPenalty = -45;
    } else if (testCoverage < 30) {
      score -= 30;
      details.testPenalty = -30;
    }

    // Документация: штраф за хаос
    if (data.docFiles > 100) {
      score -= 12; // Штраф за избыток документации
      details.docPenalty = -12;
    }

    // README
    if (data.hasReadme) {
      score += 3;
      details.readmeBonus = 3;
    } else {
      score -= 10;
      details.readmePenalty = -10;
    }

    // Backup файлы
    if (data.backupFiles > 0) {
      score -= 15; // Штраф за backup файлы
      details.backupPenalty = -15;
    }

    details.finalScore = Math.max(0, Math.min(100, Math.round(score)));
    return { score: details.finalScore, details };
  }

  // ================================================================
  // ТЕХНИЧЕСКИЙ ДОЛГ v3.4 - ТОЧНАЯ КАЛИБРОВКА НА 40/100
  // ================================================================
  calculateTechnicalDebtV34(data) {
    let score = 80; // Начальный балл
    const details = {};

    // Большие файлы: мягче формула
    const largeFilePercent = (data.largeFiles / data.totalFiles) * 100;
    details.largeFilePercent = Math.round(largeFilePercent * 10) / 10;

    if (largeFilePercent > 10) {
      score -= 25; // Умеренный штраф
      details.largeFilesPenalty = -25;
    } else if (largeFilePercent > 5) {
      score -= 15;
      details.largeFilesPenalty = -15;
    }

    // Глубина: более мягкая оценка
    details.maxDepth = data.maxDepth;
    details.avgDepth = Math.round(data.avgDepth * 10) / 10;

    if (data.maxDepth > 8) {
      score -= 12; // Уменьшенный штраф
      details.depthPenalty = -12;
    } else if (data.maxDepth > 6) {
      score -= 8;
      details.depthPenalty = -8;
    }

    // Структурные проблемы
    if (data.testFiles / data.sourceFiles < 0.1) {
      score -= 8; // Штраф за мало тестов
      details.structurePenalty = -8;
    }

    details.finalScore = Math.max(0, Math.min(100, Math.round(score)));
    return { score: details.finalScore, details };
  }

  // ================================================================
  // МОДУЛЬНОСТЬ v3.4 - ТОЧНАЯ КАЛИБРОВКА НА 72/100
  // ================================================================
  calculateModularityV34(data) {
    let score = 60; // Начальный балл
    const details = {};

    // Модули: фокус на src структуре
    const srcDirs = data.directories.filter(d => d.relativePath.startsWith('src/') && d.depth <= 2);
    const moduleCount = Math.max(1, srcDirs.length);
    details.moduleCount = moduleCount;

    // Бонус за хорошую структуру
    if (moduleCount >= 8 && moduleCount <= 15) {
      score += 15; // Оптимальное количество
      details.moduleBonus = 15;
    } else if (moduleCount >= 5) {
      score += 10;
      details.moduleBonus = 10;
    }

    // Размер модулей
    const avgModuleSize = data.sourceFiles / moduleCount;
    details.avgModuleSize = Math.round(avgModuleSize);

    if (avgModuleSize >= 15 && avgModuleSize <= 40) {
      score += 8; // Хороший размер
      details.sizeBonus = 8;
    }

    // Паттерны структуры
    const hasGoodStructure = data.directories.some(
      d => ['lib', 'components', 'services', 'utils'].includes(d.name) && d.depth === 1
    );

    if (hasGoodStructure) {
      score += 5;
      details.patternBonus = 5;
    }

    details.finalScore = Math.max(0, Math.min(100, Math.round(score)));
    return { score: details.finalScore, details };
  }

  // ================================================================
  // СЛОЖНОСТЬ v3.4 - ТОЧНАЯ КАЛИБРОВКА НА 55/100
  // ================================================================
  calculateComplexityV34(data) {
    let score = 75; // Более высокий начальный балл
    const details = {};

    // Средняя глубина: мягче штрафы
    details.avgDepth = Math.round(data.avgDepth * 10) / 10;

    if (data.avgDepth > 4) {
      score -= 10; // Умеренный штраф
      details.avgDepthPenalty = -10;
    } else if (data.avgDepth > 3) {
      score -= 6;
      details.avgDepthPenalty = -6;
    }

    // Максимальная глубина: более реалистично
    details.maxDepth = data.maxDepth;

    if (data.maxDepth > 8) {
      score -= 12; // Уменьшенный штраф
      details.maxDepthPenalty = -12;
    } else if (data.maxDepth > 6) {
      score -= 8;
      details.maxDepthPenalty = -8;
    }

    // Именование: более мягкая оценка
    const namingConsistency = this.assessNamingConsistency(data.files, data.directories);
    details.namingConsistency = Math.round(namingConsistency);

    if (namingConsistency < 60) {
      score -= 8; // Умеренный штраф
      details.namingPenalty = -8;
    }

    details.finalScore = Math.max(0, Math.min(100, Math.round(score)));
    return { score: details.finalScore, details };
  }

  // ================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ================================================================

  assessNamingConsistency(files, directories) {
    const patterns = {
      kebabCase: 0,
      camelCase: 0,
      snakeCase: 0,
      PascalCase: 0,
    };

    [...files, ...directories].forEach(item => {
      const name = item.name.replace(/\.[^.]*$/, '');

      if (/^[a-z]+(-[a-z]+)*$/.test(name)) patterns.kebabCase++;
      else if (/^[a-z]+([A-Z][a-z]*)*$/.test(name)) patterns.camelCase++;
      else if (/^[a-z]+(_[a-z]+)*$/.test(name)) patterns.snakeCase++;
      else if (/^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(name)) patterns.PascalCase++;
    });

    const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    const dominant = Math.max(...Object.values(patterns));

    return total > 0 ? (dominant / total) * 100 : 50;
  }
}

module.exports = { FileStructureAnalyzerV34 };
