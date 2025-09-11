#!/usr/bin/env node

/**
 * Простой запускатор генератора отчетов (CommonJS версия)
 * Использование: node generate-report.cjs
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск генератора отчетов EAP Analyzer...');
console.log('📂 Рабочая директория:', process.cwd());

const generatorPath = path.join(__dirname, 'report-generator.cjs');
const child = spawn('node', [generatorPath], {
    stdio: 'inherit',
    cwd: process.cwd()
});

child.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Генерация отчета завершена успешно!');
        console.log('📊 Dashboard будет автоматически обновлен при следующем открытии');
        console.log('🌐 Откройте http://localhost:8080 для просмотра обновленных данных');
    } else {
        console.log(`\n❌ Генератор завершился с кодом ${code}`);
    }
});

child.on('error', (error) => {
    console.error('❌ Ошибка запуска генератора:', error.message);
});
