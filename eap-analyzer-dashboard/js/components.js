// Components Data Structure для EAP Analyzer Dashboard
const EAP_COMPONENTS_DATA = {
  categories: {
    testing: {
      name: 'Testing',
      icon: 'bi-check-circle',
      color: '#28a745',
      description: 'Тестирование и контроль качества',
    },
    security: {
      name: 'Security',
      icon: 'bi-shield-check',
      color: '#dc3545',
      description: 'Безопасность и анализ угроз',
    },
    performance: {
      name: 'Performance',
      icon: 'bi-speedometer2',
      color: '#ffc107',
      description: 'Производительность и оптимизация',
    },
    docker: {
      name: 'Docker',
      icon: 'bi-box',
      color: '#17a2b8',
      description: 'Контейнеризация и развертывание',
    },
    core: {
      name: 'Core',
      icon: 'bi-gear',
      color: '#6c757d',
      description: 'Базовые компоненты системы',
    },
    ai: {
      name: 'AI',
      icon: 'bi-robot',
      color: '#e83e8c',
      description: 'Искусственный интеллект',
    },
  },

  components: {
    UnifiedTestingAnalyzer: {
      name: 'UnifiedTestingAnalyzer',
      category: 'testing',
      logic: 90,
      functionality: 85,
      file: 'eap-analyzer/UnifiedTestingAnalyzer.cjs',
      description: 'Комплексный анализ тестирования проекта',
      tests: '15 тестов',
      lastModified: '2025-09-11',
    },
    EnhancedJestChecker: {
      name: 'EnhancedJestChecker',
      category: 'testing',
      logic: 95,
      functionality: 92,
      file: 'eap-analyzer/EnhancedJestChecker.cjs',
      description: 'Углубленный анализ Jest конфигурации',
      tests: '12 тестов',
      lastModified: '2025-09-11',
    },
    AdvancedSecurityAnalyzer: {
      name: 'AdvancedSecurityAnalyzer',
      category: 'security',
      logic: 92,
      functionality: 88,
      file: 'eap-analyzer/AdvancedSecurityAnalyzer.js',
      description: 'Продвинутый анализ безопасности',
      tests: '20 тестов',
      lastModified: '2025-09-11',
    },
    PerformanceChecker: {
      name: 'PerformanceChecker',
      category: 'performance',
      logic: 85,
      functionality: 80,
      file: 'eap-analyzer/PerformanceChecker.js',
      description: 'Анализ производительности приложения',
      tests: '8 тестов',
      lastModified: '2025-09-11',
    },
    DockerAnalyzer: {
      name: 'DockerAnalyzer',
      category: 'docker',
      logic: 82,
      functionality: 78,
      file: 'eap-analyzer/DockerAnalyzer.js',
      description: 'Анализ Docker конфигураций',
      tests: '6 тестов',
      lastModified: '2025-09-11',
    },
    AIInsights: {
      name: 'AIInsights',
      category: 'ai',
      logic: 88,
      functionality: 85,
      file: 'eap-analyzer/ai-insights/index.js',
      description: 'ИИ аналитика и инсайты',
      tests: '10 тестов',
      lastModified: '2025-09-11',
    },
    orchestrator: {
      name: 'orchestrator',
      category: 'core',
      logic: 88,
      functionality: 85,
      file: 'eap-analyzer/orchestrator.js',
      description: 'Главный оркестратор системы',
      tests: '18 тестов',
      lastModified: '2025-09-11',
    },
    analyzer: {
      name: 'analyzer',
      category: 'core',
      logic: 85,
      functionality: 80,
      file: 'eap-analyzer/analyzer.js',
      description: 'Базовый анализатор',
      tests: '14 тестов',
      lastModified: '2025-09-11',
    },
  },

  // История изменений
  history: {
    '2025-09-11': {
      avgLogic: 87.0,
      avgFunctionality: 83.6,
      totalComponents: 8,
      changes: ['Обновлены метрики готовности', 'Добавлен AIInsights'],
    },
    '2025-09-10': {
      avgLogic: 85.5,
      avgFunctionality: 81.2,
      totalComponents: 7,
      changes: ['Улучшен AdvancedSecurityAnalyzer', 'Исправлены тесты'],
    },
  },

  // Утилиты для работы с данными
  utils: {
    getCategoryStats: function (categoryKey) {
      const components = Object.values(this.components || {}).filter(
        comp => comp.category === categoryKey
      );

      if (components.length === 0) {
        return { count: 0, avgLogic: 0, avgFunctionality: 0 };
      }

      const totalLogic = components.reduce((sum, comp) => sum + comp.logic, 0);
      const totalFunctionality = components.reduce((sum, comp) => sum + comp.functionality, 0);

      return {
        count: components.length,
        avgLogic: totalLogic / components.length,
        avgFunctionality: totalFunctionality / components.length,
      };
    },

    getComponentsByCategory: function (categoryKey) {
      return Object.values(this.components || {}).filter(comp => comp.category === categoryKey);
    },

    getTopComponents: function (limit = 5) {
      return Object.values(this.components || {})
        .sort((a, b) => {
          const overallA = (a.logic + a.functionality) / 2;
          const overallB = (b.logic + b.functionality) / 2;
          return overallB - overallA;
        })
        .slice(0, limit);
    },

    getOverallStats: function () {
      const components = Object.values(this.components || {});
      if (components.length === 0) {
        return { avgLogic: 0, avgFunctionality: 0, total: 0 };
      }

      const totalLogic = components.reduce((sum, comp) => sum + comp.logic, 0);
      const totalFunctionality = components.reduce((sum, comp) => sum + comp.functionality, 0);

      return {
        avgLogic: totalLogic / components.length,
        avgFunctionality: totalFunctionality / components.length,
        total: components.length,
      };
    },

    getComponentStatus: function (logic, functionality) {
      const avg = (logic + functionality) / 2;
      if (avg >= 90) return 'excellent';
      if (avg >= 80) return 'good';
      if (avg >= 70) return 'average';
      return 'poor';
    },
  },
};

// Привязываем утилиты к данным
EAP_COMPONENTS_DATA.utils.components = EAP_COMPONENTS_DATA.components;

// Глобальный доступ к данным
window.EAP_DATA = EAP_COMPONENTS_DATA;
