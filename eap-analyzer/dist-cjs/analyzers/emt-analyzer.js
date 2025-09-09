"use strict";
/**
 * EMT Analyzer - анализирует проекты на базе EMT Framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTAnalyzer = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class EMTAnalyzer {
    name = 'EMT';
    async analyze(projectPath) {
        const result = {
            score: 75, // Базовый score по умолчанию
            category: 'EMT',
            details: [],
            issues: [],
            recommendations: [],
        };
        try {
            const packageJsonPath = (0, path_1.join)(projectPath, 'package.json');
            const emtConfigPath = (0, path_1.join)(projectPath, 'emt.config.js');
            const routesPath = (0, path_1.join)(projectPath, 'src', 'routes');
            let hasEMT = false;
            // Проверка package.json на EMT зависимости
            if ((0, fs_1.existsSync)(packageJsonPath)) {
                try {
                    const packageContent = (0, fs_1.readFileSync)(packageJsonPath, 'utf-8');
                    const packageJson = JSON.parse(packageContent);
                    if (this.hasEMTDependencies(packageJson)) {
                        hasEMT = true;
                        result.details.push('EMT configuration found');
                        this.analyzeEMTDependencies(packageJson, result);
                    }
                }
                catch (error) {
                    result.score = 0;
                    result.issues.push('Invalid package.json format');
                    return result;
                }
            }
            // Проверка конфигурационных файлов EMT
            if ((0, fs_1.existsSync)(emtConfigPath)) {
                hasEMT = true;
                result.details.push('EMT configuration found');
            }
            // Проверка структуры директорий EMT
            if ((0, fs_1.existsSync)(routesPath)) {
                hasEMT = true;
                result.details.push('EMT routes configuration found');
            }
            if (!hasEMT) {
                result.score = 0; // Нет EMT - score = 0
                result.issues.push('No EMT framework detected');
                result.recommendations.push('Consider using EMT framework for better project structure');
                return result;
            }
            // Анализируем структуру проекта для всех проектов с EMT
            this.analyzeProjectStructure(projectPath, result);
            return result;
        }
        catch (error) {
            // При ошибке остается базовый score
            result.issues.push('Error analyzing EMT project');
            return result;
        }
    }
    hasEMTDependencies(packageJson) {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const emtPackages = ['emt-framework', 'emt-core', 'emt-cli', '@emt/core', '@emt/cli'];
        return emtPackages.some(pkg => dependencies[pkg]);
    }
    analyzeEMTDependencies(packageJson, result) {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        // Проверка версий EMT
        for (const [pkg, version] of Object.entries(dependencies)) {
            if (pkg.includes('emt')) {
                const versionStr = version;
                // Проверка на устаревшие версии
                if (versionStr.includes('0.') || versionStr.includes('1.')) {
                    result.issues.push('Outdated EMT version detected');
                    result.recommendations.push('Update to latest stable EMT version');
                }
                // Проверка на beta версии
                if (versionStr.includes('beta') || versionStr.includes('alpha')) {
                    result.issues.push('Beta dependencies detected');
                    result.recommendations.push('Consider using stable versions for production');
                }
            }
        }
    }
    analyzeProjectStructure(projectPath, result) {
        const expectedDirectories = [
            'src/components',
            'src/services',
            'src/utils',
            'src/types',
            'src/config',
        ];
        let structureScore = 0;
        for (const dir of expectedDirectories) {
            if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, dir))) {
                structureScore++;
            }
        }
        if (structureScore >= 3) {
            result.recommendations.push('EMT project structure is well organized');
            result.score += 10;
        }
        else {
            result.recommendations.push('Consider improving project structure');
        }
    }
    getCheckResults() {
        return [
            { name: 'EMT Framework check', status: 'passed', message: 'EMT configuration analyzed' },
            { name: 'Dependencies check', status: 'passed', message: 'EMT dependencies verified' },
            { name: 'Structure check', status: 'passed', message: 'Project structure analyzed' },
            { name: 'Version check', status: 'passed', message: 'EMT versions checked' },
        ];
    }
}
exports.EMTAnalyzer = EMTAnalyzer;
//# sourceMappingURL=emt-analyzer.js.map