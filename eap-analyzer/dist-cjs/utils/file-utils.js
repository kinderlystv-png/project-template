"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEncoding = detectEncoding;
exports.readFileWithEncoding = readFileWithEncoding;
exports.convertWin1251ToUtf8 = convertWin1251ToUtf8;
exports.safeReadFile = safeReadFile;
exports.isTextFile = isTextFile;
exports.getFileInfo = getFileInfo;
/**
 * Утилиты для работы с файлами и кодировками (TypeScript версия)
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Определяет кодировку файла
 */
function detectEncoding(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
        return 'utf8';
    }
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        return 'utf16le';
    }
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
        return 'utf16be';
    }
    // Проверяем на наличие характерных для Windows-1251 байтов
    const win1251Chars = [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7,
    ];
    let win1251Count = 0;
    let totalBytes = Math.min(buffer.length, 1000);
    for (let i = 0; i < totalBytes; i++) {
        if (win1251Chars.includes(buffer[i])) {
            win1251Count++;
        }
    }
    // Если более 2% байтов характерны для Win-1251
    if (win1251Count / totalBytes > 0.02) {
        return 'win1251';
    }
    return 'utf8';
}
/**
 * Читает файл с правильной кодировкой
 */
function readFileWithEncoding(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const encoding = detectEncoding(buffer);
        if (encoding === 'win1251') {
            return convertWin1251ToUtf8(buffer);
        }
        return buffer.toString(encoding);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Ошибка чтения файла ${filePath}: ${message}`);
    }
}
/**
 * Конвертирует Windows-1251 в UTF-8
 */
function convertWin1251ToUtf8(buffer) {
    const win1251ToUnicode = {
        128: 1026,
        129: 1027,
        130: 8218,
        131: 1107,
        132: 8222,
        133: 8230,
        134: 8224,
        135: 8225,
        136: 8364,
        137: 8240,
        138: 1033,
        139: 8249,
        140: 1034,
        141: 1036,
        142: 1035,
        143: 1039,
        144: 1106,
        145: 8216,
        146: 8217,
        147: 8220,
        148: 8221,
        149: 8226,
        150: 8211,
        151: 8212,
        152: 152,
        153: 8482,
        154: 1113,
        155: 8250,
        156: 1114,
        157: 1116,
        158: 1115,
        159: 1119,
        160: 160,
        161: 1038,
        162: 1118,
        163: 1032,
        164: 164,
        165: 1168,
        166: 166,
        167: 167,
        168: 1025,
        169: 169,
        170: 1028,
        171: 171,
        172: 172,
        173: 173,
        174: 174,
        175: 1031,
        176: 176,
        177: 177,
        178: 1030,
        179: 1110,
        180: 1169,
        181: 181,
        182: 182,
        183: 183,
        184: 1105,
        185: 8470,
        186: 1108,
        187: 187,
        188: 1112,
        189: 1029,
        190: 1109,
        191: 1111,
    };
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte < 128) {
            result += String.fromCharCode(byte);
        }
        else if (byte < 192) {
            result += String.fromCharCode(win1251ToUnicode[byte] || byte);
        }
        else {
            result += String.fromCharCode(byte + 848);
        }
    }
    return result;
}
/**
 * Безопасное чтение файла с ограничениями
 */
function safeReadFile(filePath, maxSize = 10 * 1024 * 1024) {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
        throw new Error(`Файл ${filePath} слишком большой: ${stats.size} байт (лимит: ${maxSize})`);
    }
    if (!isTextFile(filePath)) {
        throw new Error(`Файл ${filePath} не является текстовым`);
    }
    return readFileWithEncoding(filePath);
}
/**
 * Проверяет, является ли файл текстовым
 */
function isTextFile(filePath) {
    const textExtensions = [
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
        '.md',
        '.txt',
        '.yml',
        '.yaml',
        '.html',
        '.css',
        '.scss',
        '.sass',
        '.vue',
        '.svelte',
        '.py',
        '.php',
        '.java',
        '.c',
        '.cpp',
        '.h',
        '.cs',
        '.rb',
        '.go',
        '.rs',
        '.swift',
        '.xml',
        '.ini',
        '.cfg',
        '.conf',
        '.log',
        '.sql',
        '.sh',
        '.bat',
        '.ps1',
        '.dockerfile',
        '.gitignore',
        '.env',
    ];
    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
}
/**
 * Получает информацию о файле
 */
function getFileInfo(filePath) {
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath, { encoding: null });
    const encoding = detectEncoding(buffer);
    return {
        path: filePath,
        encoding,
        size: stats.size,
        isText: isTextFile(filePath),
        hasBOM: buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf,
    };
}
//# sourceMappingURL=file-utils.js.map