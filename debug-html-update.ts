/**
 * Логи для отладки обновления HTML
 */
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

async function debugUpdate() {
  console.log('🔍 === ОТЛАДКА ОБНОВЛЕНИЯ HTML ===');

  const htmlPath = './eap-enhanced-analysis-test.html';
  const absolutePath = path.resolve(htmlPath);

  console.log(`📂 Путь к файлу: ${absolutePath}`);

  // Проверяем существование файла
  const exists = fs.existsSync(htmlPath);
  console.log(`📄 Файл существует: ${exists}`);

  if (exists) {
    // Читаем содержимое
    const content = fs.readFileSync(htmlPath, 'utf8');
    console.log(`📏 Размер файла: ${content.length} символов`);

    // Ищем ключевые строки
    const has5checkers = content.includes('5 checkers');
    const has2checkers = content.includes('2 checkers');

    console.log(`🔍 Содержит "5 checkers": ${has5checkers}`);
    console.log(`🔍 Содержит "2 checkers": ${has2checkers}`);

    // Находим строку с количеством
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('checkers')) {
        console.log(`📍 Строка ${index + 1}: ${line.trim()}`);
      }
    });

    // Добавляем timestamp и логи в HTML
    const timestamp = new Date().toISOString();
    console.log(`⏰ Добавляем timestamp: ${timestamp}`);

    // Ищем место для вставки логов
    const scriptStart = content.indexOf('<script>');
    if (scriptStart !== -1) {
      const beforeScript = content.substring(0, scriptStart);
      const afterScript = content.substring(scriptStart);

      const debugLog = `
<!-- ОТЛАДОЧНАЯ ИНФОРМАЦИЯ -->
<div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-family: monospace; font-size: 12px;">
  <div>🕐 Обновлено: ${timestamp}</div>
  <div>🔧 Checkers в HTML: ${has5checkers ? '5' : '2'}</div>
  <div>📊 Кэш браузера: проверить F5</div>
</div>
`;

      const updatedContent = beforeScript + debugLog + afterScript;
      fs.writeFileSync(htmlPath, updatedContent);

      console.log('✅ Добавлены отладочные логи в HTML');
    }

    // Получаем статистику файла
    const stats = fs.statSync(htmlPath);
    console.log(`📅 Последнее изменение: ${stats.mtime.toISOString()}`);

    // Открываем с параметром для обхода кэша
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const urlWithCache = `file:///${absolutePath.replace(/\\/g, '/')}?t=${Date.now()}`;
    console.log(`🌐 Открываем с параметром анти-кэш: ${urlWithCache}`);

    // Открываем в новом окне Chrome с отключенным кэшем
    try {
      await execAsync(
        `start chrome --new-window --disable-web-security --disable-cache "${urlWithCache}"`
      );
      console.log('🚀 Открыто в Chrome с отключенным кэшем');
    } catch (error) {
      console.log('⚠️ Chrome недоступен, используем стандартный браузер');
      await execAsync(`start "" "${absolutePath}"`);
    }
  }

  console.log('🔍 === КОНЕЦ ОТЛАДКИ ===');
}

debugUpdate().catch(console.error);
