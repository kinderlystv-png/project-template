/**
 * Генератор рекомендаций по улучшению структуры проекта
 * Создает детальные рекомендации на основе результатов анализа
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../config.json');

/**
 * Класс для генерации рекомендаций
 */
export class RecommendationGenerator {
  constructor(core) {
    this.core = core;
  }

  /**
   * Генерирует рекомендации на основе результатов анализа
   */
  generateRecommendations(basicResults, advancedResults) {
    console.log('[RecommendationGenerator] Генерация рекомендаций...');

    // Если включено обучение, используем машинное обучение
    if (this.core.config.enableLearning) {
      const patterns = basicResults.patterns || [];
      return this.core.learningSystem.getRecommendations(patterns, basicResults, advancedResults);
    }

    // Иначе используем статические правила
    return this.generateStaticRecommendations(basicResults, advancedResults);
  }

  /**
   * Генерирует статические рекомендации (когда обучение отключено)
   */
  generateStaticRecommendations(basicResults, advancedResults) {
    const recommendations = [];

    // Рекомендации по структуре проекта
    this.addStructureRecommendations(recommendations, basicResults);

    // Рекомендации по качеству кода
    this.addQualityRecommendations(recommendations, basicResults, advancedResults);

    // Рекомендации по архитектуре
    this.addArchitectureRecommendations(recommendations, basicResults, advancedResults);

    // Рекомендации по тестированию
    this.addTestingRecommendations(recommendations, basicResults);

    // Рекомендации по документации
    this.addDocumentationRecommendations(recommendations, basicResults);

    return recommendations;
  }

