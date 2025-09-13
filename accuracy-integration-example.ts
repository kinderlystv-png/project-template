/* eslint-disable no-console */
/**
 * 🎯 Пример интеграции новой системы точности с существующими анализаторами EAP
 *
 * Этот файл показывает, как заменить простые фиксированные значения точности
 * на продвинутую систему с детальным расчетом и объяснениями
 */

import type { AccuracyComponents } from './src/metrics/accuracy-interfaces.ts';
import { AccuracyCalculator } from './src/metrics/accuracy-calculator.ts';

// === СТАРЫЙ СПОСОБ (простые фиксированные значения) ===

class OldStructureChecker {
  calculateAccuracy(fileCount: number): number {
    // Старая простая формула: 85% + количество файлов/10 ± случайность
    const baseAccuracy = 85;
    const fileBonus = Math.min(10, fileCount / 10);
    const randomFactor = (Math.random() - 0.5) * 10; // ±5%

    return Math.max(45, Math.min(98, baseAccuracy + fileBonus + randomFactor));
  }
}

// === НОВЫЙ СПОСОБ (продвинутая система) ===

class NewStructureChecker {
  private accuracyCalculator: AccuracyCalculator;

  constructor() {
    this.accuracyCalculator = new AccuracyCalculator();
  }

  async calculateAccuracy(projectPath: string): Promise<{
    accuracy: number;
    confidenceInterval: { lower: number; upper: number };
    explanation: string;
    components: AccuracyComponents;
    recommendations: string[];
  }> {
    const result = await this.accuracyCalculator.calculateAccuracyForAnalyzer(
      'structure',
      projectPath
    );

    return {
      accuracy: result.overall,
      confidenceInterval: result.confidenceInterval,
      explanation: result.explanation,
      components: result.components,
      recommendations: result.recommendations || [],
    };
  }

  /**
   * Совместимая функция для старого API (возвращает только число)
   */
  async calculateSimpleAccuracy(projectPath: string): Promise<number> {
    const result = await this.calculateAccuracy(projectPath);
    return result.accuracy;
  }
}

// === ПРИМЕР ИСПОЛЬЗОВАНИЯ ===

async function demonstrateImprovement() {
  console.log('📊 Сравнение старой и новой системы точности\n');

  // Старая система
  const oldChecker = new OldStructureChecker();
  const oldAccuracy = oldChecker.calculateAccuracy(100); // Передаем количество файлов
  console.log('🔸 Старая система:');
  console.log(`   Точность: ${oldAccuracy.toFixed(1)}%`);
  console.log('   Объяснение: Простая формула без контекста');
  console.log('   Компоненты: Недоступно');
  console.log('   Рекомендации: Отсутствуют\n');

  // Новая система
  const newChecker = new NewStructureChecker();
  const newResult = await newChecker.calculateAccuracy(process.cwd());

  console.log('🔹 Новая система:');
  console.log(`   Точность: ${newResult.accuracy}%`);
  console.log(
    `   Доверительный интервал: ${newResult.confidenceInterval.lower}% - ${newResult.confidenceInterval.upper}%`
  );
  console.log(`   Объяснение: ${newResult.explanation}`);
  console.log('   Компоненты:');
  console.log(`     • Качество данных: ${newResult.components.dataQuality.score.toFixed(1)}%`);
  console.log(`     • Глубина анализа: ${newResult.components.analysisDepth.score.toFixed(1)}%`);
  console.log(
    `     • Надёжность алгоритмов: ${newResult.components.algorithmReliability.score.toFixed(1)}%`
  );
  console.log(
    `     • Историческая корректность: ${newResult.components.historicalCorrectness?.score.toFixed(1)}%`
  );
  console.log('   Рекомендации:');
  newResult.recommendations.forEach((rec, i) => {
    console.log(`     ${i + 1}. ${rec}`);
  });

  console.log('\n✨ Преимущества новой системы:');
  console.log('   • Детальный анализ компонентов точности');
  console.log('   • Объяснения и рекомендации');
  console.log('   • Доверительные интервалы');
  console.log('   • Адаптация к специфике проекта');
  console.log('   • Отсутствие случайности');
}

// === ИНСТРУКЦИЯ ПО МИГРАЦИИ ===

console.log(`
🔄 **ИНСТРУКЦИЯ ПО МИГРАЦИИ**

1. **Замените простые функции расчета точности:**
   \`\`\`typescript
   // Было:
   const accuracy = 85 + Math.random() * 10;

   // Стало:
   const calculator = new AccuracyCalculator();
   const result = await calculator.calculateAccuracyForAnalyzer('structure', projectPath);
   const accuracy = result.overall;
   \`\`\`

2. **Используйте детальную информацию:**
   \`\`\`typescript
   // Покажите пользователю компоненты точности
   console.log('Качество данных:', result.components.dataQuality.score);
   console.log('Объяснение:', result.explanation);
   console.log('Рекомендации:', result.recommendations);
   \`\`\`

3. **Интегрируйте в HTML интерфейс:**
   \`\`\`html
   <div class="accuracy-breakdown">
     <div class="overall">Точность: \${accuracy}% (±\${interval}%)</div>
     <div class="components">
       <div>Данные: \${dataQuality}%</div>
       <div>Анализ: \${analysisDepth}%</div>
       <div>Алгоритмы: \${reliability}%</div>
     </div>
     <div class="explanation">\${explanation}</div>
   </div>
   \`\`\`

4. **Добавьте остальные провайдеры по мере необходимости:**
   - SecurityAccuracyProvider
   - TestingAccuracyProvider
   - PerformanceAccuracyProvider
   - DocumentationAccuracyProvider
   - AIInsightsAccuracyProvider
`);

// Запуск демонстрации
demonstrateImprovement().catch(console.error);
