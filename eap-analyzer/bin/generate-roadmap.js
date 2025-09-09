import fs from 'fs';
import path from 'path';

export function generateRoadmapMD(analysisResults) {
  const { summary, recommendations, roi, fileTypes, timestamp } = analysisResults;

  // Расчет оценок
  const totalIssues = summary.issues ? Object.values(summary.issues).reduce((a, b) => a + b, 0) : 0;
  const qualityScore = Math.max(0, 100 - totalIssues);
  const grade = getGrade(qualityScore);

  // Группировка рекомендаций по приоритету
  const criticalIssues = recommendations.filter(r => r.type === 'security');
  const performanceIssues = recommendations.filter(r => r.type === 'performance');
  const qualityIssues = recommendations.filter(r => r.type === 'quality');
  const debtIssues = recommendations.filter(r => r.type === 'debt');

  const roadmap = `# 📊 ЭТАЛОННЫЙ АНАЛИЗ - ДОРОЖНАЯ КАРТА
*Сгенерировано: ${new Date(timestamp).toLocaleString('ru-RU')}*
*Ultimate EAP Analyzer v3.0*

## 🎯 ИТОГОВАЯ ОЦЕНКА

| Критерий | Значение | Статус |
|----------|----------|---------|
| **Общая оценка** | ${qualityScore}/100 | ${getStatusEmoji(qualityScore)} |
| **Буквенная оценка** | ${grade} | ${getGradeDescription(grade)} |
| **Критических проблем** | ${criticalIssues.length} | ${criticalIssues.length > 0 ? '🔴' : '🟢'} |
| **Технический долг** | ${roi.effortHours} часов | ${roi.effortHours > 100 ? '⚠️' : '✅'} |
| **ROI рефакторинга** | ${roi.roiPercent}% | ${roi.roiPercent > 200 ? '💰' : '📊'} |

## 📈 ДЕТАЛЬНАЯ ДИАГНОСТИКА

### 📁 Анализ структуры проекта
- **Всего файлов**: ${summary.totalFiles}
- **Файлов с кодом**: ${summary.codeFiles}
- **Строк кода**: ${summary.totalLines.toLocaleString('ru-RU')}
- **Средний размер файла**: ${Math.round(summary.totalLines / summary.codeFiles)} строк

### 🔍 Обнаруженные проблемы

#### 🔒 Безопасность (${summary.issues.security || 0})
${
  criticalIssues.length > 0
    ? criticalIssues
        .slice(0, 5)
        .map(issue => `- ⚠️ **${path.basename(issue.file)}**: ${issue.issue}`)
        .join('\n')
    : '✅ Критических уязвимостей не обнаружено'
}

#### ⚡ Производительность (${summary.issues.performance || 0})
${
  performanceIssues.length > 0
    ? performanceIssues
        .slice(0, 5)
        .map(issue => `- 🐌 **${path.basename(issue.file)}**: ${issue.issue}`)
        .join('\n')
    : '✅ Проблем производительности не обнаружено'
}

#### 📝 Качество кода (${summary.issues.quality || 0})
${qualityIssues
  .slice(0, 10)
  .map(issue => `- 📋 **${path.basename(issue.file)}**: ${issue.issue}`)
  .join('\n')}
${qualityIssues.length > 10 ? `\n*...и еще ${qualityIssues.length - 10} проблем качества*` : ''}

#### 💸 Технический долг (${summary.issues.debt || 0})
${
  debtIssues.length > 0
    ? debtIssues
        .slice(0, 5)
        .map(issue => `- 💰 **${path.basename(issue.file)}**: ${issue.issue}`)
        .join('\n')
    : '✅ Минимальный технический долг'
}

## 🗺️ ДОРОЖНАЯ КАРТА УЛУЧШЕНИЙ

### 🔴 ФАЗА 1: Критические исправления (1-3 дня)
${getCriticalActions(criticalIssues, performanceIssues)}

### 🟡 ФАЗА 2: Важные улучшения (1-2 недели)
${getImportantActions(qualityIssues, debtIssues)}

### 🟢 ФАЗА 3: Оптимизация и рефакторинг (1 месяц)
${getLongTermActions(qualityIssues, summary)}

## 💰 ЭКОНОМИЧЕСКОЕ ОБОСНОВАНИЕ

| Метрика | Значение |
|---------|----------|
| **Требуемые усилия** | ${roi.effortHours} часов |
| **Стоимость работ** | $${(roi.effortHours * 50).toLocaleString('ru-RU')} |
| **Потенциальная экономия** | $${roi.estimatedSavings.toLocaleString('ru-RU')} |
| **Окупаемость** | ${Math.round(roi.effortHours / 40)} недель |
| **ROI** | ${roi.roiPercent}% |

## 📊 МЕТРИКИ КАЧЕСТВА

### Тестирование
- **Покрытие тестами**: ${estimateTestCoverage(fileTypes)}%
- **Тестовых файлов**: ${countTestFiles(fileTypes)}
- **Рекомендация**: ${getTestRecommendation(fileTypes)}

### Архитектура
- **Модульность**: ${estimateModularity(summary)}
- **Сложность**: ${estimateComplexity(qualityIssues)}
- **Рекомендация**: ${getArchitectureRecommendation(summary)}

### Документация
- **README файлов**: ${fileTypes['.md'] || 0}
- **Комментарии**: ${estimateDocumentation(debtIssues)}
- **Рекомендация**: ${getDocumentationRecommendation(fileTypes)}

## ✅ РЕКОМЕНДУЕМЫЕ ДЕЙСТВИЯ

### Немедленно (сегодня)
1. ${getImmediateAction(criticalIssues, performanceIssues)}
2. Создать бэкап перед внесением изменений
3. Настроить автоматический линтер

### На этой неделе
1. ${getWeeklyAction(qualityIssues)}
2. Добавить недостающие тесты
3. Провести code review проблемных модулей

### В этом месяце
1. ${getMonthlyAction(summary, roi)}
2. Внедрить CI/CD pipeline
3. Провести обучение команды best practices

## 📈 ПРОГНОЗ УЛУЧШЕНИЯ

После выполнения рекомендаций:
- **Качество кода**: ${qualityScore}% → ${Math.min(100, qualityScore + 30)}%
- **Технический долг**: ${roi.effortHours}ч → ${Math.round(roi.effortHours * 0.3)}ч
- **Производительность**: +${estimatePerformanceGain(performanceIssues)}%
- **Надежность**: +${estimateReliabilityGain(criticalIssues)}%

## 🎯 ЗАКЛЮЧЕНИЕ

${getFinalConclusion(qualityScore, totalIssues, roi)}

---
*Отчет сгенерирован Ultimate EAP Analyzer v3.0*
*Для детального анализа см. eap-analysis-latest.json*
`;

  return roadmap;
}

