/**
 * 🧪 ТЕСТ СИСТЕМЫ ОТЧЕТОВ EAP ANALYZER v6.0
 * Демонстрация работы HTML и Console репортеров
 */

import { ReporterEngine } from './ReporterEngine.js';
import { HTMLReporter } from './HTMLReporter.js';
import { ConsoleReporter } from './ConsoleReporter.js';
import type { ReportData } from './types.js';

// Создаем тестовые данные на основе реальных результатов EAP Analyzer
const createTestData = (): ReportData => {
  return {
    timestamp: new Date().toISOString(),
    projectPath: 'c:\\alphacore\\project-template',
    summary: {
      totalReadiness: 81,
      componentsCount: 8,
      issuesCount: 79,
      recommendationsCount: 54,
      criticalIssues: 3,
      status: 'good',
    },
    categories: [
      {
        name: 'Security',
        slug: 'security',
        readiness: 81,
        status: 'good',
        description: 'Анализ безопасности кода и конфигураций',
        components: [
          {
            name: 'XSS Protection',
            readiness: 85,
            status: 'excellent',
            issues: [
              {
                type: 'warning',
                severity: 'medium',
                message: 'Потенциальная XSS уязвимость в пользовательском вводе',
                file: 'src/components/UserInput.tsx',
                line: 42,
                rule: 'xss-detection',
                suggestion: 'Используйте dangerouslySetInnerHTML с осторожностью',
              },
            ],
            recommendations: [
              'Добавить санитизацию пользовательского ввода',
              'Использовать Content Security Policy',
            ],
            details: {
              filesAnalyzed: 127,
              linesOfCode: 15420,
              testsCount: 23,
              coverage: 78,
              lastUpdated: new Date().toISOString(),
              dependencies: ['react', 'dompurify'],
            },
          },
          {
            name: 'CSRF Protection',
            readiness: 77,
            status: 'good',
            issues: [
              {
                type: 'error',
                severity: 'high',
                message: 'Отсутствует CSRF токен в форме',
                file: 'src/components/ContactForm.tsx',
                line: 15,
                rule: 'csrf-protection',
                suggestion: 'Добавьте CSRF middleware',
              },
            ],
            recommendations: ['Реализовать CSRF middleware', 'Добавить валидацию токенов'],
            details: {
              filesAnalyzed: 89,
              linesOfCode: 12300,
              testsCount: 18,
              coverage: 65,
              lastUpdated: new Date().toISOString(),
              dependencies: ['express', 'csrf'],
            },
          },
        ],
      },
      {
        name: 'Testing',
        slug: 'testing',
        readiness: 88,
        status: 'excellent',
        description: 'Система тестирования и покрытие кода',
        components: [
          {
            name: 'Unit Tests',
            readiness: 92,
            status: 'excellent',
            issues: [],
            recommendations: ['Добавить больше edge cases', 'Улучшить покрытие утилит'],
            details: {
              filesAnalyzed: 156,
              linesOfCode: 8900,
              testsCount: 234,
              coverage: 92,
              lastUpdated: new Date().toISOString(),
              dependencies: ['vitest', '@testing-library/react'],
            },
          },
          {
            name: 'Integration Tests',
            readiness: 84,
            status: 'good',
            issues: [
              {
                type: 'warning',
                severity: 'low',
                message: 'Медленный тест API',
                file: 'tests/integration/api.test.ts',
                line: 67,
                rule: 'test-performance',
                suggestion: 'Оптимизировать запросы к API',
              },
            ],
            recommendations: ['Добавить моки для внешних API', 'Ускорить выполнение тестов'],
            details: {
              filesAnalyzed: 45,
              linesOfCode: 3200,
              testsCount: 67,
              coverage: 84,
              lastUpdated: new Date().toISOString(),
              dependencies: ['supertest', 'nock'],
            },
          },
        ],
      },
      {
        name: 'Performance',
        slug: 'performance',
        readiness: 25,
        status: 'critical',
        description: 'Производительность и оптимизация',
        components: [
          {
            name: 'Bundle Analysis',
            readiness: 30,
            status: 'critical',
            issues: [
              {
                type: 'error',
                severity: 'critical',
                message: 'Размер бандла превышает 1MB',
                file: 'dist/main.js',
                rule: 'bundle-size',
                suggestion: 'Используйте code splitting',
              },
              {
                type: 'warning',
                severity: 'high',
                message: 'Неиспользуемые зависимости',
                file: 'package.json',
                rule: 'unused-deps',
                suggestion: 'Удалите неиспользуемые пакеты',
              },
            ],
            recommendations: [
              'Реализовать code splitting',
              'Удалить неиспользуемые зависимости',
              'Добавить tree shaking',
            ],
            details: {
              filesAnalyzed: 89,
              linesOfCode: 25600,
              testsCount: 12,
              coverage: 45,
              lastUpdated: new Date().toISOString(),
              dependencies: ['webpack', 'webpack-bundle-analyzer'],
            },
          },
        ],
      },
    ],
    recommendations: [
      {
        id: 'rec-001',
        category: 'Performance',
        component: 'Bundle Analysis',
        priority: 'critical',
        title: 'Критически большой размер бандла',
        description:
          'Основной JavaScript бандл превышает 1MB, что критично влияет на время загрузки',
        action: 'Реализовать code splitting и lazy loading для маршрутов',
        estimatedTime: '2-3 дня',
        impact: 'Улучшение времени загрузки на 60%+',
      },
      {
        id: 'rec-002',
        category: 'Security',
        component: 'CSRF Protection',
        priority: 'high',
        title: 'Отсутствует CSRF защита',
        description: 'Формы не защищены от CSRF атак',
        action: 'Добавить CSRF middleware и токены',
        estimatedTime: '1 день',
        impact: 'Защита от межсайтовых атак',
      },
      {
        id: 'rec-003',
        category: 'Testing',
        component: 'Integration Tests',
        priority: 'medium',
        title: 'Медленные интеграционные тесты',
        description: 'Тесты API выполняются слишком долго',
        action: 'Добавить моки для внешних сервисов',
        estimatedTime: '0.5 дня',
        impact: 'Ускорение CI/CD на 40%',
      },
    ],
    performance: {
      bundleSize: {
        total: 1200000,
        gzipped: 350000,
        assets: [
          {
            name: 'main.js',
            size: 850000,
            gzipped: 250000,
            type: 'js',
          },
          {
            name: 'vendor.js',
            size: 300000,
            gzipped: 80000,
            type: 'js',
          },
          {
            name: 'styles.css',
            size: 50000,
            gzipped: 20000,
            type: 'css',
          },
        ],
      },
      buildTime: 45000,
      memoryUsage: 512000000,
      coreWebVitals: {
        lcp: 3.2,
        fid: 150,
        cls: 0.15,
        fcp: 2.1,
        ttfb: 800,
      },
    },
    security: {
      vulnerabilities: [
        {
          type: 'xss',
          severity: 'medium',
          file: 'src/components/UserInput.tsx',
          line: 42,
          description: 'Потенциальная XSS уязвимость',
          recommendation: 'Добавить санитизацию',
        },
      ],
      securityScore: 81,
      cspStatus: 'partial',
      httpsStatus: 'enabled',
      authenticationStatus: 'basic',
      dataProtectionStatus: 'gdpr-compliant',
    },
    testing: {
      coverage: {
        lines: 87,
        functions: 89,
        branches: 78,
        statements: 86,
      },
      testResults: {
        total: 301,
        passed: 296,
        failed: 3,
        skipped: 2,
        duration: 12500,
      },
      testFiles: [
        {
          path: 'src/components/__tests__/Button.test.tsx',
          tests: 15,
          passed: 15,
          failed: 0,
          coverage: 95,
        },
        {
          path: 'src/utils/__tests__/helpers.test.ts',
          tests: 23,
          passed: 22,
          failed: 1,
          coverage: 78,
        },
      ],
      mockingStatus: 'comprehensive',
      e2eStatus: 'basic',
    },
    metadata: {
      version: '6.0.0',
      analyzer: 'EAP-Analyzer',
      nodeVersion: process.version,
      os: process.platform,
      totalAnalysisTime: 15750,
      configUsed: 'eap.config.js',
    },
  };
};

