/**
 * 🧪 ТЕСТ РЕПОРТЕРОВ EAP ANALYZER v6.0
 * Тестирование MarkdownReporter и улучшенного HTMLReporter
 */

import { ReporterEngine } from '../src/reporters/ReporterEngine.js';
import type { ReportData } from '../src/reporters/types.js';

// Создаем тестовые данные
const testData: ReportData = {
  project: {
    name: 'Test Project',
    version: '1.0.0',
    description: 'Тестовый проект для демонстрации репортеров',
    author: 'EAP Analyzer Team',
    license: 'MIT',
    repository: 'https://github.com/test/test-project',
    homepage: 'https://test-project.com',
    keywords: ['test', 'demo', 'reporter'],
    dependencies: ['typescript', 'vite', 'svelte'],
    devDependencies: ['eslint', 'prettier', '@types/node'],
    scripts: ['build', 'dev', 'test', 'lint'],
    configFiles: ['package.json', 'tsconfig.json', 'vite.config.ts'],
    buildTools: ['vite', 'typescript'],
    testingFrameworks: ['vitest'],
    totalFiles: 156,
    totalLines: 8420,
    fileTypes: { ts: 45, js: 23, svelte: 12, json: 8, md: 3 }
  },

  summary: {
    totalReadiness: 72,
    categoriesCount: 4,
    componentsCount: 16,
    issuesCount: 8,
    recommendationsCount: 12,
    lastAnalyzed: new Date().toISOString(),
    analysisVersion: '6.0.0',
    configVersion: '2.1.0'
  },

  categories: [
    {
      id: 'security',
      name: 'Безопасность',
      readiness: 85,
      status: 'good',
      components: [
        {
          id: 'xss-protection',
          name: 'XSS Protection',
          readiness: 90,
          status: 'excellent',
          issues: [
            {
              id: 'xss-1',
              severity: 'medium',
              type: 'vulnerability',
              message: 'Найдено 2 потенциально уязвимых места использования innerHTML',
              file: 'src/components/UserContent.svelte',
              line: 45,
              recommendation: 'Использовать textContent вместо innerHTML'
            }
          ],
          recommendations: [
            {
              id: 'rec-xss-1',
              component: 'xss-protection',
              action: 'Добавить CSP заголовки',
              estimatedTime: '2 часа',
              impact: 'high',
              priority: 'high'
            }
          ],
          details: {
            filesAnalyzed: 45,
            linesOfCode: 2340,
            testsCount: 12,
            lastUpdated: new Date().toISOString(),
            dependencies: ['@types/dompurify', 'dompurify']
          }
        },
        {
          id: 'csrf-protection',
          name: 'CSRF Protection',
          readiness: 80,
          status: 'good',
          issues: [],
          recommendations: [],
          details: {
            filesAnalyzed: 23,
            linesOfCode: 1240,
            testsCount: 8,
            lastUpdated: new Date().toISOString(),
            dependencies: ['@sveltejs/kit']
          }
        }
      ]
    },
    {
      id: 'performance',
      name: 'Производительность',
      readiness: 68,
      status: 'warning',
      components: [
        {
          id: 'bundle-optimization',
          name: 'Bundle Optimization',
          readiness: 65,
          status: 'warning',
          issues: [
            {
              id: 'bundle-1',
              severity: 'low',
              type: 'optimization',
              message: 'Размер бандла можно уменьшить на 15%',
              file: 'vite.config.ts',
              line: 12,
              recommendation: 'Включить tree-shaking и минификацию'
            }
          ],
          recommendations: [],
          details: {
            filesAnalyzed: 156,
            linesOfCode: 8420,
            testsCount: 5,
            lastUpdated: new Date().toISOString(),
            dependencies: ['vite', 'rollup']
          }
        }
      ]
    }
  ],

  recommendations: [
    {
      id: 'global-rec-1',
      component: 'security',
      action: 'Внедрить систему безопасности на уровне архитектуры',
      estimatedTime: '1 неделя',
      impact: 'high',
      priority: 'high'
    },
    {
      id: 'global-rec-2',
      component: 'performance',
      action: 'Оптимизировать сборку и загрузку ресурсов',
      estimatedTime: '3 дня',
      impact: 'medium',
      priority: 'medium'
    }
  ],

  performance: {
    bundleSize: {
      total: 245000,
      gzipped: 78000,
      assets: [
        { name: 'index.js', size: 145000, gzipped: 45000 },
        { name: 'vendor.js', size: 100000, gzipped: 33000 }
      ]
    },
    buildTime: 2340,
    memoryUsage: 512000000
  },

  security: {
    vulnerabilities: [
      {
        id: 'vuln-1',
        severity: 'medium',
        type: 'xss',
        description: 'Потенциальная XSS уязвимость',
        file: 'src/lib/utils.ts',
        line: 23,
        cwe: 'CWE-79'
      }
    ],
    securityScore: 85,
    cspStatus: 'implemented',
    httpsStatus: 'enforced',
    authenticationStatus: 'strong',
    dataProtectionStatus: 'compliant'
  },

  testing: {
    coverage: {
      lines: 78,
      functions: 82,
      branches: 65,
      statements: 76
    },
    testResults: {
      total: 156,
      passed: 148,
      failed: 3,
      skipped: 5,
      duration: 12340
    },
    testFiles: [
      { name: 'security.test.ts', tests: 45, passed: 43, failed: 2 },
      { name: 'performance.test.ts', tests: 23, passed: 23, failed: 0 }
    ],
    mockingStatus: 'comprehensive',
    e2eStatus: 'basic'
  },

  metadata: {
    generatedAt: new Date().toISOString(),
    generator: 'EAP Analyzer v6.0',
    version: '1.0.0',
    format: 'standard',
    locale: 'ru-RU'
  }
};

// Основная функция тестирования
async function testReporters() {
  console.log('🧪 Начинаем тестирование репортеров...\n');

  try {
    const engine = new ReporterEngine();

    // Тест MarkdownReporter
    console.log('📝 Тестируем MarkdownReporter...');
    const markdownReport = await engine.generateReport(testData, 'markdown');
    console.log('✅ MarkdownReporter работает! Длина отчета:', markdownReport.length, 'символов');

    // Сохраняем Markdown отчет
    const fs = await import('fs/promises');
    await fs.writeFile('./test-report.md', markdownReport, 'utf-8');
    console.log('💾 Markdown отчет сохранен в test-report.md');

    // Тест HTMLReporter
    console.log('\n🌐 Тестируем HTMLReporter...');
    const htmlReport = await engine.generateReport(testData, 'html');
    console.log('✅ HTMLReporter работает! Длина отчета:', htmlReport.length, 'символов');

    // Сохраняем HTML отчет
    await fs.writeFile('./test-report.html', htmlReport, 'utf-8');
    console.log('💾 HTML отчет сохранен в test-report.html');

    console.log('\n🎉 Все тесты прошли успешно!');
    console.log('\n📋 Краткий обзор функций:');
    console.log('  • MarkdownReporter: Структурированная документация с эмодзи и таблицами');
    console.log('  • HTMLReporter: Интерактивный отчет с темной темой, поиском и фильтрацией');
    console.log('  • Поддержка keyboard shortcuts: Ctrl+F (поиск), Ctrl+D (смена темы)');
    console.log('  • Адаптивный дизайн и анимации');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    process.exit(1);
  }
}

// Запускаем тесты
if (import.meta.url === `file://${process.argv[1]}`) {
  testReporters();
}
