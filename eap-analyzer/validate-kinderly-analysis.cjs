/**
 * Валидатор анализа FileStructureAnalyzer v3.0
 * Проверяет адекватность результатов анализа проекта kinderly-events
 */

const path = require('path');
const fs = require('fs');

async function validateKinderlyAnalysis() {
  console.log('🔍 Валидация результатов анализа FileStructureAnalyzer v3.0...\n');

  try {
    const projectPath = 'C:\\kinderly-events';

    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Проект не найден: ${projectPath}`);
      return;
    }

    // === ЭТАП 1: ЗАГРУЖАЕМ РЕЗУЛЬТАТЫ АНАЛИЗА ===
    console.log('📊 ЭТАП 1: Загрузка результатов анализа...');
    const latestReport = getLatestAnalysisReport();
    if (!latestReport) {
      console.log('❌ Отчет анализа не найден');
      return;
    }

    console.log(`✅ Загружен отчет: ${latestReport.analyzer}`);
    console.log(`   Дата: ${latestReport.timestamp}`);
    console.log(`   Общий балл: ${latestReport.result.score}/100`);
    console.log(`   Файлов: ${latestReport.totalFiles}`);

    // === ЭТАП 2: РЕАЛЬНАЯ РЕВИЗИЯ ПРОЕКТА ===
    console.log('\n🔍 ЭТАП 2: Реальная ревизия проекта kinderly-events...');
    const realAudit = await performRealProjectAudit(projectPath);

    // === ЭТАП 3: СРАВНЕНИЕ РЕЗУЛЬТАТОВ ===
    console.log('\n⚖️  ЭТАП 3: Сравнение результатов анализа с реальностью...');
    const validation = compareAnalysisWithReality(latestReport, realAudit);

    // === ЭТАП 4: ОЦЕНКА АДЕКВАТНОСТИ ===
    console.log('\n📈 ЭТАП 4: Оценка адекватности анализа...');
    const adequacyScore = calculateAdequacyScore(validation);

    // === ВЫВОД РЕЗУЛЬТАТОВ ===
    console.log('\n🎯 РЕЗУЛЬТАТЫ ВАЛИДАЦИИ:');
    console.log('='.repeat(60));
    console.log(`📊 Адекватность анализа: ${adequacyScore.overall}/100`);
    console.log(`🎯 Точность метрик: ${adequacyScore.metrics}/100`);
    console.log(`🔍 Качество обнаружения: ${adequacyScore.detection}/100`);
    console.log(`💡 Релевантность рекомендаций: ${adequacyScore.recommendations}/100`);

    // Детальный анализ каждой метрики
    console.log('\n📋 ДЕТАЛЬНАЯ ВАЛИДАЦИЯ:');
    console.log('-'.repeat(50));

    validation.forEach((check, index) => {
      const statusIcon = check.accurate ? '✅' : '❌';
      console.log(`\n${index + 1}. ${statusIcon} ${check.metric}`);
      console.log(`   Анализатор: ${check.analyzed}`);
      console.log(`   Реальность: ${check.reality}`);
      console.log(`   Точность: ${check.accuracy}%`);
      if (check.issues.length > 0) {
        console.log(`   ⚠️  Проблемы:`);
        check.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }
    });

    // Рекомендации по улучшению анализатора
    console.log('\n🔧 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ АНАЛИЗАТОРА:');
    console.log('-'.repeat(50));
    const improvements = generateAnalyzerImprovements(validation, adequacyScore);
    improvements.forEach((improvement, index) => {
      console.log(`${index + 1}. ${improvement}`);
    });

    // Сохраняем отчет валидации
    const validationReport = {
      timestamp: new Date().toISOString(),
      projectPath,
      adequacyScore,
      validation,
      improvements,
      originalAnalysis: latestReport,
      realAudit,
    };

    const reportPath = path.join(__dirname, 'reports', `validation-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
    console.log(`\n💾 Отчет валидации сохранен: ${reportPath}`);

    return validationReport;
  } catch (error) {
    console.error('❌ Ошибка валидации:', error);
    throw error;
  }
}

