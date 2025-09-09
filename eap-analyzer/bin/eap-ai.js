#!/usr/bin/env node

// Загрузка с поддержкой ES modules
import('../dist/ai-integration/cli.js').catch(err => {
  console.error('❌ Ошибка загрузки AI CLI:', err.message);
  console.error('Убедитесь что проект собран (npm run build)');
  process.exit(1);
});
