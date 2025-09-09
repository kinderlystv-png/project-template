#!/usr/bin/env node

/**
 * Пост-обработка CommonJS сборки для совместимости
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixCjsExports() {
  const distCjsDir = path.join(__dirname, '..', 'dist-cjs');
  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distCjsDir)) {
    console.log('⚠️ Директория dist-cjs не найдена, пропускаем...');
    return;
  }

  // Копируем файлы из dist-cjs в dist с расширением .cjs
  function copyWithCjsExtension(srcDir, destDir) {
    const items = fs.readdirSync(srcDir);

    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        const destSubDir = path.join(destDir, item);
        if (!fs.existsSync(destSubDir)) {
          fs.mkdirSync(destSubDir, { recursive: true });
        }
        copyWithCjsExtension(srcPath, destSubDir);
      } else if (item.endsWith('.js')) {
        const cjsName = item.replace('.js', '.cjs');
        const destPath = path.join(destDir, cjsName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`📄 Создан CommonJS файл: ${cjsName}`);
      }
    }
  }

  copyWithCjsExtension(distCjsDir, distDir);

  // Удаляем временную директорию
  fs.rmSync(distCjsDir, { recursive: true, force: true });

  console.log('✅ CommonJS файлы созданы и скопированы');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixCjsExports();
}

export { fixCjsExports };
