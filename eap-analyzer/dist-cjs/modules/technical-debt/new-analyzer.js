"use strict";
/**
 * Анализатор технического долга - количественная оценка и ROI
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
exports.TechnicalDebtAnalyzer = void 0;
const analyzer_js_1 = require("../../core/analyzer.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TechnicalDebtAnalyzer extends analyzer_js_1.BaseAnalyzer {
    getName() {
        return 'technical-debt';
    }
    get metadata() {
        return {
            name: 'Technical Debt Analyzer',
            version: '1.0.0',
            description: 'Количественная оценка технического долга и ROI рефакторинга',
            supportedFileTypes: ['.ts', '.js', '.tsx', '.jsx'],
        };
    }
    async analyze(projectPath) {
        console.log('💰 Анализ технического долга...');
        const files = await this.getCodeFiles(projectPath);
        const debtData = {
            totalDebt: 0,
            monthlyInterest: 0,
            categories: [],
            hotspots: [],
            payoffPlan: [],
            roiAnalysis: {},
        };
        // Анализ категорий долга
        debtData.categories = await this.analyzeDebtCategories(files);
        // Поиск проблемных зон
        debtData.hotspots = await this.findDebtHotspots(files);
        // Расчет общего долга
        debtData.totalDebt = this.calculateTotalDebt(debtData.categories);
        debtData.monthlyInterest = this.calculateMonthlyInterest(debtData.totalDebt);
        // План погашения долга
        debtData.payoffPlan = this.generatePayoffPlan(debtData.categories);
        // ROI анализ
        debtData.roiAnalysis = this.calculateROI(debtData.categories, debtData.totalDebt);
        return {
            success: true,
            data: debtData,
            metadata: {
                analyzer: this.getName(),
                timestamp: new Date(),
                duration: 0,
                filesAnalyzed: files.length,
            },
        };
    }
    /**
     * Анализ категорий технического долга
     */
    async analyzeDebtCategories(files) {
        const categories = [
            {
                name: 'Code Duplication',
                debt: 0,
                impact: 'High',
                items: [],
            },
            {
                name: 'Complex Methods',
                debt: 0,
                impact: 'Medium',
                items: [],
            },
            {
                name: 'Large Classes',
                debt: 0,
                impact: 'High',
                items: [],
            },
            {
                name: 'Code Smells',
                debt: 0,
                impact: 'Medium',
                items: [],
            },
            {
                name: 'Missing Tests',
                debt: 0,
                impact: 'High',
                items: [],
            },
        ];
        for (const file of files) {
            const content = await this.readFile(file);
            const relativePath = path.relative(process.cwd(), file);
            // Дублирование кода
            const duplicationCount = this.detectDuplication(content);
            if (duplicationCount > 0) {
                categories[0].debt += duplicationCount * 4; // 4 часа на блок
                categories[0].items.push({
                    file: relativePath,
                    type: 'Code Duplication',
                    count: duplicationCount,
                    estimatedFix: `${duplicationCount * 4} часов`,
                });
            }
            // Сложные методы
            const complexMethods = this.findComplexMethods(content);
            if (complexMethods.length > 0) {
                const debt = complexMethods.reduce((sum, m) => sum + (m.complexity - 10) * 2, 0);
                categories[1].debt += debt;
                categories[1].items.push({
                    file: relativePath,
                    type: 'Complex Methods',
                    methods: complexMethods.length,
                    estimatedFix: `${debt} часов`,
                });
            }
            // Большие классы
            const isLargeClass = this.isLargeClass(content);
            if (isLargeClass) {
                categories[2].debt += 20; // 20 часов рефакторинга
                categories[2].items.push({
                    file: relativePath,
                    type: 'Large Class',
                    estimatedFix: '20 часов',
                });
            }
            // Code smells
            const smells = this.detectCodeSmells(content);
            if (smells > 0) {
                categories[3].debt += smells * 3; // 3 часа на smell
                categories[3].items.push({
                    file: relativePath,
                    type: 'Code Smells',
                    count: smells,
                    estimatedFix: `${smells * 3} часов`,
                });
            }
            // Отсутствие тестов
            const hasTests = await this.hasTestFile(file);
            if (!hasTests) {
                categories[4].debt += 8; // 8 часов на написание тестов
                categories[4].items.push({
                    file: relativePath,
                    type: 'Missing Tests',
                    estimatedFix: '8 часов',
                });
            }
        }
        return categories.filter(cat => cat.debt > 0);
    }
    /**
     * Поиск горячих точек технического долга
     */
    async findDebtHotspots(files) {
        const hotspots = [];
        for (const file of files) {
            const content = await this.readFile(file);
            const relativePath = path.relative(process.cwd(), file);
            let totalDebt = 0;
            const issues = [];
            // Цикломатическая сложность
            const complexity = this.calculateComplexity(content);
            if (complexity > 15) {
                const debt = (complexity - 15) * 2;
                totalDebt += debt;
                issues.push(`Высокая сложность: ${complexity}`);
            }
            // Размер файла
            const lines = content.split('\n').length;
            if (lines > 300) {
                const debt = Math.floor((lines - 300) / 50) * 4;
                totalDebt += debt;
                issues.push(`Большой файл: ${lines} строк`);
            }
            // Дублирование
            const duplication = this.detectDuplication(content);
            if (duplication > 3) {
                const debt = duplication * 3;
                totalDebt += debt;
                issues.push(`Дублирование: ${duplication} блоков`);
            }
            if (totalDebt > 10) {
                hotspots.push({
                    file: relativePath,
                    debt: totalDebt,
                    category: this.categorizeHotspot(totalDebt),
                    issues,
                    priority: this.calculatePriority(totalDebt, issues.length),
                    estimatedRefactoringTime: Math.ceil(totalDebt * 0.8),
                    roi: this.calculateHotspotROI(totalDebt),
                });
            }
        }
        return hotspots.sort((a, b) => b.debt - a.debt).slice(0, 20);
    }
    /**
     * Расчет общего технического долга
     */
    calculateTotalDebt(categories) {
        return categories.reduce((total, cat) => total + cat.debt, 0);
    }
    /**
     * Расчет ежемесячных процентов
     */
    calculateMonthlyInterest(totalDebt) {
        return Math.round(totalDebt * 0.05); // 5% в месяц
    }
    /**
     * Генерация плана погашения долга
     */
    generatePayoffPlan(categories) {
        const sortedCategories = [...categories].sort((a, b) => {
            const priorityScore = (cat) => {
                const impactWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                return cat.debt * (impactWeight[cat.impact] || 1);
            };
            return priorityScore(b) - priorityScore(a);
        });
        const plan = [];
        let cumulativeTime = 0;
        for (const category of sortedCategories) {
            if (category.debt === 0)
                continue;
            const refactoringTime = Math.ceil(category.debt * 0.7);
            cumulativeTime += refactoringTime;
            plan.push({
                category: category.name,
                debt: category.debt,
                impact: category.impact,
                refactoringTime,
                priority: this.getPriorityLevel(category.debt, category.impact),
                startWeek: Math.floor((cumulativeTime - refactoringTime) / 40) + 1,
                endWeek: Math.floor(cumulativeTime / 40) + 1,
                roi: this.calculateCategoryROI(category.debt, refactoringTime),
                items: category.items.slice(0, 5),
            });
        }
        return plan;
    }
    /**
     * ROI анализ
     */
    calculateROI(categories, totalDebt) {
        const totalRefactoringCost = totalDebt * 0.7;
        const monthlyInterest = this.calculateMonthlyInterest(totalDebt);
        const yearlyInterest = monthlyInterest * 12;
        const paybackPeriod = totalRefactoringCost / monthlyInterest;
        const threeYearSavings = yearlyInterest * 3 - totalRefactoringCost;
        const roi = (threeYearSavings / totalRefactoringCost) * 100;
        return {
            totalRefactoringCost,
            monthlyInterest,
            yearlyInterest,
            paybackPeriod: Math.ceil(paybackPeriod),
            threeYearSavings,
            roi: Math.round(roi),
            recommendation: this.getROIRecommendation(roi, paybackPeriod),
            breakdown: this.calculateROIBreakdown(categories),
        };
    }
    // Утилитарные методы
    async getCodeFiles(projectPath) {
        const files = [];
        const extensions = ['.ts', '.js', '.tsx', '.jsx'];
        const scanDir = async (dir) => {
            try {
                const items = await fs.promises.readdir(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = await fs.promises.stat(fullPath);
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        await scanDir(fullPath);
                    }
                    else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Игнорируем ошибки
            }
        };
        await scanDir(projectPath);
        return files;
    }
    async readFile(filePath) {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        }
        catch (error) {
            return '';
        }
    }
    calculateComplexity(content) {
        const conditions = (content.match(/if|while|for|case|catch|\?\s*:/g) || []).length;
        const logicalOperators = (content.match(/&&|\|\|/g) || []).length;
        return 1 + conditions + logicalOperators;
    }
    detectDuplication(content) {
        const lines = content.split('\n').filter(line => line.trim().length > 10);
        const uniqueLines = new Set(lines);
        return Math.max(0, lines.length - uniqueLines.size);
    }
    findComplexMethods(content) {
        const methods = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^(async\s+)?\w+\s*\(.*\)/.test(line)) {
                const complexity = this.calculateMethodComplexity(content, i);
                if (complexity > 10) {
                    methods.push({
                        name: line.match(/(\w+)\s*\(/)?.[1] || 'unknown',
                        complexity,
                    });
                }
            }
        }
        return methods;
    }
    calculateMethodComplexity(content, startLine) {
        const lines = content.split('\n');
        let complexity = 1;
        let braceCount = 0;
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            if (braceCount === 0 && i > startLine)
                break;
            complexity += (line.match(/if|while|for|case|catch|\?\s*:/g) || []).length;
            complexity += (line.match(/&&|\|\|/g) || []).length;
        }
        return complexity;
    }
    isLargeClass(content) {
        const lines = content.split('\n').length;
        const methods = (content.match(/function\s+\w+|async\s+\w+|\w+\s*\(/g) || []).length;
        return lines > 300 || methods > 15;
    }
    detectCodeSmells(content) {
        let smells = 0;
        // Long Parameter List
        if (/\([^)]{80,}\)/.test(content))
            smells++;
        // Magic Numbers
        if (/[^a-zA-Z_]\d{2,}[^a-zA-Z_]/.test(content))
            smells++;
        // Deep Nesting
        if (/\s{16,}/.test(content))
            smells++; // 4+ уровня вложенности
        return smells;
    }
    async hasTestFile(filePath) {
        const dir = path.dirname(filePath);
        const name = path.basename(filePath, path.extname(filePath));
        const testPatterns = [
            `${name}.test.ts`,
            `${name}.test.js`,
            `${name}.spec.ts`,
            `${name}.spec.js`,
        ];
        for (const pattern of testPatterns) {
            try {
                await fs.promises.access(path.join(dir, pattern));
                return true;
            }
            catch {
                // Файл не существует
            }
        }
        return false;
    }
    categorizeHotspot(debt) {
        if (debt > 50)
            return 'Critical';
        if (debt > 30)
            return 'High';
        if (debt > 15)
            return 'Medium';
        return 'Low';
    }
    calculatePriority(debt, issueCount) {
        return Math.min(10, Math.floor(debt / 5) + issueCount);
    }
    calculateHotspotROI(debt) {
        const refactoringCost = debt * 0.8;
        const yearlyInterest = debt * 0.6;
        return Math.round(((yearlyInterest - refactoringCost) / refactoringCost) * 100);
    }
    getPriorityLevel(debt, impact) {
        const impactWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const score = debt * (impactWeight[impact] || 1);
        if (score > 100)
            return 'Critical';
        if (score > 50)
            return 'High';
        if (score > 20)
            return 'Medium';
        return 'Low';
    }
    calculateCategoryROI(debt, refactoringTime) {
        const cost = refactoringTime;
        const yearlyInterest = debt * 0.6;
        return Math.round(((yearlyInterest - cost) / cost) * 100);
    }
    getROIRecommendation(roi, payback) {
        if (roi > 200 && payback < 6) {
            return 'Критично: немедленно начать рефакторинг - очень высокий ROI';
        }
        if (roi > 100 && payback < 12) {
            return 'Высокий приоритет: рефакторинг принесет значительную выгоду';
        }
        if (roi > 50) {
            return 'Средний приоритет: рефакторинг целесообразен';
        }
        return 'Низкий приоритет: рассмотреть в долгосрочной перспективе';
    }
    calculateROIBreakdown(categories) {
        return categories.map(cat => ({
            category: cat.name,
            debt: cat.debt,
            refactoringCost: cat.debt * 0.7,
            yearlyInterest: cat.debt * 0.6,
            roi: Math.round(((cat.debt * 0.6 - cat.debt * 0.7) / (cat.debt * 0.7)) * 100),
        }));
    }
}
exports.TechnicalDebtAnalyzer = TechnicalDebtAnalyzer;
//# sourceMappingURL=new-analyzer.js.map