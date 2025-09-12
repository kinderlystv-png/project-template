/**
 * Мониторинг содержимого HTML файла
 */
/* eslint-disable no-console */
import fs from 'fs';

function monitorHtml() {
  console.log('🔍 === МОНИТОРИНГ HTML ФАЙЛА ===');

  const htmlPath = './eap-enhanced-analysis-test.html';
  const content = fs.readFileSync(htmlPath, 'utf8');

  console.log('📊 Поиск ключевых данных:');

  // Ищем все упоминания checkers
  const checkersMatches = content.match(/\d+\s+checkers/g);
  console.log('🔧 Найденные упоминания checkers:', checkersMatches);

  // Ищем заголовок секции
  const headerMatch = content.match(/<h3[^>]*>([^<]+)</g);
  console.log('📋 Заголовки секций:', headerMatch);

  // Ищем статистику
  const statsMatch = content.match(
    /Всего зарегистрировано:[^<]+<strong>([^<]+)<\/strong>[^<]+модулей:[^<]+<strong>([^<]+)<\/strong>/
  );
  if (statsMatch) {
    console.log('📈 Статистика из HTML:');
    console.log('   - Checkers:', statsMatch[1]);
    console.log('   - Модули:', statsMatch[2]);
  }

  // Проверяем timestamp последнего изменения
  const stats = fs.statSync(htmlPath);
  console.log('⏰ Последнее изменение файла:', stats.mtime.toISOString());

  // Размер файла
  console.log('📏 Размер файла:', content.length, 'символов');

  // Ищем отладочную панель
  const hasDebugPanel = content.includes('ОТЛАДОЧНАЯ ИНФОРМАЦИЯ');
  console.log('🐛 Отладочная панель добавлена:', hasDebugPanel);

  console.log('🔍 === КОНЕЦ МОНИТОРИНГА ===');
}

monitorHtml();