// Вспомогательные функции
function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'D+';
  if (score >= 55) return 'D';
  return 'F';
}

function getStatusEmoji(score) {
  if (score >= 80) return '🟢 Отлично';
  if (score >= 60) return '🟡 Хорошо';
  if (score >= 40) return '🟠 Требует улучшения';
  return '🔴 Критично';
}

function getGradeDescription(grade) {
  const descriptions = {
    'A+': 'Эталонный код',
    A: 'Отличное качество',
    'B+': 'Хорошее качество',
    B: 'Выше среднего',
    'C+': 'Удовлетворительно',
    C: 'Требует внимания',
    'D+': 'Ниже среднего',
    D: 'Плохое качество',
    F: 'Критическое состояние',
  };
  return descriptions[grade] || 'Требует анализа';
}

function getCriticalActions(security, performance) {
  const actions = [];
  if (security.length > 0) {
    actions.push('🔒 Устранить уязвимости безопасности (eval, document.write)');
  }
  if (performance.length > 0) {
    actions.push('⚡ Оптимизировать DOM-операции в циклах');
  }
  if (actions.length === 0) {
    actions.push('✅ Критических проблем не обнаружено');
  }
  return actions.map(a => `- ${a}`).join('\n');
}

function getImportantActions(quality, debt) {
  const actions = [];
  const largeFiles = quality.filter(q => q.issue.includes('Большой файл'));
  if (largeFiles.length > 0) {
    actions.push(`📂 Разделить ${largeFiles.length} больших файлов на модули`);
  }
  if (debt.length > 0) {
    actions.push(
      `💰 Обработать ${debt.reduce((sum, d) => {
        const match = d.issue.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0)} TODO/FIXME комментариев`
    );
  }
  if (actions.length === 0) {
    actions.push('✅ Создать план постепенных улучшений');
  }
  return actions.map(a => `- ${a}`).join('\n');
}

