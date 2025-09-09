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
/**
 * Обеспечение совместимости между CommonJS и ES модулями
 */
const fs = require('fs');
const path = require('path');
// Определяем тип текущего модуля
const isESM = typeof require === 'undefined';
/**
 * Динамически импортирует модуль в любой среде (ESM или CommonJS)
 * @param {string} modulePath Путь к модулю
 * @returns {Promise<any>} Загруженный модуль
 */
async function dynamicImport(modulePath) {
    try {
        if (isESM) {
            return await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
        }
        else {
            return Promise.resolve(require(modulePath));
        }
    }
    catch (error) {
        console.error(`Ошибка при загрузке модуля ${modulePath}: ${error.message}`);
        throw error;
    }
}
/**
 * Создает обертку для модуля, совместимую с обоими форматами
 * @param {Object} moduleExports Экспорты модуля
 * @returns {Object} Совместимый объект модуля
 */
function createCompatModule(moduleExports) {
    if (!moduleExports || typeof moduleExports !== 'object') {
        return moduleExports;
    }
    const compatExports = { ...moduleExports };
    // Добавляем default свойство для ES модулей, если его нет
    if (!compatExports.default) {
        compatExports.default = compatExports;
    }
    return compatExports;
}
/**
 * Проверяет, является ли проект ES модулями
 * @param {string} projectPath Путь к проекту
 * @returns {boolean} true если проект использует ES модули
 */
function isESMProject(projectPath) {
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return packageJson.type === 'module';
        }
    }
    catch (error) {
        console.error(`Ошибка при проверке типа проекта: ${error.message}`);
    }
    return false;
}
/**
 * Создает совместимые точки входа для модуля
 * @param {string} modulePath Путь к модулю
 * @param {Object} exports Экспорты модуля
 */
function createCompatibleEntryPoints(modulePath, exports) {
    const dir = path.dirname(modulePath);
    const basename = path.basename(modulePath, '.js');
    // Создаем .mjs версию для ES модулей
    const mjsPath = path.join(dir, `${basename}.mjs`);
    const cjsContent = fs.readFileSync(modulePath, 'utf8');
    // Простое преобразование CommonJS в ES модуль
    let esmContent = cjsContent
        .replace(/const\s+(\w+)\s+=\s+require\(['"`]([^'"`]+)['"`]\);/g, "import $1 from '$2';")
        .replace(/module\.exports\s+=\s+{([^}]+)};/, 'export { $1 };\nexport default { $1 };')
        .replace(/module\.exports\s+=\s+(\w+);/, 'export default $1;');
    try {
        fs.writeFileSync(mjsPath, esmContent, 'utf8');
        console.log(`✅ Создан ES модуль: ${mjsPath}`);
    }
    catch (error) {
        console.error(`❌ Ошибка при создании ES модуля: ${error.message}`);
    }
}
/**
 * Обновляет package.json для поддержки обоих типов модулей
 * @param {string} packagePath Путь к папке пакета
 */
function makePackageCompatible(packagePath) {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.warn(`⚠️ package.json не найден в ${packagePath}`);
        return;
    }
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        let hasChanges = false;
        // Добавляем поля для поддержки обоих типов модулей
        if (!packageJson.type) {
            packageJson.type = 'commonjs';
            hasChanges = true;
        }
        // Настраиваем exports для поддержки обоих форматов
        if (!packageJson.exports) {
            const mainFile = packageJson.main || 'index.js';
            const esmFile = mainFile.replace(/\.js$/, '.mjs');
            packageJson.exports = {
                '.': {
                    import: `./${esmFile}`,
                    require: `./${mainFile}`,
                },
            };
            hasChanges = true;
        }
        // Добавляем скрипты для совместимости
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }
        if (!packageJson.scripts['build:esm']) {
            packageJson.scripts['build:esm'] = 'node src/utils/module-compatibility.js createESM';
            hasChanges = true;
        }
        // Записываем обновленный package.json
        if (hasChanges) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
            console.log(`✅ Обновлен package.json для совместимости модулей`);
        }
    }
    catch (error) {
        console.error(`❌ Ошибка при обновлении package.json: ${error.message}`);
    }
}
/**
 * Безопасный импорт модуля с fallback
 * @param {string} modulePath Путь к модулю
 * @param {any} fallback Значение по умолчанию при ошибке
 * @returns {Promise<any>} Импортированный модуль или fallback
 */
async function safeImport(modulePath, fallback = null) {
    try {
        return await dynamicImport(modulePath);
    }
    catch (error) {
        console.warn(`⚠️ Не удалось загрузить модуль ${modulePath}, используем fallback`);
        return fallback;
    }
}
/**
 * Определяет правильный путь к модулю в зависимости от типа проекта
 * @param {string} basePath Базовый путь к модулю
 * @param {string} projectPath Путь к проекту
 * @returns {string} Правильный путь к модулю
 */
function resolveModulePath(basePath, projectPath) {
    const isESMProj = isESMProject(projectPath);
    if (isESMProj && !basePath.endsWith('.mjs')) {
        const mjsPath = basePath.replace(/\.js$/, '.mjs');
        if (fs.existsSync(mjsPath)) {
            return mjsPath;
        }
    }
    return basePath;
}
// Если скрипт запущен напрямую, выполняем команды
if (require.main === module) {
    const command = process.argv[2];
    const targetPath = process.argv[3] || process.cwd();
    switch (command) {
        case 'makePackageCompatible':
            makePackageCompatible(targetPath);
            break;
        case 'createESM':
            const mainFile = path.join(targetPath, 'src/index.js');
            if (fs.existsSync(mainFile)) {
                createCompatibleEntryPoints(mainFile, {});
            }
            break;
        default:
            console.log('Доступные команды:');
            console.log('  makePackageCompatible [path] - Обновить package.json для совместимости');
            console.log('  createESM [path] - Создать ES модуль версии файлов');
    }
}
module.exports = createCompatModule({
    isESM,
    dynamicImport,
    createCompatModule,
    isESMProject,
    createCompatibleEntryPoints,
    makePackageCompatible,
    safeImport,
    resolveModulePath,
});
//# sourceMappingURL=module-compatibility.js.map