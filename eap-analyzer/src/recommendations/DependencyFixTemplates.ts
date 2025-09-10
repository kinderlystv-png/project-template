/**
 * DependencyFixTemplates - Шаблоны исправления для уязвимостей зависимостей
 * 
 * Phase 5.2.1: Конкретные fix templates для npm audit findings
 */

import { SecurityRecommendation, IssueContext } from './RecommendationEngine.js';

export class DependencyFixTemplates {
  /**
   * Генерирует рекомендацию для конкретной npm уязвимости
   */
  static generateNpmAuditFix(vulnerabilityData: {
    packageName: string;
    currentVersion: string;
    fixedVersion?: string;
    severity: string;
    cve?: string;
    title: string;
    description: string;
  }): SecurityRecommendation {
    const { packageName, currentVersion, fixedVersion, severity, cve, title } = vulnerabilityData;

    return {
      id: `npm-audit-${packageName}`,
      title: `npm audit: ${title}`,
      description: `Уязвимость в ${packageName}@${currentVersion}`,
      severity: severity.toLowerCase() as any,
      category: 'dependencies',
      fixTemplate: {
        steps: [
          'Проверьте версию с исправлением',
          'Обновите пакет до безопасной версии',
          'Проверьте breaking changes',
          'Запустите тесты',
          'Проверьте что уязвимость исправлена'
        ],
        commands: fixedVersion ? [
          `npm update ${packageName}@${fixedVersion}`,
          'npm audit',
          'npm test'
        ] : [
          `npm audit fix`,
          `npm update ${packageName}`,
          'npm audit'
        ],
        beforeCode: `{
  "dependencies": {
    "${packageName}": "${currentVersion}"
  }
}`,
        afterCode: fixedVersion ? `{
  "dependencies": {
    "${packageName}": "${fixedVersion}"
  }
}` : `// Выполните: npm update ${packageName}`,
        codeExample: this.getPackageSpecificFix(packageName)
      },
      documentation: {
        links: [
          `https://www.npmjs.com/package/${packageName}`,
          cve ? `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}` : '',
          'https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities'
        ].filter(Boolean),
        explanation: `${title}: обновление до безопасной версии исправляет уязвимость`
      },
      estimatedTime: this.getFixTime(severity),
      difficulty: this.getFixDifficulty(packageName, severity)
    };
  }

  /**
   * Шаблон для множественных уязвимостей
   */
  static generateBulkAuditFix(vulnerabilities: any[]): SecurityRecommendation {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    
    return {
      id: 'npm-audit-bulk',
      title: `Множественные уязвимости npm (${vulnerabilities.length} issues)`,
      description: `Найдено ${vulnerabilities.length} уязвимостей в зависимостях`,
      severity: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium',
      category: 'dependencies',
      fixTemplate: {
        steps: [
          'Запустите автоматическое исправление',
          'Проверьте какие уязвимости остались',
          'Вручную обновите проблемные пакеты',
          'Рассмотрите альтернативные пакеты',
          'Запустите полное тестирование'
        ],
        commands: [
          'npm audit',
          'npm audit fix',
          'npm audit fix --force',
          'npm audit'
        ],
        codeExample: `// Приоритизация исправлений:
// 1. Критические (${criticalCount}): немедленно
// 2. Высокие (${highCount}): в течение дня  
// 3. Остальные: в течение недели

// Если npm audit fix не помогает:
npm outdated
npm update
npm audit`
      },
      documentation: {
        links: [
          'https://docs.npmjs.com/cli/v8/commands/npm-audit',
          'https://blog.npmjs.org/post/173719309445/npm-audit-identify-and-automatically-remediate'
        ],
        explanation: 'Множественные уязвимости требуют комплексного подхода'
      },
      estimatedTime: '1-3 часа',
      difficulty: 'medium'
    };
  }

