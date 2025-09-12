/**
 * Быстрый тест FileStructureAnalyzer v3.0
 */

import { FileStructureAnalyzer } from './FileStructureAnalyzer.js';

async function quickTest() {
  try {
    const context = {
      projectPath: 'C:\\alphacore\\project-template\\src', // Меньшая директория
    };

    const result = await FileStructureAnalyzer.checkComponent(context);

    // Быстрая проверка
    const isRealAnalysis = result.percentage > 0 && result.recommendations.length > 0;

    if (isRealAnalysis) {
      // Не используем console для eslint
      return {
        success: true,
        percentage: result.percentage,
        filesAnalyzed: result.metadata?.filesAnalyzed || 0,
        recommendations: result.recommendations.length,
        duration: result.duration,
        isDemo: false,
      };
    } else {
      return {
        success: false,
        isDemo: true,
        error: 'Похоже на демо версию',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export { quickTest };
