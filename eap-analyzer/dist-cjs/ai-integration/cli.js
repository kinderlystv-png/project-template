#!/usr/bin/env node
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
const commander_1 = require("commander");
const index_js_1 = require("./index.js");
const report_generator_js_1 = require("./report-generator.js");
const path = __importStar(require("path"));
commander_1.program.name('eap-ai').description('EAP Analyzer с ИИ улучшениями').version('3.2.0');
commander_1.program
    .command('analyze')
    .description('Анализ проекта с ИИ улучшениями')
    .requiredOption('-p, --project <path>', 'Путь к проекту для анализа')
    .option('-f, --format <format>', 'Формат отчета (console, json, html, markdown)', 'console')
    .option('-o, --output <file>', 'Файл для сохранения отчета')
    .action(async (options) => {
    try {
        const projectPath = path.resolve(options.project);
        const format = options.format;
        console.log(`🔍 Анализируем проект: ${projectPath}`);
        console.log(`📊 Формат отчета: ${format}`);
        const analyzer = new index_js_1.AIEnhancedAnalyzer();
        const result = await analyzer.analyzeProject(projectPath);
        const generator = new report_generator_js_1.AIReportGenerator();
        const report = await generator.generateReport(result, { format });
        if (options.output && format !== 'console') {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(options.output, report);
            console.log(`✅ Отчет сохранен: ${options.output}`);
        }
        else {
            console.log(report);
        }
    }
    catch (error) {
        console.error('❌ Ошибка анализа:', error);
        process.exit(1);
    }
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map