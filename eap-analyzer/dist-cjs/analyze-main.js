#!/usr/bin/env node
"use strict";
/**
 * Простой анализ проекта SHINOMONTAGKA
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
const path = __importStar(require("path"));
const docker_js_1 = require("./checkers/docker.js");
const emt_js_1 = require("./checkers/emt.js");
async function analyzeMainProject() {
    // Анализируем родительскую папку (основной проект)
    const projectPath = path.resolve(process.cwd(), '..');
    const context = {
        projectPath,
        projectInfo: {
            name: 'SHINOMONTAGKA',
            version: '2.0.0',
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
        console.log('🔍 Анализ основного проекта SHINOMONTAGKA...');
        // eslint-disable-next-line no-console
        console.log(`📂 Путь: ${projectPath}`);
        // eslint-disable-next-line no-console
        console.log('');
        // Тест EMT
        // eslint-disable-next-line no-console
        console.log('📋 Анализ ЭМТ (Эталонный Модуль Тестирования)...');
        const emtResult = await emt_js_1.EMTChecker.checkComponent(context);
        // eslint-disable-next-line no-console
        console.log(`✅ ЭМТ: ${emtResult.percentage}% (${emtResult.passed.length}/${emtResult.passed.length + emtResult.failed.length} проверок)`);
        if (emtResult.failed.length > 0) {
            // eslint-disable-next-line no-console
            console.log('   ❌ Не пройдены:');
            emtResult.failed.slice(0, 3).forEach(fail => {
                // eslint-disable-next-line no-console
                console.log(`      • ${fail.check.name}`);
            });
        }
        // eslint-disable-next-line no-console
        console.log('');
        // Тест Docker
        // eslint-disable-next-line no-console
        console.log('📋 Анализ Docker Infrastructure...');
        const dockerResult = await docker_js_1.DockerChecker.checkComponent(context);
        // eslint-disable-next-line no-console
        console.log(`🐳 Docker: ${dockerResult.percentage}% (${dockerResult.passed.length}/${dockerResult.passed.length + dockerResult.failed.length} проверок)`);
        if (dockerResult.failed.length > 0) {
            // eslint-disable-next-line no-console
            console.log('   ❌ Не пройдены:');
            dockerResult.failed.slice(0, 3).forEach(fail => {
                // eslint-disable-next-line no-console
                console.log(`      • ${fail.check.name}`);
            });
        }
        // eslint-disable-next-line no-console
        console.log('');
        const totalScore = emtResult.score + dockerResult.score;
        const maxScore = emtResult.maxScore + dockerResult.maxScore;
        const overallPercentage = Math.round((totalScore / maxScore) * 100);
        // eslint-disable-next-line no-console
        console.log('🎯 ОБЩИЙ РЕЗУЛЬТАТ:');
        // eslint-disable-next-line no-console
        console.log(`   Оценка: ${overallPercentage}% (${totalScore}/${maxScore} баллов)`);
        let grade = 'F';
        if (overallPercentage >= 90)
            grade = 'A+';
        else if (overallPercentage >= 85)
            grade = 'A';
        else if (overallPercentage >= 80)
            grade = 'B+';
        else if (overallPercentage >= 75)
            grade = 'B';
        else if (overallPercentage >= 70)
            grade = 'C+';
        else if (overallPercentage >= 65)
            grade = 'C';
        else if (overallPercentage >= 60)
            grade = 'D';
        // eslint-disable-next-line no-console
        console.log(`   Оценка: ${grade}`);
        if (overallPercentage >= 85) {
            // eslint-disable-next-line no-console
            console.log('🎉 Отлично! Проект соответствует высоким стандартам!');
        }
        else if (overallPercentage >= 70) {
            // eslint-disable-next-line no-console
            console.log('👍 Хорошо! Есть области для улучшения.');
        }
        else {
            // eslint-disable-next-line no-console
            console.log('⚠️ Проект требует значительных улучшений.');
        }
        return { emtResult, dockerResult, overallPercentage, grade };
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка:', error);
        throw error;
    }
}
// Запуск
analyzeMainProject().catch(console.error);
//# sourceMappingURL=analyze-main.js.map