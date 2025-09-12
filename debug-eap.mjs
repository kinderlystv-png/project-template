#!/usr/bin/env node

/**
 * Быстрый запуск EAP Debugger
 * Использование: npm run debug-eap
 */
/* eslint-disable no-console */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Запуск EAP Debugger...');

const scriptPath = path.join(__dirname, 'run-simple-debugger.ts');
const command = `npx tsx "${scriptPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️  Предупреждение: ${stderr}`);
  }
  console.log(stdout);
});
