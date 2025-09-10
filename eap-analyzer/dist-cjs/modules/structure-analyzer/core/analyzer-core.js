"use strict";
/**
 * Основной класс анализатора структуры проекта
 * Содержит базовую конфигурацию и координацию модулей
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerCore = void 0;
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const module_1 = require("module");
const require = (0, module_1.createRequire)(import.meta.url);
const config = require('../config.json');
const learning_js_1 = __importDefault(require("../learning.js"));
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
/**
 * Основной класс StructureAnalyzer
 */
class AnalyzerCore {
    constructor(userConfig = {}) {
        this.config = this.loadConfig(userConfig);
        this.learningSystem = new learning_js_1.default(this.config.dataDir);
        this.version = config.module.version;
    }
    /**
     * Загружает конфигурацию модуля
     */
    loadConfig(userConfig) {
        const defaultConfig = {
            dataDir: path_1.default.join(__dirname, '../../../../../data/learning'),
            enableLearning: config.analysis.types.learning.enabled,
            enableAdvancedAnalysis: config.analysis.types.advanced.enabled,
            thresholds: config.thresholds.basic,
            outputFormat: config.output.defaultFormat,
            performanceSettings: config.performance,
            integrationSettings: config.integration,
        };
        return { ...defaultConfig, ...userConfig };
    }
    /**
     * Проверяет размер проекта на соответствие ограничениям производительности
     */
    async validateProjectSize(projectPath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const stats = await fs.promises.stat(projectPath);
        if (!stats.isDirectory()) {
            throw new Error('Project path must be a directory');
        }
        // Проверяем ограничения размера проекта
        const maxSize = this.config.performanceSettings?.maxProjectSize || 500 * 1024 * 1024; // 500MB
        const folderSize = await this.getFolderSize(projectPath);
        if (folderSize > maxSize) {
            throw new Error(`Project size (${Math.round(folderSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`);
        }
    }
    /**
     * Вычисляет размер папки рекурсивно
     */
    async getFolderSize(dirPath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        let totalSize = 0;
        const files = await fs.promises.readdir(dirPath);
        for (const file of files) {
            if (file.startsWith('.') || file === 'node_modules')
                continue;
            const filePath = path_1.default.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                totalSize += await this.getFolderSize(filePath);
            }
            else {
                totalSize += stats.size;
            }
        }
        return totalSize;
    }
    /**
     * Получает адаптивные пороги анализа
     */
    getAnalysisThresholds() {
        return this.config.enableLearning
            ? this.learningSystem.getCurrentThresholds()
            : { basic: this.config.thresholds };
    }
    /**
     * Получает статистику обучения системы
     */
    getLearningStats() {
        return this.config.enableLearning ? this.learningSystem.getLearningStats() : null;
    }
    /**
     * Обновляет систему обучения результатами анализа
     */
    updateLearningSystem(projectPath, basicResults, advancedResults) {
        if (this.config.enableLearning) {
            console.log('[AnalyzerCore] Обновление системы обучения...');
            this.learningSystem.addAnalysisResult(projectPath, basicResults, advancedResults);
        }
    }
    /**
     * Получает информацию о модуле
     */
    getModuleInfo() {
        return {
            name: config.module.name,
            version: this.version,
            description: config.module.description,
            capabilities: {
                basicAnalysis: true,
                advancedAnalysis: this.config.enableAdvancedAnalysis,
                learningSystem: this.config.enableLearning,
                eapIntegration: true,
            },
        };
    }
}
exports.AnalyzerCore = AnalyzerCore;
exports.default = AnalyzerCore;
//# sourceMappingURL=analyzer-core.js.map