// Основная функция для демонстрации
async function demonstrateReporting(): Promise<void> {
  console.log('🚀 Демонстрация EAP Analyzer v6.0 - Система отчетов');
  console.log('═'.repeat(60));

  // Создаем ReporterEngine
  const reporterEngine = new ReporterEngine();

  // Регистрируем репортеры
  reporterEngine.registerReporter('html', new HTMLReporter());
  reporterEngine.registerReporter('console', new ConsoleReporter());

  // Создаем тестовые данные
  const testData = createTestData();

  console.log('\\n📊 Генерируем отчеты...');

  try {
    // Генерируем консольный отчет
    console.log('\\n🖥️  Console Report:');
    console.log('─'.repeat(40));
    await reporterEngine.generateReport(testData, 'console');

    // Генерируем HTML отчет
    console.log('\\n📝 Генерируем HTML отчет...');
    const htmlOutput = await reporterEngine.generateReport(testData, 'html', {
      outputPath: './reports',
      theme: 'light',
      includeDetails: true,
      includeRecommendations: true,
    });

    console.log(`✅ HTML отчет создан: ${htmlOutput}`);

    // Показываем поддерживаемые форматы
    console.log('\\n🎯 Поддерживаемые форматы:', reporterEngine.getSupportedFormats());

    console.log('\\n🎉 Демонстрация завершена успешно!');
    console.log('\\n💡 Фаза 1 (Задача 1.1): Базовая архитектура отчетов - ГОТОВА');
    console.log('   ✅ ReporterEngine создан и работает');
    console.log('   ✅ HTMLReporter с интерактивными элементами работает');
    console.log('   ✅ ConsoleReporter для быстрого просмотра работает');
    console.log('   ✅ Типы и интерфейсы определены');
  } catch (error) {
    console.error('❌ Ошибка при генерации отчетов:', error);
  }
}

// Экспортируем для возможного использования
export { demonstrateReporting, createTestData };
