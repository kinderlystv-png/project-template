/**
 * Test Enhanced SecurityChecker with RecommendationEngine
 * Phase 5.2.1: Проверка интеграции рекомендательной системы
 */

import { SecurityChecker } from './checkers/security/SecurityChecker.js';
import { CheckContext } from './types/index.js';

async function testEnhancedSecurityChecker() {
  console.log('🧪 Тестируем Enhanced SecurityChecker с RecommendationEngine...');

  const context: CheckContext = {
    projectPath: process.cwd(),
    projectInfo: {
      name: 'test-project',
      version: '1.0.0',
      hasTypeScript: true,
      hasTests: true,
      hasDocker: false,
      hasCICD: false,
      dependencies: {
        production: 0,
        development: 0,
        total: 0,
      },
    },
    options: {
      projectPath: process.cwd(),
      verbose: true,
    },
  };

  try {
    // 1. Тест базовой проверки безопасности
    console.log('\n1️⃣ Запуск базовой проверки безопасности...');
    const result = await SecurityChecker.checkComponent(context);
    console.log('✅ Базовая проверка завершена');
    console.log(`📊 Общий балл: ${result.score}/${result.maxScore} (${result.percentage}%)`);
    console.log(`⚠️  Проблем: ${result.failed.length}, предупреждений: ${result.warnings.length}`);

    // 2. Тест генерации детальных рекомендаций
    console.log('\n2️⃣ Генерируем детальные рекомендации...');
    const detailedRecommendations = await SecurityChecker.generateDetailedRecommendations(context);

    console.log('📋 Статистика детальных рекомендаций:');
    console.log(`   • Всего рекомендаций: ${detailedRecommendations.summary.totalRecommendations}`);
    console.log(`   • Критических: ${detailedRecommendations.summary.criticalRecommendations}`);
    console.log(`   • Время исправления: ${detailedRecommendations.summary.estimatedTimeToFix}`);

    console.log(`   • Dependencies: ${detailedRecommendations.dependencies.length} рекомендаций`);
    console.log(`   • Code Security: ${detailedRecommendations.code.length} рекомендаций`);
    console.log(`   • Config Security: ${detailedRecommendations.config.length} рекомендаций`);

    // 3. Тест быстрых рекомендаций для критических проблем
    console.log('\n3️⃣ Генерируем быстрые рекомендации для критических проблем...');
    const quickRecommendations = await SecurityChecker.generateQuickRecommendations(context);

    console.log(`🚨 Найдено ${quickRecommendations.length} критических рекомендаций`);

    // 4. Показываем примеры рекомендаций
    if (quickRecommendations.length > 0) {
      console.log('\n4️⃣ Примеры критических рекомендаций:');
      for (let i = 0; i < Math.min(3, quickRecommendations.length); i++) {
        const rec = quickRecommendations[i];
        console.log(`\n   📌 ${rec.title}`);
        console.log(`   🎯 Сложность: ${rec.difficulty}`);
        console.log(`   ⏱️  Время: ${rec.estimatedTime}`);
        console.log(`   📝 Описание: ${rec.description}`);

        if (rec.fixTemplate.steps && rec.fixTemplate.steps.length > 0) {
          console.log(`   🔧 Первый шаг: ${rec.fixTemplate.steps[0]}`);
        }
      }
    }

    // 5. Анализ эффективности
    console.log('\n5️⃣ Анализ эффективности SecurityChecker...');
    const effectivenessScore = calculateEffectivenessScore(result, detailedRecommendations);
    console.log(`📈 Оценка эффективности: ${effectivenessScore}%`);

    if (effectivenessScore >= 70) {
      console.log('🎉 УСПЕХ! SecurityChecker достиг целевой эффективности 70%+');
    } else {
      console.log('⚡ Требуется дальнейшая оптимизация для достижения 70%+ эффективности');
    }

    return {
      success: true,
      baseScore: result.score,
      effectivenessScore,
      totalRecommendations: detailedRecommendations.summary.totalRecommendations,
      criticalRecommendations: detailedRecommendations.summary.criticalRecommendations,
    };
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Рассчитывает эффективность SecurityChecker
 */
function calculateEffectivenessScore(baseResult: any, recommendations: any): number {
  let score = 0;

  // Базовый функционал (30%)
  if (baseResult.success) {
    score += 30;
  }

  // Качество анализа (25%)
  const issueCount = baseResult.failed.length + baseResult.warnings.length;
  if (issueCount > 0) {
    score += 25; // Найдены проблемы = хороший анализ
  } else {
    score += 15; // Проблем нет = частичный балл
  }

  // Практичность рекомендаций (30%)
  const recCount = recommendations.summary.totalRecommendations;
  if (recCount > 0) {
    score += 30;
  }

  // Время исправления оценено (15%)
  if (recommendations.summary.estimatedTimeToFix !== '0h') {
    score += 15;
  }

  return Math.min(score, 100);
}

// Запуск теста
if (process.argv[1] === __filename || process.argv[1].endsWith('test-enhanced-security.ts')) {
  testEnhancedSecurityChecker()
    .then(result => {
      console.log('\n🏁 Тест завершен:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

export { testEnhancedSecurityChecker };
