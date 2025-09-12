/**
 * ПРОСТЕЙШАЯ замена - только строка с количеством
 */
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

async function simpleUpdate() {
  console.log('🚀 Простое обновление количества компонентов...');

  const htmlPath = './eap-enhanced-analysis-test.html';
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Показываем, что есть в файле
  console.log('🔍 Ищем строку с количеством...');

  const oldText =
    '          🔧 Всего зарегистрировано: <strong>2 checkers</strong> | 📦 Проект модулей:\n          <strong>4</strong>';
  const newText =
    '          🔧 Всего зарегистрировано: <strong>5 checkers</strong> | 📦 Проект модулей:\n          <strong>3</strong>';

  if (html.includes(oldText)) {
    console.log('✅ Строка найдена! Заменяем...');
    html = html.replace(oldText, newText);

    fs.writeFileSync(htmlPath, html);
    console.log('✅ Файл обновлен!');

    // Открываем в браузере
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const absolutePath = path.resolve(htmlPath);
    await execAsync(`start "" "${absolutePath}"`);

    console.log('🌐 Страница открыта с новыми числами!');
  } else {
    console.log('❌ Строка не найдена. Показываем что есть в файле...');
    const lines = html.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('checkers') || line.includes('модулей')) {
        console.log(`Строка ${index + 1}: ${line.trim()}`);
      }
    });
  }
}

simpleUpdate().catch(console.error);
