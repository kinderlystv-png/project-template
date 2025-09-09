"use strict";
/**
 * Чекер производительности - проверяет общие проблемы производительности
 */
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
exports.PerformanceChecker = void 0;
const checker_js_1 = require("../core/checker.js");
const path = __importStar(require("path"));
class PerformanceChecker extends checker_js_1.BaseChecker {
    name = 'Performance Check';
    category = 'performance';
    description = 'Проверка общих проблем производительности';
    get priority() {
        return 3;
    }
    async check(context) {
        let score = 100;
        const issues = [];
        const recommendations = [];
        try {
            // Проверка размера bundle
            await this.checkBundleSize(context.projectPath, issues, recommendations);
            // Проверка зависимостей
            await this.checkDependencies(context.projectPath, issues, recommendations);
            // Проверка конфигурации сборки
            await this.checkBuildConfig(context.projectPath, issues, recommendations);
            // Проверка оптимизации изображений
            await this.checkImageOptimization(context.projectPath, issues, recommendations);
            // Вычисляем финальный балл
            score = Math.max(0, score - issues.length * 10);
            const passed = score >= 70;
            const message = passed
                ? `Проверки производительности пройдены (${score}/100)`
                : `Обнаружены проблемы производительности (${score}/100): ${issues.length} проблем`;
            return this.createResult(passed, score, message, { issues, detailsCount: issues.length }, recommendations);
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
    async checkBundleSize(projectPath, issues, recommendations) {
        const distPath = path.join(projectPath, 'dist');
        const buildPath = path.join(projectPath, 'build');
        const buildDir = this.fileExists(distPath)
            ? distPath
            : this.fileExists(buildPath)
                ? buildPath
                : null;
        if (!buildDir) {
            return; // Нет сборки - пропускаем
        }
        try {
            const fs = require('fs').promises;
            const bundleFiles = await this.findJsFiles(buildDir);
            for (const file of bundleFiles) {
                const stats = await fs.stat(file);
                const sizeInMB = stats.size / (1024 * 1024);
                if (sizeInMB > 5) {
                    const relativePath = path.relative(projectPath, file);
                    issues.push(`Большой размер bundle: ${relativePath} (${sizeInMB.toFixed(2)}MB)`);
                    recommendations.push('Рассмотрите code splitting и tree shaking');
                }
            }
        }
        catch {
            // Игнорируем ошибки чтения файлов
        }
    }
    async checkDependencies(projectPath, issues, recommendations) {
        const packagePath = path.join(projectPath, 'package.json');
        if (!this.fileExists(packagePath)) {
            return;
        }
        try {
            const content = this.readFile(packagePath);
            if (!content)
                return;
            const packageJson = JSON.parse(content);
            const dependencies = packageJson.dependencies || {};
            // Проверка тяжелых библиотек
            const heavyLibraries = [
                'moment', // Рекомендуем day.js
                'lodash', // Можно заменить на lodash-es
                'jquery', // В современных фреймворках обычно не нужен
            ];
            for (const lib of heavyLibraries) {
                if (dependencies[lib]) {
                    issues.push(`Обнаружена тяжелая библиотека: ${lib}`);
                    switch (lib) {
                        case 'moment':
                            recommendations.push('Замените moment.js на day.js для уменьшения размера');
                            break;
                        case 'lodash':
                            recommendations.push('Используйте lodash-es для tree shaking');
                            break;
                        case 'jquery':
                            recommendations.push('Рассмотрите удаление jQuery в пользу нативного JavaScript');
                            break;
                    }
                }
            }
            // Проверка количества зависимостей
            const depsCount = Object.keys(dependencies).length;
            if (depsCount > 50) {
                issues.push(`Слишком много зависимостей: ${depsCount}`);
                recommendations.push('Проведите аудит зависимостей и удалите неиспользуемые');
            }
        }
        catch (error) {
            // Игнорируем ошибки парсинга JSON
        }
    }
    async checkBuildConfig(projectPath, issues, recommendations) {
        const configFiles = [
            { name: 'vite.config.ts', type: 'vite' },
            { name: 'vite.config.js', type: 'vite' },
            { name: 'webpack.config.js', type: 'webpack' },
            { name: 'rollup.config.js', type: 'rollup' },
        ];
        for (const config of configFiles) {
            const configPath = path.join(projectPath, config.name);
            if (this.fileExists(configPath)) {
                const content = this.readFile(configPath);
                if (!content)
                    continue;
                switch (config.type) {
                    case 'vite':
                        this.checkViteConfig(content, issues, recommendations);
                        break;
                    case 'webpack':
                        this.checkWebpackConfig(content, issues, recommendations);
                        break;
                }
            }
        }
    }
    checkViteConfig(content, issues, recommendations) {
        // Проверка минификации
        if (!content.includes('minify') && !content.includes('terser')) {
            issues.push('Минификация не настроена в Vite конфигурации');
            recommendations.push('Включите минификацию для продакшн сборки');
        }
        // Проверка tree shaking
        if (!content.includes('rollupOptions')) {
            recommendations.push('Настройте rollupOptions для оптимизации bundle');
        }
    }
    checkWebpackConfig(content, issues, recommendations) {
        // Проверка режима production
        if (!content.includes('mode') || !content.includes('production')) {
            issues.push('Режим production не настроен в Webpack');
            recommendations.push('Настройте режим production для оптимизации');
        }
        // Проверка оптимизации
        if (!content.includes('optimization')) {
            issues.push('Блок optimization отсутствует в Webpack конфигурации');
            recommendations.push('Добавьте блок optimization с splitChunks');
        }
    }
    async checkImageOptimization(projectPath, issues, recommendations) {
        const staticDirs = ['public', 'static', 'assets', 'src/assets'];
        for (const dir of staticDirs) {
            const dirPath = path.join(projectPath, dir);
            if (this.fileExists(dirPath)) {
                try {
                    const imageFiles = await this.findImageFiles(dirPath);
                    for (const file of imageFiles.slice(0, 20)) {
                        // Ограничиваем для производительности
                        const fs = require('fs').promises;
                        const stats = await fs.stat(file);
                        const sizeInMB = stats.size / (1024 * 1024);
                        if (sizeInMB > 2) {
                            const relativePath = path.relative(projectPath, file);
                            issues.push(`Большое изображение: ${relativePath} (${sizeInMB.toFixed(2)}MB)`);
                            recommendations.push('Оптимизируйте изображения с помощью WebP или сжатия');
                        }
                    }
                }
                catch {
                    // Игнорируем ошибки чтения директорий
                }
            }
        }
    }
    async findJsFiles(dir) {
        const fs = require('fs').promises;
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findJsFiles(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
                    files.push(fullPath);
                }
            }
        }
        catch {
            // Игнорируем ошибки чтения
        }
        return files;
    }
    async findImageFiles(dir) {
        const fs = require('fs').promises;
        const files = [];
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findImageFiles(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (imageExts.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch {
            // Игнорируем ошибки чтения
        }
        return files;
    }
}
exports.PerformanceChecker = PerformanceChecker;
//# sourceMappingURL=performance.checker.js.map