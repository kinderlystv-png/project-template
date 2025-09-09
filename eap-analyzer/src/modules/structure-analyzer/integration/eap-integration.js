/**
 * Интеграция анализатора структуры с ЭАП (Enterprise Analysis Platform)
 * Генерирует данные в формате, совместимом с ЭАП
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../config.json');
import path from 'path';

/**
 * Класс интеграции с ЭАП
 */
export class EAPIntegration {
  constructor(core, metricsCalculator) {
    this.core = core;
    this.metricsCalculator = metricsCalculator;
  }

  /**
   * Генерирует данные для интеграции с ЭАП
   */
  generateEAPIntegration(basicResults, advancedResults, recommendations) {
    const structureScore = this.metricsCalculator.calculateStructureScore(
      basicResults,
      advancedResults
    );
    const criticalIssues = recommendations.filter(r => r.priority === 'high').length;
    const maintainabilityMetrics = this.metricsCalculator.calculateMaintainabilityMetrics(
      basicResults,
      advancedResults
    );

    return {
      moduleInfo: {
        name: config.module.name,
        version: this.core.version,
        category: 'structure-analysis',
        integration: config.integration.eap,
      },

      // Основные показатели для ЭАП
      scores: {
        overall: structureScore,
        maintainability: Math.round(maintainabilityMetrics.overall),
        codeQuality: this.metricsCalculator.calculateCodeQuality(basicResults, advancedResults),
        testCoverage: this.metricsCalculator.estimateTestCoverage(basicResults),
        structuralComplexity: this.metricsCalculator.calculateStructuralComplexity(
          basicResults,
          advancedResults
        ),
      },

      // Влияние на общий балл ЭАП
      contributionToScore: config.integration.eap.scoreContribution,

      // Критические показатели
      criticalMetrics: {
        issuesCount: criticalIssues,
        needsRefactoring: criticalIssues > 0 || structureScore < 70,
        riskLevel: this.calculateRiskLevel(structureScore, criticalIssues),
        urgency: this.calculateUrgency(structureScore, advancedResults),
      },

      // Рекомендации в формате ЭАП
      recommendations: this.formatRecommendationsForEAP(recommendations),

      // Метрики поддерживаемости
      maintainability: {
        current: Math.round(maintainabilityMetrics.overall),
        target: 85,
        gap: Math.max(0, 85 - Math.round(maintainabilityMetrics.overall)),
        details: maintainabilityMetrics,
      },

      // Флаги для ЭАП
      flags: {
        wellStructured: structureScore >= 80,
        hasTests: basicResults.testFiles > 0,
        documented: basicResults.documentationFiles > 0,
        highComplexity: advancedResults?.avgCyclomaticComplexity > 15,
        highDuplication: advancedResults?.duplicationPercentage > 10,
        largeProcedures: basicResults.largeFiles?.length > 0,
        needsImmedateAction: criticalIssues > 3 || structureScore < 50,
      },

      // ROI анализ
      roi: this.metricsCalculator.calculateRefactoringROI(basicResults, advancedResults),

      // Временные метки
      analysis: {
        timestamp: new Date().toISOString(),
        analysisType: advancedResults ? 'full' : 'basic',
        executionTime: Date.now(),
        thresholdsUsed: this.core.getAnalysisThresholds(),
      },
    };
  }

