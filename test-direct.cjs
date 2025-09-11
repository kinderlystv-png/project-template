/**
 * Интегрированный тест анализатора без API сервера
 */
const path = require('path');

async function testAnalyzer() {
  console.log('🧪 Прямое тестирование анализатора...\n');

  try {
    // Подключаем анализатор
    const SimpleProjectAnalyzer = require('./simple-analyzer.cjs');

    console.log('✅ Анализатор загружен успешно');

    // Создаем экземпляр
    const analyzer = new SimpleProjectAnalyzer();
    console.log('✅ Экземпляр анализатора создан');

    // Запускаем анализ текущего проекта
    console.log('🔍 Запуск анализа текущего проекта...');

    const result = await analyzer.analyzeProject('.');

    if (result.success) {
      console.log('\n🎉 Анализ завершен успешно!');
      console.log('📊 Общая оценка:', result.score + '/100');
      console.log('⏱️ Время выполнения:', result.executionTime + 'ms');
      console.log('📁 Путь к проекту:', result.projectPath);
      console.log('📋 Количество результатов:', result.results.length);

      // Показываем первые несколько результатов
      if (result.results.length > 0) {
        console.log('\n🔍 Первые результаты анализа:');
        result.results.slice(0, 5).forEach((res, index) => {
          console.log(
            `${index + 1}. ${res.category || 'Общее'}: ${res.message || res.description || res}`
          );
        });

        if (result.results.length > 5) {
          console.log(`   ... и еще ${result.results.length - 5} результатов`);
        }
      }

      // Показываем краткий отчет
      if (result.report) {
        console.log('\n📋 Краткий отчет:');
        console.log(result.report.split('\n').slice(0, 10).join('\n'));
        console.log('   ...');
      }
    } else {
      console.log('❌ Анализ завершился с ошибкой');
      if (result.error) {
        console.log('Ошибка:', result.error);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Запуск теста
testAnalyzer()
  .then(() => {
    console.log('\n✅ Тестирование завершено');
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка:', error);
  });