function getLatestAnalysisReport() {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) return null;

  const reports = fs
    .readdirSync(reportsDir)
    .filter(file => file.includes('kinderly-v3-analysis'))
    .map(file => {
      const filePath = path.join(reportsDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { ...content, fileName: file };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return reports[0] || null;
}

async function performRealProjectAudit(projectPath) {
  console.log('   🔍 Сканирование реальной структуры...');

  const audit = {
    files: [],
    directories: new Set(),
    fileTypes: {},
    totalSize: 0,
    maxDepth: 0,
    patterns: {
      hasTests: false,
      hasSrc: false,
      hasDocs: false,
      hasConfig: false,
      hasReadme: false,
      hasPackageJson: false,
    },
    problems: {
      backupFiles: 0,
      duplicateFiles: 0,
      deepNesting: 0,
      largeFiles: 0,
      emptyDirs: 0,
    },
  };

  function scanDirectory(dir, relativePath = '', depth = 0) {
    if (depth > 15) return; // Ограничиваем глубину

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      let dirHasFiles = false;

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          audit.directories.add(relPath);
          scanDirectory(fullPath, relPath, depth + 1);
        } else if (entry.isFile()) {
          dirHasFiles = true;
          const stat = fs.statSync(fullPath);
          const ext = path.extname(entry.name);

          audit.files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            size: stat.size,
            extension: ext,
            depth: depth,
          });

          audit.totalSize += stat.size;
          audit.maxDepth = Math.max(audit.maxDepth, depth);
          audit.fileTypes[ext] = (audit.fileTypes[ext] || 0) + 1;

          // Проверяем паттерны
          checkPatterns(entry.name, relPath, audit.patterns);

          // Проверяем проблемы
          checkProblems(entry.name, relPath, stat.size, depth, audit.problems);
        }
      }

      // Проверяем пустые директории
      if (!dirHasFiles && entries.filter(e => e.isFile()).length === 0) {
        audit.problems.emptyDirs++;
      }
    } catch (error) {
      // Игнорируем ошибки доступа
    }
  }

  scanDirectory(projectPath);

  console.log(`   ✅ Отсканировано: ${audit.files.length} файлов, ${audit.directories.size} папок`);
  console.log(`   📊 Общий размер: ${Math.round(audit.totalSize / 1024 / 1024)} MB`);
  console.log(`   📈 Максимальная глубина: ${audit.maxDepth}`);

  return audit;
}

function checkPatterns(fileName, relativePath, patterns) {
  const lowerName = fileName.toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  if (lowerPath.includes('test') || lowerPath.includes('spec')) patterns.hasTests = true;
  if (lowerPath.includes('src')) patterns.hasSrc = true;
  if (lowerPath.includes('doc')) patterns.hasDocs = true;
  if (lowerName.includes('config') || lowerName.includes('setting')) patterns.hasConfig = true;
  if (lowerName.includes('readme')) patterns.hasReadme = true;
  if (lowerName === 'package.json') patterns.hasPackageJson = true;
}

function checkProblems(fileName, relativePath, size, depth, problems) {
  const lowerName = fileName.toLowerCase();

  // Backup файлы
  if (
    lowerName.includes('backup') ||
    lowerName.includes('.old') ||
    lowerName.includes('.bak') ||
    lowerName.includes('.orig')
  ) {
    problems.backupFiles++;
  }

  // Дублированные файлы
  if (
    lowerName.includes('copy') ||
    lowerName.includes(' — копия') ||
    lowerName.includes('(2)') ||
    lowerName.includes('_2')
  ) {
    problems.duplicateFiles++;
  }

  // Глубокая вложенность
  if (depth > 6) {
    problems.deepNesting++;
  }

  // Большие файлы (> 1MB)
  if (size > 1024 * 1024) {
    problems.largeFiles++;
  }
}

