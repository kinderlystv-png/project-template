// Скрипт для тестирования фильтрации топ-10 и доработки
console.log('🧪 Тестирование фильтрации топ-10 и доработки');

// Проверяем доступность функций
if (window.EAP_DATA && window.EAP_DATA.utils) {
  console.log('✅ EAP_DATA.utils доступны');

  // Тестируем получение топ-10 без фильтров
  const allTopComponents = window.EAP_DATA.utils.getTopComponents(5);
  console.log(
    '🏆 Топ-5 без фильтров:',
    allTopComponents.map(c => c.name)
  );

  // Тестируем получение топ-10 с фильтром по анализаторам
  const analyzerFilters = { classificationFilter: 'analyzer' };
  const topAnalyzers = window.EAP_DATA.utils.getTopComponents(5, analyzerFilters);
  console.log(
    '🎯 Топ-5 анализаторов:',
    topAnalyzers.map(c => c.name)
  );

  // Тестируем получение топ-10 с фильтром по категории
  const testingFilters = { categoryFilter: 'testing' };
  const topTesting = window.EAP_DATA.utils.getTopComponents(5, testingFilters);
  console.log(
    '🧪 Топ-5 testing:',
    topTesting.map(c => c.name)
  );

  // Тестируем получение худших без фильтров
  const allBottomComponents = window.EAP_DATA.utils.getBottomComponents(5);
  console.log(
    '🔧 Худшие-5 без фильтров:',
    allBottomComponents.map(c => c.name)
  );

  // Тестируем получение худших с фильтром по анализаторам
  const bottomAnalyzers = window.EAP_DATA.utils.getBottomComponents(5, analyzerFilters);
  console.log(
    '⚠️ Худшие-5 анализаторов:',
    bottomAnalyzers.map(c => c.name)
  );

  console.log('✅ Тестирование завершено успешно!');
} else {
  console.error('❌ EAP_DATA.utils недоступны');
}
