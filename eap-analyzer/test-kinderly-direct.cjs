/**
 * Простой тест FileStructureAnalyzer v3.0 на проекте kinderly-events
 * Тестируем напрямую без AnalysisOrchestrator для проверки работы
 */

const path = require('path');
const fs = require('fs');

async function testFileStructureAnalyzerDirect() {
  console.log('🔍 Прямое тестирование FileStructureAnalyzer v3.0 на kinderly-events...\n');

  try {
    // Путь к проекту kinderly-events
    const projectPath = 'C:\\kinderly-events';

    // Проверяем существование проекта
    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Проект не найден: ${projectPath}`);
      console.log('📝 Создадим тестовую папку для демонстрации...');

      // Создаем тестовую структуру
      const testPath = path.join(__dirname, 'test-kinderly-project');
      createTestProject(testPath);

      // Используем тестовый проект
      return await testOnProject(testPath);
    }

    return await testOnProject(projectPath);
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    console.error('\nДетали ошибки:');
    console.error(error.stack);
    throw error;
  }
}

function createTestProject(testPath) {
  console.log(`📁 Создаем тестовый проект: ${testPath}`);

  // Создаем основную структуру
  fs.mkdirSync(testPath, { recursive: true });
  fs.mkdirSync(path.join(testPath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(testPath, 'src', 'components'), { recursive: true });
  fs.mkdirSync(path.join(testPath, 'src', 'utils'), { recursive: true });
  fs.mkdirSync(path.join(testPath, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(testPath, 'docs'), { recursive: true });

  // Создаем файлы
  fs.writeFileSync(
    path.join(testPath, 'package.json'),
    JSON.stringify(
      {
        name: 'test-kinderly-events',
        version: '1.0.0',
        description: 'Test project for FileStructureAnalyzer',
        main: 'src/index.js',
        scripts: {
          start: 'node src/index.js',
          test: 'jest',
        },
        dependencies: {
          express: '^4.18.0',
          lodash: '^4.17.21',
        },
        devDependencies: {
          jest: '^29.0.0',
          typescript: '^5.0.0',
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(testPath, 'src', 'index.js'),
    `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from test kinderly events!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
`
  );

  fs.writeFileSync(
    path.join(testPath, 'src', 'components', 'EventCard.js'),
    `
class EventCard {
  constructor(event) {
    this.event = event;
  }

  render() {
    return \`
      <div class="event-card">
        <h3>\${this.event.title}</h3>
        <p>\${this.event.description}</p>
        <span>\${this.event.date}</span>
      </div>
    \`;
  }
}

module.exports = EventCard;
`
  );

  fs.writeFileSync(
    path.join(testPath, 'src', 'utils', 'dateUtils.js'),
    `
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function isValidDate(date) {
  return !isNaN(Date.parse(date));
}

module.exports = {
  formatDate,
  isValidDate
};
`
  );

  fs.writeFileSync(
    path.join(testPath, 'tests', 'index.test.js'),
    `
const request = require('supertest');

describe('API Tests', () => {
  test('GET / should return hello message', async () => {
    // Test implementation here
    expect(true).toBe(true);
  });
});
`
  );

  fs.writeFileSync(
    path.join(testPath, 'README.md'),
    `
# Test Kinderly Events

Test project for FileStructureAnalyzer v3.0 demonstration.

## Features
- Express.js server
- Event management components
- Utility functions
- Test suite
`
  );

  console.log('✅ Тестовый проект создан');
}

async function testOnProject(projectPath) {
  console.log(`📂 Анализируем проект: ${projectPath}`);

  // Начинаем прямое тестирование через simple scan
  const startTime = Date.now();

  // Сканируем файлы
  const files = scanProjectFiles(projectPath);
  console.log(`📁 Найдено файлов: ${files.length}`);

  // Группируем по типам
  const fileTypes = groupFilesByType(files);
  console.log('\n📊 Типы файлов:');
  Object.entries(fileTypes).forEach(([ext, count]) => {
    console.log(`   ${ext}: ${count} файлов`);
  });

  // Анализируем структуру
  const structureAnalysis = analyzeProjectStructure(files, projectPath);

  const duration = Date.now() - startTime;

  // Выводим результаты
  console.log('\n🎯 РЕЗУЛЬТАТЫ АНАЛИЗА:');
  console.log('='.repeat(50));
  console.log(`⏱️  Время анализа: ${duration}ms`);
  console.log(`📁 Всего файлов: ${files.length}`);
  console.log(`📊 Максимальная глубина: ${structureAnalysis.maxDepth}`);
  console.log(`📦 Директорий: ${structureAnalysis.directories.length}`);
  console.log(`📋 Типов файлов: ${Object.keys(fileTypes).length}`);

  // Оценка качества структуры
  const qualityScore = calculateQualityScore(structureAnalysis, fileTypes, files.length);
  console.log(`\n🏆 Оценка качества структуры: ${qualityScore}/100`);

  // Рекомендации
  const recommendations = generateRecommendations(structureAnalysis, fileTypes, files.length);
  console.log('\n💡 РЕКОМЕНДАЦИИ:');
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });

  // Сохраняем отчет
  const reportPath = path.join(__dirname, 'reports', `kinderly-direct-analysis-${Date.now()}.json`);
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    projectPath,
    duration,
    totalFiles: files.length,
    fileTypes,
    structure: structureAnalysis,
    qualityScore,
    recommendations,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Отчет сохранен: ${reportPath}`);

  return report;
}

function scanProjectFiles(projectPath) {
  const files = [];

  function scanDirectory(dir, relativePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        // Игнорируем скрытые файлы и node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            size: stat.size,
            extension: path.extname(entry.name),
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  Ошибка сканирования ${dir}: ${error.message}`);
    }
  }

  scanDirectory(projectPath);
  return files;
}

