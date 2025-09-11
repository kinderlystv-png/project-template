#!/usr/bin/env node

/**
 * EAP Analyzer Live Report Generator
 * Анализирует реальные файлы проекта и генерирует актуальные отчеты
 * Использование: node live-generator.cjs
 */

const fs = require('fs');
const path = require('path');

// Функция для анализа файлов проекта
function analyzeProjectFiles(projectPath = '../eap-analyzer') {
  const components = {};
  const categories = {
    'testing': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'security': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'performance': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'docker': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'dependencies': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'logging': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'cicd': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'codequality': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'core': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'ai': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'architecture': { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    'utils': { totalLogic: 0, totalFunc: 0, count: 0, components: [] }
  };
  
  console.log(`🔍 Анализ файлов в: ${path.resolve(projectPath)}`);
  
  // Проверяем существование директории
  if (!fs.existsSync(projectPath)) {
    console.log(`⚠️  Директория ${projectPath} не найдена, создаем тестовые данные...`);
    return generateTestData();
  }
  
  // Обход файлов и анализ
  function traverseDirectory(dir, relativePath = '') {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativeFilePath = path.join(relativePath, file);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Пропускаем node_modules и другие служебные папки
            if (!['node_modules', '.git', 'dist', 'coverage', '.nyc_output'].includes(file)) {
              traverseDirectory(fullPath, relativeFilePath);
            }
          } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const componentData = analyzeFile(file, relativeFilePath, content, stat);
            
            if (componentData) {
              const key = componentData.name.replace(/[^a-zA-Z0-9]/g, '');
              components[key] = componentData;
              
              // Добавляем статистику в категорию
              const cat = categories[componentData.category];
              if (cat) {
                cat.totalLogic += componentData.logic;
                cat.totalFunc += componentData.functionality;
                cat.count++;
                cat.components.push(componentData);
              }
            }
          }
        } catch (fileError) {
          console.log(`⚠️  Ошибка при обработке ${fullPath}: ${fileError.message}`);
        }
      }
    } catch (dirError) {
      console.log(`⚠️  Ошибка при чтении директории ${dir}: ${dirError.message}`);
    }
  }
  
  // Анализ одного файла
  function analyzeFile(filename, filepath, content, stat) {
    try {
      // Определяем категорию по пути файла и содержимому
      let category = 'utils'; // По умолчанию
      const lowerPath = filepath.toLowerCase();
      const lowerContent = content.toLowerCase();
      
      if (lowerPath.includes('test') || lowerPath.includes('spec') || filename.includes('.test.') || filename.includes('.spec.')) {
        category = 'testing';
      } else if (lowerPath.includes('security') || lowerContent.includes('security') || lowerContent.includes('vulnerability')) {
        category = 'security';
      } else if (lowerPath.includes('performance') || lowerPath.includes('perf') || lowerContent.includes('performance')) {
        category = 'performance';
      } else if (lowerPath.includes('docker') || lowerContent.includes('docker') || filename === 'dockerfile') {
        category = 'docker';
      } else if (lowerPath.includes('dependencies') || lowerPath.includes('deps') || filename === 'package.json') {
        category = 'dependencies';
      } else if (lowerPath.includes('log') || lowerContent.includes('logger') || lowerContent.includes('winston')) {
        category = 'logging';
      } else if (lowerPath.includes('ci') || lowerPath.includes('cd') || filename.includes('.yml') || filename.includes('.yaml')) {
        category = 'cicd';
      } else if (lowerPath.includes('quality') || lowerPath.includes('lint') || lowerContent.includes('eslint')) {
        category = 'codequality';
      } else if (lowerPath.includes('core') || lowerPath.includes('analyzer') || lowerPath.includes('checker') || lowerContent.includes('class ')) {
        category = 'core';
      } else if (lowerPath.includes('ai') || lowerPath.includes('insight') || lowerContent.includes('machine learning')) {
        category = 'ai';
      } else if (lowerPath.includes('architecture') || lowerPath.includes('structure') || lowerContent.includes('architecture')) {
        category = 'architecture';
      }
      
      // Расчет готовности логики
      const logic = calculateLogicReadiness(content, stat);
      
      // Расчет функциональности
      const functionality = calculateFunctionality(content, stat);
      
      // Извлекаем имя компонента
      const componentName = extractComponentName(filename, content);
      
      return {
        name: componentName,
        category,
        logic,
        functionality,
        file: filepath.replace(/\\/g, '/'),
        description: extractDescription(content),
        tests: countTests(content),
        lastModified: new Date(stat.mtime).toISOString().split('T')[0],
        fileSize: stat.size,
        lines: content.split('\n').length
      };
    } catch (error) {
      console.log(`⚠️  Ошибка анализа файла ${filename}: ${error.message}`);
      return null;
    }
  }
  
  // Вспомогательные функции анализа
  function calculateLogicReadiness(content, stat) {
    let score = 50; // Базовый балл
    
    // Анализ размера файла (больше = более разработанный)
    if (stat.size > 5000) score += 15;
    else if (stat.size > 2000) score += 10;
    else if (stat.size > 500) score += 5;
    
    // Анализ контента
    if (content.includes('class ')) score += 10;
    if (content.includes('async ')) score += 5;
    if (content.includes('try ') && content.includes('catch')) score += 10;
    if (content.includes('/**')) score += 5; // JSDoc комментарии
    if (content.includes('module.exports') || content.includes('export ')) score += 5;
    
    // Штрафы
    if (content.includes('TODO')) score -= 5;
    if (content.includes('FIXME')) score -= 10;
    if (content.includes('console.log')) score -= 2;
    
    return Math.max(30, Math.min(95, score));
  }
  
  function calculateFunctionality(content, stat) {
    let score = 45; // Базовый балл
    
    // Анализ функций
    const functionMatches = content.match(/function\s+\w+/g) || [];
    score += Math.min(functionMatches.length * 3, 20);
    
    // Анализ методов в классах
    const methodMatches = content.match(/\w+\s*\([^)]*\)\s*{/g) || [];
    score += Math.min(methodMatches.length * 2, 15);
    
    // Анализ тестов
    const testMatches = (content.match(/test\(/g) || []).length + (content.match(/it\(/g) || []).length;
    score += Math.min(testMatches * 5, 25);
    
    // Проверка на наличие основных конструкций
    if (content.includes('return ')) score += 5;
    if (content.includes('if (') || content.includes('if(')) score += 5;
    if (content.includes('for (') || content.includes('forEach')) score += 5;
    
    // Штрафы
    if (content.includes('throw new Error')) score -= 3;
    if (content.includes('// TODO')) score -= 5;
    
    return Math.max(25, Math.min(92, score));
  }
  
  function extractComponentName(filename, content) {
    // Пытаемся извлечь имя класса
    const classMatch = content.match(/class\s+(\w+)/);
    if (classMatch) return classMatch[1];
    
    // Или из module.exports
    const exportsMatch = content.match(/module\.exports\s*=\s*(\w+)/);
    if (exportsMatch) return exportsMatch[1];
    
    // Или используем имя файла (очищенное)
    return filename.replace(/\.(js|cjs|mjs)$/, '').replace(/[^a-zA-Z0-9]/g, '');
  }
  
  function extractDescription(content) {
    // Ищем JSDoc комментарий
    const jsdocMatch = content.match(/\/\*\*\s*(.*?)\s*\*\//s);
    if (jsdocMatch) {
      return jsdocMatch[1]
        .replace(/\*/g, '')
        .replace(/\n/g, ' ')
        .trim()
        .substring(0, 100);
    }
    
    // Ищем однострочный комментарий в начале файла
    const commentMatch = content.match(/^\/\/\s*(.*?)$/m);
    if (commentMatch) {
      return commentMatch[1].trim().substring(0, 100);
    }
    
    return 'EAP Analyzer компонент';
  }
  
  function countTests(content) {
    const testMatches = (content.match(/test\(/g) || []).length;
    const itMatches = (content.match(/it\(/g) || []).length;
    const describeMatches = (content.match(/describe\(/g) || []).length;
    
    const total = testMatches + itMatches + describeMatches;
    return total > 0 ? `${total} тестов` : 'Нет тестов';
  }
  
  // Запускаем обход проекта
  traverseDirectory(projectPath);
  
  // Расчет средних значений для категорий
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    if (cat.count > 0) {
      cat.avgLogic = Math.round(cat.totalLogic / cat.count);
      cat.avgFunc = Math.round(cat.totalFunc / cat.count);
    } else {
      cat.avgLogic = 0;
      cat.avgFunc = 0;
    }
  });
  
  console.log(`✅ Проанализировано ${Object.keys(components).length} компонентов`);
  
  return { components, categories };
}

// Генерация тестовых данных если папка не найдена
function generateTestData() {
  console.log('🧪 Генерация тестовых данных...');
  
  const testComponents = {};
  const categories = {
    'testing': { avgLogic: 88, avgFunc: 85, count: 8, components: [] },
    'security': { avgLogic: 85, avgFunc: 82, count: 7, components: [] },
    'performance': { avgLogic: 78, avgFunc: 75, count: 3, components: [] },
    'core': { avgLogic: 82, avgFunc: 78, count: 6, components: [] }
  };
  
  // Добавляем несколько тестовых компонентов
  const testData = [
    { name: 'TestingAnalyzer', category: 'testing', logic: 90, func: 85 },
    { name: 'SecurityChecker', category: 'security', logic: 85, func: 80 },
    { name: 'PerformanceAnalyzer', category: 'performance', logic: 78, func: 75 },
    { name: 'CoreAnalyzer', category: 'core', logic: 82, func: 78 }
  ];
  
  testData.forEach(item => {
    testComponents[item.name] = {
      name: item.name,
      category: item.category,
      logic: item.logic,
      functionality: item.func,
      file: `eap-analyzer/${item.name.toLowerCase()}.js`,
      description: `Тестовый ${item.name}`,
      tests: `${Math.floor(Math.random() * 15 + 5)} тестов`,
      lastModified: new Date().toISOString().split('T')[0]
    };
  });
  
  return { components: testComponents, categories };
}

// Генерация MD-отчета
function generateMarkdownReport(data) {
  const { components, categories } = data;
  let markdown = `# 📋 EAP ANALYZER - LIVE АНАЛИЗ ПРОЕКТА\n\n`;
  
  markdown += `## 📊 ПОКАЗАТЕЛИ ГОТОВНОСТИ\n\n`;
  markdown += `> **Отчет сгенерирован:** ${new Date().toLocaleString('ru-RU')}\n\n`;
  markdown += `- **Первая цифра**: Готовность логики (% реализации)\n`;
  markdown += `- **Вторая цифра**: Функциональность (% работоспособности)\n\n`;
  
  markdown += `## 🎯 **ОСНОВНЫЕ КАТЕГОРИИ АНАЛИЗА**\n\n`;
  
  // Добавляем категории
  const sortedCats = Object.entries(categories)
    .filter(([_, cat]) => cat.count > 0)
    .sort(([_, a], [__, b]) => b.avgLogic - a.avgLogic);
    
  sortedCats.forEach(([key, cat], index) => {
    markdown += `### ${index + 1}. ${getCategoryIcon(key)} **${getCategoryName(key)}** [${cat.avgLogic}% / ${cat.avgFunc}%]\n\n`;
    
    // Добавляем компоненты категории
    const categoryComponents = Object.values(components)
      .filter(comp => comp.category === key)
      .sort((a, b) => b.logic - a.logic);
      
    categoryComponents.forEach(comp => {
      markdown += `- **${comp.name}** [${comp.logic}% / ${comp.functionality}%] - ${comp.description}\n`;
    });
    
    markdown += `\n**Статистика категории:**\n`;
    markdown += `- Компонентов: ${cat.count}\n`;
    markdown += `- Средняя готовность: ${cat.avgLogic}%\n`;
    markdown += `- Средняя функциональность: ${cat.avgFunc}%\n\n`;
  });
  
  // Добавляем общую статистику
  const totalComponents = Object.keys(components).length;
  const totalLogic = Object.values(components).reduce((sum, comp) => sum + comp.logic, 0);
  const totalFunc = Object.values(components).reduce((sum, comp) => sum + comp.functionality, 0);
  
  markdown += `## 📈 **ОБЩАЯ СТАТИСТИКА**\n\n`;
  markdown += `- **Всего компонентов:** ${totalComponents}\n`;
  markdown += `- **Средняя готовность логики:** ${totalComponents ? Math.round(totalLogic / totalComponents) : 0}%\n`;
  markdown += `- **Средняя функциональность:** ${totalComponents ? Math.round(totalFunc / totalComponents) : 0}%\n`;
  markdown += `- **Категорий:** ${sortedCats.length}\n`;
  markdown += `- **Дата анализа:** ${new Date().toISOString().split('T')[0]}\n\n`;
  
  return markdown;
}

// Вспомогательные функции
function getCategoryIcon(category) {
  const icons = {
    'testing': '🧪',
    'security': '🔒',
    'performance': '⚡',
    'docker': '🐳',
    'dependencies': '📦',
    'logging': '📝',
    'cicd': '🔄',
    'codequality': '✨',
    'core': '⚙️',
    'ai': '🤖',
    'architecture': '🏗️',
    'utils': '🔧'
  };
  return icons[category] || '📁';
}

function getCategoryName(category) {
  const names = {
    'testing': 'TESTING (Тестирование)',
    'security': 'SECURITY (Безопасность)',
    'performance': 'PERFORMANCE (Производительность)',
    'docker': 'DOCKER (Контейнеризация)',
    'dependencies': 'DEPENDENCIES (Зависимости)',
    'logging': 'LOGGING (Логирование)',
    'cicd': 'CI/CD (Непрерывная интеграция)',
    'codequality': 'CODE QUALITY (Качество кода)',
    'core': 'CORE (Ядро системы)',
    'ai': 'AI (Искусственный интеллект)',
    'architecture': 'ARCHITECTURE (Архитектура)',
    'utils': 'UTILS (Утилиты)'
  };
  return names[category] || category.toUpperCase();
}

// Главная функция
function main() {
  console.log('🚀 EAP ANALYZER - Генерация Live-отчета');
  console.log('='.repeat(50));
  
  const data = analyzeProjectFiles();
  
  console.log(`\n📊 Результаты анализа:`);
  console.log(`   Компонентов: ${Object.keys(data.components).length}`);
  console.log(`   Категорий: ${Object.keys(data.categories).filter(key => data.categories[key].count > 0).length}`);
  
  const markdown = generateMarkdownReport(data);
  
  // Создаем директории
  const dataDir = './data';
  const reportsDir = './data/reports';
  const archiveDir = './data/reports/archives';
  
  [dataDir, reportsDir, archiveDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Создана директория: ${dir}`);
    }
  });
  
  // Сохраняем MD-отчет
  const reportPath = './data/reports/EAP-ANALYZER-CURRENT-REPORT.md';
  fs.writeFileSync(reportPath, markdown);
  console.log(`📝 Основной отчет: ${reportPath}`);
  
  // Копируем как полный каталог
  fs.copyFileSync(reportPath, './data/reports/EAP-ANALYZER-FULL-COMPONENT-CATALOG.md');
  console.log(`📋 Каталог компонентов: ./data/reports/EAP-ANALYZER-FULL-COMPONENT-CATALOG.md`);
  
  // Архивируем с датой и временем
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
  const date = timestamp[0];
  const time = timestamp[1].split('.')[0];
  fs.copyFileSync(reportPath, `./data/reports/archives/EAP-ANALYZER-REPORT-${date}-${time}.md`);
  console.log(`🗄️  Архив: ./data/reports/archives/EAP-ANALYZER-REPORT-${date}-${time}.md`);
  
  console.log('\n✅ Live-отчет успешно сгенерирован!');
  console.log('🔄 Теперь перезагрузите dashboard для обновления данных.');
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { analyzeProjectFiles, generateMarkdownReport };
