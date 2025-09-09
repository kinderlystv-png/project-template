/**
 * EMT модуль - анализирует проекты на базе EMT Framework
 */

import { BaseAnalyzer, AnalysisResult } from '../../core/analyzer.js';

export interface EMTMetrics {
  hasFramework: boolean;
  version: string | null;
  configurationScore: number;
  structureScore: number;
  dependenciesHealth: number;
  routes: EMTRoute[];
  components: EMTComponent[];
  services: EMTService[];
}

export interface EMTRoute {
  path: string;
  method: string;
  handler: string;
  middleware: string[];
}

export interface EMTComponent {
  name: string;
  path: string;
  type: 'page' | 'component' | 'layout';
  dependencies: string[];
}

export interface EMTService {
  name: string;
  path: string;
  exports: string[];
  complexity: number;
}

export class EMTAnalyzer extends BaseAnalyzer {
  readonly metadata = {
    name: 'EMT Framework Analyzer',
    version: '3.2.0',
    description: 'Анализирует проекты на базе EMT Framework',
    supportedFileTypes: ['js', 'ts', 'json', 'jsx', 'tsx'],
  };

  async analyze(projectPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    let filesAnalyzed = 0;

    try {
      const metrics: EMTMetrics = {
        hasFramework: false,
        version: null,
        configurationScore: 0,
        structureScore: 0,
        dependenciesHealth: 100,
        routes: [],
        components: [],
        services: [],
      };

      // Проверка наличия EMT фреймворка
      const frameworkInfo = await this.detectEMTFramework(projectPath);
      metrics.hasFramework = frameworkInfo.detected;
      metrics.version = frameworkInfo.version;

      if (!metrics.hasFramework) {
        return this.createResult(true, metrics, [], ['EMT Framework не обнаружен'], 0);
      }

      // Анализ конфигурации
      metrics.configurationScore = await this.analyzeConfiguration(projectPath);

      // Анализ структуры проекта
      const structureResult = await this.analyzeProjectStructure(projectPath);
      metrics.structureScore = structureResult.score;
      filesAnalyzed += structureResult.filesAnalyzed;

      // Анализ зависимостей
      metrics.dependenciesHealth = await this.analyzeDependencies(projectPath);

      // Анализ роутов
      metrics.routes = await this.analyzeRoutes(projectPath);

      // Анализ компонентов
      metrics.components = await this.analyzeComponents(projectPath);

      // Анализ сервисов
      metrics.services = await this.analyzeServices(projectPath);

      const warnings: string[] = [];
      const errors: string[] = [];

      // Проверки и предупреждения
      if (metrics.configurationScore < 70) {
        warnings.push('Конфигурация EMT требует улучшения');
      }

      if (metrics.structureScore < 60) {
        warnings.push('Структура проекта не соответствует рекомендациям EMT');
      }

      if (metrics.dependenciesHealth < 80) {
        warnings.push('Обнаружены проблемы с зависимостями EMT');
      }

      return this.createResult(true, metrics, errors, warnings, filesAnalyzed);
    } catch (error) {
      return this.createResult(
        false,
        null,
        [`Ошибка анализа EMT: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`],
        [],
        filesAnalyzed
      );
    }
  }