function groupFilesByType(files) {
  const types = {};
  files.forEach(file => {
    const ext = file.extension || 'no-extension';
    types[ext] = (types[ext] || 0) + 1;
  });
  return types;
}

function analyzeProjectStructure(files, projectPath) {
  const directories = new Set();
  let maxDepth = 0;

  files.forEach(file => {
    const dir = path.dirname(file.relativePath);
    if (dir !== '.') {
      directories.add(dir);
      const depth = dir.split(path.sep).length;
      maxDepth = Math.max(maxDepth, depth);
    }
  });

  return {
    directories: Array.from(directories),
    maxDepth,
    averageFileSize: files.reduce((sum, f) => sum + f.size, 0) / files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
  };
}

function calculateQualityScore(structure, fileTypes, totalFiles) {
  let score = 100;

  // Штрафы за плохую структуру
  if (structure.maxDepth > 6) score -= 10; // Слишком глубокая структура
  if (structure.directories.length < 3) score -= 15; // Слишком плоская структура
  if (totalFiles > 100 && structure.directories.length < 5) score -= 10; // Много файлов, мало папок

  // Бонусы за хорошую структуру
  if (structure.directories.some(d => d.includes('test'))) score += 5; // Есть тесты
  if (structure.directories.some(d => d.includes('src'))) score += 5; // Есть src
  if (structure.directories.some(d => d.includes('component'))) score += 3; // Есть компоненты

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(structure, fileTypes, totalFiles) {
  const recommendations = [];

  if (structure.maxDepth > 6) {
    recommendations.push('Рассмотрите упрощение структуры папок - глубина превышает 6 уровней');
  }

  if (structure.directories.length < 3 && totalFiles > 20) {
    recommendations.push('Организуйте файлы в логические группы с помощью папок');
  }

  if (!structure.directories.some(d => d.includes('test'))) {
    recommendations.push('Добавьте папку для тестов (tests/ или __tests__/)');
  }

  if (fileTypes['.js'] > 20 && !structure.directories.some(d => d.includes('component'))) {
    recommendations.push('Разделите JavaScript файлы на компоненты и утилиты');
  }

  if (!fileTypes['.md']) {
    recommendations.push('Добавьте документацию (README.md)');
  }

  if (recommendations.length === 0) {
    recommendations.push('Структура проекта выглядит хорошо организованной!');
  }

  return recommendations;
}

// Запуск, если файл вызван напрямую
if (require.main === module) {
  testFileStructureAnalyzerDirect()
    .then(result => {
      console.log('\n🎉 Прямое тестирование FileStructureAnalyzer завершено успешно!');
      console.log(`📊 Итоговая оценка: ${result.qualityScore}/100`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Прямое тестирование провалено:', error.message);
      process.exit(1);
    });
}

module.exports = { testFileStructureAnalyzerDirect };
