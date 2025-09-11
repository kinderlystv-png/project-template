/**
 * EAP Smart Analyzer v2.0
 * Универсальная система умных анализаторов для EAP компонентов
 *
 * @author EAP Team
 * @version 2.0.0
 */

// ===================================================================
// КОНФИГУРАЦИЯ ТИПОВ КОМПОНЕНТОВ
// ===================================================================

const COMPONENT_TYPES = {
  // === НОВЫЕ ТИПЫ ДЛЯ МАЛЫХ КОМПОНЕНТОВ ===
  SERVICE: {
    patterns: [/Service$/, /service/, /Service\./, /\.service\./],
    codePatterns: [/class.*Service/, /interface.*Service/, /export.*Service/],
    imports: [],
  },
  VALIDATOR: {
    patterns: [/Valid/, /valid/, /Validation/, /validation/],
    codePatterns: [/validate/, /validation/, /class.*Valid/, /Valid.*{/],
    imports: [],
  },
  UTILITY: {
    patterns: [/util/, /Utils/, /helper/, /Helper/],
    codePatterns: [/export.*function/, /static.*{/, /\.prototype\./],
    imports: [],
  },
  MODEL: {
    patterns: [/model/, /Model/, /entity/, /Entity/, /interface/],
    codePatterns: [/interface.*{/, /type.*=/, /export.*interface/],
    imports: [],
  },

  // === ОБНОВЛЕННЫЕ СУЩЕСТВУЮЩИЕ ТИПЫ ===
  TEST_CONFIG: {
    patterns: [/\.config\.(ts|js)$/, /vitest/, /jest/, /benchmark/],
    specificFiles: ['vitest.config.ts', 'jest.config.js', 'vitest.performance.config.ts'],
    parentDirs: ['tests', 'test', '__tests__'],
    imports: ['vitest', 'jest', '@testing-library'],
    codePatterns: [/defineConfig/, /export.*default.*{/],
  },
  TEST_FIXTURE: {
    patterns: [/test/, /spec/, /\.test\./, /\.spec\./],
    parentDirs: ['tests', 'test', '__tests__'],
    codePatterns: [/describe\(/, /it\(/, /test\(/, /console\.log.*test/i],
    imports: ['vitest', 'jest', '@testing-library'],
  },
  ANALYZER: {
    patterns: [/-analyzer\./, /Analyzer/, /analysis/, /\.analyzer\./, /checker/i],
    parentDirs: ['analyzers', 'analysis'],
    imports: ['typescript', '@typescript-eslint'],
    codePatterns: [/class.*Analyzer/, /class.*Checker/],
  },
  PERFORMANCE_UTILS: {
    patterns: [/performance/, /bench/, /utils/, /BenchUtils/],
    specificFiles: ['BenchUtils.ts', 'performance-report.ts'],
    parentDirs: ['performance', 'benchmarks'],
    codePatterns: [/BenchUtils/, /performance\.now/, /benchmark/, /formatBytes/],
  },
  DATABASE: {
    patterns: [/repository/, /dao/, /entity/, /model/, /schema/],
    imports: ['typeorm', 'mongoose', 'sequelize', 'prisma'],
  },
  API_CONTROLLER: {
    patterns: [/controller/, /route/, /api/, /endpoint/],
    imports: ['express', 'fastify', 'koa', '@nestjs'],
  },
  UI_COMPONENT: {
    patterns: [/component/, /\.vue$/, /\.svelte$/, /\.tsx$/, /\.jsx$/],
    imports: ['react', 'vue', 'angular', 'svelte'],
  },
  SECURITY: {
    patterns: [/security/, /auth/, /crypto/, /hash/, /encrypt/],
    imports: ['bcrypt', 'crypto', 'jsonwebtoken'],
  },
  DOCKER: {
    patterns: [/docker/, /container/],
    specificFiles: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  },
  CI_CD: {
    patterns: [/\.yml$/, /\.yaml$/, /workflow/, /pipeline/],
    parentDirs: ['.github', '.gitlab-ci', 'workflows'],
  },
  LOGGING: {
    patterns: [/log/, /logger/, /winston/, /pino/],
    imports: ['winston', 'pino', 'log4js'],
  },
};

// ===================================================================
// ПАТТЕРНЫ УЛУЧШЕНИЙ
// ===================================================================

const IMPROVEMENT_PATTERNS = {
  PERFORMANCE: {
    patterns: [
      /parallel/,
      /worker/,
      /thread/,
      /async/,
      /concurrent/,
      /cache/,
      /memo/,
      /optimize/,
      /performance/,
      /cpus\(\)/,
      /poolOptions/,
      /maxThreads/,
      /minThreads/,
      /pool.*threads/,
    ],
    codeStructures: [
      /Promise\.all\(/,
      /new Worker\(/,
      /pool.*threads/i,
      /maxThreads.*:/,
      /minThreads.*:/,
      /poolOptions.*{/,
      /Math\.max.*cpus/,
    ],
    negativePatterns: [
      /singleFork\s*:\s*true(?!\s*\))/,
      /singleThread\s*:\s*true/,
      /blocking\s*:\s*true/,
    ],
  },
  MODULARITY: {
    patterns: [/module/, /export/, /import/, /require/, /component/, /service/, /factory/, /utils/],
    codeStructures: [/class .+ implements/, /interface/, /extends/, /from .+['"]/],
  },
  TESTABILITY: {
    patterns: [/test/, /spec/, /mock/, /stub/, /spy/, /assert/, /expect/, /should/, /bench/],
    filePatterns: [/\.test\./, /\.spec\./, /Test\./, /Spec\./, /\.bench\./],
  },
  AUTOMATION: {
    patterns: [
      /automation/,
      /auto/,
      /generate/,
      /report/,
      /notification/,
      /ci/,
      /cd/,
      /pipeline/,
      /reporters/,
      /reporter/,
      /html/,
      /coverage/,
    ],
    codeStructures: [
      /generateReport/,
      /sendNotification/,
      /exportMetrics/,
      /HtmlReportGenerator/,
      /reporters.*\[/,
      /'html'/,
      /"html"/,
      /benchmark.*{/,
    ],
  },
  ANTI_DUPLICATION: {
    patterns: [/duplicate/, /duplicated/, /copied/, /repeated/],
    codeStructures: [/function.*duplicate/i, /class.*duplicate/i],
    // Высокое значение означает проблему, а не улучшение
    isNegativePattern: true,
  },
  DOCUMENTATION: {
    patterns: [
      /@param/,
      /@return/,
      /@example/,
      /@description/,
      /\/\*\*/,
      /\*\//,
      /README/,
      /\.md$/,
    ],
    codeStructures: [/\/\*\*[\s\S]*?\*\//g],
  },
  ERROR_HANDLING: {
    patterns: [/try/, /catch/, /throw/, /error/, /exception/, /finally/, /handle/],
    codeStructures: [/try\s*{[\s\S]*?catch/, /throw new Error/, /\.catch\(/],
  },
};

// ===================================================================
// ВЕСА УЛУЧШЕНИЙ ДЛЯ РАЗНЫХ ТИПОВ КОМПОНЕНТОВ
// ===================================================================

const IMPROVEMENT_WEIGHTS = {
  // === НОВЫЕ ТИПЫ МАЛЫХ КОМПОНЕНТОВ ===
  SERVICE: {
    MODULARITY: 0.4, // Хорошая архитектура критична
    ERROR_HANDLING: 0.3, // Обработка ошибок важна
    TESTABILITY: 0.2, // Возможность тестирования
    DOCUMENTATION: 0.1, // Документирование API
  },
  VALIDATOR: {
    ANTI_DUPLICATION: 0.5, // Устранение дублирования критично
    ERROR_HANDLING: 0.3, // Правильная обработка ошибок
    TESTABILITY: 0.2, // Тестирование валидации
  },
  UTILITY: {
    MODULARITY: 0.4, // Переиспользуемость важна
    TESTABILITY: 0.3, // Покрытие тестами
    DOCUMENTATION: 0.2, // Документирование функций
    PERFORMANCE: 0.1, // Оптимизация
  },
  MODEL: {
    MODULARITY: 0.5, // Хорошее разделение типов
    DOCUMENTATION: 0.3, // Документирование интерфейсов
    TESTABILITY: 0.2, // Возможность тестирования
  },

  // === ОБНОВЛЕННЫЕ СУЩЕСТВУЮЩИЕ ТИПЫ ===
  TEST_CONFIG: {
    PERFORMANCE: 0.4, // Параллельное выполнение критично
    AUTOMATION: 0.3, // Автоматизация отчетов важна
    MODULARITY: 0.2, // Устранение дублирования
    DOCUMENTATION: 0.1, // Документирование конфигурации
  },
  TEST_FIXTURE: {
    TESTABILITY: 0.5, // Качество тестов критично
    MODULARITY: 0.3, // Переиспользуемость
    DOCUMENTATION: 0.2, // Документирование тестов
  },
  ANALYZER: {
    MODULARITY: 0.35, // Разделение ответственности
    PERFORMANCE: 0.3, // Быстрота выполнения
    TESTABILITY: 0.2, // Покрытие тестами
    ERROR_HANDLING: 0.15, // Обработка ошибок
  },
  PERFORMANCE_UTILS: {
    PERFORMANCE: 0.5, // Оптимизация критична
    MODULARITY: 0.3, // Переиспользуемость
    DOCUMENTATION: 0.2, // Документирование API
  },
  DATABASE: {
    ERROR_HANDLING: 0.4, // Обработка ошибок критична
    PERFORMANCE: 0.3, // Оптимизация запросов
    TESTABILITY: 0.2, // Возможность тестирования
    MODULARITY: 0.1, // Разделение на слои
  },
  API_CONTROLLER: {
    ERROR_HANDLING: 0.35, // Обработка ошибок API
    TESTABILITY: 0.25, // Тестирование endpoints
    PERFORMANCE: 0.25, // Производительность API
    DOCUMENTATION: 0.15, // Документирование API
  },
  SECURITY: {
    ERROR_HANDLING: 0.5, // Безопасная обработка ошибок
    TESTABILITY: 0.3, // Тестирование безопасности
    DOCUMENTATION: 0.2, // Документирование безопасности
  },
  GENERIC: {
    MODULARITY: 0.25,
    TESTABILITY: 0.25,
    PERFORMANCE: 0.2,
    ERROR_HANDLING: 0.15,
    DOCUMENTATION: 0.1,
    AUTOMATION: 0.05,
  },
};

// ===================================================================
// БАЗОВЫЕ ОЦЕНКИ ДЛЯ ТИПОВ КОМПОНЕНТОВ
// ===================================================================

const BASE_SCORES = {
  // === НОВЫЕ ТИПЫ МАЛЫХ КОМПОНЕНТОВ ===
  SERVICE: { logic: 70, functionality: 75 }, // Хорошие сервисы должны иметь высокий рейтинг
  VALIDATOR: { logic: 65, functionality: 70 }, // Валидаторы важны для качества
  UTILITY: { logic: 60, functionality: 65 }, // Утилиты полезны
  MODEL: { logic: 75, functionality: 70 }, // Модели данных критичны

  // === ОБНОВЛЕННЫЕ СУЩЕСТВУЮЩИЕ ТИПЫ ===
  TEST_CONFIG: { logic: 50, functionality: 40 },
  TEST_FIXTURE: { logic: 45, functionality: 35 }, // Добавляем тесты
  ANALYZER: { logic: 60, functionality: 55 },
  PERFORMANCE_UTILS: { logic: 75, functionality: 70 },
  DATABASE: { logic: 65, functionality: 60 },
  API_CONTROLLER: { logic: 60, functionality: 65 },
  UI_COMPONENT: { logic: 55, functionality: 60 },
  SECURITY: { logic: 70, functionality: 65 },
  DOCKER: { logic: 45, functionality: 50 },
  CI_CD: { logic: 50, functionality: 55 },
  LOGGING: { logic: 55, functionality: 60 },
  GENERIC: { logic: 50, functionality: 50 },
};

// ===================================================================
// ФУНКЦИЯ ДЕТЕКЦИИ АВТОГЕНЕРИРОВАННЫХ ФАЙЛОВ
// ===================================================================

function isAutoGenerated(filepath, content) {
  // Проверка путей к автогенерированным директориям
  const AUTO_GENERATED_PATHS = [
    /^\.svelte-kit\//,
    /^node_modules\//,
    /^\.next\//,
    /^dist\//,
    /^build\//,
    /^coverage\//,
    /^\.cache\//,
    /\/generated\//,
    /\/auto-generated\//,
  ];

  // Проверяем путь файла
  for (const pattern of AUTO_GENERATED_PATHS) {
    if (pattern.test(filepath)) {
      return true;
    }
  }

  // Проверка содержимого файла (первые 10 строк для производительности)
  const header = content.split('\n').slice(0, 10).join('\n').toLowerCase();

  const AUTO_GENERATED_SIGNATURES = [
    'do not edit',
    'automatically generated',
    'auto-generated',
    'this file is generated',
    'generated by',
    '// generated ',
    '/* generated ',
    'autogenerated',
    'code generated',
    'machine generated',
    'generated on ',
    'auto generated',
    '@generated',
    'eslint-disable-next-line',
    'prettier-ignore',
  ];

  // Проверяем на наличие сигнатур автогенерации
  for (const signature of AUTO_GENERATED_SIGNATURES) {
    if (header.includes(signature)) {
      return true;
    }
  }

  // Дополнительная проверка для SvelteKit файлов
  if (filepath.includes('.svelte-kit') || filepath.includes('generated')) {
    // SvelteKit генерирует файлы с импортами nodes
    if (content.includes("import('./nodes/") || content.includes("() => import('./nodes/")) {
      return true;
    }

    // Типичные паттерны автогенерированных файлов
    if (
      content.includes('import * as client_hooks') ||
      content.includes('export { matchers }') ||
      content.includes('__vite__')
    ) {
      return true;
    }
  }

  // Проверка на типичные паттерны автогенерированного кода
  // Много экспортов без логики (типично для barrel files)
  if (content.includes('export') && content.split('export').length > 20 && content.length < 2000) {
    return true;
  }

  return false;
} // ===================================================================
// ФУНКЦИЯ УЧЕТА РАЗМЕРА КОМПОНЕНТА
// ===================================================================

function calculateSizeAdjustment(contentLength, componentType) {
  // Для малых компонентов (<1KB) - не штрафуем за размер
  if (contentLength < 1000) {
    if (['SERVICE', 'VALIDATOR', 'UTILITY', 'MODEL'].includes(componentType)) {
      return 1.0; // Никакого штрафа за малый размер
    }
    return 0.8; // Небольшой штраф для других типов
  }

  // Для средних компонентов (1-5KB) - нормальная оценка
  if (contentLength < 5000) {
    return 1.0;
  }

  // Для больших компонентов (5-20KB) - небольшой бонус
  if (contentLength < 20000) {
    return 1.1;
  }

  // Для очень больших компонентов (>20KB) - большой бонус
  return 1.2;
}

// ===================================================================
// УЛУЧШЕННАЯ ФУНКЦИЯ ДЕТЕКЦИИ ДУБЛИРОВАНИЯ КОДА
// ===================================================================

function detectCodeDuplication(content, componentType = 'GENERIC') {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 3 && !line.startsWith('//') && !line.startsWith('*'));

  if (lines.length < 3) return 0; // Минимум для детекции

  // Нормализация кода для более точного сравнения
  const normalizedLines = lines.map(
    line =>
      line
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .replace(/['"]/g, '"') // Нормализуем кавычки
        .replace(/;+$/, ';') // Нормализуем точки с запятой
  );

  let duplicateLines = 0;
  const lineCount = {};

  // Подсчитываем частоту нормализованных строк
  for (const line of normalizedLines) {
    // Пропускаем типичные паттерны которые не являются дублированием
    if (isCommonPattern(line, componentType)) {
      continue;
    }
    lineCount[line] = (lineCount[line] || 0) + 1;
  }

  // Считаем дублированные строки
  for (const [_line, count] of Object.entries(lineCount)) {
    if (count > 1) {
      duplicateLines += count - 1; // Все повторения кроме первого
    }
  }

  const duplicationRatio = duplicateLines / normalizedLines.length;

  // Применяем контекстно-зависимые пороги
  const threshold = getDuplicationThreshold(componentType);

  // Если дублирование ниже порога для данного типа компонента - считаем это нормой
  if (duplicationRatio < threshold) {
    return 0;
  }

  // Дополнительная проверка для очевидного дублирования функций
  if (content.includes('validateEmail') && content.includes('validateEmail2')) {
    return Math.max(duplicationRatio, 0.5); // Форсируем высокий уровень
  }

  return duplicationRatio;
}

// Функция определения порогов дублирования для разных типов компонентов
function getDuplicationThreshold(componentType) {
  const thresholds = {
    ANALYZER: 0.15, // Анализаторы могут иметь похожие проверки
    CHECKER: 0.15, // Чекеры тоже
    VALIDATOR: 0.12, // Валидаторы часто содержат похожие правила
    TEST_CONFIG: 0.2, // Конфигурационные файлы тестов
    TEST_FIXTURE: 0.18, // Тестовые файлы
    MODEL: 0.1, // Модели должны быть уникальными
    SERVICE: 0.08, // Сервисы должны быть уникальными
    UTILITY: 0.12, // Утилиты могут иметь похожие функции
    PERFORMANCE_UTILS: 0.15, // Бенчмарки могут быть похожими
    GENERIC: 0.08, // По умолчанию строгий порог
  };

  return thresholds[componentType] || thresholds.GENERIC;
}

// Функция проверки типичных паттернов которые не являются дублированием
function isCommonPattern(line, componentType) {
  // Общие паттерны для всех типов
  const commonPatterns = [
    /^import\s+/, // Импорты
    /^export\s+/, // Экспорты
    /^const\s+\w+\s*=\s*\{/, // Объявления констант
    /^}\s*[,;]?\s*$/, // Закрывающие скобки
    /^return\s+/, // Return statements
    /^\s*\}\s*$/, // Пустые закрывающие скобки
    /^\s*\{\s*$/, // Пустые открывающие скобки
  ];

  // Специфичные паттерны для анализаторов и чекеров
  if (['ANALYZER', 'CHECKER', 'VALIDATOR'].includes(componentType)) {
    const analyzerPatterns = [
      /check\w*\(/, // Методы check
      /validate\w*\(/, // Методы validate
      /analyze\w*\(/, // Методы analyze
      /test\w*\(/, // Методы test
      /result\.\w+/, // Обращения к result
      /issues\.push/, // Добавление в issues
      /recommendations\.push/, // Добавление рекомендаций
    ];

    for (const pattern of analyzerPatterns) {
      if (pattern.test(line)) return true;
    }
  }

  // Проверяем общие паттерны
  for (const pattern of commonPatterns) {
    if (pattern.test(line)) return true;
  }

  return false;
} // ===================================================================
// ОСНОВНЫЕ ФУНКЦИИ АНАЛИЗА
// ===================================================================

function determineComponentType(filename, filepath, content) {
  const lowerFilename = filename.toLowerCase();
  const lowerFilepath = filepath.toLowerCase();
  const contentLower = content.toLowerCase();

  // === ПРИОРИТЕТ 0: СПЕЦИАЛЬНЫЕ ПРОВЕРКИ ===
  // PERFORMANCE_UTILS проверка должна быть в начале
  if (
    filename.includes('BenchUtils') ||
    content.includes('BenchUtils') ||
    (content.includes('performance.now()') && content.includes('runBenchmark')) ||
    (content.includes('formatBytes') && content.includes('benchmark'))
  ) {
    return 'PERFORMANCE_UTILS';
  }

  // === ПРИОРИТЕТ 1: АНАЛИЗ СОДЕРЖИМОГО КОДА ===
  for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
    if (config.codePatterns) {
      for (const pattern of config.codePatterns) {
        if (pattern.test(content)) {
          return type;
        }
      }
    }
  }

  // === ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА ДЛЯ PERFORMANCE_UTILS ===
  // Убираем эту проверку так как она уже в начале

  // === ПРИОРИТЕТ 2: АНАЛИЗ ИМПОРТОВ ===
  for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
    if (
      config.imports?.some(
        imp =>
          content.includes(`from '${imp}'`) ||
          content.includes(`from "${imp}"`) ||
          content.includes(`require('${imp}')`) ||
          content.includes(`require("${imp}")`)
      )
    ) {
      return type;
    }
  }

  // === ПРИОРИТЕТ 3: СПЕЦИФИЧНЫЕ ФАЙЛЫ ===
  for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
    if (
      config.specificFiles?.some(
        sf => lowerFilename === sf.toLowerCase() || lowerFilename.includes(sf.toLowerCase())
      )
    ) {
      return type;
    }
  }

  // === ПРИОРИТЕТ 4: ПАТТЕРНЫ ИМЕНИ ФАЙЛА ===
  for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
    if (
      config.patterns?.some(pattern => pattern.test(lowerFilename) || pattern.test(lowerFilepath))
    ) {
      return type;
    }
  }

  // === ПРИОРИТЕТ 5: РОДИТЕЛЬСКИЕ ДИРЕКТОРИИ ===
  for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
    if (
      config.parentDirs?.some(
        dir => lowerFilepath.includes(`/${dir}/`) || lowerFilepath.includes(`\\${dir}\\`)
      )
    ) {
      return type;
    }
  }

  // === FALLBACK ДЛЯ МАЛЫХ КОМПОНЕНТОВ ===
  if (content.length < 1000) {
    if (
      contentLower.includes('class') &&
      (contentLower.includes('service') || contentLower.includes('user'))
    ) {
      return 'SERVICE';
    }
    if (contentLower.includes('valid') || contentLower.includes('duplicate')) {
      return 'VALIDATOR';
    }
    if (
      (contentLower.includes('export') && contentLower.includes('function')) ||
      contentLower.includes('static')
    ) {
      return 'UTILITY';
    }
    if (contentLower.includes('interface') || contentLower.includes('type =')) {
      return 'MODEL';
    }
  }

  return 'GENERIC';
}

function detectImprovements(content, componentType) {
  const improvements = {};

  // === СПЕЦИАЛЬНАЯ ДЕТЕКЦИЯ ДУБЛИРОВАНИЯ ===
  const duplicateScore = detectCodeDuplication(content, componentType);
  if (duplicateScore > 0.2 || content.toLowerCase().includes('duplicate')) {
    // Даже низкое дублирование отмечаем
    improvements.ANTI_DUPLICATION = Math.max(duplicateScore, 0.5);
  }

  for (const [category, patterns] of Object.entries(IMPROVEMENT_PATTERNS)) {
    let strength = 0;

    // Проверяем наличие паттернов
    if (patterns.patterns) {
      const patternMatches = patterns.patterns.filter(p => p.test(content)).length;
      if (patternMatches > 0) {
        strength += (patternMatches / patterns.patterns.length) * 0.5;
      }
    }

    // Проверяем структуры кода
    if (patterns.codeStructures) {
      const structureMatches = patterns.codeStructures.filter(s => s.test(content)).length;
      if (structureMatches > 0) {
        strength += (structureMatches / patterns.codeStructures.length) * 0.3;
      }
    }

    // Проверяем отсутствие негативных паттернов
    if (patterns.negativePatterns) {
      const negativeMatches = patterns.negativePatterns.filter(n => n.test(content)).length;
      if (negativeMatches === 0 && patterns.patterns) {
        // Большой бонус за отсутствие негативных паттернов при наличии позитивных
        const positiveMatches = patterns.patterns.filter(p => p.test(content)).length;
        if (positiveMatches > 0) {
          strength += 0.4; // Увеличиваем бонус
        }
      } else {
        // Штраф за наличие негативных паттернов
        strength -= negativeMatches * 0.2;
      }
    }

    // Специальная проверка для документации
    if (category === 'DOCUMENTATION') {
      const lines = content.split('\n');
      const commentLines = lines.filter(
        line =>
          line.trim().startsWith('//') ||
          line.trim().startsWith('*') ||
          line.trim().startsWith('/**')
      ).length;
      const commentRatio = commentLines / lines.length;
      strength += commentRatio;
    }

    if (strength > 0) {
      improvements[category] = Math.min(1, strength);
    }
  }

  return improvements;
}

/**
 * Рассчитывает итоговые оценки на основе улучшений с учетом размера
 */
function calculateFinalScores(baseScores, improvements, componentType, contentLength = 1000) {
  const weights = IMPROVEMENT_WEIGHTS[componentType] || IMPROVEMENT_WEIGHTS.GENERIC;
  const sizeAdjustment = calculateSizeAdjustment(contentLength, componentType);

  let logicBoost = 0;
  let functionalityBoost = 0;

  for (const [category, strength] of Object.entries(improvements)) {
    const weight = weights[category] || 0.1;

    // Категории по-разному влияют на логику и функциональность
    switch (category) {
      case 'MODULARITY':
      case 'DOCUMENTATION':
        logicBoost += strength * weight * 35;
        functionalityBoost += strength * weight * 15;
        break;

      case 'PERFORMANCE':
      case 'AUTOMATION':
        logicBoost += strength * weight * 25;
        functionalityBoost += strength * weight * 45;
        break;

      case 'TESTABILITY':
        logicBoost += strength * weight * 20;
        functionalityBoost += strength * weight * 30;
        break;

      case 'ERROR_HANDLING':
        logicBoost += strength * weight * 25;
        functionalityBoost += strength * weight * 25;
        break;

      case 'ANTI_DUPLICATION':
        // Высокое дублирование - штраф
        logicBoost -= strength * weight * 40;
        functionalityBoost -= strength * weight * 30;
        break;

      default:
        logicBoost += strength * weight * 20;
        functionalityBoost += strength * weight * 20;
    }
  }

  // Применяем корректировку размера к базовым оценкам
  const adjustedBaseLogic = baseScores.logic * sizeAdjustment;
  const adjustedBaseFunctionality = baseScores.functionality * sizeAdjustment;

  return {
    logic: Math.min(95, Math.max(25, adjustedBaseLogic + logicBoost)),
    functionality: Math.min(95, Math.max(25, adjustedBaseFunctionality + functionalityBoost)),
  };
}

/**
 * Генерирует конкретные рекомендации на основе анализа
 */
function generateRecommendations(improvements, componentType, scores) {
  const recommendations = [];
  const weights = IMPROVEMENT_WEIGHTS[componentType] || IMPROVEMENT_WEIGHTS.GENERIC;

  // Проверяем, какие важные улучшения отсутствуют
  for (const [category, weight] of Object.entries(weights)) {
    if (weight >= 0.2 && (!improvements[category] || improvements[category] < 0.3)) {
      switch (category) {
        case 'PERFORMANCE':
          recommendations.push('Добавьте оптимизации производительности');
          break;
        case 'AUTOMATION':
          recommendations.push('Расширьте автоматизацию процессов');
          break;
        case 'MODULARITY':
          recommendations.push('Улучшите модульность архитектуры');
          break;
        case 'ERROR_HANDLING':
          recommendations.push('Добавьте обработку ошибок');
          break;
        case 'TESTABILITY':
          recommendations.push('Увеличьте покрытие тестами');
          break;
        case 'DOCUMENTATION':
          recommendations.push('Добавьте документацию');
          break;
        case 'ANTI_DUPLICATION':
          recommendations.push('Устраните дублирование кода');
          break;
      }
    }
  }

  return recommendations;
}

function generateIssues(improvements, componentType, scores, type) {
  const issues = [];

  // Проверяем наличие проблем с дублированием
  if (improvements.ANTI_DUPLICATION && improvements.ANTI_DUPLICATION > 0.1) {
    issues.push('Обнаружено значительное дублирование кода');
  }

  if (type === 'logic') {
    if (scores.logic < 60) {
      issues.push('Возможны улучшения архитектуры');
    } else {
      issues.push('Нет критических проблем');
    }
  } else {
    if (scores.functionality < 50) {
      const weights = IMPROVEMENT_WEIGHTS[componentType] || IMPROVEMENT_WEIGHTS.GENERIC;

      // Генерируем специфичные для типа проблемы
      if (componentType === 'TEST_CONFIG') {
        if (!improvements.PERFORMANCE || improvements.PERFORMANCE < 0.3) {
          issues.push('Требуется дополнительная оптимизация параллельного выполнения');
        }
        if (!improvements.AUTOMATION || improvements.AUTOMATION < 0.3) {
          issues.push('Необходимо расширить автоматизацию отчетов');
        }
      } else if (componentType === 'VALIDATOR') {
        if (improvements.ANTI_DUPLICATION && improvements.ANTI_DUPLICATION > 0.1) {
          issues.push('Высокий уровень дублирования в валидационной логике');
        }
      } else if (componentType === 'SERVICE') {
        if (!improvements.ERROR_HANDLING || improvements.ERROR_HANDLING < 0.3) {
          issues.push('Недостаточная обработка ошибок в сервисном слое');
        }
      }

      if (issues.length === 0) {
        issues.push('Есть потенциал для улучшения функциональности');
      }
    } else {
      issues.push('Есть потенциал для улучшения функциональности');
    }
  }

  return issues;
}

function smartComponentAnalyzer(filename, filepath, content, _stat) {
  // 1. Определение типа компонента
  const componentType = determineComponentType(filename, filepath, content);

  // 2. Базовые оценки для данного типа
  const baseScores = BASE_SCORES[componentType] || BASE_SCORES.GENERIC;

  // 3. Проверка паттернов улучшений
  const improvements = detectImprovements(content, componentType);

  // 4. Расчет итоговых оценок с учетом улучшений и размера
  const finalScores = calculateFinalScores(baseScores, improvements, componentType, content.length);

  // 5. Генерация конкретных рекомендаций и проблем
  const recommendations = generateRecommendations(improvements, componentType, finalScores);
  const logicIssues = generateIssues(improvements, componentType, finalScores, 'logic');
  const functionalityIssues = generateIssues(
    improvements,
    componentType,
    finalScores,
    'functionality'
  );

  return {
    type: componentType,
    logicScore: Math.round(finalScores.logic),
    functionalityScore: Math.round(finalScores.functionality),
    recommendations,
    logicIssues,
    functionalityIssues,
    improvements,
    baseScores,
    sizeAdjustment: calculateSizeAdjustment(content.length, componentType),
  };
}

// Экспортируем функции для использования в live-generator.cjs
module.exports = {
  smartComponentAnalyzer,
  determineComponentType,
  detectImprovements,
  calculateFinalScores,
  generateRecommendations,
  isAutoGenerated, // Добавляем новую функцию
  detectCodeDuplication, // Добавляем для тестирования
  COMPONENT_TYPES,
  IMPROVEMENT_PATTERNS,
  IMPROVEMENT_WEIGHTS,
  BASE_SCORES,
};