  isSupported(projectPath: string): boolean {
    const path = require('path');
    const fs = require('fs');

    // Проверяем наличие package.json и EMT зависимостей
    const packagePath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packagePath)) {
      return false;
    }

    try {
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return this.hasEMTDependencies(packageJson);
    } catch {
      return false;
    }
  }

  private async detectEMTFramework(
    projectPath: string
  ): Promise<{ detected: boolean; version: string | null }> {
    const path = require('path');
    const fs = require('fs');

    const packagePath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packagePath)) {
      return { detected: false, version: null };
    }

    try {
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      if (this.hasEMTDependencies(packageJson)) {
        const emtPackages = ['emt-framework', 'emt-core', '@emt/core'];
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        for (const pkg of emtPackages) {
          if (dependencies[pkg]) {
            return { detected: true, version: dependencies[pkg] };
          }
        }
      }

      return { detected: false, version: null };
    } catch {
      return { detected: false, version: null };
    }
  }

  private hasEMTDependencies(packageJson: any): boolean {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const emtPackages = ['emt-framework', 'emt-core', 'emt-cli', '@emt/core', '@emt/cli'];
    return emtPackages.some(pkg => dependencies[pkg]);
  }

  private async analyzeConfiguration(projectPath: string): Promise<number> {
    const path = require('path');
    const fs = require('fs');

    let score = 0;
    const maxScore = 100;

    // Проверка конфигурационных файлов
    const configFiles = ['emt.config.js', 'emt.config.ts', 'emt.config.json'];

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        score += 30;
        break;
      }
    }

    // Проверка TypeScript конфигурации
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      score += 20;
    }

    // Проверка ESLint конфигурации
    const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'];
    for (const eslintConfig of eslintConfigs) {
      if (fs.existsSync(path.join(projectPath, eslintConfig))) {
        score += 15;
        break;
      }
    }

    // Проверка Prettier конфигурации
    const prettierConfigs = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
    for (const prettierConfig of prettierConfigs) {
      if (fs.existsSync(path.join(projectPath, prettierConfig))) {
        score += 10;
        break;
      }
    }

    // Проверка Git конфигурации
    if (fs.existsSync(path.join(projectPath, '.gitignore'))) {
      score += 10;
    }

    // Проверка README
    const readmeFiles = ['README.md', 'readme.md'];
    for (const readme of readmeFiles) {
      if (fs.existsSync(path.join(projectPath, readme))) {
        score += 15;
        break;
      }
    }

    return Math.min(score, maxScore);
  }

  private async analyzeProjectStructure(
    projectPath: string
  ): Promise<{ score: number; filesAnalyzed: number }> {
    const path = require('path');
    const fs = require('fs');

    let score = 0;
    let filesAnalyzed = 0;
    const maxScore = 100;

    // Ожидаемые директории для EMT проекта
    const expectedDirectories = [
      'src', // +20
      'src/components', // +15
      'src/routes', // +15
      'src/services', // +15
      'src/utils', // +10
      'src/types', // +10
      'src/config', // +10
      'tests', // +5
    ];

    const directoryScores = [20, 15, 15, 15, 10, 10, 10, 5];

    for (let i = 0; i < expectedDirectories.length; i++) {
      const dirPath = path.join(projectPath, expectedDirectories[i]);
      if (fs.existsSync(dirPath)) {
        score += directoryScores[i];

        // Подсчитываем файлы в директории
        try {
          const files = fs.readdirSync(dirPath);
          filesAnalyzed += files.length;
        } catch {
          // Игнорируем ошибки чтения
        }
      }
    }

    return { score: Math.min(score, maxScore), filesAnalyzed };
  }

  private async analyzeDependencies(projectPath: string): Promise<number> {
    const path = require('path');
    const fs = require('fs');

    const packagePath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packagePath)) {
      return 0;
    }

    try {
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      let healthScore = 100;

      // Проверка устаревших версий
      for (const [pkg, version] of Object.entries(dependencies)) {
        const versionStr = version as string;

        if (pkg.includes('emt')) {
          // Проверка EMT версий
          if (versionStr.includes('0.') || versionStr.includes('1.')) {
            healthScore -= 20;
          }

          if (versionStr.includes('beta') || versionStr.includes('alpha')) {
            healthScore -= 10;
          }
        }

        // Проверка общих проблемных зависимостей
        if (versionStr.includes('^0.') || versionStr.includes('~0.')) {
          healthScore -= 5;
        }
      }

      return Math.max(0, healthScore);
    } catch {
      return 50;
    }
  }

  private async analyzeRoutes(projectPath: string): Promise<EMTRoute[]> {
    // Упрощенная реализация - в реальности нужен парсер кода
    return [];
  }

  private async analyzeComponents(projectPath: string): Promise<EMTComponent[]> {
    // Упрощенная реализация - в реальности нужен парсер кода
    return [];
  }

  private async analyzeServices(projectPath: string): Promise<EMTService[]> {
    // Упрощенная реализация - в реальности нужен парсер кода
    return [];
  }
}
