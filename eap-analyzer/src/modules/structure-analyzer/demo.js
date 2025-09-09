/**
 * Простая демонстрация системы генерации дорожных карт рефакторинга
 * Тестовая версия для проверки функциональности
 */

console.log('🚀 Демонстрация системы анализа структуры с дорожной картой рефакторинга');
console.log('='.repeat(80));

// Имитация данных анализа проекта
const mockBasicResults = {
  totalFiles: 156,
  totalLines: 15420,
  avgFileSize: 98.8,
  directoryDepth: 5,
  emptyFiles: 3,
  testFiles: 24,
  documentationFiles: 8,
  patterns: ['SvelteKit', 'TypeScript', 'Vite'],
  filesToRefactor: 12,
};

const mockAdvancedResults = {
  avgComplexity: 4.2,
  duplicationPercentage: 8.5,
  maintainabilityIndex: 72,
  technicalDebt: 145,
  hotspots: [
    { file: 'src/components/DataTable.svelte', complexity: 15, issues: 3 },
    { file: 'src/utils/validation.ts', complexity: 12, issues: 2 },
    { file: 'src/lib/api.ts', complexity: 10, issues: 2 },
  ],
  circularDependencies: [{ cycle: ['src/stores/user.ts', 'src/stores/app.ts'] }],
  cohesion: 0.65,
};

const mockRecommendations = [
  {
    type: 'cyclic-dependencies',
    priority: 'high',
    description: 'Устранить циклические зависимости между stores',
    files: ['src/stores/user.ts', 'src/stores/app.ts'],
    effort: 8,
    impact: 'Улучшит архитектуру и тестируемость',
  },
  {
    type: 'large-files',
    priority: 'high',
    description: 'Разделить большой компонент DataTable',
    files: ['src/components/DataTable.svelte'],
    effort: 16,
    impact: 'Повысит читаемость и переиспользование',
  },
  {
    type: 'complex-functions',
    priority: 'medium',
    description: 'Упростить сложную логику валидации',
    files: ['src/utils/validation.ts'],
    effort: 6,
    impact: 'Снизит вероятность ошибок',
  },
  {
    type: 'duplication',
    priority: 'medium',
    description: 'Устранить дублирование в API модулях',
    files: ['src/lib/api.ts', 'src/utils/fetch.ts'],
    effort: 4,
    impact: 'Упростит поддержку и изменения',
  },
  {
    type: 'empty-files',
    priority: 'low',
    description: 'Удалить пустые файлы',
    files: ['src/temp/placeholder.ts', 'src/unused/old.ts'],
    effort: 1,
    impact: 'Очистит проект от мусора',
  },
];

/**
 * Функция расчета общей оценки проекта
 */
function calculateStructureScore(basicResults, advancedResults) {
  let score = 100;

  // Штрафы за проблемы
  if (basicResults.emptyFiles > 0) score -= basicResults.emptyFiles * 2;
  if (advancedResults.duplicationPercentage > 5)
    score -= (advancedResults.duplicationPercentage - 5) * 2;
  if (advancedResults.avgComplexity > 10) score -= (advancedResults.avgComplexity - 10) * 3;
  if (advancedResults.maintainabilityIndex < 80)
    score -= (80 - advancedResults.maintainabilityIndex) * 0.5;
  if (advancedResults.circularDependencies.length > 0)
    score -= advancedResults.circularDependencies.length * 10;

  // Бонусы за хорошие практики
  if (basicResults.testFiles > 0) score += Math.min(10, basicResults.testFiles);
  if (basicResults.documentationFiles > 0) score += Math.min(5, basicResults.documentationFiles);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Получает буквенную оценку
 */
function getGradeFromScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  return 'F';
}

/**
 * Строит дорожную карту рефакторинга
 */
