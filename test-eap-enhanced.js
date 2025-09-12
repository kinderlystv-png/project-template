/**
 * Simple test script for enhanced EAP analyzer
 * Tests the analyzer with actual project analysis on C:\kinderly-events
 */

import { EapDebugger } from './eap-debugger/src/EapDebugger.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function testEnhancedAnalyzer() {
  console.log('🚀 Starting enhanced EAP analyzer test...');

  try {
    // Проверяем что проект существует
    const projectPath = 'C:\\kinderly-events';
    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Project path not found: ${projectPath}`);
      console.log('📁 Using current project as test instead...');
      // Используем текущий проект для теста
      await testWithCurrentProject();
      return;
    }

    console.log(`✅ Project found: ${projectPath}`);

    // Создаем контекст для анализа
    const context = {
      projectPath: projectPath,
      outputPath: path.join(process.cwd(), 'reports'),
      config: {
        checkers: ['structure', 'security'],
        modules: ['analysis', 'reporting'],
      },
      timestamp: new Date(),
    };

    console.log('\n🎯 Running enhanced analysis...');

    // Запускаем статический метод анализа
    await EapDebugger.runAnalysisAndShow(context);

    console.log('\n✅ Enhanced analysis completed!');
    console.log('📊 HTML report should have opened in your browser');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

async function testWithCurrentProject() {
  console.log('\n🔍 Testing with current project...');

  const context = {
    projectPath: process.cwd(),
    outputPath: path.join(process.cwd(), 'reports'),
    config: {
      checkers: ['structure', 'security'],
      modules: ['analysis', 'reporting'],
    },
    timestamp: new Date(),
  };

  try {
    await EapDebugger.runAnalysisAndShow(context);
    console.log('✅ Current project analysis completed!');
  } catch (error) {
    console.error('❌ Current project analysis failed:', error.message);

    // Fallback - просто генерируем HTML
    console.log('\n🔄 Falling back to quick generation...');
    await EapDebugger.quickGenerateAndOpen();
  }
}

// Запуск теста
testEnhancedAnalyzer().catch(console.error);
