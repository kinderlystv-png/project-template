#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Безопасное чтение JSON файла
 * @param {string} filePath - Путь к файлу
 * @returns {object|null} - Содержимое файла или null при ошибке
 */
exports.readJsonFile = filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Безопасная запись JSON файла
 * @param {string} filePath - Путь к файлу
 * @param {object} content - Содержимое для записи
 * @returns {boolean} - Успешность операции
 */
exports.writeJsonFile = (filePath, content) => {
  try {
    const jsonString = JSON.stringify(content, null, 2);
    fs.writeFileSync(filePath, jsonString);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Обновление текстового файла с заменами
 * @param {string} filePath - Путь к файлу
 * @param {Array<[string, string]>} replacements - Массив замен [старое, новое]
 * @returns {boolean} - Успешность операции
 */
exports.updateFile = (filePath, replacements) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    replacements.forEach(([search, replace]) => {
      content = content.replace(new RegExp(search, 'g'), replace);
    });

    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Безопасное удаление файла
 * @param {string} filePath - Путь к файлу
 * @returns {boolean} - Успешность операции
 */
exports.deleteFile = filePath => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Removed: ${path.basename(filePath)}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Проверка существования файла
 * @param {string} filePath - Путь к файлу
 * @returns {boolean} - Существует ли файл
 */
exports.fileExists = filePath => {
  return fs.existsSync(filePath);
};

/**
 * Создание директории (рекурсивно)
 * @param {string} dirPath - Путь к директории
 * @returns {boolean} - Успешность операции
 */
exports.createDirectory = dirPath => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error creating directory ${dirPath}:`, error.message);
    return false;
  }
};

/**
 * Копирование файла
 * @param {string} source - Исходный файл
 * @param {string} destination - Целевой файл
 * @returns {boolean} - Успешность операции
 */
exports.copyFile = (source, destination) => {
  try {
    fs.copyFileSync(source, destination);
    console.log(`📋 Copied: ${path.basename(source)} → ${path.basename(destination)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${source} to ${destination}:`, error.message);
    return false;
  }
};

/**
 * Получение списка файлов в директории
 * @param {string} dirPath - Путь к директории
 * @param {string} extension - Фильтр по расширению (опционально)
 * @returns {Array<string>} - Список файлов
 */
exports.getFiles = (dirPath, extension = null) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    let files = fs.readdirSync(dirPath);

    if (extension) {
      files = files.filter(file => file.endsWith(extension));
    }

    return files.map(file => path.join(dirPath, file));
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    return [];
  }
};

/**
 * Выполнение задач с отчетом о прогрессе
 * @param {Array<{name: string, fn: Function}>} tasks - Массив задач
 * @returns {Promise<boolean>} - Успешность выполнения всех задач
 */
exports.executeTasks = async tasks => {
  console.log(`📋 Executing ${tasks.length} tasks...\n`);

  let completed = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      console.log(`🔄 ${task.name}...`);
      const result = await task.fn();

      if (result !== false) {
        console.log(`✅ ${task.name} completed\n`);
        completed++;
      } else {
        throw new Error('Task returned false');
      }
    } catch (error) {
      console.error(`❌ ${task.name} failed:`, error.message);
      failed++;

      if (task.required !== false) {
        console.error('🛑 Required task failed. Stopping execution.');
        return false;
      }
      console.log(`⚠️ Optional task failed. Continuing...\n`);
    }
  }

  console.log(`📊 Results: ${completed} completed, ${failed} failed`);
  return failed === 0;
};