function compareAnalysisWithReality(analysis, reality) {
  const validation = [];

  // 1. Проверка количества файлов
  validation.push({
    metric: 'Количество файлов',
    analyzed: analysis.totalFiles,
    reality: reality.files.length,
    accuracy: calculateAccuracy(analysis.totalFiles, reality.files.length),
    accurate: Math.abs(analysis.totalFiles - reality.files.length) <= 10,
    issues:
      Math.abs(analysis.totalFiles - reality.files.length) > 10
        ? [`Расхождение: ${Math.abs(analysis.totalFiles - reality.files.length)} файлов`]
        : [],
  });

  // 2. Проверка архитектурных паттернов
  const analyzedPatterns = analysis.qualityMetrics.architecture.patterns_detected;
  const realPatterns = countRealPatterns(reality.patterns);
  validation.push({
    metric: 'Архитектурные паттерны',
    analyzed: analyzedPatterns,
    reality: realPatterns,
    accuracy: calculateAccuracy(analyzedPatterns, realPatterns),
    accurate: Math.abs(analyzedPatterns - realPatterns) <= 1,
    issues:
      Math.abs(analyzedPatterns - realPatterns) > 1
        ? [`Неточность обнаружения паттернов: ${analyzedPatterns} vs ${realPatterns}`]
        : [],
  });

  // 3. Проверка модульности
  const analyzedModules = analysis.qualityMetrics.modularity.module_count;
  const realModules = reality.directories.size;
  validation.push({
    metric: 'Количество модулей',
    analyzed: analyzedModules,
    reality: realModules,
    accuracy: calculateAccuracy(analyzedModules, realModules),
    accurate: Math.abs(analyzedModules - realModules) <= 20,
    issues:
      Math.abs(analyzedModules - realModules) > 20
        ? [`Значительное расхождение модулей: ${analyzedModules} vs ${realModules}`]
        : [],
  });

  // 4. Проверка технического долга
  const analyzedDebt = analysis.qualityMetrics.technicalDebt.priority_issues;
  const realDebt = reality.problems.backupFiles + reality.problems.duplicateFiles;
  validation.push({
    metric: 'Технический долг (проблемные файлы)',
    analyzed: analyzedDebt,
    reality: realDebt,
    accuracy: calculateAccuracy(analyzedDebt, realDebt),
    accurate: Math.abs(analyzedDebt - realDebt) <= 5,
    issues:
      Math.abs(analyzedDebt - realDebt) > 5
        ? [`Неточная оценка технического долга: ${analyzedDebt} vs ${realDebt}`]
        : [],
  });

  // 5. Проверка сложности (глубина вложенности)
  const analyzedDepth = analysis.qualityMetrics.complexity.nesting_depth;
  const realDepth = reality.maxDepth;
  validation.push({
    metric: 'Максимальная глубина вложенности',
    analyzed: analyzedDepth,
    reality: realDepth,
    accuracy: calculateAccuracy(analyzedDepth, realDepth),
    accurate: Math.abs(analyzedDepth - realDepth) <= 1,
    issues:
      Math.abs(analyzedDepth - realDepth) > 1
        ? [`Неточная оценка глубины: ${analyzedDepth} vs ${realDepth}`]
        : [],
  });

  return validation;
}

function countRealPatterns(patterns) {
  let count = 0;
  if (patterns.hasTests) count++;
  if (patterns.hasSrc) count++;
  if (patterns.hasDocs) count++;
  if (patterns.hasConfig) count++;
  return count;
}

function calculateAccuracy(analyzed, reality) {
  if (reality === 0) return analyzed === 0 ? 100 : 0;
  const diff = Math.abs(analyzed - reality);
  const relative = diff / reality;
  return Math.max(0, Math.round(100 - relative * 100));
}

function calculateAdequacyScore(validation) {
  const accuracies = validation.map(v => v.accuracy);
  const overall = Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length);

  const accurateCount = validation.filter(v => v.accurate).length;
  const detection = Math.round((accurateCount / validation.length) * 100);

  const metrics = Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length);

  const recommendations = overall > 80 ? 90 : overall > 60 ? 70 : 50;

  return {
    overall,
    metrics,
    detection,
    recommendations,
  };
}

function generateAnalyzerImprovements(validation, adequacyScore) {
  const improvements = [];

  if (adequacyScore.overall < 80) {
    improvements.push('Улучшить общую точность анализа - много расхождений с реальностью');
  }

  validation.forEach(check => {
    if (!check.accurate) {
      switch (check.metric) {
        case 'Количество файлов':
          improvements.push('Исправить алгоритм подсчета файлов в FileSystemScanner');
          break;
        case 'Архитектурные паттерны':
          improvements.push('Улучшить детекцию архитектурных паттернов в MetricsCalculator');
          break;
        case 'Количество модулей':
          improvements.push('Пересмотреть логику определения модулей - слишком много/мало');
          break;
        case 'Технический долг (проблемные файлы)':
          improvements.push('Настроить детекцию проблемных файлов (backup, дубли)');
          break;
        case 'Максимальная глубина вложенности':
          improvements.push('Проверить алгоритм расчета глубины вложенности');
          break;
      }
    }
  });

  if (adequacyScore.detection < 70) {
    improvements.push('Добавить больше проверок качества для повышения надежности');
  }

  if (improvements.length === 0) {
    improvements.push('Анализатор работает адекватно! Можно переходить к Фазе 2');
  }

  return improvements;
}

// Запуск валидации
if (require.main === module) {
  validateKinderlyAnalysis()
    .then(result => {
      console.log('\n🎉 Валидация завершена!');
      console.log(`📊 Общая адекватность: ${result.adequacyScore.overall}/100`);

      if (result.adequacyScore.overall >= 80) {
        console.log('✅ Анализатор работает адекватно!');
      } else if (result.adequacyScore.overall >= 60) {
        console.log('⚠️  Анализатор требует доработки');
      } else {
        console.log('❌ Анализатор требует серьезных исправлений');
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Валидация провалена:', error.message);
      process.exit(1);
    });
}

module.exports = { validateKinderlyAnalysis };
