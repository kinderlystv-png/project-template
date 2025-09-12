/**
 * Замена только числа
 */
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

async function ultraSimpleUpdate() {
  console.log('🚀 Ультра-простое обновление только числа...');

  const htmlPath = './eap-enhanced-analysis-test.html';
  let html = fs.readFileSync(htmlPath, 'utf8');

  console.log('🔍 Заменяем "2 checkers" на "5 checkers"...');

  const before = html.includes('2 checkers');
  console.log(`Before: содержит "2 checkers"? ${before}`);

  if (before) {
    html = html.replace('2 checkers', '5 checkers');

    fs.writeFileSync(htmlPath, html);
    const after = fs.readFileSync(htmlPath, 'utf8').includes('5 checkers');
    console.log(`After: содержит "5 checkers"? ${after}`);

    if (after) {
      console.log('✅ Замена прошла успешно!');

      // Открываем в браузере
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const absolutePath = path.resolve(htmlPath);
      await execAsync(`start "" "${absolutePath}"`);

      console.log('🌐 Страница открыта с обновленными данными!');
    } else {
      console.log('❌ Замена не сработала');
    }
  } else {
    console.log('❌ "2 checkers" не найдено в файле');
  }
}

ultraSimpleUpdate().catch(console.error);
