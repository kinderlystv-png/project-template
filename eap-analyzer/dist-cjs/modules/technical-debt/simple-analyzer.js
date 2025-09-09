"use strict";
/**
 * Упрощенный анализатор технического долга для интеграции
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
exports.SimpleTechnicalDebtAnalyzer = void 0;
const analyzer_js_1 = require("../../core/analyzer.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SimpleTechnicalDebtAnalyzer extends analyzer_js_1.BaseAnalyzer {
    WORKING_HOURS_PER_DAY = 8;
    HOURLY_RATE = 50;
    getName() {
        return 'simple-technical-debt';
    }
    get metadata() {
        return {
            name: 'Simple Technical Debt Analyzer',
            version: '1.0.0',
            description: 'Упрощенная оценка технического долга',
            supportedFileTypes: ['.ts', '.js', '.tsx', '.jsx'],
        };
    }
    async analyze(projectPath) {
        console.log('💰 Простой анализ технического долга...');
        try {
            const files = await this.getCodeFiles(projectPath);
            const categories = await this.analyzeDebtCategories(files);
            const totalDebt = this.calculateTotalDebt(categories);
            return {
                totalDebt: totalDebt.totalHours,
                categories,
                monthlyInterest: Math.round(totalDebt.totalHours * 0.05),
                roiAnalysis: {
                    investmentRequired: Math.round(totalDebt.totalHours * 0.7),
                    expectedReturn: Math.round(totalDebt.totalHours * 1.4),
                    paybackPeriod: 12,
                },
            };
        }
        catch (error) {
            console.error('Ошибка анализа технического долга:', error);
            return {
                totalDebt: 0,
                categories: [],
                monthlyInterest: 0,
                roiAnalysis: null,
            };
        }
    }
    async getCodeFiles(projectPath) {
        const files = [];
        const extensions = ['.ts', '.js', '.tsx', '.jsx'];
        const scanDir = async (dir) => {
            try {
                const items = await fs.promises.readdir(dir);
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules' || item === 'dist')
                        continue;
                    const fullPath = path.join(dir, item);
                    const stat = await fs.promises.stat(fullPath);
                    if (stat.isDirectory()) {
                        await scanDir(fullPath);
                    }
                    else if (extensions.some(ext => item.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Игнорируем ошибки доступа к файлам
            }
        };
        await scanDir(projectPath);
        return files;
    }
    async analyzeDebtCategories(files) {
        const categories = [];
        // Анализ сложности
        let complexityDebt = 0;
        let duplicateDebt = 0;
        let testDebt = 0;
        for (const file of files.slice(0, 20)) {
            // Ограничиваем для производительности
            try {
                const content = await fs.promises.readFile(file, 'utf-8');
                const lines = content.split('\n').length;
                // Примерная оценка сложности
                const complexity = (content.match(/if|for|while|switch|catch/g) || []).length;
                if (complexity > lines * 0.1) {
                    complexityDebt += complexity * 0.5; // 30 минут на единицу избыточной сложности
                }
                // Примерная оценка дублирования
                const uniqueLines = new Set(content.split('\n').map(l => l.trim())).size;
                const duplicationRatio = 1 - uniqueLines / lines;
                if (duplicationRatio > 0.1) {
                    duplicateDebt += lines * duplicationRatio * 0.1; // 6 минут на дублированную строку
                }
                // Проверка наличия тестов
                const hasTest = files.some(f => f.includes(path.basename(file, path.extname(file))) &&
                    (f.includes('.test.') || f.includes('.spec.')));
                if (!hasTest) {
                    testDebt += 4; // 4 часа на создание тестов для файла
                }
            }
            catch (error) {
                // Игнорируем ошибки чтения файлов
            }
        }
        categories.push({
            name: 'High Complexity',
            debt: Math.round(complexityDebt),
            impact: 'High',
            items: [],
        });
        categories.push({
            name: 'Code Duplication',
            debt: Math.round(duplicateDebt),
            impact: 'Medium',
            items: [],
        });
        categories.push({
            name: 'Missing Tests',
            debt: Math.round(testDebt),
            impact: 'Critical',
            items: [],
        });
        return categories.filter(c => c.debt > 0);
    }
    calculateTotalDebt(categories) {
        const totalHours = categories.reduce((sum, cat) => sum + cat.debt, 0);
        const totalCost = totalHours * this.HOURLY_RATE;
        return {
            totalHours,
            totalCost,
            categories,
        };
    }
}
exports.SimpleTechnicalDebtAnalyzer = SimpleTechnicalDebtAnalyzer;
//# sourceMappingURL=simple-analyzer.js.map