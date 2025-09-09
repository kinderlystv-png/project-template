#!/usr/bin/env node

import { program } from 'commander';
import { AIEnhancedAnalyzer } from './index.js';
import { AIReportGenerator } from './report-generator.js';
import * as path from 'path';

type ReportFormat = 'console' | 'json' | 'html' | 'markdown';

program.name('eap-ai').description('EAP Analyzer с ИИ улучшениями').version('3.2.0');

program
  .command('analyze')
  .description('Анализ проекта с ИИ улучшениями')
  .requiredOption('-p, --project <path>', 'Путь к проекту для анализа')
  .option('-f, --format <format>', 'Формат отчета (console, json, html, markdown)', 'console')
  .option('-o, --output <file>', 'Файл для сохранения отчета')
  .action(async options => {
    try {
      const projectPath = path.resolve(options.project);
      const format = options.format as ReportFormat;

      console.log(`🔍 Анализируем проект: ${projectPath}`);
      console.log(`📊 Формат отчета: ${format}`);

      const analyzer = new AIEnhancedAnalyzer();
      const result = await analyzer.analyzeProject(projectPath);

      const generator = new AIReportGenerator();
      const report = await generator.generateReport(result, { format });

      if (options.output && format !== 'console') {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, report);
        console.log(`✅ Отчет сохранен: ${options.output}`);
      } else {
        console.log(report);
      }
    } catch (error) {
      console.error('❌ Ошибка анализа:', error);
      process.exit(1);
    }
  });

program.parse();
