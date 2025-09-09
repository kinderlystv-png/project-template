/**
 * Утилиты для работы с файлами с корректной обработкой кодировки
 */
const fs = require('fs');
const path = require('path');

/**
 * Определяет кодировку файла по BOM или содержимому
 * @param {Buffer} buffer Буфер данных файла
 * @returns {string} Определенная кодировка
 */
function detectEncoding(buffer) {
  // Проверка BOM (Byte Order Mark)
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'utf8';
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'utf16be';
  }

  // Эвристический анализ для кириллицы
  let cyrillicCount = 0;
  let invalidUtf8Count = 0;

  for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
    // Проверяем диапазон кириллицы в Windows-1251
    if (buffer[i] >= 0xc0 && buffer[i] <= 0xff) cyrillicCount++;
  }

  // Пробуем декодировать как UTF-8 и проверяем на ошибки
  try {
    const utf8Text = buffer.toString('utf8');
    invalidUtf8Count = (utf8Text.match(/�/g) || []).length;
  } catch (e) {
    invalidUtf8Count = 100; // Много ошибок
  }

  // Если много кириллицы и много ошибок UTF-8, вероятно Windows-1251
  if (cyrillicCount > 10 && invalidUtf8Count > 5) {
    return 'win1251';
  }

  return 'utf8'; // По умолчанию используем UTF-8
}

/**
 * Читает файл с автоопределением кодировки
 * @param {string} filePath Путь к файлу
 * @returns {string} Содержимое файла
 */
function readFileWithEncoding(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const encoding = detectEncoding(buffer);

    if (encoding === 'utf8') {
      return buffer.toString('utf8');
    }

    // Для Windows-1251 используем простую карту символов
    if (encoding === 'win1251') {
      return convertWin1251ToUtf8(buffer);
    }

    return buffer.toString(encoding);
  } catch (error) {
    console.error(`Ошибка при чтении файла ${filePath}: ${error.message}`);
    return '';
  }
}

/**
 * Простая конвертация Windows-1251 в UTF-8
 * @param {Buffer} buffer Буфер данных
 * @returns {string} Строка в UTF-8
 */
function convertWin1251ToUtf8(buffer) {
  // Карта символов Windows-1251 для кириллицы
  const win1251Map = {
    0xc0: 'А',
    0xc1: 'Б',
    0xc2: 'В',
    0xc3: 'Г',
    0xc4: 'Д',
    0xc5: 'Е',
    0xc6: 'Ж',
    0xc7: 'З',
    0xc8: 'И',
    0xc9: 'Й',
    0xca: 'К',
    0xcb: 'Л',
    0xcc: 'М',
    0xcd: 'Н',
    0xce: 'О',
    0xcf: 'П',
    0xd0: 'Р',
    0xd1: 'С',
    0xd2: 'Т',
    0xd3: 'У',
    0xd4: 'Ф',
    0xd5: 'Х',
    0xd6: 'Ц',
    0xd7: 'Ч',
    0xd8: 'Ш',
    0xd9: 'Щ',
    0xda: 'Ъ',
    0xdb: 'Ы',
    0xdc: 'Ь',
    0xdd: 'Э',
    0xde: 'Ю',
    0xdf: 'Я',
    0xe0: 'а',
    0xe1: 'б',
    0xe2: 'в',
    0xe3: 'г',
    0xe4: 'д',
    0xe5: 'е',
    0xe6: 'ж',
    0xe7: 'з',
    0xe8: 'и',
    0xe9: 'й',
    0xea: 'к',
    0xeb: 'л',
    0xec: 'м',
    0xed: 'н',
    0xee: 'о',
    0xef: 'п',
    0xf0: 'р',
    0xf1: 'с',
    0xf2: 'т',
    0xf3: 'у',
    0xf4: 'ф',
    0xf5: 'х',
    0xf6: 'ц',
    0xf7: 'ч',
    0xf8: 'ш',
    0xf9: 'щ',
    0xfa: 'ъ',
    0xfb: 'ы',
    0xfc: 'ь',
    0xfd: 'э',
    0xfe: 'ю',
    0xff: 'я',
  };

  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (win1251Map[byte]) {
      result += win1251Map[byte];
    } else if (byte < 128) {
      result += String.fromCharCode(byte);
    } else {
      result += '?'; // Неизвестный символ
    }
  }

  return result;
}

/**
 * Записывает файл с указанной кодировкой
 * @param {string} filePath Путь к файлу
 * @param {string} content Содержимое для записи
 * @param {string} encoding Кодировка (по умолчанию UTF-8)
 */
function writeFileWithEncoding(filePath, content, encoding = 'utf8') {
  try {
    // Создаем директорию, если не существует
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Записываем файл с явным указанием кодировки
    fs.writeFileSync(filePath, content, { encoding: encoding });

    console.log(`✅ Файл записан: ${filePath} (${encoding})`);
  } catch (error) {
    console.error(`❌ Ошибка при записи файла ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Проверяет, является ли файл текстовым
 * @param {string} filePath Путь к файлу
 * @returns {boolean} true если файл текстовый
 */
function isTextFile(filePath) {
  const textExtensions = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.vue',
    '.svelte',
    '.html',
    '.htm',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.json',
    '.xml',
    '.yml',
    '.yaml',
    '.toml',
    '.md',
    '.txt',
    '.log',
    '.csv',
    '.php',
    '.py',
    '.rb',
    '.go',
    '.rs',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.sql',
    '.sh',
    '.bat',
    '.ps1',
    '.gitignore',
    '.env',
    '.editorconfig',
  ];

  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  // Проверяем расширение
  if (textExtensions.includes(ext)) {
    return true;
  }

  // Проверяем специальные файлы без расширения
  const specialFiles = [
    'dockerfile',
    'makefile',
    'readme',
    'license',
    'changelog',
    'package.json',
    'tsconfig.json',
    'eslintrc',
    'prettierrc',
  ];

  return specialFiles.some(name => basename.includes(name));
}

/**
 * Безопасно читает файл, проверяя его тип
 * @param {string} filePath Путь к файлу
 * @returns {string|null} Содержимое файла или null для бинарных файлов
 */
function safeReadFile(filePath) {
  try {
    // Проверяем размер файла
    const stats = fs.statSync(filePath);
    if (stats.size > 50 * 1024 * 1024) {
      // 50MB
      console.warn(`⚠️ Файл слишком большой, пропускаем: ${filePath}`);
      return null;
    }

    // Проверяем, является ли файл текстовым
    if (!isTextFile(filePath)) {
      return null;
    }

    return readFileWithEncoding(filePath);
  } catch (error) {
    console.error(`❌ Ошибка при чтении файла ${filePath}: ${error.message}`);
    return null;
  }
}

module.exports = {
  detectEncoding,
  readFileWithEncoding,
  writeFileWithEncoding,
  convertWin1251ToUtf8,
  isTextFile,
  safeReadFile,
};