function buildRefactoringRoadmap(basicResults, advancedResults, recommendations) {
  const tasks = recommendations.map(rec => ({
    title: rec.description,
    priority: rec.priority,
    effort: rec.effort,
    impact: rec.impact,
    files: rec.files,
  }));

  // Сортируем задачи по приоритету и сложности
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  tasks.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.effort - a.effort; // Более трудозатратные задачи в рамках приоритета
  });

  // Группируем задачи по фазам
  let currentEffort = 0;
  const phases = { immediate: [], shortTerm: [], longTerm: [] };

  for (const task of tasks) {
    if (task.priority === 'high' || currentEffort < 20) {
      phases.immediate.push(task);
    } else if (currentEffort < 40) {
      phases.shortTerm.push(task);
    } else {
      phases.longTerm.push(task);
    }
    currentEffort += task.effort;
  }

  return {
    tasks,
    phases,
    totalEffort: tasks.reduce((sum, task) => sum + task.effort, 0),
  };
}

/**
 * Генерирует дорожную карту в формате Markdown
 */
function generateRefactoringRoadmap(basicResults, advancedResults, recommendations) {
  const score = calculateStructureScore(basicResults, advancedResults);
  const grade = getGradeFromScore(score);
  const roadmap = buildRefactoringRoadmap(basicResults, advancedResults, recommendations);
  const criticalIssues = recommendations.filter(r => r.priority === 'high').length;

  const content = `# Дорожная карта рефакторинга проекта

## 📊 Текущее состояние

**Общая оценка:** ${grade} (${score}/100 баллов)
**Всего файлов:** ${basicResults.totalFiles}
**Строк кода:** ${basicResults.totalLines.toLocaleString()}
**Критических проблем:** ${criticalIssues}
**Необходимость рефакторинга:** ${score < 60 ? 'ВЫСОКАЯ' : score < 80 ? 'СРЕДНЯЯ' : 'НИЗКАЯ'}

### Обнаруженные проблемы:
${advancedResults.circularDependencies.length > 0 ? `- ${advancedResults.circularDependencies.length} циклических зависимостей\n` : ''}${basicResults.emptyFiles > 0 ? `- ${basicResults.emptyFiles} пустых файлов\n` : ''}${advancedResults.duplicationPercentage > 5 ? `- ${advancedResults.duplicationPercentage.toFixed(1)}% дублирования кода\n` : ''}${advancedResults.hotspots.length > 0 ? `- ${advancedResults.hotspots.length} проблемных файлов\n` : ''}

### Сильные стороны:
${basicResults.testFiles > 0 ? `- Наличие ${basicResults.testFiles} тестовых файлов\n` : ''}${basicResults.documentationFiles > 0 ? `- Хорошая документация (${basicResults.documentationFiles} файлов)\n` : ''}${advancedResults.cohesion > 0.7 ? `- Хорошая связность модулей (${(advancedResults.cohesion * 100).toFixed(1)}%)\n` : ''}

## 🎯 План рефакторинга

### Фаза 1: Немедленные действия (0-2 недели)
**Усилия:** ${roadmap.phases.immediate.reduce((sum, task) => sum + task.effort, 0)} часов

${roadmap.phases.immediate
  .map(
    (task, index) =>
      `${index + 1}. **${task.title}** (${task.effort}ч)
   - Приоритет: ${task.priority.toUpperCase()}
   - Воздействие: ${task.impact}
   - Файлы: ${task.files.slice(0, 2).join(', ')}${task.files.length > 2 ? ` и еще ${task.files.length - 2}` : ''}
`
  )
  .join('\n')}

### Фаза 2: Краткосрочные улучшения (2-4 недели)
**Усилия:** ${roadmap.phases.shortTerm.reduce((sum, task) => sum + task.effort, 0)} часов

${roadmap.phases.shortTerm
  .map(
    (task, index) =>
      `${index + 1}. **${task.title}** (${task.effort}ч)
   - Приоритет: ${task.priority.toUpperCase()}
   - Воздействие: ${task.impact}
   - Файлы: ${task.files.slice(0, 2).join(', ')}${task.files.length > 2 ? ` и еще ${task.files.length - 2}` : ''}
`
  )
  .join('\n')}

### Фаза 3: Долгосрочные оптимизации (4-8 недель)
**Усилия:** ${roadmap.phases.longTerm.reduce((sum, task) => sum + task.effort, 0)} часов

${roadmap.phases.longTerm
  .map(
    (task, index) =>
      `${index + 1}. **${task.title}** (${task.effort}ч)
   - Приоритет: ${task.priority.toUpperCase()}
   - Воздействие: ${task.impact}
   - Файлы: ${task.files.slice(0, 2).join(', ')}${task.files.length > 2 ? ` и еще ${task.files.length - 2}` : ''}
`
  )
  .join('\n')}

## 📈 Ожидаемые результаты

После завершения рефакторинга ожидается:

- **Повышение оценки** с ${grade} до A- (80+ баллов)
- **Снижение технического долга** на 60-80%
- **Улучшение сопровождаемости** кода до 85+
- **Устранение всех критических проблем**
- **Повышение производительности команды** на 25-40%

## 💰 ROI анализ

**Общие затраты:** ${roadmap.totalEffort} часов
**Стоимость рефакторинга:** ~${roadmap.totalEffort * 100} USD (при $100/час)
**Ожидаемая экономия:** ~${Math.round(roadmap.totalEffort * 200)} USD в год
**ROI:** ${Math.round(((roadmap.totalEffort * 200) / (roadmap.totalEffort * 100)) * 100 - 100)}%
**Срок окупаемости:** ${Math.round(((roadmap.totalEffort * 100) / ((roadmap.totalEffort * 200) / 12)) * 10) / 10} месяцев

## 📊 Метрики мониторинга

Для отслеживания прогресса рекомендуется мониторить:

1. **Общая оценка структуры** (цель: 80+ баллов)
2. **Количество критических проблем** (цель: 0)
3. **Процент дублирования кода** (цель: <5%)
4. **Индекс сопровождаемости** (цель: 80+)
5. **Покрытие тестами** (цель: 80%+)

## 🧪 Стратегия тестирования

1. **Перед рефакторингом:** Добавить интеграционные тесты для критических функций
2. **Во время рефакторинга:** Поддерживать покрытие тестами на уровне 80%+
3. **После рефакторинга:** Провести полное тестирование и code review

---
*Дорожная карта сгенерирована автоматически системой ЭАП ${new Date().toLocaleDateString('ru-RU')}*`;

  return content;
}

