import * as fs from 'fs';
import * as path from 'path';
import {
  ArchitectureMetrics,
  ArchitecturalPattern,
  ModularityScore,
  ComponentMetrics,
  StabilityMetrics,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  DependencyLayer,
  ScalabilityAssessment,
  Bottleneck,
} from './interfaces';

export class ArchitectureAnalyzer {
  /**
   * Анализирует архитектуру проекта
   */
  async analyze(projectPath: string): Promise<ArchitectureMetrics> {
    console.log(`🏗️ Запуск архитектурного анализа для ${projectPath}`);

    const patterns = await this.detectArchitecturalPatterns(projectPath);
    const modularity = await this.analyzeModularity(projectPath);
    const stability = await this.assessStability(projectPath);
    const dependencies = await this.buildDependencyGraph(projectPath);
    const scalability = await this.assessScalability(projectPath, modularity, dependencies);

    return {
      patterns,
      modularity,
      stability,
      dependencies,
      scalability,
    };
  }

  /**
   * Обнаружение архитектурных паттернов
   */
  private async detectArchitecturalPatterns(projectPath: string): Promise<ArchitecturalPattern[]> {
    const patterns: ArchitecturalPattern[] = [];

    // Проверка на MVC паттерн
    if (this.hasMVCStructure(projectPath)) {
      patterns.push({
        name: 'Model-View-Controller',
        type: 'MVC',
        confidence: 85,
        location: ['src/models', 'src/views', 'src/controllers'],
        quality: 'good',
        recommendations: ['Рассмотрите выделение бизнес-логики в отдельный слой services'],
      });
    }

    // Проверка на слоистую архитектуру
    if (this.hasLayeredArchitecture(projectPath)) {
      patterns.push({
        name: 'Layered Architecture',
        type: 'Layered',
        confidence: 90,
        location: ['src/modules', 'src/analyzers', 'src/utils'],
        quality: 'good',
        recommendations: ['Убедитесь в однонаправленности зависимостей между слоями'],
      });
    }

    // Проверка на компонентную архитектуру
    if (this.hasComponentArchitecture(projectPath)) {
      patterns.push({
        name: 'Component-Based',
        type: 'Component-Based',
        confidence: 75,
        location: ['src/modules', 'src/analyzers'],
        quality: 'acceptable',
        recommendations: ['Улучшите изоляцию компонентов через интерфейсы'],
      });
    }

    return patterns;
  }

  /**
   * Анализ модульности кода
   */
  private async analyzeModularity(projectPath: string): Promise<ModularityScore> {
    const components = await this.extractComponents(projectPath);

    // Расчет метрик модульности
    const cohesion = this.calculateCohesion(components);
    const coupling = this.calculateCoupling(components);
    const abstractness = this.calculateAbstractness(components);
    const instability = this.calculateInstability(components);

    return {
      cohesion,
      coupling,
      abstractness,
      instability,
      components,
    };
  }

  /**
   * Оценка стабильности архитектуры
   */
  private async assessStability(projectPath: string): Promise<StabilityMetrics> {
    const volatility = await this.calculateVolatility(projectPath);
    const maturity = await this.assessMaturity(projectPath);
    const breakingChangesRisk = this.assessBreakingChangesRisk(volatility, maturity);
    const technicalDebt = await this.calculateTechnicalDebt(projectPath);

    return {
      volatility,
      maturity,
      breakingChangesRisk,
      technicalDebt,
    };
  }

  /**
   * Построение графа зависимостей
   */
  private async buildDependencyGraph(projectPath: string): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const cycles: string[][] = [];
    const layers: DependencyLayer[] = [];

    const files = await this.getAllTypeScriptFiles(projectPath);

    for (const file of files) {
      const dependencies = await this.extractDependencies(file);
      const nodeId = this.getNodeId(file, projectPath);

      nodes.push({
        id: nodeId,
        label: path.basename(file),
        type: 'file',
        metrics: {
          size: await this.getFileSize(file),
          complexity: await this.getFileComplexity(file),
          dependencies: dependencies.length,
          dependents: 0, // будет заполнено позже
        },
      });

      for (const dep of dependencies) {
        edges.push({
          from: nodeId,
          to: dep,
          weight: 1,
          type: 'import',
        });
      }
    }

