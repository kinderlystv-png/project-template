/**
 * Детальная проверка структуры kinderly-events
 * Анализирует конкретные характеристики проекта
 */

const path = require('path');
const fs = require('fs');

async function analyzeKinderlyProjectStructure() {
  console.log('🔍 Детальный анализ проекта kinderly-events...\n');

  try {
    const projectPath = 'C:\\kinderly-events';

    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Проект не найден: ${projectPath}`);
      return;
    }

    // === СТРУКТУРНЫЙ АНАЛИЗ ===
    console.log('📁 СТРУКТУРНЫЙ АНАЛИЗ:');
    console.log('='.repeat(50));

    const structure = await analyzeProjectStructure(projectPath);

    // Выводим основные характеристики
    console.log(`📊 Общие характеристики:`);
    console.log(`   • Файлов: ${structure.totalFiles}`);
    console.log(`   • Директорий: ${structure.totalDirs}`);
    console.log(`   • Размер: ${Math.round(structure.totalSize / 1024 / 1024)} MB`);
    console.log(`   • Макс. глубина: ${structure.maxDepth} уровней`);

    // Топ типов файлов
    console.log(`\n📋 Топ типов файлов:`);
    const sortedTypes = Object.entries(structure.fileTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    sortedTypes.forEach(([ext, count]) => {
      const percent = Math.round((count / structure.totalFiles) * 100);
      console.log(`   • ${ext || '(без расширения)'}: ${count} файлов (${percent}%)`);
    });

    // Архитектурные паттерны
    console.log(`\n🏗️  Архитектурные паттерны:`);
    console.log(`   • Есть src/: ${structure.patterns.hasSrc ? '✅' : '❌'}`);
    console.log(`   • Есть tests/: ${structure.patterns.hasTests ? '✅' : '❌'}`);
    console.log(`   • Есть docs/: ${structure.patterns.hasDocs ? '✅' : '❌'}`);
    console.log(`   • package.json: ${structure.patterns.hasPackageJson ? '✅' : '❌'}`);
    console.log(`   • README: ${structure.patterns.hasReadme ? '✅' : '❌'}`);
    console.log(`   • Конфигурация: ${structure.patterns.hasConfig ? '✅' : '❌'}`);

    // Проблемные файлы
    console.log(`\n⚠️  Обнаруженные проблемы:`);
    console.log(`   • Backup файлы: ${structure.problems.backupFiles}`);
    console.log(`   • Дублированные файлы: ${structure.problems.duplicateFiles}`);
    console.log(`   • Файлы в глубокой вложенности (>6): ${structure.problems.deepNesting}`);
    console.log(`   • Большие файлы (>1MB): ${structure.problems.largeFiles}`);
    console.log(`   • Пустые директории: ${structure.problems.emptyDirs}`);

    // Структура директорий верхнего уровня
    console.log(`\n📂 Структура верхнего уровня:`);
    const topLevel = await getTopLevelStructure(projectPath);
    topLevel.forEach(item => {
      const icon = item.isDir ? '📁' : '📄';
      const size = item.isDir ? `(${item.childCount} элементов)` : `(${Math.round(item.size / 1024)} KB)`;
      console.log(`   ${icon} ${item.name} ${size}`);
    });

    // === МОДУЛЬНЫЙ АНАЛИЗ ===
    console.log(`\n🧩 МОДУЛЬНЫЙ АНАЛИЗ:`);
    console.log('='.repeat(50));

    const modules = analyzeModules(structure);
    console.log(`📊 Обнаружено модулей: ${modules.length}`);
    console.log(`📈 Средний размер модуля: ${Math.round(modules.reduce((sum, m) => sum + m.fileCount, 0) / modules.length)} файлов`);

    // Топ модулей по размеру
    console.log(`\n📋 Крупнейшие модули:`);
    modules
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 10)
      .forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.path} (${module.fileCount} файлов)`);
      });

    // === КАЧЕСТВЕННАЯ ОЦЕНКА ===
    console.log(`\n⭐ КАЧЕСТВЕННАЯ ОЦЕНКА:`);
    console.log('='.repeat(50));

    const quality = calculateProjectQuality(structure, modules);
    console.log(`🎯 Общая оценка: ${quality.overall}/100`);
    console.log(`📐 Архитектура: ${quality.architecture}/100`);
    console.log(`🧩 Модульность: ${quality.modularity}/100`);
    console.log(`🔧 Поддерживаемость: ${quality.maintainability}/100`);
    console.log(`📊 Сложность: ${quality.complexity}/100`);
    console.log(`⚠️  Технический долг: ${quality.technicalDebt}/100`);

    // Сохраняем отчет
    const report = {
      timestamp: new Date().toISOString(),
      projectPath,
      structure,
      modules,
      quality,
      summary: {
        isWellStructured: quality.overall >= 80,
        hasGoodArchitecture: quality.architecture >= 80,
        needsRefactoring: quality.technicalDebt < 70,
        complexityLevel: quality.complexity >= 80 ? 'low' : quality.complexity >= 60 ? 'medium' : 'high'
      }
    };

    const reportPath = path.join(__dirname, 'reports', `kinderly-structure-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Отчет сохранен: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Ошибка анализа:', error);
    throw error;
  }
}

async function analyzeProjectStructure(projectPath) {
  const structure = {
    totalFiles: 0,
    totalDirs: 0,
    totalSize: 0,
    maxDepth: 0,
    fileTypes: {},
    files: [],
    directories: [],
    patterns: {
      hasSrc: false,
      hasTests: false,
      hasDocs: false,
      hasConfig: false,
      hasReadme: false,
      hasPackageJson: false
    },
    problems: {
      backupFiles: 0,
      duplicateFiles: 0,
      deepNesting: 0,
      largeFiles: 0,
      emptyDirs: 0
    }
  };

  function scanDirectory(dir, relativePath = '', depth = 0) {
    if (depth > 15) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let dirHasFiles = false;

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          structure.totalDirs++;
          structure.directories.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            depth: depth
          });
          scanDirectory(fullPath, relPath, depth + 1);
        } else if (entry.isFile()) {
          dirHasFiles = true;
          const stat = fs.statSync(fullPath);
          const ext = path.extname(entry.name);

          structure.totalFiles++;
          structure.totalSize += stat.size;
          structure.maxDepth = Math.max(structure.maxDepth, depth);
          structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;

          structure.files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            size: stat.size,
            extension: ext,
            depth: depth
          });

          // Проверяем паттерны и проблемы
          checkPatterns(entry.name, relPath, structure.patterns);
          checkProblems(entry.name, relPath, stat.size, depth, structure.problems);
        }
      }

      if (!dirHasFiles && entries.filter(e => e.isFile()).length === 0) {
        structure.problems.emptyDirs++;
      }

    } catch (error) {
      // Игнорируем ошибки доступа
    }
  }

  scanDirectory(projectPath);
  return structure;
}

async function getTopLevelStructure(projectPath) {
  const items = [];

  try {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(projectPath, entry.name);
      const stat = fs.statSync(fullPath);

      if (entry.isDirectory()) {
        const childCount = fs.readdirSync(fullPath).length;
        items.push({
          name: entry.name,
          isDir: true,
          childCount,
          size: 0
        });
      } else {
        items.push({
          name: entry.name,
          isDir: false,
          childCount: 0,
          size: stat.size
        });
      }
    }
  } catch (error) {
    console.log('Ошибка чтения верхнего уровня:', error.message);
  }

  return items.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });
}

function analyzeModules(structure) {
  const modules = [];
  const dirMap = new Map();

  // Группируем файлы по директориям
  structure.files.forEach(file => {
    const dir = path.dirname(file.relativePath) || '/';
    if (!dirMap.has(dir)) {
      dirMap.set(dir, {
        path: dir,
        files: [],
        fileCount: 0,
        totalSize: 0
      });
    }

    const module = dirMap.get(dir);
    module.files.push(file);
    module.fileCount++;
    module.totalSize += file.size;
  });

  // Считаем только директории с файлами
  dirMap.forEach(module => {
    if (module.fileCount > 0) {
      modules.push(module);
    }
  });

  return modules;
}

function calculateProjectQuality(structure, modules) {
  // Архитектура (наличие стандартных паттернов)
  let architecture = 60; // базовый балл
  if (structure.patterns.hasSrc) architecture += 10;
  if (structure.patterns.hasTests) architecture += 10;
  if (structure.patterns.hasDocs) architecture += 5;
  if (structure.patterns.hasPackageJson) architecture += 10;
  if (structure.patterns.hasReadme) architecture += 5;

  // Модульность (качество разбиения)
  let modularity = 70; // базовый балл
  const avgModuleSize = modules.reduce((sum, m) => sum + m.fileCount, 0) / modules.length;
  if (avgModuleSize <= 10) modularity += 20; // хорошо структурированные модули
  else if (avgModuleSize <= 20) modularity += 10;
  else modularity -= 10; // слишком крупные модули

  // Поддерживаемость (отсутствие проблем)
  let maintainability = 100;
  maintainability -= structure.problems.backupFiles * 2;
  maintainability -= structure.problems.duplicateFiles * 3;
  maintainability -= Math.min(structure.problems.emptyDirs * 1, 10);

  // Сложность (глубина вложенности)
  let complexity = 100;
  if (structure.maxDepth > 8) complexity -= 20;
  else if (structure.maxDepth > 6) complexity -= 10;
  complexity -= Math.min(structure.problems.deepNesting * 1, 20);

  // Технический долг
  let technicalDebt = 100;
  const totalProblems = structure.problems.backupFiles +
                       structure.problems.duplicateFiles +
                       structure.problems.largeFiles;
  technicalDebt -= totalProblems * 3;

  // Общая оценка
  const overall = Math.round((architecture + modularity + maintainability + complexity + technicalDebt) / 5);

  return {
    overall: Math.max(0, Math.min(100, overall)),
    architecture: Math.max(0, Math.min(100, architecture)),
    modularity: Math.max(0, Math.min(100, modularity)),
    maintainability: Math.max(0, Math.min(100, maintainability)),
    complexity: Math.max(0, Math.min(100, complexity)),
    technicalDebt: Math.max(0, Math.min(100, technicalDebt))
  };
}

function checkPatterns(fileName, relativePath, patterns) {
  const lowerName = fileName.toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  if (lowerPath.includes('src') || lowerPath.includes('source')) patterns.hasSrc = true;
  if (lowerPath.includes('test') || lowerPath.includes('spec') || lowerPath.includes('__test__')) patterns.hasTests = true;
  if (lowerPath.includes('doc') || lowerPath.includes('documentation')) patterns.hasDocs = true;
  if (lowerName.includes('config') || lowerName.includes('setting') || lowerName.endsWith('.config.js')) patterns.hasConfig = true;
  if (lowerName.includes('readme')) patterns.hasReadme = true;
  if (lowerName === 'package.json') patterns.hasPackageJson = true;
}

function checkProblems(fileName, relativePath, size, depth, problems) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes('backup') || lowerName.includes('.old') ||
      lowerName.includes('.bak') || lowerName.includes('.orig')) {
    problems.backupFiles++;
  }

  if (lowerName.includes('copy') || lowerName.includes(' — копия') ||
      lowerName.includes('(2)') || lowerName.includes('_2') ||
      lowerName.includes('duplicate')) {
    problems.duplicateFiles++;
  }

  if (depth > 6) {
    problems.deepNesting++;
  }

  if (size > 1024 * 1024) {
    problems.largeFiles++;
  }
}

// Запуск анализа
if (require.main === module) {
  analyzeKinderlyProjectStructure()
    .then(result => {
      console.log('\n🎉 Анализ завершен!');
      console.log(`📊 Оценка проекта: ${result.quality.overall}/100`);

      if (result.summary.isWellStructured) {
        console.log('✅ Проект хорошо структурирован!');
      } else {
        console.log('⚠️  Проект требует улучшения структуры');
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Анализ провален:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzeKinderlyProjectStructure };
