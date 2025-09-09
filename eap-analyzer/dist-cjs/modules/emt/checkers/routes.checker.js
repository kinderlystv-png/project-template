"use strict";
/**
 * EMT Routes Checker - проверяет конфигурацию и структуру роутов EMT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTRoutesChecker = void 0;
const checker_js_1 = require("../../../core/checker.js");
class EMTRoutesChecker extends checker_js_1.BaseChecker {
    name = 'EMT Routes Checker';
    category = 'structure';
    description = 'Проверяет структуру и конфигурацию роутов EMT Framework';
    metadata = {
        version: '1.0.0',
    };
    async check(context) {
        const path = require('path');
        const fs = require('fs');
        const issues = [];
        const warnings = [];
        try {
            // Проверка директории routes
            const routesDir = path.join(context.projectPath, 'src', 'routes');
            if (!fs.existsSync(routesDir)) {
                issues.push('Отсутствует директория src/routes');
                return this.createResult(false, 0, 'Routes directory missing', { issues, warnings });
            }
            // Проверка структуры роутов
            const routeFiles = fs
                .readdirSync(routesDir)
                .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
            if (routeFiles.length === 0) {
                warnings.push('В директории routes отсутствуют файлы роутов');
            }
            // Проверка главного роута
            const mainRoutes = ['index.js', 'index.ts', 'main.js', 'main.ts'];
            const hasMainRoute = mainRoutes.some(route => fs.existsSync(path.join(routesDir, route)));
            if (!hasMainRoute) {
                warnings.push('Отсутствует главный файл роутов (index.js/ts)');
            }
            // Проверка API роутов
            const apiDir = path.join(routesDir, 'api');
            if (fs.existsSync(apiDir)) {
                const apiRoutes = fs.readdirSync(apiDir);
                if (apiRoutes.length === 0) {
                    warnings.push('Директория api пуста');
                }
            }
            // Проверка middleware
            const middlewareDir = path.join(context.projectPath, 'src', 'middleware');
            if (!fs.existsSync(middlewareDir)) {
                warnings.push('Отсутствует директория middleware');
            }
            const status = issues.length === 0 ? 'passed' : 'failed';
            const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20 - warnings.length * 5);
            return this.createResult(issues.length === 0, score, `Routes check ${status}`, {
                issues,
                warnings,
            });
        }
        catch (error) {
            return this.createResult(false, 0, 'Routes check failed', [
                `Ошибка проверки роутов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            ]);
        }
    }
    isApplicable(context) {
        const path = require('path');
        const fs = require('fs');
        // Проверяем наличие EMT зависимостей
        const packagePath = path.join(context.projectPath, 'package.json');
        if (!fs.existsSync(packagePath)) {
            return false;
        }
        try {
            const packageContent = fs.readFileSync(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const emtPackages = ['emt-framework', 'emt-core', '@emt/core'];
            return emtPackages.some(pkg => dependencies[pkg]);
        }
        catch {
            return false;
        }
    }
}
exports.EMTRoutesChecker = EMTRoutesChecker;
//# sourceMappingURL=routes.checker.js.map