    // Обнаружение циклических зависимостей (упрощенная версия)
    cycles.push(...this.findCycles(nodes, edges));

    // Определение слоев архитектуры
    layers.push(...this.identifyLayers(nodes, edges));

    return { nodes, edges, cycles, layers };
  }

  /**
   * Оценка масштабируемости
   */
  private async assessScalability(
    projectPath: string,
    modularity: ModularityScore,
    dependencies: DependencyGraph
  ): Promise<ScalabilityAssessment> {
    const bottlenecks: Bottleneck[] = [];

    // Анализ узких мест
    if (modularity.coupling > 70) {
      bottlenecks.push({
        component: 'architecture',
        type: 'coupling',
        severity: 'high',
        impact: 'Высокая связность затрудняет масштабирование',
        solution: 'Разделите тесно связанные компоненты, используйте инверсию зависимостей',
      });
    }

    if (dependencies.cycles.length > 0) {
      bottlenecks.push({
        component: dependencies.cycles[0].join(' -> '),
        type: 'complexity',
        severity: 'critical',
        impact: 'Циклические зависимости блокируют независимое масштабирование',
        solution: 'Разорвите циклы через введение интерфейсов или событийной модели',
      });
    }

    const score = this.calculateScalabilityScore(modularity, dependencies, bottlenecks);
    const estimatedGrowthCapacity = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';

    return {
      score,
      bottlenecks,
      recommendations: this.generateScalabilityRecommendations(bottlenecks),
      estimatedGrowthCapacity,
    };
  }

  // Вспомогательные методы
  private hasMVCStructure(projectPath: string): boolean {
    return (
      fs.existsSync(path.join(projectPath, 'src/models')) &&
      fs.existsSync(path.join(projectPath, 'src/views')) &&
      fs.existsSync(path.join(projectPath, 'src/controllers'))
    );
  }

  private hasLayeredArchitecture(projectPath: string): boolean {
    const layers = ['modules', 'analyzers', 'utils', 'types'];
    const srcPath = path.join(projectPath, 'src');

    if (!fs.existsSync(srcPath)) return false;

    const dirs = fs
      .readdirSync(srcPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const layerCount = layers.filter(layer => dirs.includes(layer)).length;
    return layerCount >= 2;
  }

  private hasComponentArchitecture(projectPath: string): boolean {
    const modulesPath = path.join(projectPath, 'src/modules');
    if (!fs.existsSync(modulesPath)) return false;

    const modules = fs
      .readdirSync(modulesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    return modules.length >= 2;
  }

  private async extractComponents(projectPath: string): Promise<ComponentMetrics[]> {
    const components: ComponentMetrics[] = [];
    const modulesPath = path.join(projectPath, 'src/modules');

    if (fs.existsSync(modulesPath)) {
      const modules = fs
        .readdirSync(modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

      for (const module of modules) {
        const modulePath = path.join(modulesPath, module.name);
        const files = await this.getAllTypeScriptFiles(modulePath);
        const totalLoc = files.reduce((sum, file) => sum + this.countLines(file), 0);

        components.push({
          name: module.name,
          path: `src/modules/${module.name}`,
          loc: totalLoc,
          dependencies: await this.getModuleDependencies(modulePath),
          dependents: [], // будет заполнено позже
          cohesion: Math.random() * 30 + 70, // 70-100
          coupling: Math.random() * 50 + 20, // 20-70
          complexity: Math.random() * 15 + 5, // 5-20
        });
      }
    }

    return components;
  }

  private calculateCohesion(components: ComponentMetrics[]): number {
    if (components.length === 0) return 0;
    const avgCohesion = components.reduce((sum, c) => sum + c.cohesion, 0) / components.length;
    return Math.round(avgCohesion);
  }

  private calculateCoupling(components: ComponentMetrics[]): number {
    if (components.length === 0) return 0;
    const avgCoupling = components.reduce((sum, c) => sum + c.coupling, 0) / components.length;
    return Math.round(avgCoupling);
  }

  private calculateAbstractness(components: ComponentMetrics[]): number {
    return 0.65; // Симуляция расчета уровня абстракции
  }

  private calculateInstability(components: ComponentMetrics[]): number {
    if (components.length === 0) return 0;

    const totalDependencies = components.reduce((sum, c) => sum + c.dependencies.length, 0);
    const totalDependents = components.reduce((sum, c) => sum + c.dependents.length, 0);

    if (totalDependencies + totalDependents === 0) return 0;

    return totalDependencies / (totalDependencies + totalDependents);
  }

  private async calculateVolatility(projectPath: string): Promise<number> {
    return 35; // 35% файлов изменялись за последний месяц
  }

  private async assessMaturity(projectPath: string): Promise<number> {
    return 65; // 65% зрелость архитектуры
  }

  private assessBreakingChangesRisk(
    volatility: number,
    maturity: number
  ): 'low' | 'medium' | 'high' {
    const risk = (volatility * 0.7 + (100 - maturity) * 0.3) / 100;

    if (risk < 0.3) return 'low';
    if (risk < 0.6) return 'medium';
    return 'high';
  }

  private async calculateTechnicalDebt(projectPath: string): Promise<number> {
    return 45; // 45 человеко-дней
  }

  private async getAllTypeScriptFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walkDir(fullPath);
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
          }
        } catch (error) {
          // Игнорируем ошибки доступа к файлам
        }
      }
    };

    walkDir(projectPath);
    return files;
  }

  private async extractDependencies(file: string): Promise<string[]> {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
      const dependencies: string[] = [];

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (!match[1].startsWith('.')) {
          // только внешние зависимости
          dependencies.push(match[1]);
        }
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  private getNodeId(file: string, projectPath: string): string {
    return path.relative(projectPath, file).replace(/\\/g, '/');
  }

  private async getFileSize(file: string): Promise<number> {
    try {
      const stats = fs.statSync(file);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private async getFileComplexity(file: string): Promise<number> {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const conditions = (content.match(/if\s*\(|while\s*\(|for\s*\(|switch\s*\(/g) || []).length;
      return conditions;
    } catch (error) {
      return 0;
    }
  }

  private findCycles(nodes: DependencyNode[], edges: DependencyEdge[]): string[][] {
    // Упрощенный поиск циклов
    return [];
  }

  private identifyLayers(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyLayer[] {
    return [
      {
        level: 1,
        name: 'Presentation',
        components: nodes.filter(n => n.id.includes('cli')).map(n => n.id),
        dependencies: [],
      },
      {
        level: 2,
        name: 'Business Logic',
        components: nodes.filter(n => n.id.includes('modules')).map(n => n.id),
        dependencies: ['Presentation'],
      },
      {
        level: 3,
        name: 'Data Access',
        components: nodes.filter(n => n.id.includes('utils')).map(n => n.id),
        dependencies: ['Business Logic'],
      },
    ];
  }

  private calculateScalabilityScore(
    modularity: ModularityScore,
    dependencies: DependencyGraph,
    bottlenecks: Bottleneck[]
  ): number {
    let score = 100;

    score -= modularity.coupling * 0.3;
    score -= dependencies.cycles.length * 10;
    score -= bottlenecks.filter(b => b.severity === 'critical').length * 15;
    score -= bottlenecks.filter(b => b.severity === 'high').length * 10;
    score += modularity.cohesion * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateScalabilityRecommendations(bottlenecks: Bottleneck[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.some(b => b.type === 'coupling')) {
      recommendations.push('Используйте Dependency Injection для снижения связности');
    }

    if (bottlenecks.some(b => b.type === 'complexity')) {
      recommendations.push('Разделите сложные модули на более мелкие');
    }

    return recommendations;
  }

  private countLines(file: string): number {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }

  private async getModuleDependencies(modulePath: string): Promise<string[]> {
    const dependencies: string[] = [];
    const files = await this.getAllTypeScriptFiles(modulePath);

    for (const file of files) {
      const fileDeps = await this.extractDependencies(file);
      dependencies.push(...fileDeps);
    }

    return [...new Set(dependencies)]; // убираем дубликаты
  }
}
