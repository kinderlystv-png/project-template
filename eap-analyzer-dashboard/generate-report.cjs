#!/usr/bin/env node

/**
 * ⚠️  DEPRECATED: Используйте live-generator.cjs
 * Этот файл оставлен для совместимости
 * Использование: node generate-report.cjs
 */

console.log('⚠️  ВНИМАНИЕ: generate-report.cjs устарел!');
console.log('');
console.log('🔄 Используйте новый live-генератор:');
console.log('   node live-generator.cjs');
console.log('');
console.log('✨ Преимущества live-generator.cjs:');
console.log('   • Анализ 184+ реальных компонентов');
console.log('   • Автоматические метрики готовности');
console.log('   • Live-обновление dashboard');
console.log('   • Архивирование отчетов');
console.log('');

// Автоматически запускаем новый генератор
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Автоматически запускаем live-generator.cjs...');
console.log('='.repeat(50));

const liveGenerator = path.join(__dirname, 'live-generator.cjs');
const child = spawn('node', [liveGenerator], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('close', code => {
  if (code === 0) {
    console.log('\n✅ Live-генератор завершен успешно!');
    console.log('� Теперь обновите dashboard: http://localhost:8080/eap-analyzer-dashboard/');
  } else {
    console.log(`\n❌ Live-генератор завершился с кодом ${code}`);
  }
});

child.on('error', error => {
  console.error('❌ Ошибка запуска live-генератора:', error.message);
});
