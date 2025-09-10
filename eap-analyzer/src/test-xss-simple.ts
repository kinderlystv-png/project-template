/**
 * Упрощенный тест XSS анализатора
 */

export {}; // Делаем файл модулем

console.log('🧪 Начинаем тест XSS анализатора...');

try {
  // Простая проверка импорта
  console.log('📦 Проверяем импорт XSSAnalyzer...');

  const { XSSAnalyzer } = await import('./checkers/security/analyzers/XSSAnalyzer.js');
  console.log('✅ XSSAnalyzer импортирован успешно');

  // Создаем экземпляр
  const analyzer = new XSSAnalyzer();
  console.log('✅ Экземпляр XSSAnalyzer создан');

  // Простой тестовый контекст
  const context = {
    projectPath: process.cwd(),
    projectInfo: {
      name: 'test',
      version: '1.0.0',
      hasTypeScript: true,
      hasTests: false,
      hasDocker: false,
      hasCICD: false,
      dependencies: { production: 0, development: 0, total: 0 },
    },
    options: {
      projectPath: process.cwd(),
      includeOptional: true,
    },
  };

  console.log('🔍 Запускаем анализ...');
  const result = await analyzer.analyzeXSS(context);

  console.log('📊 Результат получен:');
  console.log(`   Файлов сканировано: ${result.filesScanned}`);
  console.log(`   Уязвимостей найдено: ${result.summary.total}`);

  if (result.vulnerabilities.length > 0) {
    console.log('🔍 Первые уязвимости:');
    result.vulnerabilities.slice(0, 3).forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.file}:${v.line} - ${v.type} (${v.severity})`);
    });
  }

  console.log('🎉 Тест завершен успешно!');
} catch (error) {
  console.error('❌ Ошибка в тесте:', error);
  process.exit(1);
}
