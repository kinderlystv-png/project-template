#!/usr/bin/env node

/**
 * CLI для тестирования исправлений критических багов EAP
 */

import { BugFixTester } from '../testing/bug-fix-tester.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tester = new BugFixTester();

  switch (command) {
    case 'test':
    case 'test-fixes':
      await tester.runAllTests();
      break;

    case 'test-project':
      const projectPath = args[1];
      if (!projectPath) {
        console.log('❌ Укажите путь к проекту: npm run test-project <path>');
        process.exit(1);
      }
      await tester.testRealProject(projectPath);
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    default:
      console.log('❌ Неизвестная команда. Используйте --help для справки.');
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
🧪 EAP Bug Fix Tester - Тестирование исправлений критических багов

ИСПОЛЬЗОВАНИЕ:
  npm run test-fixes              # Запустить все тесты исправлений
  npm run test-project <path>     # Протестировать реальный проект
  npm run test-fixes help         # Показать эту справку

ПРИМЕРЫ:
  npm run test-fixes
  npm run test-project ./my-project
  npm run test-project ../kinderly-events

ОПИСАНИЕ:
  Этот инструмент проверяет, что исправления критических багов EAP работают корректно:

  ✅ Дупликация не превышает 100%
  ✅ Сложность рассчитывается корректно
  ✅ Сгенерированные файлы исключаются
  ✅ Классификация файлов работает правильно
`);
}

main().catch(error => {
  console.error('❌ Ошибка при выполнении тестов:', error);
  process.exit(1);
});