  /**
   * Добавляет рекомендации по структуре проекта
   */
  addStructureRecommendations(recommendations, basicResults) {
    // Проверка организации файлов
    if (basicResults.totalFiles > 50 && !basicResults.directoryStructure?.src) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        title: 'Организуйте код в src/ директории',
        description: 'Для больших проектов рекомендуется четкая структура каталогов',
        details: 'Создайте директорию src/ и перенесите туда основной код проекта',
        effort: '2-4 часа',
        impact: 'Улучшение навигации и поддерживаемости кода',
      });
    }

    // Проверка глубины вложенности
    if (basicResults.maxDirectoryDepth > 6) {
      recommendations.push({
        type: 'structure',
        priority: 'low',
        title: 'Упростите структуру директорий',
        description: `Максимальная глубина вложенности: ${basicResults.maxDirectoryDepth}`,
        details: 'Рассмотрите возможность уменьшения глубины вложенности директорий',
        effort: '1-2 часа',
        impact: 'Упрощение навигации по проекту',
      });
    }

    // Проверка больших файлов
    if (basicResults.largeFiles && basicResults.largeFiles.length > 0) {
      recommendations.push({
        type: 'refactoring',
        priority: 'high',
        title: 'Разбейте большие файлы на модули',
        description: `Найдено ${basicResults.largeFiles.length} файлов размером >1000 строк`,
        files: basicResults.largeFiles.map(f => f.path),
        details: 'Большие файлы сложно поддерживать и тестировать',
        effort: '4-8 часов на файл',
        impact: 'Значительное улучшение читаемости и поддерживаемости',
      });
    }
  }

  /**
   * Добавляет рекомендации по качеству кода
   */
  addQualityRecommendations(recommendations, basicResults, advancedResults) {
    if (!advancedResults) return;

    // Индекс сопровождаемости
    if (advancedResults.avgMaintainabilityIndex < 60) {
      recommendations.push({
        type: 'refactoring',
        priority: 'high',
        title: 'Улучшите сопровождаемость кода',
        description: `Текущий индекс: ${advancedResults.avgMaintainabilityIndex.toFixed(1)}/100`,
        details: 'Упростите сложные функции, улучшите читаемость кода',
        effort: '8-16 часов',
        impact: 'Существенное снижение времени на разработку и отладку',
      });
    }

    // Дублирование кода
    if (advancedResults.duplicationPercentage > 10) {
      recommendations.push({
        type: 'refactoring',
        priority: 'medium',
        title: 'Устраните дублирование кода',
        description: `Найдено ${advancedResults.duplicationPercentage.toFixed(1)}% дублирования`,
        details: 'Выделите общую логику в отдельные функции или модули',
        effort: '4-8 часов',
        impact: 'Уменьшение количества ошибок и упрощение изменений',
      });
    }

    // Проблемные файлы (hotspots)
    if (advancedResults.hotspots && advancedResults.hotspots.length > 5) {
      recommendations.push({
        type: 'refactoring',
        priority: 'high',
        title: 'Отрефакторьте проблемные файлы',
        description: `Найдено ${advancedResults.hotspots.length} проблемных файлов`,
        files: advancedResults.hotspots.slice(0, 5).map(h => h.file),
        details: 'Файлы с высокой сложностью и частыми изменениями требуют рефакторинга',
        effort: '6-12 часов',
        impact: 'Снижение количества багов и ускорение разработки',
      });
    }

    // Циклическая сложность
    if (advancedResults.avgCyclomaticComplexity > 15) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Снизьте цикломатическую сложность',
        description: `Средняя сложность: ${advancedResults.avgCyclomaticComplexity.toFixed(1)}`,
        details: 'Разбейте сложные функции на более простые, используйте паттерны проектирования',
        effort: '6-10 часов',
        impact: 'Улучшение тестируемости и понимания кода',
      });
    }
  }

  /**
   * Добавляет рекомендации по архитектуре
   */
  addArchitectureRecommendations(recommendations, basicResults, advancedResults) {
    if (!advancedResults) return;

    // Связанность модулей
    if (advancedResults.coupling > 0.5) {
      recommendations.push({
        type: 'architecture',
        priority: 'medium',
        title: 'Уменьшите связанность модулей',
        description: `Текущий уровень связанности: ${advancedResults.coupling.toFixed(2)}`,
        details: 'Примените принципы SOLID, используйте dependency injection',
        effort: '8-16 часов',
        impact: 'Улучшение тестируемости и гибкости архитектуры',
      });
    }

    // Циклические зависимости
    if (advancedResults.circularDependencies && advancedResults.circularDependencies.length > 0) {
      recommendations.push({
        type: 'architecture',
        priority: 'high',
        title: 'Устраните циклические зависимости',
        description: `Найдено ${advancedResults.circularDependencies.length} циклов`,
        details:
          'Циклические зависимости усложняют тестирование и могут вызывать проблемы загрузки',
        effort: '4-8 часов',
        impact: 'Улучшение стабильности и производительности приложения',
      });
    }
  }

  /**
   * Добавляет рекомендации по тестированию
   */
  addTestingRecommendations(recommendations, basicResults) {
    if (basicResults.testFiles === 0) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Добавьте тесты',
        description: 'Проект не содержит тестовых файлов',
        details: 'Начните с unit-тестов для критически важных функций',
        effort: '16-32 часа',
        impact: 'Существенное повышение качества и надежности кода',
      });
    } else if (basicResults.testFiles < basicResults.totalFiles * 0.3) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Увеличьте покрытие тестами',
        description: `Тестовых файлов: ${basicResults.testFiles}/${basicResults.totalFiles}`,
        details: 'Добавьте тесты для некрытых компонентов',
        effort: '8-16 часов',
        impact: 'Повышение надежности и уверенности в изменениях',
      });
    }
  }

  /**
   * Добавляет рекомендации по документации
   */
  addDocumentationRecommendations(recommendations, basicResults) {
    if (basicResults.documentationFiles === 0) {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        title: 'Добавьте документацию',
        description: 'Отсутствуют файлы документации (README.md и т.д.)',
        details: 'Создайте README.md с описанием проекта, установки и использования',
        effort: '2-4 часа',
        impact: 'Улучшение понимания проекта новыми разработчиками',
      });
    }
  }

  /**
   * Генерирует быструю рекомендацию на основе общего балла
   */
  getQuickRecommendation(score) {
    if (score >= 85) {
      return {
        level: 'excellent',
        message: 'Отличная структура проекта! Продолжайте поддерживать качество.',
        actions: ['Регулярно проводите рефакторинг', 'Следите за метриками качества'],
      };
    } else if (score >= 70) {
      return {
        level: 'good',
        message: 'Хорошая структура с возможностями для улучшения.',
        actions: ['Устраните критические проблемы', 'Улучшите покрытие тестами'],
      };
    } else if (score >= 50) {
      return {
        level: 'needs_improvement',
        message: 'Структура требует значительных улучшений.',
        actions: ['Проведите рефакторинг больших файлов', 'Добавьте тесты', 'Улучшите архитектуру'],
      };
    } else {
      return {
        level: 'critical',
        message: 'Critical issues detected! Immediate refactoring needed.',
        actions: ['Срочный рефакторинг', 'Пересмотр архитектуры', 'Добавление тестов'],
      };
    }
  }
}

export default RecommendationGenerator;