  /**
   * Вычисляет уровень риска для проекта
   */
  calculateRiskLevel(structureScore, criticalIssues) {
    let riskScore = 0;

    // Риск от общего балла структуры
    if (structureScore < 50) riskScore += 40;
    else if (structureScore < 70) riskScore += 20;
    else if (structureScore < 85) riskScore += 10;

    // Риск от критических проблем
    riskScore += Math.min(40, criticalIssues * 8);

    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Вычисляет срочность действий
   */
  calculateUrgency(structureScore, advancedResults) {
    let urgencyScore = 0;

    // Срочность от общего балла
    if (structureScore < 40) urgencyScore += 50;
    else if (structureScore < 60) urgencyScore += 30;
    else if (structureScore < 75) urgencyScore += 15;

    // Срочность от показателей качества
    if (advancedResults) {
      if (advancedResults.avgMaintainabilityIndex < 50) urgencyScore += 30;
      if (advancedResults.duplicationPercentage > 20) urgencyScore += 20;
      if (advancedResults.hotspots?.length > 10) urgencyScore += 20;
    }

    if (urgencyScore >= 70) return 'IMMEDIATE';
    if (urgencyScore >= 40) return 'HIGH';
    if (urgencyScore >= 20) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Форматирует рекомендации для ЭАП
   */
  formatRecommendationsForEAP(recommendations) {
    return {
      total: recommendations.length,
      byPriority: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length,
      },
      byCategory: this.categorizeRecommendations(recommendations),
      actionItems: this.generateActionItems(recommendations),
      estimatedEffort: this.calculateTotalEffort(recommendations),
    };
  }

  /**
   * Категоризирует рекомендации
   */
  categorizeRecommendations(recommendations) {
    const categories = {
      structure: 0,
      quality: 0,
      architecture: 0,
      testing: 0,
      documentation: 0,
      refactoring: 0,
    };

    recommendations.forEach(rec => {
      if (categories.hasOwnProperty(rec.type)) {
        categories[rec.type]++;
      } else {
        categories.quality++; // fallback category
      }
    });

    return categories;
  }

  /**
   * Генерирует элементы действий для ЭАП
   */
  generateActionItems(recommendations) {
    return recommendations
      .filter(rec => rec.priority === 'high')
      .slice(0, 5) // топ-5 приоритетных
      .map(rec => ({
        title: rec.title,
        description: rec.description,
        category: rec.type,
        estimatedHours: this.parseEffort(rec.effort),
        files: rec.files?.slice(0, 3) || [], // максимум 3 файла
        impact: rec.impact || 'Улучшение качества кода',
      }));
  }

  /**
   * Парсит оценку трудозатрат из строки
   */
  parseEffort(effortString) {
    if (!effortString) return 0;

    const match = effortString.match(/(\d+)(?:-(\d+))?\s*час/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2;
    }

    return 0;
  }

  /**
   * Вычисляет общие трудозатраты
   */
  calculateTotalEffort(recommendations) {
    return recommendations.reduce((total, rec) => {
      return total + this.parseEffort(rec.effort);
    }, 0);
  }

  /**
   * Генерирует полный отчет для ЭАП
   */
  generateFullEAPReport(projectPath, basicResults, advancedResults, recommendations, analysisTime) {
    const integration = this.generateEAPIntegration(basicResults, advancedResults, recommendations);
    const summary = this.metricsCalculator.generateMetricsSummary(
      basicResults,
      advancedResults,
      recommendations
    );

    return {
      // Метаданные анализа
      metadata: {
        projectPath,
        analysisTime: new Date().toISOString(),
        executionTime: analysisTime,
        analyzerVersion: this.core.version,
        eapIntegration: true,
        analysisType: advancedResults ? 'full' : 'basic',
      },

      // Результаты для ЭАП
      eap: integration,

      // Краткое резюме
      summary: {
        score: integration.scores.overall,
        grade: this.getLetterGrade(integration.scores.overall),
        riskLevel: integration.criticalMetrics.riskLevel,
        urgency: integration.criticalMetrics.urgency,
        recommendation: this.getQuickRecommendation(integration.scores.overall),
        nextSteps: this.getNextSteps(integration),
      },

      // Детальные результаты
      details: {
        basic: basicResults,
        advanced: advancedResults,
        recommendations: recommendations,
        metrics: summary.metrics,
      },

      // Статистика обучения
      learning: this.core.getLearningStats(),
    };
  }

  /**
   * Получает буквенную оценку
   */
  getLetterGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    if (score >= 45) return 'D';
    return 'F';
  }

  /**
   * Получает быструю рекомендацию
   */
  getQuickRecommendation(score) {
    if (score >= 90) return 'Структура проекта отличная! Поддерживайте текущее качество.';
    if (score >= 80) return 'Хорошая структура с небольшими возможностями для улучшения.';
    if (score >= 70) return 'Средняя структура, рекомендуется плановый рефакторинг.';
    if (score >= 60) return 'Структура требует внимания, необходим целенаправленный рефакторинг.';
    if (score >= 50) return 'Проблемная структура, требуется серьезный рефакторинг.';
    return 'Критическое состояние структуры, необходима полная реорганизация.';
  }

  /**
   * Получает следующие шаги
   */
  getNextSteps(integration) {
    const steps = [];

    if (integration.criticalMetrics.issuesCount > 0) {
      steps.push('1. Устранить критические проблемы структуры');
    }

    if (integration.scores.overall < 70) {
      steps.push('2. Запланировать комплексный рефакторинг');
    }

    if (!integration.flags.hasTests) {
      steps.push('3. Добавить тесты для критических компонентов');
    }

    if (integration.flags.highComplexity) {
      steps.push('4. Упростить сложные компоненты');
    }

    if (integration.scores.overall >= 80) {
      steps.push('5. Поддерживать текущее качество');
    } else {
      steps.push('5. Внедрить мониторинг качества кода');
    }

    return steps;
  }

  /**
   * Экспортирует данные в формате ЭАП
   */
  async exportForEAP(results, outputPath) {
    const eapData = {
      format: 'eap-structure-analysis',
      version: '3.0',
      timestamp: new Date().toISOString(),
      data: results.eap,
    };

    const content = JSON.stringify(eapData, null, 2);
    const filename = `eap-structure-analysis-${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);

    const fs = await import('fs');
    await fs.promises.mkdir(outputPath, { recursive: true });
    await fs.promises.writeFile(fullPath, content);

    console.log(`[EAPIntegration] Данные для ЭАП сохранены: ${fullPath}`);
    return fullPath;
  }
}

export default EAPIntegration;
