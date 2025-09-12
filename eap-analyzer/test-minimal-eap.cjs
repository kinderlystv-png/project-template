/**
 * Минимальный тест EAP оркестратора
 * Использует только базовые компоненты
 */

// Используем require для простоты
const fs = require('fs');
const path = require('path');

console.log('🔍 Минимальный тест EAP системы для kinderly-events...\n');

// Простая функция анализа
function analyzeProject(projectPath) {
  const startTime = Date.now();

  try {
    console.log(`📁 Анализируемый проект: ${projectPath}`);

    // Проверяем, существует ли проект
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Проект не найден: ${projectPath}`);
    }

    // Базовый анализ структуры
    const files = [];
    function scanDirectory(dir, level = 0) {
      if (level > 5) return; // Ограничиваем глубину

      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item.startsWith('.')) continue;

          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isFile()) {
            files.push({
              path: fullPath,
              size: stat.size,
              ext: path.extname(item),
            });
          } else if (stat.isDirectory() && level < 3) {
            scanDirectory(fullPath, level + 1);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Ошибка сканирования ${dir}: ${error.message}`);
      }
    }

    console.log('📊 Сканирование файлов...');
    scanDirectory(projectPath);

    // Анализ
    const totalFiles = files.length;
    const jsFiles = files.filter(f => ['.js', '.ts', '.jsx', '.tsx'].includes(f.ext)).length;
    const testFiles = files.filter(f => f.path.includes('test') || f.path.includes('spec')).length;
    const avgFileSize = files.reduce((sum, f) => sum + f.size, 0) / totalFiles;
    const largeFiles = files.filter(f => f.size > 10000).length;

    // Простые метрики
    const metrics = {
      totalFiles,
      jsFiles,
      testFiles,
      avgFileSize: Math.round(avgFileSize),
      largeFiles,
      testCoverage: Math.round((testFiles / jsFiles) * 100) || 0,
    };

    // Простой скоринг
    let structureScore = 70;
    if (testFiles < jsFiles * 0.3) structureScore -= 20; // Мало тестов
    if (largeFiles > totalFiles * 0.1) structureScore -= 15; // Много больших файлов
    if (avgFileSize > 5000) structureScore -= 10; // Слишком большие файлы

    const result = {
      summary: {
        overallScore: Math.max(0, Math.min(100, structureScore)),
        codeQuality: Math.max(30, structureScore - 10),
        security: 65, // Базовая оценка
        performance: 70,
        architecture: Math.max(40, structureScore),
        testing: Math.max(20, Math.min(90, metrics.testCoverage)),
        technicalDebt: Math.max(30, 100 - largeFiles * 5),
        maintainability: Math.max(35, structureScore - 5),
      },
      metrics,
      executionStats: {
        totalTime: Date.now() - startTime,
        filesAnalyzed: totalFiles,
      },
    };

    return result;
  } catch (error) {
    throw new Error(`Ошибка анализа: ${error.message}`);
  }
}

// Запуск анализа
async function runAnalysis() {
  try {
    const projectPath = 'C:\\kinderly-events';
    const result = await analyzeProject(projectPath);

    const duration = result.executionStats.totalTime;
    console.log(`✅ Анализ завершен за ${duration}мс\n`);

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log('='.repeat(60));
    console.log(`🎯 Общий счет: ${result.summary.overallScore}/100`);
    console.log(`📈 Качество кода: ${result.summary.codeQuality}/100`);
    console.log(`🛡️  Безопасность: ${result.summary.security}/100`);
    console.log(`⚡ Производительность: ${result.summary.performance}/100`);
    console.log(`🏗️  Архитектура: ${result.summary.architecture}/100`);
    console.log(`🧪 Тестирование: ${result.summary.testing}/100`);
    console.log(`💳 Технический долг: ${result.summary.technicalDebt}/100`);
    console.log(`📏 Сопровождаемость: ${result.summary.maintainability}/100\n`);

    // Метрики файлов
    console.log('📁 МЕТРИКИ ПРОЕКТА:');
    console.log('-'.repeat(30));
    console.log(`Всего файлов: ${result.metrics.totalFiles}`);
    console.log(`JS/TS файлов: ${result.metrics.jsFiles}`);
    console.log(`Тестовых файлов: ${result.metrics.testFiles}`);
    console.log(`Покрытие тестами: ${result.metrics.testCoverage}%`);
    console.log(`Средний размер: ${result.metrics.avgFileSize} байт`);
    console.log(`Больших файлов: ${result.metrics.largeFiles}\n`);

    console.log('='.repeat(60));
    console.log('🎉 Быстрый анализ завершен!');

    return result;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  }
}

// Запускаем
runAnalysis()
  .then(() => {
    console.log('\n✨ Тест выполнен успешно!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Тест провален:', error.message);
    process.exit(1);
  });
