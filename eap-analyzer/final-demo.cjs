#!/usr/bin/env node

/**
 * Упрощенная демонстрация финальной системы - запуск через dist-cjs
 */

const fs = require('fs');
const path = require('path');

async function runSimplifiedDemo() {
  console.log('🚀 === ФИНАЛЬНАЯ ДЕМОНСТРАЦИЯ EAP ANALYZER v3.0 ===');
  console.log('🏗️  Тестируем архитектуру через скомпилированные файлы');
  console.log('');

  try {
    // Проверяем наличие dist-cjs
    const distPath = path.join(__dirname, 'dist-cjs');
    if (!fs.existsSync(distPath)) {
      console.log('❌ dist-cjs не найден. Запускаем сборку...');

      // Простой анализ без полной архитектуры
      const projectPath = process.cwd();
      const simpleResults = await performSimpleAnalysis(projectPath);

      console.log('📊 Результаты упрощенного анализа:');
      console.log(`  📁 Файлов найдено: ${simpleResults.totalFiles}`);
      console.log(`  🔍 Проанализировано: ${simpleResults.analyzedFiles}`);
      console.log(`  📄 Строк кода: ${simpleResults.totalLines}`);
      console.log(`  💰 Технический долг: ${simpleResults.debt} часов`);
      console.log(`  🎯 Оценка качества: ${simpleResults.quality}/100`);

      // Сохраняем результаты
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportPath = path.join(reportsDir, 'simplified-demo-report.json');
      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            version: '3.0.0-simplified',
            results: simpleResults,
            status: 'Демонстрация архитектуры выполнена',
          },
          null,
          2
        )
      );

      console.log(`📄 Отчет сохранен: ${reportPath}`);
      console.log('');
      console.log('✅ Упрощенная демонстрация завершена!');
      console.log('💡 Для полной функциональности необходимо исправить TypeScript ошибки.');

      return;
    }

    // Если dist-cjs существует, попытаемся загрузить модули
    console.log('📦 Загружаем скомпилированные модули...');

    try {
      // Попытка импорта основных компонентов
      const orchestratorPath = path.join(distPath, 'core', 'orchestrator.js');
      if (fs.existsSync(orchestratorPath)) {
        console.log('✅ Orchestrator найден');
      }

      const indexPath = path.join(distPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        console.log('✅ Index найден');

        // Попытка импорта
        const { createEAPAnalyzer } = require(indexPath);
        console.log('✅ createEAPAnalyzer загружен');

        // Создание анализатора
        const analyzer = createEAPAnalyzer();
        console.log('✅ Анализатор создан');

        // Тестовый анализ
        const projectPath = process.cwd();
        console.log(`📁 Запуск анализа: ${projectPath}`);

        const results = await analyzer.runFullAnalysis(projectPath);
        console.log('✅ Анализ выполнен');

        // Показываем результаты
        console.log('📊 Результаты полного анализа:');
        if (results.checks) {
          console.log(`  🔍 Чекеров выполнено: ${Object.keys(results.checks).length}`);
        }
        if (results.modules) {
          console.log(`  🧩 Модулей выполнено: ${Object.keys(results.modules).length}`);
        }

        // Генерация отчета
        const report = await analyzer.generateReport(results);
        console.log('✅ Отчет сгенерирован');

        // Сохранение
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, 'final-system-test.json');
        fs.writeFileSync(
          reportPath,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              version: '3.0.0',
              results,
              report,
              status: 'Полная архитектура работает!',
            },
            null,
            2
          )
        );

        console.log(`📄 Полный отчет: ${reportPath}`);
        console.log('');
        console.log('🎉 === ФИНАЛЬНАЯ СИСТЕМА РАБОТАЕТ! ===');
      } else {
        throw new Error('index.js не найден в dist-cjs');
      }
    } catch (importError) {
      console.log(`⚠️ Ошибка импорта: ${importError.message}`);
      console.log('🔄 Переходим к упрощенному анализу...');

      const simpleResults = await performSimpleAnalysis(process.cwd());
      console.log('📊 Упрощенный анализ выполнен');
      console.log(`  📊 Результат: ${JSON.stringify(simpleResults, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ Ошибка демонстрации:', error);

    // Fallback к базовому анализу
    console.log('🔄 Fallback к базовому анализу...');
    const basicResults = {
      status: 'fallback',
      timestamp: new Date().toISOString(),
      message: 'Система требует доработки, но компоненты созданы',
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportsDir, 'demo-fallback.json'),
      JSON.stringify(basicResults, null, 2)
    );

    console.log('📄 Fallback отчет сохранен');
  }
}

async function performSimpleAnalysis(projectPath) {
  const extensions = ['.ts', '.js', '.tsx', '.jsx'];
  let totalFiles = 0;
  let analyzedFiles = 0;
  let totalLines = 0;
  let complexity = 0;

  const scanDir = async dir => {
    try {
      const items = await fs.promises.readdir(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;

        const fullPath = path.join(dir, item);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isDirectory()) {
          await scanDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          totalFiles++;
          try {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            totalLines += lines;
            analyzedFiles++;

            // Простая оценка сложности
            const complexityMarkers = (content.match(/if|for|while|switch|catch/g) || []).length;
            complexity += complexityMarkers;
          } catch (e) {
            // Игнорируем ошибки чтения файлов
          }
        }
      }
    } catch (e) {
      // Игнорируем ошибки доступа
    }
  };

  await scanDir(projectPath);

  // Расчет метрик
  const avgComplexity = analyzedFiles > 0 ? complexity / analyzedFiles : 0;
  const debt = Math.round(complexity * 0.5 + totalLines * 0.01); // Упрощенная формула
  const quality = Math.max(0, 100 - avgComplexity - (debt / totalLines) * 100);

  return {
    totalFiles,
    analyzedFiles,
    totalLines,
    complexity,
    avgComplexity: Math.round(avgComplexity * 10) / 10,
    debt,
    quality: Math.round(quality),
  };
}

// Запуск демонстрации
runSimplifiedDemo().catch(console.error);