function getLongTermActions(quality, summary) {
  const actions = [
    '🏗️ Провести рефакторинг архитектуры',
    '📊 Внедрить метрики качества кода',
    '🔄 Настроить автоматизированное тестирование',
    '📚 Создать техническую документацию',
  ];
  return actions.map(a => `- ${a}`).join('\n');
}

function estimateTestCoverage(fileTypes) {
  const testFiles =
    (fileTypes['.test.ts'] || 0) + (fileTypes['.test.js'] || 0) + (fileTypes['.spec.ts'] || 0);
  const codeFiles = (fileTypes['.ts'] || 0) + (fileTypes['.js'] || 0) + (fileTypes['.tsx'] || 0);
  if (codeFiles === 0) return 0;
  return Math.min(100, Math.round((testFiles / codeFiles) * 200));
}

function countTestFiles(fileTypes) {
  return (
    (fileTypes['.test.ts'] || 0) +
    (fileTypes['.test.js'] || 0) +
    (fileTypes['.spec.ts'] || 0) +
    (fileTypes['.spec.js'] || 0)
  );
}

function getTestRecommendation(fileTypes) {
  const coverage = estimateTestCoverage(fileTypes);
  if (coverage >= 80) return '✅ Отличное покрытие';
  if (coverage >= 50) return '⚠️ Добавить тесты для критических модулей';
  return '🔴 Требуется значительное увеличение покрытия';
}

function estimateModularity(summary) {
  const avgFileSize = summary.totalLines / summary.codeFiles;
  if (avgFileSize < 200) return '🟢 Высокая';
  if (avgFileSize < 400) return '🟡 Средняя';
  return '🔴 Низкая';
}

function estimateComplexity(qualityIssues) {
  const largeFiles = qualityIssues.filter(q => q.issue.includes('Большой файл')).length;
  if (largeFiles < 5) return '🟢 Низкая';
  if (largeFiles < 20) return '🟡 Средняя';
  return '🔴 Высокая';
}

function getArchitectureRecommendation(summary) {
  const avgSize = summary.totalLines / summary.codeFiles;
  if (avgSize > 300) return '⚠️ Разделить большие модули';
  return '✅ Структура сбалансирована';
}

function estimateDocumentation(debtIssues) {
  const todos = debtIssues.reduce((sum, d) => {
    const match = d.issue.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  if (todos < 10) return '🟢 Хорошая';
  if (todos < 30) return '🟡 Средняя';
  return '🔴 Недостаточная';
}

function getDocumentationRecommendation(fileTypes) {
  const mdFiles = fileTypes['.md'] || 0;
  if (mdFiles >= 10) return '✅ Документация присутствует';
  return '⚠️ Добавить документацию';
}

function getImmediateAction(security, performance) {
  if (security.length > 0) return 'Исправить уязвимости безопасности';
  if (performance.length > 0) return 'Оптимизировать медленные операции';
  return 'Провести ревью кода';
}

function getWeeklyAction(quality) {
  const largeFiles = quality.filter(q => q.issue.includes('Большой файл')).length;
  if (largeFiles > 10) return `Разделить ${Math.min(5, largeFiles)} самых больших файлов`;
  return 'Улучшить структуру модулей';
}

function getMonthlyAction(summary, roi) {
  if (roi.effortHours > 200) return 'Запланировать поэтапный рефакторинг';
  return 'Внедрить best practices';
}

function estimatePerformanceGain(performanceIssues) {
  return Math.min(50, performanceIssues.length * 15);
}

function estimateReliabilityGain(criticalIssues) {
  return Math.min(40, criticalIssues.length * 20);
}

function getFinalConclusion(score, issues, roi) {
  if (score >= 80) {
    return `### 🎉 Проект в отличном состоянии!
Код соответствует высоким стандартам качества. Рекомендуется поддерживать текущий уровень и внедрять инновации.`;
  }
  if (score >= 60) {
    return `### 👍 Проект в хорошем состоянии
Есть области для улучшения, но общее качество удовлетворительное. Следуйте дорожной карте для достижения excellence.`;
  }
  if (score >= 40) {
    return `### ⚠️ Требуется внимание
Обнаружено ${issues} проблем, требующих решения. ROI ${roi.roiPercent}% оправдывает инвестиции в улучшение.`;
  }
  return `### 🚨 Критическое состояние
Требуется немедленное вмешательство. Начните с критических исправлений из Фазы 1.`;
}
