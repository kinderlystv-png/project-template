/**
 * Test script for enhanced EAP analyzer with actual project analysis
 * Проверяет работу анализатора с реальным проектом C:\kinderly-events
 */

import { EapDebugger } from './eap-debugger/src/EapDebugger';
import { ComponentRegistry } from './eap-analyzer/src/core/ComponentRegistry';
import { ConfigLoader } from './eap-analyzer/src/utils/ConfigLoader';
import { CheckContext } from './eap-analyzer/src/types/Context';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEnhancedAnalyzer(): Promise<void> {
  console.log('🚀 Starting enhanced EAP analyzer test with real project analysis...');

  try {
    // 1. Инициализация реестра компонентов
    console.log('\n📋 Initializing component registry...');
    const registry = new ComponentRegistry();

    // 2. Загрузка конфигурации
    console.log('📂 Loading configuration...');
    const configPath = path.join(__dirname, 'eap-analyzer', 'config', 'default.config.json');
    const config = await ConfigLoader.loadConfig(configPath);
    console.log(`✅ Configuration loaded: ${config.checkers.length} checkers configured`);

    // 3. Регистрация компонентов
    console.log('\n🔧 Registering components...');
    await registry.loadCheckers(config);

    const registrationInfo = registry.getRegistrationInfo();
    console.log(
      `✅ Registry status: ${registrationInfo.checkersCount} checkers, ${registrationInfo.modulesCount} modules`
    );
    console.log(`📅 Last updated: ${registrationInfo.lastUpdated.toLocaleString('ru-RU')}`);

    // 4. Создание дебаггера
    console.log('\n🔍 Creating EAP debugger...');
    const eapDebugger = new EapDebugger();

    // 5. Подготовка контекста для анализа
    const projectPath = 'C:\\kinderly-events';
    console.log(`\n📁 Preparing analysis context for project: ${projectPath}`);

    const context: CheckContext = {
      projectPath: projectPath,
      outputPath: path.join(__dirname, 'reports'),
      config: config,
      timestamp: new Date(),
    };

    // 6. Запуск анализа с показом результатов
    console.log('\n🎯 Running analysis and generating HTML report...');
    await eapDebugger.runAnalysisAndShow(context);

    console.log('\n✅ Enhanced EAP analyzer test completed successfully!');
    console.log('📊 Check the opened HTML report for detailed analysis results');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Запуск теста
testEnhancedAnalyzer().catch(console.error);
