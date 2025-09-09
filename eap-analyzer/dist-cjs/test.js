"use strict";
/**
 * Тестовый запуск ЭАП анализатора
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAnalyzer = testAnalyzer;
const docker_js_1 = require("./checkers/docker.js");
const emt_js_1 = require("./checkers/emt.js");
async function testAnalyzer() {
    const projectPath = process.cwd();
    const context = {
        projectPath,
        projectInfo: {
            name: 'SHINOMONTAGKA',
            version: '1.0.0',
            hasTypeScript: true,
            hasTests: true,
            hasDocker: true,
            hasCICD: true,
            dependencies: { production: 0, development: 0, total: 0 },
        },
        options: {
            projectPath,
            verbose: true,
        },
    };
    try {
        // eslint-disable-next-line no-console
        console.log('🔍 Тестирование ЭАП анализатора...');
        // Тест EMT
        const emtResult = await emt_js_1.EMTChecker.checkComponent(context);
        // eslint-disable-next-line no-console
        console.log(`📊 ЭМТ: ${emtResult.percentage}% (${emtResult.passed.length}/${emtResult.passed.length + emtResult.failed.length})`);
        // Тест Docker
        const dockerResult = await docker_js_1.DockerChecker.checkComponent(context);
        // eslint-disable-next-line no-console
        console.log(`🐳 Docker: ${dockerResult.percentage}% (${dockerResult.passed.length}/${dockerResult.passed.length + dockerResult.failed.length})`);
        const totalScore = emtResult.score + dockerResult.score;
        const maxScore = emtResult.maxScore + dockerResult.maxScore;
        const overallPercentage = Math.round((totalScore / maxScore) * 100);
        // eslint-disable-next-line no-console
        console.log(`🎯 Общий результат: ${overallPercentage}% (${totalScore}/${maxScore})`);
        return { emtResult, dockerResult, overallPercentage };
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка:', error);
        throw error;
    }
}
// Запуск если файл выполняется напрямую
if (typeof require !== 'undefined' && require.main === module) {
    testAnalyzer().catch(console.error);
}
//# sourceMappingURL=test.js.map