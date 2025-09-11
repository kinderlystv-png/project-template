// Тестовый скрипт для проверки фильтрации в графиках
// Проверяет правильность отображения количества компонентов в tooltip'ах

function testTooltipData() {
  console.log("🧪 Тестирование данных tooltip'ов графика");

  if (!window.dashboardInstance) {
    console.error('❌ Dashboard не инициализирован');
    return;
  }

  if (!window.EAPCharts) {
    console.error('❌ Charts не инициализированы');
    return;
  }

  // Тест 1: Все компоненты
  console.log('\n📊 Тест 1: Все компоненты');
  window.dashboardInstance.currentClassificationFilter = 'all';
  const allComponents = window.dashboardInstance.getFilteredComponents();
  console.log(`Всего компонентов: ${allComponents.length}`);

  // Группируем по категориям
  const categoryStats = {};
  allComponents.forEach(comp => {
    const categoryName = window.EAP_DATA?.categories?.[comp.category]?.name || comp.category;
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { count: 0, totalLogic: 0, totalFunctionality: 0 };
    }
    categoryStats[categoryName].count++;
    categoryStats[categoryName].totalLogic += comp.logic || 0;
    categoryStats[categoryName].totalFunctionality += comp.functionality || 0;
  });

  console.log('По категориям:');
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    const avgLogic = Math.round(stats.totalLogic / stats.count);
    const avgFunctionality = Math.round(stats.totalFunctionality / stats.count);
    console.log(
      `  ${category}: ${stats.count} компонентов (логика: ${avgLogic}%, функц: ${avgFunctionality}%)`
    );
  });

  // Тест 2: Только анализаторы
  console.log('\n🔍 Тест 2: Только анализаторы');
  window.dashboardInstance.currentClassificationFilter = 'analyzer';
  const analyzerComponents = window.dashboardInstance.getFilteredComponents();
  console.log(`Анализаторы: ${analyzerComponents.length} компонентов`);

  // Пересчет для анализаторов
  const analyzerCategoryStats = {};
  analyzerComponents.forEach(comp => {
    const categoryName = window.EAP_DATA?.categories?.[comp.category]?.name || comp.category;
    if (!analyzerCategoryStats[categoryName]) {
      analyzerCategoryStats[categoryName] = { count: 0, totalLogic: 0, totalFunctionality: 0 };
    }
    analyzerCategoryStats[categoryName].count++;
    analyzerCategoryStats[categoryName].totalLogic += comp.logic || 0;
    analyzerCategoryStats[categoryName].totalFunctionality += comp.functionality || 0;
  });

  console.log('Анализаторы по категориям:');
  Object.keys(analyzerCategoryStats).forEach(category => {
    const stats = analyzerCategoryStats[category];
    const avgLogic = Math.round(stats.totalLogic / stats.count);
    const avgFunctionality = Math.round(stats.totalFunctionality / stats.count);
    console.log(
      `  ${category}: ${stats.count} компонентов (логика: ${avgLogic}%, функц: ${avgFunctionality}%)`
    );
  });

  // Тест 3: Обновление графика
  console.log('\n📈 Тест 3: Обновление графика');
  if (window.EAPCharts.updateCategoriesChart) {
    window.EAPCharts.updateCategoriesChart();
    console.log('✅ График обновлен для фильтра анализаторов');
  } else {
    console.log('❌ Функция updateCategoriesChart не найдена');
  }

  // Возвращаем к показу всех компонентов
  window.dashboardInstance.currentClassificationFilter = 'all';
  if (window.EAPCharts.updateCategoriesChart) {
    window.EAPCharts.updateCategoriesChart();
  }

  console.log('\n✅ Тестирование завершено');
}

// Экспортируем функцию
window.testTooltipData = testTooltipData;

console.log('🧪 Тестовый скрипт загружен. Вызовите testTooltipData() для запуска тестов.');
