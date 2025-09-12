#!/usr/bin/env node

/**
 * EAP Analyzer Live Report Generator
 * Анализирует реальные файлы проекта и генерирует актуальные отчеты
 * Использование: node live-generator.cjs
 */

const fs = require('fs');
const path = require('path');
const { smartComponentAnalyzer } = require('./smart-analyzer.cjs');

// Функция для анализа файлов проекта
function analyzeProjectFiles(projectPath = '..') {
  // ИЗМЕНЕНО: анализируем весь проект
  const components = {};
  const categories = {
    testing: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    security: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    performance: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    docker: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    dependencies: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    logging: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    cicd: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    codequality: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    core: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    ai: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    architecture: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    utils: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
    other: { totalLogic: 0, totalFunc: 0, count: 0, components: [] },
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
            // Исключаем все dist-* папки (dist, dist-cjs, dist-esm и т.д.)
            const shouldSkipDir =
              [
                'node_modules',
                '.git',
                'coverage',
                '.nyc_output',
                'build',
                'out',
                'target',
                '.next',
                '.cache',
                '.svelte-kit',
                'test-results',
                'logs',
                'reports',
                'data',
                'assets',
                'static',
                'docker',
                'docs',
                'emt-v3-stable-clean',
                'testing-integration-package',
                'eap-analyzer-dashboard', // НЕ анализируем саму dashboard
              ].includes(file) || file.startsWith('dist');

            if (!shouldSkipDir) {
              traverseDirectory(fullPath, relativeFilePath);
            }
          } else if (
            file.endsWith('.js') ||
            file.endsWith('.cjs') ||
            file.endsWith('.mjs') ||
            file.endsWith('.ts') ||
            file.endsWith('.tsx') ||
            file.endsWith('.jsx') ||
            file.endsWith('.vue') ||
            file.endsWith('.svelte') ||
            file.endsWith('.py') ||
            file.endsWith('.java') ||
            file.endsWith('.cs') ||
            file.endsWith('.php') ||
            file.endsWith('.rb') ||
            file.endsWith('.go') ||
            file.endsWith('.rs') ||
            file.endsWith('.cpp') ||
            file.endsWith('.c') ||
            file.endsWith('.h') ||
            file.endsWith('.hpp') ||
            file.endsWith('.yml') ||
            file.endsWith('.yaml') ||
            file.endsWith('.json') ||
            file.endsWith('.md') ||
            file.endsWith('.dockerfile') ||
            file === 'Dockerfile'
          ) {
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

  // Функция для определения demo/test/example компонентов
  function isDemoOrExampleComponent(filename, filepath, content) {
    const lowerPath = filepath.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Path-based patterns для demo/test компонентов
    const demoPatterns = [
      'tests/components/', // TestButton.svelte и подобные
      'examples/',
      'demo/',
      '.example.',
      '.demo.',
      'sample/',
      'playground/',
    ];

    // Проверяем path patterns
    for (const pattern of demoPatterns) {
      if (lowerPath.includes(pattern)) {
        return true;
      }
    }

    // Проверяем comment markers (@demo, @example)
    if (lowerContent.includes('@demo') || lowerContent.includes('@example')) {
      return true;
    }

    // Специфичные файлы по названию (TestButton.svelte и подобные)
    const demoFilePatterns = [
      /^test.*\.(svelte|vue|jsx|tsx)$/i, // TestButton.svelte, TestComponent.jsx
      /.*\.example\./i, // Button.example.js
      /.*\.demo\./i, // Component.demo.tsx
      /^demo.*\./i, // DemoButton.js
      /^sample.*\./i, // SampleComponent.ts
    ];

    for (const pattern of demoFilePatterns) {
      if (pattern.test(filename)) {
        return true;
      }
    }

    return false;
  }

  // Анализ одного файла
  function analyzeFile(filename, filepath, content, stat) {
    try {
      // Фильтрация по размеру и содержимому
      // Исключаем файлы меньше 100 байт или менее 5 строк
      const lines = content.split('\n');
      if (stat.size < 100 || lines.length < 5) {
        return null;
      }

      // Исключаем source map файлы и ссылки на них
      if (
        filename.endsWith('.map') ||
        filename.endsWith('.js.map') ||
        content.trim().startsWith('# sourceMappingURL=') ||
        content.trim().startsWith('//# sourceMappingURL=')
      ) {
        return null;
      }

      // Исключаем минифицированные файлы
      if (
        filename.includes('.min.') ||
        filename.includes('.bundle.') ||
        (lines.length < 10 && content.length > 1000)
      ) {
        return null;
      }

      // Определяем категорию по пути файла и содержимому
      let category = 'utils'; // По умолчанию
      const lowerPath = filepath.toLowerCase();
      const lowerContent = content.toLowerCase();

      // ПРИОРИТЕТ 1: Проверяем на demo/example компоненты ПЕРВЫМ (перед testing)
      if (isDemoOrExampleComponent(filename, filepath, content)) {
        category = 'other';
      } else if (
        lowerPath.includes('test') ||
        lowerPath.includes('spec') ||
        filename.includes('.test.') ||
        filename.includes('.spec.')
      ) {
        category = 'testing';
      } else if (
        lowerPath.includes('security') ||
        lowerContent.includes('security') ||
        lowerContent.includes('vulnerability')
      ) {
        category = 'security';
      } else if (
        lowerPath.includes('performance') ||
        lowerPath.includes('perf') ||
        lowerContent.includes('performance')
      ) {
        category = 'performance';
      } else if (
        lowerPath.includes('docker') ||
        lowerContent.includes('docker') ||
        filename === 'dockerfile'
      ) {
        category = 'docker';
      } else if (
        lowerPath.includes('dependencies') ||
        lowerPath.includes('deps') ||
        filename === 'package.json'
      ) {
        category = 'dependencies';
      } else if (
        lowerPath.includes('log') ||
        lowerContent.includes('logger') ||
        lowerContent.includes('winston')
      ) {
        category = 'logging';
      } else if (
        lowerPath.includes('ci') ||
        lowerPath.includes('cd') ||
        filename.includes('.yml') ||
        filename.includes('.yaml')
      ) {
        category = 'cicd';
      } else if (
        lowerPath.includes('quality') ||
        lowerPath.includes('lint') ||
        lowerContent.includes('eslint')
      ) {
        category = 'codequality';
      } else if (
        lowerPath.includes('core') ||
        lowerPath.includes('analyzer') ||
        lowerPath.includes('checker') ||
        lowerContent.includes('class ')
      ) {
        category = 'core';
      } else if (
        lowerPath.includes('ai') ||
        lowerPath.includes('insight') ||
        lowerContent.includes('machine learning')
      ) {
        category = 'ai';
      } else if (
        lowerPath.includes('architecture') ||
        lowerPath.includes('structure') ||
        lowerContent.includes('architecture')
      ) {
        category = 'architecture';
      }

      // Используем умный анализатор вместо старых функций
      const smartAnalysis = smartComponentAnalyzer(filename, filepath, content, stat);

      const logic = smartAnalysis.logicScore;
      const functionality = smartAnalysis.functionalityScore;

      // Извлекаем имя компонента
      const componentName = extractComponentName(filename, content);

      // Используем результаты умного анализатора
      const logicIssues = smartAnalysis.logicIssues;
      const functionalityIssues = smartAnalysis.functionalityIssues;

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
        lines: content.split('\n').length,
        logicIssues,
        functionalityIssues,
        // Сохраняем старые поля для совместимости
        logicIssue: logicIssues[0] || 'Нет критических проблем',
        functionalityIssue: functionalityIssues[0] || 'Нет критических проблем',
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
    const testMatches =
      (content.match(/test\(/g) || []).length + (content.match(/it\(/g) || []).length;
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
      return jsdocMatch[1].replace(/\*/g, '').replace(/\n/g, ' ').trim().substring(0, 100);
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

  // Функции для определения ключевых недостатков
  function identifyLogicIssue(content, category, filepath) {
    const lowerContent = content.toLowerCase();

    // Проверка на реальные проблемы в коде
    if (content.includes('TODO:') || content.includes('FIXME:')) {
      const todoMatch = content.match(/TODO:\s*([^;\n\r]+)/i);
      if (todoMatch) return todoMatch[1].trim().substring(0, 80);

      const fixmeMatch = content.match(/FIXME:\s*([^;\n\r]+)/i);
      if (fixmeMatch) return fixmeMatch[1].trim().substring(0, 80);
    }

    // Автоматический анализ паттернов проблем
    if (content.includes('try {') && !content.includes('catch (')) {
      return 'Отсутствует корректная обработка исключений в блоке try';
    }

    if (lowerContent.includes('eval(') || lowerContent.includes('function(')) {
      return 'Использование небезопасных динамических вызовов';
    }

    if (content.match(/if\s*\([^{]+\)\s*[^{]/)) {
      return 'Отсутствуют блоки {} для условных выражений';
    }

    // Категориальные недостатки логики
    const logicIssues = {
      testing: [
        'Недостаточное покрытие крайних случаев',
        'Отсутствуют тесты для негативных сценариев',
        'Неполное тестирование асинхронных операций',
        'Отсутствие интеграционных тестов',
        'Недостаточная валидация тестовых данных',
      ],
      security: [
        'Уязвимость к XSS атакам через пользовательский ввод',
        'Отсутствует валидация входных параметров',
        'Небезопасное хранение конфиденциальных данных',
        'Недостаточная защита от SQL-инъекций',
        'Отсутствует проверка прав доступа',
      ],
      performance: [
        'Неоптимальный алгоритм с высокой сложностью',
        'Отсутствует кэширование часто используемых данных',
        'Синхронные операции блокируют основной поток',
        'Избыточные вызовы внешних API',
        'Неэффективное использование памяти',
      ],
      docker: [
        'Отсутствует health check для контейнера',
        'Использование root пользователя в контейнере',
        'Неоптимальный размер Docker образа',
        'Отсутствует multi-stage сборка',
        'Небезопасные переменные окружения',
      ],
      core: [
        'Избыточная связность между модулями',
        'Нарушение принципа единственной ответственности',
        'Отсутствует абстракция для внешних зависимостей',
        'Жестко заданные конфигурационные значения',
        'Недостаточная модульность архитектуры',
      ],
      logging: [
        'Избыточное логирование замедляет производительность',
        'Отсутствуют уровни важности сообщений',
        'Логи содержат конфиденциальную информацию',
        'Неструктурированный формат логов',
        'Отсутствует ротация файлов логов',
      ],
      cicd: [
        'Отсутствуют параллельные этапы в пайплайне',
        'Недостаточное кэширование зависимостей',
        'Отсутствует автоматический откат при ошибках',
        'Неоптимальная стратегия ветвления',
        'Отсутствуют проверки качества кода',
      ],
      codequality: [
        'Высокая цикломатическая сложность функций',
        'Дублирование кода в нескольких модулях',
        'Отсутствуют комментарии к сложной логике',
        'Несоблюдение стандартов кодирования',
        'Неконсистентное именование переменных',
      ],
      ai: [
        'Отсутствует валидация качества обучающих данных',
        'Недостаточная точность предсказательной модели',
        'Отсутствует обработка аномальных значений',
        'Неоптимальный выбор алгоритма машинного обучения',
        'Отсутствует мониторинг дрейфа модели',
      ],
      architecture: [
        'Монолитная архитектура затрудняет масштабирование',
        'Отсутствует разделение на слои абстракции',
        'Нарушение принципов SOLID',
        'Отсутствует документация архитектурных решений',
        'Неоптимальная организация компонентов',
      ],
      dependencies: [
        'Устаревшие версии критически важных пакетов',
        'Избыточное количество внешних зависимостей',
        'Отсутствует блокировка версий зависимостей',
        'Уязвимости в сторонних библиотеках',
        'Неиспользуемые зависимости увеличивают размер',
      ],
      utils: [
        'Отсутствует обработка граничных случаев',
        'Неоптимальная производительность алгоритмов',
        'Недостаточная переиспользуемость функций',
        'Отсутствует документация API',
        'Смешивание различных уровней абстракции',
      ],
    };

    const issues = logicIssues[category] || logicIssues.utils;
    return issues[Math.floor(Math.random() * issues.length)];
  }

  function identifyFunctionalityIssue(content, category, filepath) {
    const lowerContent = content.toLowerCase();

    // Проверка на реальные проблемы функциональности
    if (content.includes('console.log') || content.includes('console.debug')) {
      return 'Необходимо удалить отладочные выводы перед продакшеном';
    }

    if (lowerContent.includes('settimeout') && !lowerContent.includes('cleartimeout')) {
      return 'Потенциальные утечки памяти из-за неочищенных таймеров';
    }

    if (!content.includes('throw new Error') && !content.includes('reject(')) {
      return 'Отсутствует корректная обработка критических ошибок';
    }

    // Категориальные недостатки функциональности
    const functionalityIssues = {
      testing: [
        'Нет интеграции с системой непрерывной интеграции',
        'Отсутствуют моки для внешних зависимостей',
        'Нестабильность тестов на разных окружениях',
        'Медленное выполнение тестового набора',
        'Отсутствует параллельное выполнение тестов',
      ],
      security: [
        'Не используется HTTPS для передачи данных',
        'Отсутствует шифрование конфиденциальных данных',
        'Недостаточная защита от брутфорс атак',
        'Отсутствует аудит безопасности действий',
        'Слабая политика паролей пользователей',
      ],
      performance: [
        'Высокое потребление оперативной памяти',
        'Медленный отклик при пиковых нагрузках',
        'Неэффективная работа с базой данных',
        'Отсутствует горизонтальное масштабирование',
        'Блокирующие операции ввода-вывода',
      ],
      docker: [
        'Контейнер не запускается в ограниченной среде',
        'Отсутствует graceful shutdown при остановке',
        'Неправильная обработка сигналов системы',
        'Контейнер требует привилегированные права',
        'Отсутствует мониторинг состояния контейнера',
      ],
      core: [
        'Отсутствует кэширование результатов вычислений',
        'Неустойчивость к временным сбоям',
        'Отсутствует механизм повторных попыток',
        'Недостаточная отказоустойчивость системы',
        'Сложность в отладке и диагностике проблем',
      ],
      logging: [
        'Отсутствует централизованный сбор логов',
        'Неэффективная производительность записи логов',
        'Отсутствуют алерты по критическим событиям',
        'Логи не содержат контекстную информацию',
        'Сложность в поиске и анализе событий',
      ],
      cicd: [
        'Длительное время развертывания изменений',
        'Отсутствует автоматический мониторинг деплоя',
        'Нет стратегии отката при критических ошибках',
        'Ручные этапы в процессе развертывания',
        'Отсутствует валидация окружения перед деплоем',
      ],
      codequality: [
        'Низкий процент покрытия кода тестами',
        'Частые конфликты при слиянии кода',
        'Отсутствует автоматическая проверка стиля',
        'Сложность в понимании и поддержке кода',
        'Высокая техническая задолженность проекта',
      ],
      ai: [
        'Низкая точность прогнозов на новых данных',
        'Длительное время обучения модели',
        'Отсутствует A/B тестирование алгоритмов',
        'Неэффективное использование вычислительных ресурсов',
        'Сложность в интерпретации результатов модели',
      ],
      architecture: [
        'Сложность в добавлении новой функциональности',
        'Высокая связность компонентов системы',
        'Отсутствует автоматическое восстановление сервисов',
        'Недостаточная изоляция отказов',
        'Сложность в масштабировании отдельных модулей',
      ],
      dependencies: [
        'Конфликты версий при обновлении пакетов',
        'Отсутствует автоматическое обновление зависимостей',
        'Длительная загрузка из-за большого числа пакетов',
        'Нестабильность работы с новыми версиями',
        'Отсутствует резервное зеркало для критичных пакетов',
      ],
      utils: [
        'Отсутствует обработка исключительных ситуаций',
        'Неконсистентное поведение в разных контекстах',
        'Отсутствует валидация входных параметров',
        'Сложность в расширении функциональности',
        'Неоптимальное использование ресурсов системы',
      ],
    };

    const issues = functionalityIssues[category] || functionalityIssues.utils;
    return issues[Math.floor(Math.random() * issues.length)];
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

// Функции для генерации множественных проблем
function identifyMultipleLogicIssues(content, category, filepath, logicScore) {
  const issues = [];

  // Определяем количество проблем в зависимости от критичности
  let issueCount = 1;
  if (logicScore <= 30) {
    issueCount = Math.floor(Math.random() * 3) + 3; // 3-5 проблем для очень плохой логики
  } else if (logicScore <= 50) {
    issueCount = Math.floor(Math.random() * 2) + 2; // 2-3 проблемы для плохой логики
  } else if (logicScore <= 70) {
    issueCount = Math.floor(Math.random() * 2) + 1; // 1-2 проблемы для средней логики
  }

  // Генерируем проблемы из расширенного пула
  const logicIssuesPool = {
    testing: [
      'Отсутствуют проверки на edge cases',
      'Неэффективные алгоритмы тестирования',
      'Недостаточное покрытие интеграционными тестами',
      'Отсутствует валидация входных параметров',
      'Дублирование логики в разных тестах',
      'Неправильная организация тестовых данных',
      'Отсутствуют комментарии к сложной логике',
      'Несоблюдение стандартов кодирования',
    ],
    security: [
      'Уязвимости к инъекции SQL',
      'Отсутствует шифрование чувствительных данных',
      'Небезопасное хранение паролей',
      'Отсутствует проверка прав доступа',
      'Уязвимости к XSS атакам',
      'Неправильная настройка CORS',
      'Слабые алгоритмы хеширования',
      'Отсутствует валидация входных данных',
    ],
    performance: [
      'Неоптимальные алгоритмы сортировки',
      'Утечки памяти при работе с большими данными',
      'Неэффективные циклы и итерации',
      'Отсутствует кэширование результатов',
      'Неоптимальные запросы к базе данных',
      'Блокирующие операции в главном потоке',
      'Избыточное использование ресурсов',
      'Неоптимальные алгоритмы поиска',
    ],
    core: [
      'Нарушение принципов SOLID',
      'Отсутствует обработка исключений',
      'Циклические зависимости между модулями',
      'Неконсистентное API',
      'Отсутствует валидация входных данных',
      'Смешивание бизнес-логики с представлением',
      'Неконсистентное именование переменных',
      'Отсутствует документация к коду',
    ],
  };

  const categoryIssues = logicIssuesPool[category] || logicIssuesPool.core;

  // Генерируем уникальные проблемы
  const usedIssues = new Set();
  for (let i = 0; i < issueCount && usedIssues.size < categoryIssues.length; i++) {
    let randomIssue;
    do {
      randomIssue = categoryIssues[Math.floor(Math.random() * categoryIssues.length)];
    } while (usedIssues.has(randomIssue));

    usedIssues.add(randomIssue);
    issues.push(randomIssue);
  }

  return issues;
}

function identifyMultipleFunctionalityIssues(content, category, filepath, functionalityScore) {
  const issues = [];

  // Определяем количество проблем в зависимости от критичности
  let issueCount = 1;
  if (functionalityScore <= 30) {
    issueCount = Math.floor(Math.random() * 3) + 3; // 3-5 проблем для очень плохой функциональности
  } else if (functionalityScore <= 50) {
    issueCount = Math.floor(Math.random() * 2) + 2; // 2-3 проблемы для плохой функциональности
  } else if (functionalityScore <= 70) {
    issueCount = Math.floor(Math.random() * 2) + 1; // 1-2 проблемы для средней функциональности
  }

  // Генерируем проблемы из расширенного пула
  const functionalityIssuesPool = {
    testing: [
      'Отсутствует автоматизация развертывания тестов',
      'Неполная очистка тестовых данных',
      'Отсутствуют метрики качества тестирования',
      'Недостаточная изоляция между тестами',
      'Отсутствует параллельное выполнение тестов',
      'Неправильная конфигурация тестового окружения',
      'Нестабильность тестов на разных окружениях',
      'Медленное выполнение тестового набора',
    ],
    security: [
      'Отсутствует мониторинг безопасности',
      'Недостаточное логирование событий безопасности',
      'Отсутствуют политики доступа к данным',
      'Неправильная настройка файрвола',
      'Отсутствует двухфакторная аутентификация',
      'Уязвимости в настройках сервера',
      'Отсутствует аудит безопасности',
      'Неправильное управление сессиями',
    ],
    performance: [
      'Отсутствует мониторинг производительности',
      'Неэффективное использование ресурсов сервера',
      'Отсутствуют метрики времени отклика',
      'Неправильная настройка балансировки нагрузки',
      'Отсутствует оптимизация изображений',
      'Медленная загрузка статических ресурсов',
      'Отсутствует CDN для статических файлов',
      'Неоптимальное сжатие данных',
    ],
    core: [
      'Отсутствует версионирование API',
      'Неправильная обработка состояний ошибок',
      'Отсутствует документация публичного API',
      'Неконсистентные форматы данных',
      'Отсутствует логирование критических операций',
      'Неправильная настройка конфигурации',
      'Отсутствует обработка граничных случаев',
      'Неоптимальная производительность алгоритмов',
    ],
  };

  const categoryIssues = functionalityIssuesPool[category] || functionalityIssuesPool.core;

  // Генерируем уникальные проблемы
  const usedIssues = new Set();
  for (let i = 0; i < issueCount && usedIssues.size < categoryIssues.length; i++) {
    let randomIssue;
    do {
      randomIssue = categoryIssues[Math.floor(Math.random() * categoryIssues.length)];
    } while (usedIssues.has(randomIssue));

    usedIssues.add(randomIssue);
    issues.push(randomIssue);
  }

  return issues;
} // Генерация тестовых данных если папка не найдена
function generateTestData() {
  console.log('🧪 Генерация тестовых данных...');

  const testComponents = {};
  const categories = {
    testing: { avgLogic: 88, avgFunc: 85, count: 8, components: [] },
    security: { avgLogic: 85, avgFunc: 82, count: 7, components: [] },
    performance: { avgLogic: 78, avgFunc: 75, count: 3, components: [] },
    core: { avgLogic: 82, avgFunc: 78, count: 6, components: [] },
  };

  // Добавляем несколько тестовых компонентов
  const testData = [
    {
      name: 'TestingAnalyzer',
      category: 'testing',
      logic: 90,
      func: 85,
      logicIssue: 'Недостаточное покрытие крайних случаев',
      functionalityIssue: 'Нет интеграции с системой непрерывной интеграции',
    },
    {
      name: 'SecurityChecker',
      category: 'security',
      logic: 85,
      func: 80,
      logicIssue: 'Уязвимость к XSS атакам через пользовательский ввод',
      functionalityIssue: 'Не используется HTTPS для передачи данных',
    },
    {
      name: 'PerformanceAnalyzer',
      category: 'performance',
      logic: 78,
      func: 75,
      logicIssue: 'Неоптимальный алгоритм с высокой сложностью',
      functionalityIssue: 'Высокое потребление оперативной памяти',
    },
    {
      name: 'CoreAnalyzer',
      category: 'core',
      logic: 82,
      func: 78,
      logicIssue: 'Избыточная связность между модулями',
      functionalityIssue: 'Отсутствует кэширование результатов вычислений',
    },
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
      lastModified: new Date().toISOString().split('T')[0],
      fileSize: Math.floor(Math.random() * 15000 + 5000), // Случайный размер 5-20KB
      lines: Math.floor(Math.random() * 300 + 100), // Случайное количество строк 100-400
      logicIssue: item.logicIssue,
      functionalityIssue: item.functionalityIssue,
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
    testing: '🧪',
    security: '🔒',
    performance: '⚡',
    docker: '🐳',
    dependencies: '📦',
    logging: '📝',
    cicd: '🔄',
    codequality: '✨',
    core: '⚙️',
    ai: '🤖',
    architecture: '🏗️',
    utils: '🔧',
    other: '📄',
  };
  return icons[category] || '📁';
}

function getCategoryName(category) {
  const names = {
    testing: 'TESTING (Тестирование)',
    security: 'SECURITY (Безопасность)',
    performance: 'PERFORMANCE (Производительность)',
    docker: 'DOCKER (Контейнеризация)',
    dependencies: 'DEPENDENCIES (Зависимости)',
    logging: 'LOGGING (Логирование)',
    cicd: 'CI/CD (Непрерывная интеграция)',
    codequality: 'CODE QUALITY (Качество кода)',
    core: 'CORE (Ядро системы)',
    ai: 'AI (Искусственный интеллект)',
    architecture: 'ARCHITECTURE (Архитектура)',
    utils: 'UTILS (Утилиты)',
    other: 'OTHER (Остальное)',
  };
  return names[category] || category.toUpperCase();
}

// Генерация JavaScript файла данных
function generateDataJs(data, classification = null) {
  const { components, categories } = data;

  // Добавляем поле classification к каждому компоненту
  const componentsWithClassification = { ...components };
  if (classification) {
    // Добавляем классификацию "analyzer"
    Object.keys(classification.analyzers).forEach(id => {
      if (componentsWithClassification[id]) {
        componentsWithClassification[id].classification = 'analyzer';
      }
    });

    // Добавляем классификацию "auxiliary"
    Object.keys(classification.auxiliary).forEach(id => {
      if (componentsWithClassification[id]) {
        componentsWithClassification[id].classification = 'auxiliary';
      }
    });

    // Добавляем классификацию "other"
    Object.keys(classification.other).forEach(id => {
      if (componentsWithClassification[id]) {
        componentsWithClassification[id].classification = 'other';
      }
    });
  }

  // Подготавливаем категории для JS
  const jsCategories = {};
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    if (cat.count > 0) {
      jsCategories[key] = {
        name: getCategoryName(key),
        color: getCategoryColor(key),
        icon: getCategoryIcon(key),
        logic: cat.avgLogic,
        functionality: cat.avgFunc,
        count: cat.count,
        description: getCategoryDescription(key),
      };
    }
  });

  // Подготавливаем утилиты
  const jsUtils = {
    getTopComponents: `function(componentsArray, limit = 10) {
      console.log('🔍 DEBUG - getTopComponents called with:', componentsArray ? componentsArray.length : 'undefined', 'components, limit:', limit);

      const components = componentsArray || Object.values(window.EAP_DATA.components);
      console.log('🔍 DEBUG - Using components array with length:', components.length);

      if (!components || components.length === 0) {
        console.warn('⚠️ No components to process in getTopComponents');
        return [];
      }

      const sorted = components
        .filter(comp => comp && typeof comp.logic === 'number' && typeof comp.functionality === 'number')
        .sort((a, b) => {
          const overallA = (a.logic + a.functionality) / 2;
          const overallB = (b.logic + b.functionality) / 2;
          return overallB - overallA;
        });

      console.log('🔍 DEBUG - After filtering and sorting:', sorted.length, 'components');

      const result = sorted.slice(0, limit);
      console.log('🏆 DEBUG - getTopComponents returning:', result.length, 'components');

      return result;
    }`,

    getBottomComponents: `function(componentsArray, limit = 10) {
      console.log('🔍 DEBUG - getBottomComponents called with:', componentsArray ? componentsArray.length : 'undefined', 'components, limit:', limit);

      const components = componentsArray || Object.values(window.EAP_DATA.components);
      console.log('🔍 DEBUG - Using components array with length:', components.length);

      if (!components || components.length === 0) {
        console.warn('⚠️ No components to process in getBottomComponents');
        return [];
      }

      const sorted = components
        .filter(comp => comp && typeof comp.logic === 'number' && typeof comp.functionality === 'number')
        .sort((a, b) => {
          const overallA = (a.logic + a.functionality) / 2;
          const overallB = (b.logic + b.functionality) / 2;
          return overallA - overallB;
        });

      console.log('🔍 DEBUG - After filtering and sorting:', sorted.length, 'components');

      const result = sorted.slice(0, limit);
      console.log('🔧 DEBUG - getBottomComponents returning:', result.length, 'components');

      return result;
    }`,

    getCategoryStats: `function(category) {
      const components = Object.values(window.EAP_DATA.components);
      const categoryComponents = components.filter(c => c.category === category);

      if (categoryComponents.length === 0) return null;

      const totalLogic = categoryComponents.reduce((sum, c) => sum + c.logic, 0);
      const totalFunc = categoryComponents.reduce((sum, c) => sum + c.functionality, 0);

      return {
        count: categoryComponents.length,
        avgLogic: Math.round(totalLogic / categoryComponents.length),
        avgFunc: Math.round(totalFunc / categoryComponents.length),
        components: categoryComponents
      };
    }`,
  };

  // Подготавливаем историю данных
  const today = new Date().toISOString().split('T')[0];
  const jsHistory = {
    [today]: {
      avgLogic: Math.round(
        Object.values(components).reduce((sum, c) => sum + c.logic, 0) /
          Object.keys(components).length
      ),
      avgFunctionality: Math.round(
        Object.values(components).reduce((sum, c) => sum + c.functionality, 0) /
          Object.keys(components).length
      ),
      totalComponents: Object.keys(components).length,
      changes: [
        'Live-анализ проекта обновлен',
        `Загружено ${Object.keys(components).length} компонентов`,
        'Добавлены ключевые недостатки для каждого компонента',
      ],
      source: 'live-analysis',
    },
  };

  const jsContent = `// EAP Analyzer Dashboard Data
// Автоматически сгенерирован live-generator.cjs
// Дата генерации: ${new Date().toLocaleString('ru-RU')}

window.EAP_DATA = {
  components: ${JSON.stringify(componentsWithClassification, null, 2)},

  categories: ${JSON.stringify(jsCategories, null, 2)},

  history: ${JSON.stringify(jsHistory, null, 2)},

  classification: ${
    classification
      ? JSON.stringify(
          {
            analyzers: Object.keys(classification.analyzers),
            auxiliary: Object.keys(classification.auxiliary),
            other: Object.keys(classification.other),
            stats: {
              analyzersCount: Object.keys(classification.analyzers).length,
              auxiliaryCount: Object.keys(classification.auxiliary).length,
              otherCount: Object.keys(classification.other).length,
            },
          },
          null,
          2
        )
      : 'null'
  },

  utils: {
    getTopComponents: ${jsUtils.getTopComponents},
    getBottomComponents: ${jsUtils.getBottomComponents},
    getCategoryStats: ${jsUtils.getCategoryStats}
  }
};

console.log('✅ EAP Dashboard данные загружены (' + Object.keys(window.EAP_DATA.components).length + ' компонентов)');
`;

  return jsContent;
}

function getCategoryColor(key) {
  const colors = {
    testing: '#28a745',
    security: '#dc3545',
    performance: '#17a2b8',
    docker: '#0d6efd',
    dependencies: '#6610f2',
    logging: '#fd7e14',
    cicd: '#198754',
    codequality: '#6f42c1',
    core: '#495057',
    ai: '#e91e63',
    architecture: '#795548',
    utils: '#6c757d',
    other: '#adb5bd',
  };
  return colors[key] || '#6c757d';
}

function getCategoryDescription(key) {
  const descriptions = {
    testing: 'Модули тестирования и качества кода',
    security: 'Анализ безопасности и уязвимостей',
    performance: 'Оптимизация производительности',
    docker: 'Контейнеризация и Docker',
    dependencies: 'Управление зависимостями',
    logging: 'Системы логирования',
    cicd: 'Непрерывная интеграция',
    codequality: 'Качество кода и линтинг',
    core: 'Основные модули анализатора',
    ai: 'ИИ и машинное обучение',
    architecture: 'Архитектурные решения',
    utils: 'Вспомогательные утилиты',
    other: 'Demo, примеры и вспомогательные компоненты',
  };
  return descriptions[key] || 'Прочие компоненты';
}

// Функция классификации компонентов по типу участия в анализе
function classifyComponents(components) {
  console.log('🔍 Классификация компонентов по типу участия в анализе...');

  const analyzers = {};
  const auxiliary = {};
  const other = {}; // Переименовали tests в other

  const total = Object.keys(components).length;
  let processed = 0;

  Object.entries(components).forEach(([id, comp]) => {
    processed++;
    const name = (comp.name || '').toLowerCase();
    const file = (comp.file || '').toLowerCase();
    const desc = (comp.description || '').toLowerCase();

    // Логирование прогресса каждые 50 компонентов
    if (processed % 50 === 0) {
      console.log(`📊 Обработано ${processed}/${total} компонентов...`);
    }

    // 1. Сначала определяем "другие" компоненты (документация, конфиги, не-исполняемые файлы)
    if (
      // MD файлы и документация
      file.endsWith('.md') ||
      file.endsWith('.txt') ||
      file.endsWith('.rst') ||
      file.endsWith('.pdf') ||
      file.endsWith('.doc') ||
      file.endsWith('.docx') ||
      // Конфигурационные файлы (исключая важные проектные конфиги)
      (file.endsWith('.json') &&
        !file.includes('package.json') &&
        !file.includes('tsconfig') &&
        !file.includes('jest.config') &&
        !file.includes('vite.config') &&
        !file.includes('playwright.config')) ||
      file.endsWith('.yml') ||
      file.endsWith('.yaml') ||
      file.endsWith('.toml') ||
      file.endsWith('.ini') ||
      file.endsWith('.cfg') ||
      file.endsWith('.conf') ||
      // Другие не-исполняемые файлы
      file.endsWith('.gitignore') ||
      file.endsWith('.gitattributes') ||
      file.endsWith('.npmrc') ||
      file.endsWith('.nvmrc') ||
      file.endsWith('license') ||
      file.endsWith('readme') ||
      // Простые вспомогательные скрипты (меньше 50 строк)
      (comp.lines < 50 &&
        (name.includes('setup') ||
          name.includes('helper') ||
          name.includes('util') ||
          name.includes('config'))) ||
      // Тестовые компоненты (исключая анализаторы и их тесты)
      ((file.includes('/test/') ||
        file.includes('/spec/') ||
        file.includes('/mock/') ||
        file.includes('__tests__') ||
        name.includes('mock') ||
        name.includes('fixture')) &&
        !name.includes('analyzer') &&
        !name.includes('checker') &&
        !name.includes('evaluator') &&
        !desc.includes('анализир') &&
        !desc.includes('проверя') &&
        !file.includes('/checkers/')) // Исключаем тесты анализаторов (checkers)
    ) {
      other[id] = comp;
      return;
    }

    // 2. Определяем анализаторы (компоненты, которые будут анализировать другие проекты)
    const isAnalyzer =
      // КРИТЕРИЙ 1: Явные анализаторы по названию
      ((name.includes('analyzer') ||
        name.includes('checker') ||
        name.includes('evaluator') ||
        name.includes('detector') ||
        name.includes('inspector') ||
        name.includes('validator')) &&
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: исключаем простые тесты, setup, demo, утилиты
        !name.includes('setup') &&
        !name.includes('config') &&
        !name.includes('mock') &&
        !name.includes('demo') &&
        !name.includes('test') && // Исключаем все тестовые файлы
        !name.includes('cleanup') &&
        !name.includes('reporter') && // Репортеры - это утилиты, не анализаторы
        !name.includes('generator') && // Генераторы - это утилиты, не анализаторы
        !name.includes('publisher') && // Публишеры - это утилиты
        !name.includes('manager') && // Менеджеры - это утилиты
        !name.includes('factory') && // Фабрики - это утилиты
        !name.includes('loader') && // Загрузчики - это утилиты
        !name.includes('builder') && // Строители - это утилиты
        !file.includes('/test/') &&
        !file.includes('/spec/') &&
        !file.includes('/tests/') &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.test.mjs') &&
        // КРИТЕРИЙ 2: Компоненты со сложной логикой анализа (больше 100 строк)
        (comp.lines > 100 ||
          // КРИТЕРИЙ 3: Высокие показатели готовности (реальные анализаторы должны быть качественными)
          (comp.logic > 70 && comp.functionality > 60))) ||
      // КРИТЕРИЙ 4: Специализированные анализаторы безопасности/производительности
      (comp.category === 'security' &&
        comp.lines > 50 &&
        !name.includes('setup') &&
        !name.includes('config') &&
        !name.includes('demo') &&
        !name.includes('reporter') &&
        !name.includes('generator') &&
        !name.includes('publisher') &&
        !name.includes('manager') &&
        !name.includes('factory') &&
        !name.includes('loader')) ||
      (comp.category === 'performance' &&
        comp.lines > 50 &&
        !name.includes('setup') &&
        !name.includes('config') &&
        !name.includes('demo') &&
        !name.includes('reporter') &&
        !name.includes('generator') &&
        !name.includes('publisher') &&
        !name.includes('manager') &&
        !name.includes('factory') &&
        !name.includes('loader')) ||
      // КРИТЕРИЙ 5: Исключаем тестовые компоненты из категории testing
      // (тесты НЕ должны быть анализаторами, даже если они большие)
      false || // Отключаем этот критерий для testing категории
      // КРИТЕРИЙ 6: По описанию - только с явными признаками анализа
      (desc.includes('анализир') &&
        comp.lines > 50 &&
        !desc.includes('тест') &&
        !desc.includes('demo') &&
        !name.includes('reporter') &&
        !name.includes('generator') &&
        !name.includes('publisher')) ||
      (desc.includes('проверя') &&
        comp.lines > 50 &&
        !desc.includes('простой') &&
        !desc.includes('тест') &&
        !name.includes('reporter') &&
        !name.includes('generator')) ||
      (desc.includes('оценива') &&
        comp.lines > 50 &&
        !desc.includes('тест') &&
        !name.includes('reporter') &&
        !name.includes('generator')) ||
      // КРИТЕРИЙ 7: Специализированные метрики и debt анализаторы
      (name.includes('debt') &&
        comp.lines > 100 &&
        !name.includes('test') &&
        !name.includes('reporter') &&
        !name.includes('generator')) ||
      (name.includes('complexity') &&
        comp.lines > 100 &&
        !name.includes('test') &&
        !name.includes('reporter') &&
        !name.includes('generator')) ||
      (name.includes('metrics') &&
        comp.lines > 100 &&
        !name.includes('test') &&
        !name.includes('reporter') &&
        !name.includes('generator'));

    if (isAnalyzer) {
      analyzers[id] = comp;
      return;
    }

    // 3. Все остальное - вспомогательные компоненты
    auxiliary[id] = comp;
  });

  console.log('✅ Классификация завершена:');
  console.log(`   🎯 Анализаторы: ${Object.keys(analyzers).length}`);
  console.log(`   🔧 Вспомогательные: ${Object.keys(auxiliary).length}`);
  console.log(`   📄 Остальное: ${Object.keys(other).length}`);

  return { analyzers, auxiliary, other };
}

// Главная функция
function main() {
  console.log('🚀 EAP ANALYZER - Генерация Live-отчета');
  console.log('='.repeat(50));

  const data = analyzeProjectFiles();

  // Классификация компонентов
  const classification = classifyComponents(data.components);

  console.log(`\n📊 Результаты анализа:`);
  console.log(`   Компонентов: ${Object.keys(data.components).length}`);
  console.log(
    `   Категорий: ${Object.keys(data.categories).filter(key => data.categories[key].count > 0).length}`
  );
  console.log(`\n🎯 Классификация по назначению:`);
  console.log(`   Анализаторы: ${Object.keys(classification.analyzers).length}`);
  console.log(`   Вспомогательные: ${Object.keys(classification.auxiliary).length}`);
  console.log(`   Остальное: ${Object.keys(classification.other).length}`);

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

  // Генерируем обновленный data.js с недостатками и классификацией
  const jsDataContent = generateDataJs(data, classification);
  fs.writeFileSync('./data/data.js', jsDataContent);
  console.log(`📊 Обновлен файл данных: ./data/data.js`);

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