// Демонстрация работы системы
console.log('\n🔍 Анализ структуры проекта...');
const score = calculateStructureScore(mockBasicResults, mockAdvancedResults);
const grade = getGradeFromScore(score);
const roadmap = buildRefactoringRoadmap(mockBasicResults, mockAdvancedResults, mockRecommendations);

console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
console.log(`   Оценка: ${grade} (${score}/100 баллов)`);
console.log(`   Файлов: ${mockBasicResults.totalFiles}`);
console.log(`   Строк кода: ${mockBasicResults.totalLines.toLocaleString()}`);
console.log(
  `   Критических проблем: ${mockRecommendations.filter(r => r.priority === 'high').length}`
);

console.log('\n🗺️ ДОРОЖНАЯ КАРТА:');
console.log(`   Всего задач: ${roadmap.tasks.length}`);
console.log(`   Общие затраты: ${roadmap.totalEffort} часов`);
console.log(`   Фаза 1 (0-2 нед.): ${roadmap.phases.immediate.length} задач`);
console.log(`   Фаза 2 (2-4 нед.): ${roadmap.phases.shortTerm.length} задач`);
console.log(`   Фаза 3 (4-8 нед.): ${roadmap.phases.longTerm.length} задач`);

console.log('\n💰 ROI АНАЛИЗ:');
const cost = roadmap.totalEffort * 100;
const benefit = roadmap.totalEffort * 200;
const roi = Math.round((benefit / cost - 1) * 100);
console.log(`   Стоимость: $${cost.toLocaleString()}`);
console.log(`   Выгода в год: $${benefit.toLocaleString()}`);
console.log(`   ROI: ${roi}%`);

console.log('\n📋 Генерация полной дорожной карты...');
const fullRoadmap = generateRefactoringRoadmap(
  mockBasicResults,
  mockAdvancedResults,
  mockRecommendations
);

console.log('\n✅ ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА!');
console.log('📄 Дорожная карта готова для интеграции с ЭАП');
console.log('🔧 Система поддерживает:');
console.log('   ✓ Автоматическое определение приоритетов');
console.log('   ✓ Расчет трудозатрат и ROI');
console.log('   ✓ Фазовое планирование');
console.log('   ✓ Мониторинг прогресса');
console.log('   ✓ Markdown форматирование');

console.log('\n' + '='.repeat(80));
console.log('🎯 Система готова к интеграции с основным ЭАП!');
