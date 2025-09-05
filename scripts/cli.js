#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectName = process.argv[2];

if (!projectName) {
  console.error('❌ Укажите название проекта');
  console.log('Использование: npx create-alphacore-app <project-name>');
  process.exit(1);
}

console.log(`🚀 Создаем проект ${projectName}...`);

try {
  // Клонируем шаблон
  console.log('📥 Клонируем шаблон...');
  execSync(`git clone https://github.com/alphacore/project-template ${projectName}`, {
    stdio: 'pipe',
  });

  // Переходим в папку
  process.chdir(projectName);

  // Удаляем .git
  console.log('🧹 Очищаем Git историю...');
  if (fs.existsSync('.git')) {
    fs.rmSync('.git', { recursive: true, force: true });
  }

  // Инициализируем новый git
  execSync('git init', { stdio: 'pipe' });

  // Устанавливаем зависимости
  console.log('📦 Устанавливаем зависимости...');
  execSync('npm install', { stdio: 'inherit' });

  // Запускаем setup
  console.log('⚙️ Настраиваем проект...');
  execSync('npm run setup:project', { stdio: 'inherit' });

  console.log(`
✅ Проект ${projectName} готов!

📋 Следующие шаги:
cd ${projectName}
npm run dev

🎉 Удачной разработки!
`);
} catch (error) {
  console.error('❌ Ошибка при создании проекта:', error.message);
  process.exit(1);
}