  /**
   * Шаблон для устаревших пакетов
   */
  static generateOutdatedPackageFix(packageData: {
    name: string;
    current: string;
    wanted: string;
    latest: string;
    location: string;
  }): SecurityRecommendation {
    const { name, current, wanted, latest } = packageData;
    const majorUpdate = this.isMajorUpdate(current, latest);

    return {
      id: `outdated-${name}`,
      title: `Устаревший пакет: ${name}`,
      description: `${name} версии ${current} устарел (последняя: ${latest})`,
      severity: majorUpdate ? 'medium' : 'low',
      category: 'dependencies',
      fixTemplate: {
        steps: majorUpdate ? [
          'ВНИМАНИЕ: Major update может содержать breaking changes',
          'Изучите changelog и migration guide',
          'Обновите в отдельной ветке',
          'Тщательно протестируйте',
          'Исправьте breaking changes'
        ] : [
          'Обновите до latest версии',
          'Запустите тесты',
          'Проверьте функциональность'
        ],
        commands: majorUpdate ? [
          `npm view ${name} versions --json`,
          `npm install ${name}@${latest}`,
          'npm test',
          'npm audit'
        ] : [
          `npm update ${name}`,
          'npm test'
        ],
        beforeCode: `"${name}": "${current}"`,
        afterCode: `"${name}": "${latest}"`,
        codeExample: majorUpdate ? `// Major update ${current} → ${latest}:
// 1. Читайте CHANGELOG.md
// 2. Ищите breaking changes
// 3. Обновляйте код при необходимости
// 4. Тестируйте функциональность` : ''
      },
      documentation: {
        links: [
          `https://www.npmjs.com/package/${name}`,
          `https://github.com/search?q=${name}+changelog`,
          'https://semver.org/'
        ],
        explanation: majorUpdate 
          ? 'Major updates могут содержать breaking changes'
          : 'Minor/patch updates обычно безопасны'
      },
      estimatedTime: majorUpdate ? '2-4 часа' : '15-30 минут',
      difficulty: majorUpdate ? 'hard' : 'easy'
    };
  }

  /**
   * Возвращает специфичный fix для популярных пакетов
   */
  private static getPackageSpecificFix(packageName: string): string {
    const specificFixes: Record<string, string> = {
      'lodash': `// Lodash: используйте современные ES6+ методы
// Вместо: _.map(array, fn)
// Используйте: array.map(fn)`,
      
      'moment': `// Moment.js deprecated - переходите на:
npm install date-fns
// или
npm install dayjs`,
      
      'request': `// Request deprecated - используйте:
npm install axios
// или встроенный fetch API`,

      'node-sass': `// node-sass deprecated - используйте:
npm uninstall node-sass
npm install sass`,

      'mkdirp': `// mkdirp встроен в Node.js 10.12+:
// Вместо: mkdirp(dir)
// Используйте: fs.mkdirSync(dir, { recursive: true })`
    };

    return specificFixes[packageName] || `// Проверьте официальную документацию для ${packageName}`;
  }

  /**
   * Определяет время на исправление в зависимости от severity
   */
  private static getFixTime(severity: string): string {
    const timeMap: Record<string, string> = {
      'critical': '30 минут - 1 час',
      'high': '1-2 часа',
      'moderate': '2-4 часа',
      'low': '1 день'
    };
    return timeMap[severity] || '1-2 часа';
  }

  /**
   * Определяет сложность исправления
   */
  private static getFixDifficulty(packageName: string, severity: string): 'easy' | 'medium' | 'hard' {
    // Известные сложные пакеты
    const hardPackages = ['webpack', 'babel', 'typescript', 'eslint'];
    const deprecatedPackages = ['moment', 'request', 'node-sass'];
    
    if (deprecatedPackages.includes(packageName)) return 'hard';
    if (hardPackages.includes(packageName)) return 'medium';
    if (severity === 'critical') return 'medium';
    
    return 'easy';
  }

  /**
   * Проверяет является ли обновление major
   */
  private static isMajorUpdate(current: string, latest: string): boolean {
    const currentMajor = parseInt(current.split('.')[0]);
    const latestMajor = parseInt(latest.split('.')[0]);
    return latestMajor > currentMajor;
  }
